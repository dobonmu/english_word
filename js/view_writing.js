// ===== Writing 학습 =====
// 1. 문장 보기: 문장/한글/학습포인트를 모두 보여줌.
// 2. 학습 포인트 공부: 표현(영어)/뜻(한글)을 모두 보여주며 학습.
// 3. 학습 포인트 연습: 한글 뜻만 보여주고 영어는 가려서, 눌러야 확인 가능(정답에는
//    영어와 그 표현의 대체 가능한 다른 표현도 모두 공개).
// 4. 시험보기: 문장 전체를 뜻/영어 상호 전환으로 써보는 기존 시험 모드.
let writingSetupState = {
  mode: 'sentence',        // sentence | pointStudy | pointPractice | quiz
  setName: null,
  quizPromptType: 'kr',    // kr(뜻 보고 문장 쓰기) | en(문장 보고 뜻 쓰기)
};

let sentenceStudyState = { setName: null, idx: 0 };
let pointStudyState = { setName: null, idx: 0 };
let pointPracticeState = { setName: null, idx: 0, revealed: false };
let writingQuiz = null; // { setName, items: [{it, status, userInput, revealed}], idx }

const WRITING_SET_NAMES = (typeof WRITING_DATA !== 'undefined') ? Object.keys(WRITING_DATA) : [];

// point 필드는 "레이블: 표현1, 표현2, ... / 레이블2: 표현3, 표현4" 형태의 자유 텍스트.
// '/' 로 그룹을, ',' 로 개별 대체표현을 나눠서 카드처럼 보여준다.
function parsePoint(point) {
  if (!point) return [];
  return point.split('/').map(s => s.trim()).filter(Boolean).map(group => {
    const colonIdx = group.indexOf(':');
    const label = colonIdx === -1 ? '' : group.slice(0, colonIdx).trim();
    const rest = colonIdx === -1 ? group : group.slice(colonIdx + 1).trim();
    const phrases = rest.split(',').map(s => s.trim()).filter(Boolean);
    return { label, phrases: phrases.length ? phrases : [rest] };
  });
}

// 학습포인트를 문장 단위 리스트로 평탄화: [{ setName, sentenceIdx, groupIdx, label, phrases, en, kr }]
function flattenPoints(setName) {
  const items = WRITING_DATA[setName] || [];
  const out = [];
  items.forEach((it, sentenceIdx) => {
    parsePoint(it.point).forEach((g, groupIdx) => {
      out.push({ setName, sentenceIdx, groupIdx, label: g.label, phrases: g.phrases, sentenceEn: it.en, sentenceKr: it.kr });
    });
  });
  return out;
}

function renderPointGroups(point, keyPrefix) {
  const groups = parsePoint(point);
  if (groups.length === 0) return '';
  return groups.map((g, gi) => `
    <div class="point-group">
      ${g.label ? `<div class="point-label">${escapeHtml(g.label)}</div>` : ''}
      <div class="point-phrases">
        ${g.phrases.map((p, pi) => {
          const markKey = `${keyPrefix}::${gi}::${pi}`;
          const mark = wordMarkOf(markKey);
          const cls = mark ? ` wmark-${mark}` : '';
          return `<span class="phrase-chip wmark${cls}" data-wmark-key="${escapeHtml(markKey)}" title="클릭하면 틀린 부분/중요 표시를 바꿀 수 있어요">${escapeHtml(p)}</span>`;
        }).join('')}
      </div>
    </div>
  `).join('');
}

function renderWritingSetup() {
  const modeTabs = `
    <div class="seg" style="margin-bottom:16px;flex-wrap:wrap">
      <button class="${writingSetupState.mode === 'sentence' ? 'on' : ''}" data-w-mode="sentence">문장 보기</button>
      <button class="${writingSetupState.mode === 'pointStudy' ? 'on' : ''}" data-w-mode="pointStudy">학습포인트 공부</button>
      <button class="${writingSetupState.mode === 'pointPractice' ? 'on' : ''}" data-w-mode="pointPractice">학습포인트 연습</button>
      <button class="${writingSetupState.mode === 'quiz' ? 'on' : ''}" data-w-mode="quiz">문장 시험보기</button>
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

  if (writingSetupState.mode === 'pointStudy') {
    return modeTabs + `
      <div class="section-card">
        <div class="section-title">&#128221; 학습 포인트 공부</div>
        <p class="hint-text" style="margin-bottom:14px">각 문장의 학습 포인트(대체 가능한 표현)를 영어와 한글 뜻을 모두 보면서 익히는 모드입니다.</p>
        <div class="field">
          <label>학습 세트 선택</label>
          <div class="grid-cards">${cards}</div>
        </div>
        <div class="row-btns" style="justify-content:flex-start">
          <button class="big-btn" id="start-point-study-btn">공부 시작</button>
        </div>
      </div>
    `;
  }

  if (writingSetupState.mode === 'pointPractice') {
    return modeTabs + `
      <div class="section-card">
        <div class="section-title">&#127919; 학습 포인트 연습</div>
        <p class="hint-text" style="margin-bottom:14px">한글 뜻만 보고 영어 표현을 맞혀보는 연습 모드입니다. 정답을 확인하면 영어 표현과 대체 가능한 다른 표현들도 함께 보여줍니다.</p>
        <div class="field">
          <label>학습 세트 선택</label>
          <div class="grid-cards">${cards}</div>
        </div>
        <div class="row-btns" style="justify-content:flex-start">
          <button class="big-btn" id="start-point-practice-btn">연습 시작</button>
        </div>
      </div>
    `;
  }

  return modeTabs + `
    <div class="section-card">
      <div class="section-title">&#128221; 문장 보기</div>
      <p class="hint-text" style="margin-bottom:14px">영어 문장, 한글 해석, 학습 포인트를 모두 보여줍니다.</p>
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
    sentenceStudyState = { setName: writingSetupState.setName, idx: 0 };
    goto('sentenceStudy');
  });
  const startPointStudyBtn = document.getElementById('start-point-study-btn');
  if (startPointStudyBtn) startPointStudyBtn.addEventListener('click', () => {
    pointStudyState = { setName: writingSetupState.setName, idx: 0 };
    goto('pointStudy');
  });
  const startPointPracticeBtn = document.getElementById('start-point-practice-btn');
  if (startPointPracticeBtn) startPointPracticeBtn.addEventListener('click', () => {
    pointPracticeState = { setName: writingSetupState.setName, idx: 0, revealed: false };
    goto('pointPractice');
  });
  const startQuizBtn = document.getElementById('start-writing-quiz-btn');
  if (startQuizBtn) startQuizBtn.addEventListener('click', () => {
    startWritingQuiz(writingSetupState.setName, writingSetupState.quizPromptType);
  });
}

// ===== 1. 문장 보기: 문장 + 한글 + 학습포인트를 모두 보여줌 =====
function renderSentenceStudy() {
  const name = sentenceStudyState.setName;
  const items = (name && WRITING_DATA[name]) || [];
  if (items.length === 0) return `<div class="empty">진행 중인 학습이 없습니다.</div>`;
  const idx = sentenceStudyState.idx;
  const it = items[idx];
  const total = items.length;
  const progressPct = Math.round(((idx + 1) / total) * 100);
  const dots = items.map((_, i) => `<button class="qmark ${i === idx ? 'cur' : ''}" data-s-jump="${i}"></button>`).join('');
  const markKeyPrefix = `writingPoint::${name}::${idx}`;
  const hasPoint = !!(it.point && it.point.trim());

  return `
    <div class="quiz-wrap">
      <div class="quiz-progress">
        <span>${idx + 1} / ${total}</span>
        <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${progressPct}%"></div></div>
        <span>${escapeHtml(name)}</span>
      </div>
      <div class="quiz-card" style="text-align:left;align-items:stretch">
        <div class="quiz-prompt-label" style="text-align:center">영어 문장</div>
        <div class="quiz-prompt" style="font-size:18px;text-align:center;line-height:1.5">${escapeHtml(it.en)}</div>
        <div class="quiz-actions" style="margin:10px 0 0;justify-content:center">
          <button class="qbtn" id="sentence-speak-btn">&#128266; 문장 듣기</button>
        </div>
        <div class="quiz-answer-area" style="margin-top:12px">
          <div class="quiz-prompt-label">뜻</div>
          <div class="quiz-answer" style="text-align:left;margin-top:6px">${escapeHtml(it.kr)}</div>
        </div>
        ${hasPoint ? `
          <div class="quiz-prompt-label" style="margin-top:14px">학습 포인트 (대체 가능한 표현)</div>
          <div class="point-groups">${renderPointGroups(it.point, markKeyPrefix)}</div>
          <div class="hint-text" style="margin-top:6px">표현을 누르면 틀린 부분(빨강)/중요 표시(노랑)를 남길 수 있어요.</div>
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
    render();
  }));
  const prevBtn = document.getElementById('sentence-prev');
  if (prevBtn) prevBtn.addEventListener('click', () => {
    sentenceStudyState.idx = Math.max(0, sentenceStudyState.idx - 1);
    render();
  });
  const nextBtn = document.getElementById('sentence-next');
  if (nextBtn) nextBtn.addEventListener('click', () => {
    sentenceStudyState.idx = Math.min(items.length - 1, sentenceStudyState.idx + 1);
    render();
  });
  const speakBtn = document.getElementById('sentence-speak-btn');
  if (speakBtn) speakBtn.addEventListener('click', () => {
    const it = items[sentenceStudyState.idx];
    TTS.speak(it.en, { lang: 'en-US', rate: progress.settings.ttsRate, voiceURI: progress.settings.ttsVoiceEN });
  });
  const homeBtn = document.getElementById('sentence-home-btn');
  if (homeBtn) homeBtn.addEventListener('click', () => goto('writingSetup'));
  bindMarkableSentence(document.getElementById('main'));
}

// ===== 2. 학습 포인트 공부: 영어/한글을 모두 보여줌 =====
function renderPointStudy() {
  const name = pointStudyState.setName;
  const points = flattenPoints(name);
  if (points.length === 0) return `<div class="empty">이 세트에는 학습 포인트가 없습니다.</div>`;
  const idx = Math.min(pointStudyState.idx, points.length - 1);
  const p = points[idx];
  const total = points.length;
  const progressPct = Math.round(((idx + 1) / total) * 100);
  const dots = points.map((_, i) => `<button class="qmark ${i === idx ? 'cur' : ''}" data-ps-jump="${i}"></button>`).join('');
  const markKeyPrefix = `writingPoint::${name}::${p.sentenceIdx}`;

  return `
    <div class="quiz-wrap">
      <div class="quiz-progress">
        <span>${idx + 1} / ${total}</span>
        <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${progressPct}%"></div></div>
        <span>${escapeHtml(name)}</span>
      </div>
      <div class="quiz-card" style="text-align:left;align-items:stretch">
        ${p.label ? `<div class="quiz-prompt-label" style="text-align:center">${escapeHtml(p.label)}</div>` : ''}
        <div class="point-phrases" style="justify-content:center">
          ${p.phrases.map((ph, pi) => {
            const markKey = `${markKeyPrefix}::${p.groupIdx}::${pi}`;
            const mark = wordMarkOf(markKey);
            const cls = mark ? ` wmark-${mark}` : '';
            return `<span class="phrase-chip wmark${cls}" data-wmark-key="${escapeHtml(markKey)}" style="font-size:16px">${escapeHtml(ph)}</span>`;
          }).join('')}
        </div>
        <div class="hint-text" style="text-align:center;margin-top:8px">표현을 누르면 틀린 부분(빨강)/중요 표시(노랑)를 남길 수 있어요.</div>
        <div class="quiz-answer-area" style="margin-top:14px">
          <div class="quiz-prompt-label">이 표현이 쓰인 문장</div>
          <div class="quiz-ex" style="margin-top:6px">
            <span class="en">${escapeHtml(p.sentenceEn)}</span><br>${escapeHtml(p.sentenceKr)}
          </div>
        </div>
      </div>
      <div class="quiz-navrow">
        <button class="nbtn" id="ps-prev" ${idx === 0 ? 'disabled' : ''}>&#8592;</button>
        <div class="quiz-marks">${dots}</div>
        <button class="nbtn" id="ps-next" ${idx === total - 1 ? 'disabled' : ''}>&#8594;</button>
      </div>
      <div class="row-btns">
        <button class="lbtn" id="ps-home-btn">학습 세트 선택으로 돌아가기</button>
      </div>
    </div>
  `;
}

function bindPointStudy() {
  const name = pointStudyState.setName;
  const points = flattenPoints(name);
  document.querySelectorAll('[data-ps-jump]').forEach(b => b.addEventListener('click', () => {
    pointStudyState.idx = parseInt(b.dataset.psJump);
    render();
  }));
  const prevBtn = document.getElementById('ps-prev');
  if (prevBtn) prevBtn.addEventListener('click', () => {
    pointStudyState.idx = Math.max(0, pointStudyState.idx - 1);
    render();
  });
  const nextBtn = document.getElementById('ps-next');
  if (nextBtn) nextBtn.addEventListener('click', () => {
    pointStudyState.idx = Math.min(points.length - 1, pointStudyState.idx + 1);
    render();
  });
  const homeBtn = document.getElementById('ps-home-btn');
  if (homeBtn) homeBtn.addEventListener('click', () => goto('writingSetup'));
  bindMarkableSentence(document.getElementById('main'));
}

// ===== 3. 학습 포인트 연습: 한글만 보이고 영어는 가려짐. 정답 확인시 영어+대체표현 모두 공개 =====
function renderPointPractice() {
  const name = pointPracticeState.setName;
  const points = flattenPoints(name);
  if (points.length === 0) return `<div class="empty">이 세트에는 학습 포인트가 없습니다.</div>`;
  const idx = Math.min(pointPracticeState.idx, points.length - 1);
  const p = points[idx];
  const total = points.length;
  const progressPct = Math.round(((idx + 1) / total) * 100);
  const dots = points.map((_, i) => `<button class="qmark ${i === idx ? 'cur' : ''}" data-pp-jump="${i}"></button>`).join('');
  const revealed = pointPracticeState.revealed;

  return `
    <div class="quiz-wrap">
      <div class="quiz-progress">
        <span>${idx + 1} / ${total}</span>
        <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${progressPct}%"></div></div>
        <span>${escapeHtml(name)}</span>
      </div>
      <div class="quiz-card" style="text-align:left;align-items:stretch">
        <div class="quiz-prompt-label" style="text-align:center">이 뜻에 맞는 영어 표현을 떠올려보세요</div>
        <div class="quiz-prompt" style="font-size:18px;text-align:center">${escapeHtml(p.label || p.sentenceKr)}</div>
        <div class="quiz-actions" style="margin:12px 0 0;justify-content:center">
          <button class="qbtn neutral" id="pp-reveal-btn">${revealed ? '정답 숨기기' : '정답 보기'}</button>
        </div>
        ${revealed ? `
          <div class="quiz-answer-area" style="margin-top:12px">
            <div class="quiz-prompt-label">정답 (영어 표현 + 대체 가능한 표현)</div>
            <div class="point-phrases" style="margin-top:8px">
              ${p.phrases.map(ph => `<span class="phrase-chip" style="color:var(--fill-success);border-color:var(--fill-success)">${escapeHtml(ph)}</span>`).join('')}
            </div>
            <div class="quiz-prompt-label" style="margin-top:14px">이 표현이 쓰인 문장</div>
            <div class="quiz-ex" style="margin-top:6px">
              <span class="en">${escapeHtml(p.sentenceEn)}</span><br>${escapeHtml(p.sentenceKr)}
            </div>
          </div>
        ` : ''}
      </div>
      <div class="quiz-navrow">
        <button class="nbtn" id="pp-prev" ${idx === 0 ? 'disabled' : ''}>&#8592;</button>
        <div class="quiz-marks">${dots}</div>
        <button class="nbtn" id="pp-next" ${idx === total - 1 ? 'disabled' : ''}>&#8594;</button>
      </div>
      <div class="row-btns">
        <button class="lbtn" id="pp-home-btn">학습 세트 선택으로 돌아가기</button>
      </div>
    </div>
  `;
}

function bindPointPractice() {
  const name = pointPracticeState.setName;
  const points = flattenPoints(name);
  document.querySelectorAll('[data-pp-jump]').forEach(b => b.addEventListener('click', () => {
    pointPracticeState.idx = parseInt(b.dataset.ppJump);
    pointPracticeState.revealed = false;
    render();
  }));
  const prevBtn = document.getElementById('pp-prev');
  if (prevBtn) prevBtn.addEventListener('click', () => {
    pointPracticeState.idx = Math.max(0, pointPracticeState.idx - 1);
    pointPracticeState.revealed = false;
    render();
  });
  const nextBtn = document.getElementById('pp-next');
  if (nextBtn) nextBtn.addEventListener('click', () => {
    pointPracticeState.idx = Math.min(points.length - 1, pointPracticeState.idx + 1);
    pointPracticeState.revealed = false;
    render();
  });
  const revealBtn = document.getElementById('pp-reveal-btn');
  if (revealBtn) revealBtn.addEventListener('click', () => {
    pointPracticeState.revealed = !pointPracticeState.revealed;
    render();
  });
  const homeBtn = document.getElementById('pp-home-btn');
  if (homeBtn) homeBtn.addEventListener('click', () => goto('writingSetup'));
}

// ===== 4. 문장 시험보기: 뜻 보고 문장 쓰기 / 문장 보고 뜻 쓰기 =====
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
            ${item.it.point ? `<div class="point-groups" style="margin-top:10px">${renderPointGroups(item.it.point, `writingQuiz::${setName}::${idx}`)}</div>` : ''}
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
  bindMarkableSentence(document.getElementById('main'));
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
        ${item.it.point ? `<div class="point-groups" style="margin-top:8px">${renderPointGroups(item.it.point, `writingQuizResult::${setName}::${i}`)}</div>` : ''}
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
  bindMarkableSentence(document.getElementById('main'));
  const againBtn = document.getElementById('wq-again-btn');
  if (againBtn) againBtn.addEventListener('click', () => goto('writingSetup'));
  const homeBtn = document.getElementById('wq-home-btn');
  if (homeBtn) homeBtn.addEventListener('click', () => goto('home'));
}
