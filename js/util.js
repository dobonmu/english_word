// 공용 유틸리티
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeAnswer(str) {
  return String(str || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function toast(msg, ms = 2200) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), ms);
}

function formatDate(d) {
  const dt = new Date(d);
  const p = n => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth()+1)}-${p(dt.getDate())} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
}

// 전체 단어 목록에 unit 정보를 붙여서 평탄화
function flattenVocab(vocabData) {
  const list = [];
  Object.keys(vocabData).forEach(unit => {
    vocabData[unit].forEach(w => {
      list.push(Object.assign({ unit, key: `${unit}::${w.word}` }, w));
    });
  });
  return list;
}
