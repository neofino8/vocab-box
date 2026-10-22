const STORAGE_KEY = 'vocab-box-cards';
const LEGACY_KEY = 'ielts-vocab-cards';
const THEME_KEY = 'vocab-box-theme';
const BG_IMAGE_KEY = 'vocab-box-bg-image';
const SETTINGS_KEY = 'vocab-box-settings';
const ACTIVITY_KEY = 'vocab-box-activity';
const CARD_KEY = 'vocab-box-card-color';
const CARD_IMAGE_KEY = 'vocab-box-card-image';
const SYNC_KEY = 'vocab-box-sync';
const DEVICE_KEY = 'vocab-box-device';
const TOMBSTONE_KEY = 'vocab-box-tombstones';
const DECKS_KEY = 'vocab-box-decks';
const DECK_TOMBSTONE_KEY = 'vocab-box-deck-tombstones';
const CURRENT_DECK_KEY = 'vocab-box-current-deck';
const DAY = 86400000;
const INTERVAL_DAYS = {1:1, 2:2, 3:4, 4:7, 5:14};
const TOMBSTONE_TTL = 60 * DAY;
// Cards from before decks existed, and older backups, belong to this deck. A
// fixed id rather than a random one means every device migrates into the
// same deck, so syncing never turns one IELTS deck into two.
const DEFAULT_DECK = 'default';
const DEFAULT_DECK_NAME = 'IELTS';
const DECK_NAME_MAX = 40;

// `soft` is the muted text colour. On a dark theme it is drawn on the theme's
// panel, the lightest surface it sits on, so it must reach 4.5:1 against
// `panel`. On a light theme the darkest surface is the faint well inside a
// panel, so `soft` and `accent` must reach 4.5:1 against that, and white
// text on `accent` must too. `danger` is the red text on a panel, given only
// where the default #E0868E falls short of 4.5:1.
const THEMES = [
  {id:'slate',  key:'thSlate',  bg:'#182027', panel:'#202A32', accent:'#C99A3E', soft:'#8A97A3'},
  {id:'night',  key:'thNight',  bg:'#101014', panel:'#1A1A22', accent:'#8B7FD4', soft:'#8A97A3'},
  {id:'forest', key:'thForest', bg:'#16241C', panel:'#1F3028', accent:'#7FB069', soft:'#8A97A3'},
  {id:'plum',   key:'thPlum',   bg:'#221826', panel:'#2E2134', accent:'#D48FB8', soft:'#8A97A3'},
  {id:'sand',   key:'thSand',   bg:'#4A4030', panel:'#584D3B', accent:'#E8C468', soft:'#BBC3CA', danger:'#FACCCF'},
  {id:'ocean',  key:'thOcean',  bg:'#132836', panel:'#1C3544', accent:'#5FB3CE', soft:'#909DA8'},
  {id:'wine',   key:'thWine',   bg:'#2E161B', panel:'#3C2027', accent:'#E0868E', soft:'#8A97A3'},
  {id:'coal',   key:'thCoal',   bg:'#1E1E1E', panel:'#292929', accent:'#B8B8B8', soft:'#8A97A3'},
  {id:'paper',  key:'thPaper',  bg:'#F3EEE3', panel:'#FBF8F1', accent:'#7F510A', soft:'#6A6255', danger:'#9A4532', light:true},
  {id:'mist',   key:'thMist',   bg:'#E8EBEE', panel:'#F6F7F9', accent:'#2C6188', soft:'#56616B', danger:'#9A4532', light:true}
];
// Auto is stored like a theme id but resolves to one of these two from the
// device's light/dark setting, and follows it when it changes.
const AUTO_THEME = 'auto';
const AUTO_DARK = 'slate';
const AUTO_LIGHT = 'paper';
const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');
function isThemeId(id){ return id === AUTO_THEME || THEMES.some(th => th.id === id); }
function themeById(id){ return THEMES.find(th => th.id === id); }

const CARD_COLORS = [
  {id:'#EFEAD9', key:'cPaper'},
  {id:'#F7F7F5', key:'cSnow'},
  {id:'#DCE9E1', key:'cMint'},
  {id:'#D8E5EF', key:'cSky'},
  {id:'#F1DEDE', key:'cRose'},
  {id:'#E6DEEF', key:'cLilac'},
  {id:'#2A2A28', key:'cCharcoal'},
  {id:'#1D2430', key:'cInk'}
];

const SPEAKER_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';

let cards = [];
let queue = [];
let current = null;
let flipped = false;
let practiceMode = false;
let answered = false;
let lastAnswerCorrect = null;
