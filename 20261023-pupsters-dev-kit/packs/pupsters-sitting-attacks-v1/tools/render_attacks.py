"""Render the same sampled motion used by the GLB, web viewer and Roblox controller."""
import json
import numpy as np
from PIL import Image,ImageDraw
from build_models import ROOT
from build_attacks import qmatrix
from render_previews import render,font

def frame_scene(clip,frame):
    parts=[];materials={}
    for part,row in zip(clip['parts'],frame['transforms']):
        if row[10]<.5:continue
        v=(np.array(part['vertices'])*np.array(row[7:10]))@qmatrix(row[3:7]).T+np.array(row[:3])
        parts.append({'name':part['name'],'group':'FX' if part['emissive'] else part['group'],'material':part['name'],'_mesh':(v,np.array(part['faces']))})
        materials[part['name']]={'color':part['color']}
    return {'parts':parts,'materials':materials}

def render_frame(clip,frame,size=600):
    return render(frame_scene(clip,frame),size=size,world_width=6.7,target=(0,1.35,-.90),aa=1)

def main():
    clips=[json.loads(p.read_text(encoding='utf-8')) for p in sorted((ROOT/'animations').glob('D??.json'))]
    timeline={};posters=[]
    board=Image.new('RGB',(1800,1450),'#F5F1E8');bd=ImageDraw.Draw(board)
    bd.text((45,30),'PUPSTERS / SITTING ATTACKS',font=font(21,True),fill='#8B7863')
    bd.text((45,70),'앉아서도, 제대로 한 방.',font=font(45,True),fill='#302A22')
    bd.text((45,130),'준비 → 능력 발사 → 반동과 복귀 / 여섯 마리의 서로 다른 공격',font=font(21),fill='#817462')
    sheet=Image.new('RGB',(1800,2400),'#F5F1E8');sd=ImageDraw.Draw(sheet)
    for i,clip in enumerate(clips):
        frames=[render_frame(clip,f,600) for f in clip['frames'][:-1]]
        timeline[clip['id']]=frames
        palette=frames[29].quantize(colors=255)
        quant=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
        durations=[30 if i%3 else 40 for i in range(60)]
        quant[0].save(ROOT/'previews'/f"{clip['id']}-attack.gif",save_all=True,append_images=quant[1:],duration=durations,loop=0,disposal=2,optimize=False)
        frames[0].save(ROOT/'previews'/f"{clip['id']}-idle.png")
        frames[29].save(ROOT/'previews'/f"{clip['id']}-attack.png")
        x=(i%3)*600;y=180+(i//3)*620
        board.paste(frames[29],(x,y));bd.text((x+35,y+8),clip['displayName']+' / '+clip['attackName'],font=font(24,True),fill='#302A22')
        for j,(fi,label) in enumerate([(0,'대기'),(14,'준비'),(29,'발사'),(48,'복귀')]):
            x=j*450;y=i*400
            sheet.paste(frames[fi].resize((390,390)),(x+25,y+10))
            sd.text((x+22,y+14),clip['displayName']+' · '+label,font=font(20,True),fill='#756650')
        print('Rendered '+clip['id'],flush=True)
    board.save(ROOT/'previews/attacks-overview.png')
    sheet.save(ROOT/'previews/attack-poses.png')
    grid=[]
    for fi in range(60):
        image=Image.new('RGB',(1080,820),'#F5F1E8');d=ImageDraw.Draw(image)
        d.text((24,14),'PUPSTERS / 앉은 자세 공격 모션',font=font(26,True),fill='#302A22')
        phase='준비' if fi<18 else '발사' if fi<38 else '복귀'
        d.text((930,20),phase,font=font(20,True),fill='#8B7863')
        for i,c in enumerate(clips):
            x=i%3*360;y=65+i//3*365
            image.paste(timeline[c['id']][fi].resize((360,360)),(x,y))
            d.text((x+20,y+8),c['displayName'],font=font(20,True),fill='#302A22')
        d.text((24,793),'실제 모델과 동일한 3D 프레임 · 발바닥 / 엉덩이 고정',font=font(15),fill='#8B7863')
        grid.append(image)
    palette=board.resize((900,725)).quantize(colors=255)
    quant=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in grid]
    quant[0].save(ROOT/'previews/attacks-loop.gif',save_all=True,append_images=quant[1:],duration=durations,loop=0,disposal=2,optimize=False)
    print('Saved six GIFs, overview, poses and collection loop.')
if __name__=='__main__':main()
