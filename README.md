# Consistency · PWA (5 languages) · v9
A gentle 90-day consistency workbook for adults. Start any day of the year. Book rule: a missed day erases nothing.
Run: `cd consistency-app && python3 -m http.server 8000` then open http://localhost:8000 (add `?demo=1` for a demo profile).
- i18n/<lang>.js `days`: all 90 days. Days 1-7 = the book's text; 8-90 written from the book's structure (masters in content-drafts/src).
- i18n/<lang>.js `pauses` (8 reflection breaks), `bilans` (chapters 1-3), `finals` (synthesis, guided rereading, next steps). A question is a string (text) or {q,s:[5 labels]} (slider).
- data/plan.js: chapter/level structure. content-drafts/: source texts + build/integrate scripts.
- Data is stored in localStorage (key `consistency-v1`).
- All paths are relative, so it works under a subpath (e.g. GitHub Pages /consistency-app/).
- French original: ../consistency-app-fr
- v3: one question per screen, smiley sliders (moods stored 0 to 100; old emoji moods are migrated).
