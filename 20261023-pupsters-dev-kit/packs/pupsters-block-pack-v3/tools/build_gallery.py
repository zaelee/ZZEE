"""Build a static gallery and a single-model offline WebGL viewer."""
from pathlib import Path
from html import escape as h
import json

ROOT=Path(__file__).resolve().parents[1]
models=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))['models']
head='''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>사고멍치 · 네모 강아지 3D</title><link rel="stylesheet" href="viewer/style.css"></head><body><main>'''
footer='''<footer>PUPSTERS / 사고멍치 · 2026.10.23 · 실제 지오메트리 렌더 · <a href="README.md">제작·적용 안내</a></footer></main></body></html>'''
cards=[]
for m in models:
    cards.append(f'''<article><div class="card-head"><span>{m['id']} / BLOCK DOG</span><h2>{h(m['displayName'])}</h2><p>{h(m['feature'])}</p></div>
    <a class="model-thumb" href="viewer.html?dog={m['id']}" aria-label="{h(m['displayName'])} 3D 보기"><img loading="lazy" src="{m['preview']}" alt="{h(m['displayName'])} 실제 3D 모델"></a>
    <p class="attack"><strong>{h(m['attackName'])}</strong><br>{h(m['attackMethod'])}</p>
    <p class="meta">{m['parts']}개 부품 · {m['triangles']:,} 삼각형</p>
    <div class="downloads"><a href="viewer.html?dog={m['id']}">3D로 보기 ↗</a><a class="secondary" href="{m['native']}" download>Roblox 모델 ↓</a></div>
    <details><summary>다른 형식 · 4면도</summary><div class="format-links"><a href="{m['glb']}" download>GLB</a><a href="{m['gltf']}" download>glTF</a><a href="{m['obj']}" download>OBJ</a><a href="{m['mtl']}" download>MTL</a><a href="{m['builder']}" download>Luau 생성기</a><a href="{m['views']}">4면도</a></div></details></article>''')
index=head+'''<header><div class="eyebrow">PUPSTERS / BLOCK DOG COLLECTION / V3</div><h1>몸매부터 다른 멍친구들.</h1><p class="intro">모더콜리의 귀와 골판지 왕관.<br>무들 주변에 떠 있는 찌리릭 전기.</p></header>
<div class="pack-actions"><a class="primary-link" href="native/Pupsters-All-Dogs.rbxmx" download>6종 한 번에 넣기 ↓</a><a href="previews/refinement.png">이번 수정 보기</a><a href="previews/collection.png">전체 이미지</a><a href="README.md">로블록스 적용 안내</a><span>모더콜리 · 무들 디테일 수정</span></div>
<section class="models gallery" aria-label="강아지 목록">'''+''.join(cards)+'''</section>
<section class="notes"><h2>로블록스에서 만나기</h2><p><strong>Workspace → 우클릭 → Insert From File…</strong>에서 .rbxmx 파일을 선택하세요. 위의 ‘6종 한 번에 넣기’는 모든 강아지를 3 × 2로 배치한 파일입니다. 개별 강아지 파일도 각각 들어 있어요.</p><p class="notice">현재는 대기 자세 모델입니다. 공격 설명은 캐릭터 설정이며, 공격 애니메이션·피해 판정은 포함하지 않았습니다. 파일 구조와 실제 모델 렌더를 확인했으며 Roblox Studio 내 가져오기는 미검증입니다.</p></section>'''+footer
(ROOT/'index.html').write_text(index,encoding='utf-8')
options=''.join(f'<option value="{m["id"]}">{h(m["displayName"])}</option>' for m in models)
first=models[0]
viewer=head+f'''<header><a class="back-link" href="index.html">← 전체 강아지</a><div class="eyebrow">PUPSTERS / 3D MODEL</div><h1 id="dog-name">{h(first['displayName'])}</h1><p class="intro">드래그 / 방향키: 회전 · 휠 / + −: 확대<br>다운로드 파일과 같은 지오메트리입니다.</p></header>
<label class="select-label" for="dog-select">강아지 선택 <select id="dog-select">{options}</select></label>
<nav class="controls" aria-label="3D 보기 제어"><button class="active" data-view="three">3/4 보기</button><button data-view="front">정면</button><button data-view="side">옆면</button><button data-view="back">뒷면</button><button data-view="top">탑뷰</button><button id="spin" aria-pressed="false">자동 회전</button><button id="wire" aria-pressed="false">와이어</button></nav>
<section class="models single"><article><div class="card-head"><p id="dog-feature">{h(first['feature'])}</p></div><div class="viewport" data-model="D01"><img id="model-preview" src="{first['preview']}" alt="{h(first['displayName'])} 실제 3D 모델 렌더"></div><p class="attack" id="dog-attack">{h(first['attackMethod'])}</p><p class="meta" id="model-meta">대기 자세</p><div class="downloads"><a href="{first['native']}" data-download="native" download>Roblox 모델 ↓</a><a class="secondary" href="{first['glb']}" data-download="glb" download>GLB ↓</a><a class="secondary" href="{first['builder']}" data-download="builder" download>Luau ↓</a></div></article></section>
<section class="comparison"><h2>네 방향에서 보기</h2><img id="model-views" src="{first['views']}" alt="정면, 측면, 뒷면, 탑뷰"></section>
<p class="notice">WebGL을 사용할 수 없으면 실제 모델을 렌더링한 정지 이미지가 표시됩니다. 이 환경에서는 웹 뷰어의 브라우저 조작을 확인하지 못했습니다.</p>
<script src="viewer/model-data.js"></script><script src="viewer/select-model.js"></script><script src="viewer/three.min.js"></script><script src="viewer/viewer.js"></script>'''+footer
(ROOT/'viewer.html').write_text(viewer,encoding='utf-8')
print('Built gallery and one-model viewer for',len(models),'dogs.')
