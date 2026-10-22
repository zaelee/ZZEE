import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {dirname} from 'node:path';
const source=new URL('./node_modules/three/',import.meta.url);
const version=JSON.parse(await readFile(new URL('package.json',source),'utf8')).version;
if(version!=='0.180.0')throw Error('Review Three.js upgrade before vendoring');
const files=['build/three.module.min.js','build/three.core.min.js','LICENSE','examples/jsm/loaders/HDRLoader.js','examples/jsm/environments/RoomEnvironment.js','examples/jsm/exporters/GLTFExporter.js','examples/jsm/math/ConvexHull.js'];
for(const name of files){const target=new URL('vendor/three/'+name.replace('examples/jsm/','addons/'),import.meta.url);await mkdir(dirname(target.pathname),{recursive:true});await copyFile(new URL(name,source),target);}
await writeFile(new URL('vendor/three/VERSION',import.meta.url),version+'\n');
console.log('Vendored Three.js '+version+' ('+files.length+' files)');
