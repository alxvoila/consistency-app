# Consistency — prototype PWA (English)
A gentle 90-day consistency workbook for adults — start any day of the year. Book rule: a missed day erases nothing.
Run: `cd consistency-app && python3 -m http.server 8000` then open http://localhost:8000 (add `?demo=1` for a demo profile).
- data/days.js: 90 days. Days 1-7 = real book content (translated); 8-90 = PLACEHOLDER (`placeholder:true`) to replace.
- data/chapters.js: chapters, levels, reflection/review/synthesis questions (PLACEHOLDER).
- Data is stored in localStorage (key `consistency-v1`).
- All paths are relative, so it works under a subpath (e.g. GitHub Pages /consistency-app/).
- French original: ../consistency-app-fr
