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
    import os
    chosen=(os.environ.get('PUPSTERS_FONT_BOLD') if bold else None) or os.environ.get('PUPSTERS_FONT')
    p=Path(chosen or ('C:/Windows/Fonts/malgunbd.ttf' if bold else 'C:/Windows/Fonts/malgun.ttf'))
    try:
        return ImageFont.truetype(str(p),size)
    except OSError as error:
        raise RuntimeError('Set PUPSTERS_FONT to an installed Korean font; PUPSTERS_FONT_BOLD is optional.') from error


def main():
    manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
    entries=manifest['models'];upgrades=manifest.get('upgrades',[])
    board=Image.new('RGB',(1800,1530),'#F5F1E8');draw=ImageDraw.Draw(board)
    draw.text((50,28),'PUPSTERS / SITTING COLLECTION / V4',font=font(20,True),fill='#8B7863')
    draw.text((50,72),'다 같이, 앉아.',font=font(46,True),fill='#2E2822')
    draw.text((50,135),'짧은 몸 · 바닥에 붙인 엉덩이 · 나란히 짚은 앞발',font=font(22),fill='#817462')
    sides=Image.new('RGB',(1800,490),'#F5F1E8');sd=ImageDraw.Draw(sides)
    sd.text((35,22),'SITTING / 옆에서 본 앉은 자세',font=font(25,True),fill='#2E2822')
    silhouettes=Image.new('RGB',(1800,470),'#F5F1E8');sil=ImageDraw.Draw(silhouettes)
    sil.text((35,22),'색 없이도 서로 다른 모양',font=font(25,True),fill='#2E2822')
    for i,e in enumerate(entries+upgrades):
        sc=json.loads((ROOT/e['scene']).read_text(encoding='utf-8'))
        render(sc,size=900).save(ROOT/e['preview'])
        views=[('FRONT',(0,1.35,-8)),('SIDE',(8,1.35,-.15)),('BACK',(0,1.35,8)),('TOP',(0,9,-.151))]
        sheet=Image.new('RGB',(1440,420),'#F5F1E8');vdraw=ImageDraw.Draw(sheet)
        for j,(label,eye) in enumerate(views):
            sheet.paste(render(sc,eye,360),(j*360,45))
            vdraw.text((j*360+20,15),label,font=font(18,True),fill='#6C6559')
        sheet.save(ROOT/e['views'])
        if e['id']=='D05':render(sc,(0,9,-.151),900).save(ROOT/'previews/D05-poodle-top.png')
        if i>=6:continue
        x=(i%3)*600;y=195+(i//3)*650
        board.paste(render(sc,size=600),(x,y))
        draw.text((x+40,y+15),e['id']+'  '+e['displayName'],font=font(25,True),fill='#3B3228')
        draw.text((x+40,y+579),e['feature'],font=font(20),fill='#776954')
        sides.paste(render(sc,(8,1.35,-.15),300),(i*300,80))
        sd.text((i*300+25,415),e['displayName'],font=font(22,True),fill='#6C6559')
        mono=copy.deepcopy(sc)
        for material in mono['materials'].values():material['color']=[.20,.18,.17]
        silhouettes.paste(render(mono,(0,1.35,-8),300),(i*300,85))
        sil.text((i*300+24,412),e['displayName'],font=font(19,True),fill='#6C6559')
    draw.text((50,1490),'실제 3D 모델 렌더 · 무들 기본형: 작은 중앙 번개 1개 · 주변 전기는 업그레이드 외형으로 별도 보관',font=font(17),fill='#94846C')
    board.save(ROOT/'previews/collection.png')
    sides.save(ROOT/'previews/sitting-side.png')
    silhouettes.save(ROOT/'previews/silhouettes.png')
    comparison=Image.new('RGB',(1800,1120),'#F5F1E8');cd=ImageDraw.Draw(comparison)
    cd.text((45,25),'MOODLE / BASE → UPGRADE',font=font(22,True),fill='#8B7863')
    for i,e in enumerate([next(e for e in entries if e['id']=='D05'),upgrades[0]]):
        comparison.paste(Image.open(ROOT/e['preview']),(i*900,120))
        cd.text((i*900+45,80),'기본형' if i==0 else '업그레이드 외형',font=font(35,True),fill='#2E2822')
        cd.text((i*900+45,1045),'머리 중앙에 작은 지그재그 하나' if i==0 else '머리 위와 양옆으로 번개 확장',font=font(25),fill='#776954')
    comparison.save(ROOT/'previews/poodle-stages.png')
    print('Rendered six sitting dogs, upgrade variant, side comparison and seven four-view sheets.')

if __name__=='__main__':main()
