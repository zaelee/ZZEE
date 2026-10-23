"""CPU z-buffer rendering of the same geometry exported to glTF, no browser needed."""
from pathlib import Path
import copy, json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from build_models import ROOT, mesh

def render(sc,eye=(5,4.2,-7),size=900,world_width=4.7,target=(0,1.35,-.15),aa=2):
    ss=aa;w=h=size*ss;target=np.array(target,dtype=float);eye=np.array(eye,dtype=float)
    forward=target-eye;forward/=np.linalg.norm(forward)
    right=np.cross(forward,[0,1,0]);right/=np.linalg.norm(right)
    up=np.cross(right,forward);basis=np.array([right,up,forward])
    scale=w/world_width
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
        v,f=p['_mesh'] if '_mesh' in p else mesh(p);projected=project(v);base=np.array(sc['materials'][p['material']]['color'])*255
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
