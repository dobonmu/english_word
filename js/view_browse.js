function renderBrowse() {
  const words = currentWords();
  const filtered = getFiltered();
  const ordered = getOrderedFiltered();
  const lc = words.filter(w => isLearned(wordKey(state.unit, w.word))).length;
  const cur = ordered[state.idx];

  const tabsHtml = UNIT_NAMES.map(u =>
    `<button class="unit-check ${u === state.unit ? 'on' : ''}" data-unit="${escapeHtml(u)}">${escapeHtml(u)}</button>`
  ).join('');

  let contentHtml = '';
  if (state.view === 'list') {
    contentHtml = renderListView(filtered);
  } else {
    contentHtml = renderCardView(ordered, cur, words.length, lc);
  }

  return `
    <div class="section-card" style="padding:14px 16px">
      <div class="unit-check-list">${tabsHtml}</div>
    </div>
    <div class="ctrl">
      <input type="text" placeholder="단어 또는 의미 검색..." id="srch" value="${escapeHtml(state.search)}">
      <div class="vtog">
        <button class="${state.view === 'list' ? 'on' : ''}" id="vlist">목록</button>
        <button class="${state.view === 'card' ? 'on' : ''}" id="vcard">카드</button>
      </div>
      <span class="cnt">${filtered.length}단어 · 암기 ${lc}/${words.length}</span>
    </div>
    ${state.view === 'card' ? renderCardToolbar() : ''}
    ${contentHtml}
  `;
}

function renderCardToolbar() {
  return `
    <div class="mode-toolbar">
      <button class="chip ${state.shuffle ? 'on' : ''}" id="chip-shuffle">&#128256; 셔플</button>
      <button class="chip ${state.displayMode === 'wordOnly' ? 'on' : ''}" id="chip-word-only">단어만</button>
      <button class="chip ${state.displayMode === 'meaningOnly' ? 'on' : ''}" id="chip-meaning-only">뜻만</button>
      <button class="chip ${state.displayMode === 'both' ? 'on' : ''}" id="chip-both">모두 보기</button>
      <button class="chip" id="chip-read">&#128266; 이 목록 읽어주기</button>
    </div>
  `;
}

function renderListView(filtered) {
  if (filtered.length === 0) return `<div class="empty">검색 결과가 없습니다.</div>`;
  const rows = filtered.map(w => {
    const starred = isStarred(w.key);
    const wc = wrongCountOf(w.key);
    return `
      <div class="trow" data-key="${escapeHtml(w.key)}">
        <div class="trow-top">
          <span class="trow-num">${w.id}</span>
          <span class="trow-word">${escapeHtml(w.word)}</span>
          <span class="trow-meaning">${escapeHtml(w.meaning)}</span>
          <span class="trow-badges">
            ${wc > 0 ? `<span class="wrongtag">${wc}회 오답</span>` : ''}
            <button class="badge speak" data-speak="${escapeHtml(w.key)}" title="읽기">&#128266;</button>
            <button class="badge star ${starred ? 'on' : ''}" data-star="${escapeHtml(w.key)}" title="중요 표시">&#9733;</button>
          </span>
        </div>
        ${w.ex_en ? `<div class="trow-ex"><span class="en">${escapeHtml(w.ex_en)}</span><br><span class="kr">${escapeHtml(w.ex_kr || '')}</span></div>` : ''}
        ${w.note ? `<div class="trow-note">${escapeHtml(w.note)}</div>` : ''}
      </div>`;
  }).join('');
  return `<div class="tbl">${rows}</div>`;
}

function renderCardView(ordered, cur, total, learnedCount) {
  if (ordered.length === 0) return `<div class="empty">검색 결과가 없습니다.</div>`;
  const dots = ordered.map((w, i) =>
    `<div class="pdot ${i === state.idx ? 'cur' : ''} ${isLearned(w.key) ? 'lrn' : ''}" data-fc-idx="${i}"></div>`
  ).join('');
  const starred = cur && isStarred(cur.key);
  const learned = cur && isLearned(cur.key);
  const mode = state.displayMode; // both | wordOnly | meaningOnly

  // both 모드: 뒤집기 없이 앞면에 단어+뜻+예문을 모두 보여준다.
  // wordOnly 모드: 앞면 단어만, 클릭하면 뒤집어서 뜻 확인.
  // meaningOnly 모드: 앞면 뜻만, 클릭하면 뒤집어서 단어 확인.
  let frontHtml, backHtml, hint;
  if (mode === 'both') {
    frontHtml = `
      <div class="cnum">${state.idx + 1} / ${ordered.length}</div>
      <div class="cword">${cur ? escapeHtml(cur.word) : ''}</div>
      <div class="cmean">${cur ? escapeHtml(cur.meaning) : ''}</div>
      <div class="cex">
        <div class="en">${cur ? escapeHtml(cur.ex_en || '') : ''}</div>
        <div>${cur ? escapeHtml(cur.ex_kr || '') : ''}</div>
      </div>
      ${cur && cur.note ? `<div class="cnote">${escapeHtml(cur.note)}</div>` : ''}`;
    backHtml = frontHtml;
    hint = '';
  } else if (mode === 'meaningOnly') {
    frontHtml = `
      <div class="cnum">${state.idx + 1} / ${ordered.length}</div>
      <div class="cword">${cur ? escapeHtml(cur.meaning) : ''}</div>
      <div class="chint">카드를 누르면 발음만 재생돼요. 단어는 아래 '정답 보기'로 확인하세요.</div>`;
    backHtml = `
      <div class="cnum">${cur ? cur.id : ''}</div>
      <div class="cmean">${cur ? escapeHtml(cur.word) : ''}</div>
      <div class="cex">
        <div class="en">${cur ? escapeHtml(cur.ex_en || '') : ''}</div>
        <div>${cur ? escapeHtml(cur.ex_kr || '') : ''}</div>
      </div>
      ${cur && cur.note ? `<div class="cnote">${escapeHtml(cur.note)}</div>` : ''}`;
  } else {
    frontHtml = `
      <div class="cnum">${state.idx + 1} / ${ordered.length}</div>
      <div class="cword">${cur ? escapeHtml(cur.word) : ''}</div>
      <div class="chint">카드를 누르면 발음만 재생돼요. 뜻은 아래 '정답 보기'로 확인하세요.</div>`;
    backHtml = `
      <div class="cnum">${cur ? cur.id : ''}</div>
      <div class="cmean">${cur ? escapeHtml(cur.meaning) : ''}</div>
      <div class="cex">
        <div class="en">${cur ? escapeHtml(cur.ex_en || '') : ''}</div>
        <div>${cur ? escapeHtml(cur.ex_kr || '') : ''}</div>
      </div>
      ${cur && cur.note ? `<div class="cnote">${escapeHtml(cur.note)}</div>` : ''}`;
  }

  return `
    <div class="fc">
      <div class="prog">${dots}</div>
      <div class="cw" id="card-wrap">
        <div class="ci ${state.flipped ? 'flip' : ''}" id="card-inner">
          <div class="cf">
            <button class="cstar ${starred ? 'on' : ''}" data-star-card="1" title="중요 표시">&#9733;</button>
            <button class="cspeak" data-speak-card="1" title="읽기">&#128266;</button>
            ${frontHtml}
          </div>
          <div class="cb">
            <button class="cstar ${starred ? 'on' : ''}" data-star-card="1" title="중요 표시">&#9733;</button>
            <button class="cspeak" data-speak-card="1" title="읽기">&#128266;</button>
            ${backHtml}
          </div>
        </div>
      </div>
      <div class="nav">
        <button class="nbtn" id="prev-btn" ${state.idx === 0 ? 'disabled' : ''}>&#8592;</button>
        <span class="ncnt">${state.idx + 1} / ${ordered.length}</span>
        <button class="nbtn" id="next-btn" ${state.idx === ordered.length - 1 ? 'disabled' : ''}>&#8594;</button>
      </div>
      <div class="row-btns">
        ${mode !== 'both' ? `<button class="lbtn ${state.flipped ? 'shuffle-on' : ''}" id="reveal-card-btn">${state.flipped ? '숨기기' : (mode === 'meaningOnly' ? '정답(단어) 보기' : '정답(뜻) 보기')}</button>` : ''}
        <button class="lbtn ${learned ? 'done' : ''}" id="lrn-btn">${learned ? '&#10003; 암기 완료' : '암기 완료로 표시'}</button>
      </div>
      <div class="stats">
        <div class="stat"><div class="sd" style="background:var(--fill-success)"></div>암기 완료 ${learnedCount}</div>
        <div class="stat"><div class="sd" style="background:var(--border-strong)"></div>미암기 ${total - learnedCount}</div>
      </div>
    </div>`;
}

function bindBrowse() {
  document.querySelectorAll('[data-unit]').forEach(b => b.addEventListener('click', () => {
    state.unit = b.dataset.unit; state.idx = 0; state.search = ''; state.flipped = false; state.cardOrder = null;
    render();
  }));
  const si = document.getElementById('srch');
  if (si) si.addEventListener('input', e => { state.search = e.target.value; state.idx = 0; state.flipped = false; state.cardOrder = null; render(); });
  const vl = document.getElementById('vlist');
  if (vl) vl.addEventListener('click', () => { state.view = 'list'; render(); });
  const vc = document.getElementById('vcard');
  if (vc) vc.addEventListener('click', () => { state.view = 'card'; state.idx = 0; state.flipped = false; render(); });

  // list view actions: 행을 탭하면 발음이 재생됩니다.
  document.querySelectorAll('.trow[data-key]').forEach(row => row.addEventListener('click', () => {
    const w = getFiltered().find(x => x.key === row.dataset.key);
    if (w) TTS.speakWordAndMeaning(w.word, w.meaning, progress.settings);
  }));
  document.querySelectorAll('[data-star]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation(); toggleStar(b.dataset.star); render();
  }));
  document.querySelectorAll('[data-speak]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const w = getFiltered().find(x => x.key === b.dataset.speak);
    if (w) TTS.speakWordAndMeaning(w.word, w.meaning, progress.settings);
  }));

  // card view actions: 카드를 탭하면 발음만 재생됩니다(정답 공개는 별도 버튼).
  const cw = document.getElementById('card-wrap');
  if (cw) cw.addEventListener('click', () => {
    const f = getOrderedFiltered(); const cur = f[state.idx];
    if (cur) TTS.speakWordAndMeaning(cur.word, cur.meaning, progress.settings);
  });
  const revealBtn = document.getElementById('reveal-card-btn');
  if (revealBtn) revealBtn.addEventListener('click', e => {
    e.stopPropagation();
    state.flipped = !state.flipped; render();
  });
  const pb = document.getElementById('prev-btn');
  if (pb) pb.addEventListener('click', e => { e.stopPropagation(); state.flipped = false; state.idx = Math.max(0, state.idx - 1); render(); });
  const nb = document.getElementById('next-btn');
  if (nb) nb.addEventListener('click', e => { e.stopPropagation(); const f = getOrderedFiltered(); state.flipped = false; state.idx = Math.min(f.length - 1, state.idx + 1); render(); });
  const lb = document.getElementById('lrn-btn');
  if (lb) lb.addEventListener('click', e => {
    e.stopPropagation();
    const f = getOrderedFiltered(); const cur = f[state.idx];
    if (!cur) return;
    toggleLearned(cur.key); render();
  });
  document.querySelectorAll('.pdot').forEach(d => d.addEventListener('click', e => {
    e.stopPropagation(); state.idx = parseInt(d.dataset.fcIdx); state.flipped = false; render();
  }));
  document.querySelectorAll('[data-star-card]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const f = getOrderedFiltered(); const cur = f[state.idx];
    if (cur) { toggleStar(cur.key); render(); }
  }));
  document.querySelectorAll('[data-speak-card]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const f = getOrderedFiltered(); const cur = f[state.idx];
    if (cur) TTS.speakWordAndMeaning(cur.word, cur.meaning, progress.settings);
  }));

  // toolbar chips
  const chipShuffle = document.getElementById('chip-shuffle');
  if (chipShuffle) chipShuffle.addEventListener('click', () => {
    state.shuffle = !state.shuffle; state.idx = 0; state.flipped = false; state.cardOrder = null; render();
  });
  const chipWordOnly = document.getElementById('chip-word-only');
  if (chipWordOnly) chipWordOnly.addEventListener('click', () => { state.displayMode = 'wordOnly'; state.flipped = false; render(); });
  const chipMeaningOnly = document.getElementById('chip-meaning-only');
  if (chipMeaningOnly) chipMeaningOnly.addEventListener('click', () => { state.displayMode = 'meaningOnly'; state.flipped = false; render(); });
  const chipBoth = document.getElementById('chip-both');
  if (chipBoth) chipBoth.addEventListener('click', () => { state.displayMode = 'both'; state.flipped = false; render(); });
  const chipRead = document.getElementById('chip-read');
  if (chipRead) chipRead.addEventListener('click', () => {
    readWordList(getOrderedFiltered());
  });
}

let readingCancelled = false;
async function readWordList(words) {
  if (!TTS.supported()) { toast('이 브라우저는 음성 읽기를 지원하지 않습니다.'); return; }
  readingCancelled = false;
  toast('단어 읽기를 시작합니다. (다시 누르면 중지)');
  const btn = document.getElementById('chip-read');
  if (btn) {
    btn.textContent = '⏹ 읽기 중지';
    btn.classList.add('on');
    btn.onclick = () => { readingCancelled = true; TTS.cancel(); };
  }
  for (const w of shuffleArray(words)) {
    if (readingCancelled) break;
    await TTS.speakWordAndMeaning(w.word, w.meaning, progress.settings);
    if (readingCancelled) break;
    await new Promise(r => setTimeout(r, 350));
  }
  if (state.page === 'browse') render();
}
