function renderHome() {
  const totalWords = ALL_WORDS.length;
  const learnedCount = Object.keys(progress.learned).length;
  const starredCount = Object.keys(progress.starred).length;
  const wrongCount = Object.keys(progress.wrongCount).filter(k => progress.wrongCount[k] > 0).length;
  const lastExam = progress.examLog[progress.examLog.length - 1];

  return `
    <div class="hero">
      <h2>오늘도 단어 학습 시작해볼까요?</h2>
      <p>${UNIT_NAMES.length}개 단원, 총 ${totalWords}개 단어가 준비되어 있습니다.</p>
      <div class="row-btns">
        <button class="big-btn" id="home-browse">단어 보기</button>
        <button class="big-btn secondary" id="home-quiz">시험 보기</button>
      </div>
    </div>

    <div class="grid-cards">
      <div class="section-card">
        <div class="section-title">&#128202; 학습 현황</div>
        <div class="stats" style="justify-content:flex-start;flex-direction:column;align-items:flex-start;gap:10px">
          <div class="stat"><div class="sd" style="background:var(--fill-success)"></div>암기 완료 ${learnedCount} / ${totalWords}</div>
          <div class="stat"><div class="sd" style="background:var(--fill-warn)"></div>중요 표시 ${starredCount}개</div>
          <div class="stat"><div class="sd" style="background:var(--fill-danger)"></div>자주 틀리는 단어 ${wrongCount}개</div>
        </div>
      </div>
      <div class="section-card">
        <div class="section-title">&#128221; 최근 시험 결과</div>
        ${lastExam ? `
          <div style="font-size:13px;color:var(--text-secondary);line-height:1.8">
            ${formatDate(lastExam.date)}<br>
            ${escapeHtml(lastExam.scope)} · ${lastExam.total}문제<br>
            정답 ${lastExam.correct} / 오답 ${lastExam.wrong} ${lastExam.partial ? `/ 부분맞춤 ${lastExam.partial}` : ''}
          </div>
        ` : `<div style="font-size:13px;color:var(--text-muted)">아직 시험 기록이 없습니다.</div>`}
      </div>
    </div>

    <div class="grid-cards">
      <div class="opt-card" data-go="quizSetup">
        <h3>&#9989; 객관식 시험</h3>
        <p>뜻/단어를 보고 맞았는지 스스로 체크하는 빠른 시험 모드</p>
      </div>
      <div class="opt-card" data-go="writeSetup">
        <h3>&#9997;&#65039; 단어 쓰기 시험</h3>
        <p>뜻을 보고 영어 단어를 직접 입력해서 채점하는 시험 모드</p>
      </div>
      <div class="opt-card" data-go="writingSetup">
        <h3>&#128221; 영작문 연습</h3>
        <p>단어를 직접 활용해서 영어 문장을 써보고 예시 예문과 비교하는 모드</p>
      </div>
      <div class="opt-card" data-go="mockSetup">
        <h3>&#128220; 모의고사</h3>
        <p>기록에 남기지 않고 편하게 연습할 수 있는 모드</p>
      </div>
      <div class="opt-card" data-go="review">
        <h3>&#11088; 오답 · 중요 단어</h3>
        <p>자주 틀린 단어와 중요 표시한 단어를 모아보기</p>
      </div>
    </div>
  `;
}

function bindHome() {
  const b1 = document.getElementById('home-browse');
  if (b1) b1.addEventListener('click', () => goto('browse'));
  const b2 = document.getElementById('home-quiz');
  if (b2) b2.addEventListener('click', () => goto('quizSetup'));
  document.querySelectorAll('[data-go]').forEach(el => {
    el.addEventListener('click', () => goto(el.dataset.go));
  });
}
