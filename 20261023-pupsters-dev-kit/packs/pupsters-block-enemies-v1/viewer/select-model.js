/* Bind the selected enemy before creating the one WebGL viewport. */
(() => {
  'use strict';
  const models=window.PUPSTERS_MODELS;
  const requested=new URLSearchParams(window.location.search).get('enemy');
  const model=Object.hasOwn(models,requested)?models[requested]:models.E01;
  document.title=model.displayName+' · 사고멍치 3D';
  document.querySelector('.viewport').dataset.model=model.id;
  document.getElementById('enemy-select').value=model.id;
  document.getElementById('enemy-name').textContent=model.displayName;
  document.getElementById('enemy-feature').textContent=model.feature;
  document.getElementById('enemy-role').textContent=model.role+' — '+model.roleDescription;
  document.getElementById('model-meta').textContent=model.parts.length+'개 부품 · '+model.triangles.toLocaleString()+' 삼각형 · 정적 모델';
  const preview=document.getElementById('model-preview');
  preview.src=model.preview;preview.alt=model.displayName+' 실제 3D 모델 렌더';
  const views=document.getElementById('model-views');
  views.src=model.views;views.alt=model.displayName+' 정면, 측면, 뒷면, 탑뷰';
  for(const a of document.querySelectorAll('[data-download]'))a.href=model[a.dataset.download];
  document.getElementById('enemy-select').addEventListener('change',event=>{
    const url=new URL(window.location.href);url.searchParams.set('enemy',event.target.value);window.location.assign(url.href);
  });
})();
