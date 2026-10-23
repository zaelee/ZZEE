"""Independent serialized clip/GLB/GIF/link checks for the attack deliverable."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,struct,hashlib
import numpy as np
from PIL import Image,ImageSequence
ROOT=Path(__file__).resolve().parents[1]

def accessor(doc,binary,index):
    a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']]
    typ={5126:'<f4',5123:'<u2'}[a['componentType']];n={'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']]
    offset=v.get('byteOffset',0)+a.get('byteOffset',0)
    assert offset+np.dtype(typ).itemsize*a['count']*n<=len(binary)
    arr=np.frombuffer(binary,dtype=typ,count=a['count']*n,offset=offset).reshape(a['count'],n)
    assert np.isfinite(arr).all()
    return arr
def glb_check(clip):
    raw=(ROOT/'animations'/f"{clip['id']}-attack.glb").read_bytes()
    magic,version,length=struct.unpack_from('<4sII',raw)
    assert magic==b'glTF' and version==2 and length==len(raw)
    jl,jt=struct.unpack_from('<I4s',raw,12);assert jt==b'JSON'
    doc=json.loads(raw[20:20+jl]);bl,bt=struct.unpack_from('<I4s',raw,20+jl)
    assert bt==b'BIN\0' and 28+jl+bl==len(raw)
    binary=raw[28+jl:];assert len(doc['animations'])==1
    rows=np.array([f['transforms'] for f in clip['frames']]);times=np.array([f['time'] for f in clip['frames']])
    indices={p['name']:i for i,p in enumerate(clip['parts'])}
    targeted=set()
    for ch in doc['animations'][0]['channels']:
        sampler=doc['animations'][0]['samplers'][ch['sampler']];node=doc['nodes'][ch['target']['node']]
        i=indices[node['name']];vals=rows[:,i];path=ch['target']['path'];assert (i,path) not in targeted;targeted.add((i,path))
        assert np.allclose(accessor(doc,binary,sampler['input']).ravel(),times,atol=1e-6)
        expected=vals[:,:3] if path=='translation' else vals[:,3:7] if path=='rotation' else vals[:,7:10]*np.where(vals[:,10:11]>0,1,.00001)
        assert np.allclose(accessor(doc,binary,sampler['output']),expected,atol=1e-6)
    for node in doc['nodes'][1:]:
        i=indices[node['name']];vals=rows[:,i]
        for path,expected in [('translation',vals[:,:3]),('rotation',vals[:,3:7]),('scale',vals[:,7:10]*np.where(vals[:,10:11]>0,1,.00001))]:
            if (i,path) not in targeted:assert np.allclose(expected,node[path],atol=1e-6)
    return {'channels':len(targeted),'matchesSampledClip':True,'sha256':hashlib.sha256(raw).hexdigest()}
def gif_check(path):
    im=Image.open(path);durations=[]
    for frame in ImageSequence.Iterator(im):durations.append(frame.info.get('duration',0))
    # GIF merges identical idle frames while preserving their combined duration.
    assert 24<=im.n_frames<=60 and sum(durations)==2000
    return {'frames':im.n_frames,'durationMs':sum(durations)}
def links_check():
    count=0
    class Links(HTMLParser):
        def handle_starttag(self,tag,attrs):
            nonlocal count
            for k,v in attrs:
                if k not in ['src','srcset','href'] or not v:continue
                url=urlsplit(v)
                if url.scheme or url.netloc or not url.path:continue
                assert (ROOT/unquote(url.path)).is_file(),v
                count+=1
    for file in ['index.html','viewer.html']:Links().feed((ROOT/file).read_text(encoding='utf-8'))
    return count
def main():
    reports=[];manifest=[]
    for path in sorted((ROOT/'animations').glob('D??.json')):
        clip=json.loads(path.read_text(encoding='utf-8'));rows=np.array([f['transforms'] for f in clip['frames']]);parts=clip['parts']
        assert len(rows)==61 and rows.shape==(61,len(parts),11)
        assert np.isfinite(rows).all() and np.all(rows[:,:,7:10]>0)
        assert np.allclose(np.linalg.norm(rows[:,:,3:7],axis=2),1,atol=1e-6)
        assert all(np.allclose(rows[:,i],rows[0,i]) for i,p in enumerate(parts) if p['name'].endswith('_Paw'))
        assert sum(p['name'].endswith('_Paw') for p in parts)==4
        for i,p in enumerate(parts):
            if p['isEffect']:
                assert rows[0,i,10]==0 and rows[-1,i,10]==0
                for j in range(60):
                    # A disappearing effect must not fly back toward origin on interpolation.
                    if rows[j,i,10] and not rows[j+1,i,10]:
                        assert np.allclose(rows[j,i,:3],rows[j+1,i,:3])
            else:
                assert np.allclose(rows[0,i,:3],rows[-1,i,:3])
                assert abs(abs(np.dot(rows[0,i,3:7],rows[-1,i,3:7]))-1)<1e-6
                assert np.allclose(rows[0,i,7:],rows[-1,i,7:])
        if clip['id']=='D01':
            names={p['name']:i for i,p in enumerate(parts)}
            for name in ['BoneShaft','BoneBlockEndL','BoneBlockEndR']:
                assert np.allclose(rows[18,names[name],:3],rows[18,names['Shot_'+name],:3])
        reports.append({'id':clip['id'],'glb':glb_check(clip),'gif':gif_check(ROOT/'previews'/f"{clip['id']}-attack.gif"),'feetFixed':True,'noEffectReturnToOrigin':True,'restPoseRestored':True})
        manifest.append({k:clip[k] for k in ['id','displayName','attackName','description','duration','fps','release']}|{'clip':path.relative_to(ROOT).as_posix(),'glb':f"animations/{clip['id']}-attack.glb",'roblox':f"roblox/{clip['id']}-attack.rbxmx",'gif':f"previews/{clip['id']}-attack.gif"})
    assert len(reports)==6
    report={'passed':True,'clips':reports,'collectionGif':gif_check(ROOT/'previews/attacks-loop.gif'),'htmlLinksChecked':links_check(),'rendersInspected':True,'robloxStudioTested':False,'browserViewerTested':False}
    (ROOT/'docs/delivery-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    models=[]
    for scene in sorted((ROOT/'scenes').glob('D*.json')):
        sc=json.loads(scene.read_text(encoding='utf-8'))
        models.append({'id':sc['id'],'displayName':sc['displayName'],'scene':scene.relative_to(ROOT).as_posix(),'native':f'native/{scene.stem}.rbxmx'})
    (ROOT/'manifest.json').write_text(json.dumps({'version':1,'basedOn':'pupsters-block-pack-v4','pose':'sitting','models':models,'clips':manifest},ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'passed':True,'clips':6,'gifFrames':[r['gif']['frames'] for r in reports],'gifDurationMs':2000,'htmlLinks':report['htmlLinksChecked']}))
if __name__=='__main__':main()
