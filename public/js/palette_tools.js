/**
 * Palette generation module.
 *
 * Creates four theme variants (Dark Tinted, Light Tinted, Dark Accented,
 * Light Accented) from a main colour and optional seed colours.
 *
 * Depends on color_tools.js for excolor lightness and colour-path generation.
 */

import {
    hexToHsl,
    getExcolorLightness,
    setColorLightness,
    generateTwoColorPath,
    generateColorPath,
    generateLightnessPath,
} from './color_tools.js';

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
