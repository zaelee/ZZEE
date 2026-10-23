#!/usr/bin/env python3
"""Build the offline enemy-motion gallery and interactive viewer pages."""

from __future__ import annotations

import html
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ANIMATIONS = ROOT / "animations"
SCENES = ROOT / "scenes"
EXPECTED_IDS = [f"E{index:02d}" for index in range(1, 9)] + ["B01"]
MOTIONS = {
    "move": {"name": "이동", "description": "적의 실루엣과 무게감이 보이는 이동 모션", "duration": 1.2},
    "hit": {"name": "피격", "description": "공격을 맞았을 때의 짧고 분명한 반응", "duration": 0.6},
    "death": {"name": "쓰러짐", "description": "전투 불능 상태로 이어지는 마무리 모션", "duration": 1.6},
}


def read_json(path: Path) -> dict:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path.name}: root must be an object")
    return value


def validate_document(document: dict, identity: str, source: Path) -> None:
    if document.get("id") != identity:
        raise ValueError(f"{source.name}: expected id {identity!r}, got {document.get('id')!r}")
    parts = document.get("parts")
    clips = document.get("clips")
    if not isinstance(parts, list) or not parts:
        raise ValueError(f"{source.name}: parts must be a non-empty array")
    if not isinstance(clips, dict):
        raise ValueError(f"{source.name}: clips must be an object")
    part_count = len(parts)
    for key, expected in MOTIONS.items():
        clip = clips.get(key)
        if not isinstance(clip, dict):
            raise ValueError(f"{source.name}: missing {key} clip")
        if abs(float(clip.get("duration", -1)) - expected["duration"]) > 1e-6:
            raise ValueError(f"{source.name}: {key} duration must be {expected['duration']}")
        if int(clip.get("fps", -1)) != 30:
            raise ValueError(f"{source.name}: {key} fps must be 30")
        frames = clip.get("frames")
        if not isinstance(frames, list) or len(frames) < 2:
            raise ValueError(f"{source.name}: {key} needs at least two frames")
        previous = -1.0
        for frame_index, frame in enumerate(frames):
            time = float(frame.get("time", -1))
            transforms = frame.get("transforms")
            if time < previous or not isinstance(transforms, list) or len(transforms) != part_count:
                raise ValueError(f"{source.name}: invalid {key} frame {frame_index}")
            if any(not isinstance(row, list) or len(row) != 11 for row in transforms):
                raise ValueError(f"{source.name}: {key} frame {frame_index} has an invalid transform")
            previous = time
        if abs(float(frames[0]["time"])) > 1e-6 or abs(float(frames[-1]["time"]) - expected["duration"]) > 1e-6:
            raise ValueError(f"{source.name}: {key} frame range must be 0..{expected['duration']}")


def load_metadata() -> list[dict]:
    scene_by_id = {}
    for path in SCENES.glob("*.json"):
        scene = read_json(path)
        if scene.get("id") in EXPECTED_IDS:
            scene_by_id[scene["id"]] = scene

    metadata = []
    for identity in EXPECTED_IDS:
        animation_path = ANIMATIONS / f"{identity}.json"
        document = read_json(animation_path) if animation_path.is_file() else None
        if document:
            validate_document(document, identity, animation_path)
        source = document or scene_by_id.get(identity)
        if not source:
            raise FileNotFoundError(f"Missing metadata for {identity}")
        clips = document.get("clips", {}) if document else {}
        metadata.append(
            {
                "id": identity,
                "displayName": source.get("displayName") or source.get("name") or identity,
                "feature": source.get("feature") or "블록 파트로 만든 적 캐릭터",
                "clips": {
                    key: {
                        "name": clips.get(key, {}).get("name") or defaults["name"],
                        "description": clips.get(key, {}).get("description") or defaults["description"],
                    }
                    for key, defaults in MOTIONS.items()
                },
            }
        )
    return metadata


def picture(identity: str, motion: str, alt: str, css_class: str = "") -> str:
    class_attribute = f' class="{css_class}"' if css_class else ""
    return (
        f"<picture{class_attribute}>"
        f'<source media="(prefers-reduced-motion: reduce)" srcset="previews/{identity}-{motion}.png">'
        f'<img loading="lazy" src="previews/{identity}-{motion}.gif" alt="{html.escape(alt)}">'
        "</picture>"
    )


def card(item: dict) -> str:
    identity = item["id"]
    name = html.escape(item["displayName"])
    feature = html.escape(item["feature"])
    clip = item["clips"]["move"]
    clip_name = html.escape(clip["name"])
    clip_description = html.escape(clip["description"])
    descriptions = " ".join(
        f'data-{key}-name="{html.escape(value["name"], quote=True)}" '
        f'data-{key}-description="{html.escape(value["description"], quote=True)}"'
        for key, value in item["clips"].items()
    )
    return f"""<article class="motion-card" data-enemy="{identity}" {descriptions}>
  <div class="card-head"><span>{identity} / ENEMY MOTIONS</span><h2>{name}</h2><p>{feature}</p></div>
  <a class="motion-poster" data-viewer-link href="viewer.html?enemy={identity}&amp;motion=move" aria-label="{name} 이동 모션 3D 보기">{picture(identity, 'move', f'{item["displayName"]} 이동 모션')}</a>
  <p class="motion-copy"><strong data-motion-name>{clip_name}</strong><span data-motion-description>{clip_description}</span></p>
  <div class="downloads"><a data-viewer-link href="viewer.html?enemy={identity}&amp;motion=move">3D 모션 보기 ↗</a><a class="secondary" href="roblox/{identity}-motions.rbxmx" download>Roblox ↓</a><a class="secondary" href="animations/{identity}-motions.glb" download>GLB ↓</a></div>
</article>"""


def build_index(items: list[dict]) -> str:
    cards = "\n".join(card(item) for item in items)
    return f"""<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>사고멍치 · 적 캐릭터 모션</title><link rel="stylesheet" href="viewer/motion.css"></head>
<body><main><header><div class="eyebrow">PUPSTERS / ENEMY MOTIONS / V1</div><h1>움직이고, 맞고, 쓰러집니다.</h1><p class="intro">아홉 적 캐릭터의 이동·피격·쓰러짐 모션을 같은 카메라에서 비교하세요.<br>미리보기를 누르면 드래그·속도·프레임 탐색이 가능한 오프라인 3D 뷰어가 열립니다.</p></header>
<nav class="motion-tabs" aria-label="갤러리 모션 선택"><button type="button" data-gallery-motion="move" aria-pressed="true">이동 · 1.2초</button><button type="button" data-gallery-motion="hit" aria-pressed="false">피격 · 0.6초</button><button type="button" data-gallery-motion="death" aria-pressed="false">쓰러짐 · 1.6초</button></nav>
<div class="pack-actions"><a class="primary-link" href="roblox/Pupsters-Enemy-Motions-Demo.rbxmx" download>Roblox 데모 한 번에 넣기 ↓</a><a href="previews/motions-overview.png">모션 한눈에 보기</a><a href="README.txt">적용 안내</a><span>9종 · 3모션 · 30fps</span></div>
<section class="motion-grid" aria-label="적 캐릭터 모션 목록">{cards}</section>
<section class="overview"><h2 id="overview-title">아홉 적의 이동 한눈에 보기</h2><picture><source id="overview-source" media="(prefers-reduced-motion: reduce)" srcset="previews/motions-overview.png"><img id="overview-image" src="previews/all-move.gif" alt="아홉 적 캐릭터의 이동 모션 모음"></picture><p id="overview-copy">카드 위 버튼으로 같은 모션을 아홉 캐릭터에 한 번에 적용할 수 있습니다.</p></section>
<section class="notes"><h2>사용 전 확인</h2><p>모든 동작은 고정된 파트의 위치·회전·크기·표시 상태를 절차적으로 재생합니다. 뷰어와 파일은 네트워크 연결 없이 열립니다.</p><p class="notice">Roblox Studio 가져오기와 게임 로직 연결은 README의 범위를 확인하세요.</p></section>
<footer>PUPSTERS / ENEMY MOTION PREVIEW / OFFLINE · <a href="README.txt">제작·적용 안내</a></footer></main><script src="viewer/motion-viewer.js"></script></body></html>
"""


def build_viewer(items: list[dict]) -> str:
    options = "".join(
        f'<option value="{item["id"]}">{html.escape(item["displayName"])}</option>' for item in items
    )
    first = items[0]
    first_clip = first["clips"]["move"]
    fallback = picture(first["id"], "move", f'{first["displayName"]} 이동 이미지 미리보기', "motion-fallback")
    return f"""<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(first["displayName"])} · {html.escape(first_clip["name"])}</title><link rel="stylesheet" href="viewer/motion.css"></head>
<body><main><a class="back-link" href="index.html">← 적 모션 목록으로</a><header class="viewer-header"><div><div class="eyebrow"><span id="enemy-code">{first["id"]}</span> / PROCEDURAL MOTION</div><h1 id="enemy-title">{html.escape(first["displayName"])}</h1><p><strong id="motion-title">{html.escape(first_clip["name"])}</strong> · <span id="motion-description">{html.escape(first_clip["description"])}</span></p></div><label class="select-label">적 선택<select id="enemy-select">{options}</select></label></header>
<section class="viewer-layout"><div id="motion-stage" class="motion-stage">{fallback}<span id="phase-label" class="phase-badge" data-phase="start">START · 출발</span><span id="end-state" class="end-state" hidden>DEFEATED · 전투 불능</span></div>
<aside class="control-panel" aria-label="적 모션 재생 제어"><h2>모션 타임라인</h2><p>드래그로 카메라를 돌리고 원하는 순간을 직접 확인하세요.</p>
<section class="control-group"><h3>모션</h3><div class="button-row"><button type="button" data-motion="move" aria-pressed="true">이동</button><button type="button" data-motion="hit">피격</button><button type="button" data-motion="death">쓰러짐</button></div></section>
<section class="control-group"><h3>재생</h3><div class="button-row"><button type="button" data-playback="once">한 번</button><button type="button" data-playback="repeat">반복</button><button type="button" data-playback="pause">일시정지</button><button type="button" data-playback="reset">처음으로</button></div></section>
<section class="control-group"><h3>속도</h3><div class="button-row"><button type="button" data-speed="0.5">0.5×</button><button type="button" data-speed="1" aria-pressed="true">1×</button></div></section>
<section class="control-group"><h3>시간</h3><div class="timeline-wrap"><input id="motion-time" type="range" min="0" max="1.2" step="0.001" value="0" aria-label="모션 시간"><output id="time-output" for="motion-time">0.00 / 1.20초</output></div></section>
<section class="control-group"><h3>카메라</h3><div class="button-row"><button type="button" data-view="three" aria-pressed="true">3⁄4</button><button type="button" data-view="front">정면</button><button type="button" data-view="side">옆면</button><button type="button" data-view="top">위</button></div></section>
<section class="control-group"><h3>확대</h3><div class="button-row"><button type="button" data-zoom="in" aria-label="확대">＋</button><button type="button" data-zoom="out" aria-label="축소">－</button><button type="button" data-zoom="reset">맞춤</button></div></section>
<p id="renderer-status" class="renderer-status" aria-live="polite">로컬 절차식 파트 모션</p>
<div class="downloads viewer-downloads"><a id="roblox-download" href="roblox/{first["id"]}-motions.rbxmx" download>Roblox ↓</a><a id="glb-download" href="animations/{first["id"]}-motions.glb" download>GLB ↓</a><a class="secondary" href="roblox/Pupsters-Enemy-Motions-Demo.rbxmx" download>전체 데모 ↓</a><a class="secondary" href="README.txt">안내</a></div></aside></section>
<section class="notes"><h2>프리뷰 범위</h2><p>파트 위치·회전·크기는 프레임 사이에서 보간하고, 파트 표시 상태는 프레임 값으로 전환합니다. 쓰러짐은 기본적으로 한 번만 재생한 뒤 마지막 전투 불능 상태를 유지합니다.</p><p class="notice">투명 블록봇의 파트 투명도도 모션 중 유지됩니다. 로컬 Three.js와 스크립트 데이터만 사용합니다.</p></section>
<footer>PUPSTERS / ENEMY MOTION VIEWER / OFFLINE</footer></main><script src="viewer/three.min.js"></script><script src="viewer/motion-data.js"></script><script src="viewer/motion-viewer.js"></script></body></html>
"""


def report_links() -> None:
    expected = [
        ROOT / "viewer" / "motion.css",
        ROOT / "viewer" / "motion-viewer.js",
        ROOT / "viewer" / "motion-data.js",
        ROOT / "viewer" / "three.min.js",
        ROOT / "README.txt",
        ROOT / "roblox" / "Pupsters-Enemy-Motions-Demo.rbxmx",
        ROOT / "previews" / "motions-overview.png",
    ]
    expected.extend(ROOT / "previews" / f"all-{motion}.gif" for motion in MOTIONS)
    for identity in EXPECTED_IDS:
        expected.extend(
            [ROOT / "animations" / f"{identity}.json", ROOT / "animations" / f"{identity}-motions.glb", ROOT / "roblox" / f"{identity}-motions.rbxmx"]
        )
        for motion in MOTIONS:
            expected.extend([ROOT / "previews" / f"{identity}-{motion}.gif", ROOT / "previews" / f"{identity}-{motion}.png"])
    missing = [str(path.relative_to(ROOT)) for path in expected if not path.is_file()]
    if missing:
        print(f"Built HTML; {len(missing)} linked assets are not generated yet.")
        for item in missing:
            print(f"  missing: {item}")
    else:
        print("Built HTML; all local links resolve.")


def main() -> None:
    items = load_metadata()
    (ROOT / "index.html").write_text(build_index(items), encoding="utf-8", newline="\n")
    (ROOT / "viewer.html").write_text(build_viewer(items), encoding="utf-8", newline="\n")
    report_links()


if __name__ == "__main__":
    main()
