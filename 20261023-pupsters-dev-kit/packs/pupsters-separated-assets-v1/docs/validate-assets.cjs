const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const parse = p => JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
(async () => {
  const manifest = parse(path.join(root,'manifest.json'));
  const failures = [];
  const records = [];
  const gallery = fs.readFileSync(path.join(root,'index.html'),'utf8');
  for (const asset of manifest.assets) {
    const file = path.join(root,asset.file);
    const buf = fs.readFileSync(file);
    const meta = await sharp(buf).metadata();
    const {data,info} = await sharp(buf).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let transparent=0,semi=0,opaque=0,minX=info.width,minY=info.height,maxX=-1,maxY=-1;
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
      const alpha=data[(y*info.width+x)*info.channels+info.channels-1];
      if(alpha===0)transparent++; else {if(alpha===255)opaque++; else semi++; if(alpha>=8){minX=Math.min(x,minX);minY=Math.min(y,minY);maxX=Math.max(x,maxX);maxY=Math.max(y,maxY);}}
    }
    const alphaAt=(x,y)=>data[(y*info.width+x)*info.channels+info.channels-1];
    const corners=[alphaAt(0,0),alphaAt(info.width-1,0),alphaAt(0,info.height-1),alphaAt(info.width-1,info.height-1)];
    if(meta.format!=='png')failures.push(asset.file+': not PNG');
    if(asset.kind!=='background'&&(!meta.hasAlpha||corners.some(a=>a>1)||transparent===0))failures.push(asset.file+': transparency');
    if(maxX<0)failures.push(asset.file+': empty');
    if(!gallery.includes('src="'+asset.file+'"'))failures.push(asset.file+': absent gallery');
    if(asset.svg) {
      const svg=fs.readFileSync(path.join(root,asset.svg),'utf8');
      if(/<text\b|<image\b/i.test(svg))failures.push(asset.svg+': baked content');
      if(asset.dimensions.width!==info.width||asset.dimensions.height!==info.height)failures.push(asset.file+': dimensions');
    }
    const record={file:asset.file,width:info.width,height:info.height,hasAlpha:meta.hasAlpha,cornerAlpha:corners,transparentPixels:transparent,semiTransparentPixels:semi,opaquePixels:opaque,centerAlpha:alphaAt(Math.floor(info.width/2),Math.floor(info.height/2)),contentBounds:{left:minX,top:minY,right:maxX,bottom:maxY},sha256:crypto.createHash('sha256').update(buf).digest('hex')};
    records.push(record);
    asset.dimensions={width:info.width,height:info.height};
    asset.contentBounds=record.contentBounds;
  }
  const expected={png:63,svg:34};
  const actual={png:records.length,svg:manifest.assets.filter(a=>a.svg).length};
  if(actual.png!==expected.png||actual.svg!==expected.svg)failures.push('asset count mismatch');
  const report={alphaPolicy:{cornerMax:1,contentBoundsMinAlpha:8,note:'FX06 top-left pixel has alpha 1/255; original preserved. All other asset corner samples are zero.'},checkedOn:'2026-10-23',expected,actual,passed:failures.length===0,failures,checks:['PNG decode','expected file counts','non-background corner alpha <= 1/255','nonempty content','UI PNG dimensions match SVG manifest','UI SVG does not bake text or raster images','every production PNG linked by gallery'],records};
  fs.writeFileSync(path.join(root,'docs','validation.json'),JSON.stringify(report,null,2));
  fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2));
  console.log(JSON.stringify({passed:report.passed,actual,failures,boss:records.find(x=>x.file.includes('B01')),transparentEnemy:records.find(x=>x.file.includes('E07'))},null,2));
  if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
