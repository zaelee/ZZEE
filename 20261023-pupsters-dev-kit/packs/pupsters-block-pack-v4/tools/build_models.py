"""Block-dog mesh primitives and glTF/GLB/OBJ export helpers.
No raster reference is painted or converted. Previews render the exported geometry.
"""
from pathlib import Path
import base64, json, math, struct
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
for folder in ('scenes', 'models', 'previews', 'docs', 'native', 'viewer'):
    (ROOT / folder).mkdir(exist_ok=True)
COLORS = {'orange': '#F5A039', 'cream': '#FFF0D5', 'black': '#251F21',
          'white': '#FFFCF4', 'bone': '#F8E0A8', 'inner': '#FFD6A7'}
MATERIALS = {k: {'color': [int(v[i:i+2], 16)/255 for i in (1,3,5)]} for k,v in COLORS.items()}

def rotation(e):
    x,y,z=e
    cx,sx,cy,sy,cz,sz=math.cos(x),math.sin(x),math.cos(y),math.sin(y),math.cos(z),math.sin(z)
    return np.array([[1,0,0],[0,cx,-sx],[0,sx,cx]]) @ np.array([[cy,0,sy],[0,1,0],[-sy,0,cy]]) @ np.array([[cz,-sz,0],[sz,cz,0],[0,0,1]])


def orient_outward(v,f):
    # All primitives are closed, so signed volume fixes their global winding.
    v=np.asarray(v,dtype=float);f=np.asarray(f,dtype=np.int32)
    a,b,c=v[f[:,0]],v[f[:,1]],v[f[:,2]]
    if np.einsum('ij,ij->i',a,np.cross(b,c)).sum()<0: f=f[:,[0,2,1]]
    return v,f

def mesh(p):
    kind=p['type']; v=[]; f=[]
    if kind=='box':
        v=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]
        f=[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[3,7,6],[3,6,2],[0,4,7],[0,7,3],[1,2,6],[1,6,5]]
        v=np.array(v)/2
    elif kind=='wedge':
        v=np.array([[-1,-1,-1],[1,-1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]])/2
        f=[[0,1,3],[0,3,2],[2,3,5],[2,5,4],[0,4,5],[0,5,1],[0,2,4],[1,5,3]]
    elif kind=='prism':
        tip=p.get('tip',0)/p['size'][0]
        points=[[-.5,-.5],[.5,-.5],[tip,.5]]
        v=[[x,y,z] for z in [-.5,.5] for x,y in points]
        f=[[0,2,1],[3,4,5],[0,1,4],[0,4,3],[1,2,5],[1,5,4],[2,0,3],[2,3,5]]
    elif kind in ('sphere','super'):
        n=16 if max(p['size'])>.65 else 12
        m=10 if max(p['size'])>.65 else 8
        exponent=p.get('exponent',1) if kind=='super' else 1
        sp=lambda a:math.copysign(abs(a)**exponent,a)
        v=[[0,-.5,0]]
        for j in range(1,m):
            lat=-math.pi/2+math.pi*j/m
            for i in range(n):
                lon=2*math.pi*i/n
                v.append([.5*sp(math.cos(lat))*sp(math.cos(lon)),.5*sp(math.sin(lat)),.5*sp(math.cos(lat))*sp(math.sin(lon))])
        top=len(v);v.append([0,.5,0])
        for i in range(n): f.append([0,1+(i+1)%n,1+i])
        for j in range(m-2):
            for i in range(n):
                a=1+j*n+i;b=1+j*n+(i+1)%n;c=a+n;d=b+n
                f.extend([[a,b,d],[a,d,c]])
        for i in range(n): f.append([top,1+(m-2)*n+i,1+(m-2)*n+(i+1)%n])
    elif kind=='torus_segment':
        n=p['steps'];m=8;r=p['radius'];tube=p['tube']
        for i in range(n+1):
            a=p['start']+(p['end']-p['start'])*i/n
            for j in range(m):
                b=2*math.pi*j/m
                v.append([(r+tube*math.cos(b))*math.cos(a),(r+tube*math.cos(b))*math.sin(a),tube*math.sin(b)])
        for i in range(n):
            for j in range(m):
                a=i*m+j;b=i*m+(j+1)%m;c=a+m;d=b+m
                f.extend([[a,b,d],[a,d,c]])
        for i,a in [(0,p['start']),(n,p['end'])]:
            cap=len(v);v.append([r*math.cos(a),r*math.sin(a),0])
            for j in range(m): f.append([cap,i*m+(j+1)%m,i*m+j] if i==0 else [cap,i*m+j,i*m+(j+1)%m])
    else: raise ValueError(kind)
    v,f=orient_outward(v,f)
    v=(v*np.array(p['size'])) @ rotation(p['rotation']).T + p['position']
    return v,f

def srgb_linear(c):
    c=np.array(c);return np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4).tolist()

def export_gltf(sc,meshes):
    doc={'asset':{'version':'2.0','generator':'PUPSTERS original procedural model'},'scene':0,'scenes':[{'nodes':[0]}],
         'nodes':[{'name':sc.get('displayName',sc['name']),'children':[]}],'meshes':[],'materials':[], 'bufferViews':[],'accessors':[]}
    buffer=bytearray();matids={}
    fx_materials={p['material'] for p in sc['parts'] if p['group']=='FX'}
    for k,m in sc['materials'].items():
        matids[k]=len(doc['materials'])
        doc['materials'].append({'name':k,'pbrMetallicRoughness':{'baseColorFactor':srgb_linear(m['color'])+[1],'metallicFactor':0,'roughnessFactor':.88},'doubleSided':False})
        if k in fx_materials:doc['materials'][-1]['emissiveFactor']=srgb_linear(m['color'])
    def accessor(data,ctype,typ,target):
        nonlocal buffer
        while len(buffer)%4:buffer.append(0)
        raw=data.tobytes();idx=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':len(buffer),'byteLength':len(raw),'target':target});buffer.extend(raw)
        entry={'bufferView':idx,'componentType':ctype,'count':len(data),'type':typ}
        if typ=='VEC3':entry.update(min=data.min(axis=0).tolist(),max=data.max(axis=0).tolist())
        doc['accessors'].append(entry);return len(doc['accessors'])-1
    groups={}
    pivots={}
    for p in sc['parts']:pivots.setdefault(p['group'],p['position'])
    pivots.update(sc.get('pivots',{}))
    for p,(v,f) in zip(sc['parts'],meshes):
        # Flat normals preserve low-poly facets and hard block edges.
        pos=(v[f].reshape(-1,3)-pivots[p['group']]).astype('<f4')
        normals=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
        normals/=np.linalg.norm(normals,axis=1)[:,None]
        normal=np.repeat(normals,3,axis=0).astype('<f4')
        idx=np.arange(len(pos),dtype='<u2' if len(pos)<65536 else '<u4')
        primitive={'attributes':{'POSITION':accessor(pos,5126,'VEC3',34962),'NORMAL':accessor(normal,5126,'VEC3',34962)},'indices':accessor(idx,5123 if idx.dtype.itemsize==2 else 5125,'SCALAR',34963),'material':matids[p['material']]}
        mi=len(doc['meshes']);doc['meshes'].append({'name':p['name']+'_Mesh','primitives':[primitive]})
        if p['group'] not in groups:
            groups[p['group']]=len(doc['nodes']);doc['nodes'].append({'name':p['group'],'translation':list(pivots[p['group']]),'children':[]});doc['nodes'][0]['children'].append(groups[p['group']])
        node=len(doc['nodes']);doc['nodes'].append({'name':p['name'],'mesh':mi});doc['nodes'][groups[p['group']]]['children'].append(node)
    doc['nodes'].append({'name':'Mouth_Att','translation':(np.array(sc['mouth'])-pivots['Head']).tolist()});doc['nodes'][groups['Head']]['children'].append(len(doc['nodes'])-1)
    stem=sc['name']
    doc['buffers']=[{'byteLength':len(buffer),'uri':'data:application/octet-stream;base64,'+base64.b64encode(buffer).decode()}]
    (ROOT/'models'/f'{stem}.gltf').write_text(json.dumps(doc,separators=(',',':')),encoding='utf-8')
    doc['buffers'][0].pop('uri')
    rawjson=json.dumps(doc,separators=(',',':')).encode();rawjson+=b' '*((-len(rawjson))%4)
    binary=bytes(buffer)+b'\0'*((-len(buffer))%4)
    glb=struct.pack('<4sII',b'glTF',2,12+8+len(rawjson)+8+len(binary))+struct.pack('<I4s',len(rawjson),b'JSON')+rawjson+struct.pack('<I4s',len(binary),b'BIN\0')+binary
    (ROOT/'models'/f'{stem}.glb').write_bytes(glb)
    # OBJ + MTL is a simple editable fallback for other modeling tools.
    obj=[f'mtllib {stem}.mtl'];offset=1
    for p,(v,f) in zip(sc['parts'],meshes):
        obj.extend([f'o {p["name"]}',f'usemtl {p["material"]}'])
        obj.extend('v '+' '.join(f'{n:.6f}' for n in row) for row in v)
        obj.extend('f '+' '.join(str(int(n)+offset) for n in row) for row in f);offset+=len(v)
    (ROOT/'models'/f'{stem}.obj').write_text('\n'.join(obj),encoding='utf-8')
    mtl=[]
    for k,m in sc['materials'].items():mtl.extend([f'newmtl {k}','Kd '+' '.join(str(c) for c in m['color']),'Ks 0 0 0','Ns 8','d 1'])
    (ROOT/'models'/f'{stem}.mtl').write_text('\n'.join(mtl),encoding='utf-8')
    return doc
