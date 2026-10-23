"""One sampled source for 27 enemy motions: GLB, browser and Roblox use identical poses."""
import copy,json,math,struct
import numpy as np
from build_models import ROOT,mesh,rotation,srgb_linear

FPS=30
DURATIONS={'move':1.2,'hit':.6,'death':1.6}
LABELS={'move':'이동','hit':'피격','death':'사망'}
DESCRIPTIONS={
'E01':['짧은 두 발로 통통 걸으며 몸을 좌우로 기울여요.','뒤로 움찔하고 눈을 찡그린 뒤 돌아와요.','옆으로 데굴 넘어지고 작아지며 사라져요.'],
'E02':['네모 바퀴가 돌 때 차체도 작게 들썩여요.','차체가 뒤로 덜컥 밀렸다가 돌아와요.','차체가 옆으로 넘어지고 바퀴가 헛돌아요.'],
'E03':['큰 발로 느릿하게 쿵쿵 걷고 벽돌 층이 흔들려요.','무게감 있게 밀리며 윗벽돌이 덜컹해요.','벽돌 세 층이 양옆으로 무너져 바닥에 내려앉아요.'],
'E04':['장갑을 두른 몸으로 짧게 좌우로 걸어요.','장갑이 덜컥 떨리고 몸이 뒤로 젖혀져요.','단단한 몸이 옆으로 쓰러져 잠시 멈췄다 사라져요.'],
'E05':['세 블록이 서로 엇박자로 흔들리며 걸어요.','맞은 충격이 아래에서 위로 전달돼요.','세 얼굴 블록이 제각각 굴러 떨어져요.'],
'E06':['짧은 발로 걷고 렌치 팔이 까딱거려요.','렌치가 흔들리며 뒤로 움찔해요.','렌치 팔이 축 늘어지고 몸이 옆으로 쓰러져요.'],
'E07':['투명 몸통을 유지하며 네 발로 살금살금 걸어요.','몸통과 테두리가 함께 찌그러졌다 돌아와요.','속이 비치는 몸통이 납작해진 뒤 작아져요.'],
'E08':['네 바퀴가 굴러가고 짐칸의 꼬마들이 통통 튀어요.','수레가 덜컹하고 안의 꼬마들이 위로 튀어요.','수레가 기울고 꼬마 셋이 밖으로 떨어져요.'],
'B01':['네 다리를 번갈아 내딛고 머리와 꼬리가 묵직하게 흔들려요.','큰 머리가 뒤로 젖혀지고 등판과 꼬리가 떨려요.','머리를 푹 숙이고 몸을 옆으로 쿵 내려놓아요.']}

def ease(a,b,t):
    u=float(np.clip((t-a)/(b-a),0,1));return u*u*(3-2*u)
def quat(r):
    tr=np.trace(r)
    if tr>0:
        s=math.sqrt(tr+1)*2;q=[(r[2,1]-r[1,2])/s,(r[0,2]-r[2,0])/s,(r[1,0]-r[0,1])/s,s/4]
    else:
        i=int(np.argmax(np.diag(r)));j=(i+1)%3;k=(i+2)%3
        s=math.sqrt(1+r[i,i]-r[j,j]-r[k,k])*2;q=[0.,0.,0.,0.]
        q[i]=s/4;q[j]=(r[j,i]+r[i,j])/s;q[k]=(r[k,i]+r[i,k])/s;q[3]=(r[k,j]-r[j,k])/s
    return np.asarray(q)/np.linalg.norm(q)
def qmatrix(q):
    x,y,z,w=q
    return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
def rest(sc):
    return {p['name']:[np.array(p['position'],float),rotation(p['rotation']),np.ones(3),True] for p in sc['parts']}
def select(sc,groups):return [p['name'] for p in sc['parts'] if p['group'] in groups]
def move(states,names,pivot=(0,0,0),angles=(0,0,0),offset=(0,0,0),scale=(1,1,1)):
    r=rotation(angles);pivot=np.array(pivot);offset=np.array(offset);scale=np.array(scale)
    for name in names:
        s=states[name];s[0]=r@((s[0]-pivot)*scale)+pivot+offset;s[1]=r@s[1];s[2]*=scale
def world(part,state):return (np.asarray(part['vertices'])*state[2])@state[1].T+state[0]
def ground(parts,states,names=None,force=False,height=0):
    selected=[p for p in parts if names is None or p['name'] in names]
    y=min(world(p,states[p['name']])[:,1].min() for p in selected)
    dy=height-y if force else max(0,height-y)
    for p in selected:states[p['name']][0][1]+=dy
def cargo_sets(sc):
    return [[p['name'] for p in sc['parts'] if p['name'].startswith(prefix)] for prefix in ('BotLeft','BotRight','BotRear')]

def pose_move(sc,parts,t):
    s=rest(sc);id=sc['id'];theta=t/DURATIONS['move']*2*math.pi;wave=math.sin(theta)
    feet=select(sc,['Feet','Legs']);body=[p['name'] for p in sc['parts'] if p['name'] not in feet]
    if id in ('E02','E08'):
        wheels=[p for p in sc['parts'] if p['group']=='Wheels' and p['name'].startswith('Wheel')]
        lift=-math.inf
        for p in wheels:
            names=[p['name']]
            if id=='E02':names.append('Hub'+p['name'][-1])
            move(s,names,p['position'],[theta,0,0])
            lift=max(lift,.5*(p['size'][1]*abs(math.cos(theta))+p['size'][2]*abs(math.sin(theta)))-p['position'][1])
        move(s,list(s),offset=[0,lift,0])
        if id=='E08':
            for j,names in enumerate(cargo_sets(sc)):
                bounce=.10*math.sin(theta*(1+j*.5))**2
                # Integer half-wave frequencies close cleanly at the loop boundary.
                move(s,names,offset=[0,bounce,0])
    else:
        amp=.11 if id not in ('E03','E04','B01') else .065
        roll=.045 if id not in ('E03','E04','B01') else .025
        move(s,body,pivot=[0,.35,0],angles=[0,0,roll*wave],offset=[0,.025*math.sin(theta)**2,0])
        for p in sc['parts']:
            if p['name'] not in feet:continue
            phase=1 if p['position'][0]<0 else -1
            if id=='E07' and p['position'][2]>0:phase*=-1
            if id=='B01' and 'Rear' in p['name']:phase*=-1
            stride=phase*wave;lift=amp*max(0,stride)
            move(s,[p['name']],offset=[0,lift,-.14*stride])
        if id=='E05':
            for j,g in enumerate(['SegmentBottom','SegmentMiddle','SegmentTop']):
                names=select(sc,[g]);pivot=next(p['position'] for p in sc['parts'] if p['group']==g and p['type']=='box')
                wobble=(math.sin(theta-j*.65)-math.sin(-j*.65))*.045*(j+1)
                move(s,names,pivot,angles=[0,0,wobble],offset=[wobble*.25,0,0])
        if id=='E06':
            pivot=next(p['position'] for p in sc['parts'] if p['name']=='ToolShoulder')
            move(s,select(sc,['Tool']),pivot,angles=[.18*wave,0,.10*wave])
        if id=='B01':
            move(s,select(sc,['Head','Face']),[0,1.3,-.45],angles=[.055*wave,0,0])
            move(s,select(sc,['Tail']),[0,1.12,1.1],angles=[0,.16*wave,0])
    ground(parts,s)
    return s

def pose_hit(sc,parts,t):
    s=rest(sc);id=sc['id'];p=ease(0,.10,t)*(1-ease(.12,.6,t));shake=math.sin(t*55)*p
    amount=.10 if id in ('E03','E04','B01') else .18
    move(s,list(s),pivot=[0,.15,0],angles=[amount*p,0,.025*shake],offset=[0,.025*p,.20*p],scale=[1+.035*p,1-.08*p,1+.025*p])
    if id=='E03':
        move(s,['BrickTop','DotEyeL','DotEyeR'],[0,1.6,0],angles=[0,0,.07*shake])
    elif id=='E04':
        move(s,select(sc,['Armor']),[0,1,0],angles=[0,0,.025*shake])
    elif id=='E05':
        for j,g in enumerate(['SegmentBottom','SegmentMiddle','SegmentTop']):
            pulse=ease(.025*j,.1+.025*j,t)*(1-ease(.18+.03*j,.6,t))
            pivot=next(a['position'] for a in sc['parts'] if a['group']==g and a['type']=='box')
            move(s,select(sc,[g]),pivot,angles=[-.10*pulse,0,.13*math.sin(t*32-j)*pulse])
    elif id=='E06':
        pivot=next(a['position'] for a in sc['parts'] if a['name']=='ToolShoulder')
        move(s,select(sc,['Tool']),pivot,angles=[0,0,.28*shake])
    elif id=='E07':
        move(s,list(s),scale=[1+.14*p,1-.13*p,1+.06*p])
    elif id=='E08':
        for j,names in enumerate(cargo_sets(sc)):
            pulse=ease(.025*j,.13+.025*j,t)*(1-ease(.18,.6,t))
            move(s,names,offset=[0,.25*pulse,0])
    elif id=='B01':
        move(s,select(sc,['Head','Face']),[0,1.3,-.45],angles=[.10*p,0,0])
        move(s,select(sc,['Back']),[0,1.7,.5],angles=[0,0,.04*shake])
        move(s,select(sc,['Tail']),[0,1.12,1.1],angles=[0,.12*shake,0])
    for a in sc['parts']:
        if 'Eye' in a['name']:s[a['name']][2][1]*=1-.65*p
    ground(parts,s)
    return s

def drop_cluster(sc,parts,s,names,t,spread,angle,start=.08,end=.82,arc=.22,pitch=.15):
    u=ease(start,end,t)
    source=[p for p in parts if p['name'] in names]
    base=np.concatenate([world(p,s[p['name']]) for p in source]);pivot=(base.min(0)+base.max(0))/2
    original_bottom=base[:,1].min()
    move(s,names,pivot,angles=[pitch*u,0,angle*u],offset=[spread[0]*u,0,spread[1]*u])
    desired=original_bottom*(1-u)+arc*math.sin(math.pi*u)
    ground(parts,s,names,force=True,height=desired)

def pose_death(sc,parts,t):
    s=rest(sc);id=sc['id'];u=ease(.08,.80,t)
    if id in ('E03','E05'):
        if id=='E05':
            clusters=[select(sc,['SegmentBottom','Feet']),select(sc,['SegmentMiddle']),select(sc,['SegmentTop'])]
        else:
            clusters=[['BrickBottom','HeavyFootL','HeavyFootR'],['BrickMiddle','LowerBrickSeam'],['BrickTop','UpperBrickSeam','DotEyeL','DotEyeR']]
        spreads=[(-1.25,.35),(1.25,.50),(.03,-1.15)] if id=='E03' else [(-.9,.25),(.9,.35),(0,-.9)]
        for j,names in enumerate(clusters):drop_cluster(sc,parts,s,names,t,spreads[j],[-.35,.65,-.65][j],.06+j*.035,.74+j*.05)
    elif id=='E08':
        cargo=set(sum(cargo_sets(sc),[]));cart=[p['name'] for p in sc['parts'] if p['name'] not in cargo]
        move(s,cart,pivot=[0,.6,0],angles=[.08*u,0,-.22*u])
        ground(parts,s,cart,force=True)
        for j,names in enumerate(cargo_sets(sc)):
            drop_cluster(sc,parts,s,names,t,[(-1.1,-1.0),(1.1,-.9),(0,-2.2)][j],[-.6,.7,.45][j],.12,.85+j*.05,arc=.85)
    elif id=='E07':
        move(s,list(s),scale=[1+.20*u,1-.83*u,1+.12*u],offset=[.12*math.sin(t*50)*u*(1-u),0,0])
        ground(parts,s,force=True)
    elif id=='E06':
        tool=select(sc,['Tool']);body=[n for n in s if n not in tool]
        move(s,body,[0,1,0],angles=[.12*math.sin(math.pi*u),0,-math.pi/2*u],offset=[.35*u,0,.18*u])
        ground(parts,s,body,force=True,height=.05*math.sin(math.pi*u))
        drop_cluster(sc,parts,s,tool,t,[-.35,-.45],-.30,.12,.84,arc=.20,pitch=math.pi/2)
    else:
        if id=='E02':
            for side in ['L','R']:
                pivot=next(a['position'] for a in sc['parts'] if a['name']=='Wheel'+side)
                move(s,['Wheel'+side,'Hub'+side],pivot,angles=[math.pi*3*u,0,0])
        pivot=[0,1.0,0]
        if id=='B01':angles=[-.20*math.sin(math.pi*u),0,-1.30*u]
        else:angles=[.12*math.sin(math.pi*u),0,(1 if id=='E01' else -1)*math.pi/2*u]
        move(s,list(s),pivot,angles,offset=[.35*u,0,.18*u])
        ground(parts,s,force=True,height=.08*math.sin(math.pi*u))
    # Readable fallen pose first, then a uniform scale-out instead of unsupported
    # glTF material animation. The transparent enemy retains its alpha throughout.
    shrink=1-ease(1.02,1.55,t)
    if shrink<1:
        points=np.concatenate([world(p,s[p['name']]) for p in parts]);center=(points.min(0)+points.max(0))/2;center[1]=0
        move(s,list(s),center,scale=[max(.001,shrink)]*3)
    if t>=1.6-1e-7:
        for state in s.values():state[3]=False
    ground(parts,s)
    return s

def build(sc):
    parts=[]
    for p in sc['parts']:
        local=copy.deepcopy(p);local.update(position=[0,0,0],rotation=[0,0,0]);v,f=mesh(local)
        mat=sc['materials'][p['material']]
        parts.append(dict(name=p['name'],group=p['group'],type=p['type'],size=p['size'],position=p['position'],quaternion=np.round(quat(rotation(p['rotation'])),7).tolist(),color=mat['color'],opacity=mat.get('opacity',1),vertices=np.round(v,7).tolist(),faces=f.tolist()))
    clips={};bounds=[]
    for index,(kind,duration) in enumerate(DURATIONS.items()):
        frames=[];pose={'move':pose_move,'hit':pose_hit,'death':pose_death}[kind]
        for fi in range(round(duration*FPS)+1):
            t=fi/FPS;s=pose(sc,parts,t);rows=[]
            for p in parts:
                pos,rot,scale,visible=s[p['name']];q=quat(rot)
                if frames and np.dot(q,frames[-1]['transforms'][len(rows)][3:7])<0:q=-q
                rows.append(np.round(np.r_[pos,q,scale,int(visible)],7).tolist())
                if visible:bounds.append(world(p,s[p['name']]))
            frames.append({'time':round(t,7),'transforms':rows})
        clips[kind]=dict(name=LABELS[kind],description=DESCRIPTIONS[sc['id']][index],duration=duration,fps=FPS,loop=kind=='move',frames=frames)
    points=np.concatenate(bounds);lo=points.min(0);hi=points.max(0)
    width=max(4.4, float(np.linalg.norm((hi-lo)[[0,2]])*1.18),float((hi-lo)[1]*1.5))
    target=((lo+hi)/2).tolist()
    return dict(id=sc['id'],name=sc['name'],displayName=sc['displayName'],feature=sc['feature'],units='studs',front='-Z',up='+Y',parts=parts,clips=clips,viewWidth=round(width,4),target=target,bounds=[lo.tolist(),hi.tolist()])

def export_glb(model):
    doc={'asset':{'version':'2.0','generator':'Pupsters sampled enemy motions'},'scene':0,'scenes':[{'nodes':[0]}],
         'nodes':[{'name':model['displayName'],'children':[]}],'meshes':[],'materials':[],'bufferViews':[],'accessors':[],'animations':[]}
    data=bytearray()
    def acc(values,typ,target=None):
        arr=np.asarray(values,dtype='<u2' if typ=='INDEX' else '<f4')
        while len(data)%4:data.append(0)
        view={'buffer':0,'byteOffset':len(data),'byteLength':arr.nbytes}
        if target:view['target']=target
        doc['bufferViews'].append(view);data.extend(arr.tobytes())
        entry={'bufferView':len(doc['bufferViews'])-1,'componentType':5123 if typ=='INDEX' else 5126,'count':len(arr),'type':'SCALAR' if typ=='INDEX' else typ}
        if typ in ('VEC3','SCALAR'):
            entry.update(min=np.atleast_1d(arr.min(0)).tolist(),max=np.atleast_1d(arr.max(0)).tolist())
        doc['accessors'].append(entry);return len(doc['accessors'])-1
    for i,p in enumerate(model['parts']):
        v=np.array(p['vertices']);f=np.array(p['faces']);pos=v[f].reshape(-1,3)
        norm=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]]);norm/=np.linalg.norm(norm,axis=1)[:,None]
        mat={'name':p['name'],'pbrMetallicRoughness':{'baseColorFactor':srgb_linear(p['color'])+[p['opacity']],'metallicFactor':0,'roughnessFactor':.88}}
        if p['opacity']<1:mat['alphaMode']='BLEND'
        doc['materials'].append(mat)
        prim={'attributes':{'POSITION':acc(pos,'VEC3',34962),'NORMAL':acc(np.repeat(norm,3,axis=0),'VEC3',34962)},'indices':acc(np.arange(len(pos)),'INDEX',34963),'material':i}
        doc['meshes'].append({'name':p['name'],'primitives':[prim]})
        doc['nodes'].append({'name':p['name'],'mesh':i,'translation':p['position'],'rotation':p['quaternion'],'scale':[1,1,1]});doc['nodes'][0]['children'].append(i+1)
    for kind,clip in model['clips'].items():
        times=acc([f['time'] for f in clip['frames']],'SCALAR');rows=np.array([f['transforms'] for f in clip['frames']])
        anim={'name':kind.capitalize(),'samplers':[],'channels':[],'extras':{'loop':clip['loop'],'duration':clip['duration']}}
        for i,p in enumerate(model['parts']):
            a=rows[:,i,:];scale=a[:,7:10]*np.where(a[:,10:11]>0,1,.00001)
            for path,values,typ in [('translation',a[:,:3],'VEC3'),('rotation',a[:,3:7],'VEC4'),('scale',scale,'VEC3')]:
                # Include constant channels so switching between clips also resets
                # all transforms left behind by a preceding death or hit.
                out=acc(values,typ);si=len(anim['samplers']);anim['samplers'].append({'input':times,'output':out,'interpolation':'LINEAR'})
                anim['channels'].append({'sampler':si,'target':{'node':i+1,'path':path}})
        doc['animations'].append(anim)
    doc['buffers']=[{'byteLength':len(data)}]
    raw=json.dumps(doc,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);binary=bytes(data)+b'\0'*((-len(data))%4)
    out=struct.pack('<4sII',b'glTF',2,12+8+len(raw)+8+len(binary))+struct.pack('<I4s',len(raw),b'JSON')+raw+struct.pack('<I4s',len(binary),b'BIN\0')+binary
    (ROOT/'animations'/f'{model["id"]}-motions.glb').write_bytes(out)

def main():
    models={}
    for path in sorted((ROOT/'scenes').glob('*.json'),key=lambda p:(p.stem.startswith('B'),p.stem)):
        sc=json.loads(path.read_text(encoding='utf-8'));model=build(sc);models[sc['id']]=model;export_glb(model)
        (ROOT/'animations'/f'{sc["id"]}.json').write_text(json.dumps(model,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
        print(sc['id'],len(model['parts']),'parts / Move Hit Death',flush=True)
    (ROOT/'viewer/motion-data.js').write_text('window.PUPSTERS_MOTIONS='+json.dumps(models,ensure_ascii=False,separators=(',',':'))+';',encoding='utf-8')
    manifest={'title':'사고멍치 몹 이동·피격·사망 모션','fps':FPS,'clipCount':27,'modelCount':9,'inPlaceMovement':True,'studioVerified':False,'browserVerified':False,
        'models':[dict(id=m['id'],name=m['displayName'],source=f'animations/{m["id"]}.json',glb=f'animations/{m["id"]}-motions.glb',roblox=f'roblox/{m["id"]}-motions.rbxmx',clips={k:{a:c[a] for a in ('name','description','duration','loop')} for k,c in m['clips'].items()}) for m in models.values()]}
    (ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
if __name__=='__main__':main()
