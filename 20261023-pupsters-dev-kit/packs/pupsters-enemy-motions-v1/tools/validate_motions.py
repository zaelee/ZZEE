#!/usr/bin/env python3
"""Validate the nine enemy motion exports across JSON, GLB, viewer, and Roblox XML."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import struct
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SCENES = ROOT / "scenes"
ANIMATIONS = ROOT / "animations"
VIEWER_DATA = ROOT / "viewer" / "motion-data.js"
ROBLOX = ROOT / "roblox"
REPORT = ROOT / "docs" / "motion-validation.json"
EXPECTED = (
    ("E01", "E01-block-bot.json"),
    ("E02", "E02-wheelie.json"),
    ("E03", "E03-brick-bruiser.json"),
    ("E04", "E04-shellback.json"),
    ("E05", "E05-split-stack.json"),
    ("E06", "E06-fix-it-bot.json"),
    ("E07", "E07-clear-crawler.json"),
    ("E08", "E08-carrier-cart.json"),
    ("B01", "B01-blockosaur.json"),
)
CLIPS = {
    "move": {"glb": "Move", "duration": 1.2, "frames": 37, "loop": True},
    "hit": {"glb": "Hit", "duration": 0.6, "frames": 19, "loop": False},
    "death": {"glb": "Death", "duration": 1.6, "frames": 49, "loop": False},
}
FPS = 30
EPS = 1e-6
GLB_EPS = 2e-5
GROUND_EPS = 2e-4
HIDDEN_SCALE = 1e-5
COMPONENTS = {
    5120: ("b", 1),
    5121: ("B", 1),
    5122: ("h", 2),
    5123: ("H", 2),
    5125: ("I", 4),
    5126: ("f", 4),
}
TYPE_WIDTH = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


class ValidationError(ValueError):
    pass


def fail(message: str) -> None:
    raise ValidationError(message)


def close(a: float, b: float, tolerance: float = EPS) -> bool:
    return abs(a - b) <= tolerance


def vector(value: Any, length: int, label: str, *, finite: bool = True) -> list[float]:
    if not isinstance(value, list) or len(value) != length:
        fail(f"{label}: expected {length} numbers")
    result = []
    for index, item in enumerate(value):
        if isinstance(item, bool) or not isinstance(item, (int, float)):
            fail(f"{label}[{index}]: expected number")
        number = float(item)
        if finite and not math.isfinite(number):
            fail(f"{label}[{index}]: expected finite number")
        result.append(number)
    return result


def assert_vectors(actual: list[float], expected: list[float], label: str, tolerance: float = EPS) -> None:
    if len(actual) != len(expected) or max((abs(a - b) for a, b in zip(actual, expected)), default=0.0) > tolerance:
        fail(f"{label}: differs (actual={actual!r}, expected={expected!r})")


def quat_dot(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


def quat_rotate(q: list[float], v: list[float]) -> list[float]:
    x, y, z, w = q
    vx, vy, vz = v
    tx, ty, tz = 2 * (y * vz - z * vy), 2 * (z * vx - x * vz), 2 * (x * vy - y * vx)
    return [
        vx + w * tx + y * tz - z * ty,
        vy + w * ty + z * tx - x * tz,
        vz + w * tz + x * ty - y * tx,
    ]


def quat_multiply(a: list[float], b: list[float]) -> list[float]:
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return [
        aw * bx + ax * bw + ay * bz - az * by,
        aw * by - ax * bz + ay * bw + az * bx,
        aw * bz + ax * by - ay * bx + az * bw,
        aw * bw - ax * bx - ay * by - az * bz,
    ]


def euler_quaternion(rotation: list[float]) -> list[float]:
    """Quaternion for the source convention R=Rx*Ry*Rz."""
    x, y, z = (component / 2 for component in rotation)
    qx = [math.sin(x), 0.0, 0.0, math.cos(x)]
    qy = [0.0, math.sin(y), 0.0, math.cos(y)]
    qz = [0.0, 0.0, math.sin(z), math.cos(z)]
    return quat_multiply(quat_multiply(qx, qy), qz)


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"missing file: {path.relative_to(ROOT).as_posix()}")
    except (OSError, json.JSONDecodeError) as exc:
        fail(f"cannot read {path.relative_to(ROOT).as_posix()}: {exc}")


def load_scenes() -> dict[str, dict[str, Any]]:
    scenes = {}
    for expected_id, filename in EXPECTED:
        scene = load_json(SCENES / filename)
        if not isinstance(scene, dict) or scene.get("id") != expected_id:
            fail(f"scenes/{filename}: expected id {expected_id}")
        if not isinstance(scene.get("name"), str) or not isinstance(scene.get("displayName"), str):
            fail(f"scenes/{filename}: missing name/displayName")
        materials = scene.get("materials")
        parts = scene.get("parts")
        if not isinstance(materials, dict) or not isinstance(parts, list) or not parts:
            fail(f"scenes/{filename}: missing materials/parts")
        for material_name, material in materials.items():
            if not isinstance(material_name, str) or not isinstance(material, dict):
                fail(f"scenes/{filename}: malformed material")
            color = vector(material.get("color"), 3, f"scenes/{filename}.materials.{material_name}.color")
            opacity = material.get("opacity", 1.0)
            if isinstance(opacity, bool) or not isinstance(opacity, (int, float)) or not math.isfinite(opacity):
                fail(f"scenes/{filename}.materials.{material_name}.opacity: expected finite number")
            if any(not 0 <= component <= 1 for component in color) or not 0 <= opacity <= 1:
                fail(f"scenes/{filename}.materials.{material_name}: color/opacity must be in 0..1")
        names = set()
        for index, part in enumerate(parts):
            label = f"scenes/{filename}.parts[{index}]"
            if not isinstance(part, dict) or not isinstance(part.get("name"), str) or part["name"] in names:
                fail(f"{label}: invalid or duplicate part name")
            names.add(part["name"])
            if part.get("type") not in {"box", "sphere"}:
                fail(f"{label}: unsupported type {part.get('type')!r}")
            vector(part.get("size"), 3, f"{label}.size")
            vector(part.get("position"), 3, f"{label}.position")
            vector(part.get("rotation"), 3, f"{label}.rotation")
            if any(component <= 0 for component in part["size"]):
                fail(f"{label}.size: expected positive values")
            if part.get("material") not in materials:
                fail(f"{label}: unknown material")
        scenes[expected_id] = scene
    return scenes


def expected_geometry(source_part: dict[str, Any]) -> tuple[list[list[float]], list[list[int]]]:
    size = source_part["size"]
    if source_part["type"] == "box":
        vertices = [[x * size[0] / 2, y * size[1] / 2, z * size[2] / 2] for x, y, z in (
            (-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1),
            (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1),
        )]
        faces = [[0, 2, 1], [0, 3, 2], [4, 5, 6], [4, 6, 7], [0, 1, 5], [0, 5, 4],
                 [3, 7, 6], [3, 6, 2], [0, 4, 7], [0, 7, 3], [1, 2, 6], [1, 6, 5]]
        return orient_faces(vertices, faces)
    columns = 16 if max(size) > 0.65 else 12
    rows = 10 if max(size) > 0.65 else 8
    vertices = [[0.0, -size[1] / 2, 0.0]]
    for row in range(1, rows):
        latitude = -math.pi / 2 + math.pi * row / rows
        for column in range(columns):
            longitude = 2 * math.pi * column / columns
            vertices.append([
                size[0] / 2 * math.cos(latitude) * math.cos(longitude),
                size[1] / 2 * math.sin(latitude),
                size[2] / 2 * math.cos(latitude) * math.sin(longitude),
            ])
    top = len(vertices)
    vertices.append([0.0, size[1] / 2, 0.0])
    faces = []
    for column in range(columns):
        faces.append([0, 1 + (column + 1) % columns, 1 + column])
    for row in range(rows - 2):
        for column in range(columns):
            a = 1 + row * columns + column
            b = 1 + row * columns + (column + 1) % columns
            c, d = a + columns, b + columns
            faces.extend([[a, b, d], [a, d, c]])
    for column in range(columns):
        faces.append([top, 1 + (rows - 2) * columns + column, 1 + (rows - 2) * columns + (column + 1) % columns])
    return orient_faces(vertices, faces)


def orient_faces(vertices: list[list[float]], faces: list[list[int]]) -> tuple[list[list[float]], list[list[int]]]:
    signed = 0.0
    for ia, ib, ic in faces:
        a, b, c = vertices[ia], vertices[ib], vertices[ic]
        cross = [b[1] * c[2] - b[2] * c[1], b[2] * c[0] - b[0] * c[2], b[0] * c[1] - b[1] * c[0]]
        signed += sum(a[axis] * cross[axis] for axis in range(3))
    if signed < 0:
        faces = [[face[0], face[2], face[1]] for face in faces]
    return vertices, faces


def parse_transform(value: Any, label: str) -> dict[str, Any]:
    row = vector(value, 11, label)
    visible_value = row[10]
    if visible_value not in (0.0, 1.0):
        fail(f"{label}[10]: visibility must be 0 or 1")
    return {"position": row[0:3], "quaternion": row[3:7], "scale": row[7:10], "visible": bool(visible_value), "row": row}


def validate_part_geometry(part: dict[str, Any], source_part: dict[str, Any], material: dict[str, Any], label: str) -> None:
    for key in ("name", "group", "type"):
        if part.get(key) != source_part.get(key):
            fail(f"{label}.{key}: differs from source")
    assert_vectors(vector(part.get("size"), 3, f"{label}.size"), list(map(float, source_part["size"])), f"{label}.size")
    assert_vectors(vector(part.get("position"), 3, f"{label}.position"), list(map(float, source_part["position"])), f"{label}.position")
    expected_quaternion = euler_quaternion(source_part["rotation"])
    quaternion = vector(part.get("quaternion"), 4, f"{label}.quaternion")
    if abs(abs(quat_dot(quaternion, expected_quaternion)) - 1) > EPS:
        fail(f"{label}.quaternion: differs from source rotation")
    expected_color = vector(material.get("color"), 3, f"{label}.sourceColor")
    assert_vectors(vector(part.get("color"), 3, f"{label}.color"), expected_color, f"{label}.color")
    expected_opacity = float(material.get("opacity", 1.0))
    opacity = part.get("opacity")
    if isinstance(opacity, bool) or not isinstance(opacity, (int, float)) or not close(float(opacity), expected_opacity):
        fail(f"{label}.opacity: differs from source")
    vertices_raw, faces_raw = part.get("vertices"), part.get("faces")
    if not isinstance(vertices_raw, list) or not isinstance(faces_raw, list):
        fail(f"{label}: missing vertices/faces")
    vertices = [vector(vertex, 3, f"{label}.vertices[{i}]") for i, vertex in enumerate(vertices_raw)]
    faces = []
    for index, face in enumerate(faces_raw):
        if not isinstance(face, list) or len(face) != 3 or any(isinstance(i, bool) or not isinstance(i, int) for i in face):
            fail(f"{label}.faces[{index}]: expected three integer indices")
        if any(i < 0 or i >= len(vertices) for i in face):
            fail(f"{label}.faces[{index}]: index out of range")
        faces.append(face)
    expected_vertices, expected_faces = expected_geometry(source_part)
    if len(vertices) != len(expected_vertices) or len(faces) != len(expected_faces):
        fail(f"{label}: geometry count differs from source")
    for index, (actual, expected) in enumerate(zip(vertices, expected_vertices)):
        assert_vectors(actual, expected, f"{label}.vertices[{index}]")
    if faces != expected_faces:
        fail(f"{label}.faces: topology/winding differs from source")


def is_rest(transform: dict[str, Any], part: dict[str, Any], *, exact: bool) -> bool:
    if exact:
        return transform["row"] == [*part["position"], *part["quaternion"], 1.0, 1.0, 1.0, 1.0]
    position_ok = max(abs(a - b) for a, b in zip(transform["position"], part["position"])) <= EPS
    quaternion_ok = abs(abs(quat_dot(transform["quaternion"], part["quaternion"])) - 1.0) <= EPS
    scale_ok = max(abs(value - 1.0) for value in transform["scale"]) <= EPS
    return position_ok and quaternion_ok and scale_ok and transform["visible"]


def transformed_min_y(part: dict[str, Any], transform: dict[str, Any]) -> float:
    minimum = math.inf
    for vertex in part["vertices"]:
        scaled = [vertex[axis] * transform["scale"][axis] for axis in range(3)]
        rotated = quat_rotate(transform["quaternion"], scaled)
        minimum = min(minimum, rotated[1] + transform["position"][1])
    return minimum


def validate_motion_json(raw: Any, scene: dict[str, Any], model_id: str) -> dict[str, Any]:
    label = f"animations/{model_id}.json"
    if not isinstance(raw, dict):
        fail(f"{label}: root must be an object")
    for key in ("id", "name", "displayName"):
        if raw.get(key) != scene.get(key):
            fail(f"{label}.{key}: differs from source")
    parts = raw.get("parts")
    if not isinstance(parts, list) or len(parts) != len(scene["parts"]):
        fail(f"{label}.parts: count differs from source")
    source_materials = scene["materials"]
    for index, (part, source_part) in enumerate(zip(parts, scene["parts"])):
        if not isinstance(part, dict):
            fail(f"{label}.parts[{index}]: expected object")
        validate_part_geometry(part, source_part, source_materials[source_part["material"]], f"{label}.parts[{index}]")
    names = [part["name"] for part in parts]
    if len(names) != len(set(names)):
        fail(f"{label}.parts: duplicate names")

    clips = raw.get("clips")
    if not isinstance(clips, dict) or set(clips) != set(CLIPS):
        fail(f"{label}.clips: expected exactly move, hit, death")
    signatures = {}
    minimum_ground = math.inf
    max_motion = 0.0
    for clip_key, spec in CLIPS.items():
        clip = clips[clip_key]
        clip_label = f"{label}.clips.{clip_key}"
        if not isinstance(clip, dict):
            fail(f"{clip_label}: expected object")
        for text_key in ("name", "description"):
            text = clip.get(text_key)
            if not isinstance(text, str) or not text.strip():
                fail(f"{clip_label}.{text_key}: expected non-empty string")
        if not re.search(r"[\uac00-\ud7a3]", clip["name"] + clip["description"]):
            fail(f"{clip_label}: Korean name/description is required")
        if not close(float(clip.get("duration", -1)), spec["duration"]):
            fail(f"{clip_label}.duration: expected {spec['duration']}")
        if clip.get("fps") != FPS or clip.get("loop") is not spec["loop"]:
            fail(f"{clip_label}: fps/loop differs")
        frames = clip.get("frames")
        if not isinstance(frames, list) or len(frames) != spec["frames"]:
            fail(f"{clip_label}.frames: expected {spec['frames']} frames")
        previous_quaternions = None
        parsed_frames = []
        for frame_index, frame in enumerate(frames):
            frame_label = f"{clip_label}.frames[{frame_index}]"
            if not isinstance(frame, dict) or not close(float(frame.get("time", -1)), frame_index / FPS):
                fail(f"{frame_label}.time: expected {frame_index / FPS}")
            transforms = frame.get("transforms")
            if not isinstance(transforms, list) or len(transforms) != len(parts):
                fail(f"{frame_label}.transforms: expected {len(parts)} rows")
            parsed = [parse_transform(row, f"{frame_label}.transforms[{i}]") for i, row in enumerate(transforms)]
            for part_index, transform in enumerate(parsed):
                norm = math.sqrt(quat_dot(transform["quaternion"], transform["quaternion"]))
                if abs(norm - 1.0) > EPS:
                    fail(f"{frame_label}.transforms[{part_index}]: quaternion norm {norm}")
                if previous_quaternions is not None and quat_dot(previous_quaternions[part_index], transform["quaternion"]) < -EPS:
                    fail(f"{frame_label}.transforms[{part_index}]: quaternion sign discontinuity")
                if any(scale <= 0 for scale in transform["scale"]):
                    fail(f"{frame_label}.transforms[{part_index}]: scale must remain positive")
                if transform["visible"]:
                    part_minimum = transformed_min_y(parts[part_index], transform)
                    minimum_ground = min(minimum_ground, part_minimum)
                    if part_minimum < -GROUND_EPS:
                        fail(f"{frame_label}.transforms[{part_index}]: visible geometry penetrates ground")
            previous_quaternions = [transform["quaternion"] for transform in parsed]
            parsed_frames.append(parsed)
        if not all(is_rest(transform, part, exact=True) for transform, part in zip(parsed_frames[0], parts)):
            fail(f"{clip_label}: first frame is not the exact rest pose")
        if clip_key in {"move", "hit"} and not all(is_rest(transform, part, exact=False) for transform, part in zip(parsed_frames[-1], parts)):
            fail(f"{clip_label}: final frame must return to rest")
        if clip_key == "death" and any(transform["visible"] for transform in parsed_frames[-1]):
            fail(f"{clip_label}: final frame must hide every part")
        signature = []
        clip_motion = 0.0
        for frame in parsed_frames:
            flat = []
            for transform, part in zip(frame, parts):
                flat.extend(transform["row"])
                clip_motion = max(clip_motion, max(abs(a - b) for a, b in zip(transform["position"], part["position"])))
                clip_motion = max(clip_motion, 1 - abs(quat_dot(transform["quaternion"], part["quaternion"])))
                clip_motion = max(clip_motion, max(abs(value - 1) for value in transform["scale"]))
            signature.append(flat)
        if clip_motion <= 1e-4:
            fail(f"{clip_label}: clip is static")
        signatures[clip_key] = signature
        max_motion = max(max_motion, clip_motion)
    for left, right in (("move", "hit"), ("move", "death"), ("hit", "death")):
        common = min(len(signatures[left]), len(signatures[right]))
        if all(signatures[left][i] == signatures[right][i] for i in range(common)):
            fail(f"{label}: {left} and {right} do not contain distinct motion")
    return {"parts": len(parts), "frames": sum(spec["frames"] for spec in CLIPS.values()), "minimumGroundY": minimum_ground, "maxMotion": max_motion}


def parse_glb(path: Path) -> tuple[dict[str, Any], bytes]:
    try:
        data = path.read_bytes()
    except FileNotFoundError:
        fail(f"missing file: {path.relative_to(ROOT).as_posix()}")
    if len(data) < 20 or data[:4] != b"glTF" or struct.unpack_from("<I", data, 4)[0] != 2:
        fail(f"{path.name}: invalid GLB header")
    declared = struct.unpack_from("<I", data, 8)[0]
    if declared != len(data):
        fail(f"{path.name}: declared length differs")
    offset, document, binary = 12, None, None
    while offset < len(data):
        if offset + 8 > len(data):
            fail(f"{path.name}: truncated chunk header")
        length, kind = struct.unpack_from("<I4s", data, offset)
        offset += 8
        payload = data[offset:offset + length]
        if len(payload) != length:
            fail(f"{path.name}: truncated chunk")
        offset += length
        if kind == b"JSON":
            document = json.loads(payload.decode("utf-8").rstrip(" \0"))
        elif kind == b"BIN\0":
            binary = payload
    if not isinstance(document, dict) or binary is None:
        fail(f"{path.name}: missing JSON or BIN chunk")
    return document, binary


def decode_accessor(doc: dict[str, Any], binary: bytes, index: int) -> list[Any]:
    try:
        accessor = doc["accessors"][index]
        view = doc["bufferViews"][accessor["bufferView"]]
        fmt, width = COMPONENTS[accessor["componentType"]]
        columns = TYPE_WIDTH[accessor["type"]]
        count = accessor["count"]
    except (KeyError, IndexError, TypeError) as exc:
        fail(f"GLB accessor {index}: malformed ({exc})")
    if accessor.get("sparse") is not None or accessor.get("normalized"):
        fail(f"GLB accessor {index}: sparse/normalized accessors are unsupported")
    element_size = width * columns
    stride = view.get("byteStride", element_size)
    if stride < element_size:
        fail(f"GLB accessor {index}: invalid stride")
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    values = []
    for row in range(count):
        offset = start + row * stride
        if offset + element_size > len(binary):
            fail(f"GLB accessor {index}: reads beyond BIN chunk")
        unpacked = list(struct.unpack_from("<" + fmt * columns, binary, offset))
        values.append(unpacked[0] if columns == 1 else unpacked)
    return values


def node_local_transform(node: dict[str, Any]) -> tuple[list[float], list[float], list[float]]:
    if "matrix" in node:
        fail(f"GLB node {node.get('name')!r}: matrix transforms are not allowed")
    return (
        list(map(float, node.get("translation", [0, 0, 0]))),
        list(map(float, node.get("rotation", [0, 0, 0, 1]))),
        list(map(float, node.get("scale", [1, 1, 1]))),
    )


def validate_glb(doc: dict[str, Any], binary: bytes, motion: dict[str, Any], model_id: str) -> dict[str, Any]:
    label = f"animations/{model_id}-motions.glb"
    if doc.get("asset", {}).get("version") != "2.0":
        fail(f"{label}: asset version must be 2.0")
    nodes = doc.get("nodes")
    meshes = doc.get("meshes")
    materials = doc.get("materials")
    animations = doc.get("animations")
    if not all(isinstance(value, list) for value in (nodes, meshes, materials, animations)):
        fail(f"{label}: missing nodes/meshes/materials/animations")
    node_names = [node.get("name") for node in nodes]
    if len([name for name in node_names if name is not None]) != len(set(name for name in node_names if name is not None)):
        fail(f"{label}: node names must be unique")
    part_nodes = {}
    for part in motion["parts"]:
        matches = [index for index, name in enumerate(node_names) if name == part["name"]]
        if len(matches) != 1:
            fail(f"{label}: expected one node named {part['name']}")
        part_nodes[part["name"]] = matches[0]
    scene_index = doc.get("scene")
    scenes = doc.get("scenes")
    if not isinstance(scene_index, int) or not isinstance(scenes, list) or not 0 <= scene_index < len(scenes):
        fail(f"{label}: invalid default scene")
    scene_roots = scenes[scene_index].get("nodes")
    if not isinstance(scene_roots, list) or len(scene_roots) != 1:
        fail(f"{label}: expected one scene root")
    root_index = scene_roots[0]
    if not isinstance(root_index, int) or not 0 <= root_index < len(nodes) or nodes[root_index].get("name") != motion["displayName"]:
        fail(f"{label}: scene root differs")
    root_translation, root_rotation, root_scale = node_local_transform(nodes[root_index])
    assert_vectors(root_translation, [0, 0, 0], f"{label}.root.translation", GLB_EPS)
    if abs(abs(quat_dot(root_rotation, [0, 0, 0, 1])) - 1) > GLB_EPS:
        fail(f"{label}.root.rotation differs")
    assert_vectors(root_scale, [1, 1, 1], f"{label}.root.scale", GLB_EPS)
    if set(nodes[root_index].get("children", [])) != set(part_nodes.values()):
        fail(f"{label}: every part must be a direct child of the identity scene root")
    # Each part is an independently animated mesh node; its local geometry must match JSON.
    for part in motion["parts"]:
        node_index = part_nodes[part["name"]]
        node = nodes[node_index]
        mesh_index = node.get("mesh")
        if not isinstance(mesh_index, int) or not 0 <= mesh_index < len(meshes):
            fail(f"{label}.{part['name']}: missing mesh")
        primitives = meshes[mesh_index].get("primitives")
        if not isinstance(primitives, list) or len(primitives) != 1:
            fail(f"{label}.{part['name']}: expected one mesh primitive")
        primitive = primitives[0]
        try:
            positions = decode_accessor(doc, binary, primitive["attributes"]["POSITION"])
            indices = decode_accessor(doc, binary, primitive["indices"])
        except KeyError:
            fail(f"{label}.{part['name']}: missing POSITION or indices")
        expected_positions = [part["vertices"][index] for face in part["faces"] for index in face]
        if [int(value) for value in indices] != list(range(len(expected_positions))):
            fail(f"{label}.{part['name']}: GLB expanded indices differ")
        if len(positions) != len(expected_positions):
            fail(f"{label}.{part['name']}: GLB expanded vertex count differs")
        for index, (actual, expected) in enumerate(zip(positions, expected_positions)):
            assert_vectors(list(map(float, actual)), expected, f"{label}.{part['name']}.POSITION[{index}]", GLB_EPS)
        translation, rotation, scale = node_local_transform(node)
        assert_vectors(translation, part["position"], f"{label}.{part['name']}.translation", GLB_EPS)
        if abs(abs(quat_dot(rotation, part["quaternion"])) - 1) > GLB_EPS:
            fail(f"{label}.{part['name']}.rotation differs from JSON")
        assert_vectors(scale, [1, 1, 1], f"{label}.{part['name']}.scale", GLB_EPS)
        material_index = primitive.get("material")
        if not isinstance(material_index, int) or not 0 <= material_index < len(materials):
            fail(f"{label}.{part['name']}: missing material")
        factor = materials[material_index].get("pbrMetallicRoughness", {}).get("baseColorFactor")
        if not isinstance(factor, list) or len(factor) != 4:
            fail(f"{label}.{part['name']}: missing baseColorFactor")
        if not close(float(factor[3]), float(part["opacity"]), GLB_EPS):
            fail(f"{label}.{part['name']}: material alpha differs")
        expected_mode = "BLEND" if part["opacity"] < 1 else "OPAQUE"
        if materials[material_index].get("alphaMode", "OPAQUE") != expected_mode:
            fail(f"{label}.{part['name']}: alphaMode differs")

    animation_names = [animation.get("name") for animation in animations]
    if animation_names != [spec["glb"] for spec in CLIPS.values()]:
        fail(f"{label}: animations must be ordered Move, Hit, Death")
    for (clip_key, spec), animation in zip(CLIPS.items(), animations):
        channels = animation.get("channels")
        samplers = animation.get("samplers")
        if not isinstance(channels, list) or not isinstance(samplers, list):
            fail(f"{label}.{spec['glb']}: missing channels/samplers")
        expected_targets = {(node_index, path) for node_index in part_nodes.values() for path in ("translation", "rotation", "scale")}
        actual_targets = set()
        for channel in channels:
            target = channel.get("target", {})
            target_key = (target.get("node"), target.get("path"))
            if target_key in actual_targets:
                fail(f"{label}.{spec['glb']}: duplicate channel {target_key}")
            actual_targets.add(target_key)
            sampler_index = channel.get("sampler")
            if not isinstance(sampler_index, int) or not 0 <= sampler_index < len(samplers):
                fail(f"{label}.{spec['glb']}: invalid sampler")
            sampler = samplers[sampler_index]
            if sampler.get("interpolation", "LINEAR") != "LINEAR":
                fail(f"{label}.{spec['glb']}: interpolation must be LINEAR")
            times = decode_accessor(doc, binary, sampler["input"])
            expected_times = [frame["time"] for frame in motion["clips"][clip_key]["frames"]]
            if len(times) != len(expected_times) or max(abs(float(a) - b) for a, b in zip(times, expected_times)) > GLB_EPS:
                fail(f"{label}.{spec['glb']}: key times differ from JSON")
            outputs = decode_accessor(doc, binary, sampler["output"])
            if len(outputs) != len(expected_times):
                fail(f"{label}.{spec['glb']}: output count differs")
            if target_key[0] not in part_nodes.values() or target_key[1] not in {"translation", "rotation", "scale"}:
                fail(f"{label}.{spec['glb']}: unexpected animation target {target_key}")
            part_index = list(part_nodes.values()).index(target_key[0])
            for frame_index, (actual, frame) in enumerate(zip(outputs, motion["clips"][clip_key]["frames"])):
                transform = parse_transform(frame["transforms"][part_index], "internal")
                if target_key[1] == "translation":
                    expected = transform["position"]
                    assert_vectors(list(map(float, actual)), expected, f"{label}.{spec['glb']}.translation[{frame_index}]", GLB_EPS)
                elif target_key[1] == "rotation":
                    if abs(abs(quat_dot(list(map(float, actual)), transform["quaternion"])) - 1) > GLB_EPS:
                        fail(f"{label}.{spec['glb']}.rotation[{frame_index}]: differs from JSON")
                else:
                    visibility = 1.0 if transform["visible"] else HIDDEN_SCALE
                    expected = [value * visibility for value in transform["scale"]]
                    assert_vectors(list(map(float, actual)), expected, f"{label}.{spec['glb']}.scale[{frame_index}]", GLB_EPS)
        if actual_targets != expected_targets:
            missing = sorted(expected_targets - actual_targets)
            extra = sorted(actual_targets - expected_targets)
            fail(f"{label}.{spec['glb']}: channel coverage differs (missing={missing}, extra={extra})")
    return {"nodes": len(nodes), "meshes": len(meshes), "animations": animation_names, "channelsPerClip": len(motion["parts"]) * 3}


def load_viewer_payload(path: Path) -> Any:
    try:
        text = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        fail(f"missing file: {path.relative_to(ROOT).as_posix()}")
    # The viewer file is data-only: accept a plain JSON object or one JS assignment.
    stripped = text.strip()
    if stripped.startswith("{"):
        payload = stripped.rstrip(";")
    else:
        match = re.fullmatch(r"(?:window\.)?[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)?\s*=\s*({.*})\s*;?", stripped, re.DOTALL)
        if not match:
            fail("viewer/motion-data.js: expected one data assignment")
        payload = match.group(1)
    try:
        return json.loads(payload)
    except json.JSONDecodeError as exc:
        fail(f"viewer/motion-data.js: payload is not JSON ({exc})")


def canonical(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def xml_properties(item: ET.Element) -> dict[str, ET.Element]:
    properties = item.find("Properties")
    return {} if properties is None else {child.attrib.get("name", ""): child for child in properties}


def xml_name(item: ET.Element) -> str:
    element = xml_properties(item).get("Name")
    return "" if element is None or element.text is None else element.text


def extract_lua_table(text: str, start: int, label: str) -> tuple[str, int]:
    opening = text.find("{", start)
    if opening < 0:
        fail(f"{label}: missing table")
    depth = 0
    for index in range(opening, len(text)):
        if text[index] == "{":
            depth += 1
        elif text[index] == "}":
            depth -= 1
            if depth == 0:
                return text[opening:index + 1], index + 1
    fail(f"{label}: unterminated table")


def parse_numeric_lua_table(text: str, label: str) -> Any:
    if re.search(r"[^0-9eE+\-.,{}\s]", text):
        fail(f"{label}: contains non-numeric Lua syntax")
    try:
        converted = text.replace("{", "[").replace("}", "]")
        converted = re.sub(r",\s*([\]])", r"\1", converted)
        return json.loads(converted)
    except json.JSONDecodeError as exc:
        fail(f"{label}: malformed numeric table ({exc})")


def normalized_native_motion(motion: dict[str, Any]) -> dict[str, Any]:
    parts = []
    for part in motion["parts"]:
        parts.append({
            "name": part["name"], "group": part["group"], "type": part["type"],
            "size": list(map(float, part["size"])), "position": list(map(float, part["position"])),
            "quaternion": list(map(float, part["quaternion"])), "color": list(map(float, part["color"])),
            "opacity": float(part["opacity"]), "vertices": part["vertices"], "faces": part["faces"],
        })
    clips = {}
    for key in CLIPS:
        source = motion["clips"][key]
        clips[key] = {
            "name": source["name"], "description": source["description"],
            "duration": float(source["duration"]), "fps": float(source["fps"]), "loop": source["loop"],
            "frames": [{"time": float(frame["time"]), "transforms": [list(map(float, row)) for row in frame["transforms"]]} for frame in source["frames"]],
        }
    return {"id": motion["id"], "name": motion["name"], "displayName": motion["displayName"], "parts": parts, "clips": clips}


def validate_roblox_script(element: ET.Element, path: Path, motion: dict[str, Any]) -> dict[str, Any]:
    properties = xml_properties(element)
    source = properties.get("Source")
    if source is None or source.text is None:
        fail(f"{path.name}: animation script has no Source")
    text = source.text
    digest_match = re.search(r"^-- MotionDataSHA256: ([0-9a-f]{64})$", text, re.MULTILINE)
    if not digest_match:
        fail(f"{path.name}: missing motion digest")
    normalized = normalized_native_motion(motion)
    digest = hashlib.sha256(canonical(normalized).encode("utf-8")).hexdigest()
    if digest_match.group(1) != digest:
        fail(f"{path.name}: motion digest differs from JSON")
    names_match = re.search(r"^local names = (\{[^\r\n]+\})$", text, re.MULTILINE)
    if not names_match:
        fail(f"{path.name}: missing part names table")
    try:
        names = json.loads(names_match.group(1).replace("{", "[").replace("}", "]"))
    except json.JSONDecodeError as exc:
        fail(f"{path.name}: invalid part names table ({exc})")
    if names != [part["name"] for part in motion["parts"]]:
        fail(f"{path.name}: script part order differs from JSON")
    size_match = re.search(r"^local baseSizes = \{(.+)\}$", text, re.MULTILINE)
    opacity_match = re.search(r"^local baseOpacities = (\{[^\r\n]+\})$", text, re.MULTILINE)
    if not size_match or not opacity_match:
        fail(f"{path.name}: missing base size/opacity tables")
    sizes = [[float(value) for value in group.split(",")] for group in re.findall(r"Vector3\.new\(([^)]+)\)", size_match.group(1))]
    opacities = parse_numeric_lua_table(opacity_match.group(1), f"{path.name}.baseOpacities")
    if sizes != [part["size"] for part in motion["parts"]] or opacities != [part["opacity"] for part in motion["parts"]]:
        fail(f"{path.name}: script base sizes/opacities differ from JSON")
    clip_counts = {}
    search_from = text.find("local clips =")
    for key in CLIPS:
        match = re.search(rf"\b{key}\s*=\s*\{{duration=([-+0-9.eE]+),\s*looped=(true|false),\s*frames=", text[search_from:])
        if not match:
            fail(f"{path.name}: missing {key} clip table")
        absolute = search_from + match.end()
        table, end = extract_lua_table(text, absolute, f"{path.name}.{key}.frames")
        frames = parse_numeric_lua_table(table, f"{path.name}.{key}.frames")
        clip = motion["clips"][key]
        expected = [[frame["time"], frame["transforms"]] for frame in clip["frames"]]
        if float(match.group(1)) != clip["duration"] or (match.group(2) == "true") is not clip["loop"] or frames != expected:
            fail(f"{path.name}: embedded {key} frames differ from JSON")
        clip_counts[key] = len(frames)
        search_from = end
    return {"digest": digest, "clips": clip_counts}


def validate_roblox(path: Path, motion: dict[str, Any], model_id: str) -> dict[str, Any]:
    try:
        root = ET.parse(path).getroot()
    except FileNotFoundError:
        fail(f"missing file: {path.relative_to(ROOT).as_posix()}")
    except (OSError, ET.ParseError) as exc:
        fail(f"{path.name}: invalid XML ({exc})")
    if root.tag != "roblox" or root.attrib.get("version") != "4":
        fail(f"{path.name}: invalid Roblox XML root")
    items = root.findall(".//Item")
    referents = [item.attrib.get("referent") for item in items]
    if not referents or None in referents or len(referents) != len(set(referents)):
        fail(f"{path.name}: item referents must be present and unique")
    top = root.findall("./Item")
    if len(top) != 1 or top[0].attrib.get("class") != "Model":
        fail(f"{path.name}: expected one top-level Model")
    root_name = xml_name(top[0])
    if root_name != motion["displayName"]:
        fail(f"{path.name}: unexpected root model name {root_name!r}")
    all_parts = [item for item in items if item.attrib.get("class") in {"Part", "MeshPart"}]
    roots = [item for item in all_parts if xml_name(item) == "MotionRoot"]
    if len(roots) != 1:
        fail(f"{path.name}: expected one MotionRoot")
    parts = [item for item in all_parts if xml_name(item) != "MotionRoot"]
    names = [xml_name(item) for item in parts]
    expected_names = [part["name"] for part in motion["parts"]]
    if sorted(names) != sorted(expected_names) or len(names) != len(set(names)):
        fail(f"{path.name}: BasePart names/count differ from JSON")
    for item in parts:
        part = motion["parts"][expected_names.index(xml_name(item))]
        props = xml_properties(item)
        transparency = props.get("Transparency")
        if transparency is None or transparency.text is None or not close(float(transparency.text), 1 - float(part["opacity"]), GLB_EPS):
            fail(f"{path.name}.{part['name']}: transparency differs")
    scripts = [item for item in items if item.attrib.get("class") in {"Script", "LocalScript", "ModuleScript"}]
    if len(scripts) != 1:
        fail(f"{path.name}: expected one animation script/module")
    script_result = validate_roblox_script(scripts[0], path, motion)
    return {"root": root_name, "baseParts": len(parts), "motionRoot": True, "scriptClass": scripts[0].attrib.get("class"), "script": xml_name(scripts[0]), **script_result}


def find_roblox_path(model_id: str) -> Path:
    exact = ROBLOX / f"{model_id}-motions.rbxmx"
    if exact.is_file():
        return exact
    matches = sorted(ROBLOX.glob(f"{model_id}*motions*.rbxmx")) if ROBLOX.is_dir() else []
    if len(matches) == 1:
        return matches[0]
    return exact


def validate_demo(scenes: dict[str, dict[str, Any]]) -> dict[str, Any]:
    candidates = sorted(ROBLOX.glob("*Demo*.rbxmx")) if ROBLOX.is_dir() else []
    if len(candidates) != 1:
        fail(f"roblox: expected exactly one Demo RBXMX, found {len(candidates)}")
    path = candidates[0]
    try:
        root = ET.parse(path).getroot()
    except ET.ParseError as exc:
        fail(f"{path.name}: invalid XML ({exc})")
    if root.tag != "roblox" or root.attrib.get("version") != "4":
        fail(f"{path.name}: invalid Roblox XML root")
    items = root.findall(".//Item")
    referents = [item.attrib.get("referent") for item in items]
    if not referents or None in referents or len(referents) != len(set(referents)):
        fail(f"{path.name}: item referents must be present and unique")
    top = root.findall("./Item")
    if len(top) != 1 or top[0].attrib.get("class") != "Model" or xml_name(top[0]) != "Pupsters_Enemy_Motions_Demo":
        fail(f"{path.name}: unexpected demo root")
    models = top[0].findall("./Item[@class='Model']")
    names = [xml_name(model) for model in models]
    expected_names = [scene["displayName"] for scene in scenes.values()]
    if len(names) != len(set(names)) or set(names) != set(expected_names):
        fail(f"{path.name}: demo model names/count differ")
    return {"file": path.relative_to(ROOT).as_posix(), "models": len(scenes)}


def run() -> dict[str, Any]:
    scenes = load_scenes()
    viewer = load_viewer_payload(VIEWER_DATA)
    if isinstance(viewer, dict) and "models" in viewer:
        viewer_models = viewer["models"]
    else:
        viewer_models = viewer
    results = {}
    total_parts = 0
    for model_id, _ in EXPECTED:
        motion_path = ANIMATIONS / f"{model_id}.json"
        motion = load_json(motion_path)
        json_result = validate_motion_json(motion, scenes[model_id], model_id)
        if isinstance(viewer_models, list):
            matches = [item for item in viewer_models if isinstance(item, dict) and item.get("id") == model_id]
            if len(matches) != 1 or canonical(matches[0]) != canonical(motion):
                fail(f"viewer/motion-data.js: {model_id} differs from animations/{model_id}.json")
        elif isinstance(viewer_models, dict):
            if model_id not in viewer_models or canonical(viewer_models[model_id]) != canonical(motion):
                fail(f"viewer/motion-data.js: {model_id} differs from animations/{model_id}.json")
        else:
            fail("viewer/motion-data.js: expected a model list or id map")
        glb_doc, glb_binary = parse_glb(ANIMATIONS / f"{model_id}-motions.glb")
        glb_result = validate_glb(glb_doc, glb_binary, motion, model_id)
        roblox_path = find_roblox_path(model_id)
        roblox_result = validate_roblox(roblox_path, motion, model_id)
        total_parts += json_result["parts"]
        results[model_id] = {
            "status": "passed",
            "json": json_result,
            "glb": glb_result,
            "roblox": {"file": roblox_path.relative_to(ROOT).as_posix(), **roblox_result},
        }
    expected_ids = {model_id for model_id, _ in EXPECTED}
    if isinstance(viewer_models, list):
        actual_ids = {item.get("id") for item in viewer_models if isinstance(item, dict)}
    else:
        actual_ids = set(viewer_models)
    if actual_ids != expected_ids:
        fail(f"viewer/motion-data.js: model id set differs ({actual_ids})")
    demo = validate_demo(scenes)
    return {
        "schemaVersion": 1,
        "status": "passed",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "scope": {"models": len(EXPECTED), "parts": total_parts, "clipsPerModel": len(CLIPS), "sampledFrames": len(EXPECTED) * sum(spec["frames"] for spec in CLIPS.values()), "fps": FPS},
        "checks": {
            "motionJson": "source identity, geometry, timing, rest/loop/death rules, finite normalized sign-continuous quaternions, positive scales, visibility, ground clearance, and distinct non-static clips",
            "glb": "GLB structure, local mesh topology, materials/alpha, Move/Hit/Death LINEAR TRS channels, key times, and JSON-equivalent outputs",
            "viewer": "all nine embedded model payloads exactly match canonical animation JSON",
            "roblox": "XML/referent integrity, unique BasePart coverage, source alpha, readable script frame payload, and demo model coverage",
        },
        "models": results,
        "demo": demo,
        "limitations": [
            "Roblox Studio playback was not executed; RBXMX structure and embedded animation payload were validated statically.",
            "Browser playback was not executed; viewer data equivalence was validated statically.",
        ],
    }


def write_report(report: dict[str, Any]) -> None:
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", action="store_true", help="write docs/motion-validation.json (also written on failure)")
    parser.parse_args()
    try:
        report = run()
    except (ValidationError, KeyError, TypeError, ValueError, struct.error) as exc:
        report = {
            "schemaVersion": 1,
            "status": "failed",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "error": str(exc),
            "limitations": [
                "Validation stopped at the first failing invariant.",
                "Roblox Studio and browser playback were not executed.",
            ],
        }
        write_report(report)
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1
    write_report(report)
    print(f"PASS: validated {report['scope']['models']} models, {report['scope']['parts']} parts, JSON/GLB/viewer/Roblox")
    print(f"Report: {REPORT.relative_to(ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
