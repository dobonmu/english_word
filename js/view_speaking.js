// ===== Speaking 연습: Q&A 스피킹 자료를 듣고 따라 말하는 모드 =====
let speakingSetupState = { setName: null };
let speakingSession = null; // { setName, items, idx }

const SPEAKING_SET_NAMES = (typeof SPEAKING_DATA !== 'undefined') ? Object.keys(SPEAKING_DATA) : [];

function startSpeaking(setName) {
  const items = (setName && SPEAKING_DATA[setName]) || [];
  if (items.length === 0) { toast('선택한 세트에 문답이 없습니다.'); return false; }
  speakingSession = { setName, items, idx: 0, revealed: items.map(() => false) };
  goto('speakingPractice');
  return true;
}

function renderSpeakingSetup() {
  if (SPEAKING_SET_NAMES.length === 0) {
    return `<div class="section-card"><div class="empty">아직 등록된 Speaking 학습 세트가 없습니다.</div></div>`;
  }
  if (!speakingSetupState.setName) speakingSetupState.setName = SPEAKING_SET_NAMES[0];

  const cards = SPEAKING_SET_NAMES.map(name => `
    <div class="opt-card ${speakingSetupState.setName === name ? 'on' : ''}" data-sp-set="${escapeHtml(name)}">
      <h3>${escapeHtml(name.replace(/^Part(\d+)_/, 'Part $1. '))}</h3>
      <p>${SPEAKING_DATA[name].length}개 문답</p>
    </div>
  `).join('');

  return `
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
  document.querySelectorAll('[data-sp-set]').forEach(el => el.addEventListener('click', () => {
    speakingSetupState.setName = el.dataset.spSet;
    render();
  }));
  const startBtn = document.getElementById('start-speaking-btn');
  if (startBtn) startBtn.addEventListener('click', () => {
    startSpeaking(speakingSetupState.setName);
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
