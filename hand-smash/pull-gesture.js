export function canTear(remaining,count){return count>0&&(count-remaining)/count>=.8;}
export class PullGesture {
  begin(points,time){this.start=points.map(p=>({...p}));this.last=0;this.time=time;this.samples=[{extension:0,time}];}
  cancel(){this.start=null;this.last=0;}
  move(points,time,span){
    if(!this.start||points.length!==this.start.length||time-this.time>240){this.cancel();return {amount:0,strong:false};}
    const distance=points.length===2?Math.abs(points[1].x-points[0].x)-Math.abs(this.start[1].x-this.start[0].x):Math.abs(points[0].x-this.start[0].x);
    const extension=Math.max(0,distance)/Math.max(1,span);
    this.samples.push({extension,time});
    while(this.samples.length>2&&time-this.samples[1].time>120)this.samples.shift();
    const first=this.samples[0],speed=(extension-first.extension)/Math.max(.06,(time-first.time)/1000);
    this.last=extension;this.time=time;
    return {amount:Math.min(1,extension/.23),strong:extension>=.20&&speed>=.55};
  }
}
