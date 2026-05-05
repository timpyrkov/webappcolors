/**
 * gen_colors.js — OKLCh colour-space conversion helpers.
 *
 * Only used by color-picker for its OKLCh-based colour wheel.
 * All palette generation has moved to color_tools.js + palette_tools.js.
 */

/* ================================================================
   Colour-space conversions: hex ↔ sRGB ↔ linear-RGB ↔ OKLab ↔ OKLCh
   ================================================================ */

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

function rgbToHex([r, g, b]) {
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const toHex = (v) => Math.round(clamp(v) * 255).toString(16).padStart(2, "0");
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

function linearize(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function delinearize(c) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function rgbToLinear([r, g, b]) {
  return [linearize(r), linearize(g), linearize(b)];
}

function linearToRgb([r, g, b]) {
  return [delinearize(r), delinearize(g), delinearize(b)];
}

function linearRgbToOklab([r, g, b]) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}

function oklabToLinearRgb([L, a, b]) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

function oklabToOklch([L, a, b]) {
  const C = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a) * (180 / Math.PI);
  if (h < 0) h += 360;
  return [L, C, h];
}

function oklchToOklab([L, C, h]) {
  const rad = h * (Math.PI / 180);
  return [L, C * Math.cos(rad), C * Math.sin(rad)];
}

/* ── Convenience pipelines ── */

export function hexToOklch(hex) {
  return oklabToOklch(linearRgbToOklab(rgbToLinear(hexToRgb(hex))));
}

export function oklchToHex([L, C, h]) {
  return rgbToHex(linearToRgb(oklabToLinearRgb(oklchToOklab([L, C, h]))));
}
