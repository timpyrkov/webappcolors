# Web App Colors — Refactoring Plan

> **Goal**: Re-focus this project from a styled UI-control showcase into a focused
> **palette design tool**. Keep the two-panel layout (left = global controls,
> right = showcase) but replace the rich UI showcase with a 2×2 grid of swatches
> driven by a smart OKLCh-based palette engine and a new gradient authoring tool.

---

## 1. Design decisions (frozen)

### 1.1 Token model — role-based bg/fg groups

All non-accent colours collapse into **two role-based groups**, each 5 stops, sharing
the same hue:

| Token range          | Description                                                    |
|----------------------|----------------------------------------------------------------|
| `--bg-1` … `--bg-5`  | Background-side neutrals. In **dark theme** these are *dark*;  |
|                      | in **light theme** these are *light*. `--bg-1` is the **most   |
|                      | extreme** (= page background); `--bg-5` is closest to the      |
|                      | mid range. Indices 2–5 drive **away** from the extreme.        |
| `--fg-1` … `--fg-5`  | Foreground-side neutrals. In **dark theme** these are *light*; |
|                      | in **light theme** these are *dark*. `--fg-1` is the **most    |
|                      | extreme** (= primary text); `--fg-5` is closest to the mid     |
|                      | range. Indices 2–5 drive **away** from the extreme.            |

Convenience aliases:

- `--bg` → `--bg-1` (page background, most extreme)
- `--fg` → `--fg-1` (primary text colour, most extreme)
- Edges, panels, dividers, grooves, shadows, muted text are all expressed as
  `--bg-N` / `--fg-N` rather than ad-hoc `--panel-bg`, `--edge-1/2`, `--neutral-1..4`.

**Lightness range allocation** (initial values, iterate during Phase 5):

| Range (OKLCh L) | Owner                              |
|-----------------|------------------------------------|
| `0.10` → `0.50` | `--bg-1..5` (dark theme)           |
| `0.50` → `0.75` | Reserved for **secondary accents** |
| `0.75` → `1.00` | `--fg-1..5` (dark theme)           |

In the dark theme: `--bg-1` sits at L≈0.10 (extreme), `--bg-5` at L≈0.50;
`--fg-1` at L≈1.00 (extreme), `--fg-5` at L≈0.75. So bg occupies **half** the
range, fg occupies **a quarter**, and the middle quarter is sampled by the
secondary-accent ladder (§4.2). The light theme mirrors the L axis: `--bg-1`
at L≈0.95, `--fg-1` at L≈0.05, etc. Exact endpoints are constants and will be
tuned during Phase 5.

Accents (5 per group, same in dark & light themes):

| Token range                       | Source                                              |
|-----------------------------------|-----------------------------------------------------|
| `--primary-accent-1..5`           | Sampled from the **smart gradient** (see §3)        |
| `--secondary-accent-1..5`         | Derived from `main` seed (see §4.2)                 |

Notifications (5 semantic colours, **theme-unaware** — single fixed set):

```
--color-note   --color-message   --color-success   --color-warning   --color-error
```

> ⚠️ Current state: in `gen_colors.js` these are **theme-aware** today
> (different hex per theme, lines 235–239). The plan is to collapse them to a
> single fixed set, using the existing **dark-theme values** as the canonical
> set:
>
> | Token              | Hex       |
> |--------------------|-----------|
> | `--color-note`     | `#5bbcb8` |
> | `--color-message`  | `#4da6e8` |
> | `--color-success`  | `#5cb85c` |
> | `--color-warning`  | `#e8a838` |
> | `--color-error`    | `#d9534f` |

### 1.2 Showcase layout — 2×2 grid

The right panel is a 2×2 grid of equal-size sub-panels, all driven by the
**single currently selected palette**:

|                       | Left column (Dark theme)              | Right column (Light theme)             |
|-----------------------|---------------------------------------|----------------------------------------|
| **Top row**           | Dark + neutrals = grey (chroma 0)     | Light + neutrals = grey (chroma 0)     |
| **Bottom row**        | Dark + neutrals tinted by `main` hue  | Light + neutrals tinted by `main` hue  |

Each sub-panel contains:

1. Typography block: `<h1>` title, `<h2>` heading, `<h3>` sub-heading, normal
   paragraph text, accent comment text.
2. Five rows of 5 colour rectangles, each labelled with its **token name** and
   **hex code**:
   - Primary accents (`--primary-accent-1..5`)
   - Secondary accents (`--secondary-accent-1..5`)
   - Neutral lights (the lighter of the two groups in this theme)
   - Neutral darks (the darker of the two groups in this theme)
   - Notifications (`--color-note`, `--color-message`, `--color-success`, `--color-warning`, `--color-error`)

> "Neutral lights" / "Neutral darks" are *absolute* labels: in dark theme,
> `--bg-*` is dark and `--fg-*` is light, so darks=`--bg-*` lights=`--fg-*`.
> In light theme the mapping is reversed.

### 1.3 Left panel — simplified controls

Keep:

- Title + version tag
- **Language** segmented control
- **Font** segmented control
- **Palette** segmented control (15 presets, 5×3 grid)
- Palette meta inputs (gems / natural / flower / beverage)
- Per-seed colour pickers (`main` + `accents[]`)
- Action buttons: **Save config**, **Export palette**, **Reset**
- **Gradient / Home** toggle button (below the action buttons) that swaps the
  right-hand area between the 2×2 showcase and the gradient playground (§3).

Remove:

- Style selector
- Theme selector
- Colorization (saturation) selector
- **"Disable all" checkbox** (no longer relevant — right panel has no interactive controls)
- All UI showcase elements: buttons, knobs, gauges, toggles, sliders,
  checkboxes, radios, charts, calendars, notifications components
- The "Export style" button + the entire `/api/export-style` machinery

### 1.4 Persistence model

**Save config** writes the edited `PALETTES` map back to
`public/js/palettes.js`:

- **Dev mode** (running under `node server.js` locally): `POST /api/save-palettes`
  writes the file directly to disk.
- **Prod / read-only deploy** (or when the API call fails): client falls back to
  triggering a `palettes.js` download. The server advertises its capability
  via `GET /api/capabilities` so the UI can show the right button label.

---

## 2. Project re-shape

### 2.1 Files to delete

- `public/css/styles/` — entire directory (basic/flat/gradient/volume/grooves/shadows.css)
- `public/js/controls/` — entire directory (flat.js, rotary-knob.js, gauges.js, push-button.js, segmented-control.js)
- `public/js/style-manager.js`
- `public/js/tokens.js` (legacy JS palette constants — no longer used)
- All references to the above in `public/index.html` and `server.js`

### 2.2 Files to keep (and refactor)

| File                              | Change                                                              |
|-----------------------------------|---------------------------------------------------------------------|
| `public/index.html`               | Strip showcase, build new 2×2 grid scaffolding                      |
| `public/css/layout.css`           | Drop UI-control styles, add 2×2 grid + swatch styles                |
| `public/css/tokens.css`           | Define `--bg-1..5`, `--fg-1..5`, accent and notification tokens     |
| `public/js/app.js`                | Remove style/theme/saturation/showcase wiring; add new wiring       |
| `public/js/gen_colors.js`         | Rewrite generator (see §4)                                          |
| `public/js/palettes.js`           | Keep seeds; possibly add `gradient` field per palette (see §3)      |
| `public/js/i18n.js` + `i18n/*.json` | Keep, prune unused keys                                           |
| `server.js`                       | Drop export-style; add `/api/save-palettes` + `/api/capabilities`   |

### 2.3 New files

| File                                     | Purpose                                            |
|------------------------------------------|----------------------------------------------------|
| `public/js/components/gradient-slider.js`| `<gradient-slider>` Web Component (see §3.3)       |
| `public/js/components/swatch-grid.js`    | `<swatch-grid>` Web Component for the 2×2 panels   |
| `public/js/components/swatch-row.js`     | `<swatch-row>` for the playground rectangle rows   |
| `public/js/components/color-picker.js`   | Lightweight picker (if not already extracted)      |

`components/` is a new directory replacing the deleted `controls/`.

---

## 3. Smart gradient tool & playground page

The gradient tool lives on a **dedicated playground page** (not embedded in the
left sidebar). The right-hand area of the app has two modes:

- **Home** (default): the 2×2 showcase grid (§1.2).
- **Gradient**: the playground described in §3.5.

A single button in the left panel toggles between them; its label flips
between "Gradient" (when in Home mode) and "Home" (when in Gradient mode).

### 3.1 Data model

A **gradient** is an ordered list of swatches:

```ts
type Swatch = { position: number /* integer 0..100 */, hex: string };
type Gradient = Swatch[]; // length ≥ 2, sorted by position, includes 0 and 100
```

Invariants:

- Always at least two swatches at positions `0` and `100`.
- Positions are unique integers in `[0, 100]`.
- Swatches at `0` and `100` cannot be removed (only their colour edited).

### 3.2 OKLCh path interpolation

Given the swatch list, produce a colormap `f(t): [0,100] → hex`:

1. Convert each swatch hex → OKLCh.
2. Between consecutive swatches `(p_i, c_i)` and `(p_{i+1}, c_{i+1})`,
   linearly interpolate `(L, C, h)` in OKLCh, choosing the **shorter hue arc**
   (handle 360° wrap correctly).
3. Convert the result back to sRGB hex; gamut-clip if necessary
   (reduce chroma until in-gamut, preserving L and h).

Sampling 5 evenly-spaced points (`t ∈ {0, 25, 50, 75, 100}`) yields the five
**primary accents**.

### 3.3 Gradient slider UI

`<gradient-slider>` is the core Web Component:

- Horizontal gradient bar showing the rendered colormap.
- Swatch markers along the bar; each marker is draggable horizontally and
  snaps to integer positions; double-click opens a colour picker.
- Anchor swatches at `0` and `100` cannot be moved or removed (only their
  colour edited).
- Click on empty space on the bar to insert a new swatch at the click position.
- Right-click / × button on a non-anchor swatch removes it.
- Emits `change` event with `detail: Gradient` whenever the gradient mutates.

### 3.4 Gradient playground layout

When the user toggles into Gradient mode, the right panel renders the
playground as **three groups stacked vertically and aligned to the same
horizontal axis**, so corresponding swatches line up:

1. **Seed-accent rectangles** — one rectangle per accent in the current
   palette's `accents[]` (so 2, 3, 5, or 7 swatches), uniformly filled with
   the seed hex. Labelled with the accent index and hex.
2. **Gradient-sampled rectangles** — the **same number** of rectangles,
   filled with colours sampled from the smart gradient at positions
   matching the seed-accent positions in group 3 below. Labelled with
   sampled hex.
3. **Smart gradient slider** — a `<gradient-slider>` instance. The two
   anchors at `0` and `100` are always present; intermediate swatches are
   added at integer positions to match the structure of `accents[]`.
   The user freely drags anchors to find positions that make group 2
   reproduce group 1 as closely as possible.

**Workflow for `quartz` (and eventually all palettes)**:

- `quartz` has **7 seed accents** (gruvbox-derived), more than the 5 primary
  accents the engine targets. Using the playground, choose 5 of the 7 seeds
  as gradient reference swatches at integer positions in `[0, 100]` and
  iterate until the **2 excluded seeds** are well-approximated by samples
  from the resulting gradient at intermediate positions.
- Once a satisfactory gradient is found, manually edit `palettes.js` so
  `quartz` uses the new 5-swatch `gradient` field.
- Apply the same exercise to all other palettes; eventually the `special`
  field on every palette can be dropped (including `quartz`'s implicit
  >5-accent special-case and `diamond`'s `primaryFromLightness`).

### 3.5 Persistence

Each `PALETTES[key]` entry gains an optional `gradient` field:

```js
{
  gems: "...", main: "#...", accents: ["#...","#..."],
  gradient: [{ position: 0, hex: "#..." }, { position: 100, hex: "#..." }],
  special: null,
}
```

When `gradient` is present it **overrides** `accents` for primary accent
generation. When absent (legacy palette), the engine builds a default gradient
from `accents` (one swatch per accent, evenly spaced).

---

## 4. Palette generation refactor (`gen_colors.js`)

### 4.1 Inputs

```ts
generatePalette({
  main: hex,                  // page tint hue
  gradient: Swatch[],         // primary accent gradient
  saturationMode: "grey" | "tinted", // chroma of bg/fg groups
  theme: "dark" | "light",
}) → Record<TokenName, hex>
```

The 2×2 showcase calls this 4× per palette change, once per quadrant.

### 4.2 Algorithm

**bg/fg groups** (5 stops each, balanced lightness in OKLCh):

- Hue `h` = `main`'s hue.
- Chroma `C` = `0` when `saturationMode = "grey"`, else `main`'s chroma scaled by
  a constant (e.g. 0.5) to keep neutrals subtle.
- Lightness ladder for **dark theme**:
  - `--bg-1..5`: `L ∈ [L_bg_min, L_mid_low]` evenly spaced (e.g. `0.08 → 0.30`).
  - `--fg-1..5`: `L ∈ [L_mid_high, L_fg_max]` evenly spaced (e.g. `0.55 → 0.94`).
- Light theme: invert the L ladders; chroma stays the same.
- Specific L values are constants in the file, easy to tweak.

**Primary accents (5 stops)**:

- Sample the gradient at `t ∈ {0, 25, 50, 75, 100}` (§3.2).
- Optional post-balance pass: equalise lightness spread / chroma so no single
  stop dominates (TBD in §6, may be a no-op initially).

**Secondary accents (5 stops)**:

- Take `main`'s OKLCh `(L_m, C_m, h_m)`.
- Generate 5 stops with the same hue, lightness ladder centred on `L_m`
  (e.g. `[L_m − 0.20, L_m − 0.10, L_m, L_m + 0.10, L_m + 0.20]`),
  and a controlled chroma curve (slightly attenuated at the extremes to avoid
  out-of-gamut clipping).

**Notifications**:

- Five fixed semantic hues (note=teal, message=blue, success=green,
  warning=amber, error=red), with theme-specific lightness/chroma chosen so
  that contrast against `--bg` is consistent across themes.

### 4.3 Token output

Per call, returns a flat map:

```
--bg, --bg-1..5, --fg, --fg-1..5,
--primary-accent-1..5, --secondary-accent-1..5,
--color-note, --color-message, --color-success, --color-warning, --color-error
```

---

## 5. Server / persistence

### 5.1 New endpoints

- `GET /api/capabilities` → `{ canWritePalettes: boolean }`
  - `true` when running under local dev (Express + writable filesystem).
  - `false` on read-only deployments.
- `POST /api/save-palettes`
  - Body: `{ palettes: PALETTES_OBJECT }`
  - Serialises the object as the body of `public/js/palettes.js`
    (preserving the file header/comment block and exports).
  - Returns `{ ok: true }` on success, `{ ok: false, error }` otherwise.

### 5.2 Removed endpoints

- `GET /api/export-style` (and the `archiver` dependency, if no longer used).

### 5.3 Client behaviour

On boot, `app.js` calls `/api/capabilities`:

- If `canWritePalettes`: **Save** button posts to `/api/save-palettes`.
- Else: **Save** button generates a `palettes.js` blob and triggers download.

---

## 6. Implementation phases

### Phase 1 — Demolition & scaffold ✅ planning done

- [ ] Delete `public/css/styles/`, `public/js/controls/`, `style-manager.js`, `tokens.js`.
- [ ] Strip showcase markup from `index.html`; remove style/theme/saturation
      controls from the left panel.
- [ ] Strip control styles from `layout.css`; add a placeholder 2×2 grid.
- [ ] Remove `/api/export-style` from `server.js`; drop unused dependencies.
- [ ] Smoke test: app boots, left panel shows palette selector + meta, right
      panel shows an empty 2×2 grid.

### Phase 2 — Token model & generator skeleton

- [ ] Update `tokens.css` with the new `--bg-N` / `--fg-N` token set
      (default values for dark theme).
- [ ] Rewrite `gen_colors.js` per §4 (initial straightforward implementation).
- [ ] Wire `app.js` to call `generatePalette` 4× and apply the four token sets
      to the four sub-panels via inline CSS variables.

### Phase 3 — Swatch grid component

- [ ] Implement `<swatch-grid>`: 5 rows × 5 columns of rectangles, each
      showing token name + hex.
- [ ] Implement typography block (title, headings, paragraph) above the grid.
- [ ] Verify all four quadrants render correctly with the same palette but
      different theme/saturation combos.

### Phase 4 — Smart gradient tool & playground

- [ ] Implement `<gradient-slider>` per §3.3 (drag, snap, add/remove, picker).
- [ ] Add OKLCh path interpolation + gamut clipping helpers in `gen_colors.js`.
- [ ] Add the **Gradient / Home** toggle button to the left panel; implement
      view-swap of the right-hand area.
- [ ] Build the playground layout per §3.5 (three vertically-aligned groups).
- [ ] Wire gradient `change` events → live-update both the playground
      sampled-rectangles row and (when in Home mode) the four quadrants.
- [ ] Migrate existing palettes in `palettes.js` to include a `gradient` field
      (auto-generated from current `accents`).

### Phase 5 — Balanced palette generation

- [ ] Tune the bg/fg L ladders and chroma scale for visual balance across
      all 15 seed palettes; add unit-style sanity checks (min contrast
      between `--bg` and `--fg`, etc.).
- [ ] Tune secondary-accent ladder; ensure no out-of-gamut clipping.
- [ ] (Optional) Add a "balance" pass to primary accents.

### Phase 6 — Save / export

- [ ] Add `/api/capabilities` and `/api/save-palettes` endpoints.
- [ ] Implement `palettes.js` serialiser (idempotent, comment-preserving).
- [ ] Wire **Save** button: post or download depending on capability.
- [ ] Wire **Reset** button: revert edits to the on-disk seeds.
- [ ] Update **Export palette**: download the four generated token sets +
      seeds as JSON.

### Phase 7 — Polish

- [ ] Trim unused i18n keys; add new keys (`gradient.tool`, `swatch.primary`, …).
- [ ] Tighten layout.css; ensure 2×2 quadrants stay equal-size on resize.
- [ ] Update `README.md` to describe the new tool.

---

## 7. Open questions / TBD

- **`special` field elimination** — the goal is to remove `special` from
  every palette by re-authoring their `gradient` fields via the playground
  workflow (§3.5). For `quartz`, this means picking 5 of its 7 seed
  accents as gradient anchors and tuning positions until the other 2 are
  reproduced by intermediate samples. For `diamond`, the
  `primaryFromLightness` rule becomes a normal grey-axis gradient.
- **Balance pass** for primary accents — exact algorithm to be iterated on
  during Phase 5 against the 15 seed palettes.
- **Lightness range constants** — the `0.10/0.50/0.75/1.00` split in §1.1
  is a starting point; tune in Phase 5.

---

## 8. Versioning

- Initial git tag: **`v1.0.0`** (empty annotation). All subsequent phases
  bump the tag (e.g. `v1.1.0` after Phase 4 ships the gradient playground).
