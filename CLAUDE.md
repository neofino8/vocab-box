# Vocab Box: working rules

A Leitner flashcard app with no build step and no dependencies, hosted on GitHub Pages. `index.html` holds the markup, `styles.css` the styles, and `js/` the scripts. The scripts are plain `<script src>` tags (not ES modules) that share globals and load in a fixed order: core, i18n, storage, decks, stats, theme, speech, words, study, ui, sync, main. A script may only call functions from later files inside functions that run after load, never at its own top level.

## Rules

- **Run `scripts/stamp.sh` after changing any CSS or JS file**, and commit the updated `index.html` with it. Each link carries a `?v=` stamp from the file's contents, so phones and home-screen apps never pair a new `index.html` with a stale cached file. The "Check cache stamps" GitHub Action fails any push with a stale stamp.
- **Run `tests/merge-tests.html` before committing anything that touches sync, storage or decks** (`js/sync.js`, `js/storage.js`, `js/decks.js`, or anything the merge uses). Serve the repo over http (`python3 -m http.server` in the repo root), open `/tests/merge-tests.html`, press Run tests, and commit only if all pass.
- **Commit directly to `main`.**
- **Never commit screenshots or test artifacts.** Keep them outside the repo.
- **New UI strings need English, Russian and Uzbek.** Add each key to all three entries of `I18N` in `js/i18n.js`. Uzbek is written in Latin script.
- **Check contrast in all themes and layout at 375px.** That means the 10 themes in `THEMES` (`js/core.js`) plus Auto in light and dark. Text needs 4.5:1 against the surface it sits on. At 375px, check all three languages, since Russian and Uzbek labels run longer than English.
