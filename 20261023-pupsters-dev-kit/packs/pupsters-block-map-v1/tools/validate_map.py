"""Validate PUPSTERS source geometry, exports, map layout, and viewer data.

The script is deliberately dependency-light apart from numpy, which the model
builder already requires.  It writes a machine-readable report and exits with
status 1 when any invariant fails.
"""
from __future__ import annotations

import base64
import json
import math
import re
import struct
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Iterable

import numpy as np

from build_models import ROOT, mesh


EPS = 1e-5
EXPECTED_IDS = {
    "D01", "D02", "D03", "D04", "D05", "D06",
    "E01", "E02", "E05", "B01",
}
DOG_IDS = {f"D{i:02d}" for i in range(1, 7)}


class Validation:
    def __init__(self) -> None:
        self.checks: list[dict[str, Any]] = []

    def check(self, condition: bool, name: str, detail: str = "") -> bool:
        self.checks.append({"name": name, "status": "pass" if condition else "fail", "detail": detail})
        return condition

    def fail(self, name: str, detail: str) -> None:
        self.check(False, name, detail)

    def write(self) -> int:
        failures = [c for c in self.checks if c["status"] == "fail"]
        coverage: dict[str, dict[str, int]] = {}
        for check in self.checks:
            category = check["name"].split(":", 1)[0]
            counts = coverage.setdefault(category, {"passed": 0, "failed": 0})
            counts["passed" if check["status"] == "pass" else "failed"] += 1
        key_patterns = (
            "file:", "source-models:", ":gltf-glb-buffer-identical", ":materials",
            ":part-names", "layout:floor-top", "layout:road:6-waypoints",
            "layout:road:width", "layout:road:y", "layout:road:s-route",
            "layout:road:centerline-contiguous", "layout:pads:count", "map:dogs:",
            "map:dog:", "map:boss:", "native:helpers:", "native:rbxmx:",
            "native:helper:", "viewer:",
        )
        reported = [c for c in self.checks if c["status"] == "fail" or any(pattern in c["name"] for pattern in key_patterns)]
        report = {
            "validator": "tools/validate_map.py",
            "status": "pass" if not failures else "fail",
            "summary": {"passed": len(self.checks) - len(failures), "failed": len(failures)},
            "coverage": coverage,
            "checks": reported,
        }
        target = ROOT / "docs" / "map-validation.json"
        target.parent.mkdir(exist_ok=True)
        target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(report["summary"], ensure_ascii=False))
        for failure in failures:
            print(f"FAIL {failure['name']}: {failure['detail']}", file=sys.stderr)
        return 1 if failures else 0


def finite_numbers(value: Any, count: int | None = None) -> bool:
    if not isinstance(value, (list, tuple)) or (count is not None and len(value) != count):
        return False
    return all(isinstance(v, (int, float)) and math.isfinite(v) for v in value)


def load_json(path: Path, v: Validation) -> Any | None:
    if not v.check(path.is_file(), f"file:{path.relative_to(ROOT).as_posix()}", "required file exists"):
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except Exception as exc:
        v.fail(f"json:{path.name}", str(exc))
        return None


def bounds(scene: dict[str, Any]) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    vertices = np.concatenate([mesh(p)[0] for p in scene["parts"]])
    return vertices.min(axis=0), vertices.max(axis=0), vertices


def source_checks(v: Validation) -> dict[str, dict[str, Any]]:
    scenes: dict[str, dict[str, Any]] = {}
    files = sorted((ROOT / "source-models").glob("*.json"))
    v.check(bool(files), "source-models:present", "source JSON files found")
    for path in files:
        scene = load_json(path, v)
        if not isinstance(scene, dict):
            continue
        sid = scene.get("id")
        if isinstance(sid, str):
            v.check(sid not in scenes, f"source:{sid}:unique-id", sid)
            scenes[sid] = scene
        else:
            v.fail(f"source:{path.name}:id", "missing string id")
            continue
        materials = scene.get("materials")
        parts = scene.get("parts")
        v.check(isinstance(materials, dict) and bool(materials), f"source:{sid}:materials")
        if not isinstance(materials, dict):
            materials = {}
        if isinstance(materials, dict):
            for material_name, material in materials.items():
                color = material.get("color") if isinstance(material, dict) else None
                v.check(
                    finite_numbers(color, 3) and all(0 <= n <= 1 for n in color),
                    f"source:{sid}:material:{material_name}",
                    "finite RGB values in [0, 1]",
                )
        if not isinstance(parts, list) or not parts:
            v.fail(f"source:{sid}:parts", "non-empty parts list required")
            continue
        names: set[str] = set()
        for index, part in enumerate(parts):
            label = f"source:{sid}:part:{index}"
            if not isinstance(part, dict):
                v.fail(label, "part must be an object")
                continue
            name = part.get("name")
            v.check(isinstance(name, str) and bool(name.strip()), f"{label}:name")
            v.check(name not in names, f"{label}:unique-name", str(name))
            if isinstance(name, str):
                names.add(name)
            v.check(part.get("type") in {"box", "sphere"}, f"{label}:primitive", str(part.get("type")))
            size = part.get("size")
            v.check(
                finite_numbers(size, 3) and all(n > 0 for n in size),
                f"{label}:size",
                str(size),
            )
            v.check(finite_numbers(part.get("position"), 3), f"{label}:position")
            v.check(finite_numbers(part.get("rotation"), 3), f"{label}:rotation")
            v.check(part.get("material") in materials, f"{label}:material", str(part.get("material")))
            v.check(isinstance(part.get("group"), str) and bool(part["group"]), f"{label}:group")
            try:
                verts, faces = mesh(part)
                v.check(np.isfinite(verts).all() and np.isfinite(faces).all(), f"{label}:mesh-finite")
            except Exception as exc:
                v.fail(f"{label}:mesh", str(exc))
    v.check(set(scenes) == EXPECTED_IDS, "source-models:expected-ids", f"got {sorted(scenes)}")
    return scenes


def parse_glb(path: Path) -> tuple[dict[str, Any], bytes]:
    raw = path.read_bytes()
    magic, version, total = struct.unpack_from("<4sII", raw)
    if magic != b"glTF" or version != 2 or total != len(raw):
        raise ValueError("invalid GLB 2.0 header")
    offset = 12
    chunks: dict[bytes, bytes] = {}
    while offset < len(raw):
        length, kind = struct.unpack_from("<I4s", raw, offset)
        offset += 8
        chunks[kind] = raw[offset:offset + length]
        offset += length
    if b"JSON" not in chunks or b"BIN\0" not in chunks:
        raise ValueError("GLB must have JSON and BIN chunks")
    return json.loads(chunks[b"JSON"].decode("utf-8")), chunks[b"BIN\0"]


def parse_gltf(path: Path) -> tuple[dict[str, Any], bytes]:
    doc = json.loads(path.read_text(encoding="utf-8"))
    uri = doc.get("buffers", [{}])[0].get("uri", "")
    prefix = "data:application/octet-stream;base64,"
    if not uri.startswith(prefix):
        raise ValueError("glTF buffer must be embedded base64")
    return doc, base64.b64decode(uri[len(prefix):])


COMPONENT_TYPES = {
    5120: np.dtype("i1"), 5121: np.dtype("u1"), 5122: np.dtype("<i2"),
    5123: np.dtype("<u2"), 5125: np.dtype("<u4"), 5126: np.dtype("<f4"),
}
TYPE_WIDTHS = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def accessor(doc: dict[str, Any], binary: bytes, index: int) -> np.ndarray:
    a = doc["accessors"][index]
    view = doc["bufferViews"][a["bufferView"]]
    dtype = COMPONENT_TYPES[a["componentType"]]
    width = TYPE_WIDTHS[a["type"]]
    offset = view.get("byteOffset", 0) + a.get("byteOffset", 0)
    stride = view.get("byteStride", dtype.itemsize * width)
    if stride == dtype.itemsize * width:
        return np.frombuffer(binary, dtype=dtype, count=a["count"] * width, offset=offset).reshape(a["count"], width)
    return np.ndarray((a["count"], width), dtype=dtype, buffer=binary, offset=offset, strides=(stride, dtype.itemsize))


def node_matrix(node: dict[str, Any]) -> np.ndarray:
    if "matrix" in node:
        return np.asarray(node["matrix"], dtype=float).reshape(4, 4, order="F")
    t = np.asarray(node.get("translation", [0, 0, 0]), dtype=float)
    s = np.asarray(node.get("scale", [1, 1, 1]), dtype=float)
    x, y, z, w = node.get("rotation", [0, 0, 0, 1])
    r = np.array([
        [1 - 2*y*y - 2*z*z, 2*x*y - 2*z*w, 2*x*z + 2*y*w],
        [2*x*y + 2*z*w, 1 - 2*x*x - 2*z*z, 2*y*z - 2*x*w],
        [2*x*z - 2*y*w, 2*y*z + 2*x*w, 1 - 2*x*x - 2*y*y],
    ]) @ np.diag(s)
    result = np.eye(4)
    result[:3, :3] = r
    result[:3, 3] = t
    return result


def world_matrices(doc: dict[str, Any]) -> dict[int, np.ndarray]:
    result: dict[int, np.ndarray] = {}
    roots = doc["scenes"][doc.get("scene", 0)]["nodes"]

    def visit(index: int, parent: np.ndarray) -> None:
        world = parent @ node_matrix(doc["nodes"][index])
        result[index] = world
        for child in doc["nodes"][index].get("children", []):
            visit(child, world)

    for root in roots:
        visit(root, np.eye(4))
    return result


def exported_positions(doc: dict[str, Any], binary: bytes) -> dict[str, np.ndarray]:
    worlds = world_matrices(doc)
    result: dict[str, np.ndarray] = {}
    for ni, node in enumerate(doc["nodes"]):
        if "mesh" not in node:
            continue
        primitive = doc["meshes"][node["mesh"]]["primitives"][0]
        positions = accessor(doc, binary, primitive["attributes"]["POSITION"]).astype(float)
        homogeneous = np.column_stack([positions, np.ones(len(positions))])
        result[node["name"]] = (homogeneous @ worlds[ni].T)[:, :3]
    return result


def asset_export_checks(v: Validation, scenes: Iterable[dict[str, Any]]) -> None:
    for scene in scenes:
        stem = scene.get("name", "")
        label = "asset:" + stem
        paths = {suffix: ROOT / "models" / f"{stem}.{suffix}" for suffix in ("gltf", "glb", "obj")}
        if not all(v.check(path.is_file(), f"{label}:{suffix}", path.name) for suffix, path in paths.items()):
            continue
        try:
            gltf, gltf_bin = parse_gltf(paths["gltf"])
            glb, glb_bin = parse_glb(paths["glb"])
        except Exception as exc:
            v.fail(f"{label}:parse", str(exc))
            continue
        expected_len = gltf["buffers"][0]["byteLength"]
        v.check(gltf_bin == glb_bin[:expected_len], f"{label}:gltf-glb-buffer-identical")
        v.check([m.get("name") for m in gltf.get("materials", [])] == list(scene["materials"]), f"{label}:materials")
        for format_name, doc, binary in (("gltf", gltf, gltf_bin), ("glb", glb, glb_bin)):
            try:
                positions = exported_positions(doc, binary)
                v.check(set(positions) == {p["name"] for p in scene["parts"]}, f"{label}:{format_name}:part-names")
                for part in scene["parts"]:
                    source_vertices, faces = mesh(part)
                    expected = source_vertices[faces].reshape(-1, 3)
                    actual = positions.get(part["name"])
                    v.check(actual is not None and actual.shape == expected.shape and np.allclose(actual, expected, atol=2e-5), f"{label}:{format_name}:world:{part['name']}")
            except Exception as exc:
                v.fail(f"{label}:{format_name}:geometry", str(exc))
        obj_geometry_check(v, stem, scene, paths["obj"])


def obj_geometry_check(v: Validation, sid: str, scene: dict[str, Any], path: Path) -> None:
    objects: dict[str, list[list[float]]] = {}
    current: str | None = None
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("o "):
            current = line[2:].strip()
            objects[current] = []
        elif line.startswith("v ") and current:
            objects[current].append([float(n) for n in line.split()[1:4]])
    v.check(set(objects) == {p["name"] for p in scene["parts"]}, f"export:{sid}:obj:part-names")
    for part in scene["parts"]:
        actual = np.asarray(objects.get(part["name"], []))
        expected = mesh(part)[0]
        v.check(actual.shape == expected.shape and np.allclose(actual, expected, atol=2e-5), f"export:{sid}:obj:world:{part['name']}")


def vec3(value: Any) -> np.ndarray | None:
    if finite_numbers(value, 3):
        return np.asarray(value, dtype=float)
    if isinstance(value, dict) and all(k in value for k in ("x", "y", "z")):
        candidate = [value["x"], value["y"], value["z"]]
        return np.asarray(candidate, dtype=float) if finite_numbers(candidate, 3) else None
    return None


def positioned_vec3(value: Any) -> np.ndarray | None:
    if isinstance(value, dict) and "position" in value:
        return vec3(value["position"])
    return vec3(value)


def rect_value(rect: dict[str, Any], key: str) -> float | None:
    aliases = {"xmin": ("xmin", "minX"), "xmax": ("xmax", "maxX"), "zmin": ("zmin", "minZ"), "zmax": ("zmax", "maxZ")}
    for alias in aliases[key]:
        value = rect.get(alias)
        if isinstance(value, (int, float)) and math.isfinite(value):
            return float(value)
    return None


def normalized_rect(rect: dict[str, Any]) -> tuple[float, float, float, float] | None:
    values = tuple(rect_value(rect, k) for k in ("xmin", "xmax", "zmin", "zmax"))
    if any(value is None for value in values):
        return None
    xmin, xmax, zmin, zmax = values
    return (xmin, xmax, zmin, zmax) if xmin < xmax and zmin < zmax else None


def point_in_union(x: float, z: float, rects: Iterable[tuple[float, float, float, float]], margin: float = 0) -> bool:
    return any(x >= a + margin - EPS and x <= b - margin + EPS and z >= c + margin - EPS and z <= d - margin + EPS for a, b, c, d in rects)


def aabb_overlap(a: tuple[float, float, float, float], b: tuple[float, float, float, float], margin: float = 0) -> bool:
    return a[0] < b[1] + margin - EPS and a[1] > b[0] - margin + EPS and a[2] < b[3] + margin - EPS and a[3] > b[2] - margin + EPS


def route_samples(points: list[np.ndarray], step: float = .2) -> Iterable[np.ndarray]:
    for start, end in zip(points, points[1:]):
        count = max(1, math.ceil(float(np.linalg.norm(end[[0, 2]] - start[[0, 2]])) / step))
        for n in range(count + 1):
            yield start + (end - start) * (n / count)


def layout_checks(v: Validation, sources: dict[str, dict[str, Any]], layout: dict[str, Any], map_scene: dict[str, Any], showcase: dict[str, Any]) -> None:
    floor = layout.get("floor", {})
    floor_pos = vec3(floor.get("position")) if isinstance(floor, dict) else None
    floor_size = vec3(floor.get("size")) if isinstance(floor, dict) else None
    floor_top = floor.get("top") if isinstance(floor, dict) else None
    if floor_top is None and floor_pos is not None and floor_size is not None:
        floor_top = floor_pos[1] + floor_size[1] / 2
    floor_bounds = layout.get("floorBounds")
    if floor_top is None and isinstance(floor_bounds, list) and len(floor_bounds) == 2 and finite_numbers(floor_bounds[1], 3):
        floor_top = floor_bounds[1][1]
        floor_pos = (np.asarray(floor_bounds[0], dtype=float) + np.asarray(floor_bounds[1], dtype=float)) / 2
        floor_size = np.asarray(floor_bounds[1], dtype=float) - np.asarray(floor_bounds[0], dtype=float)
    v.check(isinstance(floor_top, (int, float)) and abs(floor_top) <= EPS, "layout:floor-top", str(floor_top))

    road = layout.get("road", {})
    waypoints_raw = road.get("waypoints", layout.get("waypoints")) if isinstance(road, dict) else None
    width = road.get("width", layout.get("pathWidth")) if isinstance(road, dict) else None
    path_y = road.get("y", road.get("pathY", layout.get("pathY"))) if isinstance(road, dict) else None
    points = [positioned_vec3(p) for p in waypoints_raw] if isinstance(waypoints_raw, list) else []
    v.check(len(points) == 6 and all(p is not None for p in points), "layout:road:6-waypoints")
    v.check(isinstance(width, (int, float)) and abs(width - 6) <= EPS, "layout:road:width", str(width))
    v.check(isinstance(path_y, (int, float)) and abs(path_y - .1) <= EPS, "layout:road:y", str(path_y))
    if len(points) == 6 and all(p is not None for p in points):
        points = [p for p in points if p is not None]
        axes: list[str] = []
        signs: list[int] = []
        for start, end in zip(points, points[1:]):
            dx, dz = end[0] - start[0], end[2] - start[2]
            axis_aligned = (abs(dx) <= EPS) != (abs(dz) <= EPS)
            v.check(axis_aligned, f"layout:road:axis-aligned:{len(axes)}", f"delta=({dx},{dz})")
            if axis_aligned:
                axes.append("x" if abs(dx) > EPS else "z")
                signs.append(1 if (dx if abs(dx) > EPS else dz) > 0 else -1)
        s_route = len(axes) == 5 and axes[0] == axes[2] == axes[4] and axes[1] == axes[3] and axes[0] != axes[1] and signs[0] == signs[4] == -signs[2] and signs[1] == signs[3]
        v.check(s_route, "layout:road:s-route", f"axes={axes}, signs={signs}")

    road_rects_raw = layout.get("roadRects", road.get("rects", []) if isinstance(road, dict) else [])
    road_rects = [normalized_rect(r) for r in road_rects_raw] if isinstance(road_rects_raw, list) else []
    v.check(bool(road_rects) and all(r is not None for r in road_rects), "layout:road:rectangles")
    road_rects = [r for r in road_rects if r is not None]
    if len(points) == 6 and road_rects:
        v.check(all(point_in_union(p[0], p[2], road_rects) for p in route_samples(points)), "layout:road:centerline-contiguous")

    pads = layout.get("pads", layout.get("slots", []))
    v.check(isinstance(pads, list) and len(pads) == 16, "layout:pads:count", str(len(pads) if isinstance(pads, list) else None))
    floor_rect = None
    if floor_pos is not None and floor_size is not None:
        floor_rect = (floor_pos[0] - floor_size[0] / 2, floor_pos[0] + floor_size[0] / 2, floor_pos[2] - floor_size[2] / 2, floor_pos[2] + floor_size[2] / 2)
    pad_rects: list[tuple[float, float, float, float]] = []
    for i, pad in enumerate(pads if isinstance(pads, list) else []):
        pos = vec3(pad.get("position")) if isinstance(pad, dict) else None
        raw_size = pad.get("size") if isinstance(pad, dict) else None
        size = np.asarray([raw_size[0], 0, raw_size[1]], dtype=float) if finite_numbers(raw_size, 2) else vec3(raw_size)
        label = f"layout:pad:{i}"
        v.check(pos is not None and size is not None, f"{label}:transform")
        if pos is None or size is None:
            continue
        v.check(abs(size[0] - 4.2) <= EPS and abs(size[2] - 4.2) <= EPS, f"{label}:size", str(size.tolist()))
        top = pos[1] if size[1] == 0 else pos[1] + size[1] / 2
        v.check(abs(top - .26) <= EPS, f"{label}:top", str(top))
        rect = (pos[0] - size[0] / 2, pos[0] + size[0] / 2, pos[2] - size[2] / 2, pos[2] + size[2] / 2)
        pad_rects.append(rect)
        v.check(floor_rect is not None and rect[0] >= floor_rect[0] - EPS and rect[1] <= floor_rect[1] + EPS and rect[2] >= floor_rect[2] - EPS and rect[3] <= floor_rect[3] + EPS, f"{label}:inside-floor")
        v.check(not any(aabb_overlap(rect, rr, .05) for rr in road_rects), f"{label}:clear-road")
    for i, rect in enumerate(pad_rects):
        for j in range(i):
            v.check(not aabb_overlap(rect, pad_rects[j], .05), f"layout:pads:no-overlap:{j}:{i}")

    blockers = footprint_items(map_scene)
    road_surface = float(path_y) if isinstance(path_y, (int, float)) else -math.inf
    for i, pad in enumerate(pad_rects):
        for name, category, footprint, bottom_y, top_y in blockers:
            if category in {"Props", "Spawn", "Goal"}:
                v.check(not aabb_overlap(pad, footprint, .05), f"layout:pad:{i}:clear:{name}", category)
    for name, category, footprint, bottom_y, top_y in blockers:
        if category in {"Props", "Spawn", "Goal"} and bottom_y < 3.5 - EPS and top_y > road_surface + EPS:
            v.check(not any(aabb_overlap(footprint, rr) for rr in road_rects), f"layout:road:clear:{name}", category)

    dog_fit_checks(v, sources, layout)
    boss_route_check(v, sources, points if len(points) == 6 else [], road_rects)
    actor_checks(v, sources, layout, showcase, floor_top, path_y, pads, road_rects)
    copied_source_checks(v, sources, layout, showcase)
    native_helper_checks(v, layout)


def footprint_items(scene: dict[str, Any]) -> list[tuple[str, str, tuple[float, float, float, float], float, float]]:
    items = scene.get("parts", scene.get("objects", [])) if isinstance(scene, dict) else []
    result = []
    for item in items if isinstance(items, list) else []:
        if not isinstance(item, dict):
            continue
        pos, size = vec3(item.get("position")), vec3(item.get("size"))
        if pos is None or size is None or size[1] <= 0:
            continue
        category = item.get("category", item.get("group", ""))
        footprint = (pos[0] - size[0] / 2, pos[0] + size[0] / 2, pos[2] - size[2] / 2, pos[2] + size[2] / 2)
        result.append((str(item.get("name", "unnamed")), str(category), footprint, float(pos[1] - size[1] / 2), float(pos[1] + size[1] / 2)))
    return result


def instance_id(item: dict[str, Any]) -> str | None:
    value = item.get("sourceId", item.get("source", item.get("modelId", item.get("id"))))
    if isinstance(value, str):
        match = re.match(r"([A-Z]\d{2})", value)
        return match.group(1) if match else value
    return None


def yaw_radians(item: dict[str, Any]) -> float:
    value = item.get("yaw", item.get("rotationY", 0))
    if isinstance(value, (int, float)):
        return math.radians(value) if abs(value) > 2 * math.pi + EPS else float(value)
    rotation = item.get("rotation")
    return float(rotation[1]) if finite_numbers(rotation, 3) else 0.0


def dog_fit_checks(v: Validation, sources: dict[str, dict[str, Any]], layout: dict[str, Any]) -> None:
    dog_instances = [item for item in layout.get("showcase", []) if isinstance(item, dict) and instance_id(item) in DOG_IDS]
    v.check({instance_id(item) for item in dog_instances} == DOG_IDS, "map:dogs:all-six-copied")
    yaws = sorted({yaw_radians(item) for item in layout.get("slots", []) if isinstance(item, dict)}) or [0]
    for sid in sorted(DOG_IDS):
        if sid not in sources:
            continue
        _, _, vertices = bounds(sources[sid])
        for yaw in yaws:
            c, s = math.cos(yaw), math.sin(yaw)
            x = vertices[:, 0] * c + vertices[:, 2] * s
            z = -vertices[:, 0] * s + vertices[:, 2] * c
            v.check(float(np.ptp(x)) <= 4.2 + EPS and float(np.ptp(z)) <= 4.2 + EPS, f"map:dog:{sid}:fits-pad:yaw:{yaw:.6f}", f"extent={np.ptp(x):.4f}x{np.ptp(z):.4f}")


def boss_route_check(v: Validation, sources: dict[str, dict[str, Any]], points: list[np.ndarray], road_rects: list[tuple[float, float, float, float]]) -> None:
    if "B01" not in sources:
        return
    low, high, vertices = bounds(sources["B01"])
    radius = float(np.max(np.linalg.norm(vertices[:, [0, 2]], axis=1)))
    v.check((high[0] - low[0]) / 2 <= 1.1 + EPS and (high[2] - low[2]) / 2 <= 2.4 + EPS, "map:boss:source-half-bounds", f"half={((high-low)/2)[[0,2]].tolist()}")
    v.check(radius <= 2.64 + EPS and radius < 3, "map:boss:turn-radius", f"radius={radius:.6f}")
    if points and road_rects:
        samples = list(route_samples(points, .15))
        angles = np.linspace(0, 2 * math.pi, 144, endpoint=False)
        inside = all(point_in_union(float(p[0] + radius * math.cos(a)), float(p[2] + radius * math.sin(a)), road_rects) for p in samples for a in angles)
        v.check(inside, "map:boss:full-sweep-inside-road", f"radius={radius:.6f}")


def actor_checks(v: Validation, sources: dict[str, dict[str, Any]], layout: dict[str, Any], showcase: dict[str, Any], floor_top: Any, path_y: Any, pads: list[Any], road_rects: list[tuple[float, float, float, float]]) -> None:
    all_actors = [("showcase", a) for a in layout.get("showcase", []) if isinstance(a, dict)]
    pad_surfaces: list[tuple[tuple[float, float, float, float], float]] = []
    for pad in pads if isinstance(pads, list) else []:
        pos = vec3(pad.get("position"))
        size = pad.get("size")
        if pos is not None and finite_numbers(size, 2):
            pad_surfaces.append(((pos[0] - size[0] / 2, pos[0] + size[0] / 2, pos[2] - size[1] / 2, pos[2] + size[1] / 2), float(pos[1])))
    for origin, actor in all_actors:
        sid = instance_id(actor)
        if sid not in sources:
            continue
        scale = actor.get("scale", 1)
        uniform_one = (isinstance(scale, (int, float)) and abs(scale - 1) <= EPS) or (finite_numbers(scale, 3) and all(abs(n - 1) <= EPS for n in scale))
        v.check(uniform_one, f"{origin}:actor:{actor.get('name', sid)}:scale-one", str(scale))
        pos = vec3(actor.get("position"))
        if pos is not None:
            low, _, _ = bounds(sources[sid])
            matching_tops = [top for rect, top in pad_surfaces if point_in_union(pos[0], pos[2], [rect])]
            if point_in_union(pos[0], pos[2], road_rects) and isinstance(path_y, (int, float)):
                matching_tops.append(float(path_y))
            on_surface = bool(matching_tops) and any(abs((pos[1] + low[1]) - top) <= EPS for top in matching_tops)
            v.check(on_surface, f"{origin}:actor:{actor.get('name', sid)}:stands-on-surface", f"bottom={pos[1]+low[1]}, local-surfaces={matching_tops}")


def copied_source_checks(v: Validation, sources: dict[str, dict[str, Any]], layout: dict[str, Any], showcase: dict[str, Any]) -> None:
    actual_parts = {p.get("name"): p for p in showcase.get("parts", []) if isinstance(p, dict)}
    placements = [p for p in layout.get("showcase", []) if isinstance(p, dict)]
    for placement in placements:
        sid = instance_id(placement)
        if sid not in sources:
            continue
        prefix = str(placement.get("id")) + "_"
        yaw = yaw_radians(placement)
        c, s = math.cos(yaw), math.sin(yaw)
        transform = np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
        offset = vec3(placement.get("position"))
        if offset is None:
            v.fail(f"showcase:copy:{prefix}:position", "invalid placement")
            continue
        for source_part in sources[sid]["parts"]:
            name = prefix + source_part["name"]
            actual_part = actual_parts.get(name)
            v.check(actual_part is not None, f"showcase:copy:{name}:present")
            if actual_part is None:
                continue
            expected_vertices = mesh(source_part)[0] @ transform.T + offset
            actual_vertices = mesh(actual_part)[0]
            stable = actual_part.get("type") == source_part.get("type") and np.allclose(actual_part.get("size"), source_part.get("size"), atol=EPS) and np.allclose(actual_vertices, expected_vertices, atol=2e-5)
            v.check(stable, f"showcase:copy:{name}:stable", f"source={sid}, yaw={yaw}")


def native_helper_checks(v: Validation, layout: dict[str, Any]) -> None:
    expected = layout.get("nativeHelpers", layout.get("helpers", []))
    if not expected:
        expected = list(layout.get("waypoints", [])) + list(layout.get("slots", []))
    if not isinstance(expected, list):
        v.fail("native:helpers:metadata", "layout helpers must be a list")
        return
    expected_positions = {str(h.get("name", h.get("id"))): vec3(h.get("position")) for h in expected if isinstance(h, dict)}
    expected_positions = {k: p for k, p in expected_positions.items() if p is not None}
    v.check(bool(expected_positions), "native:helpers:metadata", f"count={len(expected_positions)}")
    candidates = sorted((ROOT / "native").glob("*.rbxmx"))
    if not v.check(bool(candidates), "native:rbxmx:present"):
        return
    for candidate in candidates:
        actual: dict[str, np.ndarray] = {}
        try:
            root = ET.parse(candidate).getroot()
            for item in root.iter("Item"):
                props = item.find("Properties")
                if props is None:
                    continue
                name_node = props.find("string[@name='Name']")
                frame = props.find("CoordinateFrame[@name='CFrame']")
                if name_node is None or frame is None:
                    continue
                coords = [frame.findtext(axis) for axis in ("X", "Y", "Z")]
                if all(value is not None for value in coords):
                    actual[name_node.text or ""] = np.asarray([float(value) for value in coords])
        except Exception as exc:
            v.fail(f"native:rbxmx:{candidate.stem}:parse", str(exc))
            continue
        for name, expected_pos in expected_positions.items():
            v.check(name in actual and np.allclose(actual[name], expected_pos, atol=EPS), f"native:helper:{candidate.stem}:{name}:position", f"expected={expected_pos.tolist()}, actual={actual.get(name)}")


def viewer_checks(v: Validation, map_scene: dict[str, Any], showcase: dict[str, Any]) -> None:
    path = ROOT / "viewer" / "map-data.js"
    if not v.check(path.is_file(), "viewer:map-data:present"):
        return
    text = path.read_text(encoding="utf-8-sig").strip()
    match = re.search(r"=\s*({.*})\s*;?\s*$", text, re.DOTALL)
    if not match:
        v.fail("viewer:map-data:parse", "expected a JavaScript assignment with a JSON object")
        return
    try:
        data = json.loads(match.group(1))
    except Exception as exc:
        v.fail("viewer:map-data:parse", str(exc))
        return
    if isinstance(data.get("parts"), list):
        expected = showcase if isinstance(showcase.get("parts"), list) else map_scene
        actual_vertices = part_vertices(data["parts"])
        expected_vertices = part_vertices(expected.get("parts", []))
        same = actual_vertices.keys() == expected_vertices.keys() and all(np.allclose(actual_vertices[name], expected_vertices[name], atol=2e-5) for name in actual_vertices)
        v.check(same, "viewer:map-data:world-vertices")
    else:
        viewer_map = data.get("map", data.get("mapScene"))
        viewer_showcase = data.get("showcase", data.get("showcaseScene"))
        v.check(viewer_map == map_scene, "viewer:map-data:map-world-vertices")
        v.check(viewer_showcase == showcase, "viewer:map-data:showcase-world-vertices")


def part_vertices(parts: list[Any]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for part in parts:
        if not isinstance(part, dict) or not isinstance(part.get("name"), str):
            continue
        if isinstance(part.get("vertices"), list):
            result[part["name"]] = part["vertices"]
        elif part.get("type") in {"box", "sphere"}:
            result[part["name"]] = np.round(mesh(part)[0], 6).tolist()
    return result


def main() -> int:
    v = Validation()
    sources = source_checks(v)
    layout = load_json(ROOT / "layout.json", v)
    map_scene = load_json(ROOT / "scenes" / "map.json", v)
    showcase = load_json(ROOT / "scenes" / "showcase.json", v)
    if all(isinstance(item, dict) for item in (layout, map_scene, showcase)):
        asset_export_checks(v, (map_scene, showcase))
        layout_checks(v, sources, layout, map_scene, showcase)
        viewer_checks(v, map_scene, showcase)
    return v.write()


if __name__ == "__main__":
    raise SystemExit(main())
