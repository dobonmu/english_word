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

// ===== 전문(全文) 작성 시험 채점용 단어 단위 diff =====
// 정답 여부(전체 일치)는 글자 단위로 완전히 동일해야만 통과(엄격). 대신 화면에 보여줄
// "어디가 틀렸는지"는 LCS(최장 공통 부분열) 기반 단어 단위 diff로 계산해서, 사용자가
// 어느 단어를 놓쳤는지/잘못 썼는지/추가로 썼는지 한눈에 볼 수 있게 한다.
function tokenizeForDiff(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean);
}

// LCS 기반 단어 단위 diff. 반환: [{ type: 'same'|'wrong'|'missing'|'extra', word }]
// same: 정답과 정확히 일치하는 단어 / wrong: 정답 위치에 다른 단어를 씀 / missing: 정답에는
// 있지만 사용자가 안 쓴 단어 / extra: 사용자가 정답에 없는 단어를 추가로 씀.
function diffWords(answerText, userText) {
  const a = tokenizeForDiff(answerText);
  const b = tokenizeForDiff(userText);
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const result = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      result.push({ type: 'same', word: a[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: 'missing', word: a[i] });
      i++;
    } else {
      result.push({ type: 'extra', word: b[j] });
      j++;
    }
  }
  while (i < n) { result.push({ type: 'missing', word: a[i] }); i++; }
  while (j < m) { result.push({ type: 'extra', word: b[j] }); j++; }
  // 연속된 missing 바로 뒤 extra(또는 그 반대)는 "정답 위치에 다른 단어를 쓴 것"(wrong)으로 재해석
  const merged = [];
  for (let k = 0; k < result.length; k++) {
    const cur = result[k];
    const next = result[k + 1];
    if (cur.type === 'missing' && next && next.type === 'extra') {
      merged.push({ type: 'wrong', word: next.word, answerWord: cur.word });
      k++;
    } else if (cur.type === 'extra' && next && next.type === 'missing') {
      merged.push({ type: 'wrong', word: cur.word, answerWord: next.word });
      k++;
    } else {
      merged.push(cur);
    }
  }
  return merged;
}

function isExactMatch(answerText, userText) {
  return String(answerText || '').trim() === String(userText || '').trim();
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
