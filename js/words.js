function exportBackup(){
  const data = {
    app:'vocab-box', version:2,
    exportedAt:new Date().toISOString(),
    decks, cards, activity
  };
  // The code is the only way back to a synced deck, so a backup keeps it.
  if(sync.code) data.syncCode = formatCode(sync.code);
  downloadJson(data, 'vocab-box-backup-' + todayKey(0) + '.json');
  setBackupMsg(t('backupDone'));
}

// Hands the browser a JSON file to save. The URL is released a minute later
// rather than straight away, which can cancel the download in some browsers.
function downloadJson(data, filename){
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}

function importBackup(file){
  const reader = new FileReader();
  reader.onload = (e)=>{
    try{
      const data = JSON.parse(e.target.result);
      if(!data || !Array.isArray(data.cards)) throw new Error('bad format');
      // The backup's decks are matched to this device's by id, then by name.
      // Cards with no deck, from older backups, go to the default deck.
      const deckFor = new Map();
      if(Array.isArray(data.decks)) data.decks.map(readDeckEntry).filter(Boolean).forEach(d=>{
        deckFor.set(d.id, adoptDeck(d));
      });
      let added = 0, updated = 0;
      const addedTo = new Set();
      data.cards.forEach(imp=>{
        if(!imp || typeof imp.word !== 'string' || typeof imp.translation !== 'string') return;
        const word = imp.word.trim().normalize('NFC');
        const translation = imp.translation.trim().normalize('NFC');
        if(!word || !translation) return;
        const deck = deckFor.get(imp.deck) || adoptDeck(null);
        const box = Math.min(Math.max(Math.round(+imp.box) || 1, 1), 5);
        const existing = cards.find(c => c.deck === deck && normWord(c.word) === normWord(word));
        if(existing){
          if(box > existing.box){
            existing.box = box;
            existing.due = imp.due || Date.now();
            touch(existing);
            updated++;
          }
        } else {
          cards.push({
            id: imp.id && !cards.some(c => c.id === imp.id) ? imp.id : (Date.now() + '-' + Math.random().toString(36).slice(2,8)),
            deck,
            word,
            translation,
            box,
            seen: imp.seen !== undefined ? imp.seen : true,
            due: imp.due || Date.now(),
            changedAt: addedStamp(deck, word, typeof imp.changedAt === 'number' ? imp.changedAt : 0)
          });
          addedTo.add(deck);
          added++;
        }
      });
      if(data.activity && typeof data.activity === 'object'){
        Object.keys(data.activity).forEach(k=>{
          if(!/^\d{4}-\d{2}-\d{2}$/.test(k)) return;
          const v = data.activity[k];
          // Older backups hold one count per day, newer ones one per device.
          const src = (v && typeof v === 'object') ? v : {[deviceId]: v};
          const day = activity[k] || (activity[k] = {});
          Object.keys(src).forEach(dev=>{
            const n = Math.floor(+src[dev]) || 0;
            if(n > (day[dev] || 0)) day[dev] = n;
          });
          if(!Object.keys(day).length) delete activity[k];
        });
        saveActivity();
      }
      saveCards();
      ensureDecks();
      addedTo.forEach(noteDeckActive);
      buildQueue();
      renderStats();
      renderStatsPanel();
      renderWordList();
      current = null;
      practiceMode = false;
      renderCard(false);
      setBackupMsg(t('imported', {added: count('word', added)}) + (updated ? t('importedProgressed', {n: updated}) : '') + '.');
      // Offer the backup's code, but never switch sync on without asking.
      const code = normalizeCode(data.syncCode);
      if(code && !sync.code && confirm(t('syncImportConfirm', {code: formatCode(code)}))){
        connectWithCode(code);
      }
    }catch(err){
      setBackupMsg(t('backupBad'));
    }
  };
  reader.readAsText(file);
}

function setBackupMsg(text){
  const el = document.getElementById('backupMsg');
  el.textContent = text;
  setTimeout(()=>{ if(el.textContent===text) el.textContent=''; }, 5000);
}

// Optional numbering: Western, Arabic-Indic or Persian digits, then a dot,
// bracket or the Chinese enumeration comma.
const NUMBERING = '^\\s*(?:[0-9\\u0660-\\u0669\\u06F0-\\u06F9]+[.)、．]?\\s*)?';
// Any run of long dashes separates: em and en dashes, the Chinese double
// dash (——), the horizontal bar, two- and three-em dashes, the small em
// dash and the full-width hyphen.
const DASH_LINE = new RegExp(NUMBERING + '(.+?)\\s*[—–―⸺⸻﹘－]+\\s*(.+?)\\s*$');
const HYPHEN_LINE = new RegExp(NUMBERING + '(.+?)\\s+-\\s+(.+?)\\s*$');

function parseLine(line){
  // Prefer a long dash as the separator (hyphens can appear inside words like
  // "well-known"), and fall back to a hyphen only when it has spaces around it.
  return line.match(DASH_LINE) || line.match(HYPHEN_LINE);
}

function parseBulk(text){
  const lines = text.split('\n');
  let added = 0;
  const dupSame = [];      // already in your box, identical translation
  const dupChanged = [];   // already in your box, different translation
  const dupInList = [];    // repeated twice inside the pasted text itself
  const seenThisPaste = {};
  let unparsed = 0;

  lines.forEach(line=>{
    if(!line.trim()) return;
    const m = parseLine(line);
    if(!m){ unparsed++; return; }
    const word = m[1].trim().normalize('NFC');
    const translation = m[2].trim().normalize('NFC');
    if(!word || !translation){ unparsed++; return; }
    const key = normWord(word);

    if(seenThisPaste[key]){
      dupInList.push(word);
      return;
    }
    seenThisPaste[key] = true;

    const existing = cards.find(c => c.deck === currentDeck && normWord(c.word) === key);
    if(existing){
      if(normWord(existing.translation) === normWord(translation)){
        dupSame.push(word);
      } else {
        existing.translation = translation;
        touch(existing);
        dupChanged.push(word);
      }
    } else {
      cards.push({
        id: Date.now() + '-' + Math.random().toString(36).slice(2,8),
        deck: currentDeck,
        word, translation,
        box: 1,
        seen: false,
        due: Date.now(),
        changedAt: addedStamp(currentDeck, word, 0)
      });
      added++;
    }
  });
  return {added, dupSame, dupChanged, dupInList, unparsed};
}

function summarizeList(words, limit){
  const shown = words.slice(0, limit).map(isolate).join(', ');
  return words.length > limit ? t('andMore', {shown: shown, n: words.length - limit}) : shown;
}

// Seed decks keyed by translation language. Each I18N entry names the deck
// it loads, so the English interface keeps using the Russian one.
const SAMPLE_DECKS = {
  ru: [
    ['abundant','обильный'],['deteriorate','ухудшаться'],['feasible','осуществимый'],
    ['inevitably','неизбежно'],['scrutinize','тщательно изучать'],['ambiguous','двусмысленный'],
    ['diligent','усердный'],['profound','глубокий'],['reluctant','неохотный'],
    ['thrive','процветать'],['viable','жизнеспособный'],['coherent','связный'],
    ['deliberately','намеренно'],['fluctuate','колебаться'],['substantial','существенный'],
    ['compelling','убедительный'],['hinder','препятствовать'],['notion','понятие'],
    ['resilient','устойчивый'],['versatile','универсальный']
  ],
  uz: [
    ['abundant','moʻl'],['deteriorate','yomonlashmoq'],['feasible','amalga oshirsa boʻladigan'],
    ['inevitably','muqarrar ravishda'],['scrutinize','sinchiklab oʻrganmoq'],['ambiguous','ikki maʼnoli'],
    ['diligent','tirishqoq'],['profound','chuqur'],['reluctant','istamaydigan'],
    ['thrive','gullab-yashnamoq'],['viable','yashovchan'],['coherent','izchil'],
    ['deliberately','ataylab'],['fluctuate','oʻzgarib turmoq'],['substantial','salmoqli'],
    ['compelling','ishonarli'],['hinder','toʻsqinlik qilmoq'],['notion','tushuncha'],
    ['resilient','chidamli'],['versatile','koʻp qirrali']
  ]
};

function loadSampleDeck(){
  if(!isEnglishDeck()) return;
  const sample = SAMPLE_DECKS[(I18N[lang] || I18N.en).sampleDeck] || SAMPLE_DECKS.ru;
  sample.forEach(([word, translation])=>{
    if(cards.find(c => c.deck === currentDeck && normWord(c.word) === normWord(word))) return;
    cards.push({
      id: Date.now() + '-' + Math.random().toString(36).slice(2,8),
      deck: currentDeck,
      word, translation, box:1, seen:false, due: Date.now(),
      changedAt: addedStamp(currentDeck, word, 0)
    });
  });
  saveCards();
  noteDeckActive(currentDeck);
  buildQueue();
  renderStats();
  renderStatsPanel();
  renderWordList();
  current = null;
  renderCard(true);
}

let lastDeleted = null;
let undoTimer = null;

function moveWord(id, box){
  const card = cards.find(c => c.id === id);
  if(!card) return;
  card.box = Math.min(Math.max(box,1),5);
  card.due = Date.now();
  touch(card);
  saveCards();
  buildQueue();
  renderStats();
  renderStatsPanel();
  renderWordList();
  if(!current) renderCard(false);
}

function deleteWord(id){
  const card = cards.find(c => c.id === id);
  if(!card) return;
  lastDeleted = [card];
  lastDeletedDeck = null;
  cards = cards.filter(c => c.id !== id);
  addTombstones([card]);
  queue = queue.filter(c => c.id !== id);
  if(current && current.id === id){
    current = null;
    renderCard(false);
  }
  saveCards();
  renderStats();
  renderStatsPanel();
  renderWordList();
  showUndo(t('deletedWord', {w: '<bdi>' + escapeHtml(card.word) + '</bdi>'}));
}

function deleteAllWords(){
  const mine = deckCards();
  if(mine.length === 0) return;
  const n = mine.length;
  if(!confirm(t('confirmDeleteAll', {n: count('word', n)}))) return;
  lastDeleted = mine;
  lastDeletedDeck = null;
  cards = cards.filter(c => c.deck !== currentDeck);
  addTombstones(lastDeleted);
  queue = [];
  current = null;
  practiceMode = false;
  saveCards();
  renderStats();
  renderStatsPanel();
  renderWordList();
  renderCard(false);
  showUndo(t('deletedAll', {n: count('word', n)}));
}

// The undo bar shows next to whatever was deleted: the word list, or the
// deck panel for a deck.
function showUndo(message, rowId){
  hideUndo();
  const bar = document.getElementById(rowId || 'undoRow');
  bar.innerHTML = message + ' — <button class="undo-btn">' + t('undo') + '</button>';
  bar.style.display = 'block';
  bar.querySelector('.undo-btn').addEventListener('click', undoDelete);
  clearTimeout(undoTimer);
  undoTimer = setTimeout(()=>{
    hideUndo();
    lastDeleted = null;
    lastDeletedDeck = null;
  }, 7000);
}
function hideUndo(){
  document.getElementById('undoRow').style.display = 'none';
  document.getElementById('deckUndoRow').style.display = 'none';
}

function undoDelete(){
  if(!lastDeleted) return;
  // Restoring is a fresh edit, so it beats the tombstone even if the deletion
  // has already reached other devices.
  const deck = lastDeletedDeck;
  if(deck){
    deckTombstones = deckTombstones.filter(tb => tb.id !== deck.id);
    if(!deckById(deck.id)) decks.push(Object.assign({}, deck, {changedAt: Date.now(), activeAt: Date.now()}));
    saveDecks();
  }
  lastDeleted.forEach(touch);
  clearTombstones(lastDeleted);
  cards = cards.concat(lastDeleted);
  lastDeleted = null;
  lastDeletedDeck = null;
  clearTimeout(undoTimer);
  hideUndo();
  saveCards();
  if(deck){ switchDeck(deck.id); return; }
  buildQueue();
  renderStats();
  renderStatsPanel();
  renderWordList();
  if(!current) renderCard(false);
}

// Translations are separated lists like "достоинство, заслуга; заслужить", so a
// prefix match means any one of those words starts with the query.
function translationWords(translation){
  return normWord(translation).split(/[\s,;\/()，、；／（）،؛]+/).filter(Boolean);
}

function rankWords(pool, filter){
  const ordered = pool.slice().reverse();
  if(!filter) return ordered;
  const starts = [], within = [], transStarts = [], transWithin = [];
  ordered.forEach(c=>{
    const word = normWord(c.word);
    const translation = normWord(c.translation);
    if(word.startsWith(filter)) starts.push(c);
    else if(word.includes(filter)) within.push(c);
    else if(translationWords(c.translation).some(t => t.startsWith(filter))) transStarts.push(c);
    else if(translation.includes(filter)) transWithin.push(c);
  });
  return starts.concat(within, transStarts, transWithin);
}

function renderWordList(){
  const wrap = document.getElementById('wordList');
  const filter = normWord(document.getElementById('wordFilter').value);
  const title = document.getElementById('wordListTitle');
  const mine = deckCards();
  const pool = boxFilter ? mine.filter(c => c.box === boxFilter) : mine;
  const shown = rankWords(pool, filter);
  const shownCount = filter ? shown.length : pool.length;
  if(boxFilter){
    title.innerHTML = t('boxTitle', {b: boxFilter, n: shownCount}) + ' <button class="show-all" id="showAllBtn">' + t('showAll') + '</button>';
    const sa = document.getElementById('showAllBtn');
    if(sa) sa.addEventListener('click', ()=>{ boxFilter = null; renderWordList(); });
  } else {
    title.innerHTML = t('yourWords', {n: shownCount});
  }
  wrap.innerHTML = '';
  if(shown.length === 0){
    wrap.innerHTML = '<div class="word-list-empty">' + (pool.length === 0 ? (boxFilter ? t('noWordsInBox') : t('noWordsYet')) : t('noFilterMatch')) + '</div>';
    return;
  }
  shown.forEach(c=>{
    const row = document.createElement('div');
    row.className = 'word-row';
    let opts = '';
    for(let i=1;i<=5;i++){
      opts += '<option value="'+i+'"'+(c.box===i?' selected':'')+'>box '+i+'</option>';
    }
    row.innerHTML =
      '<span class="w"' + wordAttrs(c) + '>' + escapeHtml(c.word) + '</span>' +
      '<span class="t"' + TRANS_ATTRS + '>' + escapeHtml(c.translation) + '</span>' +
      '<select class="box-select" title="Move to another box">' + opts + '</select>' +
      '<button class="del" title="Delete" aria-label="Delete">×</button>';
    row.querySelector('.box-select').addEventListener('change', (e)=>{
      moveWord(c.id, parseInt(e.target.value, 10));
    });
    row.querySelector('.del').addEventListener('click', ()=>deleteWord(c.id));
    wrap.appendChild(row);
  });
}
