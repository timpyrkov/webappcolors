/**
 * app.js — Boot script.
 * Wires global controls to the palette engine and 2×2 variant preview.
 */
import { checkAuth } from "./auth.js";
import { PALETTES, PALETTE_ORDER, DEFAULT_PALETTE, PALETTE_I18N } from "./palettes.js";
import { createPalette, downloadPaletteJson } from "./palette_tools.js";
import { loadLanguage, t } from "./i18n.js";

/* ── State ── */
let currentPalette = DEFAULT_PALETTE;

// Editable copy of palette seeds (starts as clone of PALETTES)
const editedPalettes = JSON.parse(JSON.stringify(PALETTES));

// Generation parameters (matching reference defaults)
let paramMode = 'linear';
let paramN = 12;
let paramM = 5;
let paramL = 7;
let paramLmin = 0.05;
let paramLmax = 0.95;
let paramPower = 1.5;
let paramSigmoid = 3.0;
let paramAccentLight = 0.55;
let paramAccentDark = 0.45;
let paramAlertL = 0.55;
let paramCategoryL = 0.55;
let previewMode = 'layout';
let currentPaletteResult = null;

/* ── Auth check ── */
await checkAuth();

/* ── Version tag ── */
fetch("/api/version").then(r => r.json()).then(v => {
  const el = document.getElementById("versionTag");
  if (el && v.tag) el.textContent = v.tag + (v.message ? " — " + v.message : "");
}).catch(() => {});

/* ══════════════════════════════════════════════════════════════════
   Apply semantic root tokens for left-panel styling
   ══════════════════════════════════════════════════════════════════ */

function applyRootTokens(variant) {
  const N = variant.neutrals.length;
  const root = document.documentElement.style;
  root.setProperty('--bg',   variant.neutrals[0].hex);
  root.setProperty('--bg-2', variant.neutrals[Math.min(1, N - 1)].hex);
  root.setProperty('--bg-3', variant.neutrals[Math.min(2, N - 1)].hex);
  root.setProperty('--bg-5', variant.neutrals[Math.min(4, N - 1)].hex);
  root.setProperty('--bg-7', variant.neutrals[Math.min(5, N - 1)].hex);
  root.setProperty('--fg',   variant.neutrals[N - 1].hex);
  root.setProperty('--fg-2', variant.neutrals[Math.floor(N * 0.6)].hex);
  // Notification tokens
  for (const [, v] of Object.entries(variant.notifications)) {
    root.setProperty(`--${v.label}`, v.hex);
  }
}

/* ══════════════════════════════════════════════════════════════════
   Swatch rendering
   ══════════════════════════════════════════════════════════════════ */

function createSwatchRow(label, colors) {
  const row = document.createElement('div');
  row.className = 'swatch-row';
  const lbl = document.createElement('span');
  lbl.className = 'swatch-label';
  lbl.textContent = label;
  row.appendChild(lbl);
  const strip = document.createElement('div');
  strip.className = 'swatch-strip';
  for (const c of colors) {
    const sw = document.createElement('div');
    sw.className = 'swatch';
    sw.style.background = c.hex;
    sw.title = c.hex;
    strip.appendChild(sw);
  }
  row.appendChild(strip);
  return row;
}

function createSwatchPanel(variant, title) {
  const panel = document.createElement('div');
  panel.className = 'variant-panel';
  panel.style.background = variant.neutrals[0].hex;
  panel.style.color = variant.neutrals[variant.neutrals.length - 1].hex;
  const h = document.createElement('div');
  h.className = 'variant-title';
  h.textContent = title;
  panel.appendChild(h);
  panel.appendChild(createSwatchRow(t('swatch.neutrals'), variant.neutrals));
  panel.appendChild(createSwatchRow(t('swatch.primary'), variant.primary));
  panel.appendChild(createSwatchRow(t('swatch.secondary'), variant.secondary));
  const notifArr = Object.values(variant.notifications);
  panel.appendChild(createSwatchRow(t('swatch.alerts'), notifArr));
  panel.appendChild(createSwatchRow(t('swatch.categories'), variant.categories));
  return panel;
}

/* ══════════════════════════════════════════════════════════════════
   Layout preview rendering (ported from reference app.js)
   ══════════════════════════════════════════════════════════════════ */

function getLayoutColors(variant) {
  const n = variant.neutrals;
  const N = n.length;
  const M = variant.primary.length;
  return {
    pageBg1:   n[0].hex,
    pageBg2:   n[Math.min(2, N - 1)].hex,
    panelBg1:  n[Math.min(1, N - 1)].hex,
    panelBg2:  n[Math.min(3, N - 1)].hex,
    panelEdge: n[Math.min(4, N - 1)].hex,
    fg:        n[Math.max(0, N - 2)].hex,
    muted:     n[Math.floor(N / 2)].hex,
    primary:   variant.primary.map(p => p.hex),
    secondary: variant.secondary.map(s => s.hex),
    M,
  };
}

function _el(tag, cls, styles) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (styles) Object.assign(e.style, styles);
  return e;
}

function createLayoutPanel(variant, title) {
  const c = getLayoutColors(variant);
  const M = c.M;

  const card = _el('div', 'layout-card', {
    background: `linear-gradient(135deg, ${c.pageBg1}, ${c.pageBg2})`,
  });

  const panel = _el('div', 'layout-panel', {
    background: `linear-gradient(180deg, ${c.panelBg1}, ${c.panelBg2})`,
    border: `1px solid ${c.panelEdge}`,
    boxShadow: `0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
  });
  card.appendChild(panel);

  // (a) Gradient-coloured titles side by side
  const titleRow = _el('div', 'layout-title-row');
  const t1 = _el('span', 'layout-title', {
    backgroundImage: `linear-gradient(90deg, ${c.primary[M - 1]}, ${c.primary[0]})`,
  });
  t1.textContent = title;
  const t2 = _el('span', 'layout-title', {
    backgroundImage: `linear-gradient(90deg, ${c.secondary[M - 1]}, ${c.secondary[0]})`,
  });
  t2.textContent = title;
  titleRow.append(t1, t2);
  panel.appendChild(titleRow);

  // (b) Primary accent headings
  const hPrim = _el('p', 'layout-heading');
  const hp1 = _el('span', '', { color: c.primary[0] });
  hp1.textContent = `${t('layout.primaryAccent')} 1.`;
  const hp2 = _el('span', '', { color: c.primary[M - 1] });
  hp2.textContent = `${t('layout.primaryAccent')} ${M}.`;
  hPrim.append(hp1, hp2);
  panel.appendChild(hPrim);

  // (c) Secondary accent headings
  const hSec = _el('p', 'layout-heading');
  const hs1 = _el('span', '', { color: c.secondary[0] });
  hs1.textContent = `${t('layout.secondaryAccent')} 1.`;
  const hs2 = _el('span', '', { color: c.secondary[M - 1] });
  hs2.textContent = `${t('layout.secondaryAccent')} ${M}.`;
  hSec.append(hs1, hs2);
  panel.appendChild(hSec);

  // (d) Normal + muted text
  const textLine = _el('p', 'layout-text');
  const tn = _el('span', '', { color: c.fg });
  tn.textContent = t('layout.normalText');
  const tm = _el('span', '', { color: c.muted });
  tm.textContent = t('layout.mutedText');
  textLine.append(tn, tm);
  panel.appendChild(textLine);

  // (e) Button rows (primary + secondary)
  function makeBtnRow(accent) {
    const row = _el('div', 'layout-btn-row');
    const bActive = _el('button', 'layout-btn', {
      background: `linear-gradient(180deg, ${accent[0]}, ${accent[M - 1]})`,
      color: c.pageBg1,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), inset 0 0 8px ${accent[0]}40, 0 2px 4px rgba(0,0,0,0.4)`,
    });
    bActive.textContent = t('layout.active');
    const bFocus = _el('button', 'layout-btn', {
      background: c.panelBg1,
      color: c.fg,
      border: `2px solid ${accent[0]}`,
      boxShadow: `0 0 6px ${accent[0]}50`,
    });
    bFocus.textContent = t('layout.focus');
    const bDefault = _el('button', 'layout-btn', {
      background: `linear-gradient(180deg, ${c.panelBg1}, ${c.panelBg2})`,
      color: c.fg,
      border: `1px solid ${c.panelEdge}`,
      boxShadow: `inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 3px rgba(0,0,0,0.4)`,
    });
    bDefault.textContent = t('layout.default');
    const bDisabled = _el('button', 'layout-btn', {
      background: c.pageBg2,
      color: c.muted,
      border: `1px solid ${c.panelEdge}80`,
      boxShadow: `inset 0 1px 2px rgba(0,0,0,0.3)`,
      opacity: '0.7',
    });
    bDisabled.textContent = t('layout.disabled');
    row.append(bActive, bFocus, bDefault, bDisabled);
    return row;
  }
  panel.appendChild(makeBtnRow(c.primary));
  panel.appendChild(makeBtnRow(c.secondary));

  // (f) Progress-bar slider
  const sliderWrap = _el('div', 'layout-slider');
  const track = _el('div', 'layout-slider-track', {
    background: c.pageBg1,
  });
  const fill = _el('div', 'layout-slider-fill', {
    width: '60%',
    background: `linear-gradient(90deg, ${c.primary[0]}, ${c.primary[M - 1]})`,
    boxShadow: `0 0 4px ${c.primary[0]}40`,
  });
  const thumb = _el('div', 'layout-slider-thumb', {
    left: '60%',
    background: `radial-gradient(circle at 40% 35%, ${c.primary[0]}, ${c.primary[M - 1]})`,
    boxShadow: `0 1px 4px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.15)`,
  });
  sliderWrap.append(track, fill, thumb);
  panel.appendChild(sliderWrap);

  // (g) Glowing text
  const glow = _el('p', 'layout-glow');
  const g1 = _el('span', '', {
    color: c.primary[0],
    textShadow: `0 0 10px ${c.primary[0]}, 0 0 20px ${c.primary[0]}60`,
  });
  g1.textContent = `${t('layout.primaryAccent')} 1.`;
  const g2 = _el('span', '', {
    color: c.secondary[0],
    textShadow: `0 0 10px ${c.secondary[0]}, 0 0 20px ${c.secondary[0]}60`,
  });
  g2.textContent = `${t('layout.secondaryAccent')} 1.`;
  glow.append(g1, g2);
  panel.appendChild(glow);

  return card;
}

/* ══════════════════════════════════════════════════════════════════
   Refresh: generate palette and render variant grid
   ══════════════════════════════════════════════════════════════════ */

function variantTitle(key) {
  const map = {
    darkTinted:     'variant.darkTinted',
    lightTinted:    'variant.lightTinted',
    darkAccented:   'variant.darkAccented',
    lightAccented:  'variant.lightAccented',
  };
  return t(map[key] || key);
}
const VARIANT_ORDER = ['darkTinted', 'lightTinted', 'darkAccented', 'lightAccented'];
const variantGrid = document.getElementById('variantGrid');

function refreshPalette() {
  const p = editedPalettes[currentPalette];
  if (!p) return;

  const result = createPalette({
    main: p.main,
    seeds: p.accents,
    N: paramN,
    M: paramM,
    L: paramL,
    lmin: paramLmin,
    lmax: paramLmax,
    accentLight: paramAccentLight,
    accentDark: paramAccentDark,
    alertL: paramAlertL,
    categoryL: paramCategoryL,
    sigmoid: paramSigmoid,
    mode: paramMode,
    power: paramPower,
  });
  currentPaletteResult = result;

  // Apply root tokens from darkTinted for left panel
  applyRootTokens(result.darkTinted);

  // Render variant grid
  if (!variantGrid) return;
  variantGrid.innerHTML = '';
  for (const key of VARIANT_ORDER) {
    const variant = result[key];
    const title = variantTitle(key);
    if (previewMode === 'layout') {
      variantGrid.appendChild(createLayoutPanel(variant, title));
    } else {
      variantGrid.appendChild(createSwatchPanel(variant, title));
    }
  }
}

/* ══════════════════════════════════════════════════════════════════
   Wire palette segmented control
   ══════════════════════════════════════════════════════════════════ */

let _currentLang = "en";
const paletteSelect = document.getElementById("paletteSelect");

function _paletteNames(lang) {
  return PALETTE_ORDER.map((key) => {
    const i18n = PALETTE_I18N[key];
    return (i18n && i18n.gems && i18n.gems[lang]) || PALETTES[key].gems;
  });
}

let _nameToKey = {};
function _rebuildNameToKey(lang) {
  _nameToKey = {};
  PALETTE_ORDER.forEach((key) => {
    const i18n = PALETTE_I18N[key];
    const display = (i18n && i18n.gems && i18n.gems[lang]) || PALETTES[key].gems;
    _nameToKey[display] = key;
  });
}

function _initPaletteSelect(lang) {
  if (!paletteSelect) return;
  _rebuildNameToKey(lang);
  const names = _paletteNames(lang);
  paletteSelect.setAttribute("keys", JSON.stringify(PALETTE_ORDER));
  paletteSelect.setAttribute("values", JSON.stringify(names));
  paletteSelect.setAttribute("value", currentPalette);
}

_initPaletteSelect(_currentLang);

if (paletteSelect) {
  paletteSelect.addEventListener("change", (e) => {
    const key = e.detail?.value;
    if (key && key !== currentPalette && PALETTES[key]) {
      currentPalette = key;
      refreshPalette();
      buildPickers();
      updateMetaFromPalette();
    }
  });
}

/* ══════════════════════════════════════════════════════════════════
   Wire language toggle
   ══════════════════════════════════════════════════════════════════ */

const langSelect = document.getElementById("langSelect");
const _langMap = { en: "en", es: "es", it: "it", fr: "fr", de: "de", ru: "ru", ko: "ko", ja: "ja", zh: "zh" };
if (langSelect) {
  langSelect.addEventListener("change", (e) => {
    const raw = (e.detail?.value || "EN").toLowerCase();
    const lang = _langMap[raw] || raw;
    _currentLang = lang;
    loadLanguage(lang).then(() => refreshPalette());
    _initPaletteSelect(lang);
    updateMetaFromPalette();
    _applyFont();
  });
}

/* ══════════════════════════════════════════════════════════════════
   Wire font toggle
   ══════════════════════════════════════════════════════════════════ */

let _currentFont = "System";
const _fontMap = {
  "Orbitron":  "'Orbitron', system-ui, sans-serif",
  "Digital-7": "'Seven Segment', monospace",
  "System":    "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};
const _nonLatinLangs = new Set(["ru", "ko", "ja", "zh"]);

function _applyFont() {
  const useSystem = _nonLatinLangs.has(_currentLang) && _currentFont !== "System";
  const value = useSystem ? _fontMap["System"] : (_fontMap[_currentFont] || _fontMap["System"]);
  document.documentElement.style.setProperty("--font-display", value);
}

const fontSelect = document.getElementById("fontSelect");
if (fontSelect) {
  fontSelect.addEventListener("change", (e) => {
    _currentFont = e.detail?.value || "System";
    _applyFont();
  });
}

/* ══════════════════════════════════════════════════════════════════
   Wire arc mode buttons
   ══════════════════════════════════════════════════════════════════ */

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    paramMode = btn.dataset.mode;
    // Show/hide power slider
    const powerLabel = document.getElementById('power-label');
    const powerSlider = document.getElementById('slider-power');
    const powerVal = document.getElementById('power-value');
    const show = paramMode === 'superellipse';
    if (powerLabel) powerLabel.style.opacity = show ? '' : '0.3';
    if (powerSlider) powerSlider.disabled = !show;
    if (powerVal) powerVal.style.opacity = show ? '' : '0.3';
    refreshPalette();
  });
});

/* ══════════════════════════════════════════════════════════════════
   Wire generation sliders
   ══════════════════════════════════════════════════════════════════ */

function wireGenSlider(sliderId, valueId, setter, format) {
  const slider = document.getElementById(sliderId);
  const valEl = document.getElementById(valueId);
  if (!slider) return;
  slider.addEventListener('input', () => {
    const v = parseFloat(slider.value);
    setter(v);
    if (valEl) valEl.textContent = format ? format(v) : v;
    refreshPalette();
  });
}

wireGenSlider('slider-n',            'n-value',            v => { paramN = Math.round(v); });
wireGenSlider('slider-m',            'm-value',            v => { paramM = Math.round(v); });
wireGenSlider('slider-l',            'l-value',            v => { paramL = Math.round(v); });
wireGenSlider('slider-lmin',         'lmin-value',         v => { paramLmin = v; },         v => v.toFixed(2));
wireGenSlider('slider-lmax',         'lmax-value',         v => { paramLmax = v; },         v => v.toFixed(2));
wireGenSlider('slider-power',        'power-value',        v => { paramPower = v; },        v => v.toFixed(1));
wireGenSlider('slider-sigmoid',      'sigmoid-value',      v => { paramSigmoid = v; },      v => v.toFixed(1));
wireGenSlider('slider-accent-light', 'accent-light-value', v => { paramAccentLight = v; },  v => v.toFixed(2));
wireGenSlider('slider-accent-dark',  'accent-dark-value',  v => { paramAccentDark = v; },   v => v.toFixed(2));
wireGenSlider('slider-alert-l',      'alert-l-value',      v => { paramAlertL = v; },       v => v.toFixed(2));
wireGenSlider('slider-category-l',   'category-l-value',   v => { paramCategoryL = v; },    v => v.toFixed(2));

/* ══════════════════════════════════════════════════════════════════
   Wire toggle buttons
   ══════════════════════════════════════════════════════════════════ */

// Preview mode
const btnSwatches = document.getElementById('btn-preview-swatches');
const btnLayout   = document.getElementById('btn-preview-layout');
if (btnSwatches && btnLayout) {
  btnSwatches.addEventListener('click', () => {
    btnSwatches.classList.add('active');
    btnLayout.classList.remove('active');
    previewMode = 'swatches';
    refreshPalette();
  });
  btnLayout.addEventListener('click', () => {
    btnLayout.classList.add('active');
    btnSwatches.classList.remove('active');
    previewMode = 'layout';
    refreshPalette();
  });
}

/* ══════════════════════════════════════════════════════════════════
   Dynamic colour pickers
   ══════════════════════════════════════════════════════════════════ */

const pickerContainer = document.getElementById("pickerContainer");

function buildPickers() {
  if (!pickerContainer) return;
  const p = editedPalettes[currentPalette];
  if (!p) return;

  const count = 1 + p.accents.length;
  const perRow = Math.min(count, 4);
  const maxSize = Math.min(140, Math.floor((488 - (perRow - 1) * 12) / perRow));
  const size = Math.max(80, maxSize);

  pickerContainer.innerHTML = "";

  function _col(label, hex, onChange) {
    const col = document.createElement("div");
    col.className = "picker-col";

    const picker = document.createElement("color-picker");
    picker.setAttribute("size", String(size));
    picker.setAttribute("no-input", "");
    picker.setAttribute("value", hex);
    col.appendChild(picker);

    const row = document.createElement("div");
    row.className = "picker-label-row";
    const lbl = document.createElement("span");
    lbl.className = "swatch-label";
    lbl.textContent = label;
    const swatch = document.createElement("div");
    swatch.className = "swatch-preview";
    swatch.style.background = hex;
    const hexInput = document.createElement("input");
    hexInput.className = "hex-input";
    hexInput.type = "text";
    hexInput.maxLength = 7;
    hexInput.value = hex;
    row.appendChild(lbl);
    row.appendChild(swatch);
    row.appendChild(hexInput);
    col.appendChild(row);

    picker.addEventListener("change", (e) => {
      const v = e.detail?.value;
      if (v) { hexInput.value = v; swatch.style.background = v; onChange(v); }
    });
    hexInput.addEventListener("change", () => {
      const v = hexInput.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        picker.setAttribute("value", v);
        swatch.style.background = v;
        onChange(v);
      }
    });

    return col;
  }

  pickerContainer.appendChild(
    _col("Main", p.main, (hex) => { p.main = hex; refreshPalette(); })
  );

  p.accents.forEach((accHex, i) => {
    const label = `Acc${i + 1}`;
    pickerContainer.appendChild(
      _col(label, accHex, (hex) => { p.accents[i] = hex; refreshPalette(); })
    );
  });
}

function updateMetaFromPalette() {
  const p = editedPalettes[currentPalette];
  if (!p) return;
  const i18n = PALETTE_I18N[currentPalette];
  const lang = _currentLang;
  const g = document.getElementById("metaGems");
  const n = document.getElementById("metaNatural");
  const f = document.getElementById("metaFlower");
  const b = document.getElementById("metaBeverage");
  if (g) g.value = (i18n && i18n.gems && i18n.gems[lang]) || p.gems || "";
  if (n) n.value = (i18n && i18n.natural && i18n.natural[lang]) || p.natural || "";
  if (f) f.value = (i18n && i18n.flower && i18n.flower[lang]) || p.flower || "";
  if (b) b.value = (i18n && i18n.beverage && i18n.beverage[lang]) || p.beverage || "";
}

/* ══════════════════════════════════════════════════════════════════
   Wire Save / Reset / Export
   ══════════════════════════════════════════════════════════════════ */

const btnSave = document.getElementById("btnSavePalette");
const btnReset = document.getElementById("btnResetPalette");
const btnExportPalette = document.getElementById("btnExportPalette");

if (btnSave) {
  btnSave.addEventListener("click", () => {
    const p = editedPalettes[currentPalette];
    const g = document.getElementById("metaGems");
    const n = document.getElementById("metaNatural");
    const f = document.getElementById("metaFlower");
    const b = document.getElementById("metaBeverage");
    if (g) p.gems = g.value;
    if (n) p.natural = n.value;
    if (f) p.flower = f.value;
    if (b) p.beverage = b.value;
    _initPaletteSelect(_currentLang);
  });
}

if (btnReset) {
  btnReset.addEventListener("click", () => {
    const orig = PALETTES[currentPalette];
    if (!orig) return;
    editedPalettes[currentPalette] = JSON.parse(JSON.stringify(orig));
    buildPickers();
    updateMetaFromPalette();
    refreshPalette();
    _initPaletteSelect(_currentLang);
  });
}

if (btnExportPalette) {
  btnExportPalette.addEventListener("click", () => {
    if (currentPaletteResult) {
      downloadPaletteJson(currentPaletteResult, `palette-${currentPalette}.json`);
    }
  });
}

/* ══════════════════════════════════════════════════════════════════
   Initial render
   ══════════════════════════════════════════════════════════════════ */
refreshPalette();
buildPickers();
updateMetaFromPalette();
await loadLanguage("en");
