# Content drafts: the 90 days (NOT wired into the app yet)

- `src/<lang>.txt`  master text for days 8-90, one day per line:
  `n|intro|task title|task subtitle|BIG WORD|ideas (· separated)|one-line prompt|motto line 1|motto line 2`
  French (`fr.txt`) is the master; en/es/pt/zh are translations.
- Days 1-7 are taken unchanged from the live `i18n/<lang>.js` (the book's real text).
- `node build.js` regenerates:
  - `days-<lang>.md`   readable notebook (for review)
  - `days-<lang>.json` structured, with n / chapter / level / source (book|draft)
  - `days-<lang>.js`   `window.DAYS_DRAFT.<lang>` = array with the exact shape of `I18N.<lang>.days`
- To ship: replace `days:[...]` in each `i18n/<lang>.js` with the array from `days-<lang>.js`,
  and in `app.js` make DAYS use `L.days[i]` for all 90 days (placeholder:false), then drop `PH_SCHEDULE` / `ph.tasks`.
- No em/en dashes anywhere (checked by build.js).
