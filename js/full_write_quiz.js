// ===== 전문(全文) 작성 시험 공용 로직 =====
// Writing(지문 전체/문장별)과 Speaking(단원 전체/질문·답변별)에서 공통으로 쓰는
// "채점 + 틀린 부분 표시 + 자주 틀리는 단어 통계"를 모아둔다.

// statKey(예: 세트/단원 이름) 기준으로 틀린 단어 누적 카운트를 올린다.
function recordWrongWords(statKey, diffResult) {
  diffResult.forEach(d => {
    if (d.type === 'wrong' || d.type === 'missing') {
      const word = d.type === 'wrong' ? d.answerWord : d.word;
      const key = `${statKey}::${word.toLowerCase()}`;
      progress.fullWriteWrongWords[key] = (progress.fullWriteWrongWords[key] || 0) + 1;
    }
  });
  saveProgress(progress);
}

// statKey 기준 자주 틀리는 단어 Top N을 반환: [{ word, count }]
function topWrongWords(statKey, limit = 8) {
  const prefix = `${statKey}::`;
  const entries = Object.keys(progress.fullWriteWrongWords)
    .filter(k => k.startsWith(prefix))
    .map(k => ({ word: k.slice(prefix.length), count: progress.fullWriteWrongWords[k] }))
    .filter(e => e.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  return entries;
}

// diffWords() 결과를 정답 기준으로 색칠해서 보여주는 HTML(정답 문장 안에서 틀린/빠진 부분 표시)
function renderDiffAnswer(diffResult) {
  return diffResult.filter(d => d.type !== 'extra').map(d => {
    if (d.type === 'same') return `<span class="diff-same">${escapeHtml(d.word)}</span>`;
    if (d.type === 'missing') return `<span class="diff-missing" title="놓친 단어">${escapeHtml(d.word)}</span>`;
    if (d.type === 'wrong') return `<span class="diff-wrong" title="내가 쓴 표현: ${escapeHtml(d.word)}">${escapeHtml(d.answerWord)}</span>`;
    return '';
  }).join(' ');
}

// diffWords() 결과를 사용자가 입력한 순서대로 보여주는 HTML(추가로 잘못 쓴 단어까지 표시)
function renderDiffUserInput(diffResult) {
  return diffResult.filter(d => d.type !== 'missing').map(d => {
    if (d.type === 'same') return `<span class="diff-same">${escapeHtml(d.word)}</span>`;
    if (d.type === 'wrong') return `<span class="diff-wrong" title="정답: ${escapeHtml(d.answerWord)}">${escapeHtml(d.word)}</span>`;
    if (d.type === 'extra') return `<span class="diff-extra" title="정답에 없는 단어">${escapeHtml(d.word)}</span>`;
    return '';
  }).join(' ');
}

function renderTopWrongWords(statKey) {
  const top = topWrongWords(statKey);
  if (top.length === 0) return '';
  return `
    <div class="quiz-note" style="margin-top:10px">
      자주 틀리는 부분: ${top.map(e => `<span class="wrongword-chip">${escapeHtml(e.word)} (${e.count})</span>`).join(' ')}
    </div>
  `;
}
