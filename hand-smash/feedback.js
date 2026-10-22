// Short dry snaps plus scattered, dull flakes; no downloaded audio assets.
export function waxSamples(rate, count=1, kind='break', random=Math.random) {
  const tear=kind==='tear', crack=kind==='crack';
  const duration=tear?.42:crack?.13:.3;
  const samples=new Float32Array(Math.ceil(rate*duration));
  const grains=crack?2:tear?14:5+Math.min(8,count);
  for(let grain=0;grain<grains;grain++){
    const start=grain===0?0:random()*duration*.72;
    const decay=tear?.018+random()*.025:.004+random()*.014;
    const frequency=tear?350+random()*600:1100+random()*2500;
    const level=grain===0?.8:.15+random()*.3;
    let low=0;
    for(let i=Math.floor(start*rate);i<samples.length;i++){
      const t=i/rate-start;if(t<0)continue;
      const noise=random()*2-1;low+=.35*(noise-low);
      const attack=Math.min(1,t/.0008),envelope=attack*Math.exp(-t/decay);
      samples[i]+=level*envelope*((tear?low:noise-low)*.75+Math.sin(t*frequency*Math.PI*2)*.25);
    }
  }
  let peak=.001;
  for(let i=0;i<samples.length;i++){
    const t=i/rate;
    samples[i]+=.13*Math.sin(2*Math.PI*160*t)*Math.exp(-t/.022)*Math.min(1,t/.002);
    samples[i]*=Math.min(1,(samples.length-1-i)/(rate*.015));peak=Math.max(peak,Math.abs(samples[i]));
  }
  const gain=Math.min(1,.8/peak);for(let i=0;i<samples.length;i++)samples[i]*=gain;
  return samples;
}
export function vibrationPattern(count){return count>3?[18,12,10]:[8+Math.min(3,count)*4];}
export class WaxFeedback {
  constructor(onError){this.soundOn=true;this.hapticsOn=typeof navigator.vibrate==='function';this.onError=onError;this.sources=new Set();this.buffers=new Map();this.lastSound=-Infinity;this.lastHaptic=-Infinity;}
  unlock(){
    if(!this.soundOn||document.hidden)return;
    try{this.audio ||= new (window.AudioContext||window.webkitAudioContext)();if(this.audio.state!=='running')this.audio.resume().catch(()=>this.fail());}catch{this.fail();}
  }
  fail(){this.soundOn=false;this.stopSound();this.onError?.();}
  setSound(enabled){this.soundOn=enabled;if(enabled)this.unlock();else this.stopSound();}
  stopSound(){for(const source of this.sources){source.stop();source.disconnect();}this.sources.clear();}
  stop(){this.stopSound();if(this.hapticsOn&&this.lastHaptic!==-Infinity)try{navigator.vibrate(0);}catch{}}
  play(count,kind='break'){
    if(count<=0||document.hidden)return;
    const now=performance.now();
    if(kind==='break'&&this.hapticsOn&&now-this.lastHaptic>=80){this.lastHaptic=now;try{navigator.vibrate(vibrationPattern(count));}catch{}}
    if(!this.soundOn||this.audio?.state!=='running'||now-this.lastSound<(kind==='crack'?65:40))return;
    this.lastSound=now;
    try{
      if(this.sources.size>=4){const oldest=this.sources.values().next().value;oldest.stop();this.sources.delete(oldest);}
      const size=count>3?8:1,key=`${kind}:${size}:${Math.floor(Math.random()*3)}`;
      let buffer=this.buffers.get(key);
      if(!buffer){const samples=waxSamples(this.audio.sampleRate,size,kind);buffer=this.audio.createBuffer(1,samples.length,this.audio.sampleRate);buffer.copyToChannel(samples,0);this.buffers.set(key,buffer);}
      const source=this.audio.createBufferSource(),gain=this.audio.createGain();source.buffer=buffer;
      source.playbackRate.value=.94+Math.random()*.12;gain.gain.value=kind==='crack'?.18:.28;
      source.connect(gain).connect(this.audio.destination);this.sources.add(source);
      source.onended=()=>{this.sources.delete(source);source.disconnect();gain.disconnect();};source.start();
    }catch{this.fail();}
  }
}
