# Vocab Box

A spaced-repetition flashcard app for IELTS vocabulary, built on the Leitner box system — the original spaced-repetition method, where cards move between five boxes based on how well you know them.

**Live demo:** _add your GitHub Pages link here once deployed_

## Features

- Five-box Leitner system: words you know move up a box and get reviewed less often; words you miss reset to box 1
- Bulk import — paste a numbered vocabulary list (`1. word — translation`) and it's parsed automatically
- Progress tracker showing how many words sit in each box
- Works fully offline, no account or backend — all progress is saved in your browser
- No dependencies, single HTML file

## Running locally

Just open `index.html` in any browser. No build step, no install.

## Deploying with GitHub Pages

1. Create a new repository on GitHub (e.g. `vocab-box`) and push these files to it.
2. Go to the repo's **Settings → Pages**.
3. Under "Build and deployment", set **Source** to "Deploy from a branch".
4. Choose the `main` branch and `/ (root)` folder, then save.
5. GitHub will give you a live URL, usually `https://<your-username>.github.io/vocab-box/`, within a minute or two.
6. Share that link — anyone who opens it gets their own private, local copy of Vocab Box. Progress is stored per-browser (`localStorage`), so it's not shared between people or devices.

## How review works

- Add words in bulk using the `+ Add words` panel.
- Tap a card to reveal the translation.
- Mark **Again** if you didn't know it — it resets to box 1 and comes back later in the same session.
- Mark **Good** if you knew it — it moves up a box and won't reappear until that box's interval passes (1, 2, 4, 7, or 14 days).

## Roadmap ideas

- Export/import vocabulary as JSON or CSV
- Multiple decks (e.g. separate IELTS Reading vs Writing vocab)
- Dark/light theme toggle
- Audio pronunciation per word

## License

MIT — free to use, modify, and share.
