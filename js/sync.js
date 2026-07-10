// Firebase(Google 로그인 + Firestore) 기반 기기 간 학습 기록 동기화.
// - firebase-config.js 가 없거나 설정이 비어있으면 완전히 조용히 비활성화되고,
//   지금까지처럼 localStorage만 사용하는 로컬 전용 모드로 동작합니다.
// - 로그인하면 Firestore의 users/{uid} 문서를 진행기록의 단일 소스로 삼아
//   실시간 구독(onSnapshot)하고, 로컬에서 저장할 때마다 Firestore에도 반영합니다.
const Sync = (() => {
  let app = null, auth = null, db = null, user = null;
  let unsubscribeSnapshot = null;
  let saveTimer = null;
  let applyingRemote = false; // 원격에서 받은 변경을 로컬에 반영하는 동안 재-push 방지
  const listeners = [];

  function configured() {
    return typeof window.FIREBASE_CONFIG === 'object'
      && window.FIREBASE_CONFIG
      && window.FIREBASE_CONFIG.apiKey
      && window.FIREBASE_CONFIG.projectId;
  }

  function loadConfigScript() {
    // firebase-config.js 가 없어도(설정 안 한 경우) 콘솔에 404가 남지 않도록
    // <script src> 대신 fetch로 조용히 존재 여부를 먼저 확인한다.
    return fetch('js/firebase-config.js', { method: 'GET' })
      .then(res => {
        if (!res.ok) return false;
        return res.text().then(code => {
          try {
            // eslint-disable-next-line no-new-func
            new Function(code)();
            return true;
          } catch (e) {
            console.warn('firebase-config.js 파싱 실패', e);
            return false;
          }
        });
      })
      .catch(() => false);
  }

  async function init() {
    if (app) return true;
    const hasConfig = await loadConfigScript();
    if (!hasConfig || !configured()) return false;
    try {
      const [{ initializeApp }, authMod, fsMod] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'),
      ]);
      app = initializeApp(window.FIREBASE_CONFIG);
      auth = authMod.getAuth(app);
      db = fsMod.getFirestore(app);
      window._fsMod = fsMod;
      window._authMod = authMod;

      authMod.onAuthStateChanged(auth, (u) => {
        user = u;
        if (u) subscribeRemote();
        else { if (unsubscribeSnapshot) { unsubscribeSnapshot(); unsubscribeSnapshot = null; } }
        listeners.forEach(fn => fn(u));
      });
      return true;
    } catch (e) {
      console.warn('Firebase 초기화 실패(로컬 전용 모드로 계속 진행합니다)', e);
      return false;
    }
  }

  function onAuthChange(fn) { listeners.push(fn); if (app) fn(user); }
  function currentUser() { return user; }

  async function signIn() {
    if (!await init()) { toast('동기화 설정이 아직 안 되어 있습니다. README를 확인하세요.'); return; }
    const provider = new window._authMod.GoogleAuthProvider();
    try {
      await window._authMod.signInWithPopup(auth, provider);
    } catch (e) {
      console.warn('로그인 실패', e);
      const hints = {
        'auth/unauthorized-domain': '이 도메인이 Firebase에 승인되지 않았습니다. Firebase 콘솔 > Authentication > Settings > 승인된 도메인에 이 사이트 주소를 추가하세요.',
        'auth/popup-blocked': '브라우저가 로그인 팝업을 차단했습니다. 팝업 차단을 해제한 뒤 다시 시도하세요.',
        'auth/popup-closed-by-user': '로그인 창이 닫혔습니다. 다시 시도해주세요.',
        'auth/operation-not-allowed': 'Firebase 콘솔에서 Google 로그인 방법이 아직 활성화되지 않았습니다.',
      };
      const hint = hints[e.code] || e.message || '알 수 없는 오류';
      toast(`로그인 실패: ${hint}`, 5000);
    }
  }

  async function signOutUser() {
    if (!auth) return;
    await window._authMod.signOut(auth);
  }

  function subscribeRemote() {
    if (!db || !user) return;
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    const fsMod = window._fsMod;
    const ref = fsMod.doc(db, 'users', user.uid);
    unsubscribeSnapshot = fsMod.onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        // 최초 로그인: 로컬 기록을 클라우드로 업로드
        pushNow(progress);
        return;
      }
      const remote = snap.data();
      if (!remote || !remote.data) return;
      applyingRemote = true;
      progress = mergeProgress(progress, JSON.parse(remote.data));
      saveProgress(progress, { skipRemote: true });
      applyingRemote = false;
      if (typeof render === 'function') render();
    }, (err) => console.warn('Firestore 구독 오류', err));
  }

  // 두 기록을 병합: 학습/중요는 합집합, 오답 횟수는 더 큰 값, 시험이력은 날짜 기준 병합
  function mergeProgress(local, remote) {
    const merged = DEFAULT_PROGRESS();
    merged.learned = Object.assign({}, remote.learned, local.learned);
    merged.starred = Object.assign({}, remote.starred, local.starred);
    merged.wrongCount = {};
    const wcKeys = new Set([...Object.keys(local.wrongCount || {}), ...Object.keys(remote.wrongCount || {})]);
    wcKeys.forEach(k => { merged.wrongCount[k] = Math.max(local.wrongCount?.[k] || 0, remote.wrongCount?.[k] || 0); });
    const seen = new Set();
    merged.examLog = [...(remote.examLog || []), ...(local.examLog || [])]
      .filter(e => { const k = e.date + '_' + e.scope + '_' + e.total; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => a.date - b.date)
      .slice(-200);
    merged.settings = Object.assign({}, DEFAULT_PROGRESS().settings, remote.settings || {}, local.settings || {});
    return merged;
  }

  function pushNow(progressData) {
    if (!db || !user || applyingRemote) return;
    const fsMod = window._fsMod;
    const ref = fsMod.doc(db, 'users', user.uid);
    fsMod.setDoc(ref, { data: JSON.stringify(progressData), updatedAt: Date.now() }, { merge: true })
      .catch(e => console.warn('Firestore 저장 실패', e));
  }

  function scheduleSave(progressData) {
    if (!user || applyingRemote) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => pushNow(progressData), 800);
  }

  return { init, configured, onAuthChange, currentUser, signIn, signOut: signOutUser, scheduleSave };
})();
