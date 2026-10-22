let settings = { direction:'normal', typing:false, voice:'en-US', learnView:'cards', lang:null, sharedChangedAt:0 };
let activity = {};
// Every card belongs to a deck by id. The id, never the name, identifies a
// deck across devices, so a rename stays a rename.
let decks = [];
let deckTombstones = [];
let currentDeck = DEFAULT_DECK;
// Sync state, declared early because loading and saving use it. The sync
// engine itself is in the Sync section near the end.
let tombstones = [];
let deviceId = '';
let sync = { code: null, version: 0, lastSynced: 0, dirty: false, shareSettings: false, adoptPending: false };
let applyingRemote = false;
let changeCounter = 0;

function loadAll(){
  // One random id per device, so review counts from different devices add up
  // instead of overwriting each other.
  try{ deviceId = localStorage.getItem(DEVICE_KEY) || ''; }catch(e){}
  if(!/^d[0-9A-Z]{10}$/.test(deviceId)){
    deviceId = 'd' + randomCrockford(10);
    try{ localStorage.setItem(DEVICE_KEY, deviceId); }catch(e){}
  }
  try{
    let raw = localStorage.getItem(STORAGE_KEY);
    if(!raw){
      raw = localStorage.getItem(LEGACY_KEY);
      if(raw){ localStorage.setItem(STORAGE_KEY, raw); }
    }
    cards = raw ? JSON.parse(raw) : [];
    // Older saves (and some pasted lists) carry padded words, which broke
    // prefix matching in the filter, and words are kept in NFC so the same
    // word always compares equal. Repair once, and only write if it helped.
    let repaired = false;
    cards.forEach(c => {
      if(c.seen === undefined) c.seen = true;
      const word = String(c.word == null ? '' : c.word).trim().normalize('NFC');
      const translation = String(c.translation == null ? '' : c.translation).trim().normalize('NFC');
      if(word !== c.word || translation !== c.translation){
        c.word = word;
        c.translation = translation;
        repaired = true;
      }
      // Cards from before sync have no edit time. 0 means "unknown", which
      // the merge treats as older than any real edit.
      if(typeof c.changedAt !== 'number'){
        c.changedAt = 0;
        repaired = true;
      }
      // Cards from before decks all go to the default deck. Their edit times
      // are kept, so progress merges exactly as it did before.
      if(deckIdOr(c.deck) !== c.deck){
        c.deck = DEFAULT_DECK;
        repaired = true;
      }
    });
    if(repaired) saveCards();
  }catch(e){ cards = []; }
  try{
    const tb = JSON.parse(localStorage.getItem(TOMBSTONE_KEY) || '[]');
    const cutoff = Date.now() - TOMBSTONE_TTL;
    // Tombstones from before decks name only a word, in the default deck.
    tombstones = Array.isArray(tb) ? tb.filter(x => x && typeof x.word === 'string'
      && typeof x.changedAt === 'number' && x.changedAt >= cutoff)
      .map(x => ({deck: deckIdOr(x.deck), word: normWord(x.word), changedAt: x.changedAt, deleted: true})) : [];
  }catch(e){ tombstones = []; }
  try{
    const s = localStorage.getItem(SETTINGS_KEY);
    if(s) settings = Object.assign(settings, JSON.parse(s));
  }catch(e){}
  try{
    const d = JSON.parse(localStorage.getItem(DECKS_KEY) || 'null');
    decks = Array.isArray(d) ? d.map(readDeckEntry).filter(Boolean) : [];
    const dt = JSON.parse(localStorage.getItem(DECK_TOMBSTONE_KEY) || '[]');
    const cutoff = Date.now() - TOMBSTONE_TTL;
    deckTombstones = Array.isArray(dt) ? dt.map(readDeckTombstone).filter(x => x && x.changedAt >= cutoff) : [];
  }catch(e){ decks = []; deckTombstones = []; }
  try{
    const a = localStorage.getItem(ACTIVITY_KEY);
    if(a){
      const raw = JSON.parse(a) || {};
      let migrated = false;
      activity = {};
      Object.keys(raw).forEach(day=>{
        const v = raw[day];
        if(typeof v === 'number'){
          // Before sync, counts were per day only, and all came from here.
          if(v > 0) activity[day] = {[deviceId]: v};
          migrated = true;
        } else if(v && typeof v === 'object'){
          Object.keys(v).forEach(dev=>{
            if(v[dev] > 0) (activity[day] = activity[day] || {})[dev] = v[dev];
          });
        }
      });
      if(migrated) saveActivity();
    }
  }catch(e){ activity = {}; }
  try{
    const s = JSON.parse(localStorage.getItem(SYNC_KEY) || 'null');
    if(s && typeof s.code === 'string' && normalizeCode(s.code) === s.code){
      // Devices already syncing before shared settings existed start with
      // sharing off, so an update never changes anyone's look by surprise.
      sync = {code: s.code, version: +s.version || 0, lastSynced: +s.lastSynced || 0, dirty: !!s.dirty,
              shareSettings: s.shareSettings === true, adoptPending: !!s.adoptPending};
    }
  }catch(e){}
  // The last deck used is remembered per device and never synced.
  try{ currentDeck = localStorage.getItem(CURRENT_DECK_KEY) || DEFAULT_DECK; }catch(e){}
  ensureDecks();
}

function saveCards(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(cards)); }
  catch(e){ console.error('Storage error', e); }
  noteLocalChange();
}
function saveSettings(){
  try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }catch(e){}
}
function saveActivity(){
  try{ localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity)); }catch(e){}
  noteLocalChange();
}
function saveTombstones(){
  try{ localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(tombstones)); }catch(e){}
  noteLocalChange();
}
function saveDecks(){
  try{
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
    localStorage.setItem(DECK_TOMBSTONE_KEY, JSON.stringify(deckTombstones));
  }catch(e){}
  noteLocalChange();
}

// Words compare ignoring case and padding, in Unicode NFC, so the same word
// typed on one device and pasted on another is still the same word.
function normWord(word){
  return String(word == null ? '' : word).trim().normalize('NFC').toLowerCase();
}
// Cards are matched across devices by deck and word, so one word can be in
// two decks. Deck ids never contain the separator.
function cardKey(deck, word){
  return deck + '\u0000' + normWord(word);
}
// Records a deliberate change to a card's box, translation or seen state.
function touch(card){
  card.changedAt = Date.now();
}
// Edit time for a card being added. A new card carries no history, so it
// gets `base` (0 unless it came with one) and cannot override progress made
// on another device. Re-adding a word deleted here is deliberate, though, so
// it gets a real time that beats the deletion, and the tombstone goes.
function addedStamp(deck, word, base){
  const k = cardKey(deck, word);
  const i = tombstones.findIndex(tb => cardKey(tb.deck, tb.word) === k);
  if(i === -1) return base || 0;
  tombstones.splice(i, 1);
  saveTombstones();
  return Date.now();
}
// A deletion is recorded as a tombstone so it spreads to other devices
// instead of being brought back by them.
function addTombstones(list){
  const now = Date.now();
  const byKey = new Map(tombstones.map(tb => [cardKey(tb.deck, tb.word), tb]));
  list.forEach(c=>{
    const w = normWord(c.word);
    if(w) byKey.set(cardKey(c.deck, w), {deck: c.deck, word: w, changedAt: now, deleted: true});
  });
  tombstones = [...byKey.values()];
  saveTombstones();
}
function clearTombstones(list){
  const ks = new Set(list.map(c => cardKey(c.deck, c.word)));
  const before = tombstones.length;
  tombstones = tombstones.filter(tb => !ks.has(cardKey(tb.deck, tb.word)));
  if(tombstones.length !== before) saveTombstones();
}
