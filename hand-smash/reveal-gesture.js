export const TEAR_HOLD_MS=5_000;
export class HoldTear {
  constructor(){this.cancel();}
  cancel(){this.start=null;this.point=null;}
  begin(point,time){this.point={...point};this.start=time;}
  move(point){if(this.point&&Math.hypot(point.x-this.point.x,point.y-this.point.y)>18)this.cancel();}
  progress(time){return this.start===null?0:Math.min(1,(time-this.start)/TEAR_HOLD_MS);}
  ready(time){if(this.progress(time)<1)return false;this.cancel();return true;}
}
export class FistTear {
  constructor(){this.reset();}
  reset(){this.since=null;this.last=null;this.key=null;this.fired=false;}
  progress(time){return this.since===null||time-this.last>300?0:Math.min(1,(time-this.since)/TEAR_HOLD_MS);}
  update(gripping,time,key){
    if(!gripping){this.reset();return false;}
    if(this.key!==key||(this.last!==null&&time-this.last>300))this.reset();
    this.key=key;this.last=time;this.since??=time;
    if(this.fired||this.progress(time)<1)return false;
    this.fired=true;return true;
  }
}
