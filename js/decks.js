/* ---------- Decks ---------- */

const DECK_ID_RE = /^(default|k[0-9A-Z]{10})$/;
function deckIdOr(id){
  return typeof id === 'string' && DECK_ID_RE.test(id) ? id : DEFAULT_DECK;
}
function newDeckId(){
  return 'k' + randomCrockford(10);
}
// Collapses runs of spaces and caps the length in characters rather than
// UTF-16 units, so a cut never splits an emoji or a surrogate pair.
function cleanDeckName(name){
  const s = String(name == null ? '' : name).normalize('NFC').replace(/\s+/g, ' ').trim();
  return Array.from(s).slice(0, DECK_NAME_MAX).join('').trim();
}
// Names compare like words, so "german" and "German " are the same name.
function deckNameKey(name){
  return normWord(cleanDeckName(name));
}
// A BCP-47 language with an optional region, such as de-DE or zh-CN, in its
// canonical case. Anything else falls back to American English.
function cleanVoice(v){
  const m = /^([a-zA-Z]{2,3})(?:[-_]([a-zA-Z]{2}|\d{3}))?$/.exec(String(v == null ? '' : v).trim());
  return m ? m[1].toLowerCase() + (m[2] ? '-' + m[2].toUpperCase() : '') : 'en-US';
}
// Deck entries from storage, backups and other devices are checked field by
// field, and come out with their keys in a fixed order for comparison.
// `changedAt` dates the name and voice; `activeAt` is when words were last
// added, which counts as using the deck but must not override a rename.
function readDeckEntry(x){
  if(!x || typeof x !== 'object' || typeof x.id !== 'string' || !DECK_ID_RE.test(x.id)) return null;
  const name = cleanDeckName(x.name);
  if(!name) return null;
  return {id: x.id, name, voice: cleanVoice(x.voice), changedAt: Number.isFinite(+x.changedAt) ? +x.changedAt : 0,
          activeAt: Number.isFinite(+x.activeAt) ? +x.activeAt : 0};
}
// New words carry no edit time of their own (see addedStamp), so adding them
// is recorded on the deck instead. That keeps a deck that was deleted on
// another device in the meantime, rather than losing the words.
function noteDeckActive(id){
  const d = deckById(id);
  if(!d) return;
  d.activeAt = Date.now();
  saveDecks();
}
// A deleted deck keeps its name and voice, so it can come back as it was.
function readDeckTombstone(x){
  if(!x || typeof x !== 'object' || typeof x.id !== 'string' || !DECK_ID_RE.test(x.id)
     || !Number.isFinite(+x.changedAt)) return null;
  // It also keeps activeAt, so a merge never forgets words added to a deck
  // just because the deck is deleted at the moment.
  const tb = {id: x.id, name: cleanDeckName(x.name) || DEFAULT_DECK_NAME, voice: cleanVoice(x.voice),
              changedAt: +x.changedAt, activeAt: Number.isFinite(+x.activeAt) ? +x.activeAt : 0, deleted: true};
  // A combined deck points at the deck it went into. That is always a lower
  // id, so a chain of them can never loop.
  if(typeof x.mergedInto === 'string' && DECK_ID_RE.test(x.mergedInto) && x.mergedInto < x.id) tb.mergedInto = x.mergedInto;
  return tb;
}

function deckById(id){
  return decks.find(d => d.id === id) || null;
}
function curDeck(){
  return deckById(currentDeck) || decks[0];
}
function deckCards(){
  return cards.filter(c => c.deck === currentDeck);
}
// The sample words are English, so they are offered only in English decks.
function isEnglishDeck(){
  return /^en(-|$)/.test(curDeck().voice);
}

// There is always a deck to show, and every card's deck exists. On the first
// run with decks this creates the default deck for the existing words, named
// IELTS, with the voice this device was using. A card can also arrive for a
// deck nothing here knows, from a device offline for longer than tombstones
// are kept; it gets a deck rather than being lost. Edit time 0 lets any real
// rename win once decks sync.
function ensureDecks(){
  const missing = new Set(cards.filter(c => !deckById(c.deck)).map(c => c.deck));
  if(!decks.length) missing.add(DEFAULT_DECK);
  missing.forEach(id=>{
    let name = id === DEFAULT_DECK ? DEFAULT_DECK_NAME : t('deckRecovered');
    for(let n = 2; deckNameProblem(name); n++) name = (id === DEFAULT_DECK ? DEFAULT_DECK_NAME : t('deckRecovered')) + ' ' + n;
    decks.push({id, name, voice: cleanVoice(settings.voice), changedAt: 0, activeAt: 0});
  });
  if(missing.size) saveDecks();
  if(!deckById(currentDeck)) currentDeck = sortedDecks()[0].id;
}

// The local deck that an imported deck's words go to: the same deck by id,
// else one with the same name, else the imported deck itself, added here.
// With no deck (an older backup) it is the default deck, recreated if it was
// deleted.
function adoptDeck(d){
  const want = d || {id: DEFAULT_DECK, name: DEFAULT_DECK_NAME, voice: cleanVoice(settings.voice)};
  if(deckById(want.id)) return want.id;
  const k = deckNameKey(want.name);
  const same = decks.find(x => deckNameKey(x.name) === k);
  if(same) return same.id;
  // Importing is deliberate, so it beats an earlier deletion of this deck.
  deckTombstones = deckTombstones.filter(tb => tb.id !== want.id);
  const now = Date.now();
  decks.push({id: want.id, name: cleanDeckName(want.name), voice: cleanVoice(want.voice), changedAt: now, activeAt: now});
  saveDecks();
  return want.id;
}

// Shown by name in the interface's language, with the id as a tie-break so
// every device lists equal names in the same order.
function sortedDecks(){
  const loc = langTag(lang);
  return decks.slice().sort((a,b)=> a.name.localeCompare(b.name, loc) || (a.id < b.id ? -1 : 1));
}

// An i18n key for why a name can't be used, or '' if it can.
function deckNameProblem(name, exceptId){
  const clean = cleanDeckName(name);
  if(!clean) return 'deckNameEmpty';
  const k = deckNameKey(clean);
  if(decks.some(d => d.id !== exceptId && deckNameKey(d.name) === k)) return 'deckNameTaken';
  return '';
}

// Switching starts the current mode over in the new deck: a fresh review
// queue and Learn list, and no quiz question or match carried across.
function switchDeck(id){
  if(!deckById(id)) return;
  currentDeck = id;
  try{ localStorage.setItem(CURRENT_DECK_KEY, id); }catch(e){}
  boxFilter = null;
  learnList = [];
  setMode(mode);
  renderStats();
  renderStatsPanel();
  renderWordList();
  renderDeckPanel();
}

function createDeck(name, voice){
  const problem = deckNameProblem(name);
  if(problem) return problem;
  const now = Date.now();
  const d = {id: newDeckId(), name: cleanDeckName(name), voice: cleanVoice(voice), changedAt: now, activeAt: now};
  decks.push(d);
  saveDecks();
  switchDeck(d.id);
  return '';
}

function renameDeck(id, name){
  const d = deckById(id);
  if(!d) return '';
  const problem = deckNameProblem(name, id);
  if(problem) return problem;
  const clean = cleanDeckName(name);
  if(clean !== d.name){
    d.name = clean;
    d.changedAt = Date.now();
    saveDecks();
  }
  return '';
}

function setDeckVoice(id, voice){
  const d = deckById(id);
  if(!d || cleanVoice(voice) === d.voice) return;
  d.voice = cleanVoice(voice);
  d.changedAt = Date.now();
  saveDecks();
  renderCard(false);
}

// Deleting a deck works like deleting its words: the deck and each card get
// a tombstone, so the deletion spreads to other devices, and undo restores
// them as a fresh edit. The last deck stays, so there is always one to show.
function deleteDeck(id){
  const d = deckById(id);
  if(!d || decks.length < 2) return;
  const mine = cards.filter(c => c.deck === id);
  const ask = mine.length ? t('confirmDeleteDeck', {name: isolate(d.name), n: count('word', mine.length)})
                          : t('confirmDeleteDeckEmpty', {name: isolate(d.name)});
  if(!confirm(ask)) return;
  decks = decks.filter(x => x.id !== id);
  deckTombstones = deckTombstones.filter(tb => tb.id !== id)
    .concat([{id, name: d.name, voice: d.voice, changedAt: Date.now(), activeAt: d.activeAt || 0, deleted: true}]);
  saveDecks();
  cards = cards.filter(c => c.deck !== id);
  addTombstones(mine);
  saveCards();
  lastDeleted = mine;
  lastDeletedDeck = d;
  if(currentDeck === id) switchDeck(sortedDecks()[0].id);
  else renderDeckPanel();
  renderStatsPanel();
  showUndo(t('deletedDeck', {name: '<bdi>' + escapeHtml(d.name) + '</bdi>'}), 'deckUndoRow');
}

const VOICE_LANGS = ['ar-SA', 'ar-EG', 'az-AZ', 'cs-CZ', 'da-DK', 'de-DE', 'el-GR', 'en-AU', 'en-GB', 'en-US',
  'es-ES', 'es-MX', 'fa-IR', 'fi-FI', 'fr-FR', 'he-IL', 'hi-IN', 'hu-HU', 'id-ID', 'it-IT', 'ja-JP', 'kk-KZ',
  'ko-KR', 'nb-NO', 'nl-NL', 'pl-PL', 'pt-BR', 'pt-PT', 'ro-RO', 'ru-RU', 'sv-SE', 'th-TH', 'tr-TR', 'uk-UA',
  'uz-UZ', 'vi-VN', 'zh-CN', 'zh-TW'];

// A language tag named in the interface's language, e.g. "German (Germany)".
// Browsers' Uzbek data leaves some languages unnamed ("ar (Saudi Arabia)"),
// so those fall back to their English name.
function voiceLabel(tag){
  const base = tag.split('-')[0];
  for(const loc of [langTag(lang), 'en']){
    try{
      const name = new Intl.DisplayNames([loc], {type: 'language'}).of(tag);
      if(name && name !== tag && name !== base && !name.startsWith(base + ' ')) return name;
    }catch(e){}
  }
  return tag;
}
function voiceOptions(selected){
  const loc = langTag(lang);
  const installed = voiceList.map(v => String(v.lang || '').replace(/_/g, '-')).filter(l => /^[a-z]{2,3}-[A-Z]{2}$/.test(l));
  return [...new Set(VOICE_LANGS.concat(installed, [selected]))]
    .map(tag => ({tag, label: voiceLabel(tag)}))
    .sort((a,b)=> a.label.localeCompare(b.label, loc))
    .map(o => '<option value="' + o.tag + '"' + (o.tag === selected ? ' selected' : '') + '>' + escapeHtml(o.label) + '</option>')
    .join('');
}

let deckUi = 'idle';        // idle | new (the new-deck form is open)
let deckMsg = '';           // an i18n key, so an open message follows a language switch
let newDeckDraft = {name: '', voice: 'en-US'};
let lastDeletedDeck = null;

function deckPanelOpen(){
  return document.getElementById('deckPanel').classList.contains('open');
}
function closeDeckPanel(){
  document.getElementById('deckPanel').classList.remove('open');
  deckUi = 'idle';
  deckMsg = '';
  renderDeckPanel();
}

// The switcher always shows the current deck. The panel is only built while
// open, and drafts live outside it, so a re-render mid-typing loses nothing.
function renderDeckPanel(){
  const d = curDeck();
  const sw = document.getElementById('deckSwitchName');
  sw.textContent = d.name;
  sw.lang = d.voice;
  document.getElementById('deckSwitch').setAttribute('aria-expanded', deckPanelOpen() ? 'true' : 'false');
  const box = document.getElementById('deckPanelBody');
  if(!deckPanelOpen()){ box.innerHTML = ''; return; }
  const now = Date.now();
  let html = '<div class="deck-head">' + t('decksTitle') + '</div><div class="deck-list">';
  sortedDecks().forEach(x=>{
    const mine = cards.filter(c => c.deck === x.id);
    const due = mine.filter(c => c.due <= now).length;
    const on = x.id === currentDeck;
    html += '<button class="deck-item' + (on ? ' on' : '') + '" data-deck="' + x.id + '"' + (on ? ' aria-current="true"' : '') + '>' +
      '<span class="deck-item-name" dir="auto" lang="' + x.voice + '">' + escapeHtml(x.name) + '</span>' +
      '<span class="deck-item-meta">' + (due ? '<b>' + t('deckDue', {n: due}) + '</b> · ' : '') + count('card', mine.length) + '</span>' +
    '</button>';
  });
  html += '</div>';
  if(deckUi === 'new'){
    html += '<div class="deck-form">' +
      '<input class="deck-input" id="newDeckName" type="text" dir="auto" maxlength="' + DECK_NAME_MAX + '" autocomplete="off"' +
        ' placeholder="' + escapeHtml(t('deckNamePh')) + '" aria-label="' + escapeHtml(t('deckName')) + '">' +
      '<label class="deck-field"><span>' + t('deckVoice') + '</span>' +
        '<select class="deck-select" id="newDeckVoice">' + voiceOptions(newDeckDraft.voice) + '</select></label>' +
      '<div class="deck-actions"><button class="btn-parse" id="newDeckGo">' + t('createDeck') + '</button>' +
        '<button class="btn-muted" id="newDeckCancel">' + t('syncCancel') + '</button></div>' +
    '</div>';
  } else {
    html += '<button class="btn-secondary" id="newDeckBtn">' + t('newDeck') + '</button>';
  }
  html += '<div class="deck-msg" role="status" aria-live="polite">' + (deckMsg ? escapeHtml(t(deckMsg)) : '') + '</div>';
  html += '<div class="deck-settings">' +
    '<div class="deck-head">' + t('deckSettings') + '</div>' +
    '<label class="deck-field"><span>' + t('deckName') + '</span>' +
      '<input class="deck-input" id="deckNameInput" type="text" dir="auto" maxlength="' + DECK_NAME_MAX + '" autocomplete="off" lang="' + d.voice + '"></label>' +
    '<label class="deck-field"><span>' + t('deckVoice') + '</span>' +
      '<select class="deck-select" id="deckVoiceSelect">' + voiceOptions(d.voice) + '</select></label>' +
    '<p class="deck-note deck-voice-note" id="deckVoiceNote" hidden></p>' +
    '<button class="btn-delete-all" id="deleteDeckBtn"' + (decks.length < 2 ? ' disabled' : '') + '>' + t('deleteDeck') + '</button>' +
    (decks.length < 2 ? '<p class="deck-note">' + t('deckLastNote') + '</p>' : '') +
  '</div>';
  box.innerHTML = html;

  box.querySelectorAll('.deck-item').forEach(b=>{
    b.addEventListener('click', ()=>{
      const id = b.dataset.deck;
      closeDeckPanel();
      if(id !== currentDeck) switchDeck(id);
    });
  });
  const on = (id, fn) => { const el = document.getElementById(id); if(el) el.addEventListener('click', fn); };
  on('newDeckBtn', ()=>{
    deckUi = 'new'; deckMsg = ''; newDeckDraft = {name: '', voice: 'en-US'};
    renderDeckPanel();
    document.getElementById('newDeckName').focus();
  });
  on('newDeckCancel', ()=>{ deckUi = 'idle'; deckMsg = ''; renderDeckPanel(); });
  const create = ()=>{
    const problem = createDeck(newDeckDraft.name, newDeckDraft.voice);
    if(problem){ deckMsg = problem; renderDeckPanel(); document.getElementById('newDeckName').focus(); return; }
    // A new deck is empty, so go straight to adding its words.
    closeDeckPanel();
    document.getElementById('addPanel').classList.add('open');
    renderWordList();
    document.getElementById('bulkInput').focus();
  };
  on('newDeckGo', create);
  const nameIn = document.getElementById('newDeckName');
  if(nameIn){
    nameIn.value = newDeckDraft.name;
    nameIn.addEventListener('input', ()=>{ newDeckDraft.name = nameIn.value; });
    nameIn.addEventListener('keydown', e=>{ if(e.key === 'Enter' && !e.isComposing) create(); });
    document.getElementById('newDeckVoice').addEventListener('change', e=>{ newDeckDraft.voice = e.target.value; });
  }
  const rename = document.getElementById('deckNameInput');
  rename.value = d.name;
  rename.addEventListener('keydown', e=>{ if(e.key === 'Enter' && !e.isComposing) rename.blur(); });
  rename.addEventListener('change', ()=>{
    deckMsg = renameDeck(d.id, rename.value);
    renderDeckPanel();
    renderStatsPanel();
  });
  document.getElementById('deckVoiceSelect').addEventListener('change', e=>{
    setDeckVoice(d.id, e.target.value);
    renderDeckPanel();
  });
  on('deleteDeckBtn', ()=> deleteDeck(d.id));
  updateVoiceNote();
}

// Which settings app to point at for installing a voice.
function voiceHelpKey(){
  const ua = navigator.userAgent || '';
  if(/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'voiceHowIos';
  if(/Android/.test(ua)) return 'voiceHowAndroid';
  if(/Windows/.test(ua)) return 'voiceHowWindows';
  if(/Macintosh/.test(ua)) return 'voiceHowMac';
  return 'voiceHowOther';
}
// Explains a hidden speaker: no voice for this deck's language, or no speech
// in this browser at all.
function updateVoiceNote(){
  const el = document.getElementById('deckVoiceNote');
  if(!el) return;
  const tag = curDeck().voice;
  if(!('speechSynthesis' in window)){
    el.textContent = t('noSpeech');
    el.hidden = false;
  } else if(!canSpeak(tag)){
    el.textContent = t('voiceMissing', {lang: voiceLabel(tag)}) + ' ' + t(voiceHelpKey());
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}
