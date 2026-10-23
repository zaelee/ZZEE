"""Export editable enemy models and render the exact scene geometry."""
import json, html
import numpy as np
from PIL import Image, ImageDraw
from build_models import ROOT, mesh, export_gltf
from render_previews import render, font

def run():
    paths=sorted((ROOT/'scenes').glob('*.json'),key=lambda p:(p.stem.startswith('B'),p.stem))
    models={};records=[]
    board=Image.new('RGB',(1800,2130),'#F5F1E8');d=ImageDraw.Draw(board)
    d.text((64,38),'사고멍치  /  BLOCK ENEMIES',font=font(37,True),fill='#302A22')
    d.text((66,98),'일반 몹 8종 + 보스 1종 · 실제 3D 모델 렌더',font=font(21),fill='#786A58')
    for i,path in enumerate(paths):
        sc=json.loads(path.read_text(encoding='utf-8'));meshes=[mesh(p) for p in sc['parts']]
        export_gltf(sc,meshes)
        vertices=np.concatenate([v for v,f in meshes]);lo=vertices.min(0);hi=vertices.max(0)
        boss=sc['id'].startswith('B');width=6.3 if boss else 3.8
        target=[0,(hi[1]+lo[1])/2,(hi[2]+lo[2])/2]
        eye=(np.array(target)+[5,4.2,-7]).tolist()
        preview=render(sc,eye=eye,size=720,world_width=width,target=target)
        preview.save(ROOT/'previews'/f'{sc["id"]}.png')
        sheet=Image.new('RGB',(1440,394),'#F5F1E8');sd=ImageDraw.Draw(sheet)
        for j,(label,offset) in enumerate([('정면',[0,0,-9]),('측면',[9,0,0]),('뒷면',[0,0,9]),('탑뷰',[0,9,-.001])]):
            im=render(sc,eye=(np.array(target)+offset).tolist(),size=360,world_width=width,target=target)
            sheet.paste(im,(j*360,0));sd.text((j*360+18,360),label,font=font(18),fill='#796D5C')
        sheet.save(ROOT/'previews'/f'{sc["id"]}-views.png')
        x=(i%3)*600;y=174+(i//3)*650
        board.paste(preview.resize((560,560),Image.Resampling.LANCZOS),(x+20,y))
        d.text((x+48,y+535),sc['id']+'  '+sc['displayName'],font=font(27,True),fill='#302A22')
        d.text((x+48,y+576),sc['role'],font=font(20),fill='#82725C')
        if boss:d.text((x+48,y+606),'보스는 화면에 맞춰 축소 표시',font=font(15),fill='#9C8D77')
        stem=sc['name'];tris=sum(len(f) for v,f in meshes)
        row={k:sc[k] for k in ('id','name','displayName','feature','role','roleDescription')}
        row.update(preview=f'previews/{sc["id"]}.png',views=f'previews/{sc["id"]}-views.png',
            native=f'native/{stem}.rbxmx',glb=f'models/{stem}.glb',gltf=f'models/{stem}.gltf',obj=f'models/{stem}.obj',mtl=f'models/{stem}.mtl',
            triangles=tris,bounds=[lo.tolist(),hi.tolist()],viewWidth=width,target=target,
            parts=[dict(name=p['name'],group=p['group'],color=sc['materials'][p['material']]['color'],
                        opacity=sc['materials'][p['material']].get('opacity',1),
                        vertices=np.round(v,6).tolist(),faces=f.tolist()) for p,(v,f) in zip(sc['parts'],meshes)])
        models[sc['id']]=row
        records.append({k:v for k,v in row.items() if k!='parts'}|{'partCount':len(sc['parts']),'dimensions':np.round(hi-lo,4).tolist(),'scene':str(path.relative_to(ROOT)).replace('\\','/')})
        print(sc['id'],len(sc['parts']),'parts',tris,'triangles',flush=True)
    board.save(ROOT/'previews/collection.png')
    (ROOT/'viewer/model-data.js').write_text('window.PUPSTERS_MODELS='+json.dumps(models,ensure_ascii=False,separators=(',',':'))+';',encoding='utf-8')
    manifest={'title':'사고멍치 네모네모 몹','version':1,'coordinateSystem':{'up':'+Y','front':'-Z','units':'studs'},
        'status':'static editable models; gameplay and animations not implemented',
        'studioVerified':False,'browserVerified':False,'models':records}
    (ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    build_html(records)

def build_html(rows):
    esc=html.escape
    head='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>사고멍치 · 네모네모 몹</title><link rel="stylesheet" href="viewer/style.css"></head><body><main>'
    cards=[]
    for r in rows:
        id=r['id']
        cards.append(f'''<article><div class="card-head"><span>{id} · {'BOSS' if id.startswith('B') else 'ENEMY'}</span><h2>{esc(r['displayName'])}</h2><p>{esc(r['feature'])}</p></div>
        <a class="model-thumb" href="model.html?enemy={id}"><img src="{r['preview']}" alt="{esc(r['displayName'])} 실제 3D 모델" loading="lazy"></a>
        <p class="attack"><strong>{esc(r['role'])}</strong><br>{esc(r['roleDescription'])}</p>
        <div class="downloads"><a href="model.html?enemy={id}">3D 돌려보기 ↗</a><a class="secondary" href="{r['native']}" download>Roblox</a><a class="secondary" href="{r['glb']}" download>GLB</a></div>
        <details><summary>정면 · 측면 · 뒷면 · 탑뷰</summary><img class="views" src="{r['views']}" alt="{esc(r['displayName'])} 네 방향" loading="lazy"><p>{r['partCount']}개 부품 · {r['triangles']:,} 삼각형 · {' × '.join(str(round(v,2)) for v in r['dimensions'])} studs</p></details></article>''')
    notes='''<section class="notes"><h2>Roblox용으로 분리된 모델</h2><p>각 모델은 이름이 붙은 개별 Part와 역할별 그룹으로 구성돼 있어요. 전체 배치 파일과 개별 RBXMX, GLB, glTF, OBJ/MTL을 함께 제공합니다. E07 몸통은 실제 투명 재질입니다.</p><p class="notice">현재는 정적인 3D 모델입니다. 이동·공격·분열·수리·은신·소환 로직은 포함하지 않았습니다. Roblox Studio 직접 로드와 브라우저 WebGL 실행은 이 환경에서 확인하지 못했습니다. 그림은 모델 좌표를 직접 렌더링한 결과입니다.</p><a href="README.txt">파일 구성과 검증 범위</a> · <a href="docs/validation-report.json">구조 검사 결과</a></section>'''
    page=head+'''<header><div class="eyebrow">PUPSTERS · ENEMY COLLECTION 01</div><h1>네모네모 몹들.</h1><p class="intro">낮은 바퀴형부터 3단 분열형까지.<br>같은 블록 스타일, 서로 다른 실루엣.</p></header>
    <div class="pack-actions"><a class="primary-link" href="native/Pupsters_Enemies_All.rbxmx" download>9종 Roblox 배치 파일 ↓</a><a href="previews/collection.png">전체 대표컷</a><span>08 ENEMIES + 01 BOSS</span></div><section class="models gallery">'''+''.join(cards)+'</section>'+notes+'<footer>사고멍치 · Original block models · 2026.10.23</footer></main></body></html>'
    (ROOT/'index.html').write_text(page,encoding='utf-8')
    opts=''.join(f'<option value="{r["id"]}">{r["id"]} · {esc(r["displayName"])}</option>' for r in rows)
    first=rows[0]
    model=head+f'''<a class="back-link" href="index.html">← 전체 몹 보기</a><header><div class="eyebrow">PUPSTERS · 3D MODEL</div><h1 id="enemy-name">{esc(first['displayName'])}</h1></header>
    <label class="select-label">몹 선택 <select id="enemy-select">{opts}</select></label>
    <nav class="controls" aria-label="모델 보기"><button data-view="three" class="active">3/4</button><button data-view="front">정면</button><button data-view="side">측면</button><button data-view="back">뒷면</button><button data-view="top">탑뷰</button><button id="spin" aria-pressed="false">자동 회전</button><button id="wire" aria-pressed="false">와이어</button></nav>
    <section class="models single"><article><div class="viewport" data-model="E01"><img id="model-preview" src="{first['preview']}" alt="실제 모델 렌더"></div>
    <div class="card-head"><p id="enemy-feature"></p></div><p class="attack" id="enemy-role"></p><p class="meta" id="model-meta"></p>
    <div class="downloads"><a href="{first['native']}" data-download="native" download>Roblox RBXMX</a><a href="{first['glb']}" data-download="glb" download>GLB</a><a class="secondary" href="{first['gltf']}" data-download="gltf" download>glTF</a><a class="secondary" href="{first['obj']}" data-download="obj" download>OBJ</a><a class="secondary" href="{first['mtl']}" data-download="mtl" download>MTL</a></div>
    <details open><summary>정면 · 측면 · 뒷면 · 탑뷰</summary><img class="views" id="model-views" src="{first['views']}" alt="네 방향 렌더"></details></article></section>
    <p class="notice">드래그로 회전 · 휠로 확대 · 키보드 방향키 / + / −<br>WebGL을 사용할 수 없으면 실제 모델의 정지 렌더가 표시됩니다.</p>
    </main><script src="viewer/three.min.js"></script><script src="viewer/model-data.js"></script><script src="viewer/select-model.js"></script><script src="viewer/viewer.js"></script></body></html>'''
    (ROOT/'model.html').write_text(model,encoding='utf-8')

if __name__=='__main__':run()
