let reviewTab = 'wrong'; // wrong | starred

function renderReview() {
  const wrongWords = getWrongWords();
  const starredWords = getStarredWords();
  const list = reviewTab === 'wrong' ? wrongWords : starredWords;

  const rows = list.map(w => {
    const wc = wrongCountOf(w.key);
    const starred = isStarred(w.key);
    return `
      <div class="trow" data-key="${escapeHtml(w.key)}">
        <div class="trow-top">
          <span class="trow-word">${escapeHtml(w.word)}</span>
          <span class="trow-meaning">${escapeHtml(w.meaning)}</span>
          <span class="trow-badges">
            ${reviewTab === 'wrong' ? `<span class="wrongtag">${wc}회 오답</span>` : ''}
            <button class="badge speak" data-speak="${escapeHtml(w.key)}" title="읽기">&#128266;</button>
            <button class="badge star ${starred ? 'on' : ''}" data-star="${escapeHtml(w.key)}" title="중요 표시">&#9733;</button>
            ${reviewTab === 'wrong' ? `<button class="badge" data-reset="${escapeHtml(w.key)}" title="오답 기록 초기화">&#8635;</button>` : ''}
          </span>
        </div>
        <div class="trow-ex" style="padding-left:0;font-size:11.5px;color:var(--text-muted)">${escapeHtml(w.unit)}</div>
      </div>`;
  }).join('');

  return `
    <div class="seg" style="margin-bottom:14px">
      <button class="${reviewTab === 'wrong' ? 'on' : ''}" data-rtab="wrong">자주 틀린 단어 (${wrongWords.length})</button>
      <button class="${reviewTab === 'starred' ? 'on' : ''}" data-rtab="starred">중요 표시 (${starredWords.length})</button>
    </div>
    ${list.length ? `
      <div class="row-btns" style="justify-content:flex-end;margin-bottom:10px">
        <button class="chip" id="read-review-list">&#128266; 이 목록 읽어주기</button>
        ${reviewTab === 'wrong' ? `<button class="chip" id="reset-all-wrong">전체 오답 기록 초기화</button>` : ''}
      </div>
      <div class="tbl">${rows}</div>
      <div class="row-btns" style="margin-top:16px">
        <button class="lbtn" id="review-quiz-btn">이 목록으로 시험 보기</button>
      </div>
    ` : `<div class="empty">${reviewTab === 'wrong' ? '아직 틀린 단어가 없습니다.' : '중요 표시한 단어가 없습니다.'}</div>`}
  `;
}

function bindReview() {
  document.querySelectorAll('[data-rtab]').forEach(b => b.addEventListener('click', () => {
    reviewTab = b.dataset.rtab; render();
  }));
  document.querySelectorAll('[data-star]').forEach(b => b.addEventListener('click', () => {
    toggleStar(b.dataset.star); render();
  }));
  document.querySelectorAll('[data-speak]').forEach(b => b.addEventListener('click', () => {
    const key = b.dataset.speak;
    const w = (reviewTab === 'wrong' ? getWrongWords() : getStarredWords()).find(x => x.key === key);
    if (w) TTS.speakWordAndMeaning(w.word, w.meaning, progress.settings);
  }));
  document.querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', () => {
    if (confirm('이 단어의 오답 기록을 초기화할까요?')) { resetWrongFor(b.dataset.reset); render(); }
  }));
  const resetAll = document.getElementById('reset-all-wrong');
  if (resetAll) resetAll.addEventListener('click', () => {
    if (confirm('모든 오답 기록을 초기화할까요? 중요 표시는 유지됩니다.')) {
      progress.wrongCount = {}; saveProgress(progress); render();
    }
  });
  const readBtn = document.getElementById('read-review-list');
  if (readBtn) readBtn.addEventListener('click', () => {
    readWordList(reviewTab === 'wrong' ? getWrongWords() : getStarredWords());
  });
  const quizBtn = document.getElementById('review-quiz-btn');
  if (quizBtn) quizBtn.addEventListener('click', () => {
    const words = reviewTab === 'wrong' ? getWrongWords() : getStarredWords();
    goto('quizSetup', { pendingScope: { type: reviewTab === 'wrong' ? 'wrongList' : 'starredList', words } });
  });
}
