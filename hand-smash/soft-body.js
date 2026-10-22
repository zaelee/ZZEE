export function springStep(value, velocity, target, dt, reducedMotion=false) {
  if(reducedMotion)return {value:target+(value-target)*Math.exp(-dt*18),velocity:0};
  const steps=Math.max(1,Math.ceil(Math.min(dt,.1)*120)),h=Math.min(dt,.1)/steps;
  for(let i=0;i<steps;i++){velocity+=((target-value)*115-velocity*11)*h;value+=velocity*h;}
  return {value,velocity};
}
export function squishScale(compression){
  const y=1-Math.max(-.08,Math.min(.36,compression));
  const side=1/Math.sqrt(y);return {x:side,y,z:side};
}
// All core meshes share root-local coordinates; their common deformation keeps layers together.
export function applySoftMaterial(material,uniforms){
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
      uniform vec3 softPoint;
      uniform float softDent;
      vec3 deformMochi(vec3 p){
        vec3 d=p-softPoint;
        float influence=exp(-dot(d,d)*6.5);
        vec3 direction=normalize(softPoint+vec3(0.0,0.0,0.12));
        return p-direction*softDent*influence;
      }
    `).replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
      vec3 softN=normalize(objectNormal);
      vec3 softT=normalize(cross(softN,abs(softN.y)<0.9?vec3(0,1,0):vec3(1,0,0)));
      vec3 softB=cross(softN,softT);
      vec3 softP=deformMochi(position);
      objectNormal=normalize(cross(deformMochi(position+softT*0.001)-softP,deformMochi(position+softB*0.001)-softP));
    `).replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed=deformMochi(transformed);');
  };
  material.customProgramCacheKey=()=> 'mochi-local-dent-v1';
}
