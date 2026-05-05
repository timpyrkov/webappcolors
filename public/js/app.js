/**
 * app.js — Boot script.
 * Wires global controls to the palette engine and 2×2 variant preview.
 */
import { PALETTES, PALETTE_ORDER, DEFAULT_PALETTE, PALETTE_I18N } from "./palettes.js";
import { createPalette, downloadPaletteJson } from "./palette_tools.js";
import { loadLanguage, t } from "./i18n.js";
import { createSynthwaveCanvas } from "./animation.js";

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
let previewMode = 'web';
let currentPaletteResult = null;
let synthwaveInstance = null;

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
   Mobile mockup rendering
   ══════════════════════════════════════════════════════════════════ */

function createMobilePanel(variant) {
  const n = variant.neutrals;
  const N = n.length;
  const M = variant.primary.length;
  const pri = variant.primary.map(p => p.hex);
  const sec = variant.secondary.map(s => s.hex);
  const cat = variant.categories.map(c => c.hex);
  const notif = variant.notifications;

  const bg     = n[0].hex;
  const bg2    = n[Math.min(1, N-1)].hex;
  const bg3    = n[Math.min(2, N-1)].hex;
  const bg4    = n[Math.min(3, N-1)].hex;
  const border = n[Math.min(4, N-1)].hex;
  const muted  = n[Math.floor(N * 0.5)].hex;
  const fg2    = n[Math.max(0, N-3)].hex;
  const fg     = n[N-1].hex;

  // Gradient references (matching web layout style)
  const screenGrad = `linear-gradient(160deg, ${bg}, ${bg3})`;
  const cardGrad   = `linear-gradient(180deg, ${bg2}, ${bg4})`;

  const container = _el('div', 'mobile-grid');

  // ── Phone 1: Dashboard / Activity ──
  const phone1 = _buildPhone(screenGrad, border, muted);
  const screen1 = phone1.querySelector('.phone-screen');
  screen1.style.background = screenGrad;
  screen1.style.color = fg;

  // Header
  const hdr1 = _el('div', 'phone-header');
  const hTitle = _el('span', 'phone-title');
  hTitle.textContent = t('mobile.dashboard');
  hTitle.style.color = fg;
  const hSub = _el('span', 'phone-subtitle');
  hSub.textContent = t('mobile.today');
  hSub.style.color = muted;
  hdr1.append(hTitle, hSub);
  screen1.appendChild(hdr1);

  // Stat cards row
  const row1 = _el('div', 'phone-row');
  row1.appendChild(_miniStatCard(cardGrad, pri[0], fg, t('mobile.steps'), '8,420', t('mobile.stepsUnit'), border));
  row1.appendChild(_miniStatCard(cardGrad, sec[0], fg, t('mobile.calories'), '524', t('mobile.kcal'), border));
  screen1.appendChild(row1);

  // Weekly bar chart card
  const chartCard = _el('div', 'phone-card', { background: cardGrad, border: `1px solid ${border}` });
  const chartTitle = _el('div', 'phone-card-title');
  chartTitle.textContent = t('mobile.weeklyActivity');
  chartTitle.style.color = fg2;
  chartCard.appendChild(chartTitle);

  const bars = _el('div', 'phone-bar-chart');
  const dayKeys = ['day.mon','day.tue','day.wed','day.thu','day.fri','day.sat','day.sun'];
  const heights = [65, 80, 45, 90, 70, 55, 40];
  for (let i = 0; i < 7; i++) {
    const bar = _el('div', 'phone-bar');
    bar.style.height = `${heights[i]}%`;
    bar.style.background = `linear-gradient(180deg, ${pri[0]}, ${pri[M-1]})`;
    bar.style.opacity = i === 3 ? '1' : '0.6';
    bars.appendChild(bar);
  }
  chartCard.appendChild(bars);
  const labels = _el('div', 'phone-bar-labels');
  for (const dk of dayKeys) {
    const lbl = _el('span');
    lbl.textContent = t(dk).substring(0, 2);
    lbl.style.color = muted;
    labels.appendChild(lbl);
  }
  chartCard.appendChild(labels);
  screen1.appendChild(chartCard);

  // Progress ring card — dimmed secondary accent gradient
  const secGrad = `linear-gradient(135deg, color-mix(in srgb, ${sec[M-1]} 70%, ${bg}), color-mix(in srgb, ${sec[0]} 70%, ${bg}))`;
  const ringCard = _el('div', 'phone-card', { background: secGrad, border: `1px solid ${border}` });
  const ringTitle = _el('div', 'phone-card-title');
  ringTitle.textContent = t('mobile.dailyGoal');
  ringTitle.style.color = fg;
  ringCard.appendChild(ringTitle);
  ringCard.appendChild(_progressRing(72, fg, sec[M-1], fg));
  screen1.appendChild(ringCard);

  // Workout streak + Nutrition macros row
  const extraRow = _el('div', 'phone-row');
  const streakCard = _el('div', 'phone-mini-card', { background: cardGrad, border: `1px solid ${border}` });
  const streakTitle = _el('div', 'phone-mini-title');
  streakTitle.textContent = t('mobile.streak');
  streakTitle.style.color = pri[0];
  const streakVal = _el('div', 'phone-mini-value');
  streakVal.textContent = '14';
  streakVal.style.color = fg;
  const streakSub = _el('div', 'phone-mini-sub');
  streakSub.textContent = t('mobile.streakDays');
  streakCard.append(streakTitle, streakVal, streakSub);

  const nutriCard = _el('div', 'phone-mini-card', { background: cardGrad, border: `1px solid ${border}` });
  const nutriTitle = _el('div', 'phone-mini-title');
  nutriTitle.textContent = t('mobile.nutrition');
  nutriTitle.style.color = sec[0];
  const macros = _el('div', 'phone-macros');
  const macroData = [
    { label: t('mobile.protein'), pct: 35, color: pri[0] },
    { label: t('mobile.carbs'), pct: 45, color: sec[0] },
    { label: t('mobile.fats'), pct: 20, color: cat[0] || muted },
  ];
  for (const m of macroData) {
    const row = _el('div', 'phone-macro-row');
    const lbl = _el('span');
    lbl.textContent = m.label;
    lbl.style.color = muted;
    lbl.style.fontSize = '7px';
    const barOuter = _el('div', 'phone-macro-bar', { background: bg3 });
    const barInner = _el('div', '', { width: `${m.pct}%`, height: '100%', borderRadius: '2px', background: m.color });
    barOuter.appendChild(barInner);
    row.append(lbl, barOuter);
    macros.appendChild(row);
  }
  nutriCard.append(nutriTitle, macros);
  extraRow.append(streakCard, nutriCard);
  screen1.appendChild(extraRow);

  // Hydration + Sleep Score row
  const extraRow2 = _el('div', 'phone-row');
  const hydroCard = _el('div', 'phone-mini-card', { background: cardGrad, border: `1px solid ${border}` });
  const hydroTitle = _el('div', 'phone-mini-title');
  hydroTitle.textContent = t('mobile.hydration');
  hydroTitle.style.color = sec[0];
  const hydroVal = _el('div', 'phone-mini-value');
  hydroVal.textContent = '2.1';
  hydroVal.style.color = fg;
  const hydroSub = _el('div', 'phone-mini-sub');
  hydroSub.textContent = 'L';
  hydroCard.append(hydroTitle, hydroVal, hydroSub);

  const sleepScoreCard = _el('div', 'phone-mini-card', { background: cardGrad, border: `1px solid ${border}` });
  const sleepScTitle = _el('div', 'phone-mini-title');
  sleepScTitle.textContent = t('mobile.sleep');
  sleepScTitle.style.color = pri[Math.min(1, M-1)];
  const sleepScVal = _el('div', 'phone-mini-value');
  sleepScVal.textContent = '87';
  sleepScVal.style.color = fg;
  const sleepScSub = _el('div', 'phone-mini-sub');
  sleepScSub.textContent = '%';
  sleepScoreCard.append(sleepScTitle, sleepScVal, sleepScSub);

  extraRow2.append(hydroCard, sleepScoreCard);
  screen1.appendChild(extraRow2);

  // Bottom nav
  screen1.appendChild(_bottomNav(bg2, pri[0], muted, fg));

  container.appendChild(phone1);

  // ── Phone 2: Activity Detail / Sleep ──
  const phone2 = _buildPhone(screenGrad, border, muted);
  const screen2 = phone2.querySelector('.phone-screen');
  screen2.style.background = screenGrad;
  screen2.style.color = fg;

  // Header
  const hdr2 = _el('div', 'phone-header');
  const h2Title = _el('span', 'phone-title');
  h2Title.textContent = t('mobile.wellness');
  h2Title.style.color = fg;
  const h2Sub = _el('span', 'phone-subtitle');
  h2Sub.textContent = t('mobile.thisWeek');
  h2Sub.style.color = muted;
  hdr2.append(h2Title, h2Sub);
  screen2.appendChild(hdr2);

  // Category pills
  const pills = _el('div', 'phone-pill-row');
  const pillLabels = [t('mobile.sleep'), t('mobile.heart'), t('mobile.hydration')];
  for (let i = 0; i < 3; i++) {
    const pill = _el('span', 'phone-pill');
    pill.textContent = pillLabels[i];
    pill.style.background = i === 0 ? pri[0] : bg3;
    pill.style.color = i === 0 ? bg : fg2;
    pill.style.border = i === 0 ? 'none' : `1px solid ${border}`;
    pills.appendChild(pill);
  }
  screen2.appendChild(pills);

  // Sleep stat card
  const sleepCard = _el('div', 'phone-card', { background: cardGrad, border: `1px solid ${border}` });
  const sleepTitle = _el('div', 'phone-card-title');
  sleepTitle.textContent = t('mobile.avgSleep');
  sleepTitle.style.color = fg2;
  sleepCard.appendChild(sleepTitle);
  const sleepStat = _el('div', 'phone-stat-row');
  const sv = _el('span', 'phone-stat-value');
  sv.textContent = '7h 24m';
  sv.style.color = sec[0];
  const su = _el('span', 'phone-stat-unit');
  su.textContent = t('mobile.perNight');
  su.style.color = muted;
  sleepStat.append(sv, su);
  sleepCard.appendChild(sleepStat);

  // Mini sleep bar chart (past 7 nights)
  const sleepBars = _el('div', 'phone-bar-chart');
  const sleepH = [80, 70, 95, 60, 85, 75, 90];
  for (let i = 0; i < 7; i++) {
    const bar = _el('div', 'phone-bar');
    bar.style.height = `${sleepH[i]}%`;
    bar.style.background = `linear-gradient(180deg, ${sec[0]}, ${sec[M-1]})`;
    bar.style.opacity = i === 6 ? '1' : '0.55';
    sleepBars.appendChild(bar);
  }
  sleepCard.appendChild(sleepBars);
  screen2.appendChild(sleepCard);

  // Activity list items
  const activities = [
    { icon: '♥', label: t('mobile.heartRate'), value: '72 bpm', color: notif.error.hex },
    { icon: '💧', label: t('mobile.water'), value: '1.8 L', color: notif.message.hex },
    { icon: '🔥', label: t('mobile.activeMin'), value: '45 min', color: notif.warning.hex },
  ];
  const priGrad = `linear-gradient(135deg, color-mix(in srgb, ${pri[M-1]} 70%, ${bg}), color-mix(in srgb, ${pri[0]} 70%, ${bg}))`;
  for (const act of activities) {
    const item = _el('div', 'phone-list-item', { background: priGrad, border: `1px solid ${border}` });
    const icon = _el('div', 'phone-list-icon', { background: act.color + '35', color: act.color });
    icon.textContent = act.icon;
    const text = _el('div', 'phone-list-text');
    const primary = _el('span', 'phone-list-primary');
    primary.textContent = act.label;
    primary.style.color = fg;
    const secondary = _el('span', 'phone-list-secondary');
    secondary.textContent = act.value;
    secondary.style.color = fg2;
    text.append(primary, secondary);
    item.append(icon, text);
    screen2.appendChild(item);
  }

  // Mindfulness card
  const mindCard = _el('div', 'phone-card', { background: cardGrad, border: `1px solid ${border}` });
  const mindTitle = _el('div', 'phone-card-title');
  mindTitle.textContent = t('mobile.mindfulness');
  mindTitle.style.color = fg2;
  mindCard.appendChild(mindTitle);
  const mindRow = _el('div', 'phone-row');
  mindRow.style.marginTop = '4px';
  const mindItems = [
    { label: t('mobile.meditation'), value: '15 min', color: sec[0] },
    { label: t('mobile.breathwork'), value: '8 min', color: pri[0] },
    { label: t('mobile.mood'), value: '8.2', color: cat[0] || muted },
  ];
  for (const mi of mindItems) {
    const chip = _el('div', 'phone-mind-chip', { background: bg3, border: `1px solid ${border}` });
    const cv = _el('div', 'phone-mind-val');
    cv.textContent = mi.value;
    cv.style.color = mi.color;
    const cl = _el('div', 'phone-mind-label');
    cl.textContent = mi.label;
    cl.style.color = muted;
    chip.append(cv, cl);
    mindRow.appendChild(chip);
  }
  mindCard.appendChild(mindRow);
  screen2.appendChild(mindCard);

  // Goals row
  const goalRow = _el('div', 'phone-row');
  const stepsGoal = _el('div', 'phone-mini-card', { background: cardGrad, border: `1px solid ${border}` });
  const sgTitle = _el('div', 'phone-mini-title');
  sgTitle.textContent = t('mobile.steps');
  sgTitle.style.color = sec[Math.min(1, M-1)];
  const sgVal = _el('div', 'phone-mini-value');
  sgVal.textContent = '10k';
  sgVal.style.color = fg;
  const sgSub = _el('div', 'phone-mini-sub');
  sgSub.textContent = t('mobile.dailyGoal').toLowerCase();
  stepsGoal.append(sgTitle, sgVal, sgSub);

  const calGoal = _el('div', 'phone-mini-card', { background: cardGrad, border: `1px solid ${border}` });
  const cgTitle = _el('div', 'phone-mini-title');
  cgTitle.textContent = t('mobile.calories');
  cgTitle.style.color = pri[Math.min(1, M-1)];
  const cgVal = _el('div', 'phone-mini-value');
  cgVal.textContent = '650';
  cgVal.style.color = fg;
  const cgSub = _el('div', 'phone-mini-sub');
  cgSub.textContent = t('mobile.kcal');
  calGoal.append(cgTitle, cgVal, cgSub);

  goalRow.append(stepsGoal, calGoal);
  screen2.appendChild(goalRow);

  // Bottom nav
  screen2.appendChild(_bottomNav(bg2, pri[0], muted, fg));

  container.appendChild(phone2);
  return container;
}

function _buildPhone(bg, border, notchColor) {
  const frame = _el('div', 'phone-frame', { background: bg, borderColor: border });
  const notch = _el('div', 'phone-notch', { background: notchColor });
  const screen = _el('div', 'phone-screen');
  frame.append(notch, screen);
  return frame;
}

function _miniStatCard(bg, accentColor, fg, title, value, unit, border) {
  const card = _el('div', 'phone-mini-card', { background: bg, border: `1px solid ${border}` });
  const titleEl = _el('div', 'phone-mini-title');
  titleEl.textContent = title;
  titleEl.style.color = accentColor;
  const valEl = _el('div', 'phone-mini-value');
  valEl.textContent = value;
  valEl.style.color = fg;
  const subEl = _el('div', 'phone-mini-sub');
  subEl.textContent = unit;
  card.append(titleEl, valEl, subEl);
  return card;
}

function _progressRing(percent, accentColor, trackColor, textColor) {
  const r = 28, cx = 35, cy = 35;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'phone-progress-ring');
  svg.setAttribute('viewBox', '0 0 70 70');
  svg.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="${r}" class="phone-ring-bg" stroke="${trackColor}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" class="phone-ring-fill" stroke="${accentColor}"
      stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
      transform="rotate(-90 ${cx} ${cy})"/>
    <text x="${cx}" y="${cy}" class="phone-ring-text" fill="${textColor}">${percent}%</text>
  `;
  return svg;
}

function _bottomNav(bgColor, activeColor, mutedColor, fgColor) {
  const nav = _el('div', 'phone-nav');
  const items = [
    { icon: '⌂', label: 'Home', active: true },
    { icon: '♥', label: 'Health', active: false },
    { icon: '◎', label: 'Track', active: false },
    { icon: '⚙', label: 'Settings', active: false },
  ];
  for (const it of items) {
    const item = _el('div', `phone-nav-item${it.active ? ' active' : ''}`);
    const dot = _el('div', 'phone-nav-dot');
    dot.textContent = it.icon;
    dot.style.color = it.active ? activeColor : mutedColor;
    if (it.active) dot.style.background = activeColor + '20';
    const lbl = _el('span');
    lbl.textContent = it.label;
    lbl.style.color = it.active ? fgColor : mutedColor;
    item.append(dot, lbl);
    nav.appendChild(item);
  }
  return nav;
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

  // If procedural is running and palette just changed, update colors only
  if (previewMode === 'procedural' && synthwaveInstance) {
    synthwaveInstance.update(result.darkTinted);
    return;
  }

  // Stop synthwave if switching away
  if (synthwaveInstance) {
    synthwaveInstance.stop();
    synthwaveInstance = null;
  }

  variantGrid.innerHTML = '';
  variantGrid.classList.remove('mobile-mode', 'procedural-mode');

  if (previewMode === 'mobile') {
    variantGrid.classList.add('mobile-mode');
    variantGrid.appendChild(createMobilePanel(result.darkTinted));
  } else if (previewMode === 'procedural') {
    variantGrid.classList.add('procedural-mode');
    synthwaveInstance = createSynthwaveCanvas(variantGrid, result.darkTinted);
    synthwaveInstance.start();
  } else {
    for (const key of VARIANT_ORDER) {
      const variant = result[key];
      const title = variantTitle(key);
      if (previewMode === 'web') {
        variantGrid.appendChild(createLayoutPanel(variant, title));
      } else {
        variantGrid.appendChild(createSwatchPanel(variant, title));
      }
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
const btnWeb        = document.getElementById('btn-preview-web');
const btnMobile     = document.getElementById('btn-preview-mobile');
const btnProcedural = document.getElementById('btn-preview-procedural');
const btnSwatches   = document.getElementById('btn-preview-swatches');
const _previewBtns  = [btnWeb, btnMobile, btnProcedural, btnSwatches].filter(Boolean);
function _setPreviewMode(mode) {
  previewMode = mode;
  _previewBtns.forEach(b => b.classList.remove('active'));
  if (mode === 'web' && btnWeb)                  btnWeb.classList.add('active');
  else if (mode === 'mobile' && btnMobile)       btnMobile.classList.add('active');
  else if (mode === 'procedural' && btnProcedural) btnProcedural.classList.add('active');
  else if (mode === 'swatches' && btnSwatches)   btnSwatches.classList.add('active');
  refreshPalette();
}
if (btnWeb)        btnWeb.addEventListener('click', () => _setPreviewMode('web'));
if (btnMobile)     btnMobile.addEventListener('click', () => _setPreviewMode('mobile'));
if (btnProcedural) btnProcedural.addEventListener('click', () => _setPreviewMode('procedural'));
if (btnSwatches)   btnSwatches.addEventListener('click', () => _setPreviewMode('swatches'));

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
  btnSave.addEventListener("click", async () => {
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

    try {
      const resp = await fetch("/api/save-palette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: currentPalette,
          main: p.main,
          accents: p.accents,
          gems: p.gems,
          natural: p.natural,
          flower: p.flower,
          beverage: p.beverage,
        }),
      });
      const data = await resp.json();
      if (!data.ok) console.error("Save failed:", data.error);
    } catch (err) {
      console.error("Save request failed:", err);
    }
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

const btnExportModules = document.getElementById("btnExportModules");
if (btnExportModules) {
  btnExportModules.addEventListener("click", () => {
    window.location.href = "/api/export-modules";
  });
}

/* ══════════════════════════════════════════════════════════════════
   Initial render
   ══════════════════════════════════════════════════════════════════ */
await loadLanguage("en");
refreshPalette();
buildPickers();
updateMetaFromPalette();
