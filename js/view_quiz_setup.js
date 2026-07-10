function renderQuizSetup(isWrite, isMock) {
  const write = isWrite || state.page === 'writeSetup';
  const mock = isMock || state.page === 'mockSetup';

  // pendingScope: review 화면에서 넘어온 경우 자동 설정
  if (state.pendingScope) {
    quizSetupState.scopeType = state.pendingScope.type;
    quizSetupState._words = state.pendingScope.words;
    state.pendingScope = null;
  }
  quizSetupState.isWrite = write;
  quizSetupState.isMock = mock;

  const scopeTypes = [
    { id: 'unit', label: '단원별 테스트', desc: '선택한 한 단원의 단어로 시험' },
    { id: 'multiUnit', label: '여러 단원 테스트', desc: '원하는 단원을 여러 개 골라서 시험' },
    { id: 'all', label: '전체 단원 테스트', desc: '모든 단원의 단어를 섞어서 시험' },
    { id: 'wrongList', label: '자주 틀린 단어', desc: '오답 기록이 있는 단어만 모아서 시험' },
    { id: 'starredList', label: '중요 표시 단어', desc: '중요 표시한 단어만 모아서 시험' },
  ];

  const scopeCards = scopeTypes.map(s => `
    <div class="opt-card ${quizSetupState.scopeType === s.id ? 'on' : ''}" data-scope="${s.id}">
      <h3>${s.label}</h3>
      <p>${s.desc}</p>
    </div>
  `).join('');

  const unitPicker = quizSetupState.scopeType === 'unit' ? `
    <div class="field">
      <label>단원 선택</label>
      <select id="unit-select">
        ${UNIT_NAMES.map(u => `<option value="${escapeHtml(u)}" ${quizSetupState.scopeUnits[0] === u ? 'selected' : ''}>${escapeHtml(u)}</option>`).join('')}
      </select>
    </div>` : '';

  const multiUnitPicker = quizSetupState.scopeType === 'multiUnit' ? `
    <div class="field">
      <label>단원 선택 (여러 개 가능)</label>
      <div class="unit-check-list">
        ${UNIT_NAMES.map(u => `<button class="unit-check ${quizSetupState.scopeUnits.includes(u) ? 'on' : ''}" data-multi-unit="${escapeHtml(u)}">${escapeHtml(u)}</button>`).join('')}
      </div>
    </div>` : '';

  const scopeCountInfo = (() => {
    if (quizSetupState.scopeType === 'wrongList') return (quizSetupState._words || getWrongWords()).length;
    if (quizSetupState.scopeType === 'starredList') return (quizSetupState._words || getStarredWords()).length;
    return null;
  })();

  const directionPicker = !write ? `
    <div class="field">
      <label>문제 형식</label>
      <div class="seg">
        <button class="${quizSetupState.promptType === 'meaning' ? 'on' : ''}" data-prompt="meaning">뜻 보고 단어 맞추기</button>
        <button class="${quizSetupState.promptType === 'word' ? 'on' : ''}" data-prompt="word">단어 보고 뜻 맞추기</button>
      </div>
    </div>` : `
    <div class="field">
      <label>문제 형식</label>
      <div class="seg">
        <button class="${quizSetupState.promptType === 'meaning' ? 'on' : ''}" data-prompt="meaning">뜻 보고 영단어 쓰기</button>
        <button class="${quizSetupState.promptType === 'listen' ? 'on' : ''}" data-prompt="listen">단어 듣고 영단어 쓰기</button>
      </div>
      <div class="hint-text">'단어 듣고 쓰기'는 TTS로 단어를 읽어주고, 화면에는 뜻만 보여줍니다(정답은 직접 눌러 확인).</div>
    </div>`;

  return `
    <div class="section-card">
      <div class="section-title">${mock ? '&#128220; 모의고사 설정' : (write ? '&#9997;&#65039; 단어 쓰기 시험 설정' : '&#9989; 객관식 시험 설정')}</div>
      ${mock ? `<p class="hint-text" style="margin-bottom:14px">모의고사는 결과가 오답/중요 표시 기록에 반영되지 않습니다. 편하게 연습해보세요.</p>` : ''}
      <div class="field">
        <label>시험 범위</label>
        <div class="grid-cards">${scopeCards}</div>
        ${scopeCountInfo !== null ? `<div class="hint-text">현재 ${scopeCountInfo}개 단어가 있습니다.</div>` : ''}
      </div>
      ${unitPicker}
      ${multiUnitPicker}
      ${directionPicker}
      <div class="field">
        <label>문제 수 (기본 50)</label>
        <input type="number" id="count-input" min="1" max="500" value="${quizSetupState.count}">
        <div class="hint-text" id="count-hint"></div>
      </div>
      <div class="row-btns" style="justify-content:flex-start">
        <button class="big-btn" id="start-quiz-btn">시험 시작</button>
      </div>
    </div>
  `;
}

function bindQuizSetup() {
  document.querySelectorAll('[data-scope]').forEach(el => el.addEventListener('click', () => {
    quizSetupState.scopeType = el.dataset.scope;
    if (quizSetupState.scopeType === 'unit' && quizSetupState.scopeUnits.length === 0) {
      quizSetupState.scopeUnits = [state.unit || UNIT_NAMES[0]];
    }
    render();
  }));
  const unitSelect = document.getElementById('unit-select');
  if (unitSelect) unitSelect.addEventListener('change', () => {
    quizSetupState.scopeUnits = [unitSelect.value];
  });
  document.querySelectorAll('[data-multi-unit]').forEach(el => el.addEventListener('click', () => {
    const u = el.dataset.multiUnit;
    const i = quizSetupState.scopeUnits.indexOf(u);
    if (i >= 0) quizSetupState.scopeUnits.splice(i, 1);
    else quizSetupState.scopeUnits.push(u);
    render();
  }));
  document.querySelectorAll('[data-prompt]').forEach(el => el.addEventListener('click', () => {
    quizSetupState.promptType = el.dataset.prompt; render();
  }));
  const countInput = document.getElementById('count-input');
  if (countInput) countInput.addEventListener('input', () => {
    quizSetupState.count = parseInt(countInput.value) || 1;
  });
  const startBtn = document.getElementById('start-quiz-btn');
  if (startBtn) startBtn.addEventListener('click', () => {
    if (quizSetupState.scopeType === 'unit' && quizSetupState.scopeUnits.length === 0) {
      quizSetupState.scopeUnits = [state.unit || UNIT_NAMES[0]];
    }
    if (quizSetupState.scopeType === 'multiUnit' && quizSetupState.scopeUnits.length === 0) {
      toast('단원을 하나 이상 선택하세요.'); return;
    }
    startQuiz(Object.assign({}, quizSetupState));
  });
}
