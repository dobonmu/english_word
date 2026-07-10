function renderQuiz() {
  if (!quiz) return `<div class="empty">진행 중인 시험이 없습니다.</div>`;
  const item = quizCurrent();
  const setup = quiz.setup;
  const total = quiz.items.length;
  const progressPct = Math.round(((quiz.idx + 1) / total) * 100);

  const isListen = setup.promptType === 'listen';
  const isWord = setup.promptType === 'word';
  // prompt: 화면에 보여줄 문제, answer: 정답으로 보여줄 것
  let promptLabel, promptText, answerText;
  if (setup.isWrite) {
    if (isListen) {
      promptLabel = '단어를 듣고 영어 스펠링을 입력하세요';
      promptText = item.word.meaning;
    } else {
      promptLabel = '뜻을 보고 영어 단어를 입력하세요';
      promptText = item.word.meaning;
    }
    answerText = item.word.word;
  } else if (isWord) {
    promptLabel = '이 단어의 뜻은?';
    promptText = item.word.word;
    answerText = item.word.meaning;
  } else {
    promptLabel = '이 뜻에 해당하는 단어는?';
    promptText = item.word.meaning;
    answerText = item.word.word;
  }

  const marks = quiz.items.map((it, i) => {
    let cls = '';
    if (i === quiz.idx) cls += ' cur';
    if (it.status === 'correct') cls += ' correct';
    else if (it.status === 'wrong') cls += ' wrong';
    else if (it.status === 'partial') cls += ' partial';
    return `<button class="qmark${cls}" data-jump="${i}"></button>`;
  }).join('');

  let bodyHtml = '';
  if (setup.isWrite) {
    bodyHtml = `
      <div class="quiz-card">
        <div class="quiz-prompt-label">${promptLabel}</div>
        ${isListen ? `
          <button class="big-btn secondary" id="listen-btn" style="margin-top:6px">&#128266; 단어 듣기</button>
          <div class="quiz-prompt" style="font-size:16px;color:var(--text-secondary);margin-top:6px">${escapeHtml(item.word.meaning)}</div>
        ` : `<div class="quiz-prompt">${escapeHtml(promptText)}</div>`}
        <div class="quiz-answer-area">
          <input type="text" class="quiz-input ${item.revealed ? (item.status === 'correct' ? 'correct' : (item.status === 'partial' ? '' : 'wrong')) : ''}"
            id="write-input" placeholder="영어 단어 입력" autocomplete="off" autocapitalize="off" spellcheck="false"
            value="${escapeHtml(item.userInput || '')}" ${item.revealed ? 'disabled' : ''}>
          ${item.revealed ? `
            <div class="quiz-answer" style="margin-top:10px">정답: ${escapeHtml(item.word.word)}</div>
            ${item.word.ex_en ? `<div class="quiz-ex"><span class="en">${escapeHtml(item.word.ex_en)}</span><br>${escapeHtml(item.word.ex_kr || '')}</div>` : ''}
          ` : ''}
        </div>
      </div>
      <div class="quiz-actions">
        ${!item.revealed ? `
          <button class="qbtn correct" id="submit-write">채점하기</button>
          <button class="qbtn neutral" id="reveal-write">정답 보기</button>
        ` : `
          <button class="qbtn wrong" id="mark-wrong" ${item.status === 'wrong' ? 'disabled' : ''}>틀림으로 표시</button>
          <button class="qbtn correct" id="mark-correct" ${item.status === 'correct' ? 'disabled' : ''}>맞음으로 표시</button>
          <button class="qbtn neutral" id="mark-partial" ${item.status === 'partial' ? 'disabled' : ''}>부분 맞음</button>
        `}
      </div>
    `;
  } else {
    bodyHtml = `
      <div class="quiz-card">
        <div class="quiz-prompt-label">${promptLabel}</div>
        <div class="quiz-prompt">${escapeHtml(promptText)}</div>
        ${item.revealed ? `
          <div class="quiz-answer-area">
            <div class="quiz-answer">${escapeHtml(answerText)}</div>
            ${item.word.ex_en ? `<div class="quiz-ex"><span class="en">${escapeHtml(item.word.ex_en)}</span><br>${escapeHtml(item.word.ex_kr || '')}</div>` : ''}
          </div>
        ` : ''}
      </div>
      <div class="quiz-actions">
        ${!item.revealed ? `
          <button class="qbtn neutral" id="reveal-self">정답 보기</button>
        ` : `
          <button class="qbtn wrong" id="mark-wrong">&#10005; 틀렸어요</button>
          <button class="qbtn neutral" id="mark-partial">&#8776; 부분 맞음</button>
          <button class="qbtn correct" id="mark-correct">&#10003; 맞았어요</button>
        `}
      </div>
      <div class="hint-text" style="text-align:center">그냥 다음으로 넘어가면 정답으로 처리됩니다. 틀렸다면 꼭 '틀렸어요'를 눌러주세요.</div>
    `;
  }

  return `
    <div class="quiz-wrap">
      <div class="quiz-progress">
        <span>${quiz.idx + 1} / ${total}</span>
        <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${progressPct}%"></div></div>
        <span>${describeScope(setup)}</span>
      </div>
      ${bodyHtml}
      <div class="quiz-navrow">
        <button class="nbtn" id="quiz-prev" ${quiz.idx === 0 ? 'disabled' : ''}>&#8592;</button>
        <div class="quiz-marks">${marks}</div>
        <button class="nbtn" id="quiz-next">${quiz.idx === total - 1 ? '&#10003;' : '&#8594;'}</button>
      </div>
      <div class="row-btns">
        <button class="lbtn" id="quiz-finish-btn">시험 종료하고 결과 보기</button>
      </div>
    </div>
  `;
}

function bindQuiz() {
  const item = quizCurrent();
  const setup = quiz.setup;

  document.querySelectorAll('[data-jump]').forEach(b => b.addEventListener('click', () => {
    commitWriteInputIfAny();
    quizGoto(parseInt(b.dataset.jump)); render();
  }));
  const prevBtn = document.getElementById('quiz-prev');
  if (prevBtn) prevBtn.addEventListener('click', () => { commitWriteInputIfAny(); quizGoto(quiz.idx - 1); render(); });
  const nextBtn = document.getElementById('quiz-next');
  if (nextBtn) nextBtn.addEventListener('click', () => {
    commitWriteInputIfAny();
    if (quiz.idx === quiz.items.length - 1) quizFinish();
    else { quizGoto(quiz.idx + 1); render(); }
  });
  const finishBtn = document.getElementById('quiz-finish-btn');
  if (finishBtn) finishBtn.addEventListener('click', () => { commitWriteInputIfAny(); quizFinish(); });

  if (setup.isWrite) {
    const input = document.getElementById('write-input');
    if (input) {
      input.focus();
      input.addEventListener('input', () => { item.userInput = input.value; });
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); document.getElementById('submit-write')?.click(); }
      });
    }
    const submitBtn = document.getElementById('submit-write');
    if (submitBtn) submitBtn.addEventListener('click', () => {
      const val = input ? input.value : '';
      item.userInput = val;
      const correct = normalizeAnswer(val) === normalizeAnswer(item.word.word) && val.trim() !== '';
      quizMark(correct ? 'correct' : 'wrong');
      render();
    });
    const revealBtn = document.getElementById('reveal-write');
    if (revealBtn) revealBtn.addEventListener('click', () => {
      item.revealed = true; render();
    });
    const listenBtn = document.getElementById('listen-btn');
    if (listenBtn) listenBtn.addEventListener('click', () => {
      TTS.speak(item.word.word, { lang: 'en-US', rate: progress.settings.ttsRate, voiceURI: progress.settings.ttsVoiceEN });
    });
  }

  const markWrong = document.getElementById('mark-wrong');
  if (markWrong) markWrong.addEventListener('click', () => { quizMark('wrong'); render(); });
  const markCorrect = document.getElementById('mark-correct');
  if (markCorrect) markCorrect.addEventListener('click', () => { quizMark('correct'); render(); });
  const markPartial = document.getElementById('mark-partial');
  if (markPartial) markPartial.addEventListener('click', () => { quizMark('partial'); render(); });
  const revealSelf = document.getElementById('reveal-self');
  if (revealSelf) revealSelf.addEventListener('click', () => { item.revealed = true; render(); });
}

function commitWriteInputIfAny() {
  if (!quiz || !quiz.setup.isWrite) return;
  const input = document.getElementById('write-input');
  const item = quizCurrent();
  if (input && item) item.userInput = input.value;
}
