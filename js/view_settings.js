function renderSettings() {
  const s = progress.settings;
  const enVoices = TTS.getVoicesFor('en');
  const krVoices = TTS.getVoicesFor('ko');
  const user = (typeof Sync !== 'undefined') ? Sync.currentUser() : null;
  const syncAvailable = (typeof Sync !== 'undefined') && Sync.configured();

  return `
    <div class="section-card">
      <div class="section-title">&#9729;&#65039; 기기 간 동기화</div>
      ${!syncAvailable ? `
        <div class="hint-text">동기화가 아직 설정되지 않았습니다. README의 "기기 간 동기화 설정하기" 안내를 참고해 firebase-config.js를 만들면, 구글 로그인만으로 폰/PC 학습 기록이 자동으로 합쳐집니다. 설정 전까지는 지금처럼 이 브라우저에만 기록이 저장됩니다.</div>
      ` : user ? `
        <div class="settings-row">
          <div>
            <div class="lbl">${escapeHtml(user.displayName || user.email || '로그인됨')}</div>
            <div class="desc">이 계정으로 로그인한 모든 기기와 학습 기록이 자동으로 합쳐집니다.</div>
          </div>
          <button class="lbtn" id="sync-signout-btn">로그아웃</button>
        </div>
      ` : `
        <div class="hint-text" style="margin-bottom:10px">구글 계정으로 로그인하면 폰과 컴퓨터의 학습 기록이 자동으로 동기화됩니다.</div>
        <button class="big-btn" id="sync-signin-btn">Google 계정으로 로그인</button>
      `}
    </div>

    <div class="section-card">
      <div class="section-title">&#128266; 음성 읽기 (TTS)</div>
      <div class="field">
        <label>읽는 속도: <span id="rate-val">${s.ttsRate.toFixed(1)}x</span></label>
        <input type="range" id="rate-range" min="0.5" max="2" step="0.1" value="${s.ttsRate}">
      </div>
      <div class="field">
        <label>영어 음성</label>
        <select id="en-voice-select">
          <option value="">자동 선택</option>
          ${enVoices.map(v => `<option value="${escapeHtml(v.voiceURI)}" ${s.ttsVoiceEN === v.voiceURI ? 'selected' : ''}>${escapeHtml(v.name)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>한국어 음성</label>
        <select id="kr-voice-select">
          <option value="">자동 선택</option>
          ${krVoices.map(v => `<option value="${escapeHtml(v.voiceURI)}" ${s.ttsVoiceKR === v.voiceURI ? 'selected' : ''}>${escapeHtml(v.name)}</option>`).join('')}
        </select>
      </div>
      <button class="lbtn" id="tts-test-btn">음성 테스트</button>
      ${!TTS.supported() ? `<div class="hint-text" style="color:var(--text-danger)">이 브라우저는 음성 읽기를 지원하지 않습니다.</div>` : ''}
    </div>

    <div class="section-card">
      <div class="section-title">&#127912; 화면</div>
      <div class="settings-row">
        <div>
          <div class="lbl">테마</div>
          <div class="desc">시스템 설정을 따르거나 직접 선택할 수 있습니다.</div>
        </div>
        <div class="seg" style="width:auto">
          <button class="${s.theme === 'system' ? 'on' : ''}" data-theme="system">자동</button>
          <button class="${s.theme === 'light' ? 'on' : ''}" data-theme="light">라이트</button>
          <button class="${s.theme === 'dark' ? 'on' : ''}" data-theme="dark">다크</button>
        </div>
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">&#11088; 학습 기록</div>
      <div class="field">
        <label>몇 번 틀리면 자동으로 중요 표시할까요?</label>
        <input type="number" id="threshold-input" min="1" max="20" value="${s.autoStarThreshold}">
      </div>
      <div class="hint-text" style="margin-bottom:10px">현재: 암기 완료 ${Object.keys(progress.learned).length}개 · 중요 표시 ${Object.keys(progress.starred).length}개 · 오답 기록 ${Object.keys(progress.wrongCount).length}개 · 시험 이력 ${progress.examLog.length}건</div>
      <div class="file-actions">
        <button class="lbtn" id="export-btn">기록 내보내기 (JSON)</button>
        <button class="lbtn" id="import-btn">기록 가져오기</button>
        <input type="file" id="import-file" accept="application/json" class="hidden">
      </div>
      <div class="row-btns" style="margin-top:14px">
        <button class="big-btn danger" id="reset-all-btn">모든 학습 기록 초기화</button>
      </div>
    </div>
  `;
}

function bindSettings() {
  const signInBtn = document.getElementById('sync-signin-btn');
  if (signInBtn) signInBtn.addEventListener('click', async () => { await Sync.signIn(); render(); });
  const signOutBtn = document.getElementById('sync-signout-btn');
  if (signOutBtn) signOutBtn.addEventListener('click', async () => { await Sync.signOut(); render(); });

  const rateRange = document.getElementById('rate-range');
  if (rateRange) rateRange.addEventListener('input', () => {
    progress.settings.ttsRate = parseFloat(rateRange.value);
    document.getElementById('rate-val').textContent = progress.settings.ttsRate.toFixed(1) + 'x';
    saveProgress(progress);
  });
  const enSel = document.getElementById('en-voice-select');
  if (enSel) enSel.addEventListener('change', () => { progress.settings.ttsVoiceEN = enSel.value; saveProgress(progress); });
  const krSel = document.getElementById('kr-voice-select');
  if (krSel) krSel.addEventListener('change', () => { progress.settings.ttsVoiceKR = krSel.value; saveProgress(progress); });
  const testBtn = document.getElementById('tts-test-btn');
  if (testBtn) testBtn.addEventListener('click', () => {
    TTS.speakWordAndMeaning('Abandon', '버리다, 포기하다', progress.settings);
  });

  document.querySelectorAll('[data-theme]').forEach(b => b.addEventListener('click', () => {
    progress.settings.theme = b.dataset.theme; saveProgress(progress); applyTheme(); render();
  }));

  const thresholdInput = document.getElementById('threshold-input');
  if (thresholdInput) thresholdInput.addEventListener('input', () => {
    progress.settings.autoStarThreshold = parseInt(thresholdInput.value) || 3;
    saveProgress(progress);
  });

  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) exportBtn.addEventListener('click', () => { exportProgressFile(progress); toast('기록을 내보냈습니다.'); });

  const importBtn = document.getElementById('import-btn');
  const importFile = document.getElementById('import-file');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async () => {
      const file = importFile.files[0];
      if (!file) return;
      try {
        const merged = await importProgressFile(file);
        progress = merged;
        saveProgress(progress);
        applyTheme();
        toast('기록을 가져왔습니다.');
        render();
      } catch (e) {
        toast('파일을 읽을 수 없습니다.');
      }
    });
  }

  const resetAllBtn = document.getElementById('reset-all-btn');
  if (resetAllBtn) resetAllBtn.addEventListener('click', () => {
    if (confirm('정말 모든 학습 기록(암기 완료, 중요 표시, 오답, 시험 이력)을 초기화할까요? 되돌릴 수 없습니다.')) {
      progress = DEFAULT_PROGRESS();
      saveProgress(progress);
      applyTheme();
      toast('모든 기록을 초기화했습니다.');
      goto('home');
    }
  });
}
