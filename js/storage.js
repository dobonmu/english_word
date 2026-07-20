// 로컬 저장소(localStorage) 래퍼: 진행기록, 오답, 중요표시, 설정
const STORAGE_KEY = 'vocab_app_progress_v1';

const DEFAULT_PROGRESS = () => ({
  learned: {},      // { wordKey: true }
  starred: {},       // { wordKey: true }
  wrongCount: {},     // { wordKey: number }
  examLog: [],       // [{date, mode, scope, total, correct, wrong, partial}]
  wordMarks: {},      // Writing/Speaking 문장 안 개별 단어 마킹 { "markKey": "wrong" | "important" }
  settings: {
    ttsRate: 1,
    ttsVoiceEN: '',
    ttsVoiceKR: '',
    ttsEnglishOnly: false, // true면 한국어 뜻을 읽지 않고 영어 단어만 읽음
    autoStarThreshold: 3,
    theme: 'system' // system | light | dark
  }
});

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS();
    const parsed = JSON.parse(raw);
    return Object.assign(DEFAULT_PROGRESS(), parsed, {
      settings: Object.assign(DEFAULT_PROGRESS().settings, parsed.settings || {})
    });
  } catch (e) {
    console.warn('진행기록 로드 실패, 초기값 사용', e);
    return DEFAULT_PROGRESS();
  }
}

function saveProgress(progress, opts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('진행기록 저장 실패', e);
  }
  if (!(opts && opts.skipRemote) && typeof Sync !== 'undefined') {
    Sync.scheduleSave(progress);
  }
}

function wordKey(unit, word) {
  return `${unit}::${word}`;
}

function exportProgressFile(progress) {
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const ts = now.toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.href = url;
  a.download = `vocab-progress-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importProgressFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const merged = Object.assign(DEFAULT_PROGRESS(), parsed, {
          settings: Object.assign(DEFAULT_PROGRESS().settings, parsed.settings || {})
        });
        resolve(merged);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
