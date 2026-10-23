"""Original Shiba geometry: native-primitive and rounded low-poly variants.
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

def scene(variant):
    parts=[]
    rounded=variant=='rounded'
    def add(name,group,kind,size,pos,mat='orange',rot=(0,0,0),**extra):
        parts.append(dict(name=name,group=group,type=kind,size=list(size),position=list(pos),rotation=list(rot),material=mat,**extra))
    def form(name,group,size,pos,mat='orange',rot=(0,0,0),exponent=.65):
        add(name,group,'super' if rounded else 'box',size,pos,mat,rot,exponent=exponent)
    form('ShortTorso','Body',(1.49,1.17,1.13),(0,.99,.60),exponent=.8)
    form('CreamChest','Body',(1.00,.76,.22),(0,.86,.02),'cream',exponent=.8)
    for side,x in [('L',-.67),('R',.67)]:
        for front,z in [('F',-.60),('B',.93)]:
            group='Leg'+front+side
            form(group+'_Leg',group,(.51,.68,.57),(x,.48,z),exponent=.65)
            form(group+'_Paw',group,(.55,.36,.64),(x,.18,z-.06),'cream',exponent=.65)
            if rounded:
                for j in [-1,1]:
                    add(group+'_Toe'+str(j),group,'sphere',(.027,.12,.035),(x+j*.10,.20,z-.385),'black')
    form('BigHead','Head',(2.16,1.57,1.49),(0,1.43,-.53),exponent=.48)
    for side,sign in [('L',-1),('R',1)]:
        if rounded:
            add('Ear'+side,'Head','prism',(.78,.88,.37),(sign*.78,2.36,-.48),'orange',(0,0,-sign*.15),tip=sign*.12)
            add('EarInner'+side,'Head','prism',(.42,.51,.065),(sign*.78,2.37,-.693),'cream',(0,0,-sign*.15),tip=sign*.065)
        else:
            add('Ear'+side,'Head','wedge',(.40,.85,.77),(sign*.76,2.28,-.48),'orange',(0,sign*math.pi/2,0))
            add('EarInner'+side,'Head','wedge',(.065,.50,.43),(sign*.78,2.34,-.713),'cream',(0,sign*math.pi/2,0))
        # Front surface is -Z; all facial features are raised solid geometry.
        form('Cheek'+side,'Head',(1.00,.58,.38),(sign*.43,1.015,-1.265),'cream',exponent=.8)
        add('EyeWhite'+side,'Head','sphere',(.40,.34,.14),(sign*.50,1.52,-1.283),'white')
        add('EyePupil'+side,'Head','sphere',(.20,.25,.10),(sign*.50+.035,1.49,-1.375),'black')
        add('EyeGlint'+side,'Head','sphere',(.055,.065,.035),(sign*.50+.012,1.55,-1.431),'white')
        # Heavy angled lids create the reference's cheeky expression.
        form('Eyelid'+side,'Head',(.43,.105,.10),(sign*.50,1.655 if sign<0 else 1.64,-1.38),'black',(0,0,.10 if sign<0 else -.24),exponent=.85)
        add('BrowMark'+side,'Head','sphere',(.25,.14,.08),(sign*.50,1.88 if sign<0 else 1.91,-1.295),'cream',(0,0,sign*.2))
    add('BigNose','Head','super' if rounded else 'sphere',(.49,.30,.26),(0,1.185,-1.52),'black',exponent=.7)
    form('MouthCenter','Head',(.055,.20,.065),(0,.975,-1.49),'black',exponent=.9)
    for sign in [-1,1]:
        form('Smile'+str(sign),'Head',(.32,.055,.065),(sign*.155,.89,-1.465),'black',(0,0,sign*.10),exponent=.9)
    # Compact curled tail: same curl in both variants, rounded tubes versus blocks.
    if rounded:
        add('TailCurl','Tail','torus_segment',(1,1,1),(0,1.97,1.035),'orange',radius=.43,tube=.20,start=-.8,end=3.1,steps=18)
        add('TailCreamTip','Tail','torus_segment',(1,1,1),(0,1.97,1.035),'cream',radius=.43,tube=.205,start=3.08,end=4.5,steps=8)
        add('TailRoot','Tail','super',(.42,.65,.43),(0,1.48,1.03),exponent=.8)
    else:
        add('TailRoot','Tail','box',(.35,.66,.35),(0,1.46,1.035))
        angles=np.linspace(-.8,4.5,8)
        points=[np.array([math.cos(a)*.43,math.sin(a)*.43+1.97,1.035]) for a in angles]
        for i,(a,b) in enumerate(zip(points,points[1:])):
            delta=b-a
            center=(a+b)/2
            center[2]-=i*.006  # Avoid overlapping coplanar faces in native Parts.
            add('TailCurl'+str(i),'Tail','box',(float(np.linalg.norm(delta))+.10,.33,.36),center,'cream' if i>=5 else 'orange',(0,0,math.atan2(delta[1],delta[0])))
    form('BoneShaft','MouthBone',(.78,.14,.17),(0,.82,-1.53),'bone',exponent=.8)
    for sign in [-1,1]:
        for end in [-1,1]:
            add('BoneKnuckle'+str(sign)+'_'+str(end),'MouthBone','sphere',(.25,.23,.23),(sign*.43,.82+end*.065,-1.53),'bone')
    return {'name':'Shiba_'+('Rounded' if rounded else 'Block'),'variant':variant,'units':'studs','up':'+Y','front':'-Z','mouth':[0,.82,-1.53], 'materials':MATERIALS,'parts':parts}

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
         'nodes':[{'name':sc['name'],'children':[]}],'meshes':[],'materials':[], 'bufferViews':[],'accessors':[]}
    buffer=bytearray();matids={}
    for k,m in MATERIALS.items():
        matids[k]=len(doc['materials'])
        doc['materials'].append({'name':k,'pbrMetallicRoughness':{'baseColorFactor':srgb_linear(m['color'])+[1],'metallicFactor':0,'roughnessFactor':.88},'doubleSided':False})
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
    pivots['Tail']=[0,1.48,1.03]
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
    for k,m in MATERIALS.items():mtl.extend([f'newmtl {k}','Kd '+' '.join(str(c) for c in m['color']),'Ks 0 0 0','Ns 8','d 1'])
    (ROOT/'models'/f'{stem}.mtl').write_text('\n'.join(mtl),encoding='utf-8')
    return doc

def main():
    previews={};reports=[]
    for variant in ['block','rounded']:
        sc=scene(variant)
        (ROOT/'scenes'/f'{variant}.json').write_text(json.dumps(sc,indent=2),encoding='utf-8')
        meshes=[mesh(p) for p in sc['parts']]
        export_gltf(sc,meshes)
        previews[variant]={'name':sc['name'],'parts':[dict(name=p['name'],group=p['group'],color=MATERIALS[p['material']]['color'],vertices=np.round(v,6).tolist(),faces=f.tolist()) for p,(v,f) in zip(sc['parts'],meshes)]}
        vertices=np.concatenate([v for v,f in meshes]);tris=sum(len(f) for v,f in meshes)
        reports.append({'variant':variant,'parts':len(meshes),'triangles':tris,'largestMeshTriangles':max(len(f) for v,f in meshes),'bounds':{'min':vertices.min(axis=0).tolist(),'max':vertices.max(axis=0).tolist()},'dimensions':np.ptp(vertices,axis=0).tolist(),'mouth':sc['mouth'],'headSize':[2.16,1.57,1.49],'torsoSize':[1.49,1.17,1.13]})
    (ROOT/'viewer/model-data.js').write_text('window.SHIBA_MODELS='+json.dumps(previews,separators=(',',':'))+';',encoding='utf-8')
    (ROOT/'docs/model-stats.json').write_text(json.dumps(reports,indent=2),encoding='utf-8')
    print(json.dumps(reports))

if __name__=='__main__':main()
