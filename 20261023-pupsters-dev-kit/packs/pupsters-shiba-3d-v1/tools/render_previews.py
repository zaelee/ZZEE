"""CPU z-buffer rendering of the same geometry exported to glTF, no browser needed."""
from pathlib import Path
import json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from build_models import ROOT, mesh

def render(sc,eye=(5,4.2,-7),size=900):
    ss=2;w=h=size*ss;target=np.array([0,1.35,-.15]);eye=np.array(eye,dtype=float)
    forward=target-eye;forward/=np.linalg.norm(forward)
    right=np.cross(forward,[0,1,0]);right/=np.linalg.norm(right)
    up=np.cross(right,forward);basis=np.array([right,up,forward])
    scale=w/4.7
    def project(v):
        p=(v-target)@basis.T
        return np.column_stack([p[:,0]*scale+w/2,-p[:,1]*scale+h/2,p[:,2]])
    bg=Image.new('RGB',(w,h),'#F5F1E8')
    shadow=Image.new('RGBA',(w,h));d=ImageDraw.Draw(shadow)
    ground=project(np.array([[0,0,0]]))[0]
    d.ellipse([ground[0]-.97*scale,ground[1]-.28*scale,ground[0]+.97*scale,ground[1]+.28*scale],fill=(74,58,37,35))
    shadow=shadow.filter(ImageFilter.GaussianBlur(20*ss));bg.paste(shadow,mask=shadow.getchannel('A'))
    color=np.array(bg);depth=np.full((h,w),np.inf)
    light=np.array([-3,7,-5],dtype=float);light/=np.linalg.norm(light)
    for p in sc['parts']:
        v,f=mesh(p);projected=project(v);base=np.array(sc['materials'][p['material']]['color'])*255
        for face in f:
            world=v[face];normal=np.cross(world[1]-world[0],world[2]-world[0]);normal/=np.linalg.norm(normal)
            if np.dot(normal,-forward)<-1e-6:continue
            tri=projected[face];x0=max(0,int(np.floor(tri[:,0].min())));x1=min(w-1,int(np.ceil(tri[:,0].max())))
            y0=max(0,int(np.floor(tri[:,1].min())));y1=min(h-1,int(np.ceil(tri[:,1].max())))
            if x1<x0 or y1<y0:continue
            a,b,c=tri;den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
            if abs(den)<1e-8:continue
            xx,yy=np.meshgrid(np.arange(x0,x1+1)+.5,np.arange(y0,y1+1)+.5)
            wa=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den
            wb=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den;wc=1-wa-wb
            z=wa*a[2]+wb*b[2]+wc*c[2];old=depth[y0:y1+1,x0:x1+1]
            mask=(wa>=-1e-6)&(wb>=-1e-6)&(wc>=-1e-6)&(z<old)
            shade=.61+.39*max(0,float(np.dot(normal,light)))
            rgb=np.clip(base*shade,0,255).astype(np.uint8)
            color[y0:y1+1,x0:x1+1][mask]=rgb;old[mask]=z[mask]
    return Image.fromarray(color).resize((size,size),Image.Resampling.LANCZOS)

def font(size,bold=False):
    p=Path('C:/Windows/Fonts/malgunbd.ttf' if bold else 'C:/Windows/Fonts/malgun.ttf')
    return ImageFont.truetype(str(p),size)

def main():
    scenes={v:json.loads((ROOT/'scenes'/f'{v}.json').read_text(encoding='utf-8')) for v in ['block','rounded']}
    main=[]
    for variant,sc in scenes.items():
        image=render(sc);image.save(ROOT/'previews'/f'{variant}-three-quarter.png');main.append(image)
        views=[('FRONT',(0,1.35,-8)),('SIDE',(8,1.35,-.15)),('BACK',(0,1.35,8)),('TOP',(0,9,-.151))]
        sheet=Image.new('RGB',(1440,420),'#F5F1E8');draw=ImageDraw.Draw(sheet)
        for i,(label,eye) in enumerate(views):
            sheet.paste(render(sc,eye,360),(i*360,45));draw.text((i*360+20,15),label,font=font(18,True),fill='#6C6559')
        sheet.save(ROOT/'previews'/f'{variant}-views.png')
    board=Image.new('RGB',(1800,1150),'#F5F1E8');draw=ImageDraw.Draw(board)
    draw.text((65,36),'PUPSTERS  /  SHIBA 3D',font=font(22,True),fill='#8B7863')
    draw.text((65,80),'큰 머리, 짧은 몸. 두 가지 입체 시바.',font=font(46,True),fill='#2E2822')
    for i,img in enumerate(main):board.paste(img,(i*900,180))
    draw.text((65,178),'01  BLOCK',font=font(27,True),fill='#2E2822')
    draw.text((965,178),'02  ROUNDED LOW-POLY',font=font(27,True),fill='#2E2822')
    draw.text((65,1050),'로블록스 기본 부품 · 블록과 도형 조합',font=font(25),fill='#675D50')
    draw.text((965,1050),'둥근 머리 · 짧은 네 발 · 말린 꼬리',font=font(25),fill='#675D50')
    draw.text((65,1110),'실제 내보낸 모델과 동일한 지오메트리의 렌더 · Y 위 / -Z 정면 · 단위 studs',font=font(18),fill='#887E70')
    board.save(ROOT/'previews/comparison.png')
    print('Rendered both models and front/side/back/top sheets.')

if __name__=='__main__':main()
