# Palette Module — Integration Guide

Reusable dynamic colour-palette engine for web applications.
Generates four themed variants from each set of seed colours using
HSL for hue/saturation and "excolor" geometric arcs (through black → colour →
white in RGB space) for perceptually vivid lightness interpolation.

> **Theme variants:** Each palette supports a 2 × 2 matrix of **Dark/Light** × **Tinted/Accented**:
>
> - **Tinted** — saturated accents + tinted (coloured) backgrounds
> - **Accented** — saturated accents + greyscale (neutral) backgrounds
>
> **Palette names:** 15 palettes are available. Each palette defaults to a **Gemstone** name (Ruby, Gold, Topaz, etc.). Alternatively, you can use **Natural Phenomena** (Sunset, Autumn, Lagoon), **Flower** (Rose, Marigold, Iris), or **Beverage** (Wine, Brandy, Mojito) names for theming.

---

## 1. Files to copy

| File | Role |
|---|---|
| `palette_tools.js` | Self-contained module: colour math + `createPalette()` engine |
| `palettes.js` | Palette seed definitions + i18n display names |

These two files have **zero DOM dependencies** and can be dropped into any JS
project (browser ES module, Node, bundler). Place them together in the same
directory (e.g. `src/`, `js/` or `public/js/`).

---

## 2. Exported API

### From `palette_tools.js`

| Export | Signature | Purpose |
|---|---|---|
| `createPalette` | `(opts) → { darkTinted, lightTinted, darkAccented, lightAccented }` | Main entry point — generates four themed variants |
| `paletteToTokens` | `(variant, name) → { [name]: { "--label": "#hex", … } }` | Flatten one variant to a CSS-variable map |
| `exportPaletteJson` | `(allVariants) → object` | Flatten all four variants into one JSON-serialisable object |
| `downloadPaletteJson` | `(allVariants, filename) → void` | Trigger a browser download of the palette as JSON |

### From `palettes.js`

| Export | Type | Purpose |
|---|---|---|
| `PALETTES` | `object` | Seed data keyed by palette name (`main` hex + `accents` array) |
| `PALETTE_I18N` | `object` | Localised display names per palette per language |
| `PALETTE_ORDER` | `string[]` | Display ordering of palette keys |
| `DEFAULT_PALETTE` | `string` | Recommended default key (`"amber"`) |

---

## 3. Quick start

```js
import { PALETTES, PALETTE_ORDER, DEFAULT_PALETTE } from "./palettes.js";
import { createPalette } from "./palette_tools.js";

// 1. Pick a palette
const palette = PALETTES[DEFAULT_PALETTE];

// 2. Generate all four variants
const result = createPalette({
  main:  palette.main,
  seeds: palette.accents,
});

// 3. Choose one variant based on user's Theme + Colorization selection
const variant = result.darkTinted;  // or lightTinted / darkAccented / lightAccented

// 4. Apply to CSS
applyTokensToCSS(variant);
```

---

## 4. Variant structure

Each of the four variants (`darkTinted`, `lightTinted`, `darkAccented`,
`lightAccented`) contains:

| Key | Content |
|---|---|
| `neutrals` | Array of N tokens (default 12) — background/foreground scale |
| `primary` | Array of M tokens (default 5) — primary accent ramp |
| `secondary` | Array of M tokens — secondary accent ramp |
| `notifications` | Object `{ error, warning, success, note, message }` |
| `categories` | Array of L tokens (default 5) — categorical colours |

Every token is `{ id, label, hex, H, S, L }`.

---

## 5. Reference app.js integration

Below is a minimal but complete integration template showing how to wire the
palette module into a web application's entry point. Copy and adapt to your
project.

```js
// ── app.js — Palette integration template ──────────────────────────

import { PALETTES, PALETTE_ORDER, DEFAULT_PALETTE, PALETTE_I18N }
  from "./palettes.js";
import { createPalette } from "./palette_tools.js";

// ── State ──────────────────────────────────────────────────────────

let currentPalette = DEFAULT_PALETTE;
let currentTheme   = "dark";      // "dark" | "light"
let currentColor   = "tinted";    // "tinted" | "accented"
let currentLang    = "en";        // ISO 639-1 code
let currentResult  = null;        // output of createPalette()

// ── Variant selection ──────────────────────────────────────────────

const VARIANT_MAP = {
  "dark-tinted":     "darkTinted",
  "dark-accented":   "darkAccented",
  "light-tinted":    "lightTinted",
  "light-accented":  "lightAccented",
};

function getVariantKey() {
  return VARIANT_MAP[`${currentTheme}-${currentColor}`];
}

// ── Palette generation ─────────────────────────────────────────────

function refreshPalette() {
  const p = PALETTES[currentPalette];
  if (!p) return;

  currentResult = createPalette({
    main:  p.main,
    seeds: p.accents,
    // All other parameters are optional — see §7 for the full list.
  });

  const variant = currentResult[getVariantKey()];
  applyTokensToCSS(variant);
}

// ── Apply tokens to CSS custom properties ──────────────────────────

function applyTokensToCSS(variant) {
  const root = document.documentElement.style;
  const n = variant.neutrals;
  const N = n.length;
  const M = variant.primary.length;

  // Backgrounds (dark → light in dark themes, reversed in light)
  root.setProperty("--bg",   n[0].hex);
  root.setProperty("--bg-2", n[Math.min(1, N - 1)].hex);
  root.setProperty("--bg-3", n[Math.min(2, N - 1)].hex);

  // Borders / dividers
  root.setProperty("--border", n[Math.min(4, N - 1)].hex);

  // Foregrounds
  root.setProperty("--fg-muted", n[Math.floor(N * 0.6)].hex);
  root.setProperty("--fg",       n[N - 1].hex);

  // Primary accent (first and last of the ramp)
  root.setProperty("--accent-1", variant.primary[0].hex);
  root.setProperty("--accent-2", variant.primary[M - 1].hex);

  // Notifications
  for (const [, v] of Object.entries(variant.notifications)) {
    root.setProperty(`--${v.label}`, v.hex);
  }
}

// ── Palette display name with i18n fallback ────────────────────────

function getPaletteName(key, category, lang) {
  const i18n = PALETTE_I18N[key];
  const cat  = i18n && i18n[category];
  return (cat && cat[lang]) || (cat && cat["en"]) || PALETTES[key][category];
}

// ── Build palette selector UI ──────────────────────────────────────
// Adapt this to your framework (React, Vue, plain DOM, etc.).

function buildPaletteSelector(containerEl) {
  containerEl.innerHTML = "";
  for (const key of PALETTE_ORDER) {
    const btn = document.createElement("button");
    btn.textContent = getPaletteName(key, "gems", currentLang);
    btn.classList.toggle("active", key === currentPalette);
    btn.addEventListener("click", () => {
      currentPalette = key;
      refreshPalette();
      buildPaletteSelector(containerEl);  // re-render to update active state
    });
    containerEl.appendChild(btn);
  }
}

// ── Initialise ─────────────────────────────────────────────────────

refreshPalette();
```

### What to customise

- **Theme / Colorization selectors** — add buttons, dropdowns, or segmented
  controls that set `currentTheme` and `currentColor`, then call
  `refreshPalette()`.
- **CSS variable names** — adjust `applyTokensToCSS()` to match your
  stylesheet's `var(--…)` names.
- **Generation parameters** — pass additional options to `createPalette()`
  (see §7) if you need to tune neutral count, lightness range, etc.

---

## 6. User-facing selections

Offer the user **three choices** that together select one variant:

| Selection | Options | Maps to |
|---|---|---|
| **Palette** | Any key from `PALETTE_ORDER` (e.g. `"ruby"`, `"amber"`) | `main` + `accents` seeds |
| **Theme** | Dark / Light | dark vs. light neutral ordering |
| **Colorization** | Tinted / Accented | tinted (hue-shifted neutrals) vs. accented (grey neutrals) |

Combination matrix:

| Theme | Colorization | Variant key |
|---|---|---|
| Dark | Tinted | `darkTinted` |
| Dark | Accented | `darkAccented` |
| Light | Tinted | `lightTinted` |
| Light | Accented | `lightAccented` |

**Recommended defaults:** palette `"amber"`, theme `Dark`, colorization `Tinted`.

---

## 7. Generation parameters

All parameters are optional; defaults produce good results.

| Parameter | Default | Description |
|---|---|---|
| `main` | `"#808080"` | Neutral tint seed colour (hex) |
| `seeds` | `[]` | Accent seed colours array (hex) |
| `N` | `12` | Number of neutral steps (5–20) |
| `M` | `5` | Number of primary/secondary accent steps (3–7) |
| `L` | `5` | Number of category colours (3–7) |
| `lmin` | `0.05` | Minimum neutral lightness |
| `lmax` | `0.95` | Maximum neutral lightness |
| `accentLight` | `0.55` | Lighter accent lightness target |
| `accentDark` | `0.45` | Darker accent lightness target |
| `alertL` | `0.55` | Notification colour lightness |
| `categoryL` | `0.55` | Category colour lightness |
| `sigmoid` | `3.0` | Neutral distribution curve steepness |
| `mode` | `"superellipse"` | Arc interpolation: `"linear"`, `"circle"`, `"superellipse"` |
| `power` | `1.5` | Superellipse exponent (when mode = superellipse) |

---

## 8. Applying colour tokens to UI

### 8.1 Backgrounds and foregrounds

Neutrals are ordered **dark → light** (in dark variants) or **light → dark**
(in light variants). The first neutral is always the deepest background; the
last is always the brightest foreground.

```
neutral-1  → page background
neutral-2  → panel / card background
neutral-3  → raised surface, button default bg
neutral-5  → borders, dividers
neutral-7  → muted / secondary text
neutral-N  → primary foreground text
```

### 8.2 Accent colours

Primary and secondary each produce an M-length ramp.

Typical usage:
- **Active / selected button** — gradient from `primary[0]` to `primary[M-1]`
- **Focus ring** — `primary[0]` border + glow
- **Default button** — neutral panel bg with neutral border
- **Disabled button** — muted neutral bg, reduced opacity
- **Links / interactive text** — `primary[0]` (dark theme) or `primary[M-1]` (light)
- **Secondary actions** — same pattern using secondary ramp

### 8.3 Notification / alert colours

```
notifications.error.hex    → destructive actions, error states
notifications.warning.hex  → warnings
notifications.success.hex  → confirmations
notifications.note.hex     → informational callouts
notifications.message.hex  → chat / message indicators
```

### 8.4 Category colours

`categories[0..L-1]` — use for chart series, tags, badges, or any set of
visually distinct items. They form a seamlessly looped hue sequence.

---

## 9. Palette data format (`palettes.js`)

```js
// PALETTES — seed colours
export const PALETTES = {
  "<key>": {
    gems: "English display name",
    natural: "...", flower: "...", beverage: "...",
    main:    "#hex",           // neutral tint seed
    accents: ["#hex", ...],    // 2–7+ accent seeds
  },
};

// PALETTE_I18N — localised display names
export const PALETTE_I18N = {
  "<key>": {
    gems:     { en: "...", es: "...", ... },
    natural:  { en: "...", ... },
    flower:   { en: "...", ... },
    beverage: { en: "...", ... },
  },
};

// PALETTE_ORDER — display ordering
export const PALETTE_ORDER = ["key1", "key2", ...];

// DEFAULT_PALETTE
export const DEFAULT_PALETTE = "amber";
```

The four name categories (`gems`, `natural`, `flower`, `beverage`) are
alternative display themes — pick whichever suits your app.

---

## 10. Palette naming and i18n

Each palette has four localised display-name categories in `PALETTE_I18N`.

### Lookup with fallback

```js
function getPaletteName(key, category, lang) {
  const i18n = PALETTE_I18N[key];
  const cat  = i18n && i18n[category];
  // Fallback: requested lang → English → raw palette field
  return (cat && cat[lang]) || (cat && cat["en"]) || PALETTES[key][category];
}
```

### Adding a new language

1. Add a new key (e.g. `"pt"`) to each palette entry in `PALETTE_I18N`.
2. No code changes needed — the fallback chain handles missing translations.

### Language selector

Can be any widget (dropdown, segmented control, etc.). Pass the lowercase
ISO 639-1 code (e.g. `"en"`, `"es"`, `"ja"`) to `getPaletteName()`.

Currently supported: `en`, `es`, `it`, `fr`, `de`, `ru`, `ko`, `ja`, `zh`.

### Updating the palette selector when language changes

```js
function onLanguageChange(newLang) {
  currentLang = newLang;
  buildPaletteSelector(document.getElementById("paletteSelectorContainer"));
}
```

---

## 11. Minimal integration checklist

1. Copy `palette_tools.js` and `palettes.js` to your project's JS directory.
2. In your `app.js` (or equivalent entry point):
   - `import { PALETTES, PALETTE_ORDER, DEFAULT_PALETTE, PALETTE_I18N } from "./palettes.js";`
   - `import { createPalette } from "./palette_tools.js";`
3. Maintain state variables: `currentPalette`, `currentTheme`, `currentColor`, `currentLang`.
4. Call `createPalette({ main: palette.main, seeds: palette.accents })`.
5. Select the active variant via `result[VARIANT_MAP[theme + "-" + colorization]]`.
6. Map the variant's tokens to CSS custom properties (see `applyTokensToCSS()` in §5).
7. Re-run `createPalette()` when the user changes palette, theme, or colorization.
8. Use `getPaletteName(key, category, lang)` for localised palette display names.
9. Re-render the palette selector when the language changes.

---

## 12. Integration Checklist

### Minimal implementation checklist for AI assistants

```js
// 1. Imports
import { PALETTES, PALETTE_ORDER, DEFAULT_PALETTE, PALETTE_I18N }
  from "./palettes.js";
import { createPalette } from "./palette_tools.js";

// 2. State (adapt to your framework)
let currentPalette = DEFAULT_PALETTE;  // gemstone key
let currentTheme   = "dark";           // "dark" | "light"
let currentLang    = "en";             // ISO 639-1 code

// 3. Variant mapping (tinted only)
const VARIANT_MAP = {
  dark:  "darkTinted",
  light: "lightTinted",
};

// 4. Generate and apply
function refreshPalette() {
  const p = PALETTES[currentPalette];
  const result = createPalette({ main: p.main, seeds: p.accents });
  const variant = result[VARIANT_MAP[currentTheme]];
  applyTokensToCSS(variant); // adapt to your CSS variable names
}

// 5. Palette dropdown (gemstone names, i18n)
function buildPaletteDropdown(container) {
  container.innerHTML = "";
  for (const key of PALETTE_ORDER) {
    const i18n = PALETTE_I18N[key]?.gems;
    const label = i18n?.[currentLang] || i18n?.["en"] || PALETTES[key].gems;
    const option = document.createElement("option");
    option.value = key;
    option.textContent = label;
    option.selected = key === currentPalette;
    container.appendChild(option);
  }
}

// 6. Theme toggle handler
function setTheme(theme) {
  currentTheme = theme; // "dark" or "light"
  refreshPalette();
}

// 7. Language change handler
function setLanguage(lang) {
  currentLang = lang;
  buildPaletteDropdown(document.getElementById("paletteSelect"));
}
```

---

## 13. License

This palette module is released under the **MIT License**.

Copyright (c) 2026 Tim Pyrkov

See the included `LICENSE` file for the full text. You are free to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies of the
module in your own projects, provided the copyright notice and permission
notice are included.
