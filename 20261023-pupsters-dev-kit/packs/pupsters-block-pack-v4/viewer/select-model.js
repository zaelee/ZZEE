/* Bind the selected dog's metadata before creating the one WebGL viewport. */
(() => {
  'use strict';
  const models=window.PUPSTERS_MODELS;
  const requested=new URLSearchParams(window.location.search).get('dog');
  const model=Object.hasOwn(models,requested)?models[requested]:models.D01;
  document.title=model.displayName+' · 사고멍치 3D';
  document.querySelector('.viewport').dataset.model=model.id;
  document.getElementById('dog-select').value=model.id;
  document.getElementById('dog-name').textContent=model.displayName;
  document.getElementById('dog-feature').textContent=model.feature;
  document.getElementById('dog-attack').textContent=model.attackName+' — '+model.attackMethod;
  document.getElementById('model-meta').textContent=model.parts.length+'개 부품 · '+model.triangles.toLocaleString()+' 삼각형 · 앉은 자세';
  const preview=document.getElementById('model-preview');
  preview.src=model.preview;preview.alt=model.displayName+' 실제 3D 모델 렌더';
  const views=document.getElementById('model-views');
  views.src=model.views;views.alt=model.displayName+' 정면, 측면, 뒷면, 탑뷰';
  for(const a of document.querySelectorAll('[data-download]'))a.href=model[a.dataset.download];
  document.getElementById('dog-select').addEventListener('change',event=>{
    const url=new URL(window.location.href);url.searchParams.set('dog',event.target.value);window.location.assign(url.href);
  });
})();
