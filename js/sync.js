/* ---------- Sync ----------
   Optional sync across devices through Supabase, keyed by a sync code rather
   than an account. localStorage stays the source of truth: sync only ever
   merges into it, so a failed request leaves local data exactly as it was.
   The server side is supabase/schema.sql. */
const SUPABASE_URL = 'https://ijzmmucpyykrhnhijgvc.supabase.co';
// Publishable key: public by design. It can only call get_deck and put_deck;
// the table itself is locked.
const SUPABASE_KEY = 'sb_publishable_ycBKniW5lYW9b2CzuHSq_g_1iu_h-qW';
const SYNC_DEBOUNCE = 3000;
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

let syncStatus = 'off';      // off | syncing | synced | offline | error
let syncRunning = false;
let syncAgain = false;
let syncTimer = null;
let retryTimer = null;
let retryDelay = 0;
let syncUi = 'idle';         // idle | enter (typing a code)
let syncBusy = false;
let syncMsg = '';         // an i18n key, so an open message follows a language switch
let syncCodeDraft = '';

function randomCrockford(n){
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  let s = '';
  // 256 is a multiple of 32, so masking keeps every character equally likely.
  for(let i = 0; i < n; i++) s += CROCKFORD[bytes[i] & 31];
  return s;
}

// Mirrors _normalize_code in schema.sql: case, dashes and spaces are ignored,
// I and L read as 1 and O as 0. Anything else is not a code.
function normalizeCode(input){
  const c = String(input == null ? '' : input).toUpperCase()
    .replace(/[^0-9A-Z]/g, '').replace(/[IL]/g, '1').replace(/O/g, '0');
  return /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{10}$/.test(c) ? c : null;
}

function formatCode(code){
  return code.slice(0, 5) + '-' + code.slice(5);
}

// A card in synced form: no local id and every field normalised, so two
// devices holding the same card produce identical JSON.
function syncCard(c){
  const box = Math.round(+c.box);
  return {
    deck: deckIdOr(c.deck),
    word: String(c.word).trim().normalize('NFC'),
    translation: String(c.translation).trim().normalize('NFC'),
    box: Number.isFinite(box) ? Math.min(Math.max(box, 1), 5) : 1,
    seen: !!c.seen,
    due: Number.isFinite(+c.due) ? +c.due : 0,
    changedAt: Number.isFinite(+c.changedAt) ? +c.changedAt : 0
  };
}

// A deck from the server is untrusted: keep only well-formed entries, so a
// malformed deck can never break the app or damage local data.
function readDeck(d){
  const out = emptyDeck();
  if(!d || typeof d !== 'object') return out;
  // Decks from before the format had them come with none. Their cards all
  // belong to the default deck, which every device creates for itself.
  if(Array.isArray(d.decks)) d.decks.forEach(x=>{
    const e = readDeckEntry(x);
    if(e) out.decks.push(e);
  });
  if(Array.isArray(d.deckTombstones)) d.deckTombstones.forEach(x=>{
    const tb = readDeckTombstone(x);
    if(tb) out.deckTombstones.push(tb);
  });
  if(Array.isArray(d.cards)) d.cards.forEach(c=>{
    if(c && typeof c.word === 'string' && typeof c.translation === 'string'
       && c.word.trim() && c.translation.trim()) out.cards.push(syncCard(c));
  });
  if(Array.isArray(d.tombstones)) d.tombstones.forEach(tb=>{
    if(tb && typeof tb.word === 'string' && normWord(tb.word) && Number.isFinite(+tb.changedAt)){
      out.tombstones.push({deck: deckIdOr(tb.deck), word: normWord(tb.word), changedAt: +tb.changedAt, deleted: true});
    }
  });
  out.settings = readSettingsUnit(d.settings);
  if(d.activity && typeof d.activity === 'object') Object.keys(d.activity).forEach(day=>{
    const v = d.activity[day];
    if(!/^\d{4}-\d{2}-\d{2}$/.test(day) || !v || typeof v !== 'object') return;
    Object.keys(v).forEach(dev=>{
      const n = Math.floor(+v[dev]);
      if(n > 0 && dev.length <= 40) (out.activity[day] = out.activity[day] || {})[dev] = n;
    });
  });
  return out;
}

function cardSig(c){
  return JSON.stringify([c.deck, c.word, c.translation, c.box, c.seen, c.due, c.changedAt]);
}

// True if entry `a` should replace entry `b` for the same word. This is a
// strict total order, so every device merging the same data picks the same
// winner whatever order the decks arrive in.
function entryWins(a, b){
  if(a.changedAt !== b.changedAt) return a.changedAt > b.changedAt;   // newest edit wins
  if(!!a.deleted !== !!b.deleted) return !!a.deleted;                 // a deletion wins a tie
  if(a.deleted) return false;                                         // same word, same time
  // Ties are in practice cards from before sync (both 0), which carry no
  // demotion history: take the higher box, then the larger translation.
  // Plain < and > compare UTF-16 code units, never the device's locale.
  if(a.box !== b.box) return a.box > b.box;
  if(a.translation !== b.translation) return a.translation > b.translation;
  return cardSig(a) > cardSig(b);                                     // seen, due, word case
}

// True if deck entry `a` should replace `b` for the same id. A combined
// deck's alias always wins and stays, so two decks once combined stay
// combined; otherwise the newest edit wins and a deletion wins a tie.
function deckEntryWins(a, b){
  if(!!a.mergedInto !== !!b.mergedInto) return !!a.mergedInto;
  if(a.changedAt !== b.changedAt) return a.changedAt > b.changedAt;
  if(!!a.deleted !== !!b.deleted) return !!a.deleted;
  return JSON.stringify(a) > JSON.stringify(b);
}

// Merges two synced data sets. Decks merge by id and cards by deck and word,
// each by the rules above. Then it settles, repeating until nothing changes:
//  - A deleted deck comes back if one of its cards was edited, or words were
//    added to it, after the deletion. Otherwise its cards go with it,
//    including ones added on a device that hadn't synced when it was deleted.
//  - Two decks with the same name (made on two devices before they synced)
//    are combined into the one with the lower id, so the default deck always
//    keeps its id. The other becomes an alias that moves any of its cards
//    still arriving from other devices, keeping their edit times, so their
//    progress merges as usual.
// The result is commutative and idempotent, and sorted, so equal content
// always serialises identically. Combining makes it depend on the order of
// merges, which the server fixes by taking one write at a time.
function mergeDecks(a, b, now){
  const cutoff = now - TOMBSTONE_TTL;
  const deckBest = new Map();
  const offerDeck = e=>{
    const cur = deckBest.get(e.id);
    if(!cur || deckEntryWins(e, cur)) deckBest.set(e.id, e);
  };
  const entries = [];
  const activeAt = new Map();
  [a, b].forEach(d=>{
    d.decks.concat(d.deckTombstones).forEach(e=>{ if(!(activeAt.get(e.id) >= e.activeAt)) activeAt.set(e.id, e.activeAt); });
    d.decks.forEach(offerDeck);
    d.deckTombstones.forEach(tb=>{ if(tb.changedAt >= cutoff) offerDeck(tb); });
    d.cards.forEach(c => entries.push(c));
    d.tombstones.forEach(tb=>{ if(tb.changedAt >= cutoff) entries.push(tb); });
  });
  const target = id=>{
    for(let e = deckBest.get(id), n = 0; e && e.mergedInto && n < 200; e = deckBest.get(id), n++) id = e.mergedInto;
    return id;
  };
  let best;
  // Each round either brings back a deck or combines two, and neither can be
  // undone within a merge, so this ends well within the cap.
  for(let round = 0; round < 500; round++){
    best = new Map();
    entries.forEach(e0=>{
      const deck = target(e0.deck);
      const e = deck === e0.deck ? e0 : Object.assign({}, e0, {deck});
      const k = cardKey(e.deck, e.word);
      const cur = best.get(k);
      if(!cur || entryWins(e, cur)) best.set(k, e);
    });
    let changed = false;
    const newest = new Map();
    best.forEach(e=>{
      if(!e.deleted && !(newest.get(e.deck) >= e.changedAt)) newest.set(e.deck, e.changedAt);
    });
    deckBest.forEach((d, id)=>{
      if(!d.deleted || d.mergedInto) return;
      const t = Math.max(newest.has(id) ? newest.get(id) : -1, activeAt.has(id) ? activeAt.get(id) : -1);
      if(t > d.changedAt){
        deckBest.set(id, {id, name: d.name, voice: d.voice, changedAt: t, activeAt: activeAt.get(id) || 0});
        changed = true;
      }
    });
    const byName = new Map();
    [...deckBest.values()].filter(d => !d.deleted).sort((x, y) => x.id < y.id ? -1 : 1).forEach(d=>{
      const k = deckNameKey(d.name), keep = byName.get(k);
      if(!keep){ byName.set(k, d); return; }
      // Stamped with the merge time, so the alias outlives the 60 days that
      // tombstones are kept for at least that long from now.
      deckBest.set(d.id, {id: d.id, name: d.name, voice: d.voice, changedAt: Math.max(now, d.changedAt), activeAt: d.activeAt,
                          deleted: true, mergedInto: keep.id});
      changed = true;
    });
    if(!changed) break;
  }
  // Cards still in a deleted deck are deleted with it.
  best.forEach((e, k)=>{
    const d = deckBest.get(e.deck);
    if(!e.deleted && d && d.deleted) best.set(k, {deck: e.deck, word: normWord(e.word), changedAt: d.changedAt, deleted: true});
  });
  const out = emptyDeck();
  out.settings = pickSettings(a.settings, b.settings);
  [...deckBest.keys()].sort().forEach(id=>{
    const d = Object.assign({}, deckBest.get(id), {activeAt: Math.max(deckBest.get(id).activeAt, activeAt.get(id) || 0)});
    (d.deleted ? out.deckTombstones : out.decks).push(d);
  });
  [...best.keys()].sort().forEach(k=>{
    const e = best.get(k);
    (e.deleted ? out.tombstones : out.cards).push(e);
  });
  // Each device only ever raises its own counter, so the larger value per
  // device and day is the true one.
  const days = new Set(Object.keys(a.activity).concat(Object.keys(b.activity)));
  [...days].sort().forEach(day=>{
    const x = a.activity[day] || {}, y = b.activity[day] || {};
    const devs = [...new Set(Object.keys(x).concat(Object.keys(y)))].sort();
    out.activity[day] = {};
    devs.forEach(dev=>{ out.activity[day][dev] = Math.max(x[dev] || 0, y[dev] || 0); });
  });
  return out;
}

// Format 2 is the one with decks. The server refuses older-format writes
// over it, so a page from before decks can't fold every deck into one.
function emptyDeck(){
  return {format: 2, decks: [], deckTombstones: [], cards: [], tombstones: [], activity: {}, settings: null};
}

// This device's data in synced form. The settings unit is included only when
// this device shares its look and settings.
function localDeck(now, share){
  const shared = share === undefined ? sync.shareSettings : share;
  return mergeDecks(readDeck({decks, deckTombstones, cards, tombstones, activity,
                              settings: shared ? localSettingsUnit() : null}), emptyDeck(), now);
}

// Look and study settings shared between devices, as one unit with its own
// edit time. Background images and card photos are never part of it: they
// are too large to sync.
function localSettingsUnit(){
  const theme = localStorage.getItem(THEME_KEY);
  return {
    cardColor: (localStorage.getItem(CARD_KEY) || '#EFEAD9').toUpperCase(),
    direction: settings.direction === 'reverse' ? 'reverse' : 'normal',
    lang: lang,
    theme: isThemeId(theme) ? theme : 'slate',
    typing: !!settings.typing,
    changedAt: +settings.sharedChangedAt || 0
  };
}

// Each field is checked on its own, so one unexpected value drops that field
// rather than the whole unit. Keys come out in a fixed order for comparison.
function readSettingsUnit(x){
  if(!x || typeof x !== 'object' || !Number.isFinite(+x.changedAt)) return null;
  const u = {};
  if(typeof x.cardColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(x.cardColor)) u.cardColor = x.cardColor.toUpperCase();
  if(x.direction === 'normal' || x.direction === 'reverse') u.direction = x.direction;
  if(typeof x.lang === 'string' && I18N[x.lang]) u.lang = x.lang;
  if(isThemeId(x.theme)) u.theme = x.theme;
  if(typeof x.typing === 'boolean') u.typing = x.typing;
  // Voice used to be shared here; it belongs to each deck now and syncs with it.
  u.changedAt = +x.changedAt;
  return u;
}

// Newest edit wins; a tie falls back to comparing the whole unit, so every
// device picks the same one.
function pickSettings(a, b){
  if(!a || !b) return a || b || null;
  if(a.changedAt !== b.changedAt) return a.changedAt > b.changedAt ? a : b;
  return JSON.stringify(a) > JSON.stringify(b) ? a : b;
}

// A deliberate change to a shared setting. It is stamped even while sharing
// is off, but only sent while sharing is on.
function noteSettingsChange(){
  settings.sharedChangedAt = Date.now();
  saveSettings();
  if(sync.shareSettings) noteLocalChange();
}

// Takes on a shared settings unit. Only fields present are applied, and the
// local background image and card photo are left alone.
function applySharedSettings(u){
  if(!u) return;
  const study = (u.direction && u.direction !== settings.direction)
    || (typeof u.typing === 'boolean' && u.typing !== settings.typing);
  if(u.theme){ localStorage.setItem(THEME_KEY, u.theme); applyTheme(); }
  if(u.cardColor){ localStorage.setItem(CARD_KEY, u.cardColor); applyCardColor(); }
  if(u.direction) settings.direction = u.direction;
  if(typeof u.typing === 'boolean') settings.typing = u.typing;
  settings.sharedChangedAt = u.changedAt;
  saveSettings();
  if(study){ flipped = false; answered = false; lastAnswerCorrect = null; }
  if(u.lang && u.lang !== lang) setLang(u.lang, true);
  relocalize();
}

// Writes a merged deck into local state. Existing card objects are updated
// in place, keeping their local ids and order, so an open Learn session,
// review card or quiz keeps working; cards new to this device go at the end.
function applyDeck(merged){
  // Cards of a deck that was combined into another are matched in their new
  // deck, so they keep their place too.
  const aliasOf = new Map(merged.deckTombstones.filter(tb => tb.mergedInto).map(tb => [tb.id, tb.mergedInto]));
  const target = id=>{
    for(let n = 0; aliasOf.has(id) && n < 200; n++) id = aliasOf.get(id);
    return id;
  };
  const combined = merged.deckTombstones.filter(tb => tb.mergedInto && deckById(tb.id));
  const win = new Map(merged.cards.map(c => [cardKey(c.deck, c.word), c]));
  const kept = [];
  const gone = new Set();
  cards.forEach(c=>{
    const k = cardKey(target(c.deck), c.word), w = win.get(k);
    if(w){ Object.assign(c, w); kept.push(c); win.delete(k); }
    else gone.add(c);
  });
  win.forEach(w=>{
    kept.push(Object.assign({id: Date.now() + '-' + Math.random().toString(36).slice(2,8)}, w));
  });
  cards = kept;
  tombstones = merged.tombstones.map(tb => Object.assign({}, tb));
  decks = merged.decks.map(d => Object.assign({}, d));
  deckTombstones = merged.deckTombstones.map(tb => Object.assign({}, tb));
  activity = JSON.parse(JSON.stringify(merged.activity));
  // Follow the current deck if it was combined into another; if it was
  // deleted elsewhere, ensureDecks falls back to the first one.
  const was = currentDeck;
  if(!deckById(currentDeck) && deckById(target(currentDeck))) currentDeck = target(currentDeck);
  applyingRemote = true;
  try{ saveCards(); saveTombstones(); saveDecks(); saveActivity(); ensureDecks(); }
  finally{ applyingRemote = false; }
  if(gone.size){
    queue = queue.filter(c => !gone.has(c));
    learnList = learnList.filter(c => !gone.has(c));
    if(current && gone.has(current)) current = null;
  }
  if(currentDeck !== was){
    try{ localStorage.setItem(CURRENT_DECK_KEY, currentDeck); }catch(e){}
    boxFilter = null;
    learnList = [];
    setMode(mode);
  }
  renderStats();
  renderStatsPanel();
  renderWordList();
  renderDeckPanel();
  if(mode === 'learn') renderLearn();
  else if(mode === 'review' && !current){
    if(!practiceMode && queue.length === 0) buildQueue();
    renderCard(false);
  }
  if(combined.length){
    const into = deckById(target(combined[0].id));
    if(into) showDeckNotice(t('decksCombined', {name: isolate(into.name)}));
  }
}

let deckNoticeTimer = null;
function showDeckNotice(text){
  const el = document.getElementById('deckNotice');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(deckNoticeTimer);
  deckNoticeTimer = setTimeout(()=>{ el.hidden = true; }, 9000);
}

async function rpc(fn, body, keepalive){
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  try{
    const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: {'apikey': SUPABASE_KEY, 'Content-Type': 'application/json'},
      body: JSON.stringify(body),
      signal: ctl.signal,
      keepalive: !!keepalive
    });
    if(!res.ok){
      let detail = '';
      try{ detail = (await res.json()).message || ''; }catch(e){}
      throw Object.assign(new Error(detail || ('HTTP ' + res.status)), {status: res.status});
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Network failures, timeouts, server errors and lost races are worth
// retrying; a rejected request (bad code, deck too large) is not.
function isTransient(err){
  const s = err && err.status;
  return !s || s >= 500 || s === 408 || s === 409 || s === 429;
}

function saveSyncState(){
  try{ localStorage.setItem(SYNC_KEY, JSON.stringify(sync)); }catch(e){}
}

// Called by every save of synced data. Flags the deck for a push and
// schedules one shortly, so a burst of reviews becomes a single request.
function noteLocalChange(){
  if(applyingRemote) return;
  changeCounter++;
  if(!sync.code) return;
  if(!sync.dirty){ sync.dirty = true; saveSyncState(); }
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncNow, SYNC_DEBOUNCE);
}

// Pull, merge, push. A stale write is refused by the server and comes back
// with the current deck, which is merged in before trying again.
async function syncNow(){
  if(!sync.code) return;
  if(syncRunning){ syncAgain = true; return; }
  clearTimeout(syncTimer);
  clearTimeout(retryTimer);
  if(navigator.onLine === false){ setSyncStatus('offline'); return; }   // 'online' resumes it
  syncRunning = true;
  setSyncStatus('syncing');
  const startedAt = changeCounter;
  const code = sync.code;
  try{
    let remote = await rpc('get_deck', {code});
    for(let attempt = 0; attempt < 5; attempt++){
      if(sync.code !== code) return;                    // sync was stopped meanwhile
      if(!remote || typeof remote.version !== 'number') throw new Error('unexpected response');
      const now = Date.now();
      const theirs = mergeDecks(readDeck(remote.deck), emptyDeck(), now);
      // Sharing was just switched on: like joining, take on the shared look.
      if(sync.shareSettings && sync.adoptPending){
        if(theirs.settings) applySharedSettings(theirs.settings);
        sync.adoptPending = false;
        saveSyncState();
      }
      const local = localDeck(now);
      const merged = mergeDecks(local, theirs, now);
      const mergedJson = JSON.stringify(merged);
      const body = d => JSON.stringify([d.decks, d.deckTombstones, d.cards, d.tombstones, d.activity]);
      if(body(merged) !== body(local)) applyDeck(merged);
      // A device that doesn't share settings still carries the shared unit
      // through unchanged; it just never applies it.
      if(sync.shareSettings && merged.settings
         && JSON.stringify(merged.settings) !== JSON.stringify(local.settings)) applySharedSettings(merged.settings);
      if(remote.status === 'ok' && mergedJson === JSON.stringify(theirs)){
        finishSync(remote.version, startedAt);         // the server already has all of it
        return;
      }
      const res = await rpc('put_deck', {code, deck: merged, expected_version: remote.version});
      if(res && res.status === 'ok'){ finishSync(res.version, startedAt); return; }
      if(!res || res.status !== 'conflict') throw new Error('unexpected response');
      remote = res;                                     // another device wrote first
    }
    throw Object.assign(new Error('still conflicting after 5 attempts'), {status: 409});
  } catch(err){
    syncFailed(err);
  } finally {
    syncRunning = false;
    if(syncAgain){ syncAgain = false; syncNow(); }
  }
}

function finishSync(version, startedAt){
  sync.version = version;
  sync.lastSynced = Date.now();
  // Only clear the flag if nothing changed while the request was in flight.
  if(changeCounter === startedAt) sync.dirty = false;
  saveSyncState();
  retryDelay = 0;
  setSyncStatus('synced');
  if(sync.dirty){
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncNow, SYNC_DEBOUNCE);
  }
}

function syncFailed(err){
  if(isTransient(err)){
    setSyncStatus('offline');
    retryDelay = retryDelay ? Math.min(retryDelay * 2, 120000) : 5000;
    clearTimeout(retryTimer);
    retryTimer = setTimeout(syncNow, retryDelay);
  } else {
    setSyncStatus('error');
    console.warn('Sync failed:', err && err.message);
  }
}

// The page may not come back (a closed tab, an app switch on a phone), so
// push pending changes now with keepalive, which outlives the page. It only
// writes if the server hasn't moved on since our last sync; otherwise it is
// refused, the changes stay flagged, and the next visit merges them.
function flushOnHide(){
  if(!sync.code || !sync.dirty || syncRunning || !sync.version) return;
  const body = {code: sync.code, deck: localDeck(Date.now()), expected_version: sync.version};
  // Browsers cap keepalive bodies at 64 kB; a bigger deck syncs next visit.
  if(JSON.stringify(body).length > 60000) return;
  clearTimeout(syncTimer);
  syncRunning = true;
  const startedAt = changeCounter;
  rpc('put_deck', body, true).then(res=>{
    if(res && res.status === 'ok') finishSync(res.version, startedAt);
  }).catch(()=>{}).finally(()=>{
    syncRunning = false;
    if(syncAgain){ syncAgain = false; syncNow(); }
  });
}

async function turnOnSync(){
  if(syncBusy || sync.code) return;
  syncBusy = true; syncMsg = ''; renderSyncPanel();
  const startedAt = changeCounter;
  try{
    // A fresh code is all but certain to be unused. If one is taken, the
    // server answers with a conflict and we draw another.
    for(let attempt = 0; attempt < 3; attempt++){
      const code = randomCrockford(10);
      const res = await rpc('put_deck', {code, deck: localDeck(Date.now(), true), expected_version: 0});
      if(res && res.status === 'ok'){
        sync = {code, version: res.version, lastSynced: Date.now(), dirty: changeCounter !== startedAt,
                shareSettings: true, adoptPending: false};
        saveSyncState();
        setSyncStatus('synced');
        if(sync.dirty) syncTimer = setTimeout(syncNow, SYNC_DEBOUNCE);
        return;
      }
    }
    throw new Error('no free code');
  } catch(err){
    syncMsg = isTransient(err) ? 'syncUnreachable' : 'syncRejected';
  } finally {
    syncBusy = false;
    renderSyncPanel();
  }
}

// Joins an existing synced deck and resolves to true once this device has
// joined. It asks first how to treat this device's words and settings; the
// choice is then merged in before anything is pushed, so the joined deck is
// on screen even if the push that follows fails.
async function connectWithCode(input){
  if(syncBusy || sync.code) return false;
  const code = normalizeCode(input);
  if(!code){ syncMsg = 'syncBadCode'; renderSyncPanel(); return false; }
  syncBusy = true; syncMsg = ''; renderSyncPanel();
  let remote = null;
  try{
    remote = await rpc('get_deck', {code});
    if(!remote || typeof remote.version !== 'number') syncMsg = 'syncUnreachable';
    // A mistyped code looks just like an unused one, so this only ever joins
    // a deck that exists; it never starts one.
    else if(remote.status !== 'ok') syncMsg = 'syncNotFound';
  } catch(err){
    syncMsg = isTransient(err) ? 'syncUnreachable' : 'syncRejected';
  }
  syncBusy = false;
  if(syncMsg){ renderSyncPanel(); return false; }
  renderSyncPanel();
  const now = Date.now();
  const theirs = mergeDecks(readDeck(remote.deck), emptyDeck(), now);
  const synced = new Set(theirs.cards.map(c => cardKey(c.deck, c.word)));
  const own = cards.filter(c => !synced.has(cardKey(c.deck, c.word))).length;
  const choice = await askJoinChoices(own, theirs.cards.length);
  if(!choice || sync.code) return false;
  if(choice.words === 'replace'){
    // Nothing is discarded until a copy of it has been handed to the browser.
    downloadJson({app: 'vocab-box', version: 2, exportedAt: new Date().toISOString(), decks: decks.slice(), cards: cards.slice(), activity},
                 'vocab-box-before-replace-' + todayKey(0) + '.json');
  }
  // Replace keeps only this device's review counts, which are not words.
  const mine = localDeck(now, false);
  if(choice.words === 'replace'){ mine.decks = []; mine.deckTombstones = []; mine.cards = []; mine.tombstones = []; }
  applyDeck(mergeDecks(mine, theirs, now));
  sync = {code, version: remote.version, lastSynced: Date.now(), dirty: true,
          shareSettings: choice.share, adoptPending: false};
  saveSyncState();
  // A joining device takes on the shared look instead of imposing its own.
  if(choice.share && theirs.settings) applySharedSettings(theirs.settings);
  syncUi = 'idle';
  syncCodeDraft = '';
  setSyncStatus('synced');
  renderSyncPanel();
  await syncNow();   // pushes this device's own words and picks up anything newer
  return true;
}

// Asks how to join before anything is merged. Resolves to {words, share}, or
// null if cancelled. The words question is only asked when this device has
// words the synced deck doesn't.
function askJoinChoices(own, syncedCount){
  return new Promise(resolve=>{
    const dlg = document.getElementById('joinDialog');
    const go = document.getElementById('joinGo');
    const cancel = document.getElementById('joinCancel');
    const app = document.querySelector('.app');
    const back = document.activeElement;
    document.getElementById('joinSub').textContent = t('joinSyncedCount', {n: count('word', syncedCount)});
    document.getElementById('joinWords').hidden = own === 0;
    document.getElementById('joinReplaceHint').textContent = t('joinReplaceHint', {n: count('word', own)});
    dlg.querySelector('input[name="joinWords"][value="combine"]').checked = true;
    document.getElementById('joinShare').checked = true;
    dlg.hidden = false;
    app.inert = true;
    go.focus();
    const close = result=>{
      dlg.hidden = true;
      app.inert = false;
      go.removeEventListener('click', onGo);
      cancel.removeEventListener('click', onCancel);
      dlg.removeEventListener('keydown', onKey);
      // Return focus to whatever opened this. That button may be gone (the
      // sync panel re-renders while the code is checked) or still disabled,
      // so fall back to the code field it came from.
      const target = [back, document.getElementById('syncCodeInput'), document.getElementById('landingCodeInput')]
        .find(el => el && el.isConnected && el !== document.body && !el.disabled && el.getClientRects().length);
      if(target) target.focus();
      resolve(result);
    };
    const onGo = ()=>{
      const replace = own > 0 && dlg.querySelector('input[name="joinWords"]:checked').value === 'replace';
      // Replacing discards words, so it needs a second, explicit yes.
      if(replace && !confirm(t('joinReplaceConfirm', {n: count('word', own)}))) return;
      close({words: replace ? 'replace' : 'combine', share: document.getElementById('joinShare').checked});
    };
    const onCancel = ()=> close(null);
    const onKey = e=>{ if(e.key === 'Escape') close(null); };
    go.addEventListener('click', onGo);
    cancel.addEventListener('click', onCancel);
    dlg.addEventListener('keydown', onKey);
  });
}

function stopSync(){
  if(!confirm(t('syncStopConfirm'))) return;
  clearTimeout(syncTimer);
  clearTimeout(retryTimer);
  sync = {code: null, version: 0, lastSynced: 0, dirty: false, shareSettings: false, adoptPending: false};
  saveSyncState();
  syncMsg = '';
  setSyncStatus('off');
  renderSyncPanel();
}

function setSyncStatus(status){
  syncStatus = status;
  updateSyncStatusLine();
}

function syncAgo(ts){
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if(s < 60) return t('justNow');
  const m = Math.floor(s / 60);
  if(m < 60) return t('timeAgo', {n: count('minute', m)});
  const h = Math.floor(m / 60);
  if(h < 24) return t('timeAgo', {n: count('hour', h)});
  return t('timeAgo', {n: count('day', Math.floor(h / 24))});
}

function syncStatusText(){
  if(syncStatus === 'syncing') return t('syncStatusSyncing');
  const last = sync.lastSynced ? syncAgo(sync.lastSynced) : '';
  if(syncStatus === 'synced') return t('syncStatusSynced') + (last ? ' · ' + last : '');
  const label = syncStatus === 'error' ? t('syncStatusError') : t('syncStatusOffline');
  return label + (last ? ' · ' + t('syncLastSynced', {when: last}) : '');
}

// Updates only the status line, so a ticking "2 minutes ago" never disturbs
// a code being typed.
function updateSyncStatusLine(){
  const el = document.getElementById('syncStatusLine');
  if(!el) return;
  el.className = 'sync-status st-' + syncStatus;
  el.querySelector('.sync-status-text').textContent = syncStatusText();
}

function renderSyncPanel(){
  const box = document.getElementById('syncBox');
  if(!box) return;
  const dis = syncBusy ? ' disabled' : '';
  let html = '<div class="sync-head"><span class="sync-title">' + t('syncTitle') + '</span>' +
    (sync.code ? '<span class="sync-status" id="syncStatusLine"><span class="sync-dot" aria-hidden="true"></span><span class="sync-status-text"></span></span>' : '') +
    '</div>';
  if(sync.code){
    html +=
      '<div class="sync-label">' + t('syncCodeLabel') + '</div>' +
      '<div class="sync-code-row">' +
        '<code class="sync-code" id="syncCode">' + formatCode(sync.code) + '</code>' +
        '<button class="btn-secondary" id="syncCopyBtn">' + t('syncCopy') + '</button>' +
      '</div>' +
      '<p class="sync-warn">' + t('syncWarning') + '</p>' +
      '<label class="share-toggle"><input type="checkbox" id="syncShareToggle"' + (sync.shareSettings ? ' checked' : '') + '>' +
        '<span>' + t('shareSettings') + '</span></label>' +
      '<p class="share-note">' + t('shareSettingsNote') + '</p>' +
      '<button class="btn-muted" id="syncStopBtn">' + t('syncStop') + '</button>';
  } else if(syncUi === 'enter'){
    html +=
      '<p class="sync-text">' + t('syncEnterHelp') + '</p>' +
      '<div class="sync-enter">' +
        '<input class="sync-input" id="syncCodeInput" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="13" placeholder="XXXXX-XXXXX" aria-label="' + t('syncCodeLabel') + '">' +
        '<button class="btn-parse" id="syncConnectBtn"' + dis + '>' + t('syncConnect') + '</button>' +
        '<button class="btn-muted" id="syncCancelBtn"' + dis + '>' + t('syncCancel') + '</button>' +
      '</div>';
  } else {
    html +=
      '<p class="sync-text">' + t('syncIntro') + '</p>' +
      '<div class="backup-row">' +
        '<button class="btn-secondary" id="syncOnBtn"' + dis + '>' + t('syncTurnOn') + '</button>' +
        '<button class="btn-secondary" id="syncHaveBtn"' + dis + '>' + t('syncHaveCode') + '</button>' +
      '</div>';
  }
  html += '<div class="sync-msg" id="syncMsg" role="status" aria-live="polite">' +
    escapeHtml(syncBusy ? t('syncStatusSyncing') : (syncMsg ? t(syncMsg) : '')) + '</div>';
  box.innerHTML = html;

  const on = (id, fn) => { const el = document.getElementById(id); if(el) el.addEventListener('click', fn); };
  on('syncOnBtn', turnOnSync);
  on('syncHaveBtn', ()=>{ syncUi = 'enter'; syncMsg = ''; renderSyncPanel(); document.getElementById('syncCodeInput').focus(); });
  on('syncCancelBtn', ()=>{ syncUi = 'idle'; syncMsg = ''; syncCodeDraft = ''; renderSyncPanel(); });
  on('syncConnectBtn', ()=> connectWithCode(syncCodeDraft));
  on('syncStopBtn', stopSync);
  on('syncCopyBtn', ()=>{
    const btn = document.getElementById('syncCopyBtn');
    const done = ()=>{
      btn.textContent = t('syncCopied');
      setTimeout(()=>{ if(btn.isConnected) btn.textContent = t('syncCopy'); }, 1600);
    };
    const select = ()=>{
      const r = document.createRange();
      r.selectNodeContents(document.getElementById('syncCode'));
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    };
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(formatCode(sync.code)).then(done, select);
    } else select();
  });
  const share = document.getElementById('syncShareToggle');
  if(share) share.addEventListener('change', ()=>{
    sync.shareSettings = share.checked;
    // Switching on works like joining: this device takes on the shared look.
    sync.adoptPending = share.checked;
    saveSyncState();
    if(share.checked) syncNow();
  });
  const input = document.getElementById('syncCodeInput');
  if(input){
    input.value = syncCodeDraft;
    input.addEventListener('input', ()=>{ syncCodeDraft = input.value; });
    input.addEventListener('keydown', e=>{ if(e.key === 'Enter') connectWithCode(syncCodeDraft); });
  }
  updateSyncStatusLine();
  setLandingMsg(document.getElementById('landingJoinMsg').dataset.key || '');
}

function setLandingMsg(key){
  const el = document.getElementById('landingJoinMsg');
  el.dataset.key = key;
  el.textContent = key ? t(key) : '';
}

// The landing's join option is offered only while sync is off, starting
// folded away behind its link each time the landing opens.
function resetLandingJoin(){
  document.getElementById('landingJoin').hidden = !!sync.code;
  document.getElementById('landingJoinBtn').hidden = false;
  document.getElementById('landingJoinForm').hidden = true;
  setLandingMsg('');
}

// Joining from the landing skips the sample deck and opens the merged deck.
async function landingConnect(){
  const btn = document.getElementById('landingConnectBtn');
  if(btn.disabled) return;
  btn.disabled = true;
  setLandingMsg('syncStatusSyncing');
  const joined = await connectWithCode(document.getElementById('landingCodeInput').value);
  btn.disabled = false;
  if(joined){
    setLandingMsg('');
    hideLanding();
    setMode('review');
  } else {
    setLandingMsg(syncMsg);
  }
}

function startSync(){
  syncStatus = sync.code ? 'syncing' : 'off';
  renderSyncPanel();
  document.addEventListener('visibilitychange', ()=>{
    if(document.visibilityState === 'hidden') flushOnHide();
    // Back after a while: pick up whatever other devices changed.
    else if(sync.code && Date.now() - sync.lastSynced > 30000) syncNow();
  });
  window.addEventListener('online', ()=>{ if(sync.code) syncNow(); });
  document.getElementById('landingJoinBtn').addEventListener('click', ()=>{
    document.getElementById('landingJoinBtn').hidden = true;
    document.getElementById('landingJoinForm').hidden = false;
    document.getElementById('landingCodeInput').focus();
  });
  document.getElementById('landingConnectBtn').addEventListener('click', landingConnect);
  document.getElementById('landingCodeInput').addEventListener('keydown', e=>{ if(e.key === 'Enter') landingConnect(); });
  // Keeps "2 minutes ago" current while the stats panel is open.
  setInterval(updateSyncStatusLine, 30000);
  if(sync.code) syncNow();
}
