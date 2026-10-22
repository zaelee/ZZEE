import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PinchRotation} from './rotate-gesture.js';
function hand(pinched=true,closed=false,scale=1){
 const h=Array.from({length:21},()=>({x:.5,y:.6}));h[0]={x:.5,y:.9};h[5]={x:.4,y:.6};h[17]={x:.6,y:.6};
 for(const tip of [8,12,16,20])h[tip]={x:.5,y:closed?.8:.3};
 h[4]={x:pinched?.51:.72,y:h[8].y};return h.map(p=>({x:p.x*scale,y:p.y*scale}));
}
const ids=[[{categoryName:'Left'}]];
function move(g,h,x,time,id=ids){return g.update([h],[h.map(p=>({x:p.x*500+x,y:p.y*500}))],id,time,500);}
test('pinch starts without jump, moves model, and release suppresses accidental smash',()=>{
 const g=new PinchRotation();assert.equal(move(g,hand(),0,100).dx,0);
 const moved=move(g,hand(),40,160);assert.ok(moved.active&&moved.dx>0);
 assert.equal(move(g,hand(false),40,220).blocked,true);
 assert.equal(move(g,hand(false),40,450).blocked,false);
});
test('fists are reserved for squeeze and tear; pinch is independent of hand size',()=>{
 const g=new PinchRotation();assert.equal(move(g,hand(true,true),0,100).active,false);
 assert.equal(move(g,hand(true,false,.5),0,200).active,true);
});
test('lost tracking, hand swaps and large jumps never spin the model',()=>{
 const g=new PinchRotation();move(g,hand(),0,100);
 assert.equal(move(g,hand(),40,400).dx,0);
 assert.equal(move(g,hand(),50,450,[[{categoryName:'Right'}]]).dx,0);
 assert.equal(move(g,hand(),400,500).dx,0);
 assert.equal(g.update([],[],[],550,500).active,false);
 g.reset();assert.equal(move(g,hand(),20,600).dx,0);
});
test('ambiguous two-pinches suppress damage without choosing a rotation hand',()=>{
 const g=new PinchRotation(),h=hand(),p=h.map(p=>({x:p.x*500,y:p.y*500}));
 const result=g.update([h,h],[p,p],[[{categoryName:'Left'}],[{categoryName:'Right'}]],100,500);
 assert.equal(result.active,false);assert.equal(result.blocked,true);assert.equal(result.dx,0);
});
