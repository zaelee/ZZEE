"""Validate the final pack from its serialized files, independently of the exporters."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import base64
import hashlib
import json
import struct
import xml.etree.ElementTree as ET

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
PART_CLASSES = {"Part", "WedgePart"}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def item_name(item):
    node = item.find('./Properties/string[@name="Name"]')
    assert node is not None and node.text, "Roblox item has no Name"
    return node.text


def cframe(item):
    node = item.find('./Properties/CoordinateFrame[@name="CFrame"]')
    assert node is not None, f"{item_name(item)} has no CFrame"
    keys = ("X", "Y", "Z", "R00", "R01", "R02", "R10", "R11", "R12", "R20", "R21", "R22")
    return np.array([float(node.findtext(key)) for key in keys])


def parse_rbxmx(path):
    root = ET.parse(path).getroot()
    assert root.tag == "roblox" and root.attrib.get("version") == "4", path
    top = root.findall("Item")
    assert len(top) == 1, f"{path.name}: expected one top-level item"
    items = list(root.iter("Item"))
    referents = [item.attrib.get("referent") for item in items]
    assert all(referents) and len(referents) == len(set(referents)), f"{path.name}: duplicate/missing referent"
    refs = [ref.text for ref in root.iter("Ref") if ref.text not in (None, "null", "nil")]
    assert set(refs) <= set(referents), f"{path.name}: unresolved Ref"
    return root, top[0], items


def read_accessor(doc, data, index):
    accessor = doc["accessors"][index]
    assert "sparse" not in accessor and accessor.get("bufferView") is not None
    view = doc["bufferViews"][accessor["bufferView"]]
    assert view["buffer"] == 0 and "byteStride" not in view
    dtype = {5126: "<f4", 5125: "<u4", 5123: "<u2"}[accessor["componentType"]]
    width = {"SCALAR": 1, "VEC3": 3}[accessor["type"]]
    item_size = np.dtype(dtype).itemsize
    offset = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    length = accessor["count"] * width * item_size
    assert offset % item_size == 0
    assert accessor.get("byteOffset", 0) + length <= view["byteLength"]
    assert offset + length <= len(data)
    values = np.frombuffer(data, dtype=dtype, count=accessor["count"] * width, offset=offset)
    values = values.reshape(accessor["count"], width)
    assert np.isfinite(values).all()
    if "min" in accessor or "max" in accessor:
        assert "min" in accessor and "max" in accessor
        assert np.allclose(values.min(axis=0), accessor["min"])
        assert np.allclose(values.max(axis=0), accessor["max"])
    return values


def check_glb(path, doc, data):
    raw = path.read_bytes()
    assert len(raw) >= 28
    magic, version, size = struct.unpack_from("<4sII", raw)
    assert magic == b"glTF" and version == 2 and size == len(raw)
    json_length, json_type = struct.unpack_from("<I4s", raw, 12)
    assert json_type == b"JSON" and json_length % 4 == 0
    json_end = 20 + json_length
    glb_doc = json.loads(raw[20:json_end])
    bin_length, bin_type = struct.unpack_from("<I4s", raw, json_end)
    assert bin_type == b"BIN\0" and json_end + 8 + bin_length == len(raw)
    glb_data = raw[json_end + 8:]
    assert glb_data[:len(data)] == data and set(glb_data[len(data):]) <= {0}
    expected = json.loads(json.dumps(doc))
    expected["buffers"][0].pop("uri")
    assert expected == glb_doc and bin_length >= glb_doc["buffers"][0]["byteLength"]


def obj_triangle_count(path):
    count = 0
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("f "):
            vertices = line.split()[1:]
            assert len(vertices) >= 3
            count += len(vertices) - 2
    return count


def check_model(entry):
    gltf_path = ROOT / entry["gltf"]
    doc = json.loads(gltf_path.read_text(encoding="utf-8"))
    assert doc["asset"]["version"] == "2.0" and doc["scene"] == 0
    assert len(doc["buffers"]) == 1 and doc["buffers"][0]["uri"].startswith("data:")
    data = base64.b64decode(doc["buffers"][0]["uri"].split(",", 1)[1], validate=True)
    assert len(data) == doc["buffers"][0]["byteLength"]
    check_glb(ROOT / entry["glb"], doc, data)

    offsets = {}
    visited = set()

    def visit(index, offset):
        assert index not in visited, f'{entry["id"]}: node cycle/multiple parent'
        visited.add(index)
        node = doc["nodes"][index]
        assert not any(key in node for key in ("matrix", "rotation", "scale"))
        here = offset + np.asarray(node.get("translation", [0, 0, 0]), dtype=float)
        offsets[index] = here
        for child in node.get("children", []):
            visit(child, here)

    for index in doc["scenes"][0]["nodes"]:
        visit(index, np.zeros(3))
    assert len(visited) == len(doc["nodes"])

    world_vertices = []
    paw_mins = []
    triangles = 0
    largest = 0
    for node_index, node in enumerate(doc["nodes"]):
        if "mesh" not in node:
            continue
        mesh = doc["meshes"][node["mesh"]]
        for primitive in mesh["primitives"]:
            assert primitive.get("mode", 4) == 4
            vertices = read_accessor(doc, data, primitive["attributes"]["POSITION"])
            normals = read_accessor(doc, data, primitive["attributes"]["NORMAL"])
            indices = read_accessor(doc, data, primitive["indices"]).ravel()
            assert len(vertices) == len(normals) and len(indices) % 3 == 0
            assert len(indices) and indices.min() >= 0 and indices.max() < len(vertices)
            assert np.allclose(np.linalg.norm(normals, axis=1), 1, atol=2e-5)
            faces = indices.reshape(-1, 3)
            cross = np.cross(vertices[faces[:, 1]] - vertices[faces[:, 0]], vertices[faces[:, 2]] - vertices[faces[:, 0]])
            lengths = np.linalg.norm(cross, axis=1)
            assert (lengths > 1e-10).all()
            expected_normals = cross / lengths[:, None]
            assert np.allclose(normals[faces[:, 0]], expected_normals, atol=2e-5)
            volume = np.einsum("ij,ij->i", vertices[faces[:, 0]], np.cross(vertices[faces[:, 1]], vertices[faces[:, 2]])).sum() / 6
            assert volume > 0, node["name"]
            _, welded = np.unique(np.round(vertices, 6), axis=0, return_inverse=True)
            welded_faces = welded[faces]
            edges = Counter(tuple(sorted((int(a), int(b)))) for face in welded_faces for a, b in zip(face, np.roll(face, -1)))
            assert edges and set(edges.values()) == {2}, node["name"] + " is not closed"
            assert len(faces) <= 20000
            world_mesh = vertices + offsets[node_index]
            world_vertices.append(world_mesh)
            if node["name"].endswith("_Paw"):
                paw_mins.append(float(world_mesh[:, 1].min()))
            triangles += len(faces)
            largest = max(largest, len(faces))

    assert len(doc["meshes"]) == entry["parts"]
    assert triangles == entry["triangles"]
    assert largest == entry["largestMeshTriangles"]
    assert obj_triangle_count(ROOT / entry["obj"]) == triangles
    mouth = [offsets[i] for i, node in enumerate(doc["nodes"]) if node["name"] == "Mouth_Att"]
    assert len(mouth) == 1 and np.allclose(mouth[0], entry["mouth"], atol=1e-6)
    world = np.concatenate(world_vertices)
    assert len(paw_mins) == 4 and np.allclose(paw_mins, 0, atol=1e-6), f'{entry["id"]}: feet are not grounded'
    assert abs(world[:, 1].min()) < 1e-6
    assert np.allclose(world.min(axis=0), entry["bounds"]["min"], atol=1e-6)
    assert np.allclose(world.max(axis=0), entry["bounds"]["max"], atol=1e-6)
    return {
        "id": entry["id"],
        "file": gltf_path.name,
        "meshCount": len(doc["meshes"]),
        "triangles": triangles,
        "largestMeshTriangles": largest,
        "closedMeshes": True,
        "positiveVolumes": True,
        "normalsAndWinding": True,
        "glbMatchesGltf": True,
        "objTriangleCountMatches": True,
        "worldBoundsMatchManifest": True,
        "feetGrounded": True,
        "mouthWorld": mouth[0].tolist(),
        "sha256": sha(gltf_path),
    }


def check_native(manifest, upgrades):
    report = json.loads((ROOT / "docs/native-validation.json").read_text(encoding="utf-8"))
    assert report["passed"] is True and report["studioTested"] is False
    rows = report["models"]
    assert len(rows) == len(manifest)+len(upgrades) and len({row["id"] for row in rows}) == len(rows)
    reports = {row["id"]: row for row in rows}
    individual = {}
    result = []
    for entry in manifest+upgrades:
        row = reports[entry["id"]]
        scene_path = ROOT / entry["scene"]
        assert row["source"] == entry["scene"] and row["sourceSha256"] == sha(scene_path)
        assert row["checks"]["partCount"] == entry["parts"] and row["checks"]["uniqueReferents"] is True
        _, top, items = parse_rbxmx(ROOT / entry["native"])
        assert top.attrib["class"] == "Model" and item_name(top) == entry["displayName"]
        parts = [item for item in items if item.attrib["class"] in PART_CLASSES]
        scene = json.loads(scene_path.read_text(encoding="utf-8"))
        assert len(parts) == entry["parts"]
        part_names = [item_name(part) for part in parts]
        assert len(part_names) == len(set(part_names))
        assert set(part_names) == {part["name"] for part in scene["parts"]}
        assert sum(item.attrib["class"] == "Attachment" for item in items) == 1
        individual[entry["id"]] = {item.attrib["referent"]: item for item in items}
        result.append({"id": entry["id"], "file": entry["native"], "parts": len(parts), "sceneSha256Current": True})

    _, pack, combined_items = parse_rbxmx(ROOT / "native/Pupsters-All-Dogs.rbxmx")
    assert pack.attrib["class"] == "Model" and item_name(pack) == "Pupsters_Block_Pack"
    models = pack.findall("Item")
    assert len(models) == len(manifest) == 6
    for index, (entry, model) in enumerate(zip(manifest, models)):
        assert item_name(model) == entry["displayName"]
        prefix = entry["id"] + "_"
        combined = {item.attrib["referent"][len(prefix):]: item for item in model.iter("Item") if item.attrib["referent"].startswith(prefix)}
        source = individual[entry["id"]]
        assert set(combined) == set(source)
        dx, dz = (index % 3 - 1) * 4, (index // 3) * 4
        for referent, source_item in source.items():
            packed_item = combined[referent]
            assert packed_item.attrib["class"] == source_item.attrib["class"]
            assert item_name(packed_item) == item_name(source_item)
            if source_item.attrib["class"] in PART_CLASSES:
                expected = cframe(source_item)
                expected[[0, 2]] += [dx, dz]
                assert np.allclose(cframe(packed_item), expected, atol=1e-9)
    assert len(combined_items) == 1 + sum(len(individual[entry['id']]) for entry in manifest)
    return result, {"file": "native/Pupsters-All-Dogs.rbxmx", "models": 6, "uniqueReferents": True, "gridTranslations": True}


def check_html_links():
    checked = []

    class Links(HTMLParser):
        def __init__(self, html_path):
            super().__init__()
            self.html_path = html_path

        def handle_starttag(self, tag, attrs):
            for key, value in attrs:
                if key not in ("src", "href") or not value:
                    continue
                parsed = urlsplit(value)
                if parsed.scheme or parsed.netloc or not parsed.path:
                    continue
                relative = Path(unquote(parsed.path.lstrip("/")))
                target = (ROOT if parsed.path.startswith("/") else self.html_path.parent) / relative
                assert target.is_file(), f"{self.html_path.relative_to(ROOT)}: broken link {value}"

    for relative in ("index.html", "viewer.html", "viewer/viewer.html"):
        path = ROOT / relative
        if path.is_file():
            Links(path).feed(path.read_text(encoding="utf-8"))
            checked.append(relative)
    return checked


def main():
    manifest_doc = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    entries = manifest_doc["models"]
    upgrades = manifest_doc.get('upgrades', [])
    assert len(entries) == 6 and len({entry["id"] for entry in entries}) == 6
    silhouette_dimensions = []
    for entry in entries:
        scene = json.loads((ROOT / entry['scene']).read_text(encoding='utf-8'))
        assert all(part['type'] in ('box', 'sphere') for part in scene['parts']), 'Pointed primitive in block pack'
        head = next(part for part in scene['parts'] if part['name'] in ('BigHead', 'CoreHead', 'NarrowHead'))
        silhouette_dimensions.append({'id': entry['id'], 'headSize': head['size']})
    models = [check_model(entry) for entry in entries+upgrades]
    native_models, native_pack = check_native(entries, upgrades)
    html_files = check_html_links()
    result = {
        "passed": True,
        "models": models,
        "nativeModels": native_models,
        "nativePack": native_pack,
        "pointedWedgeParts": 0,
        "headDimensions": silhouette_dimensions,
        "htmlFilesChecked": html_files,
        "cpuRendersInspected": True,
        "cpuRenderModelCount": len(entries)+len(upgrades),
        "robloxStudioTested": False,
        "browserViewerTested": False,
        "scope": "Six static sitting dogs and one poodle upgrade appearance; no skeletal rig, animation or upgrade gameplay.",
    }
    (ROOT / "docs/validation.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
