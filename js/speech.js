let voiceList = [];
// Some browsers list their voices only after a moment, so the speaker and
// the deck's voice note are brought up to date whenever the list arrives.
function refreshVoices(){
  if(!('speechSynthesis' in window)) return;
  voiceList = window.speechSynthesis.getVoices();
  updateSpeakers();
  updateVoiceNote();
}
if('speechSynthesis' in window){
  voiceList = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

// A voice's language in lower case with hyphens. Some Android voices report
// Mandarin as cmn rather than zh.
function voiceLangOf(v){
  return String(v.lang || '').replace(/_/g, '-').toLowerCase().replace(/^cmn(?=-|$)/, 'zh');
}
// The installed voice for a language tag: the same language and region if
// there is one, else the same language from another region. Mandarin never
// falls back to a Cantonese voice (zh-HK, zh-MO, yue), which would read the
// words in a different language.
function pickVoice(tag){
  const want = tag.toLowerCase(), base = want.split('-')[0];
  const cantonese = l => /^yue(-|$)/.test(l) || /^zh-(hk|mo|yue)(-|$)/.test(l);
  return voiceList.find(v => voiceLangOf(v) === want) ||
    voiceList.find(v => {
      const l = voiceLangOf(v);
      return l.split('-')[0] === base && cantonese(l) === cantonese(want);
    }) || null;
}
// Whether to offer the speaker for a language. Until the browser has listed
// its voices there is no telling, so the speaker stays.
function canSpeak(tag){
  if(!('speechSynthesis' in window)) return false;
  return voiceList.length === 0 || !!pickVoice(tag);
}
function deckVoice(deckId){
  const d = deckById(deckId);
  return d ? d.voice : curDeck().voice;
}
// The speaker buttons are built with the card and shown or hidden here, so
// voices arriving late never re-render a card that is half typed.
function updateSpeakers(){
  ['speakBtn', 'learnSpeak'].forEach(id=>{
    const b = document.getElementById(id);
    if(b) b.hidden = !canSpeak(curDeck().voice);
  });
}

function speak(text, btn, tag){
  if(!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  if(voiceList.length === 0) voiceList = synth.getVoices();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = tag;
  u.rate = 0.9;
  const match = pickVoice(tag);
  if(match) u.voice = match;
  if(btn){
    btn.classList.add('speaking');
    u.onend = ()=>btn.classList.remove('speaking');
    u.onerror = ()=>btn.classList.remove('speaking');
  }
  if(synth.speaking || synth.pending) synth.cancel();
  synth.resume();
  synth.speak(u);
}
