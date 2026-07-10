function renderQuizResult() {
  if (!quiz) return `<div class="empty">시험 결과가 없습니다.</div>`;
  const total = quiz.items.length;
  const correct = quiz.items.filter(i => i.status === 'correct').length;
  const wrong = quiz.items.filter(i => i.status === 'wrong').length;
  const partial = quiz.items.filter(i => i.status === 'partial').length;
  const scorePct = total ? Math.round((correct / total) * 100) : 0;

  const rows = quiz.items.map(it => {
    const iconCls = it.status === 'correct' ? 'ok' : (it.status === 'wrong' ? 'no' : 'pt');
    const iconChar = it.status === 'correct' ? '&#10003;' : (it.status === 'wrong' ? '&#10005;' : '&#8776;');
    const userPart = quiz.setup.isWrite && it.userInput ? ` <span style="color:var(--text-muted)">(입력: ${escapeHtml(it.userInput)})</span>` : '';
    return `
      <div class="result-row">
        <div class="result-icon ${iconCls}">${iconChar}</div>
        <div class="rw">${escapeHtml(it.word.word)}</div>
        <div class="rm">${escapeHtml(it.word.meaning)}${userPart}</div>
        <button class="badge speak" data-speak="${escapeHtml(it.word.key)}" title="읽기">&#128266;</button>
      </div>`;
  }).join('');

  return `
    <div class="quiz-result">
      <div class="result-sub">${quiz.setup.isMock ? '모의고사 결과 (기록에 반영되지 않음)' : '시험 결과'} · ${describeScope(quiz.setup)}</div>
      <div class="result-score">${scorePct}<span style="font-size:20px">점</span></div>
      <div class="result-sub">총 ${total}문제 · 정답 ${correct} · 오답 ${wrong}${partial ? ` · 부분맞춤 ${partial}` : ''}</div>
      <div class="row-btns" style="margin-bottom:18px">
        <button class="big-btn" id="retry-wrong-btn" ${wrong === 0 ? 'disabled' : ''}>틀린 문제만 다시 풀기</button>
        <button class="big-btn secondary" id="retry-all-btn">같은 범위로 다시 풀기</button>
        <button class="big-btn secondary" id="go-home-btn">홈으로</button>
      </div>
      <div class="result-list">${rows}</div>
    </div>
  `;
}

function bindQuizResult() {
  document.querySelectorAll('[data-speak]').forEach(b => b.addEventListener('click', () => {
    const it = quiz.items.find(i => i.word.key === b.dataset.speak);
    if (it) TTS.speakWordAndMeaning(it.word.word, it.word.meaning, progress.settings);
  }));
  const retryWrong = document.getElementById('retry-wrong-btn');
  if (retryWrong) retryWrong.addEventListener('click', () => {
    const wrongWords = quiz.items.filter(i => i.status === 'wrong').map(i => i.word);
    const setup = Object.assign({}, quiz.setup, { scopeType: 'wrongList', _words: wrongWords, count: wrongWords.length });
    startQuiz(setup);
  });
  const retryAll = document.getElementById('retry-all-btn');
  if (retryAll) retryAll.addEventListener('click', () => {
    startQuiz(Object.assign({}, quiz.setup));
  });
  const goHome = document.getElementById('go-home-btn');
  if (goHome) goHome.addEventListener('click', () => goto('home'));
}
