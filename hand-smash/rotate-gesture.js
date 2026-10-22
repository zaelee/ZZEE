import {isClosed} from './physics.js';
export class PinchRotation {
  reset(){this.active=false;this.key=null;this.point=null;this.time=0;this.blockUntil=0;}
  constructor(){this.reset();}
  update(landmarks,points,handedness,time,span){
    const candidates=[];
    for(let i=0;i<landmarks.length;i++){
      const h=landmarks[i],key=handedness?.[i]?.[0]?.categoryName??String(i);
      const distance=(a,b)=>Math.hypot(h[a].x-h[b].x,h[a].y-h[b].y);
      const palm=distance(5,17),ratio=distance(4,8)/Math.max(.001,palm);
      const threshold=(this.active&&key===this.key) ? .43 : .28;
      if(palm>.015&&ratio<threshold&&!isClosed(h))candidates.push({key,point:{x:(points[i][4].x+points[i][8].x)/2,y:(points[i][4].y+points[i][8].y)/2}});
    }
    let dx=0,dy=0;
    if(candidates.length===1){
      const next=candidates[0];
      if(this.active&&next.key===this.key&&time-this.time<180){
        const x=next.point.x-this.point.x,y=next.point.y-this.point.y;
        if(Math.hypot(x,y)<span*.2){const gain=600/Math.max(1,span)*.7;dx=x*gain;dy=y*gain;}
      }
      this.active=true;this.key=next.key;this.point=next.point;this.time=time;this.blockUntil=time+200;
    }else{
      if(this.active||candidates.length)this.blockUntil=time+200;
      this.active=false;this.key=null;this.point=null;
    }
    return {active:this.active,blocked:candidates.length>0||time<this.blockUntil,dx,dy,point:this.point};
  }
}
