export class HoldReveal {
  constructor(){this.cancel();}
  cancel(){this.start=null;this.point=null;}
  begin(point,time){this.point={...point};this.start=time;}
  move(point){if(this.point&&Math.hypot(point.x-this.point.x,point.y-this.point.y)>18)this.cancel();}
  ready(time){if(this.start===null||time-this.start<5000)return false;this.cancel();return true;}
}
// A single steady fist reveals the cutaway; two fists remain reserved for tearing.
export class FistReveal {
  constructor(){this.reset();}
  reset(){this.since=null;this.fired=false;}
  update(singleClosed,time){
    if(!singleClosed){this.reset();return false;}
    this.since??=time;
    if(this.fired||time-this.since<220)return false;
    this.fired=true;return true;
  }
}
