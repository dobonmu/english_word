// ===== Writing 학습: 문장 표현을 공부하거나 시험보는 모드 =====
let writingSetupState = {
  mode: 'study',          // study(영어/뜻 카드 학습) | quiz(시험)
  setName: null,
  quizPromptType: 'kr',    // kr(뜻 보고 문장 쓰기) | en(문장 보고 뜻 쓰기)
};

let sentenceStudyState = { setName: null, idx: 0, flipped: false, displayMode: 'both' }; // both | enOnly | krOnly
let writingQuiz = null; // { setName, items: [{it, status, userInput, revealed}], idx }

const WRITING_SET_NAMES = (typeof WRITING_DATA !== 'undefined') ? Object.keys(WRITING_DATA) : [];

function renderWritingSetup() {
  const modeTabs = `
    <div class="seg" style="margin-bottom:16px">
      <button class="${writingSetupState.mode === 'study' ? 'on' : ''}" data-w-mode="study">공부하기</button>
      <button class="${writingSetupState.mode === 'quiz' ? 'on' : ''}" data-w-mode="quiz">시험보기</button>
    </div>
  `;

  if (WRITING_SET_NAMES.length === 0) {
    return modeTabs + `<div class="section-card"><div class="empty">아직 등록된 writing 학습 세트가 없습니다.</div></div>`;
  }
  if (!writingSetupState.setName) writingSetupState.setName = WRITING_SET_NAMES[0];

  const cards = WRITING_SET_NAMES.map(name => `
    <div class="opt-card ${writingSetupState.setName === name ? 'on' : ''}" data-w-set="${escapeHtml(name)}">
      <h3>${escapeHtml(name)}</h3>
      <p>${WRITING_DATA[name].length}개 문장</p>
    </div>
  `).join('');

  if (writingSetupState.mode === 'quiz') {
    return modeTabs + `
      <div class="section-card">
        <div class="section-title">&#9997;&#65039; Writing 시험 설정</div>
        <p class="hint-text" style="margin-bottom:14px">뜻을 보고 영어 문장을 직접 써보거나, 영어 문장을 보고 뜻을 써보는 시험입니다. 채점은 스스로 비교해서 표시합니다.</p>
        <div class="field">
          <label>학습 세트 선택</label>
          <div class="grid-cards">${cards}</div>
        </div>
        <div class="field">
          <label>문제 형식</label>
          <div class="seg">
            <button class="${writingSetupState.quizPromptType === 'kr' ? 'on' : ''}" data-w-prompt="kr">뜻 보고 문장 쓰기</button>
            <button class="${writingSetupState.quizPromptType === 'en' ? 'on' : ''}" data-w-prompt="en">문장 보고 뜻 쓰기</button>
          </div>
        </div>
        <div class="row-btns" style="justify-content:flex-start">
          <button class="big-btn" id="start-writing-quiz-btn">시험 시작</button>
        </div>
      </div>
    `;
  }

  return modeTabs + `
    <div class="section-card">
      <div class="section-title">&#128221; Writing 공부하기</div>
      <p class="hint-text" style="margin-bottom:14px">영어 문장과 뜻을 함께 보면서 실전 표현을 익히는 모드입니다.</p>
      <div class="field">
        <label>학습 세트 선택</label>
        <div class="grid-cards">${cards}</div>
      </div>
      <div class="row-btns" style="justify-content:flex-start">
        <button class="big-btn" id="start-sentence-study-btn">공부 시작</button>
      </div>
    </div>
  `;
}

function bindWritingSetup() {
  document.querySelectorAll('[data-w-mode]').forEach(el => el.addEventListener('click', () => {
    writingSetupState.mode = el.dataset.wMode;
    render();
  }));
  document.querySelectorAll('[data-w-set]').forEach(el => el.addEventListener('click', () => {
    writingSetupState.setName = el.dataset.wSet;
    render();
  }));
  document.querySelectorAll('[data-w-prompt]').forEach(el => el.addEventListener('click', () => {
    writingSetupState.quizPromptType = el.dataset.wPrompt;
    render();
  }));
  const startStudyBtn = document.getElementById('start-sentence-study-btn');
  if (startStudyBtn) startStudyBtn.addEventListener('click', () => {
    sentenceStudyState = { setName: writingSetupState.setName, idx: 0, flipped: false, displayMode: sentenceStudyState.displayMode || 'both' };
    goto('sentenceStudy');
  });
  const startQuizBtn = document.getElementById('start-writing-quiz-btn');
  if (startQuizBtn) startQuizBtn.addEventListener('click', () => {
    startWritingQuiz(writingSetupState.setName, writingSetupState.quizPromptType);
  });
}

// ===== 공부하기: 모두보기 / 영어만 보기 / 뜻만 보기 =====
function renderSentenceStudy() {
  const name = sentenceStudyState.setName;
  const items = (name && WRITING_DATA[name]) || [];
  if (items.length === 0) return `<div class="empty">진행 중인 학습이 없습니다.</div>`;
  const idx = sentenceStudyState.idx;
  const it = items[idx];
  const total = items.length;
  const progressPct = Math.round(((idx + 1) / total) * 100);
  const dots = items.map((_, i) => `<button class="qmark ${i === idx ? 'cur' : ''}" data-s-jump="${i}"></button>`).join('');
  const mode = sentenceStudyState.displayMode || 'both';

  const modeSeg = `
    <div class="seg" style="margin-bottom:12px">
      <button class="${mode === 'both' ? 'on' : ''}" data-s-mode="both">모두보기</button>
      <button class="${mode === 'enOnly' ? 'on' : ''}" data-s-mode="enOnly">영어만 보기</button>
      <button class="${mode === 'krOnly' ? 'on' : ''}" data-s-mode="krOnly">뜻만 보기</button>
    </div>
  `;

  let bodyHtml;
  if (mode === 'both') {
    bodyHtml = `
      <div class="quiz-prompt-label" style="text-align:center">영어 문장</div>
      <div class="quiz-prompt" style="font-size:19px;text-align:center">${escapeHtml(it.en)}</div>
      <div class="quiz-answer-area" style="margin-top:10px">
        <div class="quiz-answer" style="text-align:left">${escapeHtml(it.kr)}</div>
        ${it.point ? `<div class="quiz-note" style="margin-top:10px">${escapeHtml(it.point)}</div>` : ''}
      </div>
      <div class="quiz-actions" style="margin:10px 0 0">
        <button class="qbtn" id="sentence-speak-btn">&#128266; 문장 듣기</button>
      </div>
    `;
  } else {
    const shown = mode === 'enOnly' ? it.en : it.kr;
    const label = mode === 'enOnly' ? '영어 문장' : '뜻';
    bodyHtml = `
      <div class="quiz-prompt-label" style="text-align:center">${label}</div>
      <div class="quiz-prompt" style="font-size:19px;text-align:center">${escapeHtml(shown)}</div>
      <div class="quiz-actions" style="margin:10px 0 0">
        <button class="qbtn" id="sentence-speak-btn">&#128266; 문장 듣기</button>
        <button class="qbtn neutral" id="sentence-reveal-btn">${sentenceStudyState.flipped ? '숨기기' : (mode === 'enOnly' ? '뜻 보기' : '영어 문장 보기')}</button>
      </div>
      ${sentenceStudyState.flipped ? `
        <div class="quiz-answer-area" style="margin-top:10px">
          <div class="quiz-answer" style="text-align:left">${escapeHtml(mode === 'enOnly' ? it.kr : it.en)}</div>
          ${it.point ? `<div class="quiz-note" style="margin-top:10px">${escapeHtml(it.point)}</div>` : ''}
        </div>
      ` : ''}
    `;
  }

  return `
    <div class="quiz-wrap">
      <div class="quiz-progress">
        <span>${idx + 1} / ${total}</span>
        <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${progressPct}%"></div></div>
        <span>${escapeHtml(name)}</span>
      </div>
      ${modeSeg}
      <div class="quiz-card" style="text-align:left;align-items:stretch">
        ${bodyHtml}
      </div>
      <div class="quiz-navrow">
        <button class="nbtn" id="sentence-prev" ${idx === 0 ? 'disabled' : ''}>&#8592;</button>
        <div class="quiz-marks">${dots}</div>
        <button class="nbtn" id="sentence-next" ${idx === total - 1 ? 'disabled' : ''}>&#8594;</button>
      </div>
      <div class="row-btns">
        <button class="lbtn" id="sentence-home-btn">학습 세트 선택으로 돌아가기</button>
      </div>
    </div>
  `;
}

function bindSentenceStudy() {
  const name = sentenceStudyState.setName;
  const items = (name && WRITING_DATA[name]) || [];
  document.querySelectorAll('[data-s-mode]').forEach(b => b.addEventListener('click', () => {
    sentenceStudyState.displayMode = b.dataset.sMode;
    sentenceStudyState.flipped = false;
    render();
  }));
  document.querySelectorAll('[data-s-jump]').forEach(b => b.addEventListener('click', () => {
    sentenceStudyState.idx = parseInt(b.dataset.sJump);
    sentenceStudyState.flipped = false;
    render();
  }));
  const prevBtn = document.getElementById('sentence-prev');
  if (prevBtn) prevBtn.addEventListener('click', () => {
    sentenceStudyState.idx = Math.max(0, sentenceStudyState.idx - 1);
    sentenceStudyState.flipped = false;
    render();
  });
  const nextBtn = document.getElementById('sentence-next');
  if (nextBtn) nextBtn.addEventListener('click', () => {
    sentenceStudyState.idx = Math.min(items.length - 1, sentenceStudyState.idx + 1);
    sentenceStudyState.flipped = false;
    render();
  });
  const revealBtn = document.getElementById('sentence-reveal-btn');
  if (revealBtn) revealBtn.addEventListener('click', () => {
    sentenceStudyState.flipped = !sentenceStudyState.flipped;
    render();
  });
  const speakBtn = document.getElementById('sentence-speak-btn');
  if (speakBtn) speakBtn.addEventListener('click', () => {
    const it = items[sentenceStudyState.idx];
    TTS.speak(it.en, { lang: 'en-US', rate: progress.settings.ttsRate, voiceURI: progress.settings.ttsVoiceEN });
  });
  const homeBtn = document.getElementById('sentence-home-btn');
  if (homeBtn) homeBtn.addEventListener('click', () => goto('writingSetup'));
}

// ===== 시험보기: 뜻 보고 문장 쓰기 / 문장 보고 뜻 쓰기 =====
function startWritingQuiz(setName, promptType) {
  const items = (setName && WRITING_DATA[setName]) || [];
  if (items.length === 0) { toast('선택한 세트에 문장이 없습니다.'); return; }
  writingQuiz = {
    setName,
    promptType,
    items: items.map(it => ({ it, status: null, userInput: '', revealed: false })),
    idx: 0,
  };
  goto('writingQuiz');
}

function renderWritingQuizPage() {
  if (!writingQuiz) return `<div class="empty">진행 중인 시험이 없습니다.</div>`;
  const { items, idx, promptType, setName } = writingQuiz;
  const item = items[idx];
  const total = items.length;
  const progressPct = Math.round(((idx + 1) / total) * 100);
  const isKrPrompt = promptType === 'kr';
  const promptLabel = isKrPrompt ? '뜻을 보고 영어 문장을 쓰세요' : '문장을 보고 뜻을 쓰세요';
  const promptText = isKrPrompt ? item.it.kr : item.it.en;
  const answerText = isKrPrompt ? item.it.en : item.it.kr;

  const marks = items.map((it, i) => {
    let cls = '';
    if (i === idx) cls += ' cur';
    if (it.status === 'correct') cls += ' correct';
    else if (it.status === 'wrong') cls += ' wrong';
    else if (it.status === 'partial') cls += ' partial';
    return `<button class="qmark${cls}" data-wq-jump="${i}"></button>`;
  }).join('');

  return `
    <div class="quiz-wrap">
      <div class="quiz-progress">
        <span>${idx + 1} / ${total}</span>
        <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${progressPct}%"></div></div>
        <span>${escapeHtml(setName)}</span>
      </div>
      <div class="quiz-card" style="text-align:left;align-items:stretch">
        <div class="quiz-prompt-label" style="text-align:center">${promptLabel}</div>
        <div class="quiz-prompt" style="font-size:18px;text-align:center">${escapeHtml(promptText)}</div>
        <div class="quiz-answer-area">
          <textarea id="wq-input" placeholder="${isKrPrompt ? '영어 문장을 입력하세요' : '뜻을 입력하세요'}" rows="3"
            style="width:100%;padding:12px 14px;border:2px solid var(--border-strong);border-radius:var(--radius);background:var(--surface-1);color:var(--text-primary);font-size:15px;line-height:1.5;resize:vertical;box-sizing:border-box" ${item.revealed ? 'disabled' : ''}>${escapeHtml(item.userInput || '')}</textarea>
        </div>
        ${item.revealed ? `
          <div class="quiz-answer-area" style="margin-top:4px">
            <div class="quiz-answer" style="text-align:left">정답: ${escapeHtml(answerText)}</div>
            ${item.it.point ? `<div class="quiz-note">${escapeHtml(item.it.point)}</div>` : ''}
          </div>
        ` : ''}
      </div>
      <div class="quiz-actions">
        ${!item.revealed ? `
          <button class="qbtn neutral" id="wq-reveal-btn">정답 보기</button>
        ` : `
          <button class="qbtn wrong" id="wq-mark-wrong" ${item.status === 'wrong' ? 'disabled' : ''}>틀림으로 표시</button>
          <button class="qbtn correct" id="wq-mark-correct" ${item.status === 'correct' ? 'disabled' : ''}>맞음으로 표시</button>
          <button class="qbtn neutral" id="wq-mark-partial" ${item.status === 'partial' ? 'disabled' : ''}>부분 맞음</button>
        `}
      </div>
      <div class="quiz-navrow">
        <button class="nbtn" id="wq-prev" ${idx === 0 ? 'disabled' : ''}>&#8592;</button>
        <div class="quiz-marks">${marks}</div>
        <button class="nbtn" id="wq-next">${idx === total - 1 ? '&#10003;' : '&#8594;'}</button>
      </div>
      <div class="row-btns">
        <button class="lbtn" id="wq-finish-btn">시험 종료하고 결과 보기</button>
      </div>
    </div>
  `;
}

function commitWritingQuizInput() {
  if (!writingQuiz) return;
  const input = document.getElementById('wq-input');
  const item = writingQuiz.items[writingQuiz.idx];
  if (input && item) item.userInput = input.value;
}

function bindWritingQuizPage() {
  const item = writingQuiz.items[writingQuiz.idx];
  const input = document.getElementById('wq-input');
  if (input) {
    input.focus();
    input.addEventListener('input', () => { item.userInput = input.value; });
  }
  document.querySelectorAll('[data-wq-jump]').forEach(b => b.addEventListener('click', () => {
    commitWritingQuizInput();
    writingQuiz.idx = parseInt(b.dataset.wqJump);
    render();
  }));
  const prevBtn = document.getElementById('wq-prev');
  if (prevBtn) prevBtn.addEventListener('click', () => {
    commitWritingQuizInput();
    writingQuiz.idx = Math.max(0, writingQuiz.idx - 1);
    render();
  });
  const nextBtn = document.getElementById('wq-next');
  if (nextBtn) nextBtn.addEventListener('click', () => {
    commitWritingQuizInput();
    if (writingQuiz.idx === writingQuiz.items.length - 1) finishWritingQuiz();
    else { writingQuiz.idx += 1; render(); }
  });
  const revealBtn = document.getElementById('wq-reveal-btn');
  if (revealBtn) revealBtn.addEventListener('click', () => {
    commitWritingQuizInput();
    item.revealed = true;
    render();
  });
  const markWrong = document.getElementById('wq-mark-wrong');
  if (markWrong) markWrong.addEventListener('click', () => { item.status = 'wrong'; render(); });
  const markCorrect = document.getElementById('wq-mark-correct');
  if (markCorrect) markCorrect.addEventListener('click', () => { item.status = 'correct'; render(); });
  const markPartial = document.getElementById('wq-mark-partial');
  if (markPartial) markPartial.addEventListener('click', () => { item.status = 'partial'; render(); });
  const finishBtn = document.getElementById('wq-finish-btn');
  if (finishBtn) finishBtn.addEventListener('click', () => { commitWritingQuizInput(); finishWritingQuiz(); });
}

function finishWritingQuiz() {
  writingQuiz.items.forEach(it => { if (it.status === null) it.status = 'correct'; });
  goto('writingQuizResult');
}

function renderWritingQuizResultPage() {
  if (!writingQuiz) return `<div class="empty">시험 결과가 없습니다.</div>`;
  const { items, promptType, setName } = writingQuiz;
  const isKrPrompt = promptType === 'kr';
  const correct = items.filter(i => i.status === 'correct').length;
  const wrong = items.filter(i => i.status === 'wrong').length;
  const partial = items.filter(i => i.status === 'partial').length;

  const rows = items.map((item, i) => {
    const promptText = isKrPrompt ? item.it.kr : item.it.en;
    const answerText = isKrPrompt ? item.it.en : item.it.kr;
    const statusLabel = item.status === 'correct' ? '&#10003; 맞음' : item.status === 'wrong' ? '&#10005; 틀림' : '&#8776; 부분맞음';
    const statusClass = item.status === 'correct' ? 'correct' : item.status === 'wrong' ? 'wrong' : 'partial';
    return `
      <div class="section-card" style="margin-bottom:10px">
        <div class="trow-top" style="margin-bottom:8px">
          <span class="status-tag ${statusClass}">${statusLabel}</span>
        </div>
        <div class="quiz-answer" style="text-align:left;margin-bottom:6px">${escapeHtml(promptText)}</div>
        ${item.userInput && item.userInput.trim() ? `<div class="hint-text" style="margin-bottom:6px">내가 쓴 답: ${escapeHtml(item.userInput)}</div>` : `<div class="hint-text" style="margin-bottom:6px">작성한 답이 없습니다.</div>`}
        <div class="quiz-ex">정답: ${escapeHtml(answerText)}</div>
        ${item.it.point ? `<div class="quiz-note">${escapeHtml(item.it.point)}</div>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="section-card">
      <div class="section-title">&#9997;&#65039; Writing 시험 결과</div>
      <p class="hint-text">${escapeHtml(setName)} · 총 ${items.length}문제 중 정답 ${correct} / 오답 ${wrong} ${partial ? `/ 부분맞음 ${partial}` : ''}</p>
      <div class="row-btns" style="justify-content:flex-start;margin-top:10px">
        <button class="big-btn" id="wq-again-btn">다시 시험보기</button>
        <button class="big-btn secondary" id="wq-home-btn">홈으로</button>
      </div>
    </div>
    ${rows}
  `;
}

function bindWritingQuizResultPage() {
  const againBtn = document.getElementById('wq-again-btn');
  if (againBtn) againBtn.addEventListener('click', () => goto('writingSetup'));
  const homeBtn = document.getElementById('wq-home-btn');
  if (homeBtn) homeBtn.addEventListener('click', () => goto('home'));
}
