#!/usr/bin/env python3
"""Bake sitting-attack JSON into self-playing Roblox XML models."""
from __future__ import annotations

import base64
import json
import math
from pathlib import Path
import shutil
import struct
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
ANIMATIONS = ROOT / "animations"
OUTPUT = ROOT / "roblox"
PART_CLASSES = {"Part", "WedgePart"}
SURFACES = ("TopSurface", "BottomSurface", "LeftSurface", "RightSurface", "FrontSurface", "BackSurface")
PART_TYPES = {"box", "sphere"}
SCRIPT_MARKERS = (
    'script.Parent:GetAttribute("AutoPreview")',
    "RunService.Heartbeat:Connect",
    "baseAnchor:Inverse()",
    ":Lerp(nextCFrame",
    "currentSize:Lerp(nextSize",
    "part.Transparency = visible and 0 or 1",
    "part.CFrame = state.cframe",
    "part.Size = state.size",
    "part.Transparency = state.transparency",
    "if playing or destroyed then",
    "model.Destroying:Connect",
)


def fail(message: str) -> None:
    raise ValueError(message)


def number(value: object, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        fail(f"{label} must be a finite number")
    return float(value)


def vector(value: object, length: int, label: str, *, positive: bool = False) -> list[float]:
    if not isinstance(value, list) or len(value) != length:
        fail(f"{label} must contain {length} numbers")
    result = [number(component, f"{label}[{index}]") for index, component in enumerate(value)]
    if positive and any(component <= 0 for component in result):
        fail(f"{label} must be positive")
    return result


def fmt(value: float) -> str:
    value = 0.0 if abs(value) < 5e-13 else value
    return format(value, ".10g")


def lua_string(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'


def item_name(item: ET.Element) -> str:
    node = item.find('./Properties/string[@name="Name"]')
    if node is None or not node.text:
        fail(f'{item.attrib.get("class", "Item")} has no Name')
    return node.text


def property_node(item: ET.Element, tag: str, name: str) -> ET.Element:
    node = item.find(f'./Properties/{tag}[@name="{name}"]')
    if node is None:
        fail(f"{item_name(item)} has no {name}")
    return node


def read_xyz(node: ET.Element, axes: tuple[str, ...] = ("X", "Y", "Z")) -> list[float]:
    return [float(node.findtext(axis)) for axis in axes]


def read_cframe(item: ET.Element) -> tuple[list[float], list[list[float]]]:
    node = property_node(item, "CoordinateFrame", "CFrame")
    position = read_xyz(node)
    matrix = [[float(node.findtext(f"R{row}{column}")) for column in range(3)] for row in range(3)]
    return position, matrix


def write_cframe(node: ET.Element, position: list[float], matrix: list[list[float]]) -> None:
    for axis, value in zip(("X", "Y", "Z"), position):
        node.find(axis).text = fmt(value)
    for row in range(3):
        for column in range(3):
            node.find(f"R{row}{column}").text = fmt(matrix[row][column])


def quaternion_matrix(quaternion: list[float]) -> list[list[float]]:
    x, y, z, w = quaternion
    length = math.sqrt(x * x + y * y + z * z + w * w)
    if abs(length - 1) > 1e-5:
        fail(f"quaternion is not unit length: {length}")
    x, y, z, w = (component / length for component in (x, y, z, w))
    return [
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ]


def close(a: list[float], b: list[float], tolerance: float = 1e-6) -> bool:
    return len(a) == len(b) and all(abs(x - y) <= tolerance for x, y in zip(a, b))


def matrix_close(a: list[list[float]], b: list[list[float]]) -> bool:
    return all(close(row_a, row_b) for row_a, row_b in zip(a, b))


def native_parts(top: ET.Element) -> tuple[dict[str, dict], ET.Element]:
    result: dict[str, dict] = {}
    fx_group = None
    for group in top.findall('./Item[@class="Model"]'):
        group_name = item_name(group)
        if group_name == "FX":
            fx_group = group
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
            }
    if fx_group is None:
        fail("native model has no FX group")
    return result, fx_group


def load_animation(path: Path, expected_id: str, native: dict[str, dict]) -> dict:
    raw = json.loads(path.read_text(encoding="utf-8"))
    for key in ("id", "displayName", "attackName", "description", "duration", "fps", "release", "parts", "frames"):
        if key not in raw:
            fail(f"{path.name}: missing {key}")
    if raw["id"] != expected_id:
        fail(f"{path.name}: id must be {expected_id}")
    for key in ("displayName", "attackName", "description"):
        if not isinstance(raw[key], str) or not raw[key].strip():
            fail(f"{path.name}: {key} must be a non-empty string")
    duration = number(raw["duration"], f"{path.name}.duration")
    fps = number(raw["fps"], f"{path.name}.fps")
    release = number(raw["release"], f"{path.name}.release")
    if abs(duration - 2) > 1e-9 or abs(fps - 30) > 1e-9 or not 0 <= release <= duration:
        fail(f"{path.name}: expected duration=2, fps=30, and release within duration")
    if not isinstance(raw["parts"], list) or not raw["parts"]:
        fail(f"{path.name}: parts must be non-empty")

    parts = []
    names = set()
    for index, part in enumerate(raw["parts"]):
        label = f"{path.name}.parts[{index}]"
        if not isinstance(part, dict):
            fail(f"{label} must be an object")
        name, group, kind = part.get("name"), part.get("group"), part.get("type")
        if not isinstance(name, str) or not name or name in names:
            fail(f"{label}.name must be non-empty and unique")
        if not isinstance(group, str) or not group:
            fail(f"{label}.group must be non-empty")
        if kind not in PART_TYPES:
            fail(f"{label}.type must be box or sphere")
        names.add(name)
        quaternion = vector(part.get("quaternion"), 4, f"{label}.quaternion")
        quaternion_matrix(quaternion)
        color = vector(part.get("color"), 3, f"{label}.color")
        if any(component < 0 or component > 1 for component in color):
            fail(f"{label}.color must be within 0..1")
        if not isinstance(part.get("emissive"), bool) or not isinstance(part.get("isEffect"), bool):
            fail(f"{label}.emissive and isEffect must be booleans")
        parts.append({
            "name": name,
            "group": group,
            "type": kind,
            "size": vector(part.get("size"), 3, f"{label}.size", positive=True),
            "color": color,
            "emissive": part["emissive"],
            "position": vector(part.get("position"), 3, f"{label}.position"),
            "quaternion": quaternion,
            "isEffect": part["isEffect"],
        })

    static_names = {part["name"] for part in parts if not part["isEffect"]}
    if static_names != set(native):
        missing, extra = sorted(set(native) - static_names), sorted(static_names - set(native))
        fail(f"{path.name}: non-effect names differ from native; missing={missing}, extra={extra}")
    if {part["name"] for part in parts if part["isEffect"]} & set(native):
        fail(f"{path.name}: effect names collide with native parts")

    expected_frames = round(duration * fps) + 1
    if not isinstance(raw["frames"], list) or len(raw["frames"]) != expected_frames:
        fail(f"{path.name}: expected {expected_frames} frames")
    frames = []
    for frame_index, frame in enumerate(raw["frames"]):
        label = f"{path.name}.frames[{frame_index}]"
        if not isinstance(frame, dict) or set(frame) != {"time", "transforms"}:
            fail(f"{label} must contain only time and transforms")
        time = number(frame["time"], f"{label}.time")
        if abs(time - frame_index / fps) > 1e-6:
            fail(f"{label}.time is off the {int(fps)} fps grid")
        if not isinstance(frame["transforms"], list) or len(frame["transforms"]) != len(parts):
            fail(f"{label}.transforms count differs from parts")
        transforms = []
        for part_index, transform in enumerate(frame["transforms"]):
            values = vector(transform, 11, f"{label}.transforms[{part_index}]")
            quaternion_matrix(values[3:7])
            if any(scale <= 0 for scale in values[7:10]) or values[10] not in (0, 1):
                fail(f"{label}.transforms[{part_index}] has invalid scale or visibility")
            transforms.append(values)
        frames.append({"time": time, "transforms": transforms})

    first = frames[0]["transforms"]
    for index, part in enumerate(parts):
        transform = first[index]
        if part["isEffect"]:
            if transform[10] != 0:
                fail(f"{path.name}: effect {part['name']} must be hidden at time zero")
            continue
        if not close(transform[:3], part["position"]) or not matrix_close(quaternion_matrix(transform[3:7]), quaternion_matrix(part["quaternion"])):
            fail(f"{path.name}: first frame pose differs for {part['name']}")
        if not close(transform[7:10], [1, 1, 1]):
            fail(f"{path.name}: first frame scale differs for {part['name']}")
        source = native[part["name"]]
        if part["group"] != source["group"] or not close(part["position"], source["position"]):
            fail(f"{path.name}: static position/group differs for {part['name']}")
        if not close(part["size"], source["size"]) or not close(part["color"], source["color"], 2e-6):
            fail(f"{path.name}: static size/color differs for {part['name']}")
        if not matrix_close(quaternion_matrix(part["quaternion"]), source["matrix"]):
            fail(f"{path.name}: static rotation differs for {part['name']}")
        if transform[10] != 1:
            fail(f"{path.name}: native part {part['name']} must be visible at time zero")

    paws = [index for index, part in enumerate(parts) if not part["isEffect"] and part["name"].endswith("_Paw")]
    if len(paws) != 4:
        fail(f"{path.name}: expected exactly four paws")
    for part_index in paws:
        planted = frames[0]["transforms"][part_index]
        if any(not close(frame["transforms"][part_index], planted) for frame in frames[1:]):
            fail(f"{path.name}: {parts[part_index]['name']} is not stationary")
    raw["duration"], raw["fps"], raw["release"] = duration, fps, release
    raw["parts"], raw["frames"] = parts, frames
    raw["anchorIndex"] = paws[0]
    return raw


def bool_attribute(name: str, value: bool) -> str:
    encoded = struct.pack("<I", 1) + struct.pack("<I", len(name)) + name.encode("utf-8") + bytes((3, int(value)))
    return base64.b64encode(encoded).decode("ascii")


def add_auto_preview_attribute(model: ET.Element, value: bool) -> None:
    properties = model.find("Properties")
    if properties is None:
        fail("model has no Properties")
    old = properties.find('./BinaryString[@name="AttributesSerialize"]')
    if old is not None:
        properties.remove(old)
    ET.SubElement(properties, "BinaryString", {"name": "AttributesSerialize"}).text = bool_attribute("AutoPreview", value)


def next_referent(root: ET.Element):
    values = []
    for item in root.iter("Item"):
        value = item.attrib.get("referent", "")
        if value.startswith("RBX") and value[3:].isdigit():
            values.append(int(value[3:]))
    current = max(values, default=0)

    def allocate() -> str:
        nonlocal current
        current += 1
        return f"RBX{current}"

    return allocate


def add_properties(item: ET.Element, name: str) -> ET.Element:
    properties = ET.SubElement(item, "Properties")
    ET.SubElement(properties, "string", {"name": "Name"}).text = name
    return properties


def add_effect_part(fx_group: ET.Element, part: dict, transform: list[float], allocate) -> None:
    item = ET.SubElement(fx_group, "Item", {"class": "Part", "referent": allocate()})
    properties = ET.SubElement(item, "Properties")
    ET.SubElement(properties, "bool", {"name": "Anchored"}).text = "true"
    ET.SubElement(properties, "bool", {"name": "CanCollide"}).text = "false"
    cf = ET.SubElement(properties, "CoordinateFrame", {"name": "CFrame"})
    for key in ("X", "Y", "Z", "R00", "R01", "R02", "R10", "R11", "R12", "R20", "R21", "R22"):
        ET.SubElement(cf, key)
    write_cframe(cf, transform[:3], quaternion_matrix(transform[3:7]))
    color = ET.SubElement(properties, "Color3", {"name": "Color"})
    for axis, value in zip(("R", "G", "B"), part["color"]):
        ET.SubElement(color, axis).text = fmt(value)
    ET.SubElement(properties, "token", {"name": "Material"}).text = "288" if part["emissive"] else "272"
    ET.SubElement(properties, "string", {"name": "Name"}).text = part["name"]
    ET.SubElement(properties, "token", {"name": "Shape"}).text = "0" if part["type"] == "sphere" else "1"
    for surface in SURFACES:
        ET.SubElement(properties, "token", {"name": surface}).text = "0"
    size = ET.SubElement(properties, "Vector3", {"name": "size"})
    for axis, base, scale in zip(("X", "Y", "Z"), part["size"], transform[7:10]):
        ET.SubElement(size, axis).text = fmt(base * scale)
    ET.SubElement(properties, "float", {"name": "Transparency"}).text = "0" if transform[10] else "1"


def lua_frame(frame: dict) -> str:
    transforms = ["{" + ",".join(fmt(value) for value in transform) + "}" for transform in frame["transforms"]]
    return "\t{" + fmt(frame["time"]) + ",{" + ",".join(transforms) + "}},"


def build_script(animation: dict, auto_preview: bool) -> str:
    names = ",".join(lua_string(part["name"]) for part in animation["parts"])
    sizes = ",".join(
        f"Vector3.new({fmt(part['size'][0])},{fmt(part['size'][1])},{fmt(part['size'][2])})"
        for part in animation["parts"]
    )
    return "\n".join([
        "-- Generated PUPSTERS sitting attack playback. No damage, targeting, or RemoteEvents.",
        'local RunService = game:GetService("RunService")',
        "local model = script.Parent",
        'local attack = model:WaitForChild("Attack")',
        f"local AUTO_PREVIEW_DEFAULT = {str(auto_preview).lower()}",
        f"local DURATION = {fmt(animation['duration'])}",
        f"local RELEASE_TIME = {fmt(animation['release'])}",
        f"local anchorIndex = {animation['anchorIndex'] + 1}",
        f"local names = {{{names}}}",
        f"local baseSizes = {{{sizes}}}",
        "local frames = {",
        *[lua_frame(frame) for frame in animation["frames"]],
        "}",
        "",
        'if model:GetAttribute("AutoPreview") == nil then',
        '\tmodel:SetAttribute("AutoPreview", AUTO_PREVIEW_DEFAULT)',
        "end",
        "",
        "local parts = {}",
        "for index, name in ipairs(names) do",
        "\tlocal part = model:FindFirstChild(name, true)",
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
        "local heartbeatConnection",
        "local attackConnection",
        "local destroyingConnection",
        "local playing = false",
        "local destroyed = false",
        "",
        "local function disconnectHeartbeat()",
        "\tif heartbeatConnection then",
        "\t\theartbeatConnection:Disconnect()",
        "\t\theartbeatConnection = nil",
        "\tend",
        "end",
        "",
        "local function play()",
        "\tif playing or destroyed then",
        "\t\treturn",
        "\tend",
        "\tplaying = true",
        "\tlocal reset = {}",
        "\tfor index, part in ipairs(parts) do",
        "\t\treset[index] = { cframe = part.CFrame, size = part.Size, transparency = part.Transparency }",
        "\tend",
        "\tlocal baseAnchor = frameCFrame(frames[1][2][anchorIndex])",
        "\tlocal placement = parts[anchorIndex].CFrame * baseAnchor:Inverse()",
        "\tlocal elapsed = 0",
        "\tlocal frameIndex = 1",
        "",
        "\tlocal function restore()",
        "\t\tfor index, part in ipairs(parts) do",
        "\t\t\tlocal state = reset[index]",
        "\t\t\tif part.Parent then",
        "\t\t\t\tpart.CFrame = state.cframe",
        "\t\t\t\tpart.Size = state.size",
        "\t\t\t\tpart.Transparency = state.transparency",
        "\t\t\tend",
        "\t\tend",
        "\tend",
        "",
        "\theartbeatConnection = RunService.Heartbeat:Connect(function(dt)",
        "\t\telapsed = math.min(elapsed + dt, DURATION)",
        "\t\twhile frameIndex < #frames - 1 and elapsed >= frames[frameIndex + 1][1] do",
        "\t\t\tframeIndex += 1",
        "\t\tend",
        "\t\tlocal current = frames[frameIndex]",
        "\t\tlocal following = frames[math.min(frameIndex + 1, #frames)]",
        "\t\tlocal span = following[1] - current[1]",
        "\t\tlocal alpha = span > 0 and math.clamp((elapsed - current[1]) / span, 0, 1) or 0",
        "\t\tfor index, part in ipairs(parts) do",
        "\t\t\tlocal a, b = current[2][index], following[2][index]",
        "\t\t\tlocal currentCFrame = placement * frameCFrame(a)",
        "\t\t\tlocal nextCFrame = placement * frameCFrame(b)",
        "\t\t\tpart.CFrame = currentCFrame:Lerp(nextCFrame, alpha)",
        "\t\t\tlocal currentSize = Vector3.new(baseSizes[index].X * a[8], baseSizes[index].Y * a[9], baseSizes[index].Z * a[10])",
        "\t\t\tlocal nextSize = Vector3.new(baseSizes[index].X * b[8], baseSizes[index].Y * b[9], baseSizes[index].Z * b[10])",
        "\t\t\tpart.Size = currentSize:Lerp(nextSize, alpha)",
        "\t\t\tlocal visible = a[11] == 1",
        "\t\t\tpart.Transparency = visible and 0 or 1",
        "\t\tend",
        "\t\tif elapsed >= DURATION then",
        "\t\t\tdisconnectHeartbeat()",
        "\t\t\trestore()",
        "\t\t\tplaying = false",
        '\t\t\tif not destroyed and script.Parent:GetAttribute("AutoPreview") then',
        "\t\t\t\ttask.delay(0.45, play)",
        "\t\t\tend",
        "\t\tend",
        "\tend)",
        "end",
        "",
        "attackConnection = attack.Event:Connect(play)",
        "destroyingConnection = model.Destroying:Connect(function()",
        "\tdestroyed = true",
        "\tdisconnectHeartbeat()",
        "\tif attackConnection then attackConnection:Disconnect() end",
        "\tif destroyingConnection then destroyingConnection:Disconnect() end",
        "end)",
        "",
        'if script.Parent:GetAttribute("AutoPreview") then',
        "\ttask.defer(play)",
        "end",
        "",
        "-- RELEASE_TIME is baked for gameplay integration metadata; this visual player applies no hit logic.",
    ])


def shift_model(model: ET.Element, x: float, z: float) -> None:
    for item in model.iter("Item"):
        if item.attrib.get("class") not in PART_CLASSES:
            continue
        position, matrix = read_cframe(item)
        position[0] += x
        position[2] += z
        write_cframe(property_node(item, "CoordinateFrame", "CFrame"), position, matrix)


def prefix_referents(model: ET.Element, prefix: str) -> None:
    mapping = {}
    for item in model.iter("Item"):
        old = item.attrib["referent"]
        mapping[old] = prefix + old
        item.attrib["referent"] = mapping[old]
    for ref in model.iter("Ref"):
        if ref.text in mapping:
            ref.text = mapping[ref.text]


def build_model(native_path: Path, animation: dict, auto_preview: bool, offset: tuple[float, float]) -> ET.Element:
    root = ET.parse(native_path).getroot()
    models = root.findall("Item")
    if len(models) != 1:
        fail(f"{native_path.name}: expected one root model")
    model = models[0]
    _, fx_group = native_parts(model)
    allocate = next_referent(root)
    first = animation["frames"][0]["transforms"]
    for index, part in enumerate(animation["parts"]):
        if part["isEffect"]:
            add_effect_part(fx_group, part, first[index], allocate)
    add_auto_preview_attribute(model, auto_preview)
    event = ET.SubElement(model, "Item", {"class": "BindableEvent", "referent": allocate()})
    add_properties(event, "Attack")
    script = ET.SubElement(model, "Item", {"class": "Script", "referent": allocate()})
    properties = add_properties(script, "AttackPlayback")
    ET.SubElement(properties, "bool", {"name": "Disabled"}).text = "false"
    ET.SubElement(properties, "ProtectedString", {"name": "Source"}).text = build_script(animation, auto_preview)
    shift_model(model, *offset)
    return model


def document_with(model: ET.Element) -> ET.Element:
    root = ET.Element("roblox", {"version": "4"})
    ET.SubElement(root, "External").text = "null"
    ET.SubElement(root, "External").text = "nil"
    root.append(model)
    return root


def write_xml(path: Path, root: ET.Element) -> None:
    ET.indent(root)
    ET.ElementTree(root).write(path, encoding="utf-8", xml_declaration=True)


def decode_bool_attribute(model: ET.Element) -> bool:
    node = property_node(model, "BinaryString", "AttributesSerialize")
    raw = base64.b64decode(node.text, validate=True)
    count, length = struct.unpack_from("<II", raw)
    offset = 8
    name = raw[offset:offset + length].decode("utf-8")
    offset += length
    if count != 1 or name != "AutoPreview" or raw[offset] != 3 or len(raw) != offset + 2:
        fail("invalid AutoPreview attribute encoding")
    return bool(raw[offset + 1])


def script_source(model: ET.Element) -> str:
    scripts = model.findall('./Item[@class="Script"]')
    events = model.findall('./Item[@class="BindableEvent"]')
    if len(scripts) != 1 or len(events) != 1 or item_name(events[0]) != "Attack":
        fail(f"{item_name(model)} must contain one Attack event and one Script")
    source = property_node(scripts[0], "ProtectedString", "Source").text or ""
    if any(marker not in source for marker in SCRIPT_MARKERS):
        fail(f"{item_name(model)} playback script is missing a required behavior")
    banned = ('Instance.new("RemoteEvent")', "TakeDamage", ":Destroy()", "ClearAllChildren")
    if any(token in source for token in banned):
        fail(f"{item_name(model)} playback script contains forbidden behavior")
    if source.count("(") != source.count(")") or source.count("{") != source.count("}"):
        fail(f"{item_name(model)} playback script delimiters are unbalanced")
    return source


def validate_model(path: Path, animation: dict, auto_preview: bool) -> dict:
    root = ET.parse(path).getroot()
    items = list(root.iter("Item"))
    refs = [item.attrib.get("referent") for item in items]
    if None in refs or len(refs) != len(set(refs)):
        fail(f"{path.name}: item referents are not unique")
    models = root.findall("Item")
    if len(models) != 1:
        fail(f"{path.name}: expected one root model")
    model = models[0]
    if decode_bool_attribute(model) is not auto_preview:
        fail(f"{path.name}: AutoPreview differs")
    source = script_source(model)
    if f"local AUTO_PREVIEW_DEFAULT = {str(auto_preview).lower()}" not in source:
        fail(f"{path.name}: script AutoPreview default differs")
    if source.count("\n\t{") != len(animation["frames"]):
        fail(f"{path.name}: baked frame count differs")
    if f"local DURATION = {fmt(animation['duration'])}" not in source or f"local RELEASE_TIME = {fmt(animation['release'])}" not in source:
        fail(f"{path.name}: baked timing differs")
    part_names = [item_name(item) for item in items if item.attrib.get("class") in PART_CLASSES]
    expected = [part["name"] for part in animation["parts"]]
    if set(part_names) != set(expected) or len(part_names) != len(expected):
        fail(f"{path.name}: authored part names differ from animation")
    mouths = [item for item in items if item.attrib.get("class") == "Attachment" and item_name(item) == "Mouth"]
    if len(mouths) != 1:
        fail(f"{path.name}: existing Mouth attachment was not preserved")
    return {
        "file": str(path.relative_to(ROOT)).replace("\\", "/"),
        "parts": len(part_names),
        "effectParts": sum(part["isEffect"] for part in animation["parts"]),
        "frames": len(animation["frames"]),
        "duration": animation["duration"],
        "fps": animation["fps"],
        "release": animation["release"],
        "autoPreview": auto_preview,
        "uniqueReferents": True,
        "attackEvent": True,
        "mouthAttachmentPreserved": True,
        "anchorPlacement": "LegFL_Paw",
        "heartbeatInterpolation": True,
        "resetAfterEnd": True,
        "retriggerGuard": True,
        "destroyingCleanup": True,
        "playbackScriptStaticChecks": True,
        "fourPawsStationary": True,
    }


def validate_demo(path: Path, entries: list[dict], animations: list[dict]) -> dict:
    root = ET.parse(path).getroot()
    items = list(root.iter("Item"))
    refs = [item.attrib.get("referent") for item in items]
    if None in refs or len(refs) != len(set(refs)):
        fail("combined demo referents are not unique")
    pack = root.find("Item")
    if pack is None or item_name(pack) != "Pupsters_Sitting_Attacks_Demo":
        fail("combined demo root model differs")
    models = pack.findall("Item")
    if len(models) != 6:
        fail("combined demo must contain six models")
    for index, (model, entry, animation) in enumerate(zip(models, entries, animations)):
        if item_name(model) != entry["displayName"] or not decode_bool_attribute(model):
            fail(f"combined demo model {entry['id']} differs")
        script_source(model)
        parts, _ = native_parts(model)
        anchor = parts[animation["parts"][animation["anchorIndex"]]["name"]]
        expected = [(index % 3 - 1) * 6, (index // 3) * 6]
        base = animation["frames"][0]["transforms"][animation["anchorIndex"]]
        if not close([anchor["position"][0] - base[0], anchor["position"][2] - base[2]], expected):
            fail(f"combined demo model {entry['id']} has the wrong grid translation")
    return {
        "file": str(path.relative_to(ROOT)).replace("\\", "/"),
        "models": 6,
        "layout": "3x2 at 6-stud spacing",
        "autoPreview": True,
        "uniqueReferents": True,
    }


def main() -> None:
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    entries = manifest["models"]
    if len(entries) != 6 or [entry["id"] for entry in entries] != [f"D{index:02d}" for index in range(1, 7)]:
        fail("manifest must contain D01 through D06")
    OUTPUT.mkdir(parents=True, exist_ok=True)

    animations = []
    results = []
    for entry in entries:
        native_root = ET.parse(ROOT / entry["native"]).getroot()
        native_model = native_root.find("Item")
        if native_model is None:
            fail(f"{entry['native']}: root model missing")
        native, _ = native_parts(native_model)
        animation = load_animation(ANIMATIONS / f"{entry['id']}.json", entry["id"], native)
        animations.append(animation)
        model = build_model(ROOT / entry["native"], animation, False, (0, 0))
        path = OUTPUT / f"{entry['id']}-attack.rbxmx"
        write_xml(path, document_with(model))
        results.append(validate_model(path, animation, False))

    demo_root = ET.Element("roblox", {"version": "4"})
    ET.SubElement(demo_root, "External").text = "null"
    ET.SubElement(demo_root, "External").text = "nil"
    pack = ET.SubElement(demo_root, "Item", {"class": "Model", "referent": "PACK"})
    add_properties(pack, "Pupsters_Sitting_Attacks_Demo")
    for index, (entry, animation) in enumerate(zip(entries, animations)):
        offset = ((index % 3 - 1) * 6, (index // 3) * 6)
        model = build_model(ROOT / entry["native"], animation, True, offset)
        prefix_referents(model, entry["id"] + "_")
        pack.append(model)
    demo_path = OUTPUT / "Pupsters-Sitting-Attacks-Demo.rbxmx"
    write_xml(demo_path, demo_root)
    demo_result = validate_demo(demo_path, entries, animations)

    report = {
        "passed": True,
        "models": results,
        "demo": demo_result,
        "robloxStudioTested": False,
        "luauRuntimeCheck": "not-run (no Luau CLI installed)" if shutil.which("luau") is None else "available but not run",
        "scope": "Visual playback only; no damage, targeting, RemoteEvents, skeletal rig, or AnimationTrack.",
    }
    (OUTPUT / "validation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
