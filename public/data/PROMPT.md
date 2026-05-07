Please, integrate this web color palette module into the existing web application project. Think step by step and implement each step carefully.

> **IMPORTANT — Full token scheme replacement required.**
> Do NOT borrow a few colors into existing tokens. You MUST **completely replace** the existing color token scheme with the new one described below. Map every UI element to a token from the new palette. Keeping old token names with patched values is not acceptable — the full richness of the palette (12 neutral grades, 5+5 accent grades, 7 category colors) must be available and used.

### Step 1 — Review existing codebase
Analyze the current project structure to identify:
- Where theme/state is managed (context, store, or local component state)
- Existing CSS variable naming conventions and token aliases — **these will be replaced**
- Current color/token usage patterns across components
- UI framework (React, Vue, Svelte, vanilla JS, etc.)

### Step 2 — Add palette selection dropdown
Create a dropdown (or segmented control) that:
- Lists all 15 palettes in `PALETTE_ORDER` order
- Displays **gemstone names only** (ignore natural, flower, beverage names)
- Uses `PALETTE_I18N[key].gems[lang]` for localized display
- Defaults to `DEFAULT_PALETTE` ("amber")
- Calls `refreshPalette()` or equivalent on change

### Step 3 — Add Dark/Light theme toggle
Create a toggle (switch or segmented control) for:
- **Dark** → use `darkTinted` variant
- **Light** → use `lightTinted` variant
- **Only tinted variants** — do not expose "Accented" (greyscale background) option
- Store preference and apply on toggle change

### Step 4 — Wire i18n gemstone names
For the palette selector:
- Use `getPaletteName(key, "gems", currentLang)` (see PALETTES.md §5 for the full template)
- Ignore natural, flower, and beverage names and do not expose them in the UI
- Listen to language changes and re-render selector labels
- Fallback chain: requested language → English → raw palette field

### Step 5 — Replace the entire color token scheme

**Replace all existing color tokens** with the new palette token set. Do not patch old tokens — define a new complete token layer.

#### Neutral tokens — `neutral-1` … `neutral-N` (N = 12)

Neutrals are ordered so that **no renaming is needed when switching themes**:
- Dark theme: `neutral-1` = deepest background → `neutral-12` = brightest foreground
- Light theme: order is reversed automatically — `neutral-1` = lightest background → `neutral-12` = darkest foreground

Usage mapping (same token names work in both themes):
| Token range | Usage |
|---|---|
| `neutral-1` | Page / app background |
| `neutral-2` – `neutral-3` | Card / panel / surface background |
| `neutral-4` – `neutral-5` | Borders, dividers, subtle separators |
| `neutral-6` – `neutral-7` | Disabled states, placeholder text |
| `neutral-8` – `neutral-9` | Secondary / muted text |
| `neutral-10` – `neutral-11` | Body text |
| `neutral-12` | Primary foreground / headings |

#### Accent tokens — `primary-1` … `primary-M` and `secondary-1` … `secondary-M` (M = 5)

Two independent accent ramps. **General rule: lower index = lighter, higher index = darker.**
- `primary-1` — lightest primary accent (highlights, hover states)
- `primary-5` — darkest primary accent (pressed states, deep fills)
- Same applies to `secondary-1` … `secondary-5`

Typical usage:
- Active / selected button — gradient or solid from `primary-1` to `primary-5`
- Focus ring — `primary-1`
- Links / interactive text — `primary-1` (dark theme) or `primary-5` (light theme)
- Secondary actions — `secondary-*` ramp

#### Category tokens — `category-1` … `category-L` (L = 7)

Use for **enumerated items that need distinct colors**: chart series, progress bars, data lines, tags, badges, legend items, etc. Up to 7 visually distinct colors in a harmonious hue sequence.

#### Notification tokens

Fixed semantic tokens: `color-error`, `color-warning`, `color-success`, `color-note`, `color-message`.

### Step 6 — Use explicit parameter defaults

When calling `createPalette()`, use the following defaults:

| Parameter | Default |
|-----------|---------|
| N         | 12      |
| M         | 5       |
| L         | 7       |
| Lmin      | 0.05    |
| Lmax      | 0.95    |
| Power     | 1.5     |
| Sigmoid   | 3.0     |
| Acc light | 0.55    |
| Acc dark  | 0.45    |
| Alert L   | 0.55    |
| Cat. L    | 0.55    |
| Arc mode  | linear  |

Use the PALETTES.md file as a reference for the palette names, their translations and integration instructions.

In case of any questions or uncertainties, ask for clarification. If the contents of this prompt do not match the contents of the PALETTES.md file, follow this prompt.