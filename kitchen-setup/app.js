
const cards = [...document.querySelectorAll('.card[data-category]')];
const search = document.querySelector('#search');
const status = document.querySelector('#status');
const filters = [...document.querySelectorAll('[data-filter]')];
let category = '';
function filterCards() {
  const query = search.value.trim().toLocaleLowerCase('ko');
  let visible = 0;
  for (const card of cards) {
    const matches = (!category || card.dataset.category === category)
      && (!status.value || card.dataset.status === status.value)
      && (!query || card.textContent.toLocaleLowerCase('ko').includes(query));
    card.hidden = !matches;
    if (matches) visible++;
  }
  document.querySelector('#count').textContent = `${visible} / ${cards.length}개 품목`;
  document.querySelector('#empty').hidden = visible !== 0;
}
for (const button of filters) button.addEventListener('click', () => {
  category = button.dataset.filter;
  for (const filter of filters) filter.setAttribute('aria-pressed', String(filter === button));
  filterCards();
});
search.addEventListener('input', filterCards);
status.addEventListener('change', filterCards);
function resetFilters() {
  search.value = status.value = category = '';
  for (const filter of filters) filter.setAttribute('aria-pressed', String(filter.dataset.filter === ''));
  filterCards();
}
document.querySelector('#reset').addEventListener('click', resetFilters);
for (const link of document.querySelectorAll('.budget a[href^="#"]')) {
  link.addEventListener('click', resetFilters);
}
document.querySelector('#copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(document.querySelector('#resume-prompt').textContent);
    document.querySelector('#copy-result').textContent = '이어하기 문구를 복사했어요.';
  } catch { document.querySelector('#copy-result').textContent = '아래 문구를 직접 선택해 복사해 주세요.'; }
});
for (const img of document.querySelectorAll('.media img')) {
  const showFallback = () => { img.hidden = true; img.nextElementSibling.hidden = false; };
  img.addEventListener('error', showFallback);
  if (img.complete && !img.naturalWidth) showFallback();
}
filterCards();
