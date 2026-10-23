"""Render actual sampled motion geometry to 27 GIFs and three collection loops."""
import json
import numpy as np
from PIL import Image,ImageDraw
from build_models import ROOT
from build_motions import qmatrix
from render_previews import render,font

LABELS={'move':'이동','hit':'피격','death':'사망'}
def frame_scene(model,frame):
    parts=[];mats={}
    for p,row in zip(model['parts'],frame['transforms']):
        if row[10]<.5:continue
        v=(np.array(p['vertices'])*row[7:10])@qmatrix(row[3:7]).T+row[:3]
        parts.append(dict(name=p['name'],group=p['group'],material=p['name'],_mesh=(v,np.array(p['faces']))))
        mats[p['name']]={'color':p['color'],'opacity':p['opacity']}
    return {'parts':parts,'materials':mats}
def render_frame(model,frame,size=420):
    target=np.array(model['target']);eye=target+[5,4.2,-7]
    return render(frame_scene(model,frame),eye=eye,target=target,size=size,world_width=model['viewWidth'],aa=1)
def gif(path,images,durations,palette=None):
    if palette is None:
        sample=Image.new('RGB',(images[0].width*3,images[0].height))
        for i,j in enumerate([0,len(images)//3,len(images)*2//3]):sample.paste(images[j],(i*images[0].width,0))
        palette=sample.quantize(colors=255)
    frames=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in images]
    frames[0].save(path,save_all=True,append_images=frames[1:],duration=durations,loop=0,disposal=2,optimize=False)

def main():
    models=[json.loads(p.read_text(encoding='utf-8')) for p in sorted((ROOT/'animations').glob('*.json'),key=lambda p:(p.stem.startswith('B'),p.stem))]
    board=Image.new('RGB',(1800,2940),'#F5F1E8');d=ImageDraw.Draw(board)
    d.text((55,30),'사고멍치 / 몹 모션 27종',font=font(39,True),fill='#302A22')
    d.text((57,91),'9종 × 이동 · 피격 · 사망 / 실제 모델 좌표로 렌더링',font=font(22),fill='#82725C')
    for j,label in enumerate(LABELS.values()):d.text((j*600+48,146),label,font=font(24,True),fill='#302A22')
    timelines={}
    for i,model in enumerate(models):
        timelines[model['id']]={}
        for j,kind in enumerate(LABELS):
            clip=model['clips'][kind];indices=list(range(0,len(clip['frames'])-1,2))
            # GIFs are comparison loops; death has an explicit empty end and a rest hold.
            images=[render_frame(model,clip['frames'][fi]) for fi in indices]
            timelines[model['id']][kind]=images
            durations=[70 if k%3 else 60 for k in range(len(images))]
            if kind=='death':
                images=images+[render_frame(model,clip['frames'][-1])]*3+[render_frame(model,clip['frames'][0])]*4
                durations += [70]*3+[70]*4
            gif(ROOT/'previews'/f'{model["id"]}-{kind}.gif',images,durations)
            sample={'move':.30,'hit':.13,'death':.82}[kind]
            frame=model['clips'][kind]['frames'][round(sample*30)]
            poster=render_frame(model,frame,600);poster.save(ROOT/'previews'/f'{model["id"]}-{kind}.png')
            # 9 rows with a 3-column key-pose strip at a readable, compact scale.
            tile=poster.resize((300,300),Image.Resampling.LANCZOS)
            y=200+i*300;x=j*600
            board.paste(tile,(x+270,y));d.text((x+34,y+110),model['displayName'],font=font(22,True),fill='#302A22')
            if j==0:d.text((x+36,y+146),model['id'],font=font(15),fill='#8A7A63')
        print('Rendered',model['id'],'move/hit/death',flush=True)
    board.save(ROOT/'previews/motions-overview.png')
    demo=[];demo_durations=[]
    for kind,label in LABELS.items():
        n=len(timelines[models[0]['id']][kind]);frames=[]
        total=n+(7 if kind=='death' else 0)
        for fi in range(total):
            image=Image.new('RGB',(1080,1180),'#F5F1E8');d=ImageDraw.Draw(image)
            d.text((28,14),'사고멍치 · '+label+' 모션',font=font(30,True),fill='#302A22')
            for i,m in enumerate(models):
                timeline=timelines[m['id']][kind]
                if fi<n:im=timeline[fi]
                elif fi<n+3:im=render_frame(m,m['clips'][kind]['frames'][-1])
                else:im=render_frame(m,m['clips'][kind]['frames'][0])
                x=i%3*360;y=68+i//3*360
                image.paste(im.resize((360,360),Image.Resampling.LANCZOS),(x,y));d.text((x+18,y+8),m['displayName'],font=font(19,True),fill='#302A22')
            note='제자리 보행 루프 · 경로 이동은 게임에서 연결' if kind=='move' else '피격 후 원래 자세로 복귀' if kind=='hit' else '사망 → 소멸 → 비교를 위해 다시 표시'
            d.text((28,1146),note,font=font(17),fill='#8A7A63');frames.append(image)
        durations=[70 if k%3 else 60 for k in range(total)]
        gif(ROOT/'previews'/f'all-{kind}.gif',frames,durations)
        frames[0].save(ROOT/'previews'/f'all-{kind}.png')
        demo.extend(frames);demo_durations.extend(durations)
    gif(ROOT/'previews/enemy-motions-demo.gif',demo,demo_durations)
    print('Saved 27 GIFs, posters, overview and 3 collection GIFs.',flush=True)
if __name__=='__main__':main()
