"""Render the exported map geometry and label the shared placement coordinates."""
import json
import numpy as np
from PIL import Image,ImageDraw
from build_models import ROOT
from render_previews import render,font

BG='#F5F1E8';INK='#3B4F43';MUTED='#778374'
SIZE=(1800,1220)
EYE=(-60,78,86);TARGET=(0,1.3,0)

def board(im,title,subtitle,footer):
    out=Image.new('RGB',(im.width,im.height+180),BG)
    out.paste(im,(0,110));d=ImageDraw.Draw(out)
    d.text((64,27),title,font=font(37,True),fill=INK)
    d.text((66,78),subtitle,font=font(19),fill=MUTED)
    d.line((64,out.height-66,out.width-64,out.height-66),fill='#D9DECE',width=2)
    d.text((66,out.height-46),footer,font=font(19),fill=MUTED)
    return out

def projector(eye,target,size,world_width):
    f=np.array(target,dtype=float)-eye;f/=np.linalg.norm(f)
    r=np.cross(f,[0,1,0]);r/=np.linalg.norm(r);u=np.cross(r,f)
    def project(p):
        q=(np.array(p)-target)@np.array([r,u,f]).T
        return (q[0]*size[0]/world_width+size[0]/2,-q[1]*size[0]/world_width+size[1]/2)
    return project

def label(d,xy,text,bg,fg='white',sz=18):
    f=font(sz,True);b=d.textbbox((0,0),text,font=f)
    w=b[2]-b[0]+18;h=sz+14;x,y=xy
    d.rounded_rectangle((x-w/2,y-h/2,x+w/2,y+h/2),radius=7,fill=bg)
    d.text((x,y-1),text,font=f,fill=fg,anchor='mm')

def main():
    layout=json.loads((ROOT/'layout.json').read_text(encoding='utf-8'))
    empty=json.loads((ROOT/'scenes/map.json').read_text(encoding='utf-8'))
    populated=json.loads((ROOT/'scenes/showcase.json').read_text(encoding='utf-8'))
    for stem,scene,title,sub in [
        ('map-overview',empty,'사고멍치 · 블록 놀이방','장난감 상자에서 강아지 쉼터까지 — 꺾인 S자 길과 16개의 배치 자리'),
        ('map-showcase',populated,'사고멍치 · 블록 놀이방','앉아 있는 강아지 6종과 몹 5마리를 놓아 본 실제 크기 예시')]:
        im=render(scene,eye=EYE,target=TARGET,size=SIZE,world_width=104,aa=2)
        board(im,title,sub,'76 × 52 studs  /  길 폭 6 studs  /  배치 자리 16개  /  실제 3D 모델 렌더').save(ROOT/'previews'/f'{stem}.png')
    eye=(0,100,.001);target=(0,0,0);ww=86
    im=render(empty,eye=eye,target=target,size=SIZE,world_width=ww,aa=2)
    d=ImageDraw.Draw(im);project=projector(np.array(eye),np.array(target),SIZE,ww)
    # Direct overhead plan: +X goes right, +Z goes down. Numbers match Roblox helpers.
    for slot in layout['slots']:
        label(d,project(slot['position']),slot['id'],'#507E65',sz=18)
    for i,w in enumerate(layout['waypoints']):
        x,y=project(w['position']);d.ellipse((x-8,y-8,x+8,y+8),fill='#FAF5DF',outline='#B97C3D',width=3)
        label(d,(x,y-23),str(i+1),'#BD8348',sz=15)
    label(d,project([-31,0,-22.5]),'몹 입구','#C96A52',sz=20)
    label(d,project([31,0,22]),'강아지 쉼터','#527E70',sz=20)
    board(im,'블록 놀이방 · 배치도','초록 P01–P16: 강아지 자리     ·     갈색 1–6: 몹 경로점     ·     흰 화살표: 진행 방향',
          '상단 = -Z  /  오른쪽 = +X  /  경로 길이 192 studs  /  배치 칸 4.2 × 4.2 studs').save(ROOT/'previews/map-top.png')
    print(json.dumps({'previews':['map-overview.png','map-showcase.png','map-top.png'],'size':[1800,1400]}))

if __name__=='__main__':main()
