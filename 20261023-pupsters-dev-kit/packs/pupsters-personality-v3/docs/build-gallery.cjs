const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const dogs=[
 ['D01','shiba','시바견','뼈다귀 사고뭉치','능청스러운 눈썹과 비대칭 미소. 작은 뼈다귀를 입에 물고 공격을 준비해요.','#f1e9d7'],
 ['D02','bulldog','불도그','볼빵빵 고집쟁이','공기를 가득 머금은 양 볼, 삐죽한 작은 이빨, 바람처럼 말린 귀끝.','#f8e4cc'],
 ['D03','husky','허스키','시크한 냉기쟁이','귀끝과 꼬리 끝에 붙은 얼음 결정. 차가운 눈빛과 볼의 서리 조각.','#dff4fa'],
 ['D04','beagle','비글','침흘리는 말썽꾸러기','능청스러운 옆눈질과 입꼬리의 짧은 침방울. 작은 흰 침거품이 입가에 붙었어요.','#e3f1f5'],
 ['D05','poodle','푸들','찌릿한 예민보스','정수리·귀끝·꼬리에 노랑과 하늘색 번개 털. 귀끝의 작은 스파크가 찌릿!','#f4f2cd'],
 ['D06','border-collie','보더콜리','종이 왕관의 자칭 대장','접히고 찢어진 종이 왕관에 테이프까지. 삐딱하게 왕관을 쓰고 의기양양하게 웃어요.','#e2f2e7']
].map(([id,slug,name,personality,description,color])=>({id,slug,name,personality,description,color,file:`characters/${id}-${slug}.png`,before:`before/${id}-${slug}.png`}));
const attacks=[
 ['뼈다귀 뱉기','작은 뼈를 입에 물고 힘을 모았다가, 입으로 퉤! 하고 뱉어요.','입 · 뼈 발사체'],
 ['압축 공기탄','양 볼에 공기를 가득 모았다가 입으로 공기 충격탄을 뿜어요.','입 · 공기탄'],
 ['냉기 숨결','숨을 들이마신 뒤 입에서 차가운 냉기를 길게 내뿜어요.','입 · 냉기'],
 ['끈적한 침탄','입에 모은 침을 작은 거품과 함께 퉤! 뱉어요. 끈적한 침탄이 적에게 달라붙어요.','입 · 침 발사체'],
 ['정전기 방출','번개처럼 선 털에 전기를 모은 뒤, 정수리와 귀끝에서 찌릿한 전기를 방출해요.','털 · 정전기'],
 ['지원 짖음','힘차게 짖어 파동을 보내고 주변 아군을 강화해요. 직접 공격보다 지원 역할이에요.','짖음 · 아군 지원']
];
dogs.forEach((d,i)=>{[d.attackName,d.attackMethod,d.attackSource]=attacks[i]});
dogs[0].file='characters/D01-shiba-bone.png';
dogs[0].animation='previews/D01-shiba-bone-spit.webp';
dogs[3].file='characters/D04-beagle-drool.png';
dogs[3].effect='effects/FX04-drool.png';
dogs[4].file='characters/D05-poodle-electric.png';
dogs[5].file='characters/D06-border-collie-crown.png';
fs.mkdirSync(path.join(root,'before'),{recursive:true});
for(const d of dogs){assert(fs.existsSync(path.join(root,d.file)));const original=['D01','D04','D05','D06'].includes(d.id)?path.join(root,`characters/${d.id}-${d.slug}.png`):path.resolve(root,'../pupsters-attack-motion-v1/frames',`${d.id}-${d.slug}`,'00-idle.png');fs.copyFileSync(original,path.join(root,d.before))}
fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({version:5,date:'2026-10-23',mode:'built-in image_gen',scope:'Six representative designs and attack descriptions; revised Beagle saliva, electric Poodle and crowned Collie; separate saliva projectile. Existing Shiba mouth-spit animation retained.',characters:dogs},null,2));
const cards=dogs.map(d=>`<article style="--accent:${d.color}"><header><span class="number">${d.id}</span><h2>${d.name}</h2><a href="${d.file}" download>PNG ↓</a></header><a class="art" href="${d.file}" target="_blank"><img src="${d.file}" alt="${d.name}: ${d.personality}"></a><div class="copy"><h3>${d.personality}</h3><p>${d.description}</p><div class="attack"><span>${d.attackSource}</span><h4>${d.attackName}</h4><p>${d.attackMethod}</p>${d.effect?`<a class="effect-link" href="${d.effect}" download>침탄 PNG ↓</a>`:''}</div>${d.animation?`<details class="motion"><summary>뼈 뱉는 모션 보기</summary><img class="before" src="${d.animation}" alt="입에 문 뼈를 뱉는 시바견 애니메이션"><a href="attack-viewer.html">재생·정지하며 살펴보기</a></details>`:''}<details><summary>이전 모습과 비교</summary><img class="before" src="${d.before}" alt="변경 전 ${d.name}"></details></div></article>`).join('');
fs.writeFileSync(path.join(root,'index.html'),`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>사고멍치 · 캐릭터와 공격</title><link rel="stylesheet" href="style.css"></head><body><div class="page-head"><p class="eyebrow">PUPSTERS / CHARACTER & ATTACK 05</p><h1>각자의 성격,<br>각자의 공격.</h1><p class="intro">왕관 쓴 대장, 침 흘리는 비글, 찌릿한 푸들.<br>성격과 능력이 겉모습에서도 보여요.</p><span class="stamp">외형 6종 · 공격 방식 · 침탄 PNG · 시바 모션</span></div><main>${cards}</main><footer>각 이미지를 누르면 원본을 크게 볼 수 있습니다. <a href="README.md">파일 안내</a> · <a href="ATTACKS.md">공격 방식 표</a></footer></body></html>`);
console.log('Six-character gallery built.');
