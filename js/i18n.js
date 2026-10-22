/* ---------- Languages ----------
   To add a language, add one object here: `name` in the language's own
   script, `locale` for Intl.PluralRules, `sampleDeck` naming an entry in
   SAMPLE_DECKS, `t` for strings and `plurals` for counted nouns. The
   switcher shows the key as a code and labels it with `lang_<key>` from the
   active interface, so add that name to every language's `t` too.
   Plural forms are keyed by CLDR category; a language with a single form
   only needs `other`, and plural() falls back to it. */
const I18N = {
  en: {
    name: 'English',
    locale: 'en', sampleDeck: 'ru',
    plurals: {
      word: { one: 'word', other: 'words' },
      card: { one: 'card', other: 'cards' },
      pair: { one: 'pair', other: 'pairs' },
      minute: { one: 'minute', other: 'minutes' },
      hour: { one: 'hour', other: 'hours' },
      day: { one: 'day', other: 'days' }
    },
    t: {
      docTitle: 'Vocab Box — spaced-repetition flashcards',
      subtitle: 'Flashcards filed by how well you know them',
      about: 'About', statsTitle: 'Stats', themeTitle: 'Appearance', language: 'Language',
      lang_en: 'English', lang_ru: 'Russian', lang_uz: 'Uzbek',

      landingTagline: 'Learn words and actually remember them.',
      landingLede: 'Vocab Box uses the Leitner system: words you know come back rarely, words you forget come back tomorrow. Reviewing something just before you’d forget it is what moves it into long-term memory.',
      p1t: 'Your words.', p1b: 'Paste any list, any language pair. Not someone else’s curriculum.',
      p2t: 'Four ways to study.', p2b: 'Learn, review, quiz, and a 60-second match challenge.',
      p3t: 'Private and free.', p3b: 'No account, no cost. Your words stay on your device unless you turn on sync.',
      landingSample: 'Start with 20 sample words', landingAdd: 'Add my own list',
      landingJoin: 'Already use Vocab Box on another device? Enter your sync code',

      tabLearn: 'Learn', tabReview: 'Review', tabQuiz: 'Quiz', tabMatch: 'Match',
      dirNormal: 'Direction: word → translation', dirReverse: 'Direction: translation → word',
      typingOn: 'Typing: on', typingOff: 'Typing: off',
      viewCards: 'View: Cards', viewList: 'View: List',

      stStreak: 'day streak', stToday: 'reviews today', stWeek: 'this week',
      stTotal: 'all time', stMastered: 'mastered (box 5)', stCards: 'total cards',
      stAllDecks: 'All decks', stDecks: 'decks',
      deckMenu: 'Switch deck', decksTitle: 'Decks', deckDue: '{n} due', newDeck: '+ New deck',
      deckName: 'Name', deckNamePh: 'Deck name, e.g. German', deckVoice: 'Voice language',
      createDeck: 'Create', deckSettings: 'Deck settings', deleteDeck: 'Delete deck',
      confirmDeleteDeck: 'Delete the deck “{name}” and its {n}?',
      confirmDeleteDeckEmpty: 'Delete the empty deck “{name}”?',
      deletedDeck: 'Deleted deck {name}', deckLastNote: 'Your only deck can’t be deleted.',
      deckNameEmpty: 'Give the deck a name.', deckNameTaken: 'You already have a deck with that name.',
      decksCombined: 'Two decks named “{name}” were combined into one.', deckRecovered: 'Recovered deck',
      voiceMissing: 'This device has no {lang} voice, so the speaker is hidden in this deck.',
      voiceHowIos: 'To add one, go to Settings → Accessibility → Spoken Content → Voices, then reload this page.',
      voiceHowAndroid: 'To add one, open Settings, search for “Text-to-speech”, open the engine’s settings and install the voice data, then reload this page.',
      voiceHowWindows: 'To add one, go to Settings → Time & language → Speech → Add voices, then reload this page.',
      voiceHowMac: 'To add one, go to System Settings → Accessibility → Spoken Content → System voice → Manage Voices, then reload this page.',
      voiceHowOther: 'To add one, look in your system’s speech or text-to-speech settings, then reload this page.',
      noSpeech: 'This browser can’t read words aloud, so the speaker is hidden.',
      exportBtn: 'Export backup', importBtn: 'Import',
      backupDone: 'Backup downloaded.',
      backupBad: 'Could not read that file. Is it a Vocab Box backup?',
      imported: '{added} added', importedProgressed: ', {n} progressed',

      syncTitle: 'Sync across devices',
      syncIntro: 'Keep the same words on your phone and computer. No account — just a code.',
      syncTurnOn: 'Turn on sync', syncHaveCode: 'I have a code',
      syncEnterHelp: 'Enter the code from your other device. The words here are kept and combined with the synced ones.',
      syncConnect: 'Connect', syncCancel: 'Cancel',
      syncCodeLabel: 'Your sync code', syncCopy: 'Copy', syncCopied: 'Copied',
      syncWarning: 'Write this code down — it’s the only way to reach your synced decks. Anyone who has it can see and change your words.',
      syncStop: 'Stop syncing',
      syncStopConfirm: 'Stop syncing on this device? Your words stay here, and the synced copy stays online for your other devices.',
      syncStatusSyncing: 'Syncing…', syncStatusSynced: 'Synced',
      syncStatusOffline: 'Offline — will retry', syncStatusError: 'Sync error',
      syncLastSynced: 'last synced {when}', justNow: 'just now', timeAgo: '{n} ago',
      syncBadCode: 'That doesn’t look like a sync code. It has 10 letters and digits, like 7KX2M-QP9RT.',
      syncNotFound: 'No synced decks use this code. Check it and try again.',
      syncUnreachable: 'Couldn’t reach the sync server. Check your connection and try again.',
      syncRejected: 'The sync server turned this deck down — it may be over the size limit.',
      syncImportConfirm: 'This backup includes sync code {code}. Turn on sync with it on this device?',
      joinTitle: 'Join your synced decks', joinSyncedCount: 'The synced decks have {n}.',
      joinWordsLegend: 'Words',
      joinCombine: 'Combine', joinCombineHint: 'Keep the words on this device and add the synced ones.',
      joinReplace: 'Replace', joinReplaceHint: 'Use only the synced decks. {n} on this device will be removed — a backup file downloads first.',
      joinReplaceConfirm: 'Remove {n} from this device? A backup file of them downloads first.',
      joinSettingsLegend: 'Appearance & settings',
      shareSettings: 'Use the same theme and settings on all devices',
      shareSettingsNote: 'Theme, card color, language, direction and typing. Background images and card photos stay on each device.',

      themeBg: 'Background — pick a theme, or upload your own image.',
      themeCard: 'Card color — pick one, choose your own, or use a photo.',
      uploadImage: 'Upload image', customColor: 'Custom color', resetAll: 'Reset all',
      imageTooBig: 'That image is too large to save. Try a smaller one.',
      thSlate:'Slate', thNight:'Night', thForest:'Forest', thPlum:'Plum',
      thSand:'Sand', thOcean:'Ocean', thWine:'Wine', thCoal:'Coal',
      thPaper:'Paper', thMist:'Mist', thAuto:'Auto',
      cPaper:'Paper', cSnow:'Snow', cMint:'Mint', cSky:'Sky',
      cRose:'Rose', cLilac:'Lilac', cCharcoal:'Charcoal', cInk:'Ink',

      boxShort: 'box {n}', drawerTitle: 'Show words in box {n}',
      dueToday: '{n} due today',

      toggleAdd: '+ Add / manage words',
      addHelp: 'Paste your list, one per line: word, dash, translation. Numbers are optional.',
      addExample: 'Example — reside — проживать',
      bulkPh: 'reside — проживать\nremote — отдалённый\nisolation — изоляция',
      parseBtn: 'Add to box',
      yourWords: 'Your words ({n})', boxTitle: 'Box {b} ({n})', showAll: 'show all',
      filterPh: 'Filter…',
      noWordsYet: 'No words yet.', noWordsInBox: 'No words in this box yet.',
      noFilterMatch: 'Nothing matches that filter.',
      deleteAllBtn: 'Delete all words',
      confirmDeleteAll: 'Delete all {n}? This clears every box.',
      deletedWord: 'Deleted "{w}"', deletedAll: 'Deleted all {n}', undo: 'Undo',
      parseNoMatch: 'No lines matched. Use: word — translation',
      parseAdded: '{n} added', parseAlready: 'already had: ',
      parseUpdated: 'translation updated: ', parseRepeated: 'repeated in your list: ',
      andMore: '{shown} +{n} more',

      emptyTitle: 'Your box is empty',
      emptyBody: 'Add your own word list below, or start with a ready-made one.',
      emptyBodyOwn: 'Add your own word list below.',
      sampleBtn: 'Try a sample deck (20 words)',
      allDoneTitle: 'All done for now',
      allDoneBody: 'Nothing left due today. Come back tomorrow, or keep going without affecting your boxes.',
      practiceAnyway: 'Practice anyway',
      tapToReveal: 'Tap to reveal', orTapToReveal: 'Or tap the card to reveal',
      typePh: 'Type the answer', check: 'Check',
      correct: 'Correct', notQuite: 'Not quite',
      again: 'Again', good: 'Good', pronounce: 'Pronounce', practiceTab: 'Practice',

      newBadge: 'new', iKnowIt: 'I know it', knownTick: 'Known ✓',
      stillLearning: 'Still learning', learnKnow: 'I know it ✓',
      lsNew: 'new', lsSeen: 'introduced', lsMastered: 'mastered',
      nothingToLearn: 'Nothing to learn yet',
      nothingToLearnBody: 'Add words below, or load the sample deck from Review.',
      nothingToLearnOwn: 'Add words to this deck below.',

      chooseTranslation: 'Choose the correct translation',
      chooseWord: 'Choose the correct word',
      nextQuestion: 'Next question →',

      matchTitle: '60-second challenge',
      matchIntro: 'Match each word to its translation as fast as you can. This is just for speed — it does not change your boxes.',
      start: 'Start', playAgain: 'Play again', matchedLabel: 'matched',
      pairsMatched: '{n} matched',

      modeQuiz: 'Quiz', modeMatch: 'Speed Match',
      needAtLeast: 'Need at least {n}',
      needBody: '{what} needs a few more words to work. You have {n}.',
      addMoreBelow: ' Add more below.',
      addMoreOrSample: ' Add more below, or load the sample deck from Review.'
    }
  },

  ru: {
    name: 'Русский',
    locale: 'ru', sampleDeck: 'ru',
    plurals: {
      word: { one: 'слово', few: 'слова', many: 'слов' },
      card: { one: 'карточка', few: 'карточки', many: 'карточек' },
      pair: { one: 'пара', few: 'пары', many: 'пар' },
      minute: { one: 'минуту', few: 'минуты', many: 'минут' },
      hour: { one: 'час', few: 'часа', many: 'часов' },
      day: { one: 'день', few: 'дня', many: 'дней' }
    },
    t: {
      docTitle: 'Vocab Box — карточки для запоминания слов',
      subtitle: 'Карточки, разложенные по уровню знания',
      about: 'О приложении', statsTitle: 'Статистика', themeTitle: 'Оформление', language: 'Язык',
      lang_en: 'Английский', lang_ru: 'Русский', lang_uz: 'Узбекский',

      landingTagline: 'Учите слова — и правда их запоминайте.',
      landingLede: 'Vocab Box работает по системе Лейтнера: слова, которые вы знаете, возвращаются редко, а забытые — уже завтра. Повторение прямо перед тем, как забыть, и переводит слово в долговременную память.',
      p1t: 'Ваши слова.', p1b: 'Вставьте любой список, любую пару языков. Никакой чужой программы.',
      p2t: 'Четыре режима.', p2b: 'Учить, повторять, тест и игра на скорость за 60 секунд.',
      p3t: 'Бесплатно и приватно.', p3b: 'Без аккаунта и без оплаты. Слова хранятся на вашем устройстве, пока вы не включите синхронизацию.',
      landingSample: 'Начать с 20 готовых слов', landingAdd: 'Добавить свой список',
      landingJoin: 'Уже пользуетесь Vocab Box на другом устройстве? Введите код синхронизации',

      tabLearn: 'Учить', tabReview: 'Повтор', tabQuiz: 'Тест', tabMatch: 'Пары',
      dirNormal: 'Направление: слово → перевод', dirReverse: 'Направление: перевод → слово',
      typingOn: 'Ввод: вкл', typingOff: 'Ввод: выкл',
      viewCards: 'Вид: карточки', viewList: 'Вид: список',

      stStreak: 'дней подряд', stToday: 'повторов сегодня', stWeek: 'за неделю',
      stTotal: 'за всё время', stMastered: 'выучено (ящик 5)', stCards: 'всего карточек',
      stAllDecks: 'Все наборы', stDecks: 'всего наборов',
      deckMenu: 'Сменить набор', decksTitle: 'Наборы', deckDue: 'к повтору: {n}', newDeck: '+ Новый набор',
      deckName: 'Название', deckNamePh: 'Название, например «Немецкий»', deckVoice: 'Язык озвучки',
      createDeck: 'Создать', deckSettings: 'Настройки набора', deleteDeck: 'Удалить набор',
      confirmDeleteDeck: 'Удалить набор «{name}» и {n} в нём?',
      confirmDeleteDeckEmpty: 'Удалить пустой набор «{name}»?',
      deletedDeck: 'Набор {name} удалён', deckLastNote: 'Единственный набор нельзя удалить.',
      deckNameEmpty: 'Введите название набора.', deckNameTaken: 'Набор с таким названием уже есть.',
      decksCombined: 'Два набора «{name}» объединены в один.', deckRecovered: 'Восстановленный набор',
      voiceMissing: 'На этом устройстве нет голоса для языка «{lang}», поэтому в этом наборе кнопки озвучки нет.',
      voiceHowIos: 'Чтобы добавить голос, откройте Настройки → Универсальный доступ → Устный контент → Голоса и перезагрузите эту страницу.',
      voiceHowAndroid: 'Чтобы добавить голос, откройте Настройки, найдите «Синтез речи», откройте настройки движка и установите голосовые данные, затем перезагрузите эту страницу.',
      voiceHowWindows: 'Чтобы добавить голос, откройте Параметры → Время и язык → Речь → Добавить голоса и перезагрузите эту страницу.',
      voiceHowMac: 'Чтобы добавить голос, откройте Системные настройки → Универсальный доступ → Устный контент → Системный голос → Управлять голосами и перезагрузите эту страницу.',
      voiceHowOther: 'Чтобы добавить голос, загляните в системные настройки речи или синтеза речи и перезагрузите эту страницу.',
      noSpeech: 'Этот браузер не умеет читать слова вслух, поэтому кнопки озвучки нет.',
      exportBtn: 'Скачать копию', importBtn: 'Загрузить',
      backupDone: 'Резервная копия скачана.',
      backupBad: 'Не удалось прочитать файл. Это резервная копия Vocab Box?',
      imported: 'добавлено: {added}', importedProgressed: ', обновлено: {n}',

      syncTitle: 'Синхронизация между устройствами',
      syncIntro: 'Одни и те же слова на телефоне и компьютере. Без аккаунта — только код.',
      syncTurnOn: 'Включить синхронизацию', syncHaveCode: 'У меня есть код',
      syncEnterHelp: 'Введите код с другого устройства. Слова на этом устройстве сохранятся и объединятся с синхронизированными.',
      syncConnect: 'Подключить', syncCancel: 'Отмена',
      syncCodeLabel: 'Ваш код синхронизации', syncCopy: 'Копировать', syncCopied: 'Скопировано',
      syncWarning: 'Запишите этот код — только по нему можно добраться до синхронизированных слов. Любой, у кого он есть, может их видеть и менять.',
      syncStop: 'Отключить синхронизацию',
      syncStopConfirm: 'Отключить синхронизацию на этом устройстве? Слова останутся здесь, а синхронизированная копия — в сети для других устройств.',
      syncStatusSyncing: 'Синхронизация…', syncStatusSynced: 'Синхронизировано',
      syncStatusOffline: 'Нет сети — повторим позже', syncStatusError: 'Ошибка синхронизации',
      syncLastSynced: 'последняя синхронизация {when}', justNow: 'только что', timeAgo: '{n} назад',
      syncBadCode: 'Это не похоже на код синхронизации. В нём 10 букв и цифр, например 7KX2M-QP9RT.',
      syncNotFound: 'С этим кодом нет синхронизированных слов. Проверьте код и попробуйте снова.',
      syncUnreachable: 'Не удалось связаться с сервером синхронизации. Проверьте подключение и попробуйте снова.',
      syncRejected: 'Сервер синхронизации не принял эти слова — возможно, превышен лимит размера.',
      syncImportConfirm: 'В этой копии есть код синхронизации {code}. Включить с ним синхронизацию на этом устройстве?',
      joinTitle: 'Подключение к синхронизированным словам', joinSyncedCount: 'Синхронизировано: {n}.',
      joinWordsLegend: 'Слова',
      joinCombine: 'Объединить', joinCombineHint: 'Оставить слова на этом устройстве и добавить синхронизированные.',
      joinReplace: 'Заменить', joinReplaceHint: 'Оставить только синхронизированные слова. С этого устройства будет удалено: {n} — сначала скачается резервная копия.',
      joinReplaceConfirm: 'Удалить с этого устройства {n}? Сначала скачается их резервная копия.',
      joinSettingsLegend: 'Оформление и настройки',
      shareSettings: 'Одинаковые тема и настройки на всех устройствах',
      shareSettingsNote: 'Тема, цвет карточек, язык, направление и ввод. Фоновые изображения и фото на карточках у каждого устройства свои.',

      themeBg: 'Фон — выберите тему или загрузите своё изображение.',
      themeCard: 'Цвет карточки — выберите готовый, свой или фото.',
      uploadImage: 'Загрузить изображение', customColor: 'Свой цвет', resetAll: 'Сбросить всё',
      imageTooBig: 'Изображение слишком большое. Попробуйте поменьше.',
      thSlate:'Графит', thNight:'Ночь', thForest:'Лес', thPlum:'Слива',
      thSand:'Песок', thOcean:'Океан', thWine:'Вино', thCoal:'Уголь',
      thPaper:'Бумага', thMist:'Туман', thAuto:'Авто',
      cPaper:'Бумага', cSnow:'Снег', cMint:'Мята', cSky:'Небо',
      cRose:'Роза', cLilac:'Сирень', cCharcoal:'Графит', cInk:'Чернила',

      boxShort: 'ящик {n}', drawerTitle: 'Показать слова из ящика {n}',
      dueToday: '{n} на сегодня',

      toggleAdd: '+ Добавить / изменить слова',
      addHelp: 'Вставьте список, по одному в строке: слово, тире, перевод. Номера можно оставить.',
      addExample: 'Пример — reside — проживать',
      bulkPh: 'reside — проживать\nremote — отдалённый\nisolation — изоляция',
      parseBtn: 'Добавить в картотеку',
      yourWords: 'Ваши слова ({n})', boxTitle: 'Ящик {b} ({n})', showAll: 'показать все',
      filterPh: 'Фильтр…',
      noWordsYet: 'Слов пока нет.', noWordsInBox: 'В этом ящике пока пусто.',
      noFilterMatch: 'Ничего не найдено.',
      deleteAllBtn: 'Удалить все слова',
      confirmDeleteAll: 'Удалить все {n}? Это очистит все ящики.',
      deletedWord: 'Удалено «{w}»', deletedAll: 'Удалено {n}', undo: 'Вернуть',
      parseNoMatch: 'Ни одна строка не подошла. Формат: слово — перевод',
      parseAdded: 'добавлено: {n}', parseAlready: 'уже было: ',
      parseUpdated: 'перевод обновлён: ', parseRepeated: 'повторяется в списке: ',
      andMore: '{shown} и ещё {n}',

      emptyTitle: 'Картотека пуста',
      emptyBody: 'Добавьте свой список ниже или начните с готового.',
      emptyBodyOwn: 'Добавьте свой список ниже.',
      sampleBtn: 'Пробный набор (20 слов)',
      allDoneTitle: 'На сегодня всё',
      allDoneBody: 'Больше ничего не запланировано. Возвращайтесь завтра или продолжайте — на ящики это не повлияет.',
      practiceAnyway: 'Всё равно позаниматься',
      tapToReveal: 'Нажмите, чтобы открыть', orTapToReveal: 'Или нажмите на карточку',
      typePh: 'Введите ответ', check: 'Проверить',
      correct: 'Верно', notQuite: 'Не совсем',
      again: 'Повторить', good: 'Знаю', pronounce: 'Произнести', practiceTab: 'Тренировка',

      newBadge: 'новое', iKnowIt: 'Знаю', knownTick: 'Знаю ✓',
      stillLearning: 'Ещё учу', learnKnow: 'Знаю ✓',
      lsNew: 'новых', lsSeen: 'начато', lsMastered: 'выучено',
      nothingToLearn: 'Пока нечего учить',
      nothingToLearnBody: 'Добавьте слова ниже или загрузите пробный набор из «Повтора».',
      nothingToLearnOwn: 'Добавьте слова в этот набор ниже.',

      chooseTranslation: 'Выберите правильный перевод',
      chooseWord: 'Выберите правильное слово',
      nextQuestion: 'Дальше →',

      matchTitle: 'Поединок на 60 секунд',
      matchIntro: 'Соедините слова с переводами как можно быстрее. Это только на скорость — на ящики не влияет.',
      start: 'Начать', playAgain: 'Ещё раз', matchedLabel: 'совпало',
      pairsMatched: 'совпало: {n}',

      modeQuiz: 'Тест', modeMatch: 'Игра на скорость',
      needAtLeast: 'Нужно минимум {n}',
      needBody: '{what} заработает, когда слов станет больше. Сейчас: {n}.',
      addMoreBelow: ' Добавьте ещё ниже.',
      addMoreOrSample: ' Добавьте ещё ниже или загрузите пробный набор из «Повтора».'
    }
  },

  uz: {
    name: 'Oʻzbekcha',
    locale: 'uz', sampleDeck: 'uz',
    /* Uzbek does not change the noun for number, so one form covers every
       count; plural() falls back to `other` for any CLDR category. */
    plurals: {
      word: { other: 'ta soʻz' },
      card: { other: 'ta kartochka' },
      pair: { other: 'ta juftlik' },
      minute: { other: 'daqiqa' },
      hour: { other: 'soat' },
      day: { other: 'kun' }
    },
    t: {
      docTitle: 'Vocab Box — intervalli takrorlash kartochkalari',
      subtitle: 'Qanchalik yaxshi bilishingizga qarab saralangan kartochkalar',
      about: 'Ilova haqida', statsTitle: 'Statistika', themeTitle: 'Dizayn', language: 'Til',
      lang_en: 'Ingliz tili', lang_ru: 'Rus tili', lang_uz: 'Oʻzbek tili',

      landingTagline: 'Soʻzlarni oʻrganing va haqiqatan ham yodda saqlang.',
      landingLede: 'Vocab Box Leytner tizimida ishlaydi: siz biladigan soʻzlar kamdan-kam qaytadi, unutganlaringiz esa ertaga qaytadi. Soʻzni unutishingizdan sal oldin takrorlash uni uzoq muddatli xotiraga oʻtkazadi.',
      p1t: 'Oʻz soʻzlaringiz.', p1b: 'Istalgan roʻyxatni, istalgan til juftligini joylashtiring. Birovning dasturi emas.',
      p2t: 'Toʻrt xil mashq.', p2b: 'Oʻrganish, takrorlash, test va 60 soniyalik tezlik oʻyini.',
      p3t: 'Bepul va maxfiy.', p3b: 'Akkaunt ham, toʻlov ham kerak emas. Sinxronlashni yoqmaguningizcha soʻzlaringiz qurilmangizda qoladi.',
      landingSample: '20 ta tayyor soʻz bilan boshlash', landingAdd: 'Oʻz roʻyxatimni qoʻshish',
      landingJoin: 'Boshqa qurilmada Vocab Box ishlatyapsizmi? Sinxronlash kodini kiriting',

      tabLearn: 'Oʻrganish', tabReview: 'Takror', tabQuiz: 'Test', tabMatch: 'Juftlik',
      dirNormal: 'Yoʻnalish: soʻz → tarjima', dirReverse: 'Yoʻnalish: tarjima → soʻz',
      typingOn: 'Yozish: yoniq', typingOff: 'Yozish: oʻchiq',
      viewCards: 'Koʻrinish: kartochka', viewList: 'Koʻrinish: roʻyxat',

      stStreak: 'kun ketma-ket', stToday: 'bugungi takrorlar', stWeek: 'shu hafta',
      stTotal: 'jami', stMastered: 'oʻzlashtirilgan (5-quti)', stCards: 'jami kartochka',
      stAllDecks: 'Barcha toʻplamlar', stDecks: 'jami toʻplam',
      deckMenu: 'Toʻplamni almashtirish', decksTitle: 'Toʻplamlar', deckDue: 'takrorga: {n}', newDeck: '+ Yangi toʻplam',
      deckName: 'Nomi', deckNamePh: 'Toʻplam nomi, masalan: Nemis tili', deckVoice: 'Ovoz tili',
      createDeck: 'Yaratish', deckSettings: 'Toʻplam sozlamalari', deleteDeck: 'Toʻplamni oʻchirish',
      confirmDeleteDeck: '«{name}» toʻplami va undagi {n} oʻchirilsinmi?',
      confirmDeleteDeckEmpty: 'Boʻsh «{name}» toʻplami oʻchirilsinmi?',
      deletedDeck: '{name} toʻplami oʻchirildi', deckLastNote: 'Yagona toʻplamni oʻchirib boʻlmaydi.',
      deckNameEmpty: 'Toʻplamga nom bering.', deckNameTaken: 'Bunday nomli toʻplam allaqachon bor.',
      decksCombined: 'Ikkita «{name}» toʻplami bittaga birlashtirildi.', deckRecovered: 'Tiklangan toʻplam',
      voiceMissing: 'Bu qurilmada «{lang}» tili uchun ovoz yoʻq, shuning uchun bu toʻplamda ovoz tugmasi koʻrsatilmaydi.',
      voiceHowIos: 'Ovoz qoʻshish uchun Settings → Accessibility → Spoken Content → Voices boʻlimiga kiring, soʻng sahifani qayta yuklang.',
      voiceHowAndroid: 'Ovoz qoʻshish uchun Sozlamalarda «Text-to-speech» (nutq sintezi) ni qidiring, dvigatel sozlamalarini oching va ovoz maʼlumotlarini oʻrnating, soʻng sahifani qayta yuklang.',
      voiceHowWindows: 'Ovoz qoʻshish uchun Settings → Time & language → Speech → Add voices boʻlimiga kiring, soʻng sahifani qayta yuklang.',
      voiceHowMac: 'Ovoz qoʻshish uchun System Settings → Accessibility → Spoken Content → System voice → Manage Voices boʻlimiga kiring, soʻng sahifani qayta yuklang.',
      voiceHowOther: 'Ovoz qoʻshish uchun tizimning nutq yoki nutq sintezi sozlamalariga qarang, soʻng sahifani qayta yuklang.',
      noSpeech: 'Bu brauzer soʻzlarni ovoz chiqarib oʻqiy olmaydi, shuning uchun ovoz tugmasi koʻrsatilmaydi.',
      exportBtn: 'Zaxira nusxa', importBtn: 'Yuklash',
      backupDone: 'Zaxira nusxa yuklab olindi.',
      backupBad: 'Faylni oʻqib boʻlmadi. Bu Vocab Box zaxira nusxasimi?',
      imported: '{added} qoʻshildi', importedProgressed: ', {n} yangilandi',

      syncTitle: 'Qurilmalar oʻrtasida sinxronlash',
      syncIntro: 'Telefon va kompyuterda bir xil soʻzlar. Akkaunt kerak emas — faqat kod.',
      syncTurnOn: 'Sinxronlashni yoqish', syncHaveCode: 'Menda kod bor',
      syncEnterHelp: 'Boshqa qurilmangizdagi kodni kiriting. Bu yerdagi soʻzlar saqlanadi va sinxronlangan soʻzlar bilan birlashtiriladi.',
      syncConnect: 'Ulash', syncCancel: 'Bekor qilish',
      syncCodeLabel: 'Sinxronlash kodingiz', syncCopy: 'Nusxalash', syncCopied: 'Nusxalandi',
      syncWarning: 'Bu kodni yozib qoʻying — sinxronlangan soʻzlaringizga faqat u orqali kirish mumkin. Kodni bilgan har kim soʻzlaringizni koʻrishi va oʻzgartirishi mumkin.',
      syncStop: 'Sinxronlashni oʻchirish',
      syncStopConfirm: 'Bu qurilmada sinxronlash oʻchirilsinmi? Soʻzlaringiz shu yerda qoladi, sinxronlangan nusxa esa boshqa qurilmalaringiz uchun saqlanib qoladi.',
      syncStatusSyncing: 'Sinxronlanmoqda…', syncStatusSynced: 'Sinxronlandi',
      syncStatusOffline: 'Internet yoʻq — keyinroq qayta urinamiz', syncStatusError: 'Sinxronlashda xato',
      syncLastSynced: 'oxirgi sinxronlash {when}', justNow: 'hozirgina', timeAgo: '{n} oldin',
      syncBadCode: 'Bu sinxronlash kodiga oʻxshamaydi. Unda 10 ta harf va raqam bor, masalan 7KX2M-QP9RT.',
      syncNotFound: 'Bu kod bilan sinxronlangan soʻzlar topilmadi. Kodni tekshirib, qaytadan urinib koʻring.',
      syncUnreachable: 'Sinxronlash serveriga ulanib boʻlmadi. Internetni tekshirib, qaytadan urinib koʻring.',
      syncRejected: 'Sinxronlash serveri bu soʻzlarni qabul qilmadi — hajm chegarasidan oshgan boʻlishi mumkin.',
      syncImportConfirm: 'Bu zaxira nusxada {code} sinxronlash kodi bor. Shu qurilmada u bilan sinxronlash yoqilsinmi?',
      joinTitle: 'Sinxronlangan soʻzlarga ulanish', joinSyncedCount: '{n} sinxronlangan.',
      joinWordsLegend: 'Soʻzlar',
      joinCombine: 'Birlashtirish', joinCombineHint: 'Bu qurilmadagi soʻzlarni saqlab, sinxronlanganlarini qoʻshish.',
      joinReplace: 'Almashtirish', joinReplaceHint: 'Faqat sinxronlangan soʻzlar qoladi. Bu qurilmadan {n} oʻchiriladi — avval zaxira fayl yuklab olinadi.',
      joinReplaceConfirm: 'Bu qurilmadan {n} oʻchirilsinmi? Avval ularning zaxira fayli yuklab olinadi.',
      joinSettingsLegend: 'Dizayn va sozlamalar',
      shareSettings: 'Barcha qurilmalarda bir xil mavzu va sozlamalar',
      shareSettingsNote: 'Mavzu, kartochka rangi, til, yoʻnalish va yozish. Fon rasmlari va kartochkadagi rasmlar har bir qurilmada alohida qoladi.',

      themeBg: 'Fon — mavzu tanlang yoki oʻz rasmingizni yuklang.',
      themeCard: 'Kartochka rangi — tayyorini tanlang, oʻzingiznikini kiriting yoki rasm qoʻying.',
      uploadImage: 'Rasm yuklash', customColor: 'Oʻz rangim', resetAll: 'Hammasini tiklash',
      imageTooBig: 'Rasm juda katta. Kichikrogʻini tanlang.',
      thSlate:'Grafit', thNight:'Tun', thForest:'Oʻrmon', thPlum:'Olxoʻri',
      thSand:'Qum', thOcean:'Okean', thWine:'Vino', thCoal:'Koʻmir',
      thPaper:'Qogʻoz', thMist:'Tuman', thAuto:'Avto',
      cPaper:'Qogʻoz', cSnow:'Qor', cMint:'Yalpiz', cSky:'Osmon',
      cRose:'Atirgul', cLilac:'Siren', cCharcoal:'Grafit', cInk:'Siyoh',

      boxShort: '{n}-quti', drawerTitle: '{n}-qutidagi soʻzlarni koʻrsatish',
      dueToday: 'bugunga {n}',

      toggleAdd: '+ Soʻz qoʻshish / boshqarish',
      addHelp: 'Roʻyxatni joylashtiring, har satrda bittadan: soʻz, tire, tarjima. Raqamlar shart emas.',
      addExample: 'Masalan — reside — yashamoq',
      bulkPh: 'reside — yashamoq\nremote — uzoq\nisolation — yakkalanish',
      parseBtn: 'Qutiga qoʻshish',
      yourWords: 'Sizning soʻzlaringiz ({n})', boxTitle: '{b}-quti ({n})', showAll: 'hammasini koʻrsatish',
      filterPh: 'Filtr…',
      noWordsYet: 'Hozircha soʻz yoʻq.', noWordsInBox: 'Bu qutida hozircha soʻz yoʻq.',
      noFilterMatch: 'Filtrga mos keladigani yoʻq.',
      deleteAllBtn: 'Barcha soʻzlarni oʻchirish',
      confirmDeleteAll: '{n} oʻchirilsinmi? Bu barcha qutilarni tozalaydi.',
      deletedWord: '«{w}» oʻchirildi', deletedAll: '{n} oʻchirildi', undo: 'Qaytarish',
      parseNoMatch: 'Hech qaysi satr mos kelmadi. Format: soʻz — tarjima',
      parseAdded: '{n} qoʻshildi', parseAlready: 'allaqachon bor edi: ',
      parseUpdated: 'tarjima yangilandi: ', parseRepeated: 'roʻyxatda takrorlangan: ',
      andMore: '{shown} va yana {n}',

      emptyTitle: 'Quti boʻsh',
      emptyBody: 'Quyida oʻz roʻyxatingizni qoʻshing yoki tayyorisidan boshlang.',
      emptyBodyOwn: 'Quyida oʻz roʻyxatingizni qoʻshing.',
      sampleBtn: 'Sinov toʻplami (20 ta soʻz)',
      allDoneTitle: 'Bugunga tamom',
      allDoneBody: 'Bugunga boshqa hech nima qolmadi. Ertaga qayting yoki davom eting — bu qutilarga taʼsir qilmaydi.',
      practiceAnyway: 'Baribir mashq qilish',
      tapToReveal: 'Ochish uchun bosing', orTapToReveal: 'Yoki kartochkani bosing',
      typePh: 'Javobni yozing', check: 'Tekshirish',
      correct: 'Toʻgʻri', notQuite: 'Unchalik emas',
      again: 'Takrorlash', good: 'Bilaman', pronounce: 'Talaffuz qilish', practiceTab: 'Mashq',

      newBadge: 'yangi', iKnowIt: 'Bilaman', knownTick: 'Bilaman ✓',
      stillLearning: 'Hali oʻrganyapman', learnKnow: 'Bilaman ✓',
      lsNew: 'yangi', lsSeen: 'boshlangan', lsMastered: 'oʻzlashtirilgan',
      nothingToLearn: 'Hozircha oʻrganadigan narsa yoʻq',
      nothingToLearnBody: 'Quyida soʻz qoʻshing yoki «Takror»dan sinov toʻplamini yuklang.',
      nothingToLearnOwn: 'Quyida bu toʻplamga soʻz qoʻshing.',

      chooseTranslation: 'Toʻgʻri tarjimani tanlang',
      chooseWord: 'Toʻgʻri soʻzni tanlang',
      nextQuestion: 'Keyingisi →',

      matchTitle: '60 soniyalik oʻyin',
      matchIntro: 'Soʻzlarni tarjimasi bilan imkon qadar tez juftlang. Bu faqat tezlik uchun — qutilarga taʼsir qilmaydi.',
      start: 'Boshlash', playAgain: 'Yana oʻynash', matchedLabel: 'topildi',
      pairsMatched: '{n} topildi',

      modeQuiz: 'Test', modeMatch: 'Tezlik oʻyini',
      needAtLeast: 'Kamida {n} kerak',
      needBody: '{what} ishlashi uchun soʻz kamlik qilyapti. Hozir: {n}.',
      addMoreBelow: ' Quyida yana qoʻshing.',
      addMoreOrSample: ' Quyida yana qoʻshing yoki «Takror»dan sinov toʻplamini yuklang.'
    }
  }
};

let lang = 'en';
let pluralRules = null;

function detectLang(){
  const nav = (navigator.language || 'en').toLowerCase();
  if(nav.indexOf('ru') === 0) return 'ru';
  if(nav.indexOf('uz') === 0) return 'uz';
  return 'en';
}

function fill(str, vars){
  if(!vars) return str;
  return str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

function t(key, vars){
  const dict = I18N[lang] || I18N.en;
  const s = (key in dict.t) ? dict.t[key] : I18N.en.t[key];
  return fill(s === undefined ? key : s, vars);
}

/* Picks the CLDR plural form for n in the active locale. Languages with one
   form only supply `other`, so the fallback chain returns it for every count. */
function plural(key, n){
  const dict = I18N[lang] || I18N.en;
  const forms = dict.plurals[key] || {};
  const cat = pluralRules.select(n);
  return forms[cat] || forms.other || forms.many || forms.one || '';
}

/* "5 слов" / "5 ta so'z" / "5 words" — never build these by concatenation. */
function count(key, n){
  return n + ' ' + plural(key, n);
}

// BCP 47 tag for lang attributes; Uzbek is written in Latin script here.
function langTag(code){
  return code === 'uz' ? 'uz-Latn' : code;
}

function setLang(code, save){
  if(!I18N[code]) code = 'en';
  lang = code;
  pluralRules = new Intl.PluralRules(I18N[code].locale);
  document.documentElement.lang = langTag(code);
  renderLangOptions();
  if(save){
    settings.lang = code;
    saveSettings();
  }
  applyStaticI18n();
}

/* Static markup carries its key in data-i18n (plus -title/-aria/-ph variants),
   so the HTML stays readable and no node is missed on a language change. */
function applyStaticI18n(){
  document.title = t('docTitle');
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el=>{
    el.title = t(el.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>{
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{
    el.placeholder = t(el.dataset.i18nPh);
  });
}

/* Re-render everything language-dependent, keeping all session state:
   renderCard dispatches to the active mode, so a Learn position, an
   in-progress quiz and a running match all survive the switch. */
function relocalize(){
  renderSwatches();
  renderCardSwatches();
  // The swatches were rebuilt, so mark the current ones again.
  applyTheme();
  applyCardColor();
  renderChips();
  renderStats();
  renderStatsPanel();
  renderWordList();
  renderDeckPanel();
  renderSyncPanel();
  renderCard(false);
}
