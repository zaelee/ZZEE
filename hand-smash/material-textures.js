import * as THREE from 'three';
function hash(x,y){const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);}
function noise(x,y){const i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j,a=u*u*(3-2*u),b=v*v*(3-2*v);return (hash(i,j)*(1-a)+hash(i+1,j)*a)*(1-b)+(hash(i,j+1)*(1-a)+hash(i+1,j+1)*a)*b;}
function texture(data,size,color=false){
  const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}
export function organicMaps(kind,size=256){
  const colors=new Uint8Array(size*size*4),height=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size,n=noise(u*38,v*38),fine=hash(x,y),cloud=noise(u*7,v*7),i=(y*size+x)*4;
    let rgb,bump=n*.65+fine*.35,roughness=.7;
    if(kind==='strawberry'){
      const px=(u-.5)*1.5,py=(v-.5)*1.5;
      const width=.035+.085*Math.max(0,(py+.7)/1.4),center=px+Math.sin(py*12)*.012;
      const core=Math.exp(-Math.pow(Math.abs(center)/width,2.6));
      const fiber=Math.pow(Math.max(0,Math.sin(py*135+Math.abs(px)*48+cloud*14+n*4)),12)*.035;
      const pale=Math.min(.95,core*.88+fiber+.1*Math.exp(-Math.abs(px)*7));
      const base=[157+cloud*65+n*21,12+cloud*20+n*12,30+cloud*25+n*12];
      rgb=base.map((c,k)=>c*(1-pale)+[255,224,188][k]*pale);
      bump=.35+n*.32+fiber*.5+fine*.13;roughness=.28+cloud*.14;
    }else if(kind==='dough'){
      const powder=fine>.88?8:0;rgb=[245,236,220].map(c=>c+(cloud-.5)*9+(n-.5)*6+powder);roughness=.72+fine*.24;
    }else if(kind==='bean'){
      const grain=Math.pow(n,3);rgb=[78,38,32].map((c,k)=>c+(cloud-.5)*8+grain*[18,12,10][k]);roughness=.58+n*.2;
    }else if(kind==='kiwi'){
      const px=(u-.5)*2,py=(v-.5)*2,r=Math.hypot(px,py),a=Math.atan2(py,px);
      const fiber=Math.pow(Math.max(0,Math.sin(a*160+noise(r*12,a)*3)),6)*14;
      rgb=[206+cloud*25+fiber,166+cloud*30+fiber,37+n*22];roughness=.32+n*.12;
    }else {rgb=[236+cloud*16,146+cloud*38,24+n*25];roughness=.29+n*.15;}
    for(let c=0;c<3;c++){colors[i+c]=Math.max(0,Math.min(255,rgb[c]));height[i+c]=Math.round(bump*255);rough[i+c]=Math.round(roughness*255);}
    colors[i+3]=height[i+3]=rough[i+3]=255;
  }
  return {map:texture(colors,size,true),bumpMap:texture(height,size),roughnessMap:texture(rough,size)};
}
export function planarUV(geometry,extent=1.5){
  const p=geometry.getAttribute('position'),uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){uv[i*2]=p.getX(i)/extent+.5;uv[i*2+1]=p.getY(i)/extent+.5;}
  geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));return geometry;
}
