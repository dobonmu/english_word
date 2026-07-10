// ===== 전역 상태 =====
const ALL_WORDS = flattenVocab(VOCAB_DATA);
const UNIT_NAMES = Object.keys(VOCAB_DATA);

let progress = loadProgress();
applyTheme();

let state = {
  page: 'home',          // home | browse | quizSetup | quiz | quizResult | writeSetup | writeQuiz | writeResult | mock | review | settings
  unit: UNIT_NAMES[0] || null,
  view: 'list',           // list | card
  search: '',
  idx: 0,
  flipped: false,
  shuffle: false,
  displayMode: 'both',    // both | wordOnly | meaningOnly
  cardOrder: null,        // shuffled order cache (array of indices) for current filtered set
  reading: false,
};

function currentWords() {
  return VOCAB_DATA[state.unit] || [];
}

function getFiltered() {
  const words = currentWords().map(w => Object.assign({ unit: state.unit, key: wordKey(state.unit, w.word) }, w));
  if (!state.search.trim()) return words;
  const s = state.search.toLowerCase();
  return words.filter(w => w.word.toLowerCase().includes(s) || w.meaning.includes(s));
}

function getOrderedFiltered() {
  const filtered = getFiltered();
  if (!state.shuffle) return filtered;
  if (!state.cardOrder || state.cardOrder.length !== filtered.length) {
    state.cardOrder = shuffleArray(filtered.map((_, i) => i));
  }
  return state.cardOrder.map(i => filtered[i]);
}

function isStarred(key) { return !!progress.starred[key]; }
function isLearned(key) { return !!progress.learned[key]; }
function wrongCountOf(key) { return progress.wrongCount[key] || 0; }

function toggleStar(key) {
  if (progress.starred[key]) delete progress.starred[key];
  else progress.starred[key] = true;
  saveProgress(progress);
}

function toggleLearned(key) {
  if (progress.learned[key]) delete progress.learned[key];
  else progress.learned[key] = true;
  saveProgress(progress);
}

function recordWrong(key) {
  progress.wrongCount[key] = (progress.wrongCount[key] || 0) + 1;
  if (progress.wrongCount[key] >= progress.settings.autoStarThreshold) {
    progress.starred[key] = true;
  }
  saveProgress(progress);
}

function resetWrongFor(key) {
  delete progress.wrongCount[key];
  saveProgress(progress);
}

function applyTheme() {
  const t = progress.settings.theme || 'system';
  if (t === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}

function findWordMeta(unit, word) {
  const list = VOCAB_DATA[unit] || [];
  return list.find(w => w.word === word);
}

function wordsFromKeys(keys) {
  return keys.map(k => {
    const idx = k.lastIndexOf('::');
    const unit = k.slice(0, idx);
    const word = k.slice(idx + 2);
    const meta = findWordMeta(unit, word);
    if (!meta) return null;
    return Object.assign({ unit, key: k }, meta);
  }).filter(Boolean);
}

function getWrongWords() {
  return wordsFromKeys(Object.keys(progress.wrongCount).filter(k => progress.wrongCount[k] > 0))
    .sort((a, b) => wrongCountOf(b.key) - wrongCountOf(a.key));
}

function getStarredWords() {
  return wordsFromKeys(Object.keys(progress.starred));
}

// ===== 라우팅 =====
function goto(page, extra) {
  state.page = page;
  Object.assign(state, extra || {});
  render();
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

// ===== 렌더 루트 =====
function render() {
  const root = document.getElementById('root');
  root.innerHTML = `
    ${renderHeader()}
    <div class="main" id="main">${renderPage()}</div>
  `;
  bindHeaderEvents();
  bindPageEvents();
}

function renderHeader() {
  const navItems = [
    { id: 'home', label: '홈' },
    { id: 'browse', label: '단어 보기' },
    { id: 'quizSetup', label: '시험' },
    { id: 'writeSetup', label: '쓰기시험' },
    { id: 'mock', label: '모의고사' },
    { id: 'review', label: '오답/중요' },
  ];
  const navHtml = navItems.map(n => {
    const on = samePageGroup(state.page, n.id) ? 'on' : '';
    return `<button class="nav-btn ${on}" data-nav="${n.id}">${n.label}</button>`;
  }).join('');

  return `
    <div class="hdr">
      <div class="hdr-top">
        <h1>필수 영단어장</h1>
        <div class="hdr-actions">
          <button class="icon-btn" id="settings-btn" title="설정">&#9881;</button>
        </div>
      </div>
      <div class="nav-row-wrap"><div class="nav-row">${navHtml}</div></div>
    </div>
  `;
}

function samePageGroup(page, navId) {
  const groups = {
    home: ['home'],
    browse: ['browse'],
    quizSetup: ['quizSetup', 'quiz', 'quizResult'],
    writeSetup: ['writeSetup', 'writeQuiz', 'writeResult'],
    mock: ['mockSetup', 'mock', 'mockQuiz', 'mockResult'],
    review: ['review'],
  };
  return (groups[navId] || []).includes(page);
}

function bindHeaderEvents() {
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.nav;
      if (id === 'mock') goto('mockSetup');
      else goto(id);
    });
  });
  const sb = document.getElementById('settings-btn');
  if (sb) sb.addEventListener('click', () => goto('settings'));
}

function renderPage() {
  switch (state.page) {
    case 'home': return renderHome();
    case 'browse': return renderBrowse();
    case 'settings': return renderSettings();
    case 'review': return renderReview();
    case 'quizSetup': return renderQuizSetup();
    case 'quiz': return renderQuiz();
    case 'quizResult': return renderQuizResult();
    case 'writeSetup': return renderQuizSetup(true);
    case 'writeQuiz': return renderQuiz();
    case 'writeResult': return renderQuizResult();
    case 'mockSetup': return renderQuizSetup(false, true);
    case 'mockQuiz': return renderQuiz();
    case 'mockResult': return renderQuizResult();
    default: return renderHome();
  }
}

function bindPageEvents() {
  switch (state.page) {
    case 'home': return bindHome();
    case 'browse': return bindBrowse();
    case 'settings': return bindSettings();
    case 'review': return bindReview();
    case 'quizSetup': case 'writeSetup': case 'mockSetup': return bindQuizSetup();
    case 'quiz': case 'writeQuiz': case 'mockQuiz': return bindQuiz();
    case 'quizResult': case 'writeResult': case 'mockResult': return bindQuizResult();
  }
}

// kick off
document.addEventListener('DOMContentLoaded', () => {
  render();
});
