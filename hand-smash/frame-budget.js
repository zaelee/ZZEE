// Keep interaction smooth while avoiding full-rate rendering of a stationary dessert.
export class FrameBudget {
  constructor(mobile=false){this.mobile=mobile;this.last=-Infinity;}
  due(time,visible,active){
    if(!visible){this.last=-Infinity;return false;}
    const interval=active?(this.mobile?1000/30:0):160;
    if(time-this.last<interval-1)return false;
    this.last=time;return true;
  }
}
