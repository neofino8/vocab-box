function init(){
  loadAll();
  // A saved choice always wins; otherwise fall back to the browser's language.
  setLang(settings.lang && I18N[settings.lang] ? settings.lang : detectLang(), false);
  renderSwatches();
  renderCardSwatches();
  applyTheme();
  darkScheme.addEventListener('change', ()=>{
    if(localStorage.getItem(THEME_KEY) === AUTO_THEME) applyTheme();
  });
  applyCardColor();
  renderChips();
  buildQueue();
  renderStats();
  renderStatsPanel();
  renderDeckPanel();
  renderCard(false);
  startSync();
  if(cards.length === 0) showLanding();
}

init();
