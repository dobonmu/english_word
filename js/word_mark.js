// ===== 문장 안 개별 단어 마킹 (틀린 부분 / 중요 표시) + 메모 =====
// Writing, Speaking 화면에서 공통으로 사용. 클릭할 때마다
// 표시없음 -> 틀림(빨강) -> 중요(노랑) -> 표시없음 순으로 순환한다.
// 별도로 마련된 메모 아이콘을 누르면 해당 표현에 짧은 메모를 남길 수 있다.
function wordMarkOf(markKey) {
  return progress.wordMarks[markKey] || null;
}

function wordNoteOf(markKey) {
  return progress.wordNotes[markKey] || '';
}

function setWordNote(markKey, text) {
  const trimmed = (text || '').trim();
  if (trimmed) progress.wordNotes[markKey] = trimmed;
  else delete progress.wordNotes[markKey];
  saveProgress(progress);
}

function cycleWordMark(markKey) {
  const cur = progress.wordMarks[markKey] || null;
  const next = cur === null ? 'wrong' : (cur === 'wrong' ? 'important' : null);
  if (next === null) delete progress.wordMarks[markKey];
  else progress.wordMarks[markKey] = next;
  saveProgress(progress);
}

// 마킹된(빨강/노랑) 표현 뒤에 붙는 메모 아이콘 + 메모가 있으면 미리보기 텍스트.
// 마킹이 없는 표현에는 메모 아이콘을 굳이 보여주지 않아 화면이 지저분해지지 않게 한다.
function renderNoteAffix(markKey) {
  const mark = wordMarkOf(markKey);
  if (!mark) return '';
  const note = wordNoteOf(markKey);
  const hasNote = !!note;
  const title = hasNote ? `메모: ${note}` : '메모 남기기';
  return `<button type="button" class="note-btn ${hasNote ? 'has-note' : ''}" data-note-key="${escapeHtml(markKey)}" title="${escapeHtml(title)}">&#128221;</button>${hasNote ? `<span class="note-preview">${escapeHtml(note)}</span>` : ''}`;
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
    return `<span class="wmark-unit"><span class="wmark${cls}" data-wmark-key="${escapeHtml(markKey)}" title="클릭하면 틀린 부분/중요 표시를 바꿀 수 있어요">${escapeHtml(tok)}</span>${renderNoteAffix(markKey)}</span>`;
  }).join('');
}

function bindMarkableSentence(container) {
  if (!container) return;
  container.querySelectorAll('[data-wmark-key]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      cycleWordMark(el.dataset.wmarkKey);
      render();
    });
  });
  bindNoteButtons(container);
}

function bindNoteButtons(container) {
  if (!container) return;
  container.querySelectorAll('[data-note-key]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = el.dataset.noteKey;
      const cur = wordNoteOf(key);
      const input = window.prompt('메모를 입력하세요 (비워두면 삭제됩니다)', cur);
      if (input === null) return; // 취소
      setWordNote(key, input);
      render();
    });
  });
}
