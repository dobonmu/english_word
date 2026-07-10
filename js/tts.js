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

  function speak(text, { lang = 'en-US', rate = 1, voiceURI = null } = {}) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !text) { resolve(); return; }
      window.speechSynthesis.cancel();
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

  function cancel() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  async function speakWordAndMeaning(word, meaning, settings) {
    cancel();
    await speak(word, { lang: 'en-US', rate: settings.ttsRate, voiceURI: settings.ttsVoiceEN });
    await new Promise(r => setTimeout(r, 250));
    await speak(meaning, { lang: 'ko-KR', rate: settings.ttsRate, voiceURI: settings.ttsVoiceKR });
  }

  function supported() {
    return !!window.speechSynthesis;
  }

  return { onReady, speak, cancel, speakWordAndMeaning, getVoicesFor, supported };
})();
