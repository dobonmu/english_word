// ===== Writing 연습: 단어를 활용해 직접 영작문을 써보는 모드 + 문장 표현 학습 =====
let writingSetupState = {
  mode: 'wordPractice',   // wordPractice(단어 활용 작문) | sentenceStudy(문장 표현 학습)
  scopeType: 'unit',      // unit | multiUnit | all | wrongList | starredList
  scopeUnits: [],
  count: 20,
  setName: null,
};

let writingSession = null; // { words: [...], idx, inputs: [...] }
let sentenceStudyState = { setName: null, idx: 0, flipped: false };

const WRITING_SET_NAMES = (typeof WRITING_DATA !== 'undefined') ? Object.keys(WRITING_DATA) : [];

function buildWritingScopeWords(setup) {
  if (setup.scopeType === 'wrongList') return getWrongWords();
  if (setup.scopeType === 'starredList') return getStarredWords();
  if (setup.scopeType === 'all') return ALL_WORDS.slice();
  if (setup.scopeType === 'multiUnit') return ALL_WORDS.filter(w => setup.scopeUnits.includes(w.unit));
  const unit = setup.scopeUnits[0] || state.unit;
  return ALL_WORDS.filter(w => w.unit === unit);
}

function startWriting(setup) {
  const pool = buildWritingScopeWords(setup);
  if (pool.length === 0) { toast('선택한 범위에 단어가 없습니다.'); return false; }
  const count = Math.min(setup.count || 20, pool.length);
  const words = shuffleArray(pool).slice(0, count);
  writingSession = {
    setup,
    words,
    idx: 0,
    inputs: words.map(() => ''),
    revealed: words.map(() => false),
    startedAt: Date.now(),
  };
  goto('writingPractice');
  return true;
}

function renderWritingSetup() {
  const modeTabs = `
    <div class="seg" style="margin-bottom:16px">
      <button class="${writingSetupState.mode === 'wordPractice' ? 'on' : ''}" data-w-mode="wordPractice">단어 활용 작문</button>
      <button class="${writingSetupState.mode === 'sentenceStudy' ? 'on' : ''}" data-w-mode="sentenceStudy">문장 표현 학습</button>
    </div>
  `;

  if (writingSetupState.mode === 'sentenceStudy') {
    return modeTabs + renderSentenceStudySetup();
  }

  const scopeTypes = [
    { id: 'unit', label: '단원별 연습', desc: '선택한 한 단원의 단어로 작문 연습' },
    { id: 'multiUnit', label: '여러 단원 연습', desc: '원하는 단원을 여러 개 골라서 연습' },
    { id: 'all', label: '전체 단원 연습', desc: '모든 단원의 단어를 섞어서 연습' },
    { id: 'wrongList', label: '자주 틀린 단어', desc: '오답 기록이 있는 단어로 연습' },
    { id: 'starredList', label: '중요 표시 단어', desc: '중요 표시한 단어로 연습' },
  ];

  const scopeCards = scopeTypes.map(s => `
    <div class="opt-card ${writingSetupState.scopeType === s.id ? 'on' : ''}" data-wscope="${s.id}">
      <h3>${s.label}</h3>
      <p>${s.desc}</p>
    </div>
  `).join('');

  const unitPicker = writingSetupState.scopeType === 'unit' ? `
    <div class="field">
      <label>단원 선택</label>
      <select id="w-unit-select">
        ${UNIT_NAMES.map(u => `<option value="${escapeHtml(u)}" ${writingSetupState.scopeUnits[0] === u ? 'selected' : ''}>${escapeHtml(u)}</option>`).join('')}
      </select>
    </div>` : '';

  const multiUnitPicker = writingSetupState.scopeType === 'multiUnit' ? `
    <div class="field">
      <label>단원 선택 (여러 개 가능)</label>
      <div class="unit-check-list">
        ${UNIT_NAMES.map(u => `<button class="unit-check ${writingSetupState.scopeUnits.includes(u) ? 'on' : ''}" data-w-multi-unit="${escapeHtml(u)}">${escapeHtml(u)}</button>`).join('')}
      </div>
    </div>` : '';

  const scopeCountInfo = (() => {
    if (writingSetupState.scopeType === 'wrongList') return getWrongWords().length;
    if (writingSetupState.scopeType === 'starredList') return getStarredWords().length;
    return null;
  })();

  return modeTabs + `
    <div class="section-card">
      <div class="section-title">&#128221; 영작문 연습 설정</div>
      <p class="hint-text" style="margin-bottom:14px">단어마다 그 단어를 사용한 영어 문장을 직접 작문해보고, 예시 예문과 비교하며 스스로 확인하는 모드입니다. 정답을 채점하지는 않으니 자유롭게 작문 연습에 활용하세요.</p>
      <div class="field">
        <label>연습 범위</label>
        <div class="grid-cards">${scopeCards}</div>
        ${scopeCountInfo !== null ? `<div class="hint-text">현재 ${scopeCountInfo}개 단어가 있습니다.</div>` : ''}
      </div>
      ${unitPicker}
      ${multiUnitPicker}
      <div class="field">
        <label>단어 수 (기본 20)</label>
        <input type="number" id="w-count-input" min="1" max="200" value="${writingSetupState.count}">
      </div>
      <div class="row-btns" style="justify-content:flex-start">
        <button class="big-btn" id="start-writing-btn">작문 연습 시작</button>
      </div>
    </div>
  `;
}

function renderSentenceStudySetup() {
  if (WRITING_SET_NAMES.length === 0) {
    return `<div class="section-card"><div class="empty">아직 등록된 문장 학습 세트가 없습니다.</div></div>`;
  }
  if (!sentenceStudyState.setName) sentenceStudyState.setName = WRITING_SET_NAMES[0];
  const cards = WRITING_SET_NAMES.map(name => `
    <div class="opt-card ${sentenceStudyState.setName === name ? 'on' : ''}" data-w-set="${escapeHtml(name)}">
      <h3>${escapeHtml(name)}</h3>
      <p>${WRITING_DATA[name].length}개 문장</p>
    </div>
  `).join('');

  return `
    <div class="section-card">
      <div class="section-title">&#128221; 문장 표현 학습 설정</div>
      <p class="hint-text" style="margin-bottom:14px">실제 서식/이메일에 쓰이는 영어 문장을 통째로 익히고, 문장에 담긴 표현과 학습 포인트(패턴, 동의어, 관용구)를 함께 정리하는 모드입니다.</p>
      <div class="field">
        <label>학습 세트 선택</label>
        <div class="grid-cards">${cards}</div>
      </div>
      <div class="row-btns" style="justify-content:flex-start">
        <button class="big-btn" id="start-sentence-study-btn">문장 학습 시작</button>
      </div>
    </div>
  `;
}

function bindSentenceStudySetup() {
  document.querySelectorAll('[data-w-set]').forEach(el => el.addEventListener('click', () => {
    sentenceStudyState.setName = el.dataset.wSet;
    render();
  }));
  const startBtn = document.getElementById('start-sentence-study-btn');
  if (startBtn) startBtn.addEventListener('click', () => {
    sentenceStudyState.idx = 0;
    sentenceStudyState.flipped = false;
    goto('sentenceStudy');
  });
}

function renderSentenceStudy() {
  const name = sentenceStudyState.setName;
  const items = (name && WRITING_DATA[name]) || [];
  if (items.length === 0) return `<div class="empty">진행 중인 문장 학습이 없습니다.</div>`;
  const idx = sentenceStudyState.idx;
  const it = items[idx];
  const total = items.length;
  const progressPct = Math.round(((idx + 1) / total) * 100);
  const dots = items.map((_, i) => `<button class="qmark ${i === idx ? 'cur' : ''}" data-s-jump="${i}"></button>`).join('');

  return `
    <div class="quiz-wrap">
      <div class="quiz-progress">
        <span>${idx + 1} / ${total}</span>
        <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${progressPct}%"></div></div>
        <span>${escapeHtml(name)}</span>
      </div>
      <div class="quiz-card" style="text-align:left;align-items:stretch">
        <div class="quiz-prompt-label" style="text-align:center">영어 문장</div>
        <div class="quiz-prompt" style="font-size:19px;text-align:center">${escapeHtml(it.en)}</div>
        <div class="quiz-actions" style="margin:10px 0 0">
          <button class="qbtn" id="sentence-speak-btn">&#128266; 문장 듣기</button>
          <button class="qbtn neutral" id="sentence-reveal-btn">${sentenceStudyState.flipped ? '해석 숨기기' : '해석 보기'}</button>
        </div>
        ${sentenceStudyState.flipped ? `
          <div class="quiz-answer-area" style="margin-top:10px">
            <div class="quiz-answer" style="text-align:left">${escapeHtml(it.kr)}</div>
            ${it.point ? `<div class="quiz-note" style="margin-top:10px">${escapeHtml(it.point)}</div>` : ''}
          </div>
        ` : ''}
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

function bindWritingSetup() {
  document.querySelectorAll('[data-w-mode]').forEach(el => el.addEventListener('click', () => {
    writingSetupState.mode = el.dataset.wMode;
    render();
  }));
  if (writingSetupState.mode === 'sentenceStudy') { bindSentenceStudySetup(); return; }
  document.querySelectorAll('[data-wscope]').forEach(el => el.addEventListener('click', () => {
    writingSetupState.scopeType = el.dataset.wscope;
    if (writingSetupState.scopeType === 'unit' && writingSetupState.scopeUnits.length === 0) {
      writingSetupState.scopeUnits = [state.unit || UNIT_NAMES[0]];
    }
    render();
  }));
  const unitSelect = document.getElementById('w-unit-select');
  if (unitSelect) unitSelect.addEventListener('change', () => {
    writingSetupState.scopeUnits = [unitSelect.value];
  });
  document.querySelectorAll('[data-w-multi-unit]').forEach(el => el.addEventListener('click', () => {
    const u = el.dataset.wMultiUnit;
    const i = writingSetupState.scopeUnits.indexOf(u);
    if (i >= 0) writingSetupState.scopeUnits.splice(i, 1);
    else writingSetupState.scopeUnits.push(u);
    render();
  }));
  const countInput = document.getElementById('w-count-input');
  if (countInput) countInput.addEventListener('input', () => {
    writingSetupState.count = parseInt(countInput.value) || 1;
  });
  const startBtn = document.getElementById('start-writing-btn');
  if (startBtn) startBtn.addEventListener('click', () => {
    if (writingSetupState.scopeType === 'unit' && writingSetupState.scopeUnits.length === 0) {
      writingSetupState.scopeUnits = [state.unit || UNIT_NAMES[0]];
    }
    if (writingSetupState.scopeType === 'multiUnit' && writingSetupState.scopeUnits.length === 0) {
      toast('단원을 하나 이상 선택하세요.'); return;
    }
    startWriting(Object.assign({}, writingSetupState));
  });
}

function renderWritingPractice() {
  if (!writingSession) return `<div class="empty">진행 중인 작문 연습이 없습니다.</div>`;
  const { words, idx } = writingSession;
  const w = words[idx];
  const total = words.length;
  const progressPct = Math.round(((idx + 1) / total) * 100);
  const revealed = writingSession.revealed[idx];
  const dots = words.map((_, i) => `<button class="qmark ${i === idx ? 'cur' : ''} ${writingSession.inputs[i] ? 'correct' : ''}" data-w-jump="${i}"></button>`).join('');

  return `
    <div class="quiz-wrap">
      <div class="quiz-progress">
        <span>${idx + 1} / ${total}</span>
        <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${progressPct}%"></div></div>
      </div>
      <div class="quiz-card" style="text-align:left;align-items:stretch">
        <div class="quiz-prompt-label" style="text-align:center">이 단어를 사용해서 영어 문장을 만들어보세요</div>
        <div class="quiz-prompt" style="text-align:center">${escapeHtml(w.word)}</div>
        <div class="cmean" style="text-align:center;margin-bottom:6px">${escapeHtml(w.meaning)}</div>
        <div class="quiz-answer-area">
          <textarea id="writing-input" placeholder="${escapeHtml(w.word)}를 사용한 영어 문장을 입력하세요" rows="3"
            style="width:100%;padding:12px 14px;border:2px solid var(--border-strong);border-radius:var(--radius);background:var(--surface-1);color:var(--text-primary);font-size:15px;line-height:1.5;resize:vertical;box-sizing:border-box">${escapeHtml(writingSession.inputs[idx] || '')}</textarea>
        </div>
        ${revealed ? `
          <div class="quiz-answer-area" style="margin-top:4px">
            <div class="quiz-answer" style="text-align:left">예시 예문</div>
            <div class="quiz-ex" style="margin-top:6px">
              <span class="en">${escapeHtml(w.ex_en || '')}</span><br>${escapeHtml(w.ex_kr || '')}
            </div>
            ${w.note ? `<div class="quiz-note">${escapeHtml(w.note)}</div>` : ''}
          </div>
        ` : ''}
      </div>
      <div class="quiz-actions">
        <button class="qbtn neutral" id="writing-reveal-btn">${revealed ? '예시 숨기기' : '예시 예문 보기'}</button>
        <button class="qbtn" id="writing-speak-btn">&#128266; 단어 듣기</button>
      </div>
      <div class="quiz-navrow">
        <button class="nbtn" id="writing-prev" ${idx === 0 ? 'disabled' : ''}>&#8592;</button>
        <div class="quiz-marks">${dots}</div>
        <button class="nbtn" id="writing-next">${idx === total - 1 ? '&#10003;' : '&#8594;'}</button>
      </div>
      <div class="row-btns">
        <button class="lbtn" id="writing-finish-btn">연습 마치고 내가 쓴 문장 모아보기</button>
      </div>
    </div>
  `;
}

function commitWritingInput() {
  if (!writingSession) return;
  const input = document.getElementById('writing-input');
  if (input) writingSession.inputs[writingSession.idx] = input.value;
}

function bindWritingPractice() {
  const input = document.getElementById('writing-input');
  if (input) {
    input.focus();
    input.addEventListener('input', () => { writingSession.inputs[writingSession.idx] = input.value; });
  }
  document.querySelectorAll('[data-w-jump]').forEach(b => b.addEventListener('click', () => {
    commitWritingInput();
    writingSession.idx = parseInt(b.dataset.wJump);
    render();
  }));
  const prevBtn = document.getElementById('writing-prev');
  if (prevBtn) prevBtn.addEventListener('click', () => {
    commitWritingInput();
    writingSession.idx = Math.max(0, writingSession.idx - 1);
    render();
  });
  const nextBtn = document.getElementById('writing-next');
  if (nextBtn) nextBtn.addEventListener('click', () => {
    commitWritingInput();
    if (writingSession.idx === writingSession.words.length - 1) goto('writingResult');
    else { writingSession.idx += 1; render(); }
  });
  const revealBtn = document.getElementById('writing-reveal-btn');
  if (revealBtn) revealBtn.addEventListener('click', () => {
    commitWritingInput();
    writingSession.revealed[writingSession.idx] = !writingSession.revealed[writingSession.idx];
    render();
  });
  const speakBtn = document.getElementById('writing-speak-btn');
  if (speakBtn) speakBtn.addEventListener('click', () => {
    const w = writingSession.words[writingSession.idx];
    TTS.speak(w.word, { lang: 'en-US', rate: progress.settings.ttsRate, voiceURI: progress.settings.ttsVoiceEN });
  });
  const finishBtn = document.getElementById('writing-finish-btn');
  if (finishBtn) finishBtn.addEventListener('click', () => {
    commitWritingInput();
    goto('writingResult');
  });
}

function renderWritingResult() {
  if (!writingSession) return `<div class="empty">작문 연습 기록이 없습니다.</div>`;
  const { words, inputs } = writingSession;
  const writtenCount = inputs.filter(v => v.trim()).length;

  const rows = words.map((w, i) => `
    <div class="section-card" style="margin-bottom:10px">
      <div class="trow-top" style="margin-bottom:8px">
        <span class="trow-word">${escapeHtml(w.word)}</span>
        <span class="trow-meaning">${escapeHtml(w.meaning)}</span>
      </div>
      ${inputs[i] && inputs[i].trim() ? `
        <div class="quiz-answer" style="text-align:left;margin-bottom:8px">내가 쓴 문장: ${escapeHtml(inputs[i])}</div>
      ` : `<div class="hint-text" style="margin-bottom:8px">작성한 문장이 없습니다.</div>`}
      <div class="quiz-ex">
        <span class="en">${escapeHtml(w.ex_en || '')}</span><br>${escapeHtml(w.ex_kr || '')}
      </div>
      ${w.note ? `<div class="quiz-note">${escapeHtml(w.note)}</div>` : ''}
    </div>
  `).join('');

  return `
    <div class="section-card">
      <div class="section-title">&#128221; 작문 연습 결과</div>
      <p class="hint-text">총 ${words.length}개 단어 중 ${writtenCount}개 문장을 작성했습니다. 내가 쓴 문장과 예시 예문을 비교하며 복습해보세요.</p>
      <div class="row-btns" style="justify-content:flex-start;margin-top:10px">
        <button class="big-btn" id="writing-again-btn">다시 연습하기</button>
        <button class="big-btn secondary" id="writing-home-btn">홈으로</button>
      </div>
    </div>
    ${rows}
  `;
}

function bindWritingResult() {
  const againBtn = document.getElementById('writing-again-btn');
  if (againBtn) againBtn.addEventListener('click', () => goto('writingSetup'));
  const homeBtn = document.getElementById('writing-home-btn');
  if (homeBtn) homeBtn.addEventListener('click', () => goto('home'));
}
