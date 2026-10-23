#!/usr/bin/env python3
"""Bake sampled enemy motion JSON into self-contained Roblox XML models."""
from __future__ import annotations

import base64
import hashlib
import json
import math
from pathlib import Path
import shutil
import struct
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
ANIMATIONS = ROOT / "animations"
NATIVE = ROOT / "native"
OUTPUT = ROOT / "roblox"
EXPECTED = (
    ("E01", "BlockBot_Enemy.rbxmx"),
    ("E02", "Wheelie_Enemy.rbxmx"),
    ("E03", "BrickBruiser_Enemy.rbxmx"),
    ("E04", "Shellback_Block.rbxmx"),
    ("E05", "SplitStack_Block.rbxmx"),
    ("E06", "FixItBot_Block.rbxmx"),
    ("E07", "ClearCrawler_Enemy.rbxmx"),
    ("E08", "CarrierCart_Enemy.rbxmx"),
    ("B01", "Blockosaur_Boss.rbxmx"),
)
CLIP_SPECS = {
    "move": (1.2, True),
    "hit": (0.6, False),
    "death": (1.6, False),
}
PART_CLASSES = {"Part", "WedgePart"}
SURFACES = ("TopSurface", "BottomSurface", "LeftSurface", "RightSurface", "FrontSurface", "BackSurface")
PACK_OFFSETS = tuple(((column - 1) * 7.0, 0.0, (row - 1) * 7.0) for row in range(3) for column in range(3))
ROOT_PART_NAME = "MotionRoot"
EPSILON_SIZE = 0.001


def fail(message: str) -> None:
    raise ValueError(message)


def number(value: object, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        fail(f"{label} must be a finite number")
    return float(value)


def vector(value: object, length: int, label: str) -> list[float]:
    if not isinstance(value, list) or len(value) != length:
        fail(f"{label} must contain {length} numbers")
    return [number(component, f"{label}[{index}]") for index, component in enumerate(value)]


def close(a: list[float], b: list[float], tolerance: float = 1e-6) -> bool:
    return len(a) == len(b) and all(abs(x - y) <= tolerance for x, y in zip(a, b))


def matrix_close(a: list[list[float]], b: list[list[float]], tolerance: float = 1e-6) -> bool:
    return all(close(x, y, tolerance) for x, y in zip(a, b))


def transform_close(a: list[float], b: list[float], tolerance: float = 1e-6) -> bool:
    """Compare poses while treating q and -q as the same rotation."""
    return (
        close(a[:3], b[:3], tolerance)
        and matrix_close(quaternion_matrix(a[3:7]), quaternion_matrix(b[3:7]), tolerance)
        and close(a[7:], b[7:], tolerance)
    )


def fmt(value: float) -> str:
    return format(0.0 if abs(value) < 5e-13 else value, ".12g")


def lua_number(value: float) -> str:
    return repr(0.0 if value == 0 else float(value))


def lua_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def quaternion_matrix(quaternion: list[float]) -> list[list[float]]:
    x, y, z, w = quaternion
    length = math.sqrt(x * x + y * y + z * z + w * w)
    if length < 1e-12 or abs(length - 1.0) > 1e-5:
        fail(f"quaternion must have unit length, got {length}")
    x, y, z, w = (component / length for component in quaternion)
    return [
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ]


def item_name(item: ET.Element) -> str:
    node = item.find('./Properties/string[@name="Name"]')
    if node is None or node.text is None:
        fail(f"{item.attrib.get('class', 'Item')} has no Name")
    return node.text


def property_node(item: ET.Element, tag: str, name: str) -> ET.Element:
    node = item.find(f'./Properties/{tag}[@name="{name}"]')
    if node is None:
        fail(f"{item_name(item)} has no {name}")
    return node


def read_xyz(node: ET.Element, axes: tuple[str, ...] = ("X", "Y", "Z")) -> list[float]:
    try:
        return [float(node.findtext(axis, "")) for axis in axes]
    except ValueError as error:
        fail(f"invalid vector value: {error}")


def read_cframe(item: ET.Element) -> tuple[list[float], list[list[float]]]:
    node = property_node(item, "CoordinateFrame", "CFrame")
    position = read_xyz(node)
    matrix = [[float(node.findtext(f"R{row}{column}", "")) for column in range(3)] for row in range(3)]
    return position, matrix


def write_cframe(node: ET.Element, position: list[float], matrix: list[list[float]]) -> None:
    for axis, value in zip(("X", "Y", "Z"), position):
        node.find(axis).text = fmt(value)
    for row in range(3):
        for column in range(3):
            node.find(f"R{row}{column}").text = fmt(matrix[row][column])


def model_parts(model: ET.Element) -> dict[str, dict]:
    result: dict[str, dict] = {}
    for group in model.findall('./Item[@class="Model"]'):
        group_name = item_name(group)
        for item in group.findall("./Item"):
            if item.attrib.get("class") not in PART_CLASSES:
                continue
            name = item_name(item)
            if name in result:
                fail(f"native part name is not unique: {name}")
            position, matrix = read_cframe(item)
            result[name] = {
                "item": item,
                "group": group_name,
                "position": position,
                "matrix": matrix,
                "size": read_xyz(property_node(item, "Vector3", "size")),
                "color": read_xyz(property_node(item, "Color3", "Color"), ("R", "G", "B")),
                "opacity": 1.0 - float(property_node(item, "float", "Transparency").text or "0"),
                "material": property_node(item, "token", "Material").text,
                "shape": property_node(item, "token", "Shape").text,
                "anchored": property_node(item, "bool", "Anchored").text,
                "canCollide": property_node(item, "bool", "CanCollide").text,
            }
    if not result:
        fail(f"{item_name(model)} has no grouped native parts")
    return result


def load_native(path: Path) -> tuple[ET.ElementTree, ET.Element, dict[str, dict]]:
    tree = ET.parse(path)
    root = tree.getroot()
    models = root.findall("./Item")
    if len(models) != 1 or models[0].attrib.get("class") != "Model":
        fail(f"{path.name}: expected one root Model")
    return tree, models[0], model_parts(models[0])


def canonical_motion(raw: dict) -> str:
    return json.dumps(raw, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def load_animation(path: Path, expected_id: str, native: dict[str, dict]) -> dict:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        fail(f"{path.name}: document root must be an object")
    for key in ("id", "name", "displayName", "parts", "clips"):
        if key not in raw:
            fail(f"{path.name}: missing {key}")
    if raw["id"] != expected_id:
        fail(f"{path.name}: id must be {expected_id}")
    for key in ("name", "displayName"):
        if not isinstance(raw[key], str) or not raw[key].strip():
            fail(f"{path.name}: {key} must be a non-empty string")
    if not isinstance(raw["parts"], list) or not raw["parts"]:
        fail(f"{path.name}: parts must be a non-empty array")

    names: set[str] = set()
    parts = []
    for index, part in enumerate(raw["parts"]):
        label = f"{path.name}.parts[{index}]"
        if not isinstance(part, dict):
            fail(f"{label} must be an object")
        for key in ("name", "group", "type", "size", "position", "quaternion", "color", "vertices", "faces"):
            if key not in part:
                fail(f"{label}: missing {key}")
        name, group, kind = part["name"], part["group"], part["type"]
        if not isinstance(name, str) or not name or name in names:
            fail(f"{label}.name must be non-empty and unique")
        if not isinstance(group, str) or not group or kind not in {"box", "sphere"}:
            fail(f"{label}: invalid group or type")
        if not isinstance(part["vertices"], list) or not isinstance(part["faces"], list):
            fail(f"{label}: vertices and faces must be arrays")
        size = vector(part["size"], 3, f"{label}.size")
        position = vector(part["position"], 3, f"{label}.position")
        quaternion = vector(part["quaternion"], 4, f"{label}.quaternion")
        color = vector(part["color"], 3, f"{label}.color")
        opacity = number(part.get("opacity", 1), f"{label}.opacity")
        if any(value <= 0 for value in size) or any(not 0 <= value <= 1 for value in color) or not 0 <= opacity <= 1:
            fail(f"{label}: invalid size, color, or opacity")
        quaternion_matrix(quaternion)
        names.add(name)
        parts.append({
            "name": name,
            "group": group,
            "type": kind,
            "size": size,
            "position": position,
            "quaternion": quaternion,
            "color": color,
            "opacity": opacity,
            "vertices": part["vertices"],
            "faces": part["faces"],
        })

    if names != set(native):
        fail(f"{path.name}: JSON/native part names differ; missing={sorted(set(native) - names)}, extra={sorted(names - set(native))}")
    for part in parts:
        source = native[part["name"]]
        expected_shape = "0" if part["type"] == "sphere" else "1"
        if part["group"] != source["group"] or expected_shape != source["shape"]:
            fail(f"{path.name}: group/type differs from native for {part['name']}")
        if not close(part["size"], source["size"]) or not close(part["position"], source["position"]):
            fail(f"{path.name}: size/position differs from native for {part['name']}")
        if not matrix_close(quaternion_matrix(part["quaternion"]), source["matrix"]):
            fail(f"{path.name}: rotation differs from native for {part['name']}")
        if not close(part["color"], source["color"], 2e-6) or abs(part["opacity"] - source["opacity"]) > 2e-6:
            fail(f"{path.name}: color/opacity differs from native for {part['name']}")

    clips_raw = raw["clips"]
    if not isinstance(clips_raw, dict) or set(clips_raw) != set(CLIP_SPECS):
        fail(f"{path.name}: clips must contain exactly move, hit, and death")
    clips = {}
    for clip_key, (expected_duration, expected_loop) in CLIP_SPECS.items():
        clip = clips_raw[clip_key]
        label = f"{path.name}.clips.{clip_key}"
        if not isinstance(clip, dict):
            fail(f"{label} must be an object")
        for key in ("name", "description", "duration", "fps", "loop", "frames"):
            if key not in clip:
                fail(f"{label}: missing {key}")
        if not isinstance(clip["name"], str) or not clip["name"].strip() or not isinstance(clip["description"], str) or not clip["description"].strip():
            fail(f"{label}: name and description must be non-empty strings")
        duration = number(clip["duration"], f"{label}.duration")
        fps = number(clip["fps"], f"{label}.fps")
        if abs(duration - expected_duration) > 1e-9 or abs(fps - 30.0) > 1e-9 or clip["loop"] is not expected_loop:
            fail(f"{label}: expected duration={expected_duration}, fps=30, loop={expected_loop}")
        expected_frames = round(duration * fps) + 1
        if not isinstance(clip["frames"], list) or len(clip["frames"]) != expected_frames:
            fail(f"{label}: expected {expected_frames} sampled frames")
        frames = []
        for frame_index, frame in enumerate(clip["frames"]):
            frame_label = f"{label}.frames[{frame_index}]"
            if not isinstance(frame, dict) or "time" not in frame or "transforms" not in frame:
                fail(f"{frame_label}: missing time or transforms")
            time = number(frame["time"], f"{frame_label}.time")
            if abs(time - frame_index / fps) > 1e-6:
                fail(f"{frame_label}.time is off the 30 fps grid")
            if not isinstance(frame["transforms"], list) or len(frame["transforms"]) != len(parts):
                fail(f"{frame_label}: transform count differs from parts")
            transforms = []
            for part_index, transform in enumerate(frame["transforms"]):
                values = vector(transform, 11, f"{frame_label}.transforms[{part_index}]")
                quaternion_matrix(values[3:7])
                if any(scale < 0 for scale in values[7:10]) or values[10] not in (0.0, 1.0):
                    fail(f"{frame_label}.transforms[{part_index}]: invalid scale or visibility")
                transforms.append(values)
            frames.append({"time": time, "transforms": transforms})
        clips[clip_key] = {
            "name": clip["name"],
            "description": clip["description"],
            "duration": duration,
            "fps": fps,
            "loop": expected_loop,
            "frames": frames,
        }

    rest = [[*part["position"], *part["quaternion"], 1.0, 1.0, 1.0, 1.0] for part in parts]
    for clip_key, clip in clips.items():
        if any(not transform_close(actual, expected) for actual, expected in zip(clip["frames"][0]["transforms"], rest)):
            fail(f"{path.name}: {clip_key} must start at the exact rest pose")
    for clip_key in ("move", "hit"):
        if any(not transform_close(actual, expected) for actual, expected in zip(clips[clip_key]["frames"][-1]["transforms"], rest)):
            fail(f"{path.name}: {clip_key} must return to the exact rest pose")
    if any(transform[10] != 0 for transform in clips["death"]["frames"][-1]["transforms"]):
        fail(f"{path.name}: death must finish with every part invisible")

    normalized = {"id": expected_id, "name": raw["name"], "displayName": raw["displayName"], "parts": parts, "clips": clips}
    normalized["digest"] = hashlib.sha256(canonical_motion(normalized).encode("utf-8")).hexdigest()
    return normalized


def bool_attribute(name: str, value: bool) -> str:
    raw = struct.pack("<I", 1) + struct.pack("<I", len(name)) + name.encode("utf-8") + bytes((3, int(value)))
    return base64.b64encode(raw).decode("ascii")


def add_auto_preview_attribute(model: ET.Element, value: bool) -> None:
    properties = model.find("Properties")
    if properties is None:
        fail("model has no Properties")
    old = properties.find('./BinaryString[@name="AttributesSerialize"]')
    if old is not None:
        properties.remove(old)
    ET.SubElement(properties, "BinaryString", {"name": "AttributesSerialize"}).text = bool_attribute("AutoPreview", value)


def next_referent(root: ET.Element):
    used = {item.attrib.get("referent") for item in root.iter("Item")}
    counter = 0

    def allocate() -> str:
        nonlocal counter
        while True:
            counter += 1
            value = f"MOTION{counter}"
            if value not in used:
                used.add(value)
                return value

    return allocate


def add_name_properties(item: ET.Element, name: str) -> ET.Element:
    properties = ET.SubElement(item, "Properties")
    ET.SubElement(properties, "string", {"name": "Name"}).text = name
    return properties


def make_cframe(properties: ET.Element, position: tuple[float, float, float]) -> None:
    node = ET.SubElement(properties, "CoordinateFrame", {"name": "CFrame"})
    values = {
        "X": position[0], "Y": position[1], "Z": position[2],
        "R00": 1, "R01": 0, "R02": 0,
        "R10": 0, "R11": 1, "R12": 0,
        "R20": 0, "R21": 0, "R22": 1,
    }
    for key, value in values.items():
        ET.SubElement(node, key).text = fmt(value)


def make_vector(properties: ET.Element, name: str, value: tuple[float, float, float]) -> None:
    node = ET.SubElement(properties, "Vector3", {"name": name})
    for axis, component in zip(("X", "Y", "Z"), value):
        ET.SubElement(node, axis).text = fmt(component)


def add_motion_root(model: ET.Element, position: tuple[float, float, float], allocate) -> str:
    root_ref = allocate()
    item = ET.SubElement(model, "Item", {"class": "Part", "referent": root_ref})
    properties = ET.SubElement(item, "Properties")
    ET.SubElement(properties, "bool", {"name": "Anchored"}).text = "true"
    ET.SubElement(properties, "bool", {"name": "CanCollide"}).text = "false"
    ET.SubElement(properties, "bool", {"name": "CanQuery"}).text = "false"
    ET.SubElement(properties, "bool", {"name": "CanTouch"}).text = "false"
    make_cframe(properties, position)
    color = ET.SubElement(properties, "Color3", {"name": "Color"})
    for axis in ("R", "G", "B"):
        ET.SubElement(color, axis).text = "0"
    ET.SubElement(properties, "token", {"name": "Material"}).text = "272"
    ET.SubElement(properties, "string", {"name": "Name"}).text = ROOT_PART_NAME
    make_vector(properties, "Position", position)
    ET.SubElement(properties, "token", {"name": "Shape"}).text = "1"
    for surface in SURFACES:
        ET.SubElement(properties, "token", {"name": surface}).text = "0"
    ET.SubElement(properties, "float", {"name": "Transparency"}).text = "1"
    make_vector(properties, "size", (0.05, 0.05, 0.05))
    model_properties = model.find("Properties")
    if model_properties is None:
        fail("model has no Properties")
    old = model_properties.find('./Ref[@name="PrimaryPart"]')
    if old is not None:
        model_properties.remove(old)
    ET.SubElement(model_properties, "Ref", {"name": "PrimaryPart"}).text = root_ref
    return root_ref


def lua_transform(values: list[float]) -> str:
    return "{" + ",".join(lua_number(value) for value in values) + "}"


def lua_frames(frames: list[dict]) -> list[str]:
    lines = ["{"]
    for frame in frames:
        rows = ",".join(lua_transform(transform) for transform in frame["transforms"])
        lines.append(f"\t\t{{{lua_number(frame['time'])},{{{rows}}}}},")
    lines.append("\t}")
    return lines


def build_script(animation: dict, auto_preview: bool) -> str:
    names = ",".join(lua_string(part["name"]) for part in animation["parts"])
    sizes = ",".join(f"Vector3.new({','.join(lua_number(x) for x in part['size'])})" for part in animation["parts"])
    opacities = ",".join(lua_number(part["opacity"]) for part in animation["parts"])
    lines = [
        "-- Generated PUPSTERS enemy motion playback. Visual only; no damage or networking.",
        f"-- MotionDataSHA256: {animation['digest']}",
        'local RunService = game:GetService("RunService")',
        "local model = script.Parent",
        'local motion = model:WaitForChild("Motion")',
        f"local AUTO_PREVIEW_DEFAULT = {str(auto_preview).lower()}",
        f"local EPSILON_SIZE = {lua_number(EPSILON_SIZE)}",
        "local TRANSITION_DURATION = 0.08",
        f"local names = {{{names}}}",
        f"local baseSizes = {{{sizes}}}",
        f"local baseOpacities = {{{opacities}}}",
        "local clips = {",
    ]
    for key in ("move", "hit", "death"):
        clip = animation["clips"][key]
        lines.append(f"\t{key} = {{duration={lua_number(clip['duration'])}, looped={str(clip['loop']).lower()}, frames=")
        lines.extend(lua_frames(clip["frames"]))
        lines[-1] += "},"
    lines.extend([
        "}",
        "",
        'if model:GetAttribute("AutoPreview") == nil then',
        '\tmodel:SetAttribute("AutoPreview", AUTO_PREVIEW_DEFAULT)',
        "end",
        "",
        "local parts = {}",
        "for index, name in ipairs(names) do",
        '\tlocal part = model:FindFirstChild(name, true)',
        '\tassert(part and part:IsA("BasePart"), "Missing animated part: " .. name)',
        "\tparts[index] = part",
        "end",
        "",
        "local function frameCFrame(values)",
        "\tlocal x, y, z, w = values[4], values[5], values[6], values[7]",
        "\treturn CFrame.new(values[1], values[2], values[3],",
        "\t\t1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w),",
        "\t\t2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w),",
        "\t\t2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y))",
        "end",
        "",
        "local localFrames = {}",
        "for clipName, clip in pairs(clips) do",
        "\tlocal converted = {}",
        "\tfor frameIndex, frame in ipairs(clip.frames) do",
        "\t\tlocal transforms = {}",
        "\t\tfor partIndex, values in ipairs(frame[2]) do",
        "\t\t\ttransforms[partIndex] = {frameCFrame(values), values}",
        "\t\tend",
        "\t\tconverted[frameIndex] = {frame[1], transforms}",
        "\tend",
        "\tlocalFrames[clipName] = converted",
        "end",
        "",
        "local heartbeatConnection",
        "local motionConnection",
        "local destroyingConnection",
        "local previewThread",
        "local destroyed = false",
        'local state = "Idle"',
        "local activeClip = nil",
        "local elapsed = 0",
        "local resumeMove = false",
        "local transitionFrom = nil",
        "local transitionElapsed = 0",
        "",
        "local function applyTransform(partIndex, a, b, alpha)",
        "\tlocal part = parts[partIndex]",
        "\tlocal placement = model:GetPivot()",
        "\tlocal targetCFrame = a[1]:Lerp(b[1], alpha)",
        "\tlocal av, bv = a[2], b[2]",
        "\tlocal sx = math.max(EPSILON_SIZE, baseSizes[partIndex].X * (av[8] + (bv[8] - av[8]) * alpha))",
        "\tlocal sy = math.max(EPSILON_SIZE, baseSizes[partIndex].Y * (av[9] + (bv[9] - av[9]) * alpha))",
        "\tlocal sz = math.max(EPSILON_SIZE, baseSizes[partIndex].Z * (av[10] + (bv[10] - av[10]) * alpha))",
        "\tlocal targetSize = Vector3.new(sx, sy, sz)",
        "\tlocal targetTransparency = av[11] == 1 and (1 - baseOpacities[partIndex]) or 1",
        "\tif transitionFrom then",
        "\t\tlocal blend = math.clamp(transitionElapsed / TRANSITION_DURATION, 0, 1)",
        "\t\tlocal previous = transitionFrom[partIndex]",
        "\t\tpart.CFrame = placement * previous[1]:Lerp(targetCFrame, blend)",
        "\t\tpart.Size = previous[2]:Lerp(targetSize, blend)",
        "\t\tpart.Transparency = previous[3] + (targetTransparency - previous[3]) * blend",
        "\telse",
        "\t\tpart.CFrame = placement * targetCFrame",
        "\t\tpart.Size = targetSize",
        "\t\tpart.Transparency = targetTransparency",
        "\tend",
        "end",
        "",
        "local function applyFrame(clipName, frameIndex)",
        "\tlocal frame = localFrames[clipName][frameIndex]",
        "\tfor partIndex, transform in ipairs(frame[2]) do",
        "\t\tapplyTransform(partIndex, transform, transform, 0)",
        "\tend",
        "end",
        "",
        "local function restoreRest()",
        '\tapplyFrame("move", 1)',
        "end",
        "",
        "local function startClip(clipName, blendFromCurrent)",
        "\tif blendFromCurrent then",
        "\t\tlocal placement = model:GetPivot()",
        "\t\ttransitionFrom = {}",
        "\t\tfor partIndex, part in ipairs(parts) do",
        "\t\t\ttransitionFrom[partIndex] = {placement:ToObjectSpace(part.CFrame), part.Size, part.Transparency}",
        "\t\tend",
        "\t\ttransitionElapsed = 0",
        "\telse",
        "\t\ttransitionFrom = nil",
        "\tend",
        "\tactiveClip = clipName",
        "\telapsed = 0",
        "\tstate = clipName == \"move\" and \"Move\" or clipName == \"hit\" and \"Hit\" or \"Death\"",
        "\tif not blendFromCurrent then applyFrame(clipName, 1) end",
        "end",
        "",
        "local function reset()",
        "\tactiveClip = nil",
        "\telapsed = 0",
        "\tresumeMove = false",
        "\ttransitionFrom = nil",
        '\tstate = "Idle"',
        "\trestoreRest()",
        "end",
        "",
        "local function command(value)",
        "\tif destroyed or type(value) ~= \"string\" then return end",
        "\tlocal requested = string.lower(value)",
        "\tif requested == \"reset\" then",
        "\t\treset()",
        "\t\treturn",
        "\tend",
        "\tif state == \"Death\" or state == \"Dead\" then return end",
        "\tif requested == \"move\" then",
        "\t\tif state ~= \"Move\" then resumeMove = false; startClip(\"move\", false) end",
        "\telseif requested == \"hit\" then",
        "\t\tresumeMove = state == \"Move\" or resumeMove",
        "\t\tstartClip(\"hit\", true)",
        "\telseif requested == \"death\" then",
        "\t\tresumeMove = false",
        "\t\tstartClip(\"death\", true)",
        "\telseif requested == \"stop\" then",
        "\t\tactiveClip = nil",
        "\t\tresumeMove = false",
        "\t\ttransitionFrom = nil",
        '\t\tstate = "Stopped"',
        "\t\trestoreRest()",
        "\tend",
        "end",
        "",
        "heartbeatConnection = RunService.Heartbeat:Connect(function(dt)",
        "\tif destroyed or not activeClip then return end",
        "\tlocal clipName = activeClip",
        "\tlocal clip = clips[clipName]",
        "\telapsed += dt",
        "\tif transitionFrom then transitionElapsed += dt end",
        "\tif clip.looped then elapsed %= clip.duration else elapsed = math.min(elapsed, clip.duration) end",
        "\tlocal frames = localFrames[clipName]",
        "\tlocal frameIndex = math.min(math.floor(elapsed * 30) + 1, #frames)",
        "\tlocal followingIndex = math.min(frameIndex + 1, #frames)",
        "\tlocal current, following = frames[frameIndex], frames[followingIndex]",
        "\tlocal span = following[1] - current[1]",
        "\tlocal alpha = span > 0 and math.clamp((elapsed - current[1]) / span, 0, 1) or 0",
        "\tfor partIndex, a in ipairs(current[2]) do",
        "\t\tapplyTransform(partIndex, a, following[2][partIndex], alpha)",
        "\tend",
        "\tif transitionFrom and transitionElapsed >= TRANSITION_DURATION then transitionFrom = nil end",
        "\tif not clip.looped and elapsed >= clip.duration then",
        "\t\tif clipName == \"death\" then",
        "\t\t\tactiveClip = nil",
        '\t\t\tstate = "Dead"',
        "\t\telseif clipName == \"hit\" and resumeMove then",
        "\t\t\tresumeMove = false",
        "\t\t\tstartClip(\"move\", false)",
        "\t\telse",
        "\t\t\tactiveClip = nil",
        '\t\t\tstate = "Idle"',
        "\t\t\trestoreRest()",
        "\t\tend",
        "\tend",
        "end)",
        "",
        "motionConnection = motion.Event:Connect(command)",
        "destroyingConnection = model.Destroying:Connect(function()",
        "\tdestroyed = true",
        "\tif heartbeatConnection then heartbeatConnection:Disconnect() end",
        "\tif motionConnection then motionConnection:Disconnect() end",
        "\tif destroyingConnection then destroyingConnection:Disconnect() end",
        "\tif previewThread then task.cancel(previewThread) end",
        "end)",
        "",
        'if model:GetAttribute("AutoPreview") then',
        "\tpreviewThread = task.spawn(function()",
        "\t\twhile not destroyed do",
        "\t\t\tcommand(\"Reset\"); command(\"Move\"); task.wait(1.8)",
        "\t\t\tcommand(\"Hit\"); task.wait(0.9)",
        "\t\t\tcommand(\"Move\"); task.wait(1.8)",
        "\t\t\tcommand(\"Death\"); task.wait(2.0)",
        "\t\t\tcommand(\"Reset\"); task.wait(0.8)",
        "\t\tend",
        "\tend)",
        "end",
    ])
    return "\n".join(lines) + "\n"


def shift_native_parts(model: ET.Element, offset: tuple[float, float, float]) -> None:
    for item in model.iter("Item"):
        if item.attrib.get("class") not in PART_CLASSES:
            continue
        position, matrix = read_cframe(item)
        position = [position[index] + offset[index] for index in range(3)]
        write_cframe(property_node(item, "CoordinateFrame", "CFrame"), position, matrix)
        position_node = item.find('./Properties/Vector3[@name="Position"]')
        if position_node is not None:
            for axis, value in zip(("X", "Y", "Z"), position):
                position_node.find(axis).text = fmt(value)


def prefix_referents(model: ET.Element, prefix: str) -> None:
    mapping = {}
    for item in model.iter("Item"):
        old = item.attrib.get("referent")
        if old is None:
            fail("Item has no referent")
        mapping[old] = prefix + old
        item.attrib["referent"] = mapping[old]
    for ref in model.iter("Ref"):
        if ref.text in mapping:
            ref.text = mapping[ref.text]


def build_model(native_path: Path, animation: dict, auto_preview: bool, offset: tuple[float, float, float]) -> ET.Element:
    tree, model, _ = load_native(native_path)
    root = tree.getroot()
    shift_native_parts(model, offset)
    allocate = next_referent(root)
    add_auto_preview_attribute(model, auto_preview)
    add_motion_root(model, offset, allocate)
    event = ET.SubElement(model, "Item", {"class": "BindableEvent", "referent": allocate()})
    add_name_properties(event, "Motion")
    script = ET.SubElement(model, "Item", {"class": "Script", "referent": allocate()})
    properties = add_name_properties(script, "MotionPlayback")
    ET.SubElement(properties, "bool", {"name": "Disabled"}).text = "false"
    ET.SubElement(properties, "ProtectedString", {"name": "Source"}).text = build_script(animation, auto_preview)
    return model


def document_with(model: ET.Element) -> ET.Element:
    root = ET.Element("roblox", {"version": "4"})
    ET.SubElement(root, "External").text = "null"
    ET.SubElement(root, "External").text = "nil"
    root.append(model)
    return root


def write_xml(path: Path, root: ET.Element) -> None:
    ET.indent(root, space="  ")
    ET.ElementTree(root).write(path, encoding="utf-8", xml_declaration=True)


def decode_auto_preview(model: ET.Element) -> bool:
    raw = base64.b64decode(property_node(model, "BinaryString", "AttributesSerialize").text or "", validate=True)
    count, length = struct.unpack_from("<II", raw)
    offset = 8
    name = raw[offset:offset + length].decode("utf-8")
    offset += length
    if count != 1 or name != "AutoPreview" or len(raw) != offset + 2 or raw[offset] != 3:
        fail("invalid AutoPreview attribute")
    return bool(raw[offset + 1])


def validate_referents(root: ET.Element, label: str) -> None:
    items = list(root.iter("Item"))
    refs = [item.attrib.get("referent") for item in items]
    if None in refs or len(refs) != len(set(refs)):
        fail(f"{label}: Item referents must exist and be unique")
    valid = set(refs)
    for ref in root.iter("Ref"):
        if ref.text not in valid and ref.text not in (None, "null"):
            fail(f"{label}: dangling Ref {ref.text}")


def validate_model(model: ET.Element, native_path: Path, animation: dict, auto_preview: bool, offset: tuple[float, float, float]) -> dict:
    _, native_model, native = load_native(native_path)
    actual = model_parts(model)
    if set(actual) != set(native):
        fail(f"{animation['id']}: output contains missing or duplicate animated parts")
    for name, source in native.items():
        target = actual[name]
        expected_position = [source["position"][axis] + offset[axis] for axis in range(3)]
        if target["group"] != source["group"] or not close(target["position"], expected_position):
            fail(f"{animation['id']}: output transform/group differs for {name}")
        for key in ("size", "color"):
            if not close(target[key], source[key], 2e-6):
                fail(f"{animation['id']}: output {key} differs for {name}")
        if not matrix_close(target["matrix"], source["matrix"]) or abs(target["opacity"] - source["opacity"]) > 2e-6:
            fail(f"{animation['id']}: output rotation/opacity differs for {name}")
        if target["material"] != source["material"] or target["shape"] != source["shape"]:
            fail(f"{animation['id']}: output material/shape differs for {name}")
        if target["anchored"] != "true" or target["canCollide"] != "false":
            fail(f"{animation['id']}: {name} must be anchored and non-colliding")
    root_parts = [item for item in model.findall('./Item[@class="Part"]') if item_name(item) == ROOT_PART_NAME]
    events = [item for item in model.findall('./Item[@class="BindableEvent"]') if item_name(item) == "Motion"]
    scripts = [item for item in model.findall('./Item[@class="Script"]') if item_name(item) == "MotionPlayback"]
    if len(root_parts) != 1 or len(events) != 1 or len(scripts) != 1:
        fail(f"{animation['id']}: expected one MotionRoot, Motion event, and MotionPlayback script")
    root_part = root_parts[0]
    if property_node(root_part, "bool", "Anchored").text != "true" or property_node(root_part, "bool", "CanCollide").text != "false":
        fail(f"{animation['id']}: MotionRoot physics properties differ")
    root_position, root_matrix = read_cframe(root_part)
    if not close(root_position, list(offset)) or not matrix_close(root_matrix, [[1, 0, 0], [0, 1, 0], [0, 0, 1]]):
        fail(f"{animation['id']}: MotionRoot placement differs")
    if abs(float(property_node(root_part, "float", "Transparency").text or "0") - 1.0) > 1e-9:
        fail(f"{animation['id']}: MotionRoot must be invisible")
    primary = property_node(model, "Ref", "PrimaryPart").text
    if primary != root_part.attrib["referent"]:
        fail(f"{animation['id']}: MotionRoot is not PrimaryPart")
    if decode_auto_preview(model) is not auto_preview:
        fail(f"{animation['id']}: AutoPreview differs")
    source = property_node(scripts[0], "ProtectedString", "Source").text or ""
    if source != build_script(animation, auto_preview):
        fail(f"{animation['id']}: embedded script/frames differ from JSON")
    required = (
        'model:WaitForChild("Motion")', "model:GetPivot()", "placement:ToObjectSpace(part.CFrame)", "EPSILON_SIZE",
        'requested == "move"', 'requested == "hit"', 'requested == "death"', 'requested == "stop"',
        'requested == "reset"', 'state == "Death" or state == "Dead"', "task.cancel(previewThread)",
        "heartbeatConnection:Disconnect()", "motionConnection:Disconnect()", "model.Destroying:Connect",
    )
    if any(marker not in source for marker in required):
        fail(f"{animation['id']}: playback behavior marker missing")
    if source.count("RunService.Heartbeat:Connect") != 1 or source.count("motion.Event:Connect") != 1:
        fail(f"{animation['id']}: playback creates more than one runtime connection")
    attachments_before = [(item_name(item), item.attrib.get("class")) for item in native_model.iter("Item") if item.attrib.get("class") == "Attachment"]
    attachments_after = [(item_name(item), item.attrib.get("class")) for item in model.iter("Item") if item.attrib.get("class") == "Attachment"]
    if attachments_after != attachments_before:
        fail(f"{animation['id']}: native attachments changed")
    return {
        "id": animation["id"],
        "parts": len(native),
        "clips": {key: len(animation["clips"][key]["frames"]) for key in CLIP_SPECS},
        "autoPreview": auto_preview,
        "nativePropertiesExact": True,
        "scriptDataConsistent": True,
        "motionRootPrimaryPart": True,
        "singleHeartbeat": True,
        "destroyCleanup": True,
        "noEffectPartsAdded": True,
    }


def validate_file(path: Path, native_path: Path, animation: dict, auto_preview: bool, offset: tuple[float, float, float]) -> dict:
    root = ET.parse(path).getroot()
    validate_referents(root, path.name)
    models = root.findall("./Item")
    if len(models) != 1:
        fail(f"{path.name}: expected one root model")
    return validate_model(models[0], native_path, animation, auto_preview, offset)


def validate_demo(path: Path, animations: list[dict]) -> dict:
    root = ET.parse(path).getroot()
    validate_referents(root, path.name)
    pack = root.find("./Item")
    if pack is None or item_name(pack) != "Pupsters_Enemy_Motions_Demo":
        fail("combined demo root differs")
    models = pack.findall('./Item[@class="Model"]')
    if len(models) != len(EXPECTED):
        fail("combined demo model count differs")
    results = []
    for model, (entry, native_name), animation, offset in zip(models, EXPECTED, animations, PACK_OFFSETS):
        if animation["id"] != entry:
            fail("combined demo order differs")
        results.append(validate_model(model, NATIVE / native_name, animation, True, offset))
    return {"models": len(models), "layout": "3x3 at 7-stud spacing", "autoPreview": True, "uniqueReferents": True}


def main() -> None:
    missing = [entry for entry, _ in EXPECTED if not (ANIMATIONS / f"{entry}.json").is_file()]
    if missing:
        fail("missing animation JSON: " + ", ".join(missing))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    animations = []
    results = []
    for entry, native_name in EXPECTED:
        native_path = NATIVE / native_name
        _, _, native = load_native(native_path)
        animation = load_animation(ANIMATIONS / f"{entry}.json", entry, native)
        animations.append(animation)
        path = OUTPUT / f"{entry}-motions.rbxmx"
        write_xml(path, document_with(build_model(native_path, animation, False, (0.0, 0.0, 0.0))))
        results.append(validate_file(path, native_path, animation, False, (0.0, 0.0, 0.0)))

    demo_root = ET.Element("roblox", {"version": "4"})
    ET.SubElement(demo_root, "External").text = "null"
    ET.SubElement(demo_root, "External").text = "nil"
    pack = ET.SubElement(demo_root, "Item", {"class": "Model", "referent": "DEMO_PACK"})
    add_name_properties(pack, "Pupsters_Enemy_Motions_Demo")
    for (entry, native_name), animation, offset in zip(EXPECTED, animations, PACK_OFFSETS):
        model = build_model(NATIVE / native_name, animation, True, offset)
        prefix_referents(model, entry + "_")
        pack.append(model)
    demo_path = OUTPUT / "Pupsters-Enemy-Motions-Demo.rbxmx"
    write_xml(demo_path, demo_root)
    demo_result = validate_demo(demo_path, animations)

    report = {
        "passed": True,
        "models": results,
        "demo": demo_result,
        "robloxStudioTested": False,
        "luauRuntimeCheck": "not run (Luau CLI unavailable)" if shutil.which("luau") is None else "not run (Roblox APIs unavailable)",
        "scope": "Visual playback via BindableEvent; no damage, targeting, RemoteEvents, or AnimationTrack.",
    }
    (OUTPUT / "validation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
