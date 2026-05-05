# webappcolors

Dynamic colour-palette generator and theme preview tool for web applications.

**Live demo:** https://webappcolors.vercel.app/

## Overview

This project provides an interactive UI for designing colour palettes from a
small set of seed colours. It generates four themed variants (Dark Tinted,
Light Tinted, Dark Accented, Light Accented) and previews them in three modes:
swatch grids, mobile app mockups, or an animated procedural synthwave scene.

### Colour pipeline

- **Hue & Saturation** — standard HSL transformations
- **Lightness** — "excolor" geometric arcs through black → colour → white in
  RGB space, with configurable interpolation modes (linear, circle,
  superellipse)
- **OKLCh** — used only in the colour-picker UI widget, not in the generation
  engine

### Key features

- 15 built-in palettes with themed display names (gems, nature, flowers,
  beverages)
- Tuneable generation parameters (neutral count, accent count, category count,
  lightness range, sigmoid distribution, arc mode)
- Internationalisation (i18n) — 9 languages, translatable UI and palette names
- Three preview modes:
  - **Web** — swatch grid with four variant cards
  - **Mobile** — two phone mockups with fitness-app-style UI panels
  - **Procedural** — animated synthwave landscape with Perlin-noise terrain,
    retro sun, SVG muscle car with rotating wheels, and depth-graded grid edges
- Adjustable accent saturation in the animation via `SATURATION_SHIFT`
- Export palettes as JSON or download reusable module zip

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

## Deployment

The project includes a `vercel.json` for one-click deployment on Vercel:

```bash
vercel            # deploy to preview
vercel --prod     # deploy to production
```

The Express server (`server.js`) handles API routes and static file serving.

## Project structure

```
public/
  js/
    app.js              — main application wiring, mobile mockup builder
    animation.js        — procedural synthwave canvas renderer
    palette_tools.js    — self-contained colour math + palette engine
    palettes.js         — palette seed data + i18n display names
    color_picker.js     — OKLCh conversions for colour-picker UI
    i18n.js             — internationalisation module
    components/         — custom web components (segmented-control, etc.)
  css/
    layout.css          — application styles
  data/
    car.svg             — vector car edge mask (sharp at any scale)
    car.png             — raster car fill mask
  i18n/
    en.json … zh.json   — UI translation strings (9 languages)
  index.html            — main page
server.js               — Express dev server + API (save palette, export zip)
vercel.json             — Vercel deployment configuration
```

## Reusing the palette engine

The palette generation module (`palette_tools.js` + `palettes.js`) has **zero
DOM dependencies** and can be integrated into any web application.

See **[PALETTES.md](PALETTES.md)** for a complete integration guide covering:

- Files to copy and quick-start example
- User-facing selections (palette, theme, colorization)
- Mapping colour tokens to CSS custom properties
- Generation parameters reference
- Palette data format
- i18n with language fallback
