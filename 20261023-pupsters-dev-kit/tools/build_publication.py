"""Build the dated asset index and verified download bundles from the local packs."""
from pathlib import Path
import hashlib,html,json,zipfile

ROOT=Path(__file__).resolve().parents[1]
H=html.escape
PACKS=[
 ('pupsters-breed-portraits-v1','견종별 대표컷','초기 2D','흰 말티즈부터 견종별 외형 탐색'),
 ('pupsters-chunky-trio-v2','통통한 세 마리','초기 2D','말티즈·시바·불도그 체형 실험'),
 ('pupsters-balanced-trio-v3','머리와 몸 비율 조정','초기 2D','과한 체형을 줄인 비율 비교'),
 ('pupsters-round-trio-v4','조금 더 통통하게','초기 2D','짧고 둥근 몸의 방향 정리'),
 ('pupsters-topdown-ui-v1','탑뷰와 화면 콘셉트','2D 게임 아트','메인 타이틀·배경·UI 화면 시안'),
 ('pupsters-topdown-shortbody-v2','탑뷰 짧은 몸','2D 게임 아트','위에서 봐도 몸이 짧게 보이는 세 마리'),
 ('pupsters-separated-assets-v1','분리된 게임 에셋','2D 게임 아트','캐릭터·이펙트·몹·배경·UI 개별 PNG/SVG'),
 ('pupsters-attack-motion-v1','2D 공격 자세','2D 모션','대기·준비·발동·반동의 네 가지 자세'),
 ('pupsters-connected-attack-v2','공격과 이펙트 연결','2D 모션','동작에서 투사체·이펙트까지 이어지는 타임라인'),
 ('pupsters-personality-and-attacks-v4','작은 뼈를 퉤!','2D 모션','시바의 뼈 뱉기 변경을 보존한 v4 스냅샷'),
 ('pupsters-personality-v3','성격과 능력 · 실제 v5','2D 모션','최신 2D 외형: 얼음 귀·침·전기·종이 왕관'),
 ('pupsters-shiba-3d-v1','시바 3D 두 가지','3D 형태 탐색','둥근 형태와 블록 형태 비교'),
 ('pupsters-shiba-block-v2','단순한 블록 시바','3D 형태 탐색','검은 점눈·네모 꼬리·네모 뼈'),
 ('pupsters-shiba-block-v3','흰 눈썹 시그니처','3D 형태 탐색','눈동자만 한 작은 흰 눈썹'),
 ('pupsters-block-pack-v1','블록 강아지 6종','3D 강아지','여섯 견종의 첫 블록 모델'),
 ('pupsters-block-pack-v2','뭉툭한 실루엣','3D 강아지','뾰족한 부분을 줄이고 캐릭터 구별 강화'),
 ('pupsters-block-pack-v3','귀·왕관·전기 디테일','3D 강아지','양쪽 귀와 종이 왕관, 전기 표현 개선'),
 ('pupsters-block-pack-v4','앉은 강아지 6종','최신 3D','큰 머리·짧은 몸, 무들 기본/업그레이드 분리'),
 ('pupsters-sitting-attacks-v1','앉아서 공격하기','최신 3D','6종 × 2초 공격, 자세와 효과를 한 프레임 데이터로'),
 ('pupsters-block-enemies-v1','블록 몹 9종','최신 3D','일반 몹 8종과 블록사우루스 보스'),
 ('pupsters-enemy-motions-v1','이동·피격·사망','최신 3D','9종 × 3동작, 총 27개 모션'),
 ('pupsters-block-map-v1','블록 놀이방 맵','최신 3D','76 × 52 studs, S자 길과 강아지 자리 16개'),
]
FEATURED={
 'pupsters-block-map-v1':'previews/map-showcase.png',
 'pupsters-sitting-attacks-v1':'previews/attacks-overview.png',
 'pupsters-enemy-motions-v1':'previews/motions-overview.png',
 'pupsters-block-pack-v4':'previews/collection.png',
 'pupsters-block-enemies-v1':'previews/collection.png',
 'pupsters-personality-v3':'characters/D03-husky.png',
 'pupsters-separated-assets-v1':'backgrounds/BG01-living-room-map.png',
}

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def archive(folder,target):
    files=sorted(p for p in folder.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc')
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for p in files:z.write(p,folder.name+'/'+p.relative_to(folder).as_posix())
    with zipfile.ZipFile(target) as z:
        assert z.testzip() is None
        assert len(z.namelist())==len(files)==len(set(z.namelist()))
        for p in files:assert z.read(folder.name+'/'+p.relative_to(folder).as_posix())==p.read_bytes()
    return {'file':target.relative_to(ROOT).as_posix(),'files':len(files),'bytes':target.stat().st_size,'sha256':sha(target)}

def build():
    records=[]
    for id,title,stage,description in PACKS:
        folder=ROOT/'packs'/id
        assert folder.is_dir(),id
        # Add a browsable gallery only where an early image study had no HTML entrypoint.
        if not (folder/'index.html').exists():
            images=sorted(p for p in folder.rglob('*.png') if 'qa' not in p.parts)
            figures=''.join(f'<figure><a href="{H(p.relative_to(folder).as_posix())}"><img loading="lazy" src="{H(p.relative_to(folder).as_posix())}" alt="{H(p.stem)}"></a><figcaption>{H(p.stem)}</figcaption></figure>' for p in images)
            (folder/'index.html').write_text(f'<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{H(title)} · Pupsters</title><link rel="stylesheet" href="../../style.css"><body><main class="wrap"><a href="../../index.html#archive">← 제작 기록</a><p class="eyebrow">ARCHIVE / {H(stage)}</p><h1>{H(title)}</h1><p>{H(description)}</p><div class="cards studies">{figures}</div></main></body></html>',encoding='utf-8')
        records.append({'id':id,'title':title,'stage':stage,'description':description,'page':f'packs/{id}/index.html','recommended':id in FEATURED})
    (ROOT/'catalog.json').write_text(json.dumps({'date':'2026-10-23','packs':records},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    downloads=[]
    for id in FEATURED:
        folder=ROOT/'packs'/id
        # Legacy delivery manifests hash the old package; maintain a fresh public-copy manifest.
        public_files=[p for p in folder.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.name!='publication-manifest.json']
        (folder/'publication-manifest.json').write_text(json.dumps({'files':{p.relative_to(folder).as_posix():sha(p) for p in sorted(public_files)}},indent=2)+'\n',encoding='utf-8')
        downloads.append(archive(folder,ROOT/'downloads'/f'{id}.zip'))
    downloads.append(archive(ROOT/'skills/pupsters-block-production',ROOT/'downloads/pupsters-block-production-skill.zip'))
    (ROOT/'downloads/manifest.json').write_text(json.dumps({'date':'2026-10-23','archives':downloads},indent=2)+'\n',encoding='utf-8')
    (ROOT/'downloads/SHA256SUMS.txt').write_text('\n'.join(f"{d['sha256']}  {Path(d['file']).name}" for d in downloads)+'\n',encoding='ascii')
    cards=[]
    for id,thumb in FEATURED.items():
        r=next(r for r in records if r['id']==id);assert (ROOT/'packs'/id/thumb).is_file()
        cards.append(f'<article class="card"><a class="picture" href="{r["page"]}"><img loading="lazy" src="packs/{id}/{thumb}" alt="{H(r["title"])}"></a><div class="card-body"><p class="eyebrow">{H(r["stage"])}</p><h3>{H(r["title"])}</h3><p>{H(r["description"])}</p><div class="actions"><a href="{r["page"]}">둘러보기 ↗</a><a href="downloads/{id}.zip" download>ZIP 다운로드 ↓</a></div></div></article>')
    rows=''.join(f'<tr><td>{i:02d}</td><td>{H(r["stage"])}</td><td><a href="{r["page"]}">{H(r["title"])}</a><small>{H(r["id"])}</small></td><td>{H(r["description"])}</td></tr>' for i,r in enumerate(records,1))
    page='''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>사고멍치 · 제작 기록과 개발 키트</title><meta name="description" content="Pupsters의 2D 시안부터 블록 강아지, 모션, 몹, 3D 맵, 재사용 제작 스킬까지."><link rel="stylesheet" href="style.css"></head>
<body><header class="topbar"><a href="../index.html">ZZEE ↖</a><nav aria-label="섹션"><a href="#latest">최신 파일</a><a href="#handoff">이어서 작업</a><a href="#archive">전체 이력</a></nav><span>2026.10.23</span></header>
<main class="wrap"><section class="hero"><div><p class="eyebrow">PUPSTERS / ASSET DEVELOPMENT KIT</p><h1>사고멍치.<br><em>네모로 모인 하루.</em></h1><p class="lead">강아지의 생김새부터 공격, 몹, 놀이방까지.<br>만들어 온 결과물과 다음 작업에 필요한 제작 방식을 한곳에 모았어요.</p><div class="actions"><a class="button" href="packs/pupsters-block-map-v1/index.html">최신 맵 둘러보기 ↗</a><a href="docs/HANDOFF.md">개발 인수인계 읽기</a></div></div><figure><img src="packs/pupsters-block-map-v1/previews/map-showcase.png" alt="S자 길과 앉은 강아지들을 배치한 블록 놀이방"><figcaption>큰 머리, 짧은 몸, 그리고 작은 능력들.</figcaption></figure></section>
<div class="stats"><div><strong>6</strong><span>앉은 강아지 + 공격</span></div><div><strong>9</strong><span>블록 몹 · 보스 포함</span></div><div><strong>27</strong><span>몹 이동·피격·사망</span></div><div><strong>16</strong><span>맵 배치 자리</span></div></div>
<section id="latest"><p class="eyebrow">START HERE</p><h2>지금의 기준이 되는 파일</h2><p class="intro">최신 3D 5개 팩과 2D 디자인 자료 2개. 각 페이지에서 미리보기와 개별 Roblox·GLB 파일을 확인할 수 있어요.</p><div class="cards">__CARDS__</div></section>
<section id="handoff" class="handoff"><div><p class="eyebrow">KEEP BUILDING</p><h2>다음 작업자에게<br>넘길 때는 여기부터.</h2><p>무엇을 만들었고, 어떤 결정을 했으며, 무엇이 아직 남았는지 정리했어요. 이 프로젝트용 제작 스킬도 함께 저장했습니다.</p></div><div class="doc-list"><a href="docs/HANDOFF.md"><strong>01 · 개발 인수인계</strong><span>최신 원본·연동 방법·다음 구현 순서</span></a><a href="docs/DECISIONS.md"><strong>02 · 디자인 결정</strong><span>체형·이름·공격 방식·블록 스타일 규칙</span></a><a href="docs/SKILLS.md"><strong>03 · 사용 스킬과 작업 방식</strong><span>이미지 생성·3D 제작·모션·검증 흐름</span></a><a href="skills/pupsters-block-production/SKILL.md"><strong>04 · Pupsters 제작 스킬</strong><span>다음 에이전트가 읽을 SKILL.md</span></a><a href="downloads/pupsters-block-production-skill.zip" download><strong>스킬 폴더 다운로드 ↓</strong><span>설치용 SKILL.md 묶음</span></a></div></section>
<section id="archive"><p class="eyebrow">22 SAVED VERSIONS</p><h2>처음부터 지금까지</h2><p class="intro">초기 그림체와 체형 탐색, 2D 공격 연결, 블록 3D 전환을 순서대로 보존했어요. personality-v3 폴더는 최종 v5 내용이며, v4 당시 상태는 별도 스냅샷으로 남겼습니다.</p><div class="table-scroll"><table><thead><tr><th>순서</th><th>단계</th><th>버전</th><th>변경 내용</th></tr></thead><tbody>__ROWS__</tbody></table></div><p><a href="https://github.com/zaelee/ZZEE/tree/main/20261022-puppy-defense-blueprint">전날 기획·브랜딩 문서 ↗</a></p></section>
<section class="status"><h2>현재까지 확인한 범위</h2><p>파일 구조·모델 좌표·모션 데이터·배치 공간과 실제 지오메트리의 정적 렌더를 확인했습니다. Roblox Studio에서의 가져오기·Play, 브라우저 WebGL의 실제 조작은 아직 확인하지 않았습니다.</p><p>게임의 체력·웨이브·타깃 판정·배치 경제·승패 로직은 다음 구현 단계입니다. 각 팩의 과거 검사 기록은 제작 당시 결과이고, 공개 복사본의 ZIP 해시는 새로 계산했습니다.</p><a href="README.md">전체 안내</a> · <a href="downloads/SHA256SUMS.txt">다운로드 체크섬</a> · <a href="docs/PUBLISH-NOTES.md">공개본 정리 내역</a></section>
</main><footer>사고멍치 / Pupsters · 2026-10-23 제작 기록 · <a href="https://github.com/zaelee/ZZEE/tree/main/20261023-pupsters-dev-kit">GitHub 소스</a></footer></body></html>'''
    (ROOT/'index.html').write_text(page.replace('__CARDS__',''.join(cards)).replace('__ROWS__',rows),encoding='utf-8')
    print(json.dumps({'packs':len(records),'downloadBundles':len(downloads),'zipBytes':sum(d['bytes'] for d in downloads)}))

if __name__=='__main__':build()
