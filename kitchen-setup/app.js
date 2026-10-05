const rows = [...document.querySelectorAll('#inventory tbody tr')];
const search = document.querySelector('#search');
const category = document.querySelector('#category');
const status = document.querySelector('#status');
const count = document.querySelector('#count');

function filterRows() {
  const query = search.value.trim().toLocaleLowerCase('ko');
  let visible = 0;
  for (const row of rows) {
    const matches = (!category.value || row.dataset.category === category.value)
      && (!status.value || row.dataset.status === status.value)
      && (!query || row.textContent.toLocaleLowerCase('ko').includes(query));
    row.hidden = !matches;
    if (matches) visible += 1;
  }
  count.textContent = `${visible} / ${rows.length}개 품목`;
  document.querySelector('#empty').hidden = visible !== 0;
}

search.addEventListener('input', filterRows);
category.addEventListener('change', filterRows);
status.addEventListener('change', filterRows);
document.querySelector('#reset').addEventListener('click', () => {
  search.value = category.value = status.value = '';
  filterRows();
});
document.querySelector('#copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(document.querySelector('#resume-prompt').textContent);
    document.querySelector('#copy-result').textContent = '이어하기 문구를 복사했어요.';
  } catch {
    document.querySelector('#copy-result').textContent = '아래 문구를 직접 선택해 복사해 주세요.';
  }
});
filterRows();
