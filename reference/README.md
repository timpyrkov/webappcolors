# gruvbox

Gruvbox palette explorer — visualise colour relationships in OKLCH space.

## Quick start

```bash
cd /path/to/gruvbox
python3 -m http.server 8070
```

Then open [http://localhost:8070](http://localhost:8070) in your browser.

## Project structure

- `gruvbox.json` — palette definition (hex RGB)
- `color_tools.js` — OKLCH conversion & transformation utilities
- `app.js` — chart rendering (Chart.js)
- `index.html` / `style.css` — layout & styling
