"""Original block playroom map with an S route and sixteen reserved placement pads."""
import copy,json,math
from pathlib import Path
import numpy as np
from build_models import ROOT,mesh,rotation,export_gltf

PALETTE={'wood':'A97A51','floorA':'F3DFBC','floorB':'EBD4AF','trim':'D5AE7B',
    'road':'E7AF61','roadEnd':'A4C8A4','roadEdge':'C78F4E','cream':'FFF1D5','dark':'665544',
    'mint':'80B5A2','mintDark':'527E70','pad':'96C3A4','padInset':'CFDFB8','paw':'729879',
    'sofa':'92B19C','sofaDark':'6E917D','yellow':'EDCA6A','blue':'71A9C2','coral':'DF785D',
    'bookshelf':'C59462','green':'72915D','leaf':'98B778','pot':'B98C6D','white':'FFF9E9'}
MATS={k:{'color':[int(v[i:i+2],16)/255 for i in (0,2,4)]} for k,v in PALETTE.items()}
PARTS=[]
def box(name,group,size,pos,mat,collidable=False,rot=(0,0,0)):
    PARTS.append(dict(name=name,group=group,type='box',size=list(size),position=list(pos),rotation=list(rot),material=mat,collidable=collidable))

WAYPOINTS=[[-31,.10,-15],[25,.10,-15],[25,.10,0],[-25,.10,0],[-25,.10,15],[31,.10,15]]
def rects(width):
    h=width/2
    return [dict(xmin=min(a[0],b[0])-h,xmax=max(a[0],b[0])+h,zmin=min(a[2],b[2])-h,zmax=max(a[2],b[2])+h) for a,b in zip(WAYPOINTS,WAYPOINTS[1:])]
def in_rect(x,z,r):return r['xmin']<x<r['xmax'] and r['zmin']<z<r['zmax']
def union_tiles(name,group,rectangles,height,mat):
    xs=sorted(set(round(r[k],6) for r in rectangles for k in ('xmin','xmax')))
    zs=sorted(set(round(r[k],6) for r in rectangles for k in ('zmin','zmax')))
    n=0
    for x0,x1 in zip(xs,xs[1:]):
        for z0,z1 in zip(zs,zs[1:]):
            x=(x0+x1)/2;z=(z0+z1)/2
            if any(in_rect(x,z,r) for r in rectangles):
                color='roadEnd' if group=='Path' and x>28 and z>10 else mat
                box(f'{name}{n:02d}',group,[x1-x0,height,z1-z0],[x,height/2,z],color,True);n+=1
def pixel_arrow(name,x,z,dx,dz):
    yaw=math.atan2(-dz,dx);r=rotation([0,yaw,0]);step=.29
    pixels=['..#..','...#.','#####','...#.','..#..']
    for row,line in enumerate(pixels):
        for col,c in enumerate(line):
            if c=='#':
                local=np.array([(col-2)*step,0,(row-2)*step]);pos=r@local+np.array([x,.116,z])
                box(f'{name}_{row}{col}','RouteMarks',[step,.025,step],pos,'cream',rot=[0,yaw,0])
def plant(name,x,z):
    box(name+'Pot','Props',[3,1.6,3],[x,.8,z],'pot',True)
    box(name+'Soil','Props',[2.5,.14,2.5],[x,1.64,z],'wood')
    box(name+'Stem','Props',[.65,2.5,.65],[x,2.85,z],'green',True)
    box(name+'LeafA','Props',[3.8,1.65,3.0],[x-.4,3.65,z],'green',True)
    box(name+'LeafB','Props',[2.8,1.75,3.3],[x+.55,4.55,z+.1],'leaf',True)
def furniture():
    # Low chunky furniture stays outside the navigation and placement corridors.
    for x in (-8.5,8.5):
        for z in (-24,-21.8):box(f'SofaLeg{x}_{z}','Props',[.65,.5,.65],[x,.25,z],'wood',True)
    box('SofaBase','Props',[21,.8,4],[0,.9,-23],'sofaDark',True)
    box('SofaBack','Props',[21,2.3,.7],[0,2.1,-24.6],'sofa',True)
    for x,side in [(-10.25,'L'),(10.25,'R')]:box('SofaArm'+side,'Props',[1.05,1.65,4.4],[x,1.35,-23],'sofa',True)
    for i,x in enumerate([-6.7,0,6.7]):box(f'SofaCushion{i}','Props',[6.35,.35,2.9],[x,1.47,-22.65],'mint',True)
    box('SofaPillowYellow','Props',[2.3,1.2,.8],[-6.5,2.22,-23.55],'yellow',True)
    box('SofaPillowBlue','Props',[2.0,1.15,.8],[6.5,2.195,-23.55],'blue',True)
    # A small bookcase and two low toy arrangements frame the empty playable floor.
    box('BookcaseBack','Props',[7,4.7,.4],[32.5,2.35,-24.9],'bookshelf',True)
    for x in [29.2,35.8]:box(f'BookcaseSide{x}','Props',[.4,4.7,3.2],[x,2.35,-23.5],'bookshelf',True)
    for i,y in enumerate([.25,2.4,4.5]):box(f'BookcaseShelf{i}','Props',[6.6,.3,3.2],[32.5,y,-23.5],'bookshelf',True)
    for i,(x,col,h) in enumerate([(30,'blue',1.3),(31,'yellow',1.6),(32.1,'coral',1.4),(33.3,'mintDark',1.65),(34.4,'cream',1.2)]):
        box(f'Book{i}','Props',[.75,h,1.8],[x,.4+h/2,-23.3],col,True)
    for i,(x,z,col) in enumerate([(30.7,-23.5,'yellow'),(33.5,-23.3,'blue')]):box(f'TopToy{i}','Props',[1.6,1.5,1.6],[x,3.3,z],col,True)
    plant('Plant',-34,22)
    for i,(x,z,col) in enumerate([(-8,22,'coral'),(-5.8,22.5,'blue'),(-7,24.0,'yellow'),(8,22,'blue'),(10.3,23,'coral')]):
        box(f'LooseToy{i}','Props',[1.8,1.7,1.8],[x,.85,z],col,True)
    box('ToyStack','Props',[1.6,1.4,1.6],[-8,2.4,22],'yellow',True)
    # Square water tray with an inset square surface.
    box('WaterTray','Props',[5.2,.65,3.3],[21,.325,22.5],'mintDark',True)
    box('WaterInset','Props',[4.3,.12,2.4],[21,.71,22.5],'blue')

def gates():
    box('ToyBoxFloor','Spawn',[7,.08,10.4],[-33.5,.04,-15],'mint',True)
    box('ToyBoxBack','Spawn',[.45,4.1,10.4],[-36.9,2.05,-15],'mintDark',True)
    for z,side in [(-20,'N'),(-10,'S')]:box('ToyBoxSide'+side,'Spawn',[7,2.7,.4],[-33.5,1.35,z],'mint',True)
    for z,side in [(-19.65,'N'),(-10.35,'S')]:box('SpawnPost'+side,'Spawn',[.7,4.2,.7],[-30.4,2.1,z],'coral',True)
    box('SpawnLintel','Spawn',[.7,.6,10.0],[-30.4,4.3,-15],'coral',True)
    # Blunt toy blocks sit above and beside the gate, not in its opening.
    for i,z in enumerate([-18,-15,-12]):box(f'SpawnTopBlock{i}','Spawn',[.9,.7,.9],[-30.4,4.95,z],['blue','yellow','cream'][i],True)
    box('BedBase','Goal',[7.2,.08,9.4],[33.4,.04,15],'mint',True)
    box('BedBack','Goal',[.5,2.6,9.4],[36.75,1.3,15],'mintDark',True)
    for z,side in [(10.5,'N'),(19.5,'S')]:box('BedRail'+side,'Goal',[7.2,1.3,.4],[33.4,.65,z],'mint',True)
    for i,z in enumerate([12.8,17.2]):box(f'BedPillow{i}','Goal',[1.4,.55,2.8],[35.4,.355,z],'cream',True)
    for face,x in [('Inside',36.48),('Outside',37.02)]:
        box('GoalBone'+face,'Goal',[.08,.36,2.5],[x,1.6,15],'cream')
        for z,side in [(13.55,'A'),(16.45,'B')]:box('GoalBone'+face+side,'Goal',[.08,.8,.6],[x,1.6,z],'cream')

def build():
    PARTS.clear()
    box('MapBase','Floor',[76,1.12,52],[0,-.64,0],'wood',True)
    for i in range(13):box(f'FloorPlank{i:02d}','Floor',[76,.08,3.96],[0,-.04,-24+4*i],'floorA' if i%2==0 else 'floorB',True)
    for x,side in [(-37.8,'W'),(37.8,'E')]:box('Rim'+side,'Props',[.4,.5,51.2],[x,.25,0],'trim',True)
    for z,side in [(-25.8,'N'),(25.8,'S')]:box('Rim'+side,'Props',[76,.5,.4],[0,.25,z],'trim',True)
    union_tiles('PathEdge','PathEdge',rects(6.45),.055,'roadEdge')
    union_tiles('Road','Path',rects(6),.10,'road')
    for i,args in enumerate([(-14,-15,1,0),(25,-8,0,1),(8,0,-1,0),(-25,8,0,1),(-8,15,1,0),(18,15,1,0)]):pixel_arrow(f'Arrow{i}',*args)
    slots=[]
    positions=[(x,z,math.pi,'inner') for z in [-7.5,7.5] for x in [-18,-11,-4,4,11,18]]
    positions += [(-32,-2,-math.pi/2,'outer'),(-32,7,-math.pi/2,'outer'),(32,-7,math.pi/2,'outer'),(32,2.5,math.pi/2,'outer')]
    for i,(x,z,yaw,zone) in enumerate(positions):
        id=f'P{i+1:02d}';slots.append(dict(id=id,position=[x,.26,z],size=[4.2,4.2],yaw=yaw,zone=zone))
        box(id+'_Base','PlacementPads',[4.2,.22,4.2],[x,.11,z],'pad',True)
        box(id+'_Inset','PlacementPads',[3.65,.04,3.65],[x,.24,z],'padInset',True)
        box(id+'_Paw','PlacementPads',[.86,.02,.70],[x,.27,z+.3],'paw')
        for j,(px,pz) in enumerate([(-.62,-.30),(-.21,-.56),(.21,-.56),(.62,-.30)]):box(id+f'_Toe{j}','PlacementPads',[.30,.02,.34],[x+px,.27,z+pz],'paw')
    furniture();gates()
    layout=dict(mapId='MAP01',title='블록 놀이방',units='studs',up='+Y',front='-Z',
        floorBounds=[[-38,-1.2,-26],[38,0,26]],pathWidth=6,pathY=.10,roadRects=rects(6),
        waypoints=[dict(id=f'W{i+1:02d}',position=p) for i,p in enumerate(WAYPOINTS)],slots=slots,
        spawn=dict(name='장난감 상자',position=WAYPOINTS[0],yaw=-math.pi/2),
        goal=dict(name='강아지 쉼터',position=WAYPOINTS[-1],yaw=-math.pi/2),showcase=[])
    anchors=[dict(id=p['id'],position=p['position']) for p in layout['waypoints']+slots]
    scene=dict(id='MAP01',name='Pupsters_Block_Playroom_Map',displayName='사고멍치 · 블록 놀이방',units='studs',up='+Y',front='-Z',materials=MATS,parts=PARTS,anchors=anchors)
    (ROOT/'scenes/map.json').write_text(json.dumps(scene,ensure_ascii=False,indent=2),encoding='utf-8')
    showcase=copy.deepcopy(scene);showcase['name']='Pupsters_Block_Playroom_Showcase';showcase['displayName']='사고멍치 · 배치 예시'
    samples=[('D01','P02'),('D02','P04'),('D03','P06'),('D04','P08'),('D05','P10'),('D06','P12')]
    samples=[dict(id=id,sourceId=id,slotId=slot,position=next(s['position'] for s in slots if s['id']==slot),yaw=next(s['yaw'] for s in slots if s['id']==slot),kind='dog') for id,slot in samples]
    samples += [dict(id=inst,sourceId=id,position=[x,.1,z],yaw=yaw,kind='enemy') for inst,id,x,z,yaw in [
        ('Enemy01','E01',-20,-15,-math.pi/2),('Enemy02','E02',17,-15,-math.pi/2),
        ('Enemy03','E05',9,0,math.pi/2),('Boss01','B01',-25,8,math.pi),('Enemy04','E01',7,15,-math.pi/2)]]
    for sample in samples:
        source=next((ROOT/'source-models').glob(sample['sourceId']+'-*.json'));model=json.loads(source.read_text(encoding='utf-8'));prefix=sample['id']+'_';r=rotation([0,sample['yaw'],0])
        sample['source']=source.relative_to(ROOT).as_posix();sample['name']=model.get('displayName',sample['sourceId'])
        for key,value in model['materials'].items():showcase['materials'][prefix+key]=value
        for p in model['parts']:
            # Bake arbitrary source rotations into vertices for exporters via matrix override;
            # native Euler composition below is exact for yaw followed by source XYZ.
            new=copy.deepcopy(p);new.update(name=prefix+p['name'],group='Actors_'+sample['id'],material=prefix+p['material'],position=(r@p['position']+sample['position']).tolist(),collidable=False)
            full=r@rotation(p['rotation'])
            # XYZ extraction for R=Rx Ry Rz. Source actors never approach gimbal lock.
            ry=math.asin(float(np.clip(full[0,2],-1,1)))
            if abs(math.cos(ry))>1e-7:rx=math.atan2(-full[1,2],full[2,2]);rz=math.atan2(-full[0,1],full[0,0])
            else:rx=math.atan2(full[2,1],full[1,1]);rz=0
            new['rotation']=[rx,ry,rz];assert np.allclose(rotation(new['rotation']),full,atol=1e-7)
            showcase['parts'].append(new)
        layout['showcase'].append(sample)
    (ROOT/'scenes/showcase.json').write_text(json.dumps(showcase,ensure_ascii=False,indent=2),encoding='utf-8')
    (ROOT/'layout.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2),encoding='utf-8')
    for sc in [scene,showcase]:export_gltf(sc,[mesh(p) for p in sc['parts']])
    rows=[]
    for p in showcase['parts']:
        v,f=mesh(p);mat=showcase['materials'][p['material']]
        rows.append(dict(name=p['name'],group=p['group'],color=mat['color'],opacity=mat.get('opacity',1),vertices=np.round(v,7).tolist(),faces=f.tolist()))
    allv=np.concatenate([np.asarray(p['vertices']) for p in rows]);data=dict(title=layout['title'],layout=layout,parts=rows,bounds=[allv.min(0).tolist(),allv.max(0).tolist()])
    (ROOT/'viewer/map-data.js').write_text('window.PUPSTERS_MAP='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';',encoding='utf-8')
    print(json.dumps({'mapParts':len(scene['parts']),'showcaseParts':len(showcase['parts']),'slots':len(slots),'waypoints':len(WAYPOINTS),'routeLength':sum(np.linalg.norm(np.asarray(a)-b) for a,b in zip(WAYPOINTS,WAYPOINTS[1:]))}))
if __name__=='__main__':build()
