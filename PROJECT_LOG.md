# Vocab Box project log

A dated history of how Vocab Box was built, reconstructed from the git log, the README and the code. Dates are commit dates. Where a commit message gives a reason or a bug, it is reported here; where the history is silent (several early commits have one-line messages), this log says only what the diff shows.

---

## 2026-07-09 to 2026-08-01: The first app, GitHub Pages and GoatCounter

**What was built**

- **2026-07-09:** First upload: `index.html` (420 lines), a README and an MIT licence. The app was a five-box Leitner flashcard deck for IELTS vocabulary. Cards move up a box on Good and back to box 1 on Again, with review intervals of 1, 2, 4, 7 and 14 days. Words were added by pasting a numbered list (`1. word — translation`), and progress was saved in the browser's `localStorage`.
- **2026-07-12 (v1.5):** Themes, card colours, pronunciation through the browser's speech synthesis, stats, typing mode and practice mode, plus export.
- **2026-07-12:** The GoatCounter script was added to the page (a 3-line change titled "Big update").
- **2026-07-15 (v1.8 to v1.9):** Word management was reworked with undo, and a "Delete all words" button with a confirmation step was added.
- **2026-08-01:** The README gained the live link, `https://neofino8.github.io/vocab-box/`.

**Key decisions**

- **A single file with no dependencies and no build step.** The first README called it out ("No dependencies, single HTML file"), and it still holds: `index.html` is the whole app.
- **No account and no backend.** Progress stays in each browser. The README explained that this means progress is per browser, not shared between people or devices.
- **Hosting on GitHub Pages.** The first README carried step-by-step Pages instructions before the live link existed.
- **GoatCounter for analytics.** The README describes it as anonymous visit counts with no cookies and no personal data.
- **The first README listed four roadmap ideas.** Export/import, multiple decks, a dark/light theme toggle and audio pronunciation all shipped later.

---

## 2026-08-10 to 2026-09-05: Study modes, duplicate detection, the landing page and icons

**What was built**

- **2026-08-10 (v2.0 to v2.1):** Duplicate detection in bulk import. `parseBulk` now reports four separate outcomes: words already in the box with the same translation, words whose translation was updated, words repeated inside the pasted text, and lines it could not parse.
- **2026-08-24 (v2.3):** Mode tabs for **Learn, Review, Quiz and Match**.
- **2026-08-24:** A landing screen for first-time visitors explains the Leitner system and offers two ways in: load a 20-word sample deck straight into Learn, or open the add-words panel. An About link brings it back.
- **2026-08-29 to 08-30:** A favicon and apple-touch-icon: a cream index card with a gold tab on a dark rounded square. A `theme-color` meta tag was added too.
- **2026-08-30:** The word-list filter ranks matches instead of plain substring matching.
- **2026-08-31:** A list view for Learn mode, with one "I know it" action per row.
- **2026-09-01:** A staggered entrance animation.
- **2026-09-05:** iOS standalone (home-screen) mode with safe-area padding.

**Key decisions**

- **The landing page was built mobile-first** "since most visitors arrive from a link on their phone". It uses the existing CSS variables so it follows theme changes.
- **The icons started as inline data URIs** to keep the app a single file. They were then shipped as real PNG files, because Safari ignores data URIs for the apple-touch-icon and Favorites tiles fell back to a placeholder. The touch icon is full bleed with square corners because iOS applies its own rounded mask.
- **Filter ranking uses tiers:** words starting with the query, then words containing it, then translations whose words start with it, then translations containing it. Newest-first order is kept within each tier.
- **The entrance animation sits entirely inside `prefers-reduced-motion: no-preference`** and only supplies a start state, so content still renders if the animation never runs.
- **`.gitignore` uses `Icon?` for the macOS folder-icon file.** The file's real name ends in a carriage return, which git strips from `.gitignore` lines.

**Bugs found and fixed**

- A one-letter filter like "t" returned almost every word ("merit, ubiquity and contribute").
- The filter heading showed the whole deck size while filtering.
- Stored words with leading whitespace failed the prefix test, so "draw a parallel between" ranked below "fraudulent". Words and translations are now trimmed on load, written back only when something changed.
- Translations split only on commas, so "пик;вершина" and "пик/вершина" stayed single tokens. Semicolons and slashes were added.
- In the Learn list, re-marking an already known word knocked it back to box 3. The button is now disabled for introduced words.

---

## 2026-09-11: English, Russian and Uzbek interface

**What was built**

- Every interface string moved into an `I18N` object, with English, Russian and Uzbek entries. Static markup is translated through `data-i18n` attributes and dynamic text through `t()`.
- Counted nouns use `Intl.PluralRules`, so Russian gets its plural forms and Uzbek supplies only `other`.
- The language is detected from `navigator.language` on the first visit. A choice made in the header is saved and wins from then on.
- The sample deck follows the interface language: English→Russian for English and Russian, English→Uzbek for Uzbek.
- The language switcher went through three designs in one day: a `<select>`, then a globe button with a panel, then the EN / RU / UZ segmented pill it has now, with a sliding active fill.
- Each theme got its own muted text colour.

**Key decisions**

- **Card words and translations are user data** and are never translated.
- **Switching language re-renders through `renderCard`**, so a Learn position, an open quiz question and a running match all survive.
- **The pill's codes are not descriptive on their own**, so each segment's `aria-label` and title name the language in the current interface language.
- **At 375px the header row cannot fit the title, the pill, both icon buttons and the About label** (Russian "приложении" alone is wider than the space left). Up to 460px, About moves onto its own line.
- **The sliding fill ignores pointer events and is re-placed by a `ResizeObserver`.** It animates only inside `prefers-reduced-motion: no-preference`.

**Bugs found and fixed**

- The Uzbek interface seeded the sample deck with Russian translations.
- The single global muted text colour fell below WCAG AA on two themes: Sand at 2.77:1 and Ocean at 4.28:1. Both were lightened to clear 4.5:1 (4.64 and 4.61), and the other six themes were left unchanged.

---

## 2026-10-11: Cross-device sync with sync codes and Supabase

**What was built**

- **A Supabase schema** (`supabase/schema.sql`) with one `decks` table keyed by the SHA-256 of a sync code. The code itself is never stored.
- **Two functions are the only way in.** RLS is on with no policies and every direct grant is revoked, so all access goes through two `SECURITY DEFINER` functions:
  - `get_deck(code)` returns the deck and its version, or `empty` for an unused code.
  - `put_deck(code, deck, expected_version)` writes only if the version is still current.
- **`supabase/verify.sql`** calls the functions as the anonymous role, asserts each guarantee, and removes its test row.
- **Merge testing:** the maintainer reports that the merge was tested during development with in-page scenario tests and a fuzzer. Those tests were not committed at the time. They were recreated and committed on 2026-10-21 (see the last milestone).
- **Optional sync in the app**, off by default, with sync codes instead of accounts.
- **Joining from the landing page** for someone who already uses the app on another device.
- **A join dialog** that asks whether to combine this device's words with the synced deck or replace them, and whether to share appearance and settings.
- **A keepalive GitHub Actions workflow** to stop the free Supabase project pausing (see the next milestone).

**Key decisions**

- **`localStorage` stays the source of truth.** Sync only ever merges into local data, so a failed request leaves the app working as before. The client uses plain `fetch` and the publishable key, so the app still has no dependencies.
- **Version conflicts:** on a stale version, `put_deck` writes nothing and returns the current deck, so the client can merge and retry in one round trip. The row is locked during the check, so simultaneous writers are serialised.
- **Merge rules:**
  - Merging is per card, keyed on the trimmed, lowercased word. Each card carries a `changedAt` time and the newest edit wins, so a deliberate demotion survives a higher box elsewhere.
  - Cards from before sync, and newly added cards, get `changedAt` 0. They can never override progress made elsewhere, for example when a new phone loads the sample deck and then joins.
  - Ties fall back to the higher box, then the larger translation, then the whole card compared by code unit. That makes the merge a strict total order, so every device converges on the same deck.
- **Tombstones:** a deletion becomes a tombstone, pruned after 60 days, so deletions spread instead of the word being brought back. Re-adding a deleted word, or undoing a deletion, counts as a fresh edit and wins.
- **Review counts are kept per device id**, so totals add up across devices without counting anything twice.
- **Codes are normalised on the server.** Case, dashes and spaces are ignored, and I and L read as 1, O as 0.
- **Size limits:** a deck must be under 500 kB, with at most 10,000 cards and 10,000 tombstones.
- **When sync runs:** on load, 3 seconds after a change, when the page is hidden, when returning after a while, and when the browser comes back online. Network failures back off from 5 seconds up to 2 minutes.
- **Replace downloads a backup file first.** It shows how many words would be lost, asks a second time, and only then discards anything.
- **Shared settings are one unit with its own edit time**, where the newest edit wins. Background images and card photos never sync. Devices that were already syncing start with sharing off, "so an update changes nobody's look".

---

## 2026-10-19 to 2026-10-21: The Supabase project pauses, and the keepalive fix

**What happened**

- The keepalive workflow added on 2026-10-11 pinged Supabase every three days.
- On **2026-10-19** the project was paused for inactivity, even though the workflow had succeeded on the 13th and 16th. The README states the cause: Supabase counts a free project as active based on a few database requests a day.
- The same day, the workflow run failed with curl exit 6 ("couldn't resolve host"), when GitHub moved `ubuntu-latest` to Ubuntu 26.

**Fixes (2026-10-20, README updated 2026-10-21)**

- The runner is pinned to `ubuntu-24.04`.
- curl now uses `--retry 5 --retry-all-errors`. Plain `--retry` does not cover DNS failures, so the earlier `--retry 3` never kicked in. `-f` is kept so a real API error still fails the run.
- The ping now runs every 6 hours (`17 */6 * * *`, off the hour to avoid GitHub's top-of-hour scheduler load). It calls `get_deck`, a real database query, not just an HTTP request.

---

## 2026-10-21: Multiple decks, per-deck voices, Chinese and Arabic, and the format guard

**What was built**

- **Every card, tombstone and review count carries a deck id.** Every study mode, the box drawers, the due count, the word list and the stats work on the current deck.
- **A deck switcher** to create, rename and delete decks (with undo) and set each deck's voice language. The last deck can't be deleted.
- **Deck sync**, with names, voice languages, edit times and deck tombstones.
- **Per-deck pronunciation.** The app picks an installed voice with the same language and region, falls back to the same language from another region, and never uses a Cantonese voice for Mandarin. If the device has no voice for the language, the speaker is hidden and the deck settings explain how to add one.
- **Chinese and Arabic support:**
  - Font stacks with system fallbacks for both scripts.
  - `lang` on words, which also picks Chinese rather than Japanese glyph forms.
  - `dir="auto"` so Arabic reads right to left, and bidi isolation for words placed inside messages.
  - The parser accepts full-width and Chinese dashes and Chinese and Arabic-Indic numbering.
  - Answers and the filter split on Chinese and Arabic commas and semicolons.
  - In typing mode, Enter waits while an input method is still composing.

**Key decisions**

- **Existing words migrate into a default deck named IELTS with a fixed id**, so every device migrates into the same deck and syncing never turns one IELTS deck into two. Words are compared in Unicode NFC.
- **The work shipped in steps** whose commit messages say which are safe on their own. The deck-id migration "is safe to ship alone". The switcher is "not safe to ship on its own" because decks did not sync until the next commit.
- **Deck merge rules:**
  - A deck deleted on one device comes back if one of its cards was edited, or words were added to it, after the deletion. Otherwise its cards go with it, including ones the deleting device never saw.
  - Two same-named decks made on two devices before they synced are combined into the lower id, so the default deck keeps its id. The other id becomes a permanent alias that moves cards still arriving for it.
  - A card's identity is deck plus word, so the same word can be in two decks.
- **The format guard:** synced data became format 2. `put_deck` refuses older-format writes over format 2 data, so a page from before decks gets a sync error instead of folding every deck into one. The size cap rose to 1.5 MB.
- **Voice moved from a global American/British chip to each deck**, and so it left the shared settings.

---

## 2026-10-21: Light themes, Auto, and the contrast audit

**What was built**

- A layout fix: the stats and theme panels had no bottom margin and sat flush on the box drawers. Every panel now has a 12px bottom margin. The stale "v2.3" label was removed from the subtitle; the version had not changed since 2026-08-24.
- Two light themes: **Paper**, a warm off-white, and **Mist**, a cool light grey.
- **Auto**, which follows the device's light/dark setting (Slate when dark, Paper when light), switches live when the system changes, and syncs like any other theme.

**Key decisions**

- **The light themes flip the colours that were built for dark backgrounds.** UI text and borders turn dark, the translucent black wells inside panels turn faint, and buttons filled with the accent colour use white text.
- **Cards, quiz options and match tiles get an edge** (a thin outline and soft shadow) in light themes, because a cream card on a pale page has no edge of its own.
- **With a background image, light themes use a light wash** over the image instead of the dark one.
- **Every visible text element was checked against WCAG AA (4.5:1) in both light themes**, the same standard the dark themes' muted text was held to in September.

**Bugs found and fixed**

- The teal and brick rating buttons ("I know it ✓" and "Still learning") fell just short of 4.5:1 in every theme, so both colours were darkened slightly.
- After a language switch or a synced settings change, the theme and card-colour swatches lost their highlight. This predated the light themes and was fixed alongside them.
- "Delete all words" was 3.14:1 in the dark Sand theme. The red is now a per-theme colour: lighter for Sand (5.75:1), brick for the light themes, unchanged elsewhere.
- The red hover tint on that button lightened the background and dropped Ocean to 4.2:1, so hover now strengthens the border instead.

---

## 2026-10-21: The merge tests, recreated and committed

**What was built**

`tests/merge-tests.html` is a test page for the sync merge that runs in a browser with one click and shows pass or fail for each test. It recreates tests that, according to the maintainer, were run in earlier sessions but never committed.

- **Seven scenario tests**, each merging both ways round and requiring the two results to match:
  - a demotion survives a higher box elsewhere;
  - a deletion spreads instead of coming back;
  - a deck deletion spreads, taking its cards, including ones the deleting device never saw;
  - a rename syncs as a rename;
  - same-name decks are combined into one;
  - a deleted deck comes back if words were added or edited after the deletion;
  - old-format data merges into the default deck.
- **A fuzzer** that plays random edit histories on three devices and syncs them through a server that takes one write at a time. The edits follow the app's own actions: add, rate, move, delete and undo words, and create, rename, revoice and delete decks. It checks:
  - **Commutativity:** `merge(x, y)` equals `merge(y, x)`.
  - **Idempotency:** merging data with itself changes nothing.
  - **Absorption:** merging in data already merged changes nothing.
  - **Invariants:** no card in an inactive deck, no word twice in a deck, no two active decks with the same name, and every alias points at a lower id.
  - **Convergence:** once the edits stop, two sync rounds leave all three devices holding exactly what the server holds.

**Key decisions**

- **The page tests the real code.** It fetches `../index.html` and lifts the merge functions and the constants they use out of it by name. A function that is renamed or missing fails the run instead of being stubbed.
- **The app never starts on the test page.** Only the pure merge functions run, so opening the page on the live site can't touch anyone's saved words or sync.
- **The fuzzer uses a seeded random number generator** (mulberry32), so a seed replays exactly the same histories. Each failure is reported with the seed and step to replay it.
- **Two things the fuzzer does not check:**
  - It does not check that different sync orders give the same result. The merge's own comments say that combining same-name decks depends on the order of merges, and that the server fixes the order by taking one write at a time.
  - It does not test tombstone expiry: its histories span days, not the 60 days a tombstone is kept.
- **The page needs http(s).** Browsers block a page opened as a `file://` from reading the file next to it, so it runs on GitHub Pages or a local server, and says so if opened as a file.

**Checking that the tests can fail**

Before the results were trusted, nine deliberate bugs were planted in copies of the merge code, one at a time:
- the newest edit loses;
- a deletion loses a tie;
- tie-breaks depend on argument order;
- no deck combining;
- no deck revival;
- cards outlive a deleted deck;
- old cards lose their deck;
- aliases are ignored;
- review counts are summed instead of maxed.

All nine were caught. The first version missed the tie bug, because its clock always moved forward, so no two devices ever edited at the same moment. The fuzzer now sometimes lets no time pass between steps, and the deletion scenario checks a tie directly.

**Results (2026-10-21, Chromium)**

| Run | Result |
|---|---|
| Scenarios | 7 of 7 passed |
| Fuzzer, default (seed 20261021, 500 histories of 60 steps) | All 5 properties passed: 14,310 merge checks for each of the first four, 500 convergence checks; 24,740 edits and 8,260 syncs, in about 1.2 s. A second run with the same seed gave identical counts. |
| Fuzzer, larger (seed 1, 10,000 histories of 60 steps) | All 5 properties passed: 283,892 merge checks each, 10,000 convergence checks; 495,735 edits and 164,265 syncs, in about 21 s. |

---

## By the numbers

Counted from the repository at the commit that adds this log.

| | |
|---|---|
| Commits before this log | 45, from 2026-07-09 to 2026-10-21, on 15 different days |
| Commit authors | neofino8 (42), Claude (3); 34 commit messages carry a Claude co-author line |
| Interface languages | 3: English, Russian, Uzbek, with 199 interface strings each |
| The app | `index.html`, 4,581 lines (about 206 KB), with no build step and no dependencies |
| Backend | `supabase/schema.sql` (210 lines) and `supabase/verify.sql` (91 lines) |
| Keepalive | One GitHub Actions workflow, running every 6 hours |
| Merge tests | `tests/merge-tests.html` (633 lines): 7 scenario tests and a fuzzer checking 5 properties |
| Study modes | 4: Learn, Review, Quiz, Match |
| Leitner boxes | 5, reviewed every 1, 2, 4, 7 and 14 days |
| Themes | 10 (8 dark, 2 light) plus Auto |
| Card colours | 8 presets, plus a custom colour or a photo |
| Sample decks | 2, of 20 words each: English→Russian and English→Uzbek |
| Sync limits | 1.5 MB per synced deck, 10,000 cards, 10,000 tombstones, 1,000 deck tombstones; tombstones kept 60 days |
