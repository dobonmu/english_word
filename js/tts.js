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

  // 문장을 구두점 기준으로 잘게 나눠서 순서대로 이어 읽는다.
  // Chrome 계열 브라우저는 긴 문장을 하나의 utterance로 읽으면 중간에 자꾸
  // 끊기거나(특히 단어 단위로 뚝뚝 끊김) 완전히 멈춰버리는 고질적인 버그가 있는데,
  // 조각을 짧게 나눠 순차 재생하면 이 문제가 크게 줄어든다.
  function splitIntoChunks(text) {
    const parts = text.split(/(?<=[.!?,:;])\s+/).map(s => s.trim()).filter(Boolean);
    return parts.length ? parts : [text];
  }

  // 재생 "세대" 토큰: speak()가 새로 호출될 때마다 1씩 증가시켜, 이전 호출의
  // 순차 재생 루프가 자신의 세대가 낡았음을 감지하고 스스로 멈추게 한다.
  // (cancelRequested 같은 단일 플래그로는 새 speak() 호출이 플래그를 리셋해버려서
  //  이전 루프를 멈추지 못하고 두 재생이 뒤섞이는 문제가 있었다.)
  let generation = 0;

  function speakOne(text, { lang, rate, voiceURI }, myGen) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !text || myGen !== generation) { resolve(); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = rate;
      const v = pickVoice(lang, voiceURI);
      if (v) u.voice = v;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }

  async function speak(text, { lang = 'en-US', rate = 1, voiceURI = null } = {}) {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const myGen = ++generation;
    const chunks = splitIntoChunks(text);
    for (const chunk of chunks) {
      if (myGen !== generation) break;
      await speakOne(chunk, { lang, rate, voiceURI }, myGen);
    }
  }

  function cancel() {
    generation++;
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
