function renderChips(){
  const dir = document.getElementById('dirChip');
  dir.textContent = settings.direction === 'normal' ? t('dirNormal') : t('dirReverse');
  dir.classList.toggle('on', settings.direction === 'reverse');
  const typ = document.getElementById('typeChip');
  typ.textContent = settings.typing ? t('typingOn') : t('typingOff');
  typ.classList.toggle('on', settings.typing);
  const vw = document.getElementById('viewChip');
  vw.textContent = settings.learnView === 'list' ? t('viewList') : t('viewCards');
  vw.classList.toggle('on', settings.learnView === 'list');
  vw.style.display = mode === 'learn' ? '' : 'none';
}

document.getElementById('dirChip').addEventListener('click', ()=>{
  settings.direction = settings.direction === 'normal' ? 'reverse' : 'normal';
  noteSettingsChange();
  renderChips();
  flipped = false; answered = false; lastAnswerCorrect = null;
  renderCard(false);
});

document.getElementById('viewChip').addEventListener('click', ()=>{
  settings.learnView = settings.learnView === 'list' ? 'cards' : 'list';
  saveSettings();
  renderChips();
  renderLearn();
});
document.getElementById('typeChip').addEventListener('click', ()=>{
  settings.typing = !settings.typing;
  noteSettingsChange();
  renderChips();
  flipped = false; answered = false; lastAnswerCorrect = null;
  renderCard(false);
});

document.getElementById('toggleAdd').addEventListener('click', ()=>{
  boxFilter = null;
  document.getElementById('addPanel').classList.toggle('open');
  renderWordList();
});

document.getElementById('wordFilter').addEventListener('input', renderWordList);

document.getElementById('deleteAllBtn').addEventListener('click', deleteAllWords);

document.getElementById('themeBtn').addEventListener('click', ()=>{
  document.getElementById('themePanel').classList.toggle('open');
  document.getElementById('statsPanel').classList.remove('open');
  if(deckPanelOpen()) closeDeckPanel();
});

document.getElementById('statsBtn').addEventListener('click', ()=>{
  renderStatsPanel();
  document.getElementById('statsPanel').classList.toggle('open');
  document.getElementById('themePanel').classList.remove('open');
  if(deckPanelOpen()) closeDeckPanel();
});

document.getElementById('deckSwitch').addEventListener('click', ()=>{
  if(deckPanelOpen()){ closeDeckPanel(); return; }
  document.getElementById('deckPanel').classList.add('open');
  document.getElementById('themePanel').classList.remove('open');
  document.getElementById('statsPanel').classList.remove('open');
  deckUi = 'idle'; deckMsg = '';
  renderDeckPanel();
});

document.getElementById('uploadBtn').addEventListener('click', ()=>{
  document.getElementById('bgFile').click();
});

document.getElementById('bgFile').addEventListener('change', (e)=>{
  if(e.target.files && e.target.files[0]){
    handleImageUpload(e.target.files[0]);
  }
});

document.querySelectorAll('.tab-btn').forEach(b=>{
  b.addEventListener('click', ()=>setMode(b.dataset.mode));
});

document.getElementById('cardUploadBtn').addEventListener('click', ()=>{
  document.getElementById('cardBgFile').click();
});

document.getElementById('cardBgFile').addEventListener('change', (e)=>{
  if(e.target.files && e.target.files[0]){
    handleCardImageUpload(e.target.files[0]);
    e.target.value = '';
  }
});

document.getElementById('clearBgBtn').addEventListener('click', ()=>{
  localStorage.removeItem(BG_IMAGE_KEY);
  localStorage.setItem(THEME_KEY, 'slate');
  localStorage.removeItem(CARD_KEY);
  localStorage.removeItem(CARD_IMAGE_KEY);
  applyTheme();
  applyCardColor();
  noteSettingsChange();
});

document.getElementById('cardColorInput').addEventListener('input', (e)=>{
  localStorage.setItem(CARD_KEY, e.target.value);
  localStorage.removeItem(CARD_IMAGE_KEY);
  applyCardColor();
  noteSettingsChange();
});

document.getElementById('exportBtn').addEventListener('click', exportBackup);
document.getElementById('importBtn').addEventListener('click', ()=>{
  document.getElementById('importFile').click();
});
document.getElementById('importFile').addEventListener('change', (e)=>{
  if(e.target.files && e.target.files[0]){
    importBackup(e.target.files[0]);
    e.target.value = '';
  }
});

document.getElementById('parseBtn').addEventListener('click', ()=>{
  const text = document.getElementById('bulkInput').value;
  const r = parseBulk(text);
  saveCards();
  if(r.added) noteDeckActive(currentDeck);
  const msg = document.getElementById('parseMsg');
  const parts = [];
  if(r.added) parts.push(t('parseAdded', {n: count('word', r.added)}));
  if(r.dupSame.length) parts.push(t('parseAlready') + summarizeList(r.dupSame, 3));
  if(r.dupChanged.length) parts.push(t('parseUpdated') + summarizeList(r.dupChanged, 3));
  if(r.dupInList.length) parts.push(t('parseRepeated') + summarizeList(r.dupInList, 3));
  if(parts.length === 0){
    msg.textContent = t('parseNoMatch');
  } else {
    msg.textContent = parts.join(' · ');
    document.getElementById('bulkInput').value = '';
  }
  clearTimeout(window._parseMsgTimer);
  window._parseMsgTimer = setTimeout(()=>{ msg.textContent = ''; }, 9000);
  buildQueue();
  renderStats();
  renderWordList();
  current = null;
  renderCard(false);
});

function showLanding(){
  document.getElementById('addPanel').classList.remove('open');
  document.getElementById('themePanel').classList.remove('open');
  document.getElementById('statsPanel').classList.remove('open');
  document.getElementById('deckPanel').classList.remove('open');
  resetLandingJoin();
  document.getElementById('landingSample').style.display = isEnglishDeck() ? '' : 'none';
  document.body.classList.add('landing-on');
  window.scrollTo(0, 0);
}

function hideLanding(){
  document.body.classList.remove('landing-on');
}

// The visible code is terse, so each segment's label names the language in
// the interface's own language, falling back to English, then to its own name.
function langLabel(code){
  const key = 'lang_' + code;
  return (I18N[lang] || I18N.en).t[key] || I18N.en.t[key] || I18N[code].name;
}

// Built once, then only re-synced, so the indicator can slide between
// segments and their text colours can fade rather than being replaced.
let langIndicator = null;

function renderLangOptions(){
  const wrap = document.getElementById('langOptions');
  if(!langIndicator){
    langIndicator = document.createElement('span');
    langIndicator.className = 'lang-ind';
    langIndicator.setAttribute('aria-hidden', 'true');
    wrap.appendChild(langIndicator);
    Object.keys(I18N).forEach(code=>{
      const b = document.createElement('button');
      b.className = 'lang-seg';
      b.dataset.lang = code;
      b.textContent = code.toUpperCase();
      b.addEventListener('click', ()=>{
        setLang(code, true);
        noteSettingsChange();
        relocalize();
      });
      wrap.appendChild(b);
    });
    // Re-place without motion whenever the pill resizes: first layout, web
    // fonts arriving, or the header returning after the landing screen.
    if('ResizeObserver' in window){
      new ResizeObserver(()=>placeLangIndicator(false)).observe(wrap);
    }
  }
  wrap.querySelectorAll('.lang-seg').forEach(b=>{
    const code = b.dataset.lang, label = langLabel(code), active = code === lang;
    b.classList.toggle('on', active);
    b.setAttribute('aria-pressed', active ? 'true' : 'false');
    b.setAttribute('aria-label', label);
    b.title = label;
  });
  placeLangIndicator(true);
}

// Size and position come from the active segment itself, not fixed offsets.
function placeLangIndicator(animate){
  const ind = langIndicator;
  if(!ind) return;
  const wrap = ind.parentElement, seg = wrap.querySelector('.lang-seg.on');
  const box = wrap.getBoundingClientRect();
  if(!seg || !box.width) return;  // header hidden; the observer places it once shown
  const r = seg.getBoundingClientRect(), c = getComputedStyle(wrap);
  // The first placement, and any re-placement after a resize, is instant.
  // Motion switches on once that position is committed, so the indicator
  // never slides in from the corner and never waits on the observer.
  const instant = !animate || !ind.hasAttribute('data-ready');
  if(instant) ind.removeAttribute('data-ready');
  ind.style.width = r.width + 'px';
  ind.style.height = r.height + 'px';
  ind.style.top = (r.top - box.top - parseFloat(c.borderTopWidth)) + 'px';
  ind.style.transform = 'translateX(' + (r.left - box.left - parseFloat(c.borderLeftWidth)) + 'px)';
  if(instant){
    void ind.offsetWidth;
    ind.setAttribute('data-ready', '');
  }
}

document.getElementById('aboutLink').addEventListener('click', showLanding);

document.getElementById('landingSample').addEventListener('click', ()=>{
  hideLanding();
  loadSampleDeck();
  setMode('learn');
});

document.getElementById('landingAdd').addEventListener('click', ()=>{
  hideLanding();
  boxFilter = null;
  document.getElementById('addPanel').classList.add('open');
  renderWordList();
  document.getElementById('bulkInput').focus();
});
