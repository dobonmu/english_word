// ===== Speaking 연습: Q&A 스피킹 자료를 듣고 따라 말하는 모드 =====
let speakingSetupState = {
  setName: null,
  fullWriteUnit: 'whole',  // whole(단원 전체) | qa(질문/답변 개별)
  fullWriteHint: 'kr',     // kr(뜻만 보고) | none(아무것도 안 보고)
};
let speakingSession = null; // { setName, items, idx }
let speakingFullWriteQuiz = null; // { setName, unit, hint, items: [{promptKr, answer, userInput, revealed, diff, correct}], idx }

const SPEAKING_SET_NAMES = (typeof SPEAKING_DATA !== 'undefined') ? Object.keys(SPEAKING_DATA) : [];

function startSpeaking(setName) {
  const items = (setName && SPEAKING_DATA[setName]) || [];
  if (items.length === 0) { toast('선택한 세트에 문답이 없습니다.'); return false; }
  speakingSession = { setName, items, idx: 0, revealed: items.map(() => false) };
  goto('speakingPractice');
  return true;
}

let speakingSetupMode = 'practice'; // practice | fullWrite

function renderSpeakingSetup() {
  const modeTabs = `
    <div class="seg" style="margin-bottom:16px">
      <button class="${speakingSetupMode === 'practice' ? 'on' : ''}" data-sp-mode="practice">듣고 따라 말하기</button>
      <button class="${speakingSetupMode === 'fullWrite' ? 'on' : ''}" data-sp-mode="fullWrite">전문 작성 시험</button>
    </div>
  `;

  if (SPEAKING_SET_NAMES.length === 0) {
    return modeTabs + `<div class="section-card"><div class="empty">아직 등록된 Speaking 학습 세트가 없습니다.</div></div>`;
  }
  if (!speakingSetupState.setName) speakingSetupState.setName = SPEAKING_SET_NAMES[0];

  const cards = SPEAKING_SET_NAMES.map(name => `
    <div class="opt-card ${speakingSetupState.setName === name ? 'on' : ''}" data-sp-set="${escapeHtml(name)}">
      <h3>${escapeHtml(name.replace(/^Part(\d+)_/, 'Part $1. '))}</h3>
      <p>${SPEAKING_DATA[name].length}개 문답</p>
    </div>
  `).join('');

  if (speakingSetupMode === 'fullWrite') {
    const topWrong = renderTopWrongWords(`speakingFull::${speakingSetupState.setName}`);
    return modeTabs + `
      <div class="section-card">
        <div class="section-title">&#128221;&#10145;&#65039;&#128273; Speaking 전문 작성 시험</div>
        <p class="hint-text" style="margin-bottom:14px">질문과 모범 답변을 처음부터 끝까지 직접 타이핑해서 채점받는 시험입니다. 글자 단위로 정답과 완전히 일치해야 정답 처리되며, 어디가 틀렸는지 표시해줍니다.</p>
        <div class="field">
          <label>주제(단원) 선택</label>
          <div class="grid-cards">${cards}</div>
        </div>
        <div class="field">
          <label>작성 단위</label>
          <div class="seg">
            <button class="${speakingSetupState.fullWriteUnit === 'whole' ? 'on' : ''}" data-sp-fwunit="whole">단원 전체 한번에</button>
            <button class="${speakingSetupState.fullWriteUnit === 'qa' ? 'on' : ''}" data-sp-fwunit="qa">질문/답변별로</button>
          </div>
        </div>
        <div class="field">
          <label>힌트 수준</label>
          <div class="seg">
            <button class="${speakingSetupState.fullWriteHint === 'kr' ? 'on' : ''}" data-sp-fwhint="kr">뜻만 보고 작성</button>
            <button class="${speakingSetupState.fullWriteHint === 'none' ? 'on' : ''}" data-sp-fwhint="none">아무것도 안 보고 작성</button>
          </div>
        </div>
        ${topWrong}
        <div class="row-btns" style="justify-content:flex-start">
          <button class="big-btn" id="start-speaking-fullwrite-btn">시험 시작</button>
        </div>
      </div>
    `;
  }

  return modeTabs + `
    <div class="section-card">
      <div class="section-title">&#127908; Speaking 연습 설정</div>
      <p class="hint-text" style="margin-bottom:14px">주제별 질문과 모범 답변을 듣고 따라 말하는 연습 모드입니다. 답변 속 대체 가능한 표현도 함께 익혀보세요. 마이크나 녹음은 사용하지 않습니다.</p>
      <div class="field">
        <label>주제(단원) 선택</label>
        <div class="grid-cards">${cards}</div>
      </div>
      <div class="row-btns" style="justify-content:flex-start">
        <button class="big-btn" id="start-speaking-btn">Speaking 시작</button>
      </div>
    </div>
  `;
}

function bindSpeakingSetup() {
  document.querySelectorAll('[data-sp-mode]').forEach(el => el.addEventListener('click', () => {
    speakingSetupMode = el.dataset.spMode;
    render();
  }));
  document.querySelectorAll('[data-sp-set]').forEach(el => el.addEventListener('click', () => {
    speakingSetupState.setName = el.dataset.spSet;
    render();
  }));
  document.querySelectorAll('[data-sp-fwunit]').forEach(el => el.addEventListener('click', () => {
    speakingSetupState.fullWriteUnit = el.dataset.spFwunit;
    render();
  }));
  document.querySelectorAll('[data-sp-fwhint]').forEach(el => el.addEventListener('click', () => {
    speakingSetupState.fullWriteHint = el.dataset.spFwhint;
    render();
  }));
  const startBtn = document.getElementById('start-speaking-btn');
  if (startBtn) startBtn.addEventListener('click', () => {
    startSpeaking(speakingSetupState.setName);
  });
  const startFullWriteBtn = document.getElementById('start-speaking-fullwrite-btn');
  if (startFullWriteBtn) startFullWriteBtn.addEventListener('click', () => {
    startSpeakingFullWrite(speakingSetupState.setName, speakingSetupState.fullWriteUnit, speakingSetupState.fullWriteHint);
  });
}

function renderSpeakingPractice() {
  if (!speakingSession) return `<div class="empty">진행 중인 Speaking 연습이 없습니다.</div>`;
  const { setName, items, idx } = speakingSession;
  const it = items[idx];
  const total = items.length;
  const progressPct = Math.round(((idx + 1) / total) * 100);
  const dots = items.map((_, i) => `<button class="qmark ${i === idx ? 'cur' : ''}" data-sp-jump="${i}"></button>`).join('');
  const revealed = speakingSession.revealed[idx];
  const markKeyPrefix = `speaking::${setName}::${idx}`;
  const hasPoint = !!(it.point && it.point.trim());

  return `
    <div class="quiz-wrap">
      <div class="quiz-progress">
        <span>${idx + 1} / ${total}</span>
        <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${progressPct}%"></div></div>
        <span>${escapeHtml(setName.replace(/^Part(\d+)_/, 'Part $1. '))}</span>
      </div>
      <div class="quiz-card" style="text-align:left;align-items:stretch">
        <div class="quiz-prompt-label" style="text-align:center">Q. 질문</div>
        <div class="quiz-prompt" style="font-size:18px;text-align:center">${escapeHtml(it.q_en)}</div>
        <div class="cmean" style="text-align:center;margin:4px 0 0;font-size:14px">${escapeHtml(it.q_kr)}</div>
        <div class="quiz-actions" style="margin:10px 0 0">
          <button class="qbtn" id="sp-speak-q-btn">&#128266; 질문 듣기</button>
          <button class="qbtn neutral" id="sp-reveal-btn">${revealed ? '답변 숨기기' : '모범 답변 보기'}</button>
        </div>
        ${revealed ? `
          <div class="quiz-answer-area" style="margin-top:14px">
            <div class="quiz-prompt-label">A. 모범 답변 (따라 말해보세요)</div>
            <div class="quiz-answer" style="text-align:left;margin-top:6px">${escapeHtml(it.a_en)}</div>
            <div class="hint-text" style="margin-top:6px">${escapeHtml(it.a_kr)}</div>
            <div class="quiz-actions" style="margin:10px 0 0">
              <button class="qbtn" id="sp-speak-a-btn">&#128266; 답변 듣기</button>
            </div>
            ${hasPoint ? `
              <div class="quiz-prompt-label" style="margin-top:14px">대체 가능한 표현</div>
              <div class="point-groups">${renderPointGroups(it.point, markKeyPrefix)}</div>
              <div class="hint-text" style="margin-top:6px">표현을 누르면 틀린 부분(빨강)/중요 표시(노랑)를 남길 수 있어요.</div>
            ` : ''}
          </div>
        ` : ''}
      </div>
      <div class="quiz-navrow">
        <button class="nbtn" id="sp-prev" ${idx === 0 ? 'disabled' : ''}>&#8592;</button>
        <div class="quiz-marks">${dots}</div>
        <button class="nbtn" id="sp-next" ${idx === total - 1 ? 'disabled' : ''}>&#8594;</button>
      </div>
      <div class="row-btns">
        <button class="lbtn" id="sp-home-btn">주제 선택으로 돌아가기</button>
      </div>
    </div>
  `;
}

function bindSpeakingPractice() {
  const { items, idx } = speakingSession;
  const it = items[idx];
  document.querySelectorAll('[data-sp-jump]').forEach(b => b.addEventListener('click', () => {
    speakingSession.idx = parseInt(b.dataset.spJump);
    render();
  }));
  const prevBtn = document.getElementById('sp-prev');
  if (prevBtn) prevBtn.addEventListener('click', () => {
    speakingSession.idx = Math.max(0, speakingSession.idx - 1);
    render();
  });
  const nextBtn = document.getElementById('sp-next');
  if (nextBtn) nextBtn.addEventListener('click', () => {
    speakingSession.idx = Math.min(items.length - 1, speakingSession.idx + 1);
    render();
  });
  const revealBtn = document.getElementById('sp-reveal-btn');
  if (revealBtn) revealBtn.addEventListener('click', () => {
    speakingSession.revealed[speakingSession.idx] = !speakingSession.revealed[speakingSession.idx];
    render();
  });
  const speakQBtn = document.getElementById('sp-speak-q-btn');
  if (speakQBtn) speakQBtn.addEventListener('click', () => {
    TTS.speak(it.q_en, { lang: 'en-US', rate: progress.settings.ttsRate, voiceURI: progress.settings.ttsVoiceEN });
  });
  const speakABtn = document.getElementById('sp-speak-a-btn');
  if (speakABtn) speakABtn.addEventListener('click', () => {
    TTS.speak(it.a_en, { lang: 'en-US', rate: progress.settings.ttsRate, voiceURI: progress.settings.ttsVoiceEN });
  });
  const homeBtn = document.getElementById('sp-home-btn');
  if (homeBtn) homeBtn.addEventListener('click', () => goto('speakingSetup'));
  bindMarkableSentence(document.getElementById('main'));
}

// ===== Speaking 전문 작성 시험: 단원 전체 또는 질문/답변별로 직접 타이핑 =====
// unit: whole(단원 전체 Q+A를 모두 이어서) | qa(질문/답변을 각각 개별 아이템으로)
// hint: kr(한글 뜻 보여줌) | none(아무 힌트도 없음, 순수 암기)
function startSpeakingFullWrite(setName, unit, hint) {
  const items = (setName && SPEAKING_DATA[setName]) || [];
  if (items.length === 0) { toast('선택한 세트에 문답이 없습니다.'); return; }
  let quizItems;
  if (unit === 'whole') {
    const promptKr = items.map(it => `Q. ${it.q_kr} A. ${it.a_kr}`).join(' ');
    const answer = items.map(it => `${it.q_en} ${it.a_en}`).join(' ');
    quizItems = [{ label: '단원 전체', promptKr, answer, userInput: '', revealed: false, diff: null }];
  } else {
    quizItems = [];
    items.forEach((it, i) => {
      quizItems.push({ label: `${i + 1}번 질문`, promptKr: it.q_kr, answer: it.q_en, userInput: '', revealed: false, diff: null });
      quizItems.push({ label: `${i + 1}번 답변`, promptKr: it.a_kr, answer: it.a_en, userInput: '', revealed: false, diff: null });
    });
  }
  speakingFullWriteQuiz = { setName, unit, hint, items: quizItems, idx: 0 };
  goto('speakingFullWrite');
}

function renderSpeakingFullWritePage() {
  if (!speakingFullWriteQuiz) return `<div class="empty">진행 중인 시험이 없습니다.</div>`;
  const { setName, unit, hint, items, idx } = speakingFullWriteQuiz;
  const item = items[idx];
  const total = items.length;
  const progressPct = Math.round(((idx + 1) / total) * 100);

  const marks = items.map((it, i) => {
    let cls = '';
    if (i === idx) cls += ' cur';
    if (it.diff) cls += it.correct ? ' correct' : ' wrong';
    return `<button class="qmark${cls}" data-spfw-jump="${i}"></button>`;
  }).join('');

  return `
    <div class="quiz-wrap">
      <div class="quiz-progress">
        <span>${idx + 1} / ${total}</span>
        <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${progressPct}%"></div></div>
        <span>${escapeHtml(setName.replace(/^Part(\d+)_/, 'Part $1. '))} · ${unit === 'whole' ? '전체' : '질문/답변별'} · ${hint === 'kr' ? '뜻 보고' : '암기'}</span>
      </div>
      <div class="quiz-card" style="text-align:left;align-items:stretch">
        <div class="quiz-prompt-label" style="text-align:center">${escapeHtml(item.label)} 영어로 작성하세요</div>
        ${hint === 'kr' ? `<div class="quiz-prompt" style="font-size:16px;text-align:left;line-height:1.6">${escapeHtml(item.promptKr)}</div>` : `<p class="hint-text" style="text-align:center">힌트 없이 암기해서 작성해보세요.</p>`}
        <div class="quiz-answer-area">
          <textarea id="spfw-input" placeholder="영어로 작성하세요" rows="${unit === 'whole' ? 10 : 3}"
            style="width:100%;padding:12px 14px;border:2px solid var(--border-strong);border-radius:var(--radius);background:var(--surface-1);color:var(--text-primary);font-size:15px;line-height:1.5;resize:vertical;box-sizing:border-box" ${item.revealed ? 'disabled' : ''}>${escapeHtml(item.userInput || '')}</textarea>
        </div>
        ${item.revealed ? `
          <div class="quiz-answer-area" style="margin-top:4px">
            <div class="${item.correct ? 'quiz-answer' : 'quiz-answer wrong-answer'}" style="text-align:left">
              ${item.correct ? '&#10003; 정답입니다!' : '&#10005; 정답과 다릅니다.'}
            </div>
            <div class="quiz-prompt-label" style="margin-top:10px">정답 (틀린 부분 표시)</div>
            <div class="diff-box">${renderDiffAnswer(item.diff)}</div>
            ${!item.correct ? `
              <div class="quiz-prompt-label" style="margin-top:10px">내가 쓴 답</div>
              <div class="diff-box">${renderDiffUserInput(item.diff)}</div>
            ` : ''}
          </div>
        ` : ''}
      </div>
      <div class="quiz-actions">
        ${!item.revealed ? `
          <button class="qbtn neutral" id="spfw-check-btn">채점하기</button>
        ` : `
          <button class="qbtn" id="spfw-retry-btn">다시 써보기</button>
        `}
      </div>
      <div class="quiz-navrow">
        <button class="nbtn" id="spfw-prev" ${idx === 0 ? 'disabled' : ''}>&#8592;</button>
        <div class="quiz-marks">${marks}</div>
        <button class="nbtn" id="spfw-next">${idx === total - 1 ? '&#10003;' : '&#8594;'}</button>
      </div>
      <div class="row-btns">
        <button class="lbtn" id="spfw-finish-btn">시험 종료하고 결과 보기</button>
      </div>
    </div>
  `;
}

function commitSpeakingFullWriteInput() {
  if (!speakingFullWriteQuiz) return;
  const input = document.getElementById('spfw-input');
  const item = speakingFullWriteQuiz.items[speakingFullWriteQuiz.idx];
  if (input && item && !item.revealed) item.userInput = input.value;
}

function checkSpeakingFullWriteItem(item, setName) {
  item.revealed = true;
  item.diff = diffWords(item.answer, item.userInput);
  item.correct = isExactMatch(item.answer, item.userInput);
  if (!item.correct) recordWrongWords(`speakingFull::${setName}`, item.diff);
}

function bindSpeakingFullWritePage() {
  const { items, idx, setName } = speakingFullWriteQuiz;
  const item = items[idx];
  const input = document.getElementById('spfw-input');
  if (input) {
    input.focus();
    input.addEventListener('input', () => { item.userInput = input.value; });
  }
  document.querySelectorAll('[data-spfw-jump]').forEach(b => b.addEventListener('click', () => {
    commitSpeakingFullWriteInput();
    speakingFullWriteQuiz.idx = parseInt(b.dataset.spfwJump);
    render();
  }));
  const prevBtn = document.getElementById('spfw-prev');
  if (prevBtn) prevBtn.addEventListener('click', () => {
    commitSpeakingFullWriteInput();
    speakingFullWriteQuiz.idx = Math.max(0, speakingFullWriteQuiz.idx - 1);
    render();
  });
  const nextBtn = document.getElementById('spfw-next');
  if (nextBtn) nextBtn.addEventListener('click', () => {
    commitSpeakingFullWriteInput();
    if (speakingFullWriteQuiz.idx === items.length - 1) finishSpeakingFullWrite();
    else { speakingFullWriteQuiz.idx += 1; render(); }
  });
  const checkBtn = document.getElementById('spfw-check-btn');
  if (checkBtn) checkBtn.addEventListener('click', () => {
    commitSpeakingFullWriteInput();
    checkSpeakingFullWriteItem(item, setName);
    render();
  });
  const retryBtn = document.getElementById('spfw-retry-btn');
  if (retryBtn) retryBtn.addEventListener('click', () => {
    item.revealed = false;
    item.diff = null;
    render();
  });
  const finishBtn = document.getElementById('spfw-finish-btn');
  if (finishBtn) finishBtn.addEventListener('click', () => { commitSpeakingFullWriteInput(); finishSpeakingFullWrite(); });
}

function finishSpeakingFullWrite() {
  speakingFullWriteQuiz.items.forEach(it => {
    if (!it.revealed) checkSpeakingFullWriteItem(it, speakingFullWriteQuiz.setName);
  });
  goto('speakingFullWriteResult');
}

function renderSpeakingFullWriteResultPage() {
  if (!speakingFullWriteQuiz) return `<div class="empty">시험 결과가 없습니다.</div>`;
  const { setName, unit, items } = speakingFullWriteQuiz;
  const correct = items.filter(i => i.correct).length;
  const total = items.length;

  const rows = items.map(item => `
    <div class="section-card" style="margin-bottom:10px">
      <div class="trow-top" style="margin-bottom:8px">
        <span class="status-tag ${item.correct ? 'correct' : 'wrong'}">${item.correct ? '&#10003; 정답' : '&#10005; 틀림'}</span>
      </div>
      <div class="quiz-prompt-label">${escapeHtml(item.label)}</div>
      <div class="diff-box" style="margin-top:6px">${renderDiffAnswer(item.diff)}</div>
      ${!item.correct ? `
        <div class="quiz-prompt-label" style="margin-top:8px">내가 쓴 답</div>
        <div class="diff-box">${renderDiffUserInput(item.diff)}</div>
      ` : ''}
    </div>
  `).join('');

  return `
    <div class="section-card">
      <div class="section-title">&#128221;&#10145;&#65039;&#128273; Speaking 전문 작성 시험 결과</div>
      <p class="hint-text">${escapeHtml(setName.replace(/^Part(\d+)_/, 'Part $1. '))} · ${unit === 'whole' ? '단원 전체' : '질문/답변별'} · 총 ${total}문제 중 정답 ${correct} / 오답 ${total - correct}</p>
      ${renderTopWrongWords(`speakingFull::${setName}`)}
      <div class="row-btns" style="justify-content:flex-start;margin-top:10px">
        <button class="big-btn" id="spfw-again-btn">다시 시험보기</button>
        <button class="big-btn secondary" id="spfw-home-btn">홈으로</button>
      </div>
    </div>
    ${rows}
  `;
}

function bindSpeakingFullWriteResultPage() {
  const againBtn = document.getElementById('spfw-again-btn');
  if (againBtn) againBtn.addEventListener('click', () => goto('speakingSetup'));
  const homeBtn = document.getElementById('spfw-home-btn');
  if (homeBtn) homeBtn.addEventListener('click', () => goto('home'));
}
