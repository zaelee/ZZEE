#!/usr/bin/env python3
"""Export all enemy scene JSON files to editable Roblox XML models."""

from __future__ import annotations

import json
import math
import re
from pathlib import Path
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
SCENES = ROOT / "scenes"
NATIVE = ROOT / "native"
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
SURFACES = ("TopSurface", "BottomSurface", "LeftSurface", "RightSurface", "FrontSurface", "BackSurface")
BODY_WORDS = ("body", "head", "armor", "core", "chassis", "shell", "stack", "cargo", "torso", "brick", "cart", "wall", "bed")
PACK_SPACING = 6.0
PACK_OFFSETS = tuple(
    ((column - 1) * PACK_SPACING, 0.0, (row - 1) * PACK_SPACING)
    for row in range(3)
    for column in range(3)
)


def fail(message: str) -> None:
    raise ValueError(message)


def number(value: object, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        fail(f"{label} must be a finite number")
    return float(value)


def vector(value: object, label: str, *, positive: bool = False) -> list[float]:
    if not isinstance(value, list) or len(value) != 3:
        fail(f"{label} must contain three numbers")
    result = [number(component, f"{label}[{index}]") for index, component in enumerate(value)]
    if positive and any(component <= 0.0 for component in result):
        fail(f"{label} components must be positive")
    return result


def validate_scene(raw: object, expected_id: str, source: Path) -> dict:
    if not isinstance(raw, dict):
        fail(f"{source.name}: scene root must be an object")
    if raw.get("id") != expected_id:
        fail(f"{source.name}: id must be {expected_id}")
    for key in ("slug", "name", "displayName"):
        if not isinstance(raw.get(key), str) or not raw[key].strip():
            fail(f"{source.name}: {key} must be a non-empty string")
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]*", raw["name"]):
        fail(f"{source.name}: name must be an ASCII identifier")
    if raw.get("units") != "studs" or raw.get("up") != "+Y" or raw.get("front") != "-Z":
        fail(f"{source.name}: unsupported units or axes")

    materials_raw = raw.get("materials")
    if not isinstance(materials_raw, dict) or not materials_raw:
        fail(f"{source.name}: materials must be a non-empty object")
    materials = {}
    for key, material in materials_raw.items():
        if not isinstance(key, str) or not key or not isinstance(material, dict):
            fail(f"{source.name}: invalid material {key!r}")
        color = vector(material.get("color"), f"{source.name}.materials.{key}.color")
        if any(component < 0.0 or component > 1.0 for component in color):
            fail(f"{source.name}: material color must be in 0..1")
        opacity = number(material.get("opacity", 1.0), f"{source.name}.materials.{key}.opacity")
        if opacity < 0.0 or opacity > 1.0:
            fail(f"{source.name}: material opacity must be in 0..1")
        materials[key] = {"color": color, "opacity": opacity}

    parts_raw = raw.get("parts")
    if not isinstance(parts_raw, list) or not parts_raw:
        fail(f"{source.name}: parts must be a non-empty array")
    names = set()
    parts = []
    for index, part in enumerate(parts_raw):
        label = f"{source.name}.parts[{index}]"
        if not isinstance(part, dict):
            fail(f"{label} must be an object")
        name, group, kind, material = (part.get(key) for key in ("name", "group", "type", "material"))
        if not isinstance(name, str) or not name:
            fail(f"{label}.name must be a non-empty string")
        if name in names:
            fail(f"{source.name}: duplicate part name {name!r}")
        names.add(name)
        if not isinstance(group, str) or not group:
            fail(f"{label}.group must be a non-empty string")
        if kind not in {"box", "sphere"}:
            fail(f"{label}.type must be box or sphere")
        if material not in materials:
            fail(f"{label}.material references unknown material {material!r}")
        parts.append(
            {
                "name": name,
                "group": group,
                "type": kind,
                "size": vector(part.get("size"), f"{label}.size", positive=True),
                "position": vector(part.get("position"), f"{label}.position"),
                "rotation": vector(part.get("rotation"), f"{label}.rotation"),
                "material": material,
            }
        )
    return {
        "id": expected_id,
        "name": raw["name"],
        "displayName": raw["displayName"],
        "hitPoint": vector(raw.get("hitPoint"), f"{source.name}.hitPoint"),
        "materials": materials,
        "parts": parts,
        "groups": list(dict.fromkeys(part["group"] for part in parts)),
    }


def load_scenes() -> list[dict]:
    missing = [filename for _, filename in EXPECTED if not (SCENES / filename).is_file()]
    if missing:
        fail("missing required scene files: " + ", ".join(missing))
    scenes = []
    scene_names = set()
    for expected_id, filename in EXPECTED:
        source = SCENES / filename
        scene = validate_scene(json.loads(source.read_text(encoding="utf-8")), expected_id, source)
        if scene["name"] in scene_names:
            fail(f"duplicate scene name {scene['name']!r}")
        scene_names.add(scene["name"])
        scenes.append(scene)
    return scenes


def rotation_matrix(rotation: list[float]) -> list[list[float]]:
    """Return R=Rx*Ry*Rz, matching the source scene convention."""
    x, y, z = rotation
    cx, sx = math.cos(x), math.sin(x)
    cy, sy = math.cos(y), math.sin(y)
    cz, sz = math.cos(z), math.sin(z)
    return [
        [cy * cz, -cy * sz, sy],
        [cx * sz + sx * sy * cz, cx * cz - sx * sy * sz, -sx * cy],
        [sx * sz - cx * sy * cz, sx * cz + cx * sy * sz, cx * cy],
    ]


def multiply(matrix: list[list[float]], value: list[float]) -> list[float]:
    return [sum(matrix[row][column] * value[column] for column in range(3)) for row in range(3)]


def transpose_multiply(matrix: list[list[float]], value: list[float]) -> list[float]:
    return [sum(matrix[row][column] * value[row] for row in range(3)) for column in range(3)]


def choose_hit_part(scene: dict) -> tuple[int, list[float]]:
    candidates = [
        (index, part)
        for index, part in enumerate(scene["parts"])
        if part["type"] == "box" and any(word in (part["group"] + " " + part["name"]).lower() for word in BODY_WORDS)
    ]
    if not candidates:
        candidates = [(index, part) for index, part in enumerate(scene["parts"]) if part["type"] == "box"]
    if not candidates:
        fail(f"{scene['id']}: at least one box is required for HitPoint")
    scored = []
    for index, part in candidates:
        delta = [scene["hitPoint"][axis] - part["position"][axis] for axis in range(3)]
        local = transpose_multiply(rotation_matrix(part["rotation"]), delta)
        outside = sum(max(abs(local[axis]) - part["size"][axis] / 2.0, 0.0) ** 2 for axis in range(3))
        center = sum((local[axis] / part["size"][axis]) ** 2 for axis in range(3))
        scored.append((outside, center, index, local))
    _, _, index, local = min(scored)
    return index, local


def fmt(value: float) -> str:
    return format(0.0 if abs(value) < 5e-13 else value, ".10g")


def xml_name(value: str) -> str:
    return escape(value, {'"': "&quot;", "'": "&apos;"})


def cframe_xml(position: list[float], matrix: list[list[float]], indent: str) -> list[str]:
    values = {
        "X": position[0], "Y": position[1], "Z": position[2],
        "R00": matrix[0][0], "R01": matrix[0][1], "R02": matrix[0][2],
        "R10": matrix[1][0], "R11": matrix[1][1], "R12": matrix[1][2],
        "R20": matrix[2][0], "R21": matrix[2][1], "R22": matrix[2][2],
    }
    lines = [f'{indent}<CoordinateFrame name="CFrame">']
    lines.extend(f"{indent}  <{key}>{fmt(value)}</{key}>" for key, value in values.items())
    lines.append(f"{indent}</CoordinateFrame>")
    return lines


def vector_xml(name: str, value: list[float], indent: str) -> list[str]:
    return [
        f'{indent}<Vector3 name="{name}">',
        f"{indent}  <X>{fmt(value[0])}</X>",
        f"{indent}  <Y>{fmt(value[1])}</Y>",
        f"{indent}  <Z>{fmt(value[2])}</Z>",
        f"{indent}</Vector3>",
    ]


def color_xml(color: list[float], indent: str) -> list[str]:
    return [
        f'{indent}<Color3 name="Color">',
        f"{indent}  <R>{fmt(color[0])}</R>",
        f"{indent}  <G>{fmt(color[1])}</G>",
        f"{indent}  <B>{fmt(color[2])}</B>",
        f"{indent}</Color3>",
    ]


class References:
    def __init__(self) -> None:
        self.value = 0

    def next(self) -> str:
        self.value += 1
        return f"RBX{self.value}"


def emit_scene_model(scene: dict, refs: References, indent: str, offset: tuple[float, float, float]) -> list[str]:
    hit_index, hit_local = choose_hit_part(scene)
    lines = [
        f'{indent}<Item class="Model" referent="{refs.next()}">',
        f"{indent}  <Properties>",
        f'{indent}    <string name="Name">{xml_name(scene["displayName"])}</string>',
        f"{indent}  </Properties>",
    ]
    for group in scene["groups"]:
        lines.extend(
            [
                f'{indent}  <Item class="Model" referent="{refs.next()}">',
                f"{indent}    <Properties>",
                f'{indent}      <string name="Name">{xml_name(group)}</string>',
                f"{indent}    </Properties>",
            ]
        )
        for index, part in enumerate(scene["parts"]):
            if part["group"] != group:
                continue
            position = [part["position"][axis] + offset[axis] for axis in range(3)]
            matrix = rotation_matrix(part["rotation"])
            material = scene["materials"][part["material"]]
            lines.extend(
                [
                    f'{indent}    <Item class="Part" referent="{refs.next()}">',
                    f"{indent}      <Properties>",
                    f'{indent}        <bool name="Anchored">true</bool>',
                    f'{indent}        <bool name="CanCollide">false</bool>',
                ]
            )
            lines.extend(cframe_xml(position, matrix, indent + "        "))
            lines.extend(color_xml(material["color"], indent + "        "))
            lines.extend(
                [
                    f'{indent}        <token name="Material">272</token>',
                    f'{indent}        <string name="Name">{xml_name(part["name"])}</string>',
                ]
            )
            lines.extend(vector_xml("Position", position, indent + "        "))
            lines.append(f'{indent}        <token name="Shape">{0 if part["type"] == "sphere" else 1}</token>')
            for surface in SURFACES:
                lines.append(f'{indent}        <token name="{surface}">0</token>')
            lines.append(f'{indent}        <float name="Transparency">{fmt(1.0 - material["opacity"])}</float>')
            lines.extend(vector_xml("size", part["size"], indent + "        "))
            lines.append(f"{indent}      </Properties>")
            if index == hit_index:
                lines.extend(
                    [
                        f'{indent}      <Item class="Attachment" referent="{refs.next()}">',
                        f"{indent}        <Properties>",
                    ]
                )
                lines.extend(cframe_xml(hit_local, [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]], indent + "          "))
                lines.extend(
                    [
                        f'{indent}          <string name="Name">HitPoint</string>',
                        f"{indent}        </Properties>",
                        f"{indent}      </Item>",
                    ]
                )
            lines.append(f"{indent}    </Item>")
        lines.append(f"{indent}  </Item>")
    lines.append(f"{indent}</Item>")
    return lines


def individual_xml(scene: dict) -> str:
    refs = References()
    lines = ['<?xml version="1.0" encoding="utf-8"?>', '<roblox version="4">', '  <External>null</External>', '  <External>nil</External>']
    lines.extend(emit_scene_model(scene, refs, "  ", (0.0, 0.0, 0.0)))
    lines.extend(["</roblox>", ""])
    return "\n".join(lines)


def pack_xml(scenes: list[dict]) -> str:
    refs = References()
    lines = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<roblox version="4">',
        '  <External>null</External>',
        '  <External>nil</External>',
        f'  <Item class="Model" referent="{refs.next()}">',
        '    <Properties>',
        '      <string name="Name">Pupsters_Enemies_All</string>',
        '    </Properties>',
    ]
    for scene, offset in zip(scenes, PACK_OFFSETS):
        lines.extend(emit_scene_model(scene, refs, "    ", offset))
    lines.extend(["  </Item>", "</roblox>", ""])
    return "\n".join(lines)


def property_values(item: ET.Element) -> dict[str, ET.Element]:
    properties = item.find("Properties")
    if properties is None:
        fail(f"{item.attrib.get('class')} has no Properties")
    return {element.attrib["name"]: element for element in properties}


def read_vector(element: ET.Element) -> list[float]:
    return [float(element.findtext(axis)) for axis in ("X", "Y", "Z")]


def read_cframe(element: ET.Element) -> tuple[list[float], list[list[float]]]:
    position = [float(element.findtext(axis)) for axis in ("X", "Y", "Z")]
    matrix = [[float(element.findtext(f"R{row}{column}")) for column in range(3)] for row in range(3)]
    return position, matrix


def model_name(item: ET.Element) -> str:
    element = property_values(item).get("Name")
    return element.text if element is not None and element.text is not None else ""


def validate_scene_model(model: ET.Element, scene: dict, offset: tuple[float, float, float]) -> dict:
    if model.attrib.get("class") != "Model" or model_name(model) != scene["displayName"]:
        fail(f"{scene['id']}: root model name differs")
    groups = model.findall("./Item[@class='Model']")
    if [model_name(group) for group in groups] != scene["groups"]:
        fail(f"{scene['id']}: dynamic groups differ")
    expected = [(index, part) for group in scene["groups"] for index, part in enumerate(scene["parts"]) if part["group"] == group]
    serialized = [(model_name(group), part) for group in groups for part in group.findall("./Item[@class='Part']")]
    if len(serialized) != len(expected):
        fail(f"{scene['id']}: part count differs")
    hit_index, hit_local = choose_hit_part(scene)
    hit_parent = None
    max_error = 0.0
    for (group_name, item), (source_index, part) in zip(serialized, expected):
        props = property_values(item)
        required = {"Anchored", "CanCollide", "CFrame", "Color", "Material", "Name", "Position", "Shape", "Transparency", "size", *SURFACES}
        if set(props) != required:
            fail(f"{scene['id']}.{part['name']}: property schema differs")
        if group_name != part["group"] or props["Name"].text != part["name"]:
            fail(f"{scene['id']}: group or part name differs")
        if props["Anchored"].text != "true" or props["CanCollide"].text != "false":
            fail(f"{scene['id']}.{part['name']}: physics flags differ")
        if props["Material"].text != "272" or any(props[name].text != "0" for name in SURFACES):
            fail(f"{scene['id']}.{part['name']}: material or surfaces differ")
        if props["Shape"].text != ("0" if part["type"] == "sphere" else "1"):
            fail(f"{scene['id']}.{part['name']}: shape differs")
        position, matrix = read_cframe(props["CFrame"])
        direct_position = read_vector(props["Position"])
        size = read_vector(props["size"])
        color = [float(props["Color"].findtext(axis)) for axis in ("R", "G", "B")]
        transparency = float(props["Transparency"].text)
        expected_position = [part["position"][axis] + offset[axis] for axis in range(3)]
        expected_matrix = rotation_matrix(part["rotation"])
        expected_material = scene["materials"][part["material"]]
        actual = size + position + direct_position + color + [transparency] + [value for row in matrix for value in row]
        wanted = part["size"] + expected_position + expected_position + expected_material["color"] + [1.0 - expected_material["opacity"]] + [value for row in expected_matrix for value in row]
        max_error = max(max_error, max(abs(a - b) for a, b in zip(actual, wanted)))
        attachments = item.findall("./Item[@class='Attachment']")
        if attachments:
            if len(attachments) != 1 or hit_parent is not None:
                fail(f"{scene['id']}: multiple HitPoint attachments")
            hit_parent = source_index
            attachment_props = property_values(attachments[0])
            if set(attachment_props) != {"CFrame", "Name"} or attachment_props["Name"].text != "HitPoint":
                fail(f"{scene['id']}: malformed HitPoint attachment")
            actual_local, local_matrix = read_cframe(attachment_props["CFrame"])
            if max(abs(actual_local[axis] - hit_local[axis]) for axis in range(3)) > 1e-8:
                fail(f"{scene['id']}: HitPoint local position differs")
            identity = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]
            if max(abs(local_matrix[row][column] - identity[row][column]) for row in range(3) for column in range(3)) > 1e-8:
                fail(f"{scene['id']}: HitPoint local rotation differs")
            world_offset = multiply(expected_matrix, actual_local)
            world = [expected_position[axis] + world_offset[axis] for axis in range(3)]
            wanted_world = [scene["hitPoint"][axis] + offset[axis] for axis in range(3)]
            if max(abs(world[axis] - wanted_world[axis]) for axis in range(3)) > 1e-8:
                fail(f"{scene['id']}: HitPoint world position differs")
    if hit_parent != hit_index:
        fail(f"{scene['id']}: HitPoint is parented to the wrong part")
    if max_error > 1e-8:
        fail(f"{scene['id']}: serialized numeric error {max_error}")
    return {"parts": len(expected), "groups": len(groups), "hitPointParent": scene["parts"][hit_index]["name"], "maxError": max_error}


def parse_and_check_referents(text: str) -> ET.Element:
    root = ET.fromstring(text)
    if root.tag != "roblox" or root.attrib.get("version") != "4":
        fail("invalid Roblox XML root")
    items = root.findall(".//Item")
    refs = [item.attrib.get("referent") for item in items]
    if not refs or None in refs or len(refs) != len(set(refs)):
        fail("RBXMX referents must exist and be unique")
    return root


def validate_outputs(scenes: list[dict], individuals: list[str], combined: str) -> list[dict]:
    results = []
    for scene, text in zip(scenes, individuals):
        root = parse_and_check_referents(text)
        top = root.findall("./Item")
        if len(top) != 1:
            fail(f"{scene['id']}: expected one top-level model")
        results.append(validate_scene_model(top[0], scene, (0.0, 0.0, 0.0)))
    root = parse_and_check_referents(combined)
    top = root.findall("./Item")
    if len(top) != 1 or model_name(top[0]) != "Pupsters_Enemies_All":
        fail("combined pack root differs")
    models = top[0].findall("./Item[@class='Model']")
    if len(models) != len(scenes):
        fail("combined pack model count differs")
    for model, scene, offset in zip(models, scenes, PACK_OFFSETS):
        validate_scene_model(model, scene, offset)
    return results


def main() -> None:
    scenes = load_scenes()
    individuals = [individual_xml(scene) for scene in scenes]
    combined = pack_xml(scenes)
    results = validate_outputs(scenes, individuals, combined)
    NATIVE.mkdir(parents=True, exist_ok=True)
    for scene, text in zip(scenes, individuals):
        (NATIVE / f"{scene['name']}.rbxmx").write_text(text, encoding="utf-8", newline="\n")
    (NATIVE / "Pupsters_Enemies_All.rbxmx").write_text(combined, encoding="utf-8", newline="\n")
    print(f"Exported {len(scenes)} enemy models and Pupsters_Enemies_All.rbxmx")
    for scene, offset, result in zip(scenes, PACK_OFFSETS, results):
        print(f"{scene['id']}: {scene['name']}.rbxmx | parts={result['parts']} groups={result['groups']} HitPoint={result['hitPointParent']} packOffset={offset}")


if __name__ == "__main__":
    main()
