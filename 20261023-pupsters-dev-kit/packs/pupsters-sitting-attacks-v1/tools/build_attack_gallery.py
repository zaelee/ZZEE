#!/usr/bin/env python3
"""Build the offline attack gallery and single-clip viewer pages."""

from __future__ import annotations

import html
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ANIMATIONS = ROOT / "animations"
EXPECTED_IDS = [f"D{index:02d}" for index in range(1, 7)]


def load_clips() -> list[dict]:
    clips = []
    for identity in EXPECTED_IDS:
        path = ANIMATIONS / f"{identity}.json"
        if not path.is_file():
            raise FileNotFoundError(f"Missing attack clip: {path.relative_to(ROOT)}")
        clip = json.loads(path.read_text(encoding="utf-8"))
        if clip.get("id") != identity:
            raise ValueError(f"{path.name}: expected id {identity!r}, got {clip.get('id')!r}")
        for key in ("displayName", "attackName", "description"):
            if not isinstance(clip.get(key), str) or not clip[key].strip():
                raise ValueError(f"{path.name}: {key} must be a non-empty string")
        if not isinstance(clip.get("parts"), list) or not clip["parts"]:
            raise ValueError(f"{path.name}: parts must be a non-empty array")
        if not isinstance(clip.get("frames"), list) or len(clip["frames"]) < 2:
            raise ValueError(f"{path.name}: frames must contain at least two frames")
        if float(clip.get("duration", -1)) != 2.0:
            raise ValueError(f"{path.name}: duration must be 2 seconds")
        if int(clip.get("fps", -1)) != 30:
            raise ValueError(f"{path.name}: fps must be 30")
        if float(clip.get("release", -1)) != 0.6:
            raise ValueError(f"{path.name}: release must be 0.6 seconds")
        if len(clip["frames"]) != 61:
            raise ValueError(f"{path.name}: expected 61 frames, found {len(clip['frames'])}")

        part_count = len(clip["parts"])
        for part_index, part in enumerate(clip["parts"]):
            if part.get("type") not in {"box", "sphere"}:
                raise ValueError(
                    f"{path.name}: part {part_index} has unsupported type {part.get('type')!r}"
                )
            if not isinstance(part.get("vertices"), list) or not isinstance(part.get("faces"), list):
                raise ValueError(f"{path.name}: part {part_index} is missing mesh geometry")

        prior_time = -1.0
        for frame_index, frame in enumerate(clip["frames"]):
            time = float(frame.get("time", -1))
            transforms = frame.get("transforms")
            if time < prior_time:
                raise ValueError(f"{path.name}: frame times are out of order at {frame_index}")
            if not isinstance(transforms, list) or len(transforms) != part_count:
                count = len(transforms) if isinstance(transforms, list) else 0
                raise ValueError(
                    f"{path.name}: frame {frame_index} has {count} transforms for {part_count} parts"
                )
            for transform_index, transform in enumerate(transforms):
                if not isinstance(transform, list) or len(transform) != 11:
                    raise ValueError(
                        f"{path.name}: frame {frame_index} transform {transform_index} must have 11 values"
                    )
            prior_time = time

        if abs(float(clip["frames"][0]["time"])) > 1e-6:
            raise ValueError(f"{path.name}: first frame must start at 0")
        if abs(float(clip["frames"][-1]["time"]) - 2.0) > 1e-6:
            raise ValueError(f"{path.name}: final frame must end at 2 seconds")
        clips.append(clip)
    return clips


def picture(identity: str, alt: str, css_class: str = "") -> str:
    class_attribute = f' class="{css_class}"' if css_class else ""
    return (
        f"<picture{class_attribute}>"
        f'<source media="(prefers-reduced-motion: reduce)" srcset="previews/{identity}-attack.png">'
        f'<img loading="lazy" src="previews/{identity}-attack.gif" alt="{html.escape(alt)}">'
        "</picture>"
    )


def card(clip: dict) -> str:
    identity = clip["id"]
    display_name = html.escape(clip["displayName"])
    attack_name = html.escape(clip["attackName"])
    description = html.escape(clip["description"])
    return f"""<article class="attack-card">
  <div class="card-head"><span>{identity} / SITTING ATTACK</span><h2>{display_name}</h2><p>{attack_name}</p></div>
  <a class="attack-poster" href="viewer.html?dog={identity}" aria-label="{display_name} {attack_name} 3D 보기">{picture(identity, f'{clip["displayName"]} {clip["attackName"]} 절차식 공격 모션')}</a>
  <p class="attack-copy"><strong>{attack_name}</strong>{description}</p>
  <div class="downloads"><a href="viewer.html?dog={identity}">3D 모션 보기 ↗</a><a class="secondary" href="roblox/{identity}-attack.rbxmx" download>Roblox 공격 모델 ↓</a><a class="secondary" href="animations/{identity}-attack.glb" download>GLB ↓</a></div>
</article>"""


def build_index(clips: list[dict]) -> str:
    cards = "\n".join(card(clip) for clip in clips)
    return f"""<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>사고멍치 · 앉은 공격 모션</title><link rel="stylesheet" href="viewer/attack.css"></head>
<body><main><header><div class="eyebrow">PUPSTERS / SITTING ATTACKS / V1</div><h1>앉아서도, 한 방.</h1><p class="intro">여섯 강아지의 2초 공격을 실제 파트 지오메트리로 재생합니다.<br>GIF를 누르면 드래그·속도·프레임 탐색이 가능한 오프라인 3D 뷰어가 열려요.</p></header>
<div class="pack-actions"><a class="primary-link" href="roblox/Pupsters-Sitting-Attacks-Demo.rbxmx" download>Roblox 데모 한 번에 넣기 ↓</a><a href="previews/attacks-overview.png">공격 한눈에 보기</a><a href="README.md">적용 안내</a><span>6종 · 각 2초 · 30fps</span></div>
<section class="attack-grid" aria-label="강아지 공격 목록">{cards}</section>
<section class="overview"><h2>여섯 공격 한눈에 보기</h2><img src="previews/attacks-overview.png" alt="여섯 앉은 강아지 공격의 주요 프레임 모음"><p>준비 0–0.6초 · 발사 0.6–1.25초 · 회복 1.25–2초</p></section>
<section class="notes"><h2>사용 전 확인</h2><p>모든 동작은 고정된 파트의 위치·회전·크기를 절차적으로 재생합니다. 뷰어와 파일은 네트워크 연결 없이 열 수 있습니다.</p><p class="notice">절차식 Anchored Part 모션 · Roblox Studio 가져오기 미검증 · 피해 판정 없음. 캐릭터 공격 연출과 타격 시스템은 별도로 연결해야 합니다.</p></section>
<footer>PUPSTERS / 사고멍치 · 2026.10.23 · 오프라인 모션 프리뷰 · <a href="README.md">제작·적용 안내</a></footer></main></body></html>
"""


def build_viewer(clips: list[dict]) -> str:
    options = "".join(
        f'<option value="{clip["id"]}">{html.escape(clip["displayName"])} · {html.escape(clip["attackName"])}</option>'
        for clip in clips
    )
    first = clips[0]
    first_id = first["id"]
    fallback = picture(first_id, f'{first["displayName"]} {first["attackName"]} 이미지 미리보기', "attack-fallback")
    return f"""<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(first["displayName"])} · {html.escape(first["attackName"])}</title><link rel="stylesheet" href="viewer/attack.css"></head>
<body><main><a class="back-link" href="index.html">← 공격 목록으로</a><header class="viewer-header"><div><div class="eyebrow"><span id="dog-code">{first_id}</span> / PROCEDURAL ATTACK</div><h1 id="dog-title">{html.escape(first["displayName"])}</h1><p><strong id="attack-title">{html.escape(first["attackName"])}</strong> · <span id="attack-description">{html.escape(first["description"])}</span></p></div><label class="select-label">강아지 선택<select id="dog-select">{options}</select></label></header>
<section class="viewer-layout"><div id="attack-stage" class="attack-stage">{fallback}<span id="phase-label" class="phase-badge" data-phase="windup">WINDUP · 준비</span></div>
<aside class="control-panel" aria-label="공격 재생 제어"><h2>2초 공격 타임라인</h2><p>드래그로 카메라를 돌리고 원하는 순간을 직접 확인하세요.</p>
<section class="control-group"><h3>재생</h3><div class="button-row"><button type="button" data-playback="once">한 번</button><button type="button" data-playback="repeat">반복</button><button type="button" data-playback="pause">일시정지</button><button type="button" data-playback="reset">처음으로</button></div></section>
<section class="control-group"><h3>속도</h3><div class="button-row"><button type="button" data-speed="0.5">0.5×</button><button type="button" data-speed="1" aria-pressed="true">1×</button></div></section>
<section class="control-group"><h3>시간</h3><div class="timeline-wrap"><input id="attack-time" type="range" min="0" max="2" step="0.001" value="0" aria-label="공격 시간"><output id="time-output" for="attack-time">0.00 / 2.00초</output></div></section>
<section class="control-group"><h3>카메라</h3><div class="button-row"><button type="button" data-view="three" aria-pressed="true">3⁄4</button><button type="button" data-view="front">정면</button><button type="button" data-view="side">옆면</button><button type="button" data-view="top">위</button></div></section>
<section class="control-group"><h3>확대</h3><div class="button-row"><button type="button" data-zoom="in" aria-label="확대">＋</button><button type="button" data-zoom="out" aria-label="축소">－</button><button type="button" data-zoom="reset">맞춤</button></div></section>
<p id="renderer-status" class="renderer-status" aria-live="polite">절차식 Anchored Part 모션 · 피해 판정 없음</p>
<div class="downloads viewer-downloads"><a id="roblox-download" href="roblox/{first_id}-attack.rbxmx" download>Roblox ↓</a><a id="glb-download" href="animations/{first_id}-attack.glb" download>GLB ↓</a><a class="secondary" href="roblox/Pupsters-Sitting-Attacks-Demo.rbxmx" download>전체 데모 ↓</a><a class="secondary" href="README.md">안내</a></div></aside></section>
<section class="notes"><h2>프리뷰 범위</h2><p>실제 파트 지오메트리와 이펙트를 프레임 사이에서 보간합니다. 준비·발사·회복 구간을 확인할 수 있으며, 게임 피해·충돌 판정은 포함하지 않습니다.</p><p class="notice">로컬 Three.js와 스크립트 데이터만 사용합니다. Roblox Studio 가져오기는 아직 검증하지 않았습니다.</p></section>
<footer>PUPSTERS / SITTING ATTACK VIEWER / OFFLINE</footer></main><script src="viewer/three.min.js"></script><script src="viewer/attack-data.js"></script><script src="viewer/attack-viewer.js"></script></body></html>
"""


def report_links() -> None:
    expected = [
        ROOT / "viewer" / "attack.css",
        ROOT / "viewer" / "attack-viewer.js",
        ROOT / "viewer" / "attack-data.js",
        ROOT / "viewer" / "three.min.js",
        ROOT / "README.md",
        ROOT / "roblox" / "Pupsters-Sitting-Attacks-Demo.rbxmx",
        ROOT / "previews" / "attacks-overview.png",
    ]
    for identity in EXPECTED_IDS:
        expected.extend(
            [
                ROOT / "previews" / f"{identity}-attack.gif",
                ROOT / "previews" / f"{identity}-attack.png",
                ROOT / "roblox" / f"{identity}-attack.rbxmx",
                ROOT / "animations" / f"{identity}-attack.glb",
            ]
        )
    missing = [str(path.relative_to(ROOT)) for path in expected if not path.is_file()]
    if missing:
        print(f"Built HTML; {len(missing)} linked assets are not generated yet.")
        for item in missing:
            print(f"  missing: {item}")
    else:
        print("Built HTML; all local links resolve.")


def main() -> None:
    clips = load_clips()
    (ROOT / "index.html").write_text(build_index(clips), encoding="utf-8", newline="\n")
    (ROOT / "viewer.html").write_text(build_viewer(clips), encoding="utf-8", newline="\n")
    report_links()


if __name__ == "__main__":
    main()
