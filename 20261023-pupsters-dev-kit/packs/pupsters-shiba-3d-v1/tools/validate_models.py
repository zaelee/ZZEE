"""Validate final binary files independently of the export serializer."""
from pathlib import Path
from collections import Counter
from html.parser import HTMLParser
import base64, hashlib, json, struct
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def check_model(stem):
    p=ROOT/'models'/f'{stem}.gltf';doc=json.loads(p.read_text(encoding='utf-8'))
    data=base64.b64decode(doc['buffers'][0]['uri'].split(',')[1]);assert len(data)==doc['buffers'][0]['byteLength']
    glb=(ROOT/'models'/f'{stem}.glb').read_bytes();magic,version,size=struct.unpack_from('<4sII',glb)
    assert magic==b'glTF' and version==2 and size==len(glb)
    jl,jt=struct.unpack_from('<I4s',glb,12);assert jt==b'JSON'
    gd=json.loads(glb[20:20+jl]);bl,bt=struct.unpack_from('<I4s',glb,20+jl);assert bt==b'BIN\0'
    assert glb[28+jl:28+jl+bl][:len(data)]==data
    copy=json.loads(json.dumps(doc));copy['buffers'][0].pop('uri');assert copy==gd
    def read(i):
        a=doc['accessors'][i];b=doc['bufferViews'][a['bufferView']]
        dtype={5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']];n={'SCALAR':1,'VEC3':3}[a['type']]
        off=b.get('byteOffset',0)+a.get('byteOffset',0);length=a['count']*n*np.dtype(dtype).itemsize
        assert off%np.dtype(dtype).itemsize==0 and off+length<=len(data) and length<=b['byteLength']
        values=np.frombuffer(data,dtype=dtype,count=a['count']*n,offset=off).reshape(a['count'],n)
        assert np.isfinite(values).all()
        if 'min' in a:assert np.allclose(values.min(axis=0),a['min']) and np.allclose(values.max(axis=0),a['max'])
        return values
    offsets={};visited=set()
    def visit(i,offset):
        assert i not in visited;visited.add(i);node=doc['nodes'][i]
        here=offset+node.get('translation',[0,0,0]);offsets[i]=here
        for child in node.get('children',[]):visit(child,here)
    for i in doc['scenes'][0]['nodes']:visit(i,np.zeros(3))
    assert len(visited)==len(doc['nodes'])
    world=[];triangles=0;largest=0
    for ni,node in enumerate(doc['nodes']):
        if 'mesh' not in node:continue
        for prim in doc['meshes'][node['mesh']]['primitives']:
            v=read(prim['attributes']['POSITION']);norm=read(prim['attributes']['NORMAL']);indices=read(prim['indices']).ravel()
            assert len(indices)%3==0 and indices.min()>=0 and indices.max()<len(v)
            assert np.allclose(np.linalg.norm(norm,axis=1),1,atol=2e-5)
            f=indices.reshape(-1,3);cross=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
            assert (np.linalg.norm(cross,axis=1)>1e-10).all()
            expected=cross/np.linalg.norm(cross,axis=1)[:,None]
            assert np.allclose(norm[f[:,0]],expected,atol=2e-5)
            volume=np.einsum('ij,ij->i',v[f[:,0]],np.cross(v[f[:,1]],v[f[:,2]])).sum()/6
            assert volume>0,node['name']
            _,weld=np.unique(np.round(v,6),axis=0,return_inverse=True);faces=weld[f]
            edges=Counter(tuple(sorted((int(a),int(b)))) for face in faces for a,b in zip(face,np.roll(face,-1)))
            assert set(edges.values())=={2},node['name']+' is not closed'
            assert len(f)<=20000
            world.append(v+offsets[ni]);triangles+=len(f);largest=max(largest,len(f))
    mouth=[offsets[i] for i,n in enumerate(doc['nodes']) if n['name']=='Mouth_Att'];assert len(mouth)==1 and np.allclose(mouth[0],[0,.82,-1.53])
    world=np.concatenate(world);assert abs(world[:,1].min())<1e-6
    stats=json.loads((ROOT/'docs/model-stats.json').read_text())[0 if stem.endswith('Block') else 1]
    assert np.allclose(world.min(axis=0),stats['bounds']['min'],atol=1e-6) and np.allclose(world.max(axis=0),stats['bounds']['max'],atol=1e-6)
    return {'file':p.name,'meshCount':len(doc['meshes']),'triangles':triangles,'largestMeshTriangles':largest,'closedMeshes':True,'positiveVolumes':True,'normalsAndWinding':True,'glbMatchesGltf':True,'worldBoundsMatchScene':True,'mouthWorld':mouth[0].tolist(),'sha256':sha(p)}

def main():
    result={'passed':True,'models':[check_model('Shiba_Block'),check_model('Shiba_Rounded')]}
    native=json.loads((ROOT/'docs/native-validation.json').read_text(encoding='utf-8'))
    assert native['status']=='pass' and native['sourceSha256']==sha(ROOT/'scenes/block.json')
    result['nativeParts']=native['checks']['partCount']
    result.update(actualMeshRendersInspected=True,robloxStudioTested=False,browserViewerTested=False,scope='Static models, no skeletal rig or animation. Browser local-file access restricted; no bypass used.')
    (ROOT/'docs/validation.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    class Links(HTMLParser):
        def handle_starttag(self,tag,attrs):
            for k,v in attrs:
                if k in ('src','href') and not v.startswith(('http:','https:','data:','#')):
                    assert (ROOT/v.split('#')[0]).is_file(),v
    Links().feed((ROOT/'index.html').read_text(encoding='utf-8'))
    print(json.dumps(result))

if __name__=='__main__':main()
