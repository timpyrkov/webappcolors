/**
 * palette_tools.js — Self-contained palette generation module.
 *
 * Part 1: Colour transformation utilities.
 *   Hue / Saturation use standard HSL.
 *   Lightness uses "excolor" arcs through black, colour, and white in RGB space.
 *   All colour functions accept and return hex RGB strings (#RRGGBB).
 *
 * Part 2: Palette generation engine.
 *   Creates four theme variants (Dark Tinted, Light Tinted, Dark Accented,
 *   Light Accented) from a main colour and optional seed colours.
 */

// ═══════════════════════════════════════════════════════════════════
//  Part 1 — Colour tools
// ═══════════════════════════════════════════════════════════════════

// --- Internal: Hex <-> sRGB ---

function hexToSrgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    return [
        parseInt(hex.substring(0, 2), 16) / 255,
        parseInt(hex.substring(2, 4), 16) / 255,
        parseInt(hex.substring(4, 6), 16) / 255,
    ];
}

function srgbToHex(rgb) {
    return '#' + rgb.map(c => {
        c = Math.max(0, Math.min(1, c));
        const val = Math.round(c * 255);
        return val.toString(16).padStart(2, '0');
    }).join('');
}

// --- Internal: sRGB <-> HSL ---

function srgbToHsl(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const L = (max + min) / 2;
    if (max === min) return [0, 0, L];
    const d = max - min;
    const S = L > 0.5 ? d / (2 - max - min) : d / (max + min);
    let H;
    if (max === r)      H = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) H = ((b - r) / d + 2) * 60;
    else                H = ((r - g) / d + 4) * 60;
    return [H, S, L];
}

function hslToSrgb(H, S, L) {
    H = ((H % 360) + 360) % 360;
    S = Math.max(0, Math.min(1, S));
    L = Math.max(0, Math.min(1, L));
    if (S === 0) return [L, L, L];
    const C = (1 - Math.abs(2 * L - 1)) * S;
    const X = C * (1 - Math.abs(((H / 60) % 2) - 1));
    const m = L - C / 2;
    let r, g, b;
    if      (H < 60)  { r = C; g = X; b = 0; }
    else if (H < 120) { r = X; g = C; b = 0; }
    else if (H < 180) { r = 0; g = C; b = X; }
    else if (H < 240) { r = 0; g = X; b = C; }
    else if (H < 300) { r = X; g = 0; b = C; }
    else               { r = C; g = 0; b = X; }
    return [r + m, g + m, b + m];
}

// --- Public: HSL conversion ---

function hexToHsl(hex) {
    const [r, g, b] = hexToSrgb(hex);
    return srgbToHsl(r, g, b);
}

function hslToHex(H, S, L) {
    const [r, g, b] = hslToSrgb(H, S, L);
    return srgbToHex([r, g, b]);
}

// --- Public: Hue / Saturation setters (HSL-based) ---

function setColorHue(hex, hue) {
    const [, S, L] = hexToHsl(hex);
    let H = ((hue % 360) + 360) % 360;
    return hslToHex(H, S, L);
}

function setColorSaturation(hex, sat) {
    const [H, , L] = hexToHsl(hex);
    return hslToHex(H, Math.max(0, Math.min(1, sat)), L);
}

function rotateColorHue(hex, degrees) {
    const [H, S, L] = hexToHsl(hex);
    let h = ((H + degrees) % 360 + 360) % 360;
    return hslToHex(h, S, L);
}

function changeColorSaturation(hex, amount) {
    const [H, S, L] = hexToHsl(hex);
    return hslToHex(H, Math.max(0, Math.min(1, S + amount)), L);
}

// --- Internal: Sanitise n ---

function _sanitiseN(n) {
    n = Math.round(n);
    return Math.max(2, n);
}

// --- Internal: Vector math helpers ---

function vecDot(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
}
function vecNorm(v) { return Math.sqrt(vecDot(v, v)); }
function vecScale(v, s) { return v.map(x => x * s); }
function vecAdd(a, b) { return a.map((x, i) => x + b[i]); }
function vecSub(a, b) { return a.map((x, i) => x - b[i]); }

// --- Internal: Path generators (ported from excolor palette.py) ---

function _generateLinearPath(p1, p2, p3, npoints) {
    const len1 = vecNorm(vecSub(p3, p2));
    const len2 = vecNorm(vecSub(p1, p3));
    const total = len1 + len2;
    const n1 = Math.max(2, Math.round(npoints * len1 / total));
    const n2 = Math.max(2, Math.round(npoints * len2 / total));
    const path = [];
    for (let i = 0; i < n1; i++) {
        const t = i / (n1 - 1);
        path.push([p2[0] + (p3[0] - p2[0]) * t, p2[1] + (p3[1] - p2[1]) * t]);
    }
    for (let i = 1; i < n2; i++) {
        const t = i / (n2 - 1);
        path.push([p3[0] + (p1[0] - p3[0]) * t, p3[1] + (p1[1] - p3[1]) * t]);
    }
    const lengths = [0];
    for (let i = 1; i < path.length; i++) {
        const dx = path[i][0] - path[i - 1][0];
        const dy = path[i][1] - path[i - 1][1];
        lengths.push(lengths[i - 1] + Math.sqrt(dx * dx + dy * dy));
    }
    return path.map((pt, i) => [pt[0], pt[1], lengths[i]]);
}

function _generateCirclePath(p1, p2, p3, npoints) {
    const centerU = p2[0] / 2.0;
    const centerV = (p3[0] ** 2 - 2 * centerU * p3[0] + p3[1] ** 2) / (2 * p3[1]);
    const radius = Math.sqrt(centerU * centerU + centerV * centerV);
    let angleStart = Math.atan2(p2[1] - centerV, p2[0] - centerU);
    let angleEnd = Math.atan2(p1[1] - centerV, p1[0] - centerU);
    if (angleEnd < angleStart) angleEnd += 2 * Math.PI;
    const result = [];
    for (let i = 0; i < npoints; i++) {
        const angle = angleStart + (angleEnd - angleStart) * i / (npoints - 1);
        result.push([centerU + radius * Math.cos(angle), centerV + radius * Math.sin(angle), radius * Math.abs(angle - angleStart)]);
    }
    return result;
}

function _generateSuperellipsePath(p1, p2, p3, npoints, power) {
    const center = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    const a = vecNorm(vecSub(p2, center));
    const p3s = [p3[0] - center[0], p3[1] - center[1]];
    const xTerm = Math.pow(Math.abs(p3s[0] / a), power);
    const termToRoot = Math.max(1e-9, Math.min(1.0, 1.0 - xTerm));
    const b = Math.abs(p3s[1]) / Math.pow(termToRoot, 1.0 / power);
    const r = power;
    const result = [];
    let prevU, prevV, cumLen = 0;
    for (let i = 0; i < npoints; i++) {
        const t = Math.PI * i / (npoints - 1);
        const cosT = Math.cos(t);
        const sinT = Math.sin(t);
        const u = a * Math.sign(cosT) * Math.pow(Math.abs(cosT), 2.0 / r) + center[0];
        const v = b * Math.pow(Math.abs(sinT), 2.0 / r) * (sinT >= 0 ? 1 : -1) + center[1];
        if (i > 0) cumLen += Math.sqrt((u - prevU) ** 2 + (v - prevV) ** 2);
        result.push([u, v, cumLen]);
        prevU = u; prevV = v;
    }
    return result;
}

// --- Internal: Excolor arc building & sampling ---

/**
 * Build a dense excolor arc through black → hex → white in a 2D (u,v) plane.
 * Returns basis vectors, dense path, and u-coordinate metadata so that
 * different sampling strategies can reuse the same arc.
 */
function _buildExcolorArc(hex, mode = 'superellipse', power = 2, npoints = 1000) {
    const black = [0, 0, 0];
    const white = [1, 1, 1];
    const rgb = hexToSrgb(hex);

    let u = vecSub(white, black);
    const uMax = vecNorm(u);
    u = vecScale(u, 1 / uMax);

    const isGrey = Math.abs(rgb[0] - rgb[1]) < 1e-5 && Math.abs(rgb[1] - rgb[2]) < 1e-5;
    if (isGrey) {
        return { u, v: [0, 0, 0], path: null, uCoords: null, uMax, isGrey: true };
    }

    let v = vecSub(rgb, black);
    v = vecSub(v, vecScale(u, vecDot(u, v)));
    v = vecScale(v, 1 / vecNorm(v));

    const blackUv = [0, 0];
    const whiteUv = [vecDot(vecSub(white, black), u), vecDot(vecSub(white, black), v)];
    const rgbUv   = [vecDot(vecSub(rgb, black), u),   vecDot(vecSub(rgb, black), v)];

    let path;
    if (mode === 'linear') path = _generateLinearPath(blackUv, whiteUv, rgbUv, npoints);
    else if (mode === 'circle') path = _generateCirclePath(blackUv, whiteUv, rgbUv, npoints);
    else path = _generateSuperellipsePath(blackUv, whiteUv, rgbUv, npoints, power);

    const pathPts = path.map(p => [p[0], p[1]]);
    const uCoords = pathPts.map(p => p[0]);

    return { u, v, path: pathPts, uCoords, uMax, isGrey: false };
}

/**
 * Convert a 2D (u_coord, v_coord) point back to hex via basis vectors.
 */
function _uvToHex(arc, uCoord, vCoord) {
    const rgb = vecAdd([0, 0, 0], vecAdd(vecScale(arc.u, uCoord), vecScale(arc.v, vCoord)));
    return srgbToHex(rgb.map(c => Math.max(0, Math.min(1, c))));
}

/**
 * Find the point on the arc at a given excolor lightness (0–1).
 * Returns hex.
 */
function _sampleArcAtLightness(arc, targetL) {
    targetL = Math.max(0, Math.min(1, targetL));
    if (arc.isGrey) {
        const g = targetL;
        return srgbToHex([g, g, g]);
    }
    const targetU = targetL * arc.uMax;
    const uc = arc.uCoords;
    const pts = arc.path;
    // Linear scan for segment crossing targetU
    let lo = 0, hi = uc.length - 1;
    for (let j = 1; j < uc.length; j++) {
        if ((uc[j - 1] <= targetU && uc[j] >= targetU) ||
            (uc[j - 1] >= targetU && uc[j] <= targetU)) {
            lo = j - 1; hi = j; break;
        }
    }
    const dU = uc[hi] - uc[lo];
    const segT = Math.abs(dU) > 1e-12 ? (targetU - uc[lo]) / dU : 0;
    const sU = pts[lo][0] + (pts[hi][0] - pts[lo][0]) * segT;
    const sV = pts[lo][1] + (pts[hi][1] - pts[lo][1]) * segT;
    return _uvToHex(arc, sU, sV);
}

/**
 * Sigmoid warp: maps t ∈ [0,1] to [0,1] with S-curve.
 * k = 0 → linear; k > 0 → compressed ends, spread midrange.
 */
function _sigmoidWarp(t, k) {
    if (k <= 1e-9) return t;
    return 0.5 + 0.5 * Math.tanh(k * (t - 0.5)) / Math.tanh(k * 0.5);
}

/**
 * Sample n colours from the arc within [lmin, lmax] excolor lightness range.
 * @param {Object} arc - from _buildExcolorArc.
 * @param {number} n - number of output samples.
 * @param {number} lmin - min excolor lightness.
 * @param {number} lmax - max excolor lightness.
 * @param {number} [sigmoid=0] - S-curve steepness (0 = linear).
 * @returns {string[]} hex array, dark → light.
 */
function _sampleArcRange(arc, n, lmin, lmax, sigmoid = 0) {
    const result = [];
    for (let i = 0; i < n; i++) {
        const t = n > 1 ? i / (n - 1) : 0.5;
        const tw = _sigmoidWarp(t, sigmoid);
        const targetL = lmin + tw * (lmax - lmin);
        result.push(_sampleArcAtLightness(arc, targetL));
    }
    return result;
}

// --- Public: Excolor lightness ---

/**
 * Get the excolor lightness of a hex colour: (r + g + b) / 3.
 */
function getExcolorLightness(hex) {
    const [r, g, b] = hexToSrgb(hex);
    return (r + g + b) / 3;
}

/**
 * Set a colour's lightness to an absolute excolor value (0–1).
 * Builds the excolor arc and samples at the target lightness.
 */
function setColorLightness(hex, targetL, { mode = 'superellipse', power = 2 } = {}) {
    const arc = _buildExcolorArc(hex, mode, power);
    return _sampleArcAtLightness(arc, targetL);
}

/**
 * Shift a colour's lightness by an absolute excolor amount.
 * Positive = lighter, negative = darker.
 */
function changeColorLightness(hex, amount, { mode = 'superellipse', power = 2 } = {}) {
    const currentL = getExcolorLightness(hex);
    const targetL = Math.max(0, Math.min(1, currentL + amount));
    return setColorLightness(hex, targetL, { mode, power });
}

// --- Public: Excolor HSL conversion ---

/**
 * Convert hex to excolor HSL: [H, S] from standard HSL, L from excolor.
 */
function rgbToExcolorHsl(hex) {
    const [H, S] = hexToHsl(hex);
    const L = getExcolorLightness(hex);
    return [H, S, L];
}

/**
 * Convert excolor HSL back to hex.
 * Step a: standard HSL→RGB (pretend L_ex is HSL lightness).
 * Step b: correct lightness via excolor arc.
 */
function excolorHslToRgb(H, S, L, { mode = 'superellipse', power = 2 } = {}) {
    const approx = hslToHex(H, S, L);
    return setColorLightness(approx, L, { mode, power });
}

// --- Public: Multi-anchor colour paths ---

/**
 * Build an n-colour path between two hex colours by interpolating
 * excolor HSL (H, S, L_ex) along the shortest hue arc.
 * @param {string} hex1 - Start colour.
 * @param {string} hex2 - End colour.
 * @param {number} n - Number of output colours (min 2).
 * @param {Object} [opts]
 * @param {string} [opts.mode='superellipse']
 * @param {number} [opts.power=2]
 * @returns {string[]} hex array from hex1 to hex2.
 */
function generateTwoColorPath(hex1, hex2, n, { mode = 'superellipse', power = 2 } = {}) {
    n = Math.max(2, Math.round(n));
    if (n === 2) return [hex1, hex2];
    const [H1, S1, L1] = rgbToExcolorHsl(hex1);
    const [H2, S2, L2] = rgbToExcolorHsl(hex2);
    // Shortest-arc hue direction
    let dH = H2 - H1;
    if (dH > 180) dH -= 360;
    if (dH < -180) dH += 360;
    const result = [];
    for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        if (i === 0) { result.push(hex1); continue; }
        if (i === n - 1) { result.push(hex2); continue; }
        let H = H1 + dH * t;
        H = ((H % 360) + 360) % 360;
        const S = S1 + (S2 - S1) * t;
        const L = L1 + (L2 - L1) * t;
        result.push(excolorHslToRgb(H, S, L, { mode, power }));
    }
    return result;
}

/**
 * Build an n-colour path through 2+ hex anchors.
 * By default, resamples by cumulative Euclidean RGB distance for perceptually
 * even spacing. Set sampleByIndex = true for simple index-based resampling.
 * @param {string[]} hexAnchors - Array of anchor hex colours (>= 2).
 * @param {number} n - Number of output colours (min 2).
 * @param {Object} [opts]
 * @param {boolean} [opts.sampleByIndex=false]
 * @param {string}  [opts.mode='superellipse']
 * @param {number}  [opts.power=2]
 * @returns {string[]} hex array.
 */
function generateColorPath(hexAnchors, n, { sampleByIndex = false, mode = 'superellipse', power = 2 } = {}) {
    if (!Array.isArray(hexAnchors) || hexAnchors.length < 2) return [];
    n = Math.max(2, Math.round(n));
    if (n === 2) return [hexAnchors[0], hexAnchors[hexAnchors.length - 1]];

    // Build dense pairwise segments
    const segs = hexAnchors.length - 1;
    const ptsPerSeg = Math.max(20, Math.ceil(200 / segs));
    let combined = [];
    for (let s = 0; s < segs; s++) {
        const seg = generateTwoColorPath(hexAnchors[s], hexAnchors[s + 1], ptsPerSeg, { mode, power });
        if (s > 0) seg.shift(); // drop duplicate junction point
        combined = combined.concat(seg);
    }

    if (combined.length <= n) {
        // Not enough points — just resample by index
        sampleByIndex = true;
    }

    if (sampleByIndex) {
        if (combined.length === n) return combined;
        const result = [combined[0]];
        for (let i = 1; i < n - 1; i++) {
            const idx = Math.round(i * (combined.length - 1) / (n - 1));
            result.push(combined[idx]);
        }
        result.push(combined[combined.length - 1]);
        return result;
    }

    // Distance-based resampling
    const rgbPts = combined.map(h => hexToSrgb(h));
    const cumDist = [0];
    for (let i = 1; i < rgbPts.length; i++) {
        const d = Math.sqrt(
            (rgbPts[i][0] - rgbPts[i - 1][0]) ** 2 +
            (rgbPts[i][1] - rgbPts[i - 1][1]) ** 2 +
            (rgbPts[i][2] - rgbPts[i - 1][2]) ** 2,
        );
        cumDist.push(cumDist[i - 1] + d);
    }
    const totalDist = cumDist[cumDist.length - 1];
    if (totalDist < 1e-12) return combined.slice(0, n);

    const result = [combined[0]];
    for (let i = 1; i < n - 1; i++) {
        const targetD = totalDist * i / (n - 1);
        // Binary search
        let lo = 0, hi = cumDist.length - 1;
        while (lo < hi - 1) {
            const mid = (lo + hi) >> 1;
            if (cumDist[mid] <= targetD) lo = mid; else hi = mid;
        }
        const segLen = cumDist[hi] - cumDist[lo];
        const t = segLen > 1e-12 ? (targetD - cumDist[lo]) / segLen : 0;
        // Interpolate in RGB then convert to hex
        const r = rgbPts[lo][0] + (rgbPts[hi][0] - rgbPts[lo][0]) * t;
        const g = rgbPts[lo][1] + (rgbPts[hi][1] - rgbPts[lo][1]) * t;
        const b = rgbPts[lo][2] + (rgbPts[hi][2] - rgbPts[lo][2]) * t;
        result.push(srgbToHex([
            Math.max(0, Math.min(1, r)),
            Math.max(0, Math.min(1, g)),
            Math.max(0, Math.min(1, b)),
        ]));
    }
    result.push(combined[combined.length - 1]);
    return result;
}

// --- Public: Generation helpers ---

/**
 * Compute L0 (start lightness) and dL (step) for n evenly spaced tones.
 * @param {number} n   - Number of tones (sanitised to >= 2).
 * @param {number} [lmin=0.20] - Minimum lightness.
 * @param {number} [lmax=0.96] - Maximum lightness.
 * @returns {{ l0: number, dl: number }}
 */
function generateLightnessStep(n, lmin = 0.20, lmax = 0.96) {
    n = _sanitiseN(n);
    const dl = (lmax - lmin) / (n - 1);
    return { l0: lmin, dl };
}

/**
 * Generate a full lightness path from a single colour using excolor arcs.
 * @param {string} hex  - Seed colour.
 * @param {number} n    - Number of output colours.
 * @param {number} lmin - Min excolor lightness.
 * @param {number} lmax - Max excolor lightness.
 * @param {Object} [opts]
 * @param {string} [opts.mode='superellipse']
 * @param {number} [opts.power=2]
 * @param {number} [opts.sigmoid=0] - S-curve steepness (0 = linear).
 * @returns {string[]} Array of hex colours from dark to light.
 */
function generateLightnessPath(hex, n, lmin, lmax, { mode = 'superellipse', power = 2, sigmoid = 0 } = {}) {
    n = _sanitiseN(n);
    const arc = _buildExcolorArc(hex, mode, power, Math.max(1000, n * 5));
    return _sampleArcRange(arc, n, lmin, lmax, sigmoid);
}

/**
 * Generate a small symmetric lightness segment centred on the input colour.
 * n is enforced to be odd (rounded to nearest odd, min 3).
 * @param {string} hex  - Centre colour.
 * @param {number} n    - Number of output colours (forced odd, min 3).
 * @param {number} dl   - Lightness step between adjacent colours.
 * @param {Object} [opts]
 * @param {string} [opts.mode='superellipse']
 * @param {number} [opts.power=2]
 * @returns {string[]} Array of hex colours.
 */
function generateLightnessGrades(hex, n, dl, { mode = 'superellipse', power = 2 } = {}) {
    n = Math.max(3, Math.round(n));
    if (n % 2 === 0) n += 1; // ensure odd
    const half = (n - 1) / 2;
    const result = [];
    for (let i = 0; i < n; i++) {
        if (i === half) {
            result.push(hex); // centre is the original colour
        } else {
            const amount = (i - half) * dl;
            result.push(changeColorLightness(hex, amount, { mode, power }));
        }
    }
    return result;
}

// ═══════════════════════════════════════════════════════════════════
//  Part 2 — Palette generation
// ═══════════════════════════════════════════════════════════════════

// --- Helpers ---

function clampInt(v, lo, hi) {
    return Math.max(lo, Math.min(hi, Math.round(v)));
}

// --- Defaults ---

const GREY = '#808080';

const NOTIFICATION_BASES = {
    error:   '#cc241d',
    warning: '#d79921',
    success: '#98971a',
    note:    '#689d6a',
    message: '#458588',
};

// --- Main API ---

/**
 * Create four palette variants from main + optional seed colours.
 *
 * @param {Object} opts
 * @param {string}   [opts.main='#808080']   - Main / neutral seed colour.
 * @param {string[]} [opts.seeds=[]]         - Ordered seed colours.
 * @param {number}   [opts.N=12]             - Number of neutrals (5–20).
 * @param {number}   [opts.M=5]             - Number of primary / secondary accents (3–7).
 * @param {number}   [opts.L=5]             - Number of category colours (3–7).
 * @param {number}   [opts.lmin=0.20]        - Min excolor lightness for neutrals.
 * @param {number}   [opts.lmax=0.96]        - Max excolor lightness for neutrals.
 * @param {number}   [opts.accentLight=0.6]  - Lighter accent lightness level.
 * @param {number}   [opts.accentDark=0.5]   - Darker accent lightness level.
 * @param {number}   [opts.alertL=0.6]       - Alert / notification lightness.
 * @param {number}   [opts.categoryL=0.6]    - Category colour lightness.
 * @param {number}   [opts.sigmoid=0]        - Sigmoid steepness for neutral distribution.
 * @param {string}   [opts.mode='superellipse'] - Excolor arc mode.
 * @param {number}   [opts.power=2]          - Superellipse exponent.
 * @returns {{ darkTinted, lightTinted, darkAccented, lightAccented }}
 */
function createPalette({
    main = GREY,
    seeds = [],
    N = 12,
    M = 5,
    L = 5,
    lmin = 0.05,
    lmax = 0.95,
    accentLight = 0.55,
    accentDark = 0.45,
    alertL = 0.55,
    categoryL = 0.55,
    sigmoid = 3.0,
    mode = 'superellipse',
    power = 1.5,
} = {}) {
    // --- Validate ---
    N = clampInt(N, 5, 20);
    M = clampInt(M, 3, 7);
    L = clampInt(L, 3, 7);

    const opts = { mode, power };

    // --- Neutrals ---
    const tintedHexes   = generateLightnessPath(main, N, lmin, lmax, { mode, power, sigmoid });
    const accentedHexes = generateLightnessPath(GREY, N, lmin, lmax, { mode, power, sigmoid });

    function makeNeutrals(hexes) {
        return hexes.map((hex, i) => {
            const [H, S] = hexToHsl(hex);
            const Lv = getExcolorLightness(hex);
            return { id: i + 1, label: `neutral-${i + 1}`, hex, H, S, L: Lv };
        });
    }

    const darkTintedNeutrals    = makeNeutrals(tintedHexes);
    const lightTintedNeutrals   = makeNeutrals([...tintedHexes].reverse());
    const darkAccentedNeutrals  = makeNeutrals(accentedHexes);
    const lightAccentedNeutrals = makeNeutrals([...accentedHexes].reverse());

    // --- Primary accents ---
    function makePrimaryAccents() {
        let s1, s2;
        if (seeds.length === 0) {
            s1 = main; s2 = main;
        } else if (seeds.length === 1) {
            s1 = seeds[0]; s2 = seeds[0];
        } else {
            // Reverse: seed1 = seeds[1], seed2 = seeds[0]
            s1 = seeds[1]; s2 = seeds[0];
        }
        s1 = setColorLightness(s1, accentLight, opts);
        s2 = setColorLightness(s2, accentDark, opts);
        const hexes = generateTwoColorPath(s1, s2, M, opts);
        return hexes.map((hex, i) => {
            const [H, S] = hexToHsl(hex);
            const Lv = getExcolorLightness(hex);
            return { id: i + 1, label: `primary-${i + 1}`, hex, H, S, L: Lv };
        });
    }

    // --- Secondary accents ---
    function makeSecondaryAccents() {
        let s3, s4;
        if (seeds.length <= 2) {
            s3 = main; s4 = main;
        } else if (seeds.length === 3) {
            s3 = seeds[2]; s4 = seeds[2];
        } else {
            // No reverse: seed3 = seeds[2], seed4 = seeds[3]
            s3 = seeds[2]; s4 = seeds[3];
        }
        s3 = setColorLightness(s3, accentLight, opts);
        s4 = setColorLightness(s4, accentDark, opts);
        const hexes = generateTwoColorPath(s3, s4, M, opts);
        return hexes.map((hex, i) => {
            const [H, S] = hexToHsl(hex);
            const Lv = getExcolorLightness(hex);
            return { id: i + 1, label: `secondary-${i + 1}`, hex, H, S, L: Lv };
        });
    }

    // --- Notification colours ---
    function makeNotifications() {
        const result = {};
        for (const [name, base] of Object.entries(NOTIFICATION_BASES)) {
            const hex = setColorLightness(base, alertL, opts);
            const [H, S] = hexToHsl(hex);
            const Lv = getExcolorLightness(hex);
            result[name] = { label: `color-${name}`, hex, H, S, L: Lv };
        }
        return result;
    }

    // --- Category colours ---
    function makeCategories() {
        // Build anchor list from seeds (fall back to main if none)
        let anchors = seeds.length === 0 ? [main, main] :
                      seeds.length === 1 ? [seeds[0], seeds[0]] :
                      [...seeds];
        anchors = anchors.map(s => setColorLightness(s, categoryL, opts));

        let hexes;
        if (anchors.length === L) {
            // Exact match — return as-is
            hexes = anchors;
        } else {
            // Wrap: append first anchor at end, generate L+1, drop last
            const looped = [...anchors, anchors[0]];
            hexes = generateColorPath(looped, L + 1, opts).slice(0, L);
        }
        return hexes.map((hex, i) => {
            const [H, S] = hexToHsl(hex);
            const Lv = getExcolorLightness(hex);
            return { id: i + 1, label: `category-${i + 1}`, hex, H, S, L: Lv };
        });
    }

    // --- Assemble variants ---
    const primary   = makePrimaryAccents();
    const secondary = makeSecondaryAccents();
    const notifications = makeNotifications();
    const categories = makeCategories();

    function buildVariant(neutrals) {
        return { neutrals, primary, secondary, notifications, categories };
    }

    return {
        darkTinted:     buildVariant(darkTintedNeutrals),
        lightTinted:    buildVariant(lightTintedNeutrals),
        darkAccented:   buildVariant(darkAccentedNeutrals),
        lightAccented:  buildVariant(lightAccentedNeutrals),
    };
}

// --- Export to JSON ---

function paletteToTokens(palette, variantName = 'theme') {
    const tokens = {};
    for (const n of palette.neutrals) tokens[`--${n.label}`] = n.hex;
    for (const p of palette.primary) tokens[`--${p.label}`] = p.hex;
    for (const s of palette.secondary) tokens[`--${s.label}`] = s.hex;
    for (const [, v] of Object.entries(palette.notifications)) tokens[`--${v.label}`] = v.hex;
    for (const c of palette.categories) tokens[`--${c.label}`] = c.hex;
    return { [variantName]: tokens };
}

function exportPaletteJson(allVariants) {
    return {
        ...paletteToTokens(allVariants.darkTinted, 'darkTinted'),
        ...paletteToTokens(allVariants.lightTinted, 'lightTinted'),
        ...paletteToTokens(allVariants.darkAccented, 'darkAccented'),
        ...paletteToTokens(allVariants.lightAccented, 'lightAccented'),
    };
}

function downloadPaletteJson(allVariants, filename = 'palette.json') {
    const json = JSON.stringify(exportPaletteJson(allVariants), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export {
    createPalette,
    paletteToTokens,
    exportPaletteJson,
    downloadPaletteJson,
};
