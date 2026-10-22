[README.md](https://github.com/user-attachments/files/30617276/README.md)
# Vocab Box

A free spaced-repetition flashcard app for learning vocabulary. Built on the Leitner box system — the original spaced-repetition method, where cards move between five boxes depending on how well you know them.

**→ [Open Vocab Box](https://neofino8.github.io/vocab-box/)**

No signup, no install, no cost. Works on phone and desktop.

## How it works

Every word lives in one of five boxes, and the box decides how often you see it:

| Box | Reviewed every |
|-----|----------------|
| 1 | 1 day |
| 2 | 2 days |
| 3 | 4 days |
| 4 | 7 days |
| 5 | 14 days |

Answer **Good** and the word moves up a box, so you see it less often. Answer **Again** and it drops back to box 1. Words you find easy stop taking up your time; words you keep forgetting keep coming back. Reviewing something just before you'd forget it is what moves it into long-term memory.

## Features

**Studying**
- Five-box Leitner spaced repetition
- Pronunciation audio in each deck's own language, using a voice installed on your device; if a deck's language has none, the deck's settings say how to add one
- Reverse direction — practice word → translation, or translation → word
- Typing mode — type the answer instead of flipping, with spelling check
- Practice mode — keep reviewing when nothing is due, without affecting your boxes

**Decks**
- Separate decks for each thing you're learning — say IELTS, Chinese, Arabic and German — each with its own boxes, due words and stats
- Every study mode works on the current deck, so quiz options and match pairs are always in the same language
- Create, rename and delete decks (with undo); the last deck you used is remembered on each device

**Managing words**
- Bulk import: paste a list, one per line, as `word — translation` (numbering optional)
- Full word list with search, delete, and delete-all — all with undo
- Move any word between boxes manually
- Tap any box to see exactly which words are in it
- Sample deck to try the app instantly

**Progress**
- Day streak, reviews today / this week / all time, and mastered-word count
- Export your deck and progress to a file, import it back on another device, or share decks with friends

**Sync**
- Optional sync between your phone and computer with a sync code — no account
- Changes merge card by card, so studying on two devices doesn't overwrite either
- Decks sync too, and renames sync as renames; if two devices each made a deck with the same name before syncing, the two are combined into one
- When a device joins, choose to combine its words with the synced deck or replace them (a backup file is downloaded first), and whether to use the same theme and settings everywhere

**Appearance**
- Ten color themes (eight dark, two light), plus Auto, which follows your device's light or dark setting
- Custom background image, custom card color, or a photo on the cards

## Privacy

Your words are stored in your own browser and stay on your device unless you turn on sync. There is no account to create.

**If you turn on sync**, your decks — their names and voice languages, and their words, translations, box progress and review counts — are stored in a [Supabase](https://supabase.com) database so your other devices can reach it. It is filed under a SHA-256 hash of your sync code; the code itself is never stored, and no account or personal details are attached. Anyone who has your code can read and change your synced decks, so keep it to yourself. If the device also shares appearance and settings (on by default), your theme, card color, interface language, direction and typing mode are synced too. Background images and card photos always stay on the device. Stopping sync keeps your words on that device, and the synced copy stays online for your other devices.

The site uses [GoatCounter](https://www.goatcounter.com) for anonymous visit counts, which sets no cookies and collects no personal data.

## Running it yourself

The app is `index.html`, [`styles.css`](styles.css) and the scripts in [`js/`](js/), loaded in a fixed order by plain `<script>` tags — no build step, no dependencies. Fork this repo and enable GitHub Pages to host your own copy. To run it locally, serve the repo folder over http, for example with `python3 -m http.server` in the repo root, and open `http://localhost:8000`; opening `index.html` straight from disk works too, but [`tests/merge-tests.html`](tests/merge-tests.html) needs http.

Every stylesheet and script link in `index.html` carries a stamp, such as `js/sync.js?v=9d4135d2`, taken from the file's contents, so a phone never pairs a new page with a stale cached file. After changing any CSS or JS file, run [`scripts/stamp.sh`](scripts/stamp.sh) to update the stamps; a GitHub Action runs `scripts/stamp.sh --check` on every push and fails if one is out of date.

Sync talks to this project's Supabase backend. To run your own, create a Supabase project, run [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor (and optionally [`supabase/verify.sql`](supabase/verify.sql) to check it), then set `SUPABASE_URL` and `SUPABASE_KEY` in [`js/sync.js`](js/sync.js) to your project's URL and publishable key, and run `scripts/stamp.sh`. [`.github/workflows/supabase-keepalive.yml`](.github/workflows/supabase-keepalive.yml) calls the API every 6 hours so a free project isn't paused for inactivity.

## Feedback

Found a bug or want a feature? Open an [issue](https://github.com/neofino8/vocab-box/issues) — feedback from people actually studying with it is what shapes what gets built next.

## License

MIT — free to use, modify, and share.
