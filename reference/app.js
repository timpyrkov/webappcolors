import { hexToHsl, getExcolorLightness } from './color_tools.js';
import { createPalette, downloadPaletteJson } from './palette_tools.js';

const ChartJS = window.Chart;

/* ---- State ---- */

let mode = 'raw';
let paramN = 12;
let paramM = 5;
let paramL = 5;
let paramLmin = 0.05;
let paramLmax = 0.95;
let paramPower = 1.5;
let paramSigmoid = 3.0;
let paramAccentLight = 0.55;
let paramAccentDark = 0.45;
let paramAlertL = 0.55;
let paramCategoryL = 0.55;
let paramExpand = false;
let previewMode = 'swatches';
let rawPalette = null;
let initData = null;
let currentPalette = null;
const charts = {};

/* ---- Data loading ---- */

async function loadRawPalette() {
    const res = await fetch('raw.json');
    const data = await res.json();
    return data.gruvbox;
}

async function loadInitData() {
    const res = await fetch('init.json');
    const data = await res.json();
    return data.gruvbox;
}

/* ---- Raw mode parsing ---- */

function parseRawNeutrals(palette) {
    const neutrals = [];
    for (let i = 1; i <= 15; i++) {
        const key = `--neutral-${i}`;
        const hex = palette[key];
        const [H, S] = hexToHsl(hex);
        const L = getExcolorLightness(hex);
        neutrals.push({ id: i, label: `n${i}`, hex, H, S, L });
    }
    return neutrals;
}

function parseRawColors(palette) {
    const names = ['red', 'orange', 'yellow', 'green', 'aqua', 'blue', 'purple'];
    const sequences = {};
    for (const name of names) {
        sequences[name] = [];
        for (let i = 1; i <= 3; i++) {
            const key = `--${name}-${i}`;
            const hex = palette[key];
            const [H, S] = hexToHsl(hex);
            const L = getExcolorLightness(hex);
            const shortLabel = name.charAt(0).toUpperCase() + i;
            sequences[name].push({ id: i, label: shortLabel, hex, H, S, L });
        }
    }
    return { names, sequences };
}

/* ---- Chart helpers ---- */

const GRID_COLOR = 'rgba(168,153,132,0.15)';
const TICK_COLOR = '#a89984';
const TITLE_COLOR = '#ebdbb2';

function scaleOpts(xLabel, yLabel) {
    return {
        x: {
            title: { display: true, text: xLabel, color: TITLE_COLOR, font: { size: 12 } },
            ticks: { color: TICK_COLOR },
            grid: { color: GRID_COLOR },
        },
        y: {
            title: { display: true, text: yLabel, color: TITLE_COLOR, font: { size: 12 } },
            ticks: { color: TICK_COLOR },
            grid: { color: GRID_COLOR },
        },
    };
}

/* ---- Raw-mode chart creation ---- */

function makeScatterChart(canvasId, title, data, xLabel, yLabel, labelFn) {
    const datasets = Array.isArray(data) ? data : [data];
    return new ChartJS(document.getElementById(canvasId), {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: title, color: TITLE_COLOR, font: { size: 13 } },
                legend: { display: datasets.length > 1, labels: { color: TICK_COLOR, boxWidth: 12, font: { size: 10 } } },
                datalabels: {
                    color: '#d5c4a1',
                    font: { size: 9, family: 'monospace' },
                    anchor: 'end', align: 'top', offset: 2,
                    formatter: labelFn || (() => ''),
                },
            },
            scales: scaleOpts(xLabel, yLabel),
        },
    });
}

/* ---- Swatch rendering (generated modes) ---- */

function createSwatchRow(items, rowLabel) {
    const row = document.createElement('div');
    row.className = 'swatch-row';
    const lbl = document.createElement('span');
    lbl.className = 'swatch-label';
    lbl.textContent = rowLabel;
    row.appendChild(lbl);
    const strip = document.createElement('div');
    strip.className = 'swatch-strip';
    for (const item of items) {
        const sw = document.createElement('div');
        sw.className = 'swatch';
        sw.style.backgroundColor = item.hex;
        sw.title = `${item.label}: ${item.hex}`;
        strip.appendChild(sw);
    }
    row.appendChild(strip);
    return row;
}

function createVariantPanel(variant, title) {
    const panel = document.createElement('div');
    panel.className = 'variant-panel';
    const h = document.createElement('h3');
    h.className = 'variant-title';
    h.textContent = title;
    panel.appendChild(h);

    panel.appendChild(createSwatchRow(variant.neutrals, 'Neutrals'));
    panel.appendChild(createSwatchRow(variant.primary, 'Primary'));
    panel.appendChild(createSwatchRow(variant.secondary, 'Secondary'));

    const notifItems = Object.values(variant.notifications);
    panel.appendChild(createSwatchRow(notifItems, 'Alerts'));

    panel.appendChild(createSwatchRow(variant.categories, 'Categories'));
    return panel;
}

/* ---- Layout preview rendering ---- */

function getLayoutColors(variant) {
    const N = variant.neutrals.length;
    const M = variant.primary.length;
    return {
        pageBg1:   variant.neutrals[0].hex,
        pageBg2:   variant.neutrals[Math.min(2, N - 1)].hex,
        panelBg1:  variant.neutrals[Math.min(1, N - 1)].hex,
        panelBg2:  variant.neutrals[Math.min(3, N - 1)].hex,
        panelEdge: variant.neutrals[Math.min(4, N - 1)].hex,
        fg:        variant.neutrals[Math.max(0, N - 2)].hex,
        muted:     variant.neutrals[Math.floor(N / 2)].hex,
        primary:   variant.primary.map(p => p.hex),
        secondary: variant.secondary.map(s => s.hex),
    };
}

function el(tag, cls, styles) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (styles) Object.assign(e.style, styles);
    return e;
}

function createLayoutPanel(variant, title) {
    const c = getLayoutColors(variant);
    const M = c.primary.length;

    // --- Outer card (page background) ---
    const card = el('div', 'layout-card', {
        background: `linear-gradient(135deg, ${c.pageBg1}, ${c.pageBg2})`,
    });

    // --- Inner panel ---
    const panel = el('div', 'layout-panel', {
        background: `linear-gradient(180deg, ${c.panelBg1}, ${c.panelBg2})`,
        border: `1px solid ${c.panelEdge}`,
        boxShadow: `0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
    });
    card.appendChild(panel);

    // --- (c) Gradient-coloured titles side by side ---
    const titleRow = el('div', 'layout-title-row');
    const t1 = el('span', 'layout-title', {
        backgroundImage: `linear-gradient(90deg, ${c.primary[M - 1]}, ${c.primary[0]})`,
    });
    t1.textContent = title;
    const t2 = el('span', 'layout-title', {
        backgroundImage: `linear-gradient(90deg, ${c.secondary[M - 1]}, ${c.secondary[0]})`,
    });
    t2.textContent = title;
    titleRow.append(t1, t2);
    panel.appendChild(titleRow);

    // --- (d) Primary accent headings ---
    const hPrim = el('p', 'layout-heading');
    const hp1 = el('span', '', { color: c.primary[0] });
    hp1.textContent = 'Primary accent 1.';
    const hp2 = el('span', '', { color: c.primary[M - 1] });
    hp2.textContent = `Primary accent ${M}.`;
    hPrim.append(hp1, hp2);
    panel.appendChild(hPrim);

    // --- (e) Secondary accent headings ---
    const hSec = el('p', 'layout-heading');
    const hs1 = el('span', '', { color: c.secondary[0] });
    hs1.textContent = 'Secondary accent 1.';
    const hs2 = el('span', '', { color: c.secondary[M - 1] });
    hs2.textContent = `Secondary accent ${M}.`;
    hSec.append(hs1, hs2);
    panel.appendChild(hSec);

    // --- (f) Normal + muted text ---
    const textLine = el('p', 'layout-text');
    const tn = el('span', '', { color: c.fg });
    tn.textContent = 'This is normal text.';
    const tm = el('span', '', { color: c.muted });
    tm.textContent = 'This is muted text.';
    textLine.append(tn, tm);
    panel.appendChild(textLine);

    // --- (g) Button rows ---
    function makeBtnRow(accent) {
        const row = el('div', 'layout-btn-row');
        // Active
        const bActive = el('button', 'layout-btn', {
            background: `linear-gradient(180deg, ${accent[0]}, ${accent[M - 1]})`,
            color: c.pageBg1,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), inset 0 0 8px ${accent[0]}40, 0 2px 4px rgba(0,0,0,0.4)`,
        });
        bActive.textContent = 'Active';
        // Hover / Focus
        const bHover = el('button', 'layout-btn', {
            background: c.panelBg1,
            color: c.fg,
            border: `2px solid ${accent[0]}`,
            boxShadow: `0 0 6px ${accent[0]}50`,
        });
        bHover.textContent = 'Focus';
        // Default
        const bDefault = el('button', 'layout-btn', {
            background: `linear-gradient(180deg, ${c.panelBg1}, ${c.panelBg2})`,
            color: c.fg,
            border: `1px solid ${c.panelEdge}`,
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 3px rgba(0,0,0,0.4)`,
        });
        bDefault.textContent = 'Default';
        // Disabled
        const bDisabled = el('button', 'layout-btn', {
            background: c.pageBg2,
            color: c.muted,
            border: `1px solid ${c.panelEdge}80`,
            boxShadow: `inset 0 1px 2px rgba(0,0,0,0.3)`,
            opacity: '0.7',
        });
        bDisabled.textContent = 'Disabled';
        row.append(bActive, bHover, bDefault, bDisabled);
        return row;
    }
    panel.appendChild(makeBtnRow(c.primary));
    panel.appendChild(makeBtnRow(c.secondary));

    // --- (h) Progress-bar slider ---
    function makeSlider(accent) {
        const wrap = el('div', 'layout-slider');
        const track = el('div', 'layout-slider-track', {
            background: c.pageBg1,
        });
        const fill = el('div', 'layout-slider-fill', {
            width: '60%',
            background: `linear-gradient(90deg, ${accent[0]}, ${accent[M - 1]})`,
            boxShadow: `0 0 4px ${accent[0]}40`,
        });
        const thumb = el('div', 'layout-slider-thumb', {
            left: '60%',
            background: `radial-gradient(circle at 40% 35%, ${accent[0]}, ${accent[M - 1]})`,
            boxShadow: `0 1px 4px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.15)`,
        });
        wrap.append(track, fill, thumb);
        return wrap;
    }
    panel.appendChild(makeSlider(c.primary));

    // --- (j) Glowing text ---
    const glow = el('p', 'layout-glow');
    const g1 = el('span', '', {
        color: c.primary[0],
        textShadow: `0 0 10px ${c.primary[0]}, 0 0 20px ${c.primary[0]}60`,
    });
    g1.textContent = 'Primary accent 1.';
    const g2 = el('span', '', {
        color: c.secondary[0],
        textShadow: `0 0 10px ${c.secondary[0]}, 0 0 20px ${c.secondary[0]}60`,
    });
    g2.textContent = 'Secondary accent 1.';
    glow.append(g1, g2);
    panel.appendChild(glow);

    return card;
}

/* ---- Render orchestration ---- */

function destroyCharts() {
    for (const key of Object.keys(charts)) {
        charts[key].destroy();
        delete charts[key];
    }
}

function resetGrid() {
    const grid = document.getElementById('charts-grid');
    grid.innerHTML = '';
    return grid;
}

function renderRaw() {
    destroyCharts();
    const grid = resetGrid();
    // Re-create 4 chart canvases
    const ids = ['chart-neutral-id-l', 'chart-neutral-h-c', 'chart-colors-id-l', 'chart-colors-h-c'];
    for (const id of ids) {
        const div = document.createElement('div');
        div.className = 'chart-container';
        const cvs = document.createElement('canvas');
        cvs.id = id;
        div.appendChild(cvs);
        grid.appendChild(div);
    }

    const neutrals = parseRawNeutrals(rawPalette);
    const { names, sequences } = parseRawColors(rawPalette);

    charts.neutralIdL = makeScatterChart('chart-neutral-id-l',
        'Neutrals — ID vs Lightness',
        {
            label: 'Neutrals',
            data: neutrals.map(n => ({ x: n.id, y: +n.L.toFixed(4) })),
            backgroundColor: neutrals.map(n => n.hex),
            borderColor: 'rgba(235,219,178,0.5)', borderWidth: 1,
            pointRadius: 5, pointHoverRadius: 7,
            showLine: true, tension: 0.3,
            segment: { borderColor: 'rgba(235,219,178,0.25)' },
        },
        'ID', 'L',
        (_v, ctx) => neutrals[ctx.dataIndex].label,
    );

    charts.neutralHC = makeScatterChart('chart-neutral-h-c',
        'Neutrals — Hue vs Saturation',
        {
            label: 'Neutrals',
            data: neutrals.map(n => ({ x: +n.H.toFixed(2), y: +n.S.toFixed(4) })),
            backgroundColor: neutrals.map(n => n.hex),
            borderColor: 'rgba(235,219,178,0.5)', borderWidth: 1,
            pointRadius: 5, pointHoverRadius: 7,
            showLine: true, tension: 0.3,
            segment: { borderColor: 'rgba(235,219,178,0.25)' },
        },
        'H (degrees)', 'S',
        (_v, ctx) => neutrals[ctx.dataIndex].label,
    );

    const colorDS = names.map(name => {
        const pts = sequences[name];
        return {
            label: name,
            data: pts.map(p => ({ x: p.id, y: +p.L.toFixed(4) })),
            backgroundColor: pts.map(p => p.hex),
            borderColor: pts[1].hex, borderWidth: 2,
            pointRadius: 6, pointHoverRadius: 8,
            showLine: true, tension: 0.3,
        };
    });
    charts.colorsIdL = makeScatterChart('chart-colors-id-l',
        'Colours — ID vs Lightness', colorDS, 'ID', 'L',
        (_v, ctx) => {
            const n = names[ctx.datasetIndex];
            return sequences[n][ctx.dataIndex].label;
        },
    );

    const colorHCDS = names.map(name => {
        const pts = sequences[name];
        return {
            label: name,
            data: pts.map(p => ({ x: +p.H.toFixed(2), y: +p.S.toFixed(4) })),
            backgroundColor: pts.map(p => p.hex),
            borderColor: pts[1].hex, borderWidth: 2,
            pointRadius: 6, pointHoverRadius: 8,
            showLine: true, tension: 0.3,
        };
    });
    charts.colorsHC = makeScatterChart('chart-colors-h-c',
        'Colours — Hue vs Saturation', colorHCDS, 'H (degrees)', 'S',
        (_v, ctx) => {
            const n = names[ctx.datasetIndex];
            return sequences[n][ctx.dataIndex].label;
        },
    );
}

function renderGenerated() {
    destroyCharts();
    const grid = resetGrid();
    grid.classList.add('variant-grid');

    const mainHex = initData.main;
    const seeds = [];
    for (let i = 1; i <= 20; i++) {
        const key = `seed${i}`;
        if (initData[key]) seeds.push(initData[key]);
        else break;
    }

    currentPalette = createPalette({
        main: mainHex,
        seeds,
        N: paramN,
        M: paramM,
        L: paramL,
        expand: paramExpand,
        lmin: paramLmin,
        lmax: paramLmax,
        accentLight: paramAccentLight,
        accentDark: paramAccentDark,
        alertL: paramAlertL,
        categoryL: paramCategoryL,
        sigmoid: paramSigmoid,
        mode,
        power: paramPower,
    });

    const labels = {
        darkTinted:    'Dark Tinted',
        lightTinted:   'Light Tinted',
        darkAccented:  'Dark Accented',
        lightAccented: 'Light Accented',
    };

    const panelFn = previewMode === 'layout' ? createLayoutPanel : createVariantPanel;
    for (const [key, title] of Object.entries(labels)) {
        grid.appendChild(panelFn(currentPalette[key], title));
    }
}

function render() {
    const grid = document.getElementById('charts-grid');
    grid.classList.remove('variant-grid');
    if (mode === 'raw') renderRaw();
    else renderGenerated();
}

/* ---- UI wiring ---- */

function setupControls() {
    const modeBtns = document.querySelectorAll('.mode-btn');
    const genControls = document.getElementById('gen-controls');
    const powerControl = document.getElementById('power-control');

    const sliderN = document.getElementById('slider-n');
    const sliderM = document.getElementById('slider-m');
    const sliderL = document.getElementById('slider-l');
    const sliderLmin = document.getElementById('slider-lmin');
    const sliderLmax = document.getElementById('slider-lmax');
    const sliderPower = document.getElementById('slider-power');
    const sliderSigmoid = document.getElementById('slider-sigmoid');
    const sliderAccentLight = document.getElementById('slider-accent-light');
    const sliderAccentDark = document.getElementById('slider-accent-dark');
    const sliderAlertL = document.getElementById('slider-alert-l');
    const sliderCategoryL = document.getElementById('slider-category-l');
    const expandOff = document.getElementById('btn-expand-off');
    const expandOn  = document.getElementById('btn-expand-on');
    const btnExport = document.getElementById('btn-export');

    const nVal = document.getElementById('n-value');
    const mVal = document.getElementById('m-value');
    const lVal = document.getElementById('l-value');
    const lminVal = document.getElementById('lmin-value');
    const lmaxVal = document.getElementById('lmax-value');
    const powerVal = document.getElementById('power-value');
    const sigmoidVal = document.getElementById('sigmoid-value');
    const accentLightVal = document.getElementById('accent-light-value');
    const accentDarkVal = document.getElementById('accent-dark-value');
    const alertLVal = document.getElementById('alert-l-value');
    const categoryLVal = document.getElementById('category-l-value');

    function updateVisibility() {
        if (mode === 'raw') {
            genControls.classList.add('hidden');
        } else {
            genControls.classList.remove('hidden');
        }
        if (mode === 'superellipse') {
            powerControl.classList.remove('hidden');
        } else {
            powerControl.classList.add('hidden');
        }
    }

    function enforceLminMax() {
        let lo = parseFloat(sliderLmin.value);
        let hi = parseFloat(sliderLmax.value);
        if (lo >= hi) {
            hi = Math.min(1.0, lo + 0.05);
            sliderLmax.value = hi.toFixed(2);
        }
        paramLmin = lo;
        paramLmax = hi;
        lminVal.textContent = lo.toFixed(2);
        lmaxVal.textContent = hi.toFixed(2);
    }

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            mode = btn.dataset.mode;
            updateVisibility();
            render();
        });
    });

    sliderN.addEventListener('input', () => {
        paramN = parseInt(sliderN.value, 10);
        nVal.textContent = paramN;
        render();
    });

    sliderM.addEventListener('input', () => {
        paramM = parseInt(sliderM.value, 10);
        mVal.textContent = paramM;
        render();
    });

    sliderL.addEventListener('input', () => {
        paramL = parseInt(sliderL.value, 10);
        lVal.textContent = paramL;
        render();
    });

    sliderLmin.addEventListener('input', () => { enforceLminMax(); render(); });
    sliderLmax.addEventListener('input', () => { enforceLminMax(); render(); });

    sliderPower.addEventListener('input', () => {
        paramPower = parseFloat(sliderPower.value);
        powerVal.textContent = paramPower.toFixed(1);
        render();
    });

    sliderSigmoid.addEventListener('input', () => {
        paramSigmoid = parseFloat(sliderSigmoid.value);
        sigmoidVal.textContent = paramSigmoid.toFixed(1);
        render();
    });

    sliderAccentLight.addEventListener('input', () => {
        paramAccentLight = parseFloat(sliderAccentLight.value);
        accentLightVal.textContent = paramAccentLight.toFixed(2);
        render();
    });

    sliderAccentDark.addEventListener('input', () => {
        paramAccentDark = parseFloat(sliderAccentDark.value);
        accentDarkVal.textContent = paramAccentDark.toFixed(2);
        render();
    });

    sliderAlertL.addEventListener('input', () => {
        paramAlertL = parseFloat(sliderAlertL.value);
        alertLVal.textContent = paramAlertL.toFixed(2);
        render();
    });

    sliderCategoryL.addEventListener('input', () => {
        paramCategoryL = parseFloat(sliderCategoryL.value);
        categoryLVal.textContent = paramCategoryL.toFixed(2);
        render();
    });

    expandOff.addEventListener('click', () => {
        expandOff.classList.add('active');
        expandOn.classList.remove('active');
        paramExpand = false;
        render();
    });

    expandOn.addEventListener('click', () => {
        expandOn.classList.add('active');
        expandOff.classList.remove('active');
        paramExpand = true;
        render();
    });

    const previewSwatches = document.getElementById('btn-preview-swatches');
    const previewLayout  = document.getElementById('btn-preview-layout');

    previewSwatches.addEventListener('click', () => {
        previewSwatches.classList.add('active');
        previewLayout.classList.remove('active');
        previewMode = 'swatches';
        render();
    });

    previewLayout.addEventListener('click', () => {
        previewLayout.classList.add('active');
        previewSwatches.classList.remove('active');
        previewMode = 'layout';
        render();
    });

    btnExport.addEventListener('click', () => {
        if (currentPalette) downloadPaletteJson(currentPalette, 'gruvbox.json');
    });
}

/* ---- Init ---- */

async function init() {
    ChartJS.register(window.ChartDataLabels);
    [rawPalette, initData] = await Promise.all([
        loadRawPalette(),
        loadInitData(),
    ]);
    setupControls();
    render();
}

init();
