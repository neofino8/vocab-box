function todayKey(offsetDays){
  const d = new Date(Date.now() - (offsetDays||0)*DAY);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

// Counts are kept per device and deck, as "device:deck". A device only ever
// raises its own counters, which is what lets sync merge them by maximum.
function logReview(deck){
  const k = todayKey(0);
  const day = activity[k] || (activity[k] = {});
  const key = deviceId + ':' + deck;
  day[key] = (day[key] || 0) + 1;
  saveActivity();
}
// Counts from before decks name only a device. They were all made in the one
// deck there was, which is the default deck.
function activityDeck(key){
  const i = key.indexOf(':');
  return i === -1 ? DEFAULT_DECK : key.slice(i + 1);
}
// Each device keeps its own count per day, so totals add up across devices
// without counting anything twice. Without a deck it is the all-decks total.
function dayTotal(k, deck){
  const day = activity[k];
  let n = 0;
  if(day) for(const key in day) if(!deck || activityDeck(key) === deck) n += day[key];
  return n;
}

function computeStreak(){
  let streak = 0;
  let offset = dayTotal(todayKey(0)) ? 0 : 1;
  while(dayTotal(todayKey(offset))){
    streak++;
    offset++;
  }
  return streak;
}

// The current deck's numbers, then every deck's together. The streak is
// about the learner, not a deck, so it always counts every deck.
function renderStatsPanel(){
  const allTime = deck => Object.keys(activity).reduce((n,k)=>n+dayTotal(k, deck),0);
  const week = deck => { let n = 0; for(let i=0;i<7;i++) n += dayTotal(todayKey(i), deck); return n; };
  const set = (id, v) => { document.getElementById(id).textContent = v; };
  const mine = deckCards();
  set('stDeckName', curDeck().name);
  set('stStreak', computeStreak());
  set('stToday', dayTotal(todayKey(0), currentDeck));
  set('stWeek', week(currentDeck));
  set('stTotal', allTime(currentDeck));
  set('stMastered', mine.filter(c=>c.box===5).length);
  set('stCards', mine.length);
  document.getElementById('stAll').hidden = decks.length < 2;
  set('stAllToday', dayTotal(todayKey(0)));
  set('stAllWeek', week());
  set('stAllTotal', allTime());
  set('stAllMastered', cards.filter(c=>c.box===5).length);
  set('stAllCards', cards.length);
  set('stAllDeckCount', decks.length);
  updateSyncStatusLine();
}
