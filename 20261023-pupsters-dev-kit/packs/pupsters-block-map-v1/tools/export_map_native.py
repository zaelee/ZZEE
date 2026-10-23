#!/usr/bin/env python3
"""Export the playroom map scenes to editable Roblox XML models."""

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
MAP_SOURCE = SCENES / "map.json"
SHOWCASE_SOURCE = SCENES / "showcase.json"
LAYOUT_SOURCE = ROOT / "layout.json"
MAP_OUTPUT = NATIVE / "Pupsters_Block_Playroom_Map.rbxmx"
SHOWCASE_OUTPUT = NATIVE / "Pupsters_Block_Playroom_Showcase.rbxmx"
CHECKS_OUTPUT = NATIVE / "export-checks.json"

SURFACES = ("TopSurface", "BottomSurface", "LeftSurface", "RightSurface", "FrontSurface", "BackSurface")
IDENTIFIER = re.compile(r"[A-Za-z][A-Za-z0-9_]*\Z")
EXPECTED_WAYPOINTS = (
    ("W01", [-31.0, 0.1, -15.0]),
    ("W02", [25.0, 0.1, -15.0]),
    ("W03", [25.0, 0.1, 0.0]),
    ("W04", [-25.0, 0.1, 0.0]),
    ("W05", [-25.0, 0.1, 15.0]),
    ("W06", [31.0, 0.1, 15.0]),
)
IDENTITY = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]
TOLERANCE = 1e-8


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
    if positive and any(component <= 0.0 for component in result):
        fail(f"{label} components must be positive")
    return result


def close(left: float, right: float) -> bool:
    return abs(left - right) <= TOLERANCE


def vectors_close(left: list[float], right: list[float]) -> bool:
    return len(left) == len(right) and all(close(a, b) for a, b in zip(left, right))


def load_json(path: Path) -> object:
    if not path.is_file():
        fail(f"missing required input: {path.relative_to(ROOT)}")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        fail(f"{path.name}: invalid JSON: {error}")


def validate_scene(raw: object, source: Path) -> dict:
    if not isinstance(raw, dict):
        fail(f"{source.name}: scene root must be an object")
    scene_id = raw.get("id")
    name = raw.get("name")
    display_name = raw.get("displayName")
    if not isinstance(scene_id, str) or not scene_id.strip():
        fail(f"{source.name}: id must be a non-empty string")
    if not isinstance(name, str) or not IDENTIFIER.fullmatch(name):
        fail(f"{source.name}: name must be an ASCII identifier")
    if not isinstance(display_name, str) or not display_name.strip():
        fail(f"{source.name}: displayName must be a non-empty string")

    materials_raw = raw.get("materials")
    if not isinstance(materials_raw, dict) or not materials_raw:
        fail(f"{source.name}: materials must be a non-empty object")
    materials: dict[str, dict] = {}
    for key, material in materials_raw.items():
        label = f"{source.name}.materials.{key}"
        if not isinstance(key, str) or not key or not isinstance(material, dict):
            fail(f"{source.name}: invalid material {key!r}")
        color = vector(material.get("color"), 3, f"{label}.color")
        if any(component < 0.0 or component > 1.0 for component in color):
            fail(f"{label}.color components must be in 0..1")
        opacity = number(material.get("opacity", 1.0), f"{label}.opacity")
        if opacity < 0.0 or opacity > 1.0:
            fail(f"{label}.opacity must be in 0..1")
        materials[key] = {"color": color, "opacity": opacity}

    parts_raw = raw.get("parts")
    if not isinstance(parts_raw, list) or not parts_raw:
        fail(f"{source.name}: parts must be a non-empty array")
    names: set[str] = set()
    parts: list[dict] = []
    for index, part in enumerate(parts_raw):
        label = f"{source.name}.parts[{index}]"
        if not isinstance(part, dict):
            fail(f"{label} must be an object")
        part_name = part.get("name")
        group = part.get("group")
        kind = part.get("type")
        material = part.get("material")
        if not isinstance(part_name, str) or not part_name:
            fail(f"{label}.name must be a non-empty string")
        if part_name in names:
            fail(f"{source.name}: duplicate part name {part_name!r}")
        names.add(part_name)
        if not isinstance(group, str) or not group:
            fail(f"{label}.group must be a non-empty string")
        if kind not in {"box", "sphere"}:
            fail(f"{label}.type must be box or sphere")
        if material not in materials:
            fail(f"{label}.material references unknown material {material!r}")
        collidable = part.get("collidable", False)
        if not isinstance(collidable, bool):
            fail(f"{label}.collidable must be a boolean")
        parts.append(
            {
                "name": part_name,
                "group": group,
                "type": kind,
                "size": vector(part.get("size"), 3, f"{label}.size", positive=True),
                "position": vector(part.get("position"), 3, f"{label}.position"),
                "rotation": vector(part.get("rotation"), 3, f"{label}.rotation"),
                "material": material,
                "collidable": collidable,
            }
        )
    return {
        "id": scene_id,
        "name": name,
        "displayName": display_name,
        "materials": materials,
        "parts": parts,
        "groups": list(dict.fromkeys(part["group"] for part in parts)),
    }


def validate_layout(raw: object) -> dict:
    if not isinstance(raw, dict):
        fail("layout.json: root must be an object")
    if not isinstance(raw.get("mapId"), str) or not raw["mapId"].strip():
        fail("layout.json: mapId must be a non-empty string")
    if raw.get("units") != "studs" or raw.get("up") != "+Y" or raw.get("front") != "-Z":
        fail("layout.json: units/axes must be studs, +Y, -Z")
    path_width = number(raw.get("pathWidth"), "layout.pathWidth")
    path_y = number(raw.get("pathY"), "layout.pathY")
    if not close(path_width, 6.0) or not close(path_y, 0.1):
        fail("layout.json: pathWidth/pathY must be 6/0.1")

    waypoints_raw = raw.get("waypoints")
    if not isinstance(waypoints_raw, list) or len(waypoints_raw) != len(EXPECTED_WAYPOINTS):
        fail("layout.json: exactly six waypoints are required")
    waypoints = []
    for index, ((expected_id, expected_position), item) in enumerate(zip(EXPECTED_WAYPOINTS, waypoints_raw)):
        if not isinstance(item, dict):
            fail(f"layout.waypoints[{index}] must be an object")
        position = vector(item.get("position"), 3, f"layout.waypoints[{index}].position")
        if item.get("id") != expected_id or not vectors_close(position, expected_position):
            fail(f"layout.waypoints[{index}] must be {expected_id} at {expected_position}")
        waypoints.append({"id": expected_id, "position": position})

    slots_raw = raw.get("slots")
    if not isinstance(slots_raw, list) or len(slots_raw) != 16:
        fail("layout.json: exactly 16 placement slots are required")
    slots = []
    seen_positions: set[tuple[float, float, float]] = set()
    for index, item in enumerate(slots_raw):
        label = f"layout.slots[{index}]"
        if not isinstance(item, dict):
            fail(f"{label} must be an object")
        expected_id = f"P{index + 1:02d}"
        if item.get("id") != expected_id:
            fail(f"{label}.id must be {expected_id}")
        position = vector(item.get("position"), 3, f"{label}.position")
        size = vector(item.get("size"), 2, f"{label}.size", positive=True)
        yaw = number(item.get("yaw"), f"{label}.yaw")
        zone = item.get("zone")
        if not close(position[1], 0.26) or not vectors_close(size, [4.2, 4.2]):
            fail(f"{label}: position Y/size must be 0.26/[4.2, 4.2]")
        if not isinstance(zone, str) or not zone:
            fail(f"{label}.zone must be a non-empty string")
        position_key = tuple(round(value, 9) for value in position)
        if position_key in seen_positions:
            fail(f"layout.json: duplicate slot position at {position}")
        seen_positions.add(position_key)
        slots.append({"id": expected_id, "position": position, "size": size, "yaw": yaw, "zone": zone})
    return {
        "mapId": raw["mapId"],
        "units": "studs",
        "up": "+Y",
        "front": "-Z",
        "pathWidth": path_width,
        "pathY": path_y,
        "waypoints": waypoints,
        "slots": slots,
    }


def validate_map_geometry(scene: dict, layout: dict) -> dict:
    boxes = [part for part in scene["parts"] if part["type"] == "box"]
    floor_parts = [part for part in boxes if part["group"].lower() == "floor"]
    floor_bases = [
        part for part in boxes
        if close(part["size"][0], 76.0)
        and close(part["size"][2], 52.0)
    ]
    if len(floor_bases) != 1 or not floor_parts:
        fail(f"map.json: expected one 76x52 floor footprint, found {len(floor_bases)}")
    floor_top = max(part["position"][1] + part["size"][1] / 2.0 for part in floor_parts)
    if not close(floor_top, 0.0):
        fail(f"map.json: Floor group top Y must be 0, got {floor_top}")

    path_parts = [
        part for part in boxes
        if part["group"].lower() == "path"
    ]
    if not path_parts:
        fail("map.json: no path box parts found")
    for part in path_parts:
        if not close(part["position"][1] + part["size"][1] / 2.0, layout["pathY"]):
            fail(f"map.json: {part['name']} top Y does not equal pathY")
        if not close(min(part["size"][0], part["size"][2]), layout["pathWidth"]):
            fail(f"map.json: {part['name']} does not have path width 6")

    matched: set[str] = set()
    for slot in layout["slots"]:
        footprint_candidates = [
            part for part in boxes
            if vectors_close([part["position"][0], part["position"][2]], [slot["position"][0], slot["position"][2]])
            and vectors_close([part["size"][0], part["size"][2]], slot["size"])
            and part["name"].startswith(slot["id"] + "_")
        ]
        top_candidates = [
            part for part in boxes
            if vectors_close([part["position"][0], part["position"][2]], [slot["position"][0], slot["position"][2]])
            and close(part["position"][1] + part["size"][1] / 2.0, slot["position"][1])
            and part["name"].startswith(slot["id"] + "_")
        ]
        if len(footprint_candidates) != 1 or len(top_candidates) != 1:
            fail(f"map.json: slot {slot['id']} must match one 4.2 footprint and one placement surface at top Y=0.26")
        footprint = footprint_candidates[0]
        if footprint["name"] in matched:
            fail(f"map.json: pad {footprint['name']} is referenced by multiple slots")
        matched.add(footprint["name"])
    return {"floorBase": floor_bases[0]["name"], "floorParts": len(floor_parts), "pathParts": len(path_parts), "pads": len(matched)}


def rotation_matrix(rotation: list[float]) -> list[list[float]]:
    """Return R=Rx*Ry*Rz, matching tools/build_models.py."""
    x, y, z = rotation
    cx, sx = math.cos(x), math.sin(x)
    cy, sy = math.cos(y), math.sin(y)
    cz, sz = math.cos(z), math.sin(z)
    return [
        [cy * cz, -cy * sz, sy],
        [cx * sz + sx * sy * cz, cx * cz - sx * sy * sz, -sx * cy],
        [sx * sz - cx * sy * cz, sx * cz + cx * sy * sz, cx * cy],
    ]


def yaw_matrix(yaw: float) -> list[list[float]]:
    return rotation_matrix([0.0, yaw, 0.0])


def fmt(value: float) -> str:
    return format(0.0 if abs(value) < 5e-13 else value, ".10g")


def xml_text(value: str) -> str:
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


def vector3_xml(name: str, value: list[float], indent: str) -> list[str]:
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


def emit_part(
    name: str,
    kind: str,
    size: list[float],
    position: list[float],
    matrix: list[list[float]],
    color: list[float],
    opacity: float,
    collidable: bool,
    refs: References,
    indent: str,
) -> list[str]:
    lines = [
        f'{indent}<Item class="Part" referent="{refs.next()}">',
        f"{indent}  <Properties>",
        f'{indent}    <bool name="Anchored">true</bool>',
        f'{indent}    <bool name="CanCollide">{str(collidable).lower()}</bool>',
    ]
    lines.extend(cframe_xml(position, matrix, indent + "    "))
    lines.extend(color_xml(color, indent + "    "))
    lines.extend(
        [
            f'{indent}    <token name="Material">272</token>',
            f'{indent}    <string name="Name">{xml_text(name)}</string>',
        ]
    )
    lines.extend(vector3_xml("Position", position, indent + "    "))
    lines.append(f'{indent}    <token name="Shape">{0 if kind == "sphere" else 1}</token>')
    for surface in SURFACES:
        lines.append(f'{indent}    <token name="{surface}">0</token>')
    lines.append(f'{indent}    <float name="Transparency">{fmt(1.0 - opacity)}</float>')
    lines.extend(vector3_xml("size", size, indent + "    "))
    lines.extend([f"{indent}  </Properties>", f"{indent}</Item>"])
    return lines


def emit_scene_contents(scene: dict, refs: References, indent: str) -> list[str]:
    lines: list[str] = []
    for group in scene["groups"]:
        lines.extend(
            [
                f'{indent}<Item class="Model" referent="{refs.next()}">',
                f"{indent}  <Properties>",
                f'{indent}    <string name="Name">{xml_text(group)}</string>',
                f"{indent}  </Properties>",
            ]
        )
        for part in scene["parts"]:
            if part["group"] != group:
                continue
            material = scene["materials"][part["material"]]
            lines.extend(
                emit_part(
                    part["name"], part["type"], part["size"], part["position"],
                    rotation_matrix(part["rotation"]), material["color"], material["opacity"],
                    part["collidable"], refs, indent + "  ",
                )
            )
        lines.append(f"{indent}</Item>")
    return lines


def luau_vector3(value: list[float]) -> str:
    return f"Vector3.new({fmt(value[0])}, {fmt(value[1])}, {fmt(value[2])})"


def luau_vector2(value: list[float]) -> str:
    return f"Vector2.new({fmt(value[0])}, {fmt(value[1])})"


def map_data_source(layout: dict) -> str:
    lines = [
        "-- Generated connection data for the PUPSTERS playroom map. No gameplay behavior.",
        "return {",
        f"\tpathWidth = {fmt(layout['pathWidth'])},",
        f"\tpathY = {fmt(layout['pathY'])},",
        "\twaypoints = {",
    ]
    lines.extend(f"\t\t{luau_vector3(item['position'])}, -- {item['id']}" for item in layout["waypoints"])
    lines.extend(["\t},", "\tslots = {"])
    for item in layout["slots"]:
        lines.append(
            "\t\t{ id = \"%s\", position = %s, yaw = %s, size = %s },"
            % (item["id"], luau_vector3(item["position"]), fmt(item["yaw"]), luau_vector2(item["size"]))
        )
    lines.extend(["\t},", "}", ""])
    return "\n".join(lines)


def emit_metadata(layout: dict, refs: References, indent: str) -> list[str]:
    lines = [
        f'{indent}<Item class="Folder" referent="{refs.next()}">',
        f"{indent}  <Properties>",
        f'{indent}    <string name="Name">PathWaypoints</string>',
        f"{indent}  </Properties>",
    ]
    for item in layout["waypoints"]:
        lines.extend(emit_part(item["id"], "sphere", [0.2, 0.2, 0.2], item["position"], IDENTITY, [1.0, 1.0, 1.0], 0.0, False, refs, indent + "  "))
    lines.extend(
        [
            f"{indent}</Item>",
            f'{indent}<Item class="Folder" referent="{refs.next()}">',
            f"{indent}  <Properties>",
            f'{indent}    <string name="Name">PlacementSlots</string>',
            f"{indent}  </Properties>",
        ]
    )
    for item in layout["slots"]:
        marker_size = [item["size"][0], 0.1, item["size"][1]]
        lines.extend(emit_part(item["id"], "box", marker_size, item["position"], yaw_matrix(item["yaw"]), [1.0, 1.0, 1.0], 0.0, False, refs, indent + "  "))
    source = map_data_source(layout)
    lines.extend(
        [
            f"{indent}</Item>",
            f'{indent}<Item class="ModuleScript" referent="{refs.next()}">',
            f"{indent}  <Properties>",
            f'{indent}    <string name="Name">MapData</string>',
            f'{indent}    <ProtectedString name="Source">{xml_text(source)}</ProtectedString>',
            f"{indent}  </Properties>",
            f"{indent}</Item>",
        ]
    )
    return lines


def build_map_xml(map_scene: dict, layout: dict) -> str:
    refs = References()
    lines = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<roblox version="4">',
        '  <External>null</External>',
        '  <External>nil</External>',
        f'  <Item class="Model" referent="{refs.next()}">',
        '    <Properties>',
        '      <string name="Name">Pupsters_Block_Playroom_Map</string>',
        '    </Properties>',
    ]
    lines.extend(emit_scene_contents(map_scene, refs, "    "))
    lines.extend(emit_metadata(layout, refs, "    "))
    lines.extend(["  </Item>", "</roblox>", ""])
    return "\n".join(lines)


def build_showcase_xml(map_scene: dict, showcase_scene: dict, layout: dict) -> str:
    refs = References()
    lines = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<roblox version="4">',
        '  <External>null</External>',
        '  <External>nil</External>',
        f'  <Item class="Model" referent="{refs.next()}">',
        '    <Properties>',
        '      <string name="Name">Pupsters_Block_Playroom_Showcase</string>',
        '    </Properties>',
    ]
    lines.extend(emit_scene_contents(showcase_scene, refs, "    "))
    lines.extend(emit_metadata(layout, refs, "    "))
    lines.extend(["  </Item>", "</roblox>", ""])
    return "\n".join(lines)


def property_values(item: ET.Element) -> dict[str, ET.Element]:
    properties = item.find("Properties")
    if properties is None:
        fail(f"{item.attrib.get('class')} has no Properties")
    result = {element.attrib.get("name"): element for element in properties}
    if None in result or len(result) != len(list(properties)):
        fail(f"{item.attrib.get('class')} has unnamed or duplicate properties")
    return result


def item_name(item: ET.Element) -> str:
    element = property_values(item).get("Name")
    return element.text if element is not None and element.text is not None else ""


def read_vector3(element: ET.Element) -> list[float]:
    return [float(element.findtext(axis)) for axis in ("X", "Y", "Z")]


def read_cframe(element: ET.Element) -> tuple[list[float], list[list[float]]]:
    position = [float(element.findtext(axis)) for axis in ("X", "Y", "Z")]
    matrix = [[float(element.findtext(f"R{row}{column}")) for column in range(3)] for row in range(3)]
    return position, matrix


def parse_xml(text: str) -> ET.Element:
    root = ET.fromstring(text)
    if root.tag != "roblox" or root.attrib.get("version") != "4":
        fail("invalid Roblox XML root")
    items = root.findall(".//Item")
    references = [item.attrib.get("referent") for item in items]
    if not references or None in references or len(references) != len(set(references)):
        fail("RBXMX referents must exist and be unique")
    if root.findall('.//Item[@class="Script"]') or root.findall('.//Item[@class="LocalScript"]'):
        fail("map exports must not contain gameplay scripts")
    return root


def direct_children_by_name(parent: ET.Element, class_name: str) -> dict[str, ET.Element]:
    children = parent.findall(f'./Item[@class="{class_name}"]')
    result = {item_name(child): child for child in children}
    if len(result) != len(children):
        fail(f"duplicate {class_name} child names under {item_name(parent)}")
    return result


def validate_part_item(item: ET.Element, part: dict, scene: dict) -> float:
    props = property_values(item)
    required = {"Anchored", "CanCollide", "CFrame", "Color", "Material", "Name", "Position", "Shape", "Transparency", "size", *SURFACES}
    if set(props) != required:
        fail(f"{scene['id']}.{part['name']}: property schema differs")
    if props["Name"].text != part["name"] or props["Anchored"].text != "true":
        fail(f"{scene['id']}.{part['name']}: name or Anchored differs")
    if props["CanCollide"].text != str(part["collidable"]).lower():
        fail(f"{scene['id']}.{part['name']}: CanCollide differs")
    if props["Material"].text != "272" or any(props[surface].text != "0" for surface in SURFACES):
        fail(f"{scene['id']}.{part['name']}: material or surfaces differ")
    if props["Shape"].text != ("0" if part["type"] == "sphere" else "1"):
        fail(f"{scene['id']}.{part['name']}: shape differs")
    position, matrix = read_cframe(props["CFrame"])
    direct_position = read_vector3(props["Position"])
    size = read_vector3(props["size"])
    color = [float(props["Color"].findtext(axis)) for axis in ("R", "G", "B")]
    transparency = float(props["Transparency"].text)
    material = scene["materials"][part["material"]]
    expected_matrix = rotation_matrix(part["rotation"])
    actual = size + position + direct_position + color + [transparency] + [value for row in matrix for value in row]
    expected = part["size"] + part["position"] + part["position"] + material["color"] + [1.0 - material["opacity"]] + [value for row in expected_matrix for value in row]
    return max(abs(left - right) for left, right in zip(actual, expected))


def validate_scene_contents(parent: ET.Element, scene: dict) -> dict:
    groups = direct_children_by_name(parent, "Model")
    if list(groups) != scene["groups"]:
        fail(f"{scene['id']}: dynamic group names/order differ")
    max_error = 0.0
    part_count = 0
    for group_name in scene["groups"]:
        group = groups[group_name]
        actual_parts = group.findall('./Item[@class="Part"]')
        expected_parts = [part for part in scene["parts"] if part["group"] == group_name]
        if len(actual_parts) != len(expected_parts):
            fail(f"{scene['id']}.{group_name}: part count differs")
        for item, part in zip(actual_parts, expected_parts):
            max_error = max(max_error, validate_part_item(item, part, scene))
            part_count += 1
    if max_error > TOLERANCE:
        fail(f"{scene['id']}: serialized numeric error {max_error}")
    return {"parts": part_count, "groups": len(groups), "maxNumericError": max_error}


def validate_metadata(parent: ET.Element, layout: dict) -> dict:
    folders = direct_children_by_name(parent, "Folder")
    if set(folders) != {"PathWaypoints", "PlacementSlots"}:
        fail("metadata folders differ")
    waypoint_parts = folders["PathWaypoints"].findall('./Item[@class="Part"]')
    slot_parts = folders["PlacementSlots"].findall('./Item[@class="Part"]')
    if [item_name(item) for item in waypoint_parts] != [item["id"] for item in layout["waypoints"]]:
        fail("PathWaypoints names/order differ")
    if [item_name(item) for item in slot_parts] != [item["id"] for item in layout["slots"]]:
        fail("PlacementSlots names/order differ")
    max_error = 0.0
    for item, expected in zip(waypoint_parts, layout["waypoints"]):
        props = property_values(item)
        position, matrix = read_cframe(props["CFrame"])
        values = position + read_vector3(props["Position"]) + [float(props["Transparency"].text)] + [value for row in matrix for value in row]
        wanted = expected["position"] + expected["position"] + [1.0] + [value for row in IDENTITY for value in row]
        max_error = max(max_error, max(abs(left - right) for left, right in zip(values, wanted)))
        if props["Anchored"].text != "true" or props["CanCollide"].text != "false":
            fail(f"{expected['id']}: waypoint marker physics flags differ")
    for item, expected in zip(slot_parts, layout["slots"]):
        props = property_values(item)
        position, matrix = read_cframe(props["CFrame"])
        size = read_vector3(props["size"])
        wanted_size = [expected["size"][0], 0.1, expected["size"][1]]
        expected_matrix = yaw_matrix(expected["yaw"])
        values = position + read_vector3(props["Position"]) + size + [float(props["Transparency"].text)] + [value for row in matrix for value in row]
        wanted = expected["position"] + expected["position"] + wanted_size + [1.0] + [value for row in expected_matrix for value in row]
        max_error = max(max_error, max(abs(left - right) for left, right in zip(values, wanted)))
        if props["Anchored"].text != "true" or props["CanCollide"].text != "false":
            fail(f"{expected['id']}: slot marker physics flags differ")
    modules = parent.findall('./Item[@class="ModuleScript"]')
    if len(modules) != 1 or item_name(modules[0]) != "MapData":
        fail("expected exactly one MapData ModuleScript")
    module_props = property_values(modules[0])
    if set(module_props) != {"Name", "Source"} or module_props["Source"].text != map_data_source(layout):
        fail("MapData source differs from layout.json")
    if max_error > TOLERANCE:
        fail(f"metadata serialized numeric error {max_error}")
    return {"waypoints": len(waypoint_parts), "slots": len(slot_parts), "maxNumericError": max_error}


def validate_outputs(map_scene: dict, showcase_scene: dict, layout: dict, map_xml: str, showcase_xml: str) -> dict:
    map_root = parse_xml(map_xml)
    showcase_root = parse_xml(showcase_xml)
    map_top = map_root.findall("./Item")
    showcase_top = showcase_root.findall("./Item")
    if len(map_top) != 1 or item_name(map_top[0]) != "Pupsters_Block_Playroom_Map":
        fail("map RBXMX root model differs")
    if len(showcase_top) != 1 or item_name(showcase_top[0]) != "Pupsters_Block_Playroom_Showcase":
        fail("showcase RBXMX root model differs")
    map_result = validate_scene_contents(map_top[0], map_scene)
    map_metadata = validate_metadata(map_top[0], layout)
    showcase_result = validate_scene_contents(showcase_top[0], showcase_scene)
    showcase_metadata = validate_metadata(showcase_top[0], layout)
    actor_count = len(showcase_scene["parts"]) - len(map_scene["parts"])
    actor_groups = len(set(part["group"] for part in showcase_scene["parts"][len(map_scene["parts"]):]))
    return {
        "status": "passed",
        "map": map_result,
        "showcase": showcase_result,
        "showcaseActors": {"parts": actor_count, "groups": actor_groups},
        "metadata": map_metadata,
        "showcaseMetadata": showcase_metadata,
        "uniqueReferents": True,
        "sourceCoordinatesPreserved": True,
        "mapGeometryIdenticalInBothExports": True,
        "gameplayScripts": 0,
        "studioValidation": "not-run (Roblox Studio unavailable; XML structure validated)",
    }


def main() -> None:
    map_scene = validate_scene(load_json(MAP_SOURCE), MAP_SOURCE)
    showcase_scene = validate_scene(load_json(SHOWCASE_SOURCE), SHOWCASE_SOURCE)
    if map_scene["name"] == showcase_scene["name"]:
        fail("map.json and showcase.json must have distinct name values")
    if showcase_scene["id"] != map_scene["id"]:
        fail("showcase.json must reference the same map id as map.json")
    map_part_count = len(map_scene["parts"])
    if showcase_scene["parts"][:map_part_count] != map_scene["parts"]:
        fail("showcase.json must begin with an unchanged copy of every map part")
    for key, material in map_scene["materials"].items():
        if showcase_scene["materials"].get(key) != material:
            fail(f"showcase.json changes map material {key!r}")
    layout = validate_layout(load_json(LAYOUT_SOURCE))
    if layout["mapId"] != map_scene["id"]:
        fail(f"layout.json: mapId {layout['mapId']!r} does not reference map scene {map_scene['id']!r}")
    geometry = validate_map_geometry(map_scene, layout)
    map_xml = build_map_xml(map_scene, layout)
    showcase_xml = build_showcase_xml(map_scene, showcase_scene, layout)
    checks = validate_outputs(map_scene, showcase_scene, layout, map_xml, showcase_xml)
    checks["sourceGeometry"] = geometry
    checks["inputs"] = [str(MAP_SOURCE.relative_to(ROOT)), str(SHOWCASE_SOURCE.relative_to(ROOT)), str(LAYOUT_SOURCE.relative_to(ROOT))]
    checks["outputs"] = [str(MAP_OUTPUT.relative_to(ROOT)), str(SHOWCASE_OUTPUT.relative_to(ROOT))]
    NATIVE.mkdir(parents=True, exist_ok=True)
    MAP_OUTPUT.write_text(map_xml, encoding="utf-8", newline="\n")
    SHOWCASE_OUTPUT.write_text(showcase_xml, encoding="utf-8", newline="\n")
    CHECKS_OUTPUT.write_text(json.dumps(checks, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"Exported {MAP_OUTPUT.name}: {checks['map']['parts']} map parts")
    print(f"Exported {SHOWCASE_OUTPUT.name}: {checks['showcaseActors']['parts']} actor parts plus the unchanged map")
    print(f"Metadata: {checks['metadata']['waypoints']} waypoints, {checks['metadata']['slots']} placement slots, MapData ModuleScript")
    print(f"Checks: {CHECKS_OUTPUT.name} ({checks['status']}; Studio validation not run)")


if __name__ == "__main__":
    main()
