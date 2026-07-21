// ===== 문장 안 개별 단어 마킹 (틀린 부분 / 중요 표시) =====
// Writing, Speaking 화면에서 공통으로 사용. 클릭할 때마다
// 표시없음 -> 틀림(빨강) -> 중요(노랑) -> 표시없음 순으로 순환한다.
function wordMarkOf(markKey) {
  return progress.wordMarks[markKey] || null;
}

function cycleWordMark(markKey) {
  const cur = progress.wordMarks[markKey] || null;
  const next = cur === null ? 'wrong' : (cur === 'wrong' ? 'important' : null);
  if (next === null) delete progress.wordMarks[markKey];
  else progress.wordMarks[markKey] = next;
  saveProgress(progress);
}

// text를 단어 단위로 토큰화해서, 각 단어를 클릭 가능한 span으로 렌더링한다.
// keyPrefix는 마킹을 저장할 때 쓰는 고유 키의 접두어(문장/세트를 구분).
function renderMarkableSentence(text, keyPrefix) {
  const tokens = text.split(/(\s+)/); // 공백도 보존해서 다시 합치면 원문이 되도록
  let wordIdx = 0;
  return tokens.map(tok => {
    if (!tok.trim()) return escapeHtml(tok);
    const idx = wordIdx++;
    const markKey = `${keyPrefix}::${idx}`;
    const mark = wordMarkOf(markKey);
    const cls = mark ? ` wmark-${mark}` : '';
    return `<span class="wmark${cls}" data-wmark-key="${escapeHtml(markKey)}" title="클릭하면 틀린 부분/중요 표시를 바꿀 수 있어요">${escapeHtml(tok)}</span>`;
  }).join('');
}

function bindMarkableSentence(container) {
  if (!container) return;
  container.querySelectorAll('[data-wmark-key]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      cycleWordMark(el.dataset.wmarkKey);
      const mark = wordMarkOf(el.dataset.wmarkKey);
      el.classList.remove('wmark-wrong', 'wmark-important');
      if (mark) el.classList.add(`wmark-${mark}`);
    });
  });
}
