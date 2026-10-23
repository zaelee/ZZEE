"""Cross-format structural checks. Does not claim a Studio or WebGL execution test."""
import base64, collections, json, re, struct
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import numpy as np
from build_models import ROOT, mesh, srgb_linear
import export_native

def close(actual,expected,tol=2e-6):
    assert np.allclose(actual,expected,atol=tol,rtol=0),(np.shape(actual),np.shape(expected))

def read_accessor(doc,buf,i):
    a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']]
    count={'SCALAR':1,'VEC3':3}[a['type']];dt={5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]
    offset=v.get('byteOffset',0)+a.get('byteOffset',0)
    out=np.frombuffer(buf,dtype=dt,count=a['count']*count,offset=offset)
    assert offset+out.nbytes<=v.get('byteOffset',0)+v['byteLength']<=len(buf)
    return out.reshape(-1,count) if count>1 else out

class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[]
    def handle_starttag(self,tag,attrs):
        for key,val in attrs:
            if key in ('src','href') and val:self.links.append(val)

def run():
    records=[];seen=[]
    paths=sorted((ROOT/'scenes').glob('*.json'))
    assert len(paths)==9
    for path in paths:
        sc=json.loads(path.read_text(encoding='utf-8'));seen.append(sc['id']);parts=sc['parts']
        assert sc['up']=='+Y' and sc['front']=='-Z' and sc['units']=='studs'
        assert len(set(p['name'] for p in parts))==len(parts)
        meshes=[];bounds=[]
        for p in parts:
            assert p['type'] in ('box','sphere') and p['material'] in sc['materials']
            assert np.isfinite(p['size']+p['position']+p['rotation']).all() and min(p['size'])>0
            v,f=mesh(p);assert np.isfinite(v).all()
            normals=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
            assert min(np.linalg.norm(normals,axis=1))>1e-10
            edges=collections.Counter(tuple(sorted((int(a),int(b)))) for face in f for a,b in zip(face,np.roll(face,-1)))
            assert set(edges.values())=={2},p['name']
            volume=np.einsum('ij,ij->i',v[f[:,0]],np.cross(v[f[:,1]],v[f[:,2]])).sum()/6
            assert volume>0
            meshes.append((v,f));bounds.append((v.min(0),v.max(0)))
        vs=np.concatenate([v for v,f in meshes]);assert abs(vs[:,1].min())<1e-7
        # For these axis-aligned block models every component must touch the assembly.
        reach={0}
        for _ in parts:
            for a,(lo,hi) in enumerate(bounds):
                if a in reach:continue
                if any(np.all(hi>=bounds[b][0]-1e-7) and np.all(lo<=bounds[b][1]+1e-7) for b in reach):reach.add(a)
        assert len(reach)==len(parts),(sc['id'],'disconnected',set(range(len(parts)))-reach)
        doc=json.loads((ROOT/'models'/f'{sc["name"]}.gltf').read_text(encoding='utf-8'))
        buf=base64.b64decode(doc['buffers'][0]['uri'].split(',')[1]);assert len(buf)==doc['buffers'][0]['byteLength']
        raw=(ROOT/'models'/f'{sc["name"]}.glb').read_bytes();magic,ver,length=struct.unpack_from('<4sII',raw)
        assert magic==b'glTF' and ver==2 and length==len(raw)
        n,kind=struct.unpack_from('<I4s',raw,12);assert kind==b'JSON'
        glbdoc=json.loads(raw[20:20+n]);bn,bkind=struct.unpack_from('<I4s',raw,20+n);assert bkind==b'BIN\0'
        glbbuf=raw[28+n:28+n+bn];assert glbbuf[:len(buf)]==buf
        no_uri=json.loads(json.dumps(doc));no_uri['buffers'][0].pop('uri');assert no_uri==glbdoc
        assert len(doc['meshes'])==len(parts)
        matids={m['name']:i for i,m in enumerate(doc['materials'])}
        for key,m in sc['materials'].items():
            assert len(m['color'])==3 and min(m['color'])>=0 and max(m['color'])<=1
            alpha=m.get('opacity',1);assert 0<=alpha<=1
            out=doc['materials'][matids[key]];close(out['pbrMetallicRoughness']['baseColorFactor'],srgb_linear(m['color'])+[alpha])
            assert (out.get('alphaMode')=='BLEND')==(alpha<1)
        parent={ch:i for i,node in enumerate(doc['nodes']) for ch in node.get('children',[])}
        mesh_nodes={node['mesh']:i for i,node in enumerate(doc['nodes']) if 'mesh' in node}
        for i,(p,(v,f)) in enumerate(zip(parts,meshes)):
            prim=doc['meshes'][i]['primitives'][0];node=doc['nodes'][mesh_nodes[i]];group=doc['nodes'][parent[mesh_nodes[i]]]
            assert node['name']==p['name'] and group['name']==p['group'] and prim['material']==matids[p['material']]
            pos=read_accessor(doc,buf,prim['attributes']['POSITION']);indices=read_accessor(doc,buf,prim['indices'])
            close(pos[indices]+group['translation'],v[f].reshape(-1,3))
            normal=read_accessor(doc,buf,prim['attributes']['NORMAL']);close(np.linalg.norm(normal,axis=1),np.ones(len(normal)))
            expected=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]]);expected/=np.linalg.norm(expected,axis=1)[:,None]
            close(normal,np.repeat(expected,3,axis=0))
        hit=[n for n in doc['nodes'] if n['name']=='HitPoint'];assert len(hit)==1;close(hit[0]['translation'],sc['hitPoint'])
        obj=(ROOT/'models'/f'{sc["name"]}.obj').read_text(encoding='utf-8')
        ov=np.array([[float(n) for n in line[2:].split()] for line in obj.splitlines() if line.startswith('v ')])
        close(ov,vs,tol=1e-6);assert len(re.findall(r'^f ',obj,re.M))==sum(len(f) for v,f in meshes)
        mtl=(ROOT/'models'/f'{sc["name"]}.mtl').read_text(encoding='utf-8')
        for section in mtl.split('newmtl ')[1:]:
            key=section.splitlines()[0];opacity=float(re.search(r'^d (.+)$',section,re.M).group(1));assert opacity==sc['materials'][key].get('opacity',1)
        records.append({'id':sc['id'],'parts':len(parts),'triangles':sum(len(f) for v,f in meshes),'dimensions':np.round(vs.max(0)-vs.min(0),4).tolist(),'checks':'PASS'})
    assert sorted(seen)==['B01']+[f'E{i:02d}' for i in range(1,9)]
    scenes=export_native.load_scenes()
    native=export_native.validate_outputs(scenes,[(ROOT/'native'/f'{s["name"]}.rbxmx').read_text(encoding='utf-8') for s in scenes],(ROOT/'native/Pupsters_Enemies_All.rbxmx').read_text(encoding='utf-8'))
    manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'));assert len(manifest['models'])==9
    viewer=(ROOT/'viewer/model-data.js').read_text(encoding='utf-8');viewer=json.loads(viewer.split('=',1)[1].removesuffix(';'))
    for s in scenes:
        assert len(viewer[s['id']]['parts'])==len(s['parts'])
        for p,op in zip(s['parts'],viewer[s['id']]['parts']):
            close(op['vertices'],mesh(p)[0],tol=1e-6);assert op['opacity']==s['materials'][p['material']]['opacity']
    links=0
    for p in ROOT.glob('*.html'):
        parser=Links();parser.feed(p.read_text(encoding='utf-8'))
        for link in parser.links:
            url=urlsplit(link)
            if url.scheme or not url.path:continue
            target=(p.parent/unquote(url.path)).resolve();assert target.is_relative_to(ROOT.resolve())
            if target.name!='validation-report.json':assert target.is_file(),(p.name,link)
            links+=1
    report={'result':'PASS','scope':'Structural file and geometry validation, not Studio/WebGL execution',
            'models':records,'nativeValidation':native,'localLinksChecked':links,
            'totalParts':sum(r['parts'] for r in records),'totalTriangles':sum(r['triangles'] for r in records),
            'checks':['Closed manifold primitives and positive volume','Finite geometry, contact graph, Y=0 ground','GLB/glTF buffer equality and world vertices/normals','OBJ positions and MTL alpha','Roblox XML and HitPoint transforms','Viewer data and local links'],
            'notRun':['Roblox Studio import/runtime','Browser WebGL rendering']}
    (ROOT/'docs/validation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'result':'PASS','models':len(records),'parts':report['totalParts'],'triangles':report['totalTriangles'],'links':links}))

if __name__=='__main__':run()
