const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sharp=require('sharp');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'animation-manifest.json'),'utf8'));
(async()=>{
 const checks=[];
 for(const dog of manifest.characters){
  const rawFrames=[],imageChecks=[];
  for(const frame of dog.frames){
   const file=path.join(root,frame.file),bytes=fs.readFileSync(file);
   const meta=await sharp(bytes).metadata();
   assert.equal(meta.width,dog.canvas.width,frame.file+' width');
   assert.equal(meta.height,dog.canvas.height,frame.file+' height');
   assert(meta.hasAlpha,frame.file+' alpha');
   const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   const W=info.width,H=info.height;
   const corners=[data[3],data[(W-1)*4+3],data[(H-1)*W*4+3],data[(W*H-1)*4+3]];
   assert(corners.every(a=>a<=1),frame.file+' transparent corners');
   rawFrames.push(data);
   imageChecks.push({file:frame.file,width:W,height:H,cornerAlpha:corners,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
  }
  assert.equal(new Set(imageChecks.slice(0,4).map(x=>x.sha256)).size,4,dog.id+' must have four distinct drawings');
  const raw={width:dog.canvas.width,height:dog.canvas.height*dog.frames.length,channels:4,pageHeight:dog.canvas.height};
  const pixels=Buffer.concat(rawFrames),delay=dog.frames.map(f=>f.durationMs);
  // Encoding only: source keyframe pixels are not resized, cropped, repainted or warped.
  await sharp(pixels,{raw}).gif({loop:0,delay,dither:0,effort:4}).toFile(path.join(root,dog.previewGif));
  await sharp(pixels,{raw}).webp({lossless:true,loop:0,delay,effort:4}).toFile(path.join(root,dog.previewWebp));
  const gif=await sharp(path.join(root,dog.previewGif),{animated:true}).metadata();
  const webp=await sharp(path.join(root,dog.previewWebp),{animated:true}).metadata();
  assert.equal(gif.pages,5);assert.equal(webp.pages,5);
  assert.deepEqual(gif.delay,delay);assert.deepEqual(webp.delay,delay);
  assert.equal(gif.loop,0);assert.equal(webp.loop,0);
  assert.equal(gif.pageHeight,dog.canvas.height);assert.equal(webp.pageHeight,dog.canvas.height);
  // A decode check distinguishes a real sequence from a renamed still image.
  const decoded=await sharp(path.join(root,dog.previewWebp),{animated:true}).ensureAlpha().raw().toBuffer();
  const frameBytes=dog.canvas.width*dog.canvas.height*4;
  assert.equal(decoded.length,frameBytes*5);
  const frameHashes=Array.from({length:5},(_,i)=>crypto.createHash('sha256').update(decoded.subarray(i*frameBytes,(i+1)*frameBytes)).digest('hex'));
  assert.equal(new Set(frameHashes.slice(0,4)).size,4);
  assert.equal(frameHashes[0],frameHashes[4],'idle loop endpoint');
  checks.push({id:dog.id,passed:true,images:imageChecks,animatedPages:5,uniquePoses:4,durationsMs:delay,loopDurationMs:delay.reduce((a,b)=>a+b,0),gif:dog.previewGif,webp:dog.previewWebp,decodedFrameHashes:frameHashes});
  console.log(dog.id+' encoded and verified');
 }
 fs.writeFileSync(path.join(root,'docs','animation-validation.json'),JSON.stringify({passed:true,checkedOn:'2026-10-23',dogCount:checks.length,uniquePosePngs:checks.length*4,animatedFiles:checks.length*2,checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
