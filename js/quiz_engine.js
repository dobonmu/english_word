// ===== 시험 엔진: 객관식(self-check) / 쓰기(입력) / 모의고사 공용 =====
let quizSetupState = {
  scopeType: 'unit',      // unit | multiUnit | all | wrongList | starredList
  scopeUnits: [],
  promptType: 'meaning',   // meaning(뜻 보고 단어 맞추기) | word(단어 보고 뜻 맞추기)
  count: 50,
  isWrite: false,
  isMock: false,
  useTTS: false,           // 시험 중 단어를 읽어주는 모드 (쓰기 시험에서 유용)
};

let quiz = null; // 활성 시험 세션

function buildScopeWords(setup) {
  if (setup.scopeType === 'wrongList') return setup._words || getWrongWords();
  if (setup.scopeType === 'starredList') return setup._words || getStarredWords();
  if (setup.scopeType === 'all') return ALL_WORDS.slice();
  if (setup.scopeType === 'multiUnit') {
    return ALL_WORDS.filter(w => setup.scopeUnits.includes(w.unit));
  }
  // unit
  const unit = setup.scopeUnits[0] || state.unit;
  return ALL_WORDS.filter(w => w.unit === unit);
}

function startQuiz(setup) {
  const pool = buildScopeWords(setup);
  if (pool.length === 0) { toast('선택한 범위에 단어가 없습니다.'); return false; }
  const count = Math.min(setup.count || 50, pool.length);
  const items = shuffleArray(pool).slice(0, count).map(w => ({
    word: w, status: null, // null | 'correct' | 'wrong' | 'partial'
    userInput: '', revealed: false
  }));
  quiz = {
    setup,
    items,
    idx: 0,
    startedAt: Date.now(),
  };
  if (setup.isWrite) goto(setup.isMock ? 'mockQuiz' : 'writeQuiz');
  else goto(setup.isMock ? 'mockQuiz' : 'quiz');
  return true;
}

function quizCurrent() { return quiz.items[quiz.idx]; }

function quizMark(status) {
  const item = quizCurrent();
  item.status = status;
  item.revealed = true;
}

function quizGoto(i) {
  quiz.idx = Math.max(0, Math.min(quiz.items.length - 1, i));
}

function quizFinish() {
  // 미채점 문제는 정답으로 간주(그냥 넘어간 것 = 맞은 것, 요청사항 4번)
  quiz.items.forEach(it => { if (it.status === null) it.status = 'correct'; });

  const correct = quiz.items.filter(i => i.status === 'correct').length;
  const wrong = quiz.items.filter(i => i.status === 'wrong').length;
  const partial = quiz.items.filter(i => i.status === 'partial').length;

  if (!quiz.setup.isMock) {
    quiz.items.forEach(it => {
      if (it.status === 'wrong') recordWrong(it.word.key);
      else if (it.status === 'correct' || it.status === 'partial') {
        // 정답이면 오답 카운트를 건드리지 않음(누적 이력 유지), 학습완료 표시는 하지 않음(별개 개념)
      }
    });
    progress.examLog.push({
      date: Date.now(),
      mode: quiz.setup.isWrite ? '쓰기 시험' : '객관식 시험',
      scope: describeScope(quiz.setup),
      total: quiz.items.length,
      correct, wrong, partial,
    });
    if (progress.examLog.length > 200) progress.examLog = progress.examLog.slice(-200);
    saveProgress(progress);
  }

  goto(quiz.setup.isWrite ? 'writeResult' : (quiz.setup.isMock ? 'mockResult' : 'quizResult'));
}

function describeScope(setup) {
  if (setup.scopeType === 'all') return '전체 단원';
  if (setup.scopeType === 'wrongList') return '자주 틀린 단어';
  if (setup.scopeType === 'starredList') return '중요 표시 단어';
  if (setup.scopeType === 'multiUnit') return setup.scopeUnits.join(', ');
  return setup.scopeUnits[0] || '';
}
