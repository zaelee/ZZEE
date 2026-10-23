"""Export the editable breed scenes as native Roblox models and standard meshes."""
from pathlib import Path
import copy, hashlib, json
import xml.etree.ElementTree as ET
import numpy as np
from build_models import ROOT, mesh, export_gltf
import export_native as native

def main():
    entries=[];data={};native_reports=[]
    combined=ET.Element('roblox',version='4')
    for value in ['null','nil']:ET.SubElement(combined,'External').text=value
    pack=ET.SubElement(combined,'Item',{'class':'Model','referent':'PACK'})
    prop=ET.SubElement(pack,'Properties');ET.SubElement(prop,'string',name='Name').text='Pupsters_Block_Pack'
    for index,p in enumerate(sorted((ROOT/'scenes').glob('D*.json'))):
        sc=json.loads(p.read_text(encoding='utf-8'))
        assert len({part['name'] for part in sc['parts']})==len(sc['parts'])
        assert all(part['type'] in ['box','sphere'] for part in sc['parts'])
        meshes=[mesh(part) for part in sc['parts']]
        export_gltf(sc,meshes)
        validated=native.validate_scene(sc)
        validated['name']=sc['displayName']
        mouth_index,mouth_local=native.choose_mouth_part(validated)
        xml=native.build_rbxmx(validated,mouth_index,mouth_local)
        lua=native.build_luau(validated,mouth_index)
        check=native.validate_outputs(validated,xml,lua,mouth_index,mouth_local)
        stem=p.stem
        (ROOT/'native'/f'{stem}.rbxmx').write_text(xml,encoding='utf-8')
        (ROOT/'native'/f'Build-{stem}.luau').write_text(lua,encoding='utf-8')
        native_reports.append({'id':sc['id'],'source':str(p.relative_to(ROOT)).replace('\\','/'),'sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'checks':check})
        item=ET.fromstring(xml).find('Item');assert item is not None
        mapping={node.attrib['referent']:sc['id']+'_'+node.attrib['referent'] for node in item.iter('Item')}
        for node in item.iter('Item'):
            node.attrib['referent']=mapping[node.attrib['referent']]
            if node.attrib['class'] in ('Part','WedgePart'):
                cf=node.find('./Properties/CoordinateFrame[@name="CFrame"]')
                for axis,delta in [('X',(index%3-1)*4),('Z',(index//3)*4)]:
                    a=cf.find(axis);a.text=str(float(a.text)+delta)
        for ref in item.iter('Ref'):
            if ref.text in mapping:ref.text=mapping[ref.text]
        pack.append(item)
        vertices=np.concatenate([v for v,f in meshes])
        entry={k:sc[k] for k in ['id','slug','name','displayName','feature','attackName','attackMethod','mouth']}
        entry.update(scene=f'scenes/{stem}.json',native=f'native/{stem}.rbxmx',builder=f'native/Build-{stem}.luau',gltf=f'models/{sc["name"]}.gltf',glb=f'models/{sc["name"]}.glb',obj=f'models/{sc["name"]}.obj',mtl=f'models/{sc["name"]}.mtl',preview=f'previews/{stem}.png',views=f'previews/{stem}-views.png',parts=len(meshes),triangles=sum(len(f) for v,f in meshes),largestMeshTriangles=max(len(f) for v,f in meshes),bounds={'min':vertices.min(axis=0).tolist(),'max':vertices.max(axis=0).tolist()})
        entries.append(entry)
        data[sc['id']]={**entry,'parts':[dict(name=part['name'],group=part['group'],color=sc['materials'][part['material']]['color'],vertices=np.round(v,6).tolist(),faces=f.tolist()) for part,(v,f) in zip(sc['parts'],meshes)]}
    ET.indent(combined)
    ET.ElementTree(combined).write(ROOT/'native/Pupsters-All-Dogs.rbxmx',encoding='utf-8',xml_declaration=True)
    (ROOT/'manifest.json').write_text(json.dumps({'version':3,'date':'2026-10-23','style':'blunt block dogs, refined ears and crown, floating electric FX','models':entries},ensure_ascii=False,indent=2),encoding='utf-8')
    (ROOT/'viewer/model-data.js').write_text('window.PUPSTERS_MODELS='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';',encoding='utf-8')
    (ROOT/'docs/native-validation.json').write_text(json.dumps({'passed':True,'models':native_reports,'studioTested':False},indent=2),encoding='utf-8')
    print(json.dumps([{'id':e['id'],'parts':e['parts'],'triangles':e['triangles']} for e in entries]))

if __name__=='__main__':main()
