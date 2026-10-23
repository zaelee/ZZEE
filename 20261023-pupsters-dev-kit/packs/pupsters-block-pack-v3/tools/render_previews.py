"""CPU z-buffer rendering of the same geometry exported to glTF, no browser needed."""
from pathlib import Path
import copy, json, math
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
            shade=1.0 if p['group']=='FX' else .61+.39*max(0,float(np.dot(normal,light)))
            rgb=np.clip(base*shade,0,255).astype(np.uint8)
            color[y0:y1+1,x0:x1+1][mask]=rgb;old[mask]=z[mask]
    return Image.fromarray(color).resize((size,size),Image.Resampling.LANCZOS)

def font(size,bold=False):
    p=Path('C:/Windows/Fonts/malgunbd.ttf' if bold else 'C:/Windows/Fonts/malgun.ttf')
    return ImageFont.truetype(str(p),size)


def main():
    entries=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))['models']
    board=Image.new('RGB',(1800,1530),'#F5F1E8')
    draw=ImageDraw.Draw(board)
    draw.text((50,28),'PUPSTERS / BLOCK DOG COLLECTION / V3',font=font(20,True),fill='#8B7863')
    draw.text((50,72),'몸매부터 다른 멍친구들.',font=font(46,True),fill='#2E2822')
    draw.text((50,135),'양쪽 귀와 낡은 골판지 왕관, 털 주변에 떠 있는 찌리릭 전기.',font=font(22),fill='#817462')
    detail=Image.new('RGB',(1800,1140),'#F5F1E8');dd=ImageDraw.Draw(detail)
    dd.text((45,25),'PUPSTERS / DETAIL UPDATE / V3',font=font(20,True),fill='#8B7863')
    silhouettes=Image.new('RGB',(1800,470),'#F5F1E8')
    silhouette_draw=ImageDraw.Draw(silhouettes)
    silhouette_draw.text((35,22),'색 없이도 서로 다른 모양',font=font(25,True),fill='#2E2822')
    for i,e in enumerate(entries):
        sc=json.loads((ROOT/e['scene']).read_text(encoding='utf-8'))
        image=render(sc,size=900)
        image.save(ROOT/e['preview'])
        if e['id']=='D05':render(sc,(0,9,-.151),900).save(ROOT/'previews/D05-poodle-top.png')
        if e['id'] in ('D05','D06'):
            column=0 if e['id']=='D06' else 1
            detail.paste(image,(column*900,140))
            dd.text((column*900+45,80),e['displayName'],font=font(38,True),fill='#2E2822')
            dd.text((column*900+45,1060),e['feature'],font=font(24),fill='#776954')
        thumb=render(sc,size=600)
        x=(i%3)*600;y=195+(i//3)*650
        board.paste(thumb,(x,y))
        draw.text((x+40,y+15),e['id']+'  '+e['displayName'],font=font(25,True),fill='#3B3228')
        draw.text((x+40,y+579),e['feature'],font=font(20),fill='#776954')
        views=[('FRONT',(0,1.35,-8)),('SIDE',(8,1.35,-.15)),('BACK',(0,1.35,8)),('TOP',(0,9,-.151))]
        sheet=Image.new('RGB',(1440,420),'#F5F1E8');sd=ImageDraw.Draw(sheet)
        for j,(label,eye) in enumerate(views):
            sheet.paste(render(sc,eye,360),(j*360,45))
            sd.text((j*360+20,15),label,font=font(18,True),fill='#6C6559')
        sheet.save(ROOT/e['views'])
        mono=copy.deepcopy(sc)
        for material in mono['materials'].values():material['color']=[.20,.18,.17]
        silhouettes.paste(render(mono,(0,1.35,-8),300),(i*300,85))
        silhouette_draw.text((i*300+24,412),e['displayName'],font=font(19,True),fill='#6C6559')
    draw.text((50,1490),'실제 3D 모델 렌더 · 무들 전기는 독립 FX 그룹 · 왕관은 속이 빈 골판지 띠',font=font(17),fill='#94846C')
    board.save(ROOT/'previews/collection.png')
    silhouettes.save(ROOT/'previews/silhouettes.png')
    detail.save(ROOT/'previews/refinement.png')
    print('Rendered '+str(len(entries))+' dogs and four-view sheets.')

if __name__=='__main__':main()
