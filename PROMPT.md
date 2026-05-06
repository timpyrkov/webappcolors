Please, integrate the this web color palette module into a the existing web application project. Think step by step and implement each step carefully.

### Step 1 — Review existing codebase
Analyze the current project structure to identify:
- Where theme/state is managed (context, store, or local component state)
- Existing CSS variable naming conventions
- Current color/token usage patterns
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
- Use `getPaletteName(key, "gems", currentLang)` from §5 template
- Ignore natural, flower, and beverage names and do not expose them in the UI
- Listen to language changes and re-render selector labels
- Fallback chain: requested language → English → raw palette field

### Step 5 — Use explicit parameter defaults

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