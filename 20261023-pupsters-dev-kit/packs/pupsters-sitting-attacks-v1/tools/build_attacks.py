"""Sample six seated attacks once for the viewer, animated GLB and Roblox player."""
from pathlib import Path
import copy,json,math,struct,base64
import numpy as np
from build_models import ROOT,mesh,rotation,srgb_linear

FPS=30; DURATION=2.0; RELEASE=.6
DESCRIPTIONS={
'D01':'뼈를 문 채 고개를 젖혔다가, 앞으로 까딱하며 퉤! 뼈를 뱉어요.',
'D02':'볼에 공기를 빵빵하게 모은 뒤, 고개 반동과 함께 공기 충격파를 뿜어요.',
'D03':'숨을 들이마시고 고개를 내밀어, 입에서 얼음 알갱이와 냉기를 길게 내뿜어요.',
'D04':'침을 모으며 고개를 갸웃하고, 끈적한 침방울을 앞으로 퉤! 튕겨요.',
'D05':'몸을 작게 부르르 떨며 충전하고, 머리 중앙 번개에서 전기를 찌리릭 뻗어요.',
'D06':'고개를 세 번 까딱하며 왕! 왕! 왕! 왕관이 덜렁이고 응원 파동이 퍼져요.'}

def ease(a,b,t):
    u=np.clip((t-a)/(b-a),0,1);return float(u*u*(3-2*u))
def pulse(t,c,w):
    return max(0.,1-abs(t-c)/w)**2
def charge(t):
    return ease(.12,.52,t)*(1-ease(.55,.68,t))
def release_power(t):
    return ease(.56,.64,t)*(1-ease(.72,1.38,t))
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
def head_motion(sc,t):
    h=next(p for p in sc['parts'] if p['name'] in ('BigHead','CoreHead','NarrowHead'))
    pivot=np.array([0,h['position'][1]-.47,h['position'][2]+.38])
    c=charge(t);r=release_power(t);b=pulse(t,.72,.22)
    rx=.18*c-.18*r+.08*b;ry=0;rz=0
    offset=np.array([0,-.045*c+.025*b,.14*c-.19*r+.07*b])
    if sc['id']=='D03':
        rx=.14*c-.09*r;offset=np.array([0,.035*c,.10*c-.20*r])
    if sc['id']=='D04':
        ry=.17*c;rz=-.07*c;rx=.16*c-.22*r
    if sc['id']=='D05':
        shake=math.sin(t*68)*(c*.035+r*.05)
        rx=.08*c-.08*r;rz=shake;offset=np.array([shake,-.06*c,.025*c])
    if sc['id']=='D06':
        b=sum(pulse(t,x,.11) for x in (.64,.86,1.08))
        rx=.12*c-.17*b;rz=.018*math.sin(t*35)*b
        offset=np.array([0,.02*c-.025*b,.07*c-.10*b])
    rmat=rotation([rx,ry,rz])
    return rmat,pivot,offset
def head_point(sc,t,point):
    r,p,o=head_motion(sc,t);return r@(np.asarray(point)-p)+p+o

def make_clip(sc):
    parts=[]; source={}
    for p in sc['parts']:
        local=copy.deepcopy(p);local['position']=[0,0,0];local['rotation']=[0,0,0]
        vertices,faces=mesh(local)
        part=dict(name=p['name'],group=p['group'],type=p['type'],size=p['size'],color=sc['materials'][p['material']]['color'],emissive=p['group']=='FX',position=p['position'],quaternion=quat(rotation(p['rotation'])).tolist(),isEffect=False,vertices=np.round(vertices,6).tolist(),faces=faces.tolist())
        parts.append(part);source[p['name']]=p
    def effect(name,size,color,emissive=True,typ='box'):
        local=dict(name=name,group='AttackFX',type=typ,size=size,position=[0,0,0],rotation=[0,0,0])
        v,f=mesh(local)
        parts.append(dict(name=name,group='AttackFX',type=typ,size=size,color=color,emissive=emissive,position=[0,0,0],quaternion=[0,0,0,1],isEffect=True,vertices=np.round(v,6).tolist(),faces=f.tolist()))
    effect('AttackMouth',[.27,.20,.045],[.10,.085,.09],False)
    id=sc['id']
    if id=='D01':
        for p in sc['parts']:
            if p['group']=='MouthBone':effect('Shot_'+p['name'],p['size'],sc['materials'][p['material']]['color'],False)
    if id in ['D02','D06']:
        for ring in range(3):
            for edge in range(4):effect(f'Wave{ring}_{edge}',[1,.07,.07],[1,.97,.86] if id=='D02' else [1,.76,.24])
    if id=='D03':
        for i in range(12):effect(f'Ice{i}',[.16,.16,.20],[.55,.91,1] if i%2 else [.84,.99,1])
    if id=='D04':
        for i in range(5):effect(f'Spit{i}',[.29,.24,.30] if i==0 else [.12,.12,.16],[.33,.80,.90],False)
    if id=='D05':
        for i in range(5):effect(f'Zap{i}',[1,.075,.075],[1,.90,.08])
    if id=='D06':
        for edge in range(4):effect(f'Support{edge}',[1,.045,.07],[.50,.95,.75])
    frames=[]
    for frame in range(round(DURATION*FPS)+1):
        t=frame/FPS;c=charge(t);r=release_power(t);headR,hp,ho=head_motion(sc,t)
        states={}
        for part in parts:
            if part['isEffect']:states[part['name']]=[np.zeros(3),np.eye(3),np.ones(3),False];continue
            p=source[part['name']];pos=np.array(p['position'],float);rot=rotation(p['rotation']);scale=np.ones(3);visible=True
            if p['group'] in ['Head','MouthBone','FX']:
                pos=headR@(pos-hp)+hp+ho;rot=headR@rot
            if p['group']=='Body':
                scale=np.array([1+.025*c,1-.025*c,1+.02*c]);pos[1]*=scale[1]
            if p['group'] in ['LegFL','LegFR'] and p['name'].endswith('_Leg'):
                scale[1]=1-.035*c
                pos[1]=.15+(pos[1]-.15)*scale[1]
            if id=='D01' and p['group']=='MouthBone':
                visible=t<RELEASE or t>=1.62
            if id=='D02' and p['name'].startswith('PuffedCheek'):
                scale=[1+.32*c,1+.24*c,1+.28*c]
                pos+=headR@np.array([math.copysign(.045*c,p['position'][0]),0,-.035*c])
            if id=='D04' and ('Drool' in p['name'] or 'Saliva' in p['name']):
                scale=[1,1+.65*c,1]
            if id=='D05' and p['group']=='FX':
                center=np.mean([p2['position'] for p2 in sc['parts'] if p2['group']=='FX'],axis=0)
                sca=1+.40*c+.28*r;pos=head_point(sc,t,center+(np.array(p['position'])-center)*sca);scale=np.ones(3)*sca
            if id=='D06' and p['name'].startswith('Crown'):
                b=sum(pulse(t,x,.16) for x in (.70,.92,1.14))
                pivot=np.array([0,2.48,-.20]);roll=rotation([0,0,.09*math.sin(t*27)*b])
                pos=head_point(sc,t,roll@(np.array(p['position'])-pivot)+pivot);rot=headR@roll@rotation(p['rotation'])
            mouth_open=sum(pulse(t,x,.11) for x in (.64,.86,1.08)) if id=='D06' else r
            if id!='D05' and p['name'] in ['SmallMouth','MouthCenter'] and mouth_open>.035:
                visible=False
            states[p['name']]=[pos,rot,np.array(scale),visible]
        def fx(name,pos,rot=None,scale=None,visible=True):
            states[name]=[np.asarray(pos),np.eye(3) if rot is None else rot,np.ones(3) if scale is None else np.asarray(scale),bool(visible)]
        mouth=np.array(sc['mouth'])
        bark=sum(pulse(t,x,.11) for x in (.64,.86,1.08))
        open_amount=bark if id=='D06' else r
        if id!='D05':
            fx('AttackMouth',head_point(sc,t,mouth+[0,.015,-.045]),headR,[1,max(.12,open_amount),1],open_amount>.035)
        if id=='D01':
            u=(t-RELEASE)/.72;origin=head_point(sc,RELEASE,sc['mouth']);hr,_,_=head_motion(sc,RELEASE)
            if 0<=u<1:
                travel=np.array([0,.22*math.sin(u*math.pi),-2.45*u])
                spin=rotation([0,0,-u*math.pi*1.5])
                for p in sc['parts']:
                    if p['group']=='MouthBone':
                        local=np.array(p['position'])-mouth
                        fx('Shot_'+p['name'],origin+travel+hr@spin@local,hr@spin@rotation(p['rotation']))
        if id in ['D02','D06']:
            for ring in range(3):
                start=RELEASE+ring*(.095 if id=='D02' else .22);u=(t-start)/(.64 if id=='D02' else .47)
                if 0<=u<1:
                    origin=head_point(sc,start,mouth);center=origin+[0,0,-2.25*u];radius=.14+.54*u
                    for edge in range(4):
                        vertical=edge%2==1
                        delta=([0,radius,0] if edge==0 else [radius,0,0] if edge==1 else [0,-radius,0] if edge==2 else [-radius,0,0])
                        fx(f'Wave{ring}_{edge}',center+delta,rotation([0,0,math.pi/2 if vertical else 0]),[2*radius,1-u*.6,1])
        if id=='D03':
            for i in range(12):
                start=RELEASE+i*.045;u=(t-start)/.56
                if 0<=u<1:
                    origin=head_point(sc,start,mouth);spread=.03+.40*u
                    offset=np.array([math.sin(i*2.4)*spread,math.cos(i*2.1)*spread*.65,-2.5*u])
                    fx(f'Ice{i}',origin+offset,rotation([u*1.8,i*.73,u*2]),np.ones(3)*(.5+1.0*u))
        if id=='D04':
            for i in range(5):
                start=RELEASE+i*.055;u=(t-start)/.72
                if 0<=u<1:
                    origin=head_point(sc,start,mouth)
                    delta=[math.sin(i*2)*.12*u,.35*math.sin(u*math.pi)-.25*u,-2.35*u]
                    fx(f'Spit{i}',origin+delta,rotation([u*.7,0,u*.4]),[1+.13*math.sin(u*12),1,.8+.35*u])
        if id=='D05' and .61<=t<1.13:
            center=np.mean([p['position'] for p in sc['parts'] if p['group']=='FX'],axis=0);start=head_point(sc,t,center)
            reach=min(1,(t-.61)/.12);end=start+np.array([.12*math.sin(t*65),-1.8,-2.9])*reach
            points=[start+(end-start)*u+np.array([(.20 if i%2 else -.20)*reach if i not in [0,5] else 0,0,0]) for i,u in enumerate(np.linspace(0,1,6))]
            for i,(a,b) in enumerate(zip(points,points[1:])):
                dx=b-a;length=np.linalg.norm(dx)
                if length<.001:continue
                x=dx/length;z=np.cross(x,[0,1,0]);z/=np.linalg.norm(z);y=np.cross(z,x);rot=np.column_stack([x,y,z])
                fx(f'Zap{i}',(a+b)/2,rot,[length,.7+.3*math.sin(t*90+i)**2,1])
        if id=='D06' and .61<=t<1.42:
            u=(t-.61)/.81;radius=.75+1.15*u;center=np.array([0,.035,.20])
            for edge in range(4):
                vertical=edge%2==1
                delta=([0,0,radius] if edge==0 else [radius,0,0] if edge==1 else [0,0,-radius] if edge==2 else [-radius,0,0])
                fx(f'Support{edge}',center+delta,rotation([0,math.pi/2 if vertical else 0,0]),[2*radius,1,max(.12,1-u)])
        rows=[]
        for part in parts:
            pos,rot,scale,visible=states[part['name']]
            q=quat(rot)
            if frames and np.dot(q,np.array(frames[-1]['transforms'][len(rows)][3:7]))<0:q=-q
            rows.append(np.round(np.concatenate([pos,q,scale,[1 if visible else 0]]),7).tolist())
        frames.append({'time':round(t,7),'transforms':rows})
    # Keep hidden effects at a nearby live pose so interpolation never pulls a departing
    # projectile back to the world origin on its last visible frame.
    for i,part in enumerate(parts):
        if not part['isEffect']:continue
        live=[j for j,f in enumerate(frames) if f['transforms'][i][10]]
        if not live:continue
        for j,f in enumerate(frames):
            if not f['transforms'][i][10]:
                nearest=min(live,key=lambda k:abs(k-j))
                f['transforms'][i]=frames[nearest]['transforms'][i][:10]+[0.]
        for j in range(1,len(frames)):
            a=frames[j-1]['transforms'][i];b=frames[j]['transforms'][i]
            if np.dot(a[3:7],b[3:7])<0:b[3:7]=[-v for v in b[3:7]]
    return dict(id=id,displayName=sc['displayName'],attackName=sc['attackName'],description=DESCRIPTIONS[id],duration=DURATION,fps=FPS,release=RELEASE,parts=parts,frames=frames)

def export_animation(clip):
    """GLB uses regular node transform animation; Roblox playback uses the supplied script."""
    doc={'asset':{'version':'2.0','generator':'Pupsters sampled sitting attacks'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'name':clip['displayName'],'children':[]}],'meshes':[],'materials':[],'bufferViews':[],'accessors':[]}
    data=bytearray()
    def acc(values,typ,target=None):
        arr=np.asarray(values,dtype='<f4' if typ!='INDEX' else '<u2')
        while len(data)%4:data.append(0)
        view={'buffer':0,'byteOffset':len(data),'byteLength':arr.nbytes}
        if target:view['target']=target
        doc['bufferViews'].append(view);data.extend(arr.tobytes())
        entry={'bufferView':len(doc['bufferViews'])-1,'componentType':5123 if typ=='INDEX' else 5126,'count':len(arr),'type':'SCALAR' if typ=='INDEX' else typ}
        if typ in ['VEC3','SCALAR']:
            entry['min']=np.atleast_1d(arr.min(axis=0)).tolist();entry['max']=np.atleast_1d(arr.max(axis=0)).tolist()
        doc['accessors'].append(entry);return len(doc['accessors'])-1
    time=acc([f['time'] for f in clip['frames']],'SCALAR')
    anim={'name':'SittingAttack','samplers':[],'channels':[]}
    rows=np.array([f['transforms'] for f in clip['frames']])
    for i,part in enumerate(clip['parts']):
        v=np.array(part['vertices']);faces=np.array(part['faces']);pos=v[faces].reshape(-1,3)
        norm=np.cross(v[faces[:,1]]-v[faces[:,0]],v[faces[:,2]]-v[faces[:,0]]);norm/=np.linalg.norm(norm,axis=1)[:,None]
        mat={'name':part['name'],'pbrMetallicRoughness':{'baseColorFactor':srgb_linear(part['color'])+[1],'metallicFactor':0,'roughnessFactor':.88}}
        if part['emissive']:mat['emissiveFactor']=srgb_linear(part['color'])
        doc['materials'].append(mat)
        prim={'attributes':{'POSITION':acc(pos,'VEC3',34962),'NORMAL':acc(np.repeat(norm,3,axis=0),'VEC3',34962)},'indices':acc(np.arange(len(pos)),'INDEX',34963),'material':i}
        doc['meshes'].append({'name':part['name'],'primitives':[prim]})
        values=rows[:,i,:];scale=values[:,7:10]*np.where(values[:,10:11]>0,1,.00001)
        node={'name':part['name'],'mesh':i,'translation':values[0,:3].tolist(),'rotation':values[0,3:7].tolist(),'scale':scale[0].tolist()}
        ni=len(doc['nodes']);doc['nodes'].append(node);doc['nodes'][0]['children'].append(ni)
        for path,vals,typ in [('translation',values[:,:3],'VEC3'),('rotation',values[:,3:7],'VEC4'),('scale',scale,'VEC3')]:
            if np.allclose(vals,vals[0],atol=1e-8):continue
            out=acc(vals,typ);si=len(anim['samplers'])
            anim['samplers'].append({'input':time,'output':out,'interpolation':'LINEAR'})
            anim['channels'].append({'sampler':si,'target':{'node':ni,'path':path}})
    doc['animations']=[anim];doc['buffers']=[{'byteLength':len(data)}]
    raw=json.dumps(doc,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);binary=bytes(data)+b'\0'*((-len(data))%4)
    result=struct.pack('<4sII',b'glTF',2,12+8+len(raw)+8+len(binary))+struct.pack('<I4s',len(raw),b'JSON')+raw+struct.pack('<I4s',len(binary),b'BIN\0')+binary
    (ROOT/'animations'/f"{clip['id']}-attack.glb").write_bytes(result)

def validate(clip):
    rows=np.array([f['transforms'] for f in clip['frames']]);assert np.isfinite(rows).all()
    assert np.all(rows[:,:,7:10]>0) and set(rows[:,:,10].ravel())<={0.,1.}
    assert np.allclose(np.linalg.norm(rows[:,:,3:7],axis=2),1,atol=2e-6)
    native=[i for i,p in enumerate(clip['parts']) if not p['isEffect']]
    assert np.allclose(rows[0,native,:][:,np.r_[0:3,7:11]],rows[-1,native,:][:,np.r_[0:3,7:11]],atol=2e-6),'loop reset'
    assert np.allclose(np.abs(np.sum(rows[0,native,3:7]*rows[-1,native,3:7],axis=1)),1,atol=2e-6),'rotation reset'
    fixed=0
    for i,p in enumerate(clip['parts']):
        if p['name'].endswith('_Paw'):
            assert np.allclose(rows[:,i,:],rows[0,i,:]);fixed+=1
        if p['isEffect']:assert rows[0,i,10]==0 and rows[-1,i,10]==0
    assert fixed==4 and np.any(np.abs(rows[15,:,:3]-rows[0,:,:3])>.03)
    assert any(p['isEffect'] and rows[:,i,10].sum()>0 for i,p in enumerate(clip['parts']))
    return {'id':clip['id'],'frames':len(rows),'fourPawsFixed':True,'restPoseReturnsExactly':True,'finiteNormalizedTransforms':True,'effectsTimed':True}

def main():
    clips={};reports=[]
    for p in sorted((ROOT/'scenes').glob('D*.json')):
        sc=json.loads(p.read_text(encoding='utf-8'));clip=make_clip(sc);reports.append(validate(clip))
        clips[sc['id']]=clip
        (ROOT/'animations'/f"{sc['id']}.json").write_text(json.dumps(clip,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
        export_animation(clip)
    (ROOT/'viewer/attack-data.js').write_text('window.PUPSTERS_ATTACKS='+json.dumps(clips,ensure_ascii=False,separators=(',',':'))+';',encoding='utf-8')
    (ROOT/'docs/attack-validation.json').write_text(json.dumps({'passed':True,'clips':reports,'robloxStudioTested':False,'browserViewerTested':False},indent=2),encoding='utf-8')
    print(json.dumps(reports))
if __name__=='__main__':main()
