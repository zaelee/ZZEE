const list = document.getElementById('inventory');
const search = document.getElementById('search');
const count = document.getElementById('result-count');
let items = [], filter = 'portable', timer;
const names = {portable:'복원 포함', reconnect:'재연결', private:'별도 이전'};
function node(tag, text, cls) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (cls) element.className = cls;
  return element;
}
function render() {
  const query = search.value.trim().toLowerCase();
  const chosen = items.filter(item => (filter === 'all' || item.migration === filter) &&
    [item.name,item.summary,item.source,item.useWhen].join(' ').toLowerCase().includes(query));
  list.replaceChildren();
  count.textContent = `${chosen.length}개 표시 · ${items.length}개 중복 제외 스냅샷`;
  for (const item of chosen) {
    const card = node('article','', 'skill');
    const head = node('div','','skill-head');
    head.append(node('h3',item.name),node('small',names[item.migration]));
    card.append(head,node('p',item.summary),node('p',item.migrationNote,'migration-note'));
    const detail = node('details','');
    detail.append(node('summary','언제 쓰나요? · 요청 예시'),node('p',item.useWhen),node('p',item.example,'example'));
    card.append(detail); list.append(card);
  }
  if (!chosen.length) list.append(node('p','검색 결과가 없습니다. 다른 검색어나 전체 목록을 확인하세요.'));
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(other => other.setAttribute('aria-pressed',String(other===button)));
  render();
}));
search.addEventListener('input',render);
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click',async () => {
  const text = document.getElementById(button.dataset.copy).textContent.trim();
  const toast = document.getElementById('toast');
  try { await navigator.clipboard.writeText(text); toast.textContent = '복사했어요. 새 컴퓨터의 Codex 또는 PowerShell에 붙여넣으세요.'; }
  catch { toast.textContent = '자동 복사가 차단됐습니다. 표시된 내용을 직접 선택해 복사하세요.'; }
  clearTimeout(timer); timer = setTimeout(()=>{toast.textContent='';},4500);
}));
fetch('inventory.json').then(r=>{if(!r.ok)throw new Error('inventory');return r.json();}).then(data=>{items=data.items;render();}).catch(()=>{
  list.replaceChildren(node('p','목록을 불러오지 못했습니다. 별도 스킬 도감 또는 다운로드한 ZIP의 목록을 확인하세요.'));
});
fetch('downloads/release.json').then(r=>{if(!r.ok)throw new Error('release');return r.json();}).then(data=>{
  document.getElementById('zip-size').textContent=`${(data.bytes/1024/1024).toFixed(1)} MB`;
}).catch(()=>{});
