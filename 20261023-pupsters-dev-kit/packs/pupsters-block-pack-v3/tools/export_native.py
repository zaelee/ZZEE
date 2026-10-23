#!/usr/bin/env python3
"""Export a block-dog scene to Roblox XML and a Command Bar builder."""

from __future__ import annotations

import json
import math
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape


GROUPS = ("Body", "Head", "LegFL", "LegFR", "LegBL", "LegBR", "Tail", "MouthBone", "FX")
PART_TYPES = {"box", "sphere", "cylinder", "wedge"}
SURFACES = ("TopSurface", "BottomSurface", "LeftSurface", "RightSurface", "FrontSurface", "BackSurface")


def fail(message: str) -> None:
    raise ValueError(message)


def number(value: object, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        fail(f"{label} must be a finite number")
    return float(value)


def vector(value: object, label: str, *, positive: bool = False) -> list[float]:
    if not isinstance(value, list) or len(value) != 3:
        fail(f"{label} must be an array of three numbers")
    result = [number(component, f"{label}[{index}]") for index, component in enumerate(value)]
    if positive and any(component <= 0.0 for component in result):
        fail(f"{label} components must be positive")
    return result


def validate_scene(raw: object) -> dict:
    if not isinstance(raw, dict):
        fail("scene root must be an object")
    if not isinstance(raw.get("name"), str) or not raw["name"].strip():
        fail("name must be a non-empty string")
    materials_raw = raw.get("materials")
    if not isinstance(materials_raw, dict) or not materials_raw:
        fail("materials must be a non-empty object")
    materials: dict[str, dict[str, list[float]]] = {}
    for key, material in materials_raw.items():
        if not isinstance(key, str) or not key:
            fail("material keys must be non-empty strings")
        if not isinstance(material, dict):
            fail(f"materials.{key} must be an object")
        color = vector(material.get("color"), f"materials.{key}.color")
        if any(component < 0.0 or component > 1.0 for component in color):
            fail(f"materials.{key}.color components must be in 0..1")
        materials[key] = {"color": color}

    parts_raw = raw.get("parts")
    if not isinstance(parts_raw, list) or not parts_raw:
        fail("parts must be a non-empty array")
    parts = []
    for index, part in enumerate(parts_raw):
        label = f"parts[{index}]"
        if not isinstance(part, dict):
            fail(f"{label} must be an object")
        name = part.get("name")
        group = part.get("group")
        part_type = part.get("type")
        material = part.get("material")
        if not isinstance(name, str) or not name:
            fail(f"{label}.name must be a non-empty string")
        if group not in GROUPS:
            fail(f"{label}.group must be one of {', '.join(GROUPS)}")
        if part_type not in PART_TYPES:
            fail(f"{label}.type must be one of {', '.join(sorted(PART_TYPES))}")
        if material not in materials:
            fail(f"{label}.material references unknown material {material!r}")
        parts.append(
            {
                "name": name,
                "group": group,
                "type": part_type,
                "size": vector(part.get("size"), f"{label}.size", positive=True),
                "position": vector(part.get("position"), f"{label}.position"),
                "rotation": vector(part.get("rotation"), f"{label}.rotation"),
                "material": material,
            }
        )

    return {
        "name": raw["name"],
        "materials": materials,
        "parts": parts,
        "mouth": vector(raw.get("mouth"), "mouth"),
    }


def rotation_matrix(rotation: list[float]) -> list[list[float]]:
    """Return R=Rx*Ry*Rz, matching THREE.Euler(..., 'XYZ')."""
    x, y, z = rotation
    cx, sx = math.cos(x), math.sin(x)
    cy, sy = math.cos(y), math.sin(y)
    cz, sz = math.cos(z), math.sin(z)
    return [
        [cy * cz, -cy * sz, sy],
        [cx * sz + sx * sy * cz, cx * cz - sx * sy * sz, -sx * cy],
        [sx * sz - cx * sy * cz, sx * cz + cx * sy * sz, cx * cy],
    ]


def transpose_multiply(matrix: list[list[float]], vector_value: list[float]) -> list[float]:
    return [sum(matrix[row][column] * vector_value[row] for row in range(3)) for column in range(3)]


def multiply_vector(matrix: list[list[float]], vector_value: list[float]) -> list[float]:
    return [sum(matrix[row][column] * vector_value[column] for column in range(3)) for row in range(3)]


def choose_mouth_part(scene: dict) -> tuple[int, list[float]]:
    candidates = [(index, part) for index, part in enumerate(scene["parts"]) if part["group"] == "Head"]
    if not candidates:
        fail("at least one Head part is required for the Mouth attachment")
    named_center = [(index, part) for index, part in candidates if part["name"] == "MouthCenter"]
    if named_center:
        candidates = named_center
    mouth = scene["mouth"]
    scored = []
    for index, part in candidates:
        delta = [mouth[axis] - part["position"][axis] for axis in range(3)]
        local = transpose_multiply(rotation_matrix(part["rotation"]), delta)
        outside = sum(max(abs(local[axis]) - part["size"][axis] / 2.0, 0.0) ** 2 for axis in range(3))
        center = sum((local[axis] / part["size"][axis]) ** 2 for axis in range(3))
        scored.append((outside, center, index, local))
    _, _, index, local = min(scored)
    return index, local


def fmt(value: float) -> str:
    value = 0.0 if abs(value) < 5e-13 else value
    return format(value, ".10g")


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


def build_rbxmx(scene: dict, mouth_part_index: int, mouth_local: list[float]) -> str:
    referent = 0

    def ref() -> str:
        nonlocal referent
        referent += 1
        return f"RBX{referent}"

    lines = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<roblox version="4">',
        '  <External>null</External>',
        '  <External>nil</External>',
        f'  <Item class="Model" referent="{ref()}">',
        '    <Properties>',
        f'      <string name="Name">{xml_name(scene["name"])}</string>',
        '    </Properties>',
    ]
    by_group = {group: [] for group in GROUPS}
    for index, part in enumerate(scene["parts"]):
        by_group[part["group"]].append((index, part))
    for group in GROUPS:
        lines.extend(
            [
                f'    <Item class="Model" referent="{ref()}">',
                '      <Properties>',
                f'        <string name="Name">{xml_name(group)}</string>',
                '      </Properties>',
            ]
        )
        for index, part in by_group[group]:
            class_name = "WedgePart" if part["type"] == "wedge" else "Part"
            lines.append(f'      <Item class="{class_name}" referent="{ref()}">')
            lines.append('        <Properties>')
            lines.append('          <bool name="Anchored">true</bool>')
            lines.append('          <bool name="CanCollide">false</bool>')
            lines.extend(cframe_xml(part["position"], rotation_matrix(part["rotation"]), "          "))
            lines.extend(color_xml(scene["materials"][part["material"]]["color"], "          "))
            material_token = 288 if part['group'] == 'FX' else 272
            lines.append(f'          <token name="Material">{material_token}</token>')
            lines.append(f'          <string name="Name">{xml_name(part["name"])}</string>')
            if class_name == "Part":
                shape = {"sphere": 0, "box": 1, "cylinder": 2}[part["type"]]
                lines.append(f'          <token name="Shape">{shape}</token>')
            for surface in SURFACES:
                lines.append(f'          <token name="{surface}">0</token>')
            lines.extend(vector_xml("size", part["size"], "          "))
            lines.append('        </Properties>')
            if index == mouth_part_index:
                lines.extend(
                    [
                        f'        <Item class="Attachment" referent="{ref()}">',
                        '          <Properties>',
                    ]
                )
                lines.extend(cframe_xml(mouth_local, [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]], "            "))
                lines.extend(
                    [
                        '            <string name="Name">Mouth</string>',
                        '          </Properties>',
                        '        </Item>',
                    ]
                )
            lines.append('      </Item>')
        lines.append('    </Item>')
    lines.extend(['  </Item>', '</roblox>', ''])
    return "\n".join(lines)


def luau_string(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'


def luau_vector(value: list[float]) -> str:
    return f"Vector3.new({fmt(value[0])}, {fmt(value[1])}, {fmt(value[2])})"


def build_luau(scene: dict, mouth_part_index: int) -> str:
    material_lines = [
        f"\t[{luau_string(key)}] = Color3.new({', '.join(fmt(component) for component in material['color'])}),"
        for key, material in scene["materials"].items()
    ]
    part_lines = []
    for part in scene["parts"]:
        matrix = rotation_matrix(part["rotation"])
        cframe_values = part["position"] + [matrix[row][column] for row in range(3) for column in range(3)]
        part_lines.append(
            "\t{ name = %s, group = %s, kind = %s, size = %s, cframe = CFrame.new(%s), material = %s },"
            % (
                luau_string(part["name"]),
                luau_string(part["group"]),
                luau_string(part["type"]),
                luau_vector(part["size"]),
                ", ".join(fmt(value) for value in cframe_values),
                luau_string(part["material"]),
            )
        )
    return "\n".join(
        [
            "-- Generated from a PUPSTERS block-dog scene. Paste the whole file into the Roblox Studio Command Bar.",
            "local Selection = game:GetService(\"Selection\")",
            "local groups = { \"Body\", \"Head\", \"LegFL\", \"LegFR\", \"LegBL\", \"LegBR\", \"Tail\", \"MouthBone\", \"FX\" }",
            "local colors = {",
            *material_lines,
            "}",
            "local parts = {",
            *part_lines,
            "}",
            f"local mouthPartIndex = {mouth_part_index + 1}",
            f"local mouthWorld = {luau_vector(scene['mouth'])}",
            "",
            "local model = Instance.new(\"Model\")",
            f"model.Name = {luau_string(scene['name'])}",
            "local groupModels = {}",
            "local builtParts = {}",
            "for _, groupName in ipairs(groups) do",
            "\tlocal group = Instance.new(\"Model\")",
            "\tgroup.Name = groupName",
            "\tgroup.Parent = model",
            "\tgroupModels[groupName] = group",
            "end",
            "",
            "for index, data in ipairs(parts) do",
            "\tlocal part = Instance.new(data.kind == \"wedge\" and \"WedgePart\" or \"Part\")",
            "\tpart.Name = data.name",
            "\tpart.Anchored = true",
            "\tpart.CanCollide = false",
            "\tpart.Material = data.group == \"FX\" and Enum.Material.Neon or Enum.Material.SmoothPlastic",
            "\tpart.Color = colors[data.material]",
            "\tpart.Size = data.size",
            "\tpart.CFrame = data.cframe",
            "\tif data.kind == \"sphere\" then",
            "\t\tpart.Shape = Enum.PartType.Ball",
            "\telseif data.kind == \"cylinder\" then",
            "\t\tpart.Shape = Enum.PartType.Cylinder",
            "\tend",
            "\tpart.TopSurface = Enum.SurfaceType.Smooth",
            "\tpart.BottomSurface = Enum.SurfaceType.Smooth",
            "\tpart.LeftSurface = Enum.SurfaceType.Smooth",
            "\tpart.RightSurface = Enum.SurfaceType.Smooth",
            "\tpart.FrontSurface = Enum.SurfaceType.Smooth",
            "\tpart.BackSurface = Enum.SurfaceType.Smooth",
            "\tpart.Parent = groupModels[data.group]",
            "\tbuiltParts[index] = part",
            "end",
            "",
            "local mouth = Instance.new(\"Attachment\")",
            "mouth.Name = \"Mouth\"",
            "mouth.Position = builtParts[mouthPartIndex].CFrame:PointToObjectSpace(mouthWorld)",
            "mouth.Parent = builtParts[mouthPartIndex]",
            "",
            "-- Place the model on y=0 near the current camera focus, probing +X for open space.",
            "local minCorner = Vector3.new(math.huge, math.huge, math.huge)",
            "local maxCorner = Vector3.new(-math.huge, -math.huge, -math.huge)",
            "for _, part in ipairs(builtParts) do",
            "\tlocal half = part.Size / 2",
            "\tlocal r, u, b = part.CFrame.RightVector, part.CFrame.UpVector, part.CFrame.ZVector",
            "\tlocal extent = Vector3.new(",
            "\t\tmath.abs(r.X) * half.X + math.abs(u.X) * half.Y + math.abs(b.X) * half.Z,",
            "\t\tmath.abs(r.Y) * half.X + math.abs(u.Y) * half.Y + math.abs(b.Y) * half.Z,",
            "\t\tmath.abs(r.Z) * half.X + math.abs(u.Z) * half.Y + math.abs(b.Z) * half.Z",
            "\t)",
            "\tminCorner = minCorner:Min(part.Position - extent)",
            "\tmaxCorner = maxCorner:Max(part.Position + extent)",
            "end",
            "local size = maxCorner - minCorner",
            "local sourceCenter = (minCorner + maxCorner) / 2",
            "local focus = workspace.CurrentCamera and workspace.CurrentCamera.Focus.Position or Vector3.zero",
            "local base = Vector3.new(math.floor(focus.X / 4) * 4, size.Y / 2 + 0.05, math.floor(focus.Z / 4) * 4)",
            "local overlap = OverlapParams.new()",
            "overlap.FilterType = Enum.RaycastFilterType.Exclude",
            "overlap.FilterDescendantsInstances = {}",
            "local probeSize = Vector3.new(math.max(size.X, 0.1), math.max(size.Y - 0.1, 0.1), math.max(size.Z, 0.1))",
            "local target = base",
            "for attempt = 0, 20 do",
            "\tlocal candidate = base + Vector3.new(attempt * (size.X + 2), 0, 0)",
            "\tif #workspace:GetPartBoundsInBox(CFrame.new(candidate), probeSize, overlap) == 0 then",
            "\t\ttarget = candidate",
            "\t\tbreak",
            "\tend",
            "end",
            "model:PivotTo(CFrame.new(target))",
            "model.Parent = workspace",
            "Selection:Set({ model })",
            "print(string.format(\"Created %s with %d parts\", model:GetFullName(), #builtParts))",
            "",
        ]
    )


def matrix_metrics(matrices: list[list[list[float]]]) -> tuple[float, float]:
    max_orthogonal_error = 0.0
    max_determinant_error = 0.0
    for matrix in matrices:
        for row_a in range(3):
            for row_b in range(3):
                dot = sum(matrix[row_a][axis] * matrix[row_b][axis] for axis in range(3))
                expected = 1.0 if row_a == row_b else 0.0
                max_orthogonal_error = max(max_orthogonal_error, abs(dot - expected))
        determinant = (
            matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1])
            - matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0])
            + matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])
        )
        max_determinant_error = max(max_determinant_error, abs(determinant - 1.0))
    return max_orthogonal_error, max_determinant_error


def validate_outputs(scene: dict, rbxmx: str, luau: str, mouth_part_index: int, mouth_local: list[float]) -> dict:
    xml_root = ET.fromstring(rbxmx)
    items = xml_root.findall(".//Item")
    referents = [item.attrib.get("referent") for item in items]
    if None in referents or len(referents) != len(set(referents)):
        fail("RBXMX item referents must exist and be unique")
    class_counts: dict[str, int] = {}
    for item in items:
        class_counts[item.attrib["class"]] = class_counts.get(item.attrib["class"], 0) + 1
    expected = {
        "Model": 1 + len(GROUPS),
        "Part": sum(part["type"] != "wedge" for part in scene["parts"]),
        "WedgePart": sum(part["type"] == "wedge" for part in scene["parts"]),
        "Attachment": 1,
    }
    if class_counts != {key: value for key, value in expected.items() if value}:
        fail(f"RBXMX class counts differ: {class_counts} != {expected}")
    common_part_properties = {
        "Anchored", "CanCollide", "CFrame", "Color", "Material", "Name", "size", *SURFACES
    }
    for item in items:
        properties = item.find("Properties")
        if properties is None:
            fail(f"{item.attrib['class']} has no Properties element")
        property_names = {property_element.attrib.get("name") for property_element in properties}
        class_name = item.attrib["class"]
        expected_properties = {
            "Model": {"Name"},
            "Part": common_part_properties | {"Shape"},
            "WedgePart": common_part_properties,
            "Attachment": {"CFrame", "Name"},
        }[class_name]
        if property_names != expected_properties:
            fail(f"{class_name} properties differ: {property_names} != {expected_properties}")
    serialized_parts = [item for item in items if item.attrib["class"] in {"Part", "WedgePart"}]
    expected_parts = [
        (index, part)
        for group in GROUPS
        for index, part in enumerate(scene["parts"])
        if part["group"] == group
    ]
    if len(serialized_parts) != len(expected_parts):
        fail("serialized part count differs from the scene")
    serialized_matrices = []
    max_serialized_value_error = 0.0
    attachment_local = None
    attachment_parent_index = None
    for serialized_item, (source_index, part) in zip(serialized_parts, expected_parts):
        properties = serialized_item.find("Properties")
        assert properties is not None
        name_element = properties.find('./string[@name="Name"]')
        if name_element is None or name_element.text != part["name"]:
            fail("serialized part order or names differ from the scene")
        size_element = properties.find('./Vector3[@name="size"]')
        cframe_element = properties.find('./CoordinateFrame[@name="CFrame"]')
        color_element = properties.find('./Color3[@name="Color"]')
        if size_element is None or cframe_element is None or color_element is None:
            fail(f"{part['name']} is missing size, CFrame, or color data")
        serialized_size = [float(size_element.findtext(axis)) for axis in ("X", "Y", "Z")]
        serialized_position = [float(cframe_element.findtext(axis)) for axis in ("X", "Y", "Z")]
        serialized_matrix = [
            [float(cframe_element.findtext(f"R{row}{column}")) for column in range(3)]
            for row in range(3)
        ]
        serialized_color = [float(color_element.findtext(axis)) for axis in ("R", "G", "B")]
        expected_material = '288' if part['group'] == 'FX' else '272'
        if properties.findtext('./token[@name="Material"]') != expected_material:
            fail(f"{part['name']} has the wrong Roblox material")
        if any(value <= 0.0 for value in serialized_size):
            fail(f"{part['name']} has a non-positive serialized size")
        expected_matrix = rotation_matrix(part["rotation"])
        actual_values = serialized_size + serialized_position + serialized_color + [
            serialized_matrix[row][column] for row in range(3) for column in range(3)
        ]
        expected_values = part["size"] + part["position"] + scene["materials"][part["material"]]["color"] + [
            expected_matrix[row][column] for row in range(3) for column in range(3)
        ]
        max_serialized_value_error = max(
            max_serialized_value_error,
            max(abs(actual - expected) for actual, expected in zip(actual_values, expected_values)),
        )
        serialized_matrices.append(serialized_matrix)
        attachments = serialized_item.findall('./Item[@class="Attachment"]')
        if attachments:
            if len(attachments) != 1 or attachment_local is not None:
                fail("RBXMX must contain exactly one Mouth attachment")
            attachment_parent_index = source_index
            attachment_cframe = attachments[0].find('./Properties/CoordinateFrame[@name="CFrame"]')
            if attachment_cframe is None:
                fail("Mouth attachment is missing its local CFrame")
            attachment_local = [float(attachment_cframe.findtext(axis)) for axis in ("X", "Y", "Z")]
    if max_serialized_value_error > 1e-8:
        fail(f"serialized numeric error is too high: {max_serialized_value_error}")
    if attachment_parent_index != mouth_part_index or attachment_local is None:
        fail("Mouth attachment is parented to the wrong part")
    names = [element.text for element in xml_root.findall('.//string[@name="Name"]')]
    if names.count(scene["name"]) != 1 or any(group not in names for group in GROUPS) or names.count("Mouth") != 1:
        fail("RBXMX model, group, or attachment names are inconsistent")
    if luau.count("Selection:Set({ model })") != 1 or "Destroy(" in luau or ":ClearAllChildren(" in luau:
        fail("Luau builder must select the new model and must not delete instances")
    if luau.count("] = Color3.new(") != len(scene["materials"]):
        fail("Luau material literals are inconsistent with the scene")
    if luau.count("\t{ name = ") != len(scene["parts"]):
        fail("Luau part literals are inconsistent with the scene")
    if luau.count("(") != luau.count(")") or luau.count("{") != luau.count("}"):
        fail("Luau generated delimiters are unbalanced")

    part = scene["parts"][mouth_part_index]
    reconstructed_offset = multiply_vector(rotation_matrix(part["rotation"]), attachment_local)
    reconstructed = [part["position"][axis] + reconstructed_offset[axis] for axis in range(3)]
    mouth_error = max(abs(reconstructed[axis] - scene["mouth"][axis]) for axis in range(3))
    if mouth_error > 1e-9:
        fail(f"Mouth attachment world position error is {mouth_error}")
    orthogonal_error, determinant_error = matrix_metrics(serialized_matrices)
    if orthogonal_error > 1e-8 or determinant_error > 1e-8:
        fail("generated CFrame rotation matrices are not orthonormal proper rotations")
    return {
        "xmlItemCount": len(items),
        "classCounts": class_counts,
        "partCount": len(scene["parts"]),
        "groupCount": len(GROUPS),
        "materialCount": len(scene["materials"]),
        "positiveSizes": True,
        "materialReferencesResolved": True,
        "rbxmxPropertySchemaConsistent": True,
        "uniqueReferents": True,
        "maxCFrameOrthonormalError": orthogonal_error,
        "maxCFrameDeterminantError": determinant_error,
        "maxSerializedNumericError": max_serialized_value_error,
        "mouthParentPart": part["name"],
        "mouthParentGroup": part["group"],
        "maxMouthWorldPositionError": mouth_error,
        "luauCreatesWithoutDeletion": True,
        "luauTemplateStaticChecks": True,
        "luauInterpreterCheck": "not-run (no Luau CLI installed)",
    }
