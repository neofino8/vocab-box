function dueCards(){
  const now = Date.now();
  return deckCards().filter(c => c.due <= now);
}

function buildQueue(){
  queue = dueCards().sort(()=>Math.random()-0.5);
  practiceMode = false;
}

function startPractice(){
  queue = deckCards().sort(()=>Math.random()-0.5);
  practiceMode = true;
  current = null;
  renderCard(true);
}

let boxFilter = null;

function openBox(i){
  boxFilter = i;
  document.getElementById('addPanel').classList.add('open');
  renderWordList();
  document.getElementById('addPanel').scrollIntoView({behavior:'smooth', block:'start'});
}

function renderStats(){
  const counts = [0,0,0,0,0,0];
  const mine = deckCards();
  mine.forEach(c => counts[c.box]++);
  const drawers = document.getElementById('drawers');
  drawers.innerHTML = '';
  for(let i=1;i<=5;i++){
    const d = document.createElement('div');
    d.className = 'drawer';
    d.title = t('drawerTitle', {n: i});
    d.innerHTML = '<div class="n">'+counts[i]+'</div><div class="l">'+t('boxShort', {n: i})+'</div>';
    d.addEventListener('click', ()=>openBox(i));
    drawers.appendChild(d);
  }
  document.getElementById('totalline').textContent = count('card', mine.length);
  document.getElementById('dueline').textContent = t('dueToday', {n: dueCards().length});
}

function frontText(c){ return settings.direction === 'normal' ? c.word : c.translation; }
function backText(c){ return settings.direction === 'normal' ? c.translation : c.word; }

// Attributes for an element showing a word or a translation. Each takes its
// direction from its own text, so Arabic reads right to left inside a left-
// to-right layout. A word also carries its deck's language; a translation's
// language isn't known, so it carries none.
function wordAttrs(c){ return ' dir="auto" lang="' + deckVoice(c.deck) + '"'; }
const TRANS_ATTRS = ' dir="auto"';
function frontAttrs(c){ return settings.direction === 'normal' ? wordAttrs(c) : TRANS_ATTRS; }
function backAttrs(c){ return settings.direction === 'normal' ? TRANS_ATTRS : wordAttrs(c); }
// Wraps text going into a sentence built as plain text, so a right-to-left
// word can't reorder the words and punctuation around it.
function isolate(s){ return '\u2068' + s + '\u2069'; }

function answerVariants(c){
  // Alternatives are split on Latin, Chinese and Arabic commas and semicolons.
  return backText(c).split(/[,;\/，、；／،؛]/).map(normWord).filter(Boolean);
}

function checkAnswer(input, c){
  const val = normWord(input);
  if(!val) return false;
  return answerVariants(c).some(v => v === val);
}

let mode = 'review';
let learnIdx = 0;
let learnList = [];
let quiz = null;
let quizScore = {right:0, total:0};
let match = null;
let matchTimerId = null;

function setMode(m){
  if(matchTimerId){ clearInterval(matchTimerId); matchTimerId = null; }
  mode = m;
  match = null;
  quiz = null;
  document.querySelectorAll('.tab-btn').forEach(b=>{
    b.classList.toggle('on', b.dataset.mode === m);
  });
  if(m === 'review'){ buildQueue(); current = null; }
  if(m === 'learn'){ buildLearnList(); }
  renderChips();
  renderCard(false);
}

function buildLearnList(){
  const pool = deckCards();
  const unseen = pool.filter(c => !c.seen);
  learnList = unseen.length ? unseen.concat(pool.filter(c => c.seen)) : pool;
  learnIdx = 0;
}

function learnStatsHtml(){
  const pool = deckCards();
  return '<div class="learn-stats">' +
    '<div class="learn-stat"><div class="v" id="lsNew">' + pool.filter(x=>!x.seen).length + '</div><div class="k">' + t('lsNew') + '</div></div>' +
    '<div class="learn-stat"><div class="v" id="lsSeen">' + pool.filter(x=>x.seen).length + '</div><div class="k">' + t('lsSeen') + '</div></div>' +
    '<div class="learn-stat"><div class="v" id="lsMastered">' + pool.filter(x=>x.box===5).length + '</div><div class="k">' + t('lsMastered') + '</div></div>' +
  '</div>';
}

function refreshLearnStats(){
  const n = document.getElementById('lsNew');
  if(!n) return;
  const pool = deckCards();
  n.textContent = pool.filter(x=>!x.seen).length;
  document.getElementById('lsSeen').textContent = pool.filter(x=>x.seen).length;
  document.getElementById('lsMastered').textContent = pool.filter(x=>x.box===5).length;
}

function learnRow(c, i){
  const row = document.createElement('div');
  row.className = 'learn-row' + (c.seen ? ' is-known' : '');
  row.innerHTML =
    '<span class="learn-row-n">' + (i+1) + '</span>' +
    '<div class="learn-row-main">' +
      '<div class="learn-row-word"><span' + wordAttrs(c) + '>' + escapeHtml(c.word) + '</span>' +
        (c.seen ? '' : '<span class="learn-row-new">' + t('newBadge') + '</span>') +
      '</div>' +
      '<div class="learn-row-trans"' + TRANS_ATTRS + '>' + escapeHtml(c.translation) + '</div>' +
    '</div>' +
    '<button class="learn-row-know">' + (c.seen ? t('knownTick') : t('iKnowIt')) + '</button>';
  const btn = row.querySelector('.learn-row-know');
  // Already-known words are inert: re-marking would knock a mastered word
  // back down to box 3.
  btn.disabled = c.seen;
  btn.addEventListener('click', ()=>{
    if(btn.disabled) return;
    markKnown(c, 3);
    // Update this row only, so the list does not jump under the reader.
    const badge = row.querySelector('.learn-row-new');
    if(badge) badge.remove();
    row.classList.add('is-known');
    btn.textContent = t('knownTick');
    btn.disabled = true;
    refreshLearnStats();
  });
  return row;
}

function renderLearnList(stage){
  const wrap = document.createElement('div');
  wrap.style.width = '100%';
  const list = document.createElement('div');
  list.className = 'learn-list';
  learnList.forEach((c, i)=> list.appendChild(learnRow(c, i)));
  wrap.appendChild(list);
  wrap.insertAdjacentHTML('beforeend', learnStatsHtml());
  stage.appendChild(wrap);
}

function renderLearn(){
  const stage = document.getElementById('stage');
  stage.innerHTML = '';
  if(deckCards().length === 0){
    const n = document.createElement('div');
    n.className = 'stage-note';
    n.innerHTML = '<div class="big">' + t('nothingToLearn') + '</div>' + t(isEnglishDeck() ? 'nothingToLearnBody' : 'nothingToLearnOwn');
    stage.appendChild(n);
    return;
  }
  if(!learnList.length) buildLearnList();
  if(settings.learnView === 'list'){ renderLearnList(stage); return; }
  if(learnIdx >= learnList.length) learnIdx = learnList.length - 1;
  if(learnIdx < 0) learnIdx = 0;
  const c = learnList[learnIdx];

  const wrap = document.createElement('div');
  wrap.style.width = '100%';
  wrap.innerHTML =
    '<div class="learn-card">' +
      (c.seen ? '' : '<span class="learn-new">' + t('newBadge') + '</span>') +
      '<span class="learn-counter">' + (learnIdx+1) + ' / ' + learnList.length + '</span>' +
      '<button class="speak-btn" id="learnSpeak" title="' + t('pronounce') + '" aria-label="' + t('pronounce') + '">' + SPEAKER_SVG + '</button>' +
      '<div class="learn-word"' + wordAttrs(c) + '>' + escapeHtml(c.word) + '</div>' +
      '<div class="learn-trans"' + TRANS_ATTRS + '>' + escapeHtml(c.translation) + '</div>' +
    '</div>' +
    '<div class="learn-nav">' +
      '<button class="btn-nav" id="learnPrev"' + (learnIdx===0?' disabled':'') + '>←</button>' +
      '<button class="btn-practice-this" id="learnPractice">' + t('stillLearning') + '</button>' +
      '<button class="btn-know" id="learnKnow">' + t('learnKnow') + '</button>' +
      '<button class="btn-nav" id="learnNext"' + (learnIdx>=learnList.length-1?' disabled':'') + '>→</button>' +
    '</div>' +
    learnStatsHtml();
  stage.appendChild(wrap);

  const sp = wrap.querySelector('#learnSpeak');
  if(sp) sp.addEventListener('click', ()=>speak(c.word, sp, deckVoice(c.deck)));
  updateSpeakers();
  wrap.querySelector('#learnPrev').addEventListener('click', ()=>{ learnIdx--; renderLearn(); });
  wrap.querySelector('#learnNext').addEventListener('click', ()=>{ learnIdx++; renderLearn(); });
  wrap.querySelector('#learnKnow').addEventListener('click', ()=>introduce(c, 3));
  wrap.querySelector('#learnPractice').addEventListener('click', ()=>introduce(c, 1));
}

function markKnown(card, box){
  card.seen = true;
  card.box = box;
  card.due = box === 1 ? Date.now() : Date.now() + INTERVAL_DAYS[box] * DAY;
  touch(card);
  saveCards();
  renderStats();
  renderStatsPanel();
  renderWordList();
}

function introduce(card, box){
  markKnown(card, box);
  if(learnIdx < learnList.length - 1) learnIdx++;
  renderLearn();
}

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function notEnough(stage, need, what){
  const n = document.createElement('div');
  n.className = 'stage-note';
  n.innerHTML = '<div class="big">' + t('needAtLeast', {n: count('word', need)}) + '</div>' +
    t('needBody', {what: what, n: count('word', deckCards().length)}) +
    (deckCards().length === 0 && isEnglishDeck() ? t('addMoreOrSample') : t('addMoreBelow'));
  stage.appendChild(n);
}

/* ---------- Quiz ---------- */

function newQuizQuestion(){
  // Distractors come from the same deck, so they are in the same language.
  const mine = deckCards();
  const due = dueCards();
  const pool = due.length ? due : mine;
  const card = pool[Math.floor(Math.random()*pool.length)];
  const others = shuffle(mine.filter(c => c.id !== card.id)).slice(0,3);
  quiz = {
    card,
    options: shuffle([card].concat(others)),
    answered: false,
    pickedId: null
  };
}

function renderQuiz(){
  const stage = document.getElementById('stage');
  stage.innerHTML = '';
  const mine = deckCards();
  if(mine.length < 4){ notEnough(stage, 4, t('modeQuiz')); return; }
  if(quiz && !mine.find(c => c.id === quiz.card.id)) quiz = null;
  if(!quiz) newQuizQuestion();

  const wrap = document.createElement('div');
  wrap.style.width = '100%';
  wrap.style.display = 'flex';
  wrap.style.flexDirection = 'column';
  wrap.style.alignItems = 'center';

  const dirLabel = settings.direction === 'normal' ? t('chooseTranslation') : t('chooseWord');
  wrap.innerHTML =
    '<span class="quiz-label">' + dirLabel + '</span>' +
    '<div class="quiz-prompt"' + frontAttrs(quiz.card) + '>' + escapeHtml(frontText(quiz.card)) + '</div>' +
    '<div class="quiz-options" id="quizOpts"></div>' +
    '<div class="quiz-foot"><span id="quizScore"></span><span id="quizNextSlot"></span></div>';
  stage.appendChild(wrap);

  const opts = wrap.querySelector('#quizOpts');
  quiz.options.forEach(o=>{
    const b = document.createElement('button');
    b.className = 'quiz-opt';
    b.textContent = backText(o);
    b.dir = 'auto';
    if(settings.direction !== 'normal') b.lang = deckVoice(o.deck);
    if(quiz.answered){
      b.disabled = true;
      if(o.id === quiz.card.id) b.classList.add('right');
      else if(o.id === quiz.pickedId) b.classList.add('wrong');
    } else {
      b.addEventListener('click', ()=>answerQuiz(o.id));
    }
    opts.appendChild(b);
  });

  wrap.querySelector('#quizScore').textContent =
    quizScore.total ? quizScore.right + ' / ' + quizScore.total + ' correct' : '';

  if(quiz.answered){
    const nb = document.createElement('button');
    nb.className = 'btn-next';
    nb.textContent = t('nextQuestion');
    nb.addEventListener('click', ()=>{ newQuizQuestion(); renderQuiz(); });
    wrap.querySelector('#quizNextSlot').appendChild(nb);
  }
}

function answerQuiz(pickedId){
  if(quiz.answered) return;
  quiz.answered = true;
  quiz.pickedId = pickedId;
  const correct = pickedId === quiz.card.id;
  quizScore.total++;
  if(correct) quizScore.right++;

  const card = quiz.card;
  if(correct){
    card.box = Math.min(card.box + 1, 5);
    card.due = Date.now() + INTERVAL_DAYS[card.box] * DAY;
  } else {
    card.box = 1;
    card.due = Date.now();
  }
  touch(card);
  saveCards();
  logReview(card.deck);
  renderStats();
  renderStatsPanel();
  renderQuiz();
}

/* ---------- Speed Match ---------- */

const MATCH_SECONDS = 60;
const MATCH_PAIRS = 5;

function startMatch(){
  match = {
    left:[], right:[], picked:null, locked:false,
    score:0, timeLeft:MATCH_SECONDS, over:false
  };
  dealMatch();
  renderMatch();
  if(matchTimerId) clearInterval(matchTimerId);
  matchTimerId = setInterval(()=>{
    if(!match || match.over) return;
    match.timeLeft--;
    if(match.timeLeft <= 0){
      match.timeLeft = 0;
      match.over = true;
      clearInterval(matchTimerId);
      matchTimerId = null;
      renderMatch();
    } else {
      const t = document.getElementById('matchTimer');
      if(t){
        t.textContent = match.timeLeft;
        t.classList.toggle('low', match.timeLeft <= 10);
      }
    }
  }, 1000);
}

function dealMatch(){
  const mine = deckCards();
  const picks = shuffle(mine).slice(0, Math.min(MATCH_PAIRS, mine.length));
  match.left = shuffle(picks).map(c=>({id:c.id, text:c.word, done:false}));
  match.right = shuffle(picks).map(c=>({id:c.id, text:c.translation, done:false}));
  match.picked = null;
}

function renderMatch(){
  const stage = document.getElementById('stage');
  stage.innerHTML = '';
  if(deckCards().length < MATCH_PAIRS){ notEnough(stage, MATCH_PAIRS, t('modeMatch')); return; }

  const wrap = document.createElement('div');
  wrap.style.width = '100%';

  if(!match){
    wrap.innerHTML =
      '<div class="stage-note"><div class="big">' + t('matchTitle') + '</div>' +
      t('matchIntro') +
      '<br><button class="btn-sample" id="matchStart">' + t('start') + '</button></div>';
    stage.appendChild(wrap);
    wrap.querySelector('#matchStart').addEventListener('click', startMatch);
    return;
  }

  if(match.over){
    wrap.innerHTML =
      '<div class="match-center">' +
      '<div class="match-big">' + match.score + '</div>' +
      '<div class="match-sub">' + t('pairsMatched', {n: count('pair', match.score)}) + '</div>' +
      '<button class="btn-sample" id="matchAgain">' + t('playAgain') + '</button></div>';
    stage.appendChild(wrap);
    wrap.querySelector('#matchAgain').addEventListener('click', startMatch);
    return;
  }

  wrap.innerHTML =
    '<div class="match-head">' +
      '<div class="match-timer' + (match.timeLeft<=10?' low':'') + '" id="matchTimer">' + match.timeLeft + '</div>' +
      '<div class="match-score"><b>' + match.score + '</b>' + t('matchedLabel') + '</div>' +
    '</div><div class="match-grid" id="matchGrid"></div>';
  stage.appendChild(wrap);

  const grid = wrap.querySelector('#matchGrid');
  for(let i=0;i<match.left.length;i++){
    grid.appendChild(matchTile(match.left[i], 'left'));
    grid.appendChild(matchTile(match.right[i], 'right'));
  }
}

function matchTile(item, side){
  const b = document.createElement('button');
  b.className = 'match-tile' + (item.done ? ' gone' : '');
  b.textContent = item.text;
  b.dir = 'auto';
  if(side === 'left') b.lang = curDeck().voice;
  if(item.done){ b.disabled = true; return b; }
  if(match.picked && match.picked.side === side && match.picked.item === item){
    b.classList.add('picked');
  }
  b.addEventListener('click', ()=>pickMatch(item, side, b));
  return b;
}

function pickMatch(item, side, el){
  if(!match || match.over || match.locked || item.done) return;
  if(!match.picked){
    match.picked = {item, side};
    renderMatch();
    return;
  }
  if(match.picked.side === side){
    match.picked = {item, side};
    renderMatch();
    return;
  }
  const a = match.picked.item, b = item;
  if(a.id === b.id){
    a.done = true; b.done = true;
    match.score++;
    match.picked = null;
    if(match.left.every(x=>x.done)){
      dealMatch();
    }
    renderMatch();
  } else {
    match.locked = true;
    el.classList.add('miss');
    match.picked = null;
    setTimeout(()=>{
      match.locked = false;
      if(match && !match.over) renderMatch();
    }, 350);
  }
}

function renderCard(animateIn){
  if(mode === 'learn'){ renderLearn(); return; }
  if(mode === 'quiz'){ renderQuiz(); return; }
  if(mode === 'match'){ renderMatch(); return; }

  const stage = document.getElementById('stage');
  stage.innerHTML = '';

  if(!current){
    if(queue.length === 0){
      practiceMode = false;
      const empty = document.createElement('div');
      empty.className = 'empty';
      const total = deckCards().length;
      if(total === 0){
        empty.innerHTML = '<div class="big">' + t('emptyTitle') + '</div>' + (isEnglishDeck()
          ? t('emptyBody') + '<br><button class="btn-sample" id="sampleBtn">' + t('sampleBtn') + '</button>'
          : t('emptyBodyOwn'));
      } else {
        empty.innerHTML = '<div class="big">' + t('allDoneTitle') + '</div>' + t('allDoneBody') + '<br><button class="btn-practice" id="practiceBtn">' + t('practiceAnyway') + '</button>';
      }
      stage.appendChild(empty);
      const pb = document.getElementById('practiceBtn');
      if(pb) pb.addEventListener('click', startPractice);
      const smp = document.getElementById('sampleBtn');
      if(smp) smp.addEventListener('click', loadSampleDeck);
      return;
    }
    current = queue.shift();
    flipped = false;
    answered = false;
    lastAnswerCorrect = null;
  }

  const card = document.createElement('div');
  card.className = 'card' + (animateIn ? ' entering' : '');
  const showSpeaker = settings.direction === 'normal' || flipped;
  card.innerHTML =
    '<div class="tab' + (practiceMode ? ' practice' : '') + '">' + (practiceMode ? t('practiceTab') : t('boxShort', {n: current.box})) + '</div>' +
    (showSpeaker ? '<button class="speak-btn" id="speakBtn" title="' + t('pronounce') + '" aria-label="' + t('pronounce') + '">' + SPEAKER_SVG + '</button>' : '') +
    '<div class="holes"><div class="hole"></div><div class="hole"></div></div>' +
    '<div class="card-body" id="cardBody"></div>';
  stage.appendChild(card);

  const body = card.querySelector('#cardBody');
  renderCardBody(body);

  const sb = card.querySelector('#speakBtn');
  if(sb) sb.addEventListener('click', ()=>{ speak(current.word, sb, deckVoice(current.deck)); });
  updateSpeakers();

  card.addEventListener('click', (e)=>{
    if(e.target.closest('button') || e.target.closest('input')) return;
    if(!flipped){
      flip();
    }
  });

  if(settings.typing && !flipped){
    const inp = card.querySelector('#typeInput');
    if(inp){
      inp.focus();
      inp.addEventListener('keydown', (e)=>{
        // While an input method is composing (pinyin, say), Enter picks the
        // characters; it only submits once composing is done.
        if(e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) submitTyped();
      });
      card.querySelector('#checkBtn').addEventListener('click', submitTyped);
    }
  }

  if(flipped) showRateButtons();
}

function flip(){
  flipped = true;
  renderCard(false);
}

function submitTyped(){
  const inp = document.getElementById('typeInput');
  if(!inp) return;
  answered = true;
  lastAnswerCorrect = checkAnswer(inp.value, current);
  flip();
}

function renderCardBody(body){
  if(!flipped){
    let html = '<div class="word"' + frontAttrs(current) + '>' + escapeHtml(frontText(current)) + '</div>';
    if(settings.typing){
      html += '<div class="type-row"><input class="type-input" id="typeInput" type="text" dir="auto" placeholder="' + t('typePh') + '" autocomplete="off" autocapitalize="off"><button class="btn-check" id="checkBtn">' + t('check') + '</button></div>';
      html += '<div class="hint">' + t('orTapToReveal') + '</div>';
    } else {
      html += '<div class="hint">' + t('tapToReveal') + '</div>';
    }
    body.innerHTML = html;
  } else {
    let html =
      '<div class="word"' + frontAttrs(current) + '>' + escapeHtml(frontText(current)) + '</div>' +
      '<div class="divider"></div>' +
      '<div class="translation"' + backAttrs(current) + '>' + escapeHtml(backText(current)) + '</div>';
    if(answered && lastAnswerCorrect !== null){
      html += '<div class="feedback ' + (lastAnswerCorrect ? 'right">' + t('correct') : 'wrong">' + t('notQuite')) + '</div>';
    }
    body.innerHTML = html;
  }
}

function showRateButtons(){
  const stage = document.getElementById('stage');
  if(stage.querySelector('.rate-row')) return;
  const row = document.createElement('div');
  row.className = 'rate-row';
  row.innerHTML =
    '<button class="btn-again" id="btnAgain">' + t('again') + '</button>' +
    '<button class="btn-good" id="btnGood">' + t('good') + '</button>';
  stage.appendChild(row);
  document.getElementById('btnAgain').addEventListener('click', ()=>rate(false));
  document.getElementById('btnGood').addEventListener('click', ()=>rate(true));
}

function rate(good){
  const card = current;
  const stage = document.getElementById('stage');
  const cardEl = stage.querySelector('.card');
  if(cardEl) cardEl.classList.add('leaving');

  if(!practiceMode){
    if(good){
      card.box = Math.min(card.box + 1, 5);
      card.due = Date.now() + INTERVAL_DAYS[card.box] * DAY;
    } else {
      card.box = 1;
      card.due = Date.now();
      const pos = Math.min(queue.length, 2);
      queue.splice(pos, 0, card);
    }
    touch(card);
    saveCards();
  } else if(!good){
    const pos = Math.min(queue.length, 2);
    queue.splice(pos, 0, card);
  }

  logReview(card.deck);
  renderStats();
  renderStatsPanel();

  current = null;
  setTimeout(()=>renderCard(true), 160);
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
