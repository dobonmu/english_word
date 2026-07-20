// ===== Speaking 연습: 단원별 단어를 TTS로 듣고 따라 말하는 모드 =====
let speakingSetupState = {
  scopeType: 'unit',      // unit | multiUnit | all
  scopeUnits: [],
};

let speakingSession = null; // { words: [...], idx }

function buildSpeakingScopeWords(setup) {
  if (setup.scopeType === 'all') return ALL_WORDS.slice();
  if (setup.scopeType === 'multiUnit') return ALL_WORDS.filter(w => setup.scopeUnits.includes(w.unit));
  const unit = setup.scopeUnits[0] || state.unit;
  return ALL_WORDS.filter(w => w.unit === unit);
}

function startSpeaking(setup) {
  const pool = buildSpeakingScopeWords(setup);
  if (pool.length === 0) { toast('선택한 범위에 단어가 없습니다.'); return false; }
  speakingSession = { setup, words: pool, idx: 0 };
  goto('speakingPractice');
  return true;
}

function renderSpeakingSetup() {
  const scopeTypes = [
    { id: 'unit', label: '단원별 연습', desc: '선택한 한 단원의 단어로 스피킹 연습' },
    { id: 'multiUnit', label: '여러 단원 연습', desc: '원하는 단원을 여러 개 골라서 연습' },
    { id: 'all', label: '전체 단원 연습', desc: '모든 단원의 단어를 섞어서 연습' },
  ];

  const scopeCards = scopeTypes.map(s => `
    <div class="opt-card ${speakingSetupState.scopeType === s.id ? 'on' : ''}" data-sp-scope="${s.id}">
      <h3>${s.label}</h3>
      <p>${s.desc}</p>
    </div>
  `).join('');

  const unitPicker = speakingSetupState.scopeType === 'unit' ? `
    <div class="field">
      <label>단원 선택</label>
      <select id="sp-unit-select">
        ${UNIT_NAMES.map(u => `<option value="${escapeHtml(u)}" ${speakingSetupState.scopeUnits[0] === u ? 'selected' : ''}>${escapeHtml(u)}</option>`).join('')}
      </select>
    </div>` : '';

  const multiUnitPicker = speakingSetupState.scopeType === 'multiUnit' ? `
    <div class="field">
      <label>단원 선택 (여러 개 가능)</label>
      <div class="unit-check-list">
        ${UNIT_NAMES.map(u => `<button class="unit-check ${speakingSetupState.scopeUnits.includes(u) ? 'on' : ''}" data-sp-multi-unit="${escapeHtml(u)}">${escapeHtml(u)}</button>`).join('')}
      </div>
    </div>` : '';

  return `
    <div class="section-card">
      <div class="section-title">&#127908; Speaking 연습 설정</div>
      <p class="hint-text" style="margin-bottom:14px">단어와 예문을 TTS로 듣고 따라 말하는 연습 모드입니다. 마이크나 녹음은 사용하지 않으며, 듣고 따라 말하는 연습에만 집중할 수 있습니다.</p>
      <div class="field">
        <label>연습 범위</label>
        <div class="grid-cards">${scopeCards}</div>
      </div>
      ${unitPicker}
      ${multiUnitPicker}
      <div class="row-btns" style="justify-content:flex-start">
        <button class="big-btn" id="start-speaking-btn">Speaking 시작</button>
      </div>
    </div>
  `;
}

function bindSpeakingSetup() {
  document.querySelectorAll('[data-sp-scope]').forEach(el => el.addEventListener('click', () => {
    speakingSetupState.scopeType = el.dataset.spScope;
    if (speakingSetupState.scopeType === 'unit' && speakingSetupState.scopeUnits.length === 0) {
      speakingSetupState.scopeUnits = [state.unit || UNIT_NAMES[0]];
    }
    render();
  }));
  const unitSelect = document.getElementById('sp-unit-select');
  if (unitSelect) unitSelect.addEventListener('change', () => {
    speakingSetupState.scopeUnits = [unitSelect.value];
  });
  document.querySelectorAll('[data-sp-multi-unit]').forEach(el => el.addEventListener('click', () => {
    const u = el.dataset.spMultiUnit;
    const i = speakingSetupState.scopeUnits.indexOf(u);
    if (i >= 0) speakingSetupState.scopeUnits.splice(i, 1);
    else speakingSetupState.scopeUnits.push(u);
    render();
  }));
  const startBtn = document.getElementById('start-speaking-btn');
  if (startBtn) startBtn.addEventListener('click', () => {
    if (speakingSetupState.scopeType === 'unit' && speakingSetupState.scopeUnits.length === 0) {
      speakingSetupState.scopeUnits = [state.unit || UNIT_NAMES[0]];
    }
    if (speakingSetupState.scopeType === 'multiUnit' && speakingSetupState.scopeUnits.length === 0) {
      toast('단원을 하나 이상 선택하세요.'); return;
    }
    startSpeaking(Object.assign({}, speakingSetupState));
  });
}

function renderSpeakingPractice() {
  if (!speakingSession) return `<div class="empty">진행 중인 Speaking 연습이 없습니다.</div>`;
  const { words, idx } = speakingSession;
  const w = words[idx];
  const total = words.length;
  const progressPct = Math.round(((idx + 1) / total) * 100);
  const dots = words.map((_, i) => `<button class="qmark ${i === idx ? 'cur' : ''}" data-sp-jump="${i}"></button>`).join('');
  const markKeyPrefix = `speaking::${w.unit}::${w.word}`;

  return `
    <div class="quiz-wrap">
      <div class="quiz-progress">
        <span>${idx + 1} / ${total}</span>
        <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${progressPct}%"></div></div>
        <span>${escapeHtml(w.unit)}</span>
      </div>
      <div class="quiz-card" style="text-align:left;align-items:stretch">
        <div class="quiz-prompt-label" style="text-align:center">따라 말해보세요</div>
        <div class="quiz-prompt" style="text-align:center">${escapeHtml(w.word)}</div>
        <div class="cmean" style="text-align:center;margin:4px 0 0">${escapeHtml(w.meaning)}</div>
        <div class="quiz-actions" style="margin:12px 0 0">
          <button class="big-btn" id="sp-speak-word-btn">&#128266; 단어 듣기</button>
        </div>
        ${w.note ? `
          <div class="quiz-note" style="margin-top:14px">${renderMarkableSentence(w.note, markKeyPrefix + '::note')}</div>
        ` : ''}
        ${w.ex_en ? `
          <div class="quiz-answer-area" style="margin-top:14px">
            <div class="quiz-prompt-label" style="text-align:center">예문</div>
            <div class="quiz-ex" style="text-align:center;margin-top:6px">
              <span class="en">${renderMarkableSentence(w.ex_en, markKeyPrefix + '::ex')}</span><br>${escapeHtml(w.ex_kr || '')}
            </div>
            <div class="quiz-actions" style="margin:10px 0 0">
              <button class="qbtn" id="sp-speak-ex-btn">&#128266; 예문 듣기</button>
            </div>
          </div>
        ` : ''}
        <div class="hint-text" style="text-align:center;margin-top:10px">영어 단어를 누르면 틀린 부분(빨강)/중요 표시(노랑)를 남길 수 있어요.</div>
      </div>
      <div class="quiz-navrow">
        <button class="nbtn" id="sp-prev" ${idx === 0 ? 'disabled' : ''}>&#8592;</button>
        <div class="quiz-marks">${dots}</div>
        <button class="nbtn" id="sp-next" ${idx === total - 1 ? 'disabled' : ''}>&#8594;</button>
      </div>
      <div class="row-btns">
        <button class="lbtn" id="sp-home-btn">연습 범위 선택으로 돌아가기</button>
      </div>
    </div>
  `;
}

function bindSpeakingPractice() {
  const w = speakingSession.words[speakingSession.idx];
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
    speakingSession.idx = Math.min(speakingSession.words.length - 1, speakingSession.idx + 1);
    render();
  });
  const speakWordBtn = document.getElementById('sp-speak-word-btn');
  if (speakWordBtn) speakWordBtn.addEventListener('click', () => {
    TTS.speak(w.word, { lang: 'en-US', rate: progress.settings.ttsRate, voiceURI: progress.settings.ttsVoiceEN });
  });
  const speakExBtn = document.getElementById('sp-speak-ex-btn');
  if (speakExBtn) speakExBtn.addEventListener('click', () => {
    TTS.speak(w.ex_en, { lang: 'en-US', rate: progress.settings.ttsRate, voiceURI: progress.settings.ttsVoiceEN });
  });
  const homeBtn = document.getElementById('sp-home-btn');
  if (homeBtn) homeBtn.addEventListener('click', () => goto('speakingSetup'));
  bindMarkableSentence(document.getElementById('main'));
}
