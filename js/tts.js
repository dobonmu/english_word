// Web Speech API 기반 TTS. 영어 단어 + 한국어 뜻 읽기를 지원합니다.
const TTS = (() => {
  let voices = [];
  let ready = false;
  const listeners = [];

  function refreshVoices() {
    voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    if (voices.length && !ready) {
      ready = true;
      listeners.forEach(fn => fn());
      listeners.length = 0;
    }
  }

  if (window.speechSynthesis) {
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }

  function onReady(fn) {
    if (ready) fn();
    else listeners.push(fn);
  }

  function pickVoice(lang, preferredURI) {
    if (preferredURI) {
      const v = voices.find(v => v.voiceURI === preferredURI);
      if (v) return v;
    }
    const exact = voices.filter(v => v.lang && v.lang.toLowerCase() === lang.toLowerCase());
    if (exact.length) return exact[0];
    const prefix = lang.split('-')[0];
    const partial = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(prefix));
    return partial[0] || null;
  }

  function getVoicesFor(langPrefix) {
    return voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
  }

  // Chrome/Safari의 Web Speech API는 발화가 조금만 길어져도(대략 15초 이상)
  // 내부적으로 멈춰버리는 고질적인 버그가 있다. speaking 상태인 동안 주기적으로
  // pause()/resume()을 호출해 깨워주면 끊기지 않고 끝까지 재생된다.
  let keepAliveTimer = null;
  function startKeepAlive() {
    stopKeepAlive();
    keepAliveTimer = setInterval(() => {
      if (!window.speechSynthesis) return;
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 5000);
  }
  function stopKeepAlive() {
    if (keepAliveTimer) { clearInterval(keepAliveTimer); keepAliveTimer = null; }
  }

  function speak(text, { lang = 'en-US', rate = 1, voiceURI = null } = {}) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !text) { resolve(); return; }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = rate;
      const v = pickVoice(lang, voiceURI);
      if (v) u.voice = v;
      startKeepAlive();
      u.onend = () => { stopKeepAlive(); resolve(); };
      u.onerror = () => { stopKeepAlive(); resolve(); };
      window.speechSynthesis.speak(u);
    });
  }

  function cancel() {
    stopKeepAlive();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  async function speakWordAndMeaning(word, meaning, settings) {
    cancel();
    await speak(word, { lang: 'en-US', rate: settings.ttsRate, voiceURI: settings.ttsVoiceEN });
    if (settings.ttsEnglishOnly) return;
    await new Promise(r => setTimeout(r, 250));
    await speak(meaning, { lang: 'ko-KR', rate: settings.ttsRate, voiceURI: settings.ttsVoiceKR });
  }

  function supported() {
    return !!window.speechSynthesis;
  }

  // iOS/모바일 브라우저는 사용자가 화면을 처음 탭한 시점(제스처) 안에서
  // speechSynthesis.speak()를 한번 호출해줘야 이후 taps 없이도 재생이 막히지 않는다.
  // 무음(빈 문자열은 무시되므로 공백 하나)으로 아주 짧게 "예열"만 한다.
  let unlocked = false;
  function unlockOnFirstGesture() {
    if (unlocked || !window.speechSynthesis) return;
    unlocked = true;
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch (e) { /* noop */ }
  }
  ['pointerdown', 'touchstart', 'click'].forEach(evt => {
    window.addEventListener(evt, unlockOnFirstGesture, { once: true, passive: true });
  });

  return { onReady, speak, cancel, speakWordAndMeaning, getVoicesFor, supported };
})();
