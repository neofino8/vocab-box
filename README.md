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
- Pronunciation audio with a choice of American or British accent
- Reverse direction — practice word → translation, or translation → word
- Typing mode — type the answer instead of flipping, with spelling check
- Practice mode — keep reviewing when nothing is due, without affecting your boxes

**Managing words**
- Bulk import: paste a list, one per line, as `word — translation` (numbering optional)
- Full word list with search, delete, and delete-all — all with undo
- Move any word between boxes manually
- Tap any box to see exactly which words are in it
- Sample deck to try the app instantly

**Progress**
- Day streak, reviews today / this week / all time, and mastered-word count
- Export your deck and progress to a file, import it back on another device, or share decks with friends

**Appearance**
- Eight color themes
- Custom background image, custom card color, or a photo on the cards

## Privacy

Everything is stored in your own browser — your words never leave your device, and there is no account to create. The site uses [GoatCounter](https://www.goatcounter.com) for anonymous visit counts, which sets no cookies and collects no personal data.

## Running it yourself

`index.html` is the entire app — no build step, no dependencies. Download it and open it in any browser, or fork this repo and enable GitHub Pages to host your own copy.

## Feedback

Found a bug or want a feature? Open an [issue](https://github.com/neofino8/vocab-box/issues) — feedback from people actually studying with it is what shapes what gets built next.

## License

MIT — free to use, modify, and share.
