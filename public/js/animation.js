/**
 * animation.js — Procedural synthwave scene renderer
 * Uses palette tokens to colour a retro-futuristic animated landscape.
 */
import { changeColorSaturation } from './palette_tools.js';

/* ── Perlin noise (improved 2D) ── */
const _perm = new Uint8Array(512);
(function _initPerm() {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) _perm[i] = p[i & 255];
})();

function _fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function _lerp(a, b, t) { return a + t * (b - a); }
function _grad(hash, x, y) {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
}

function perlin2(x, y) {
  const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x), yf = y - Math.floor(y);
  const u = _fade(xf), v = _fade(yf);
  const aa = _perm[_perm[xi] + yi];
  const ab = _perm[_perm[xi] + yi + 1];
  const ba = _perm[_perm[xi + 1] + yi];
  const bb = _perm[_perm[xi + 1] + yi + 1];
  return _lerp(
    _lerp(_grad(aa, xf, yf), _grad(ba, xf - 1, yf), u),
    _lerp(_grad(ab, xf, yf - 1), _grad(bb, xf - 1, yf - 1), u),
    v
  );
}

// Fractal Brownian Motion — layered Perlin for richer terrain
// NOISE_OCTAVES: number of layers (more = finer detail, e.g. 1–6)
// NOISE_PERSIST: amplitude decay per octave (0.3=smooth, 0.7=rough)
function fbm(x, y, octaves, persistence) {
  let value = 0, amp = 1, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    value += perlin2(x * freq, y * freq) * amp;
    max += amp;
    amp *= persistence;
    freq *= 2;
  }
  return value / max;
}

/* ── Hex colour helpers ── */
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbStr(c, a = 1) {
  return a < 1 ? `rgba(${c[0]},${c[1]},${c[2]},${a})` : `rgb(${c[0]},${c[1]},${c[2]})`;
}


/* ═══════════════════════════════════════════════════════════
   Tuneable constants
   ═══════════════════════════════════════════════════════════ */
const SUN_CENTER_Y   = 0.30;   // Sun centre as fraction from top (lower = higher)
const SUN_RADIUS     = 0.18;   // Sun radius as fraction of min(w,h)
const SKY_BOT_INDEX  = 2;      // Neutral token index for bottom of sky gradient
const HORIZON_Y      = 0.40;   // Horizon line as fraction of canvas height
const CAR_Y_FRAC     = 0.4;   // Car vertical position below horizon (0=horizon)
const CAR_WIDTH_FRAC = 0.30;   // Car width as fraction of canvas width

// Terrain grid
const GRID_ROWS       = 40;    // Depth subdivisions
const CELLS_AT_HORIZON = 20;   // Number of cells visible at horizon width
// GRID_COLS is always 3 × GRID_ROWS (wide enough for seamless horizontal loop)

// Perspective
const FAR_Z          = 24;     // World-space far clipping plane
const NEAR_Z         = 1.5;    // World-space near clipping plane
const CAM_HEIGHT     = 2.0;    // Camera elevation above ground (higher = more top-down tilt)

// Perlin noise parameters (used during precalculation)
const NOISE_SCALE    = 0.2;   // Noise frequency (lower = broader hills)
const NOISE_AMP      = 3.5;    // Maximum mountain height in world units
const NOISE_OCTAVES  = 1;      // Fractal octaves (1=smooth, 4+=detailed)
const NOISE_PERSIST  = 0.2;   // Persistence per octave (0.3=smooth, 0.7=jagged)

// Sigmoid decay — suppresses height for near rows, keeps mountains far away
const SIGMOID_CENTER = 0.5;    // Midpoint in row-space (0=near, 1=far)
const SIGMOID_STEEP  = 20;     // Steepness (higher = sharper flat→mountain transition)

// Animation scroll
const SCROLL_RATE    = 0.03;   // Fraction of cell width shifted per frame (0.1 = 10%)

// Accent saturation shift for animation only (additive, HSL S range 0–1)
const SATURATION_SHIFT = 0.2;  // e.g. +0.2 = more vivid, -0.2 = more muted

/* ═══════════════════════════════════════════════════════════ */

// Sigmoid helper: returns 0 near camera, 1 far away
function sigmoid(t, center, steepness) {
  return 1 / (1 + Math.exp(-steepness * (t - center)));
}

/* ── Main export ── */
export function createSynthwaveCanvas(container, variant) {
  const canvas = document.createElement('canvas');
  canvas.className = 'synthwave-canvas';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let W, H, w, h;
  let animId = null;
  let scrollOffset = 0;  // fractional column offset for animation
  let colors = {};
  let carFillImg = null;
  let carEdgeImg = null;
  let running = false;

  // Derived grid dimensions
  const GRID_COLS = 3 * GRID_ROWS;
  // Precalculated height map [row][col] — computed once, scrolled during animation
  let heightMap = null;

  // Pre-load car mask images (SVG for edges = always sharp at any scale)
  loadImage('/data/car.png').then(img => { carFillImg = img; });
  loadImage('/data/car.svg').then(img => { carEdgeImg = img; });

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  // Detect monochrome palette (all accent saturations near zero)
  function isMonochrome(v) {
    const allHexes = [...v.primary, ...v.secondary].map(c => c.hex);
    return allHexes.every(hex => {
      const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      const max = Math.max(r,g,b), min = Math.min(r,g,b);
      return (max - min) / 255 < 0.05;
    });
  }

  // Apply saturation shift to a hex color and return RGB triplet
  let _skipSaturation = false;
  function accentRgb(hex) {
    if (_skipSaturation || SATURATION_SHIFT === 0) return hexToRgb(hex);
    return hexToRgb(changeColorSaturation(hex, SATURATION_SHIFT));
  }

  function extractColors(v) {
    _skipSaturation = isMonochrome(v);
    const n = v.neutrals;
    const N = n.length;
    const M = v.primary.length;
    const botIdx = Math.min(SKY_BOT_INDEX, N - 1);
    return {
      skyTop:      hexToRgb(n[0].hex),
      skyBot:      hexToRgb(n[botIdx].hex),
      sunTop:      accentRgb(v.primary[0].hex),
      sunBot:      accentRgb(v.primary[M - 1].hex),
      ground:      hexToRgb(n[0].hex),
      triFill:     hexToRgb(n[Math.min(2, N - 1)].hex),
      // Grid edge colors: near = secondary[M-1], far = secondary[0]
      gridEdgeNear: accentRgb(v.secondary[M - 1].hex),
      gridEdgeFar:  accentRgb(v.secondary[0].hex),
      carFill:     hexToRgb(n[Math.min(1, N - 1)].hex),
      // Car edge gradient: left = primary[0], right = primary[M-1]
      carEdgeL:    accentRgb(v.primary[0].hex),
      carEdgeR:    accentRgb(v.primary[M - 1].hex),
    };
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    W = canvas.width = Math.round(rect.width * devicePixelRatio);
    H = canvas.height = Math.round(rect.height * devicePixelRatio);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    w = rect.width;
    h = rect.height;
  }

  /* ── Sky ── */
  function drawSky() {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, rgbStr(colors.skyTop));
    grad.addColorStop(1, rgbStr(colors.skyBot));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  /* ── Sun ── */
  function drawSun() {
    const sunR = Math.min(w, h) * SUN_RADIUS;
    const cx = w / 2;
    const cy = h * SUN_CENTER_Y;

    // Sun body on offscreen canvas with stripe cutouts
    const size = Math.ceil(sunR * 2 + 4);
    const off = new OffscreenCanvas(size, size);
    const oc = off.getContext('2d');
    const ocx = size / 2, ocy = size / 2;

    const sunGrad = oc.createLinearGradient(0, 0, 0, size);
    sunGrad.addColorStop(0, rgbStr(colors.sunTop));
    sunGrad.addColorStop(1, rgbStr(colors.sunBot));
    oc.beginPath();
    oc.arc(ocx, ocy, sunR, 0, Math.PI * 2);
    oc.fillStyle = sunGrad;
    oc.fill();

    // Cut horizontal stripes in bottom half only, thickness & spacing grow bottom→top
    oc.globalCompositeOperation = 'destination-out';
    const stripes = 9;
    for (let i = 0; i < stripes; i++) {
      // Quadratic spacing: denser at bottom, wider apart toward mid
      const tLin = (i + 1) / (stripes + 1);
      const t = tLin * tLin; // compress lower stripes together
      const y = ocy + sunR * (1 - t * 1.3); // bottom half: from bottom up to mid
      const thickness = 1.0 + i * 1.6; // thinner at bottom, thicker toward mid
      oc.fillStyle = 'rgba(0,0,0,1)';
      oc.fillRect(0, y - thickness / 2, size, thickness);
    }
    oc.globalCompositeOperation = 'source-over';

    ctx.drawImage(off, cx - sunR, cy - sunR, size, size);
  }

  /* ── Precalculate height map ──
     Builds a GRID_ROWS × GRID_COLS height map using cylindrical Perlin noise
     so it loops seamlessly along the X (horizontal) axis.
     Negative values are truncated to 0 (only mountains, no valleys).
     Sigmoid decay makes near rows flat and far rows mountainous. */
  function buildHeightMap() {
    const map = [];
    const R = GRID_COLS * NOISE_SCALE * 0.5; // cylinder radius for seamless loop
    for (let r = 0; r <= GRID_ROWS; r++) {
      const row = [];
      const t = r / GRID_ROWS; // 0=near, 1=far
      const decay = sigmoid(t, SIGMOID_CENTER, SIGMOID_STEEP);
      const nz = t * (FAR_Z - NEAR_Z) * NOISE_SCALE;
      for (let c = 0; c <= GRID_COLS; c++) {
        // Cylindrical mapping: wrap X seamlessly
        const angle = (2 * Math.PI * c) / GRID_COLS;
        const nx = R * Math.cos(angle);
        const ny = R * Math.sin(angle) + nz;
        const raw = fbm(nx, ny, NOISE_OCTAVES, NOISE_PERSIST);
        // Truncate to positive only, apply amplitude and decay
        row.push(Math.max(0, raw) * NOISE_AMP * decay);
      }
      map.push(row);
    }
    return map;
  }

  /* ── Perspective projection ──
     1 cell = 1 world unit. At z=FAR_Z, exactly CELLS_AT_HORIZON cells span canvas width.
     Camera elevated CAM_HEIGHT above ground. Horizon at HORIZON_Y of canvas height. */
  function project(wx, wy, wz) {
    // Scale factor: at distance wz, how many pixels per world unit?
    // At FAR_Z, CELLS_AT_HORIZON world-units = w pixels → 1 unit = w/CELLS_AT_HORIZON px
    // Perspective: scale inversely with depth → pxPerUnit = (FAR_Z / wz) * (w / CELLS_AT_HORIZON)
    const pxPerUnit = (FAR_Z / wz) * (w / CELLS_AT_HORIZON);
    const horizonPx = h * HORIZON_Y;
    return {
      sx: w / 2 + wx * pxPerUnit,
      sy: horizonPx + (CAM_HEIGHT - wy) * pxPerUnit * (h / w),
    };
  }

  /* ── Triangulated terrain (uses precalculated heightMap) ── */
  function drawTerrain() {
    if (!heightMap) return;

    const rows = GRID_ROWS;
    const cols = GRID_COLS;

    // Heights are frozen from the precalculated map.
    // Animation physically displaces every vertex in world-space X.
    // The grid wraps circularly (cols-wide belt) so mountains that
    // exit one side seamlessly re-enter the other.
    // Perspective projection makes distant points shift fewer screen
    // pixels per frame than near points — natural parallax.

    const pts = [];
    for (let r = 0; r <= rows; r++) {
      const rowArr = [];
      const t = r / rows;
      const wz = NEAR_Z + t * (FAR_Z - NEAR_Z);

      for (let c = 0; c <= cols; c++) {
        // Frozen height from precalculated map
        const wy = heightMap[r][c % cols];

        // World-space X displaced by scrollOffset, then wrapped into
        // [-cols/2, +cols/2] so the grid always covers the viewport.
        let wx = (c - cols / 2) + scrollOffset;
        wx = ((wx % cols) + cols + cols / 2) % cols - cols / 2;

        const projected = project(wx, wy, wz);
        rowArr.push({ ...projected, wx });
      }
      pts.push(rowArr);
    }
    

    // Draw triangles back-to-front (painter's algorithm)
    const fillCol = rgbStr(colors.triFill);
    const near = colors.gridEdgeNear;
    const far = colors.gridEdgeFar;

    for (let r = rows - 1; r >= 0; r--) {
      // Interpolate edge color by depth: t=0 near, t=1 far
      const t = r / rows;
      const edgeR = Math.round(near[0] + (far[0] - near[0]) * t);
      const edgeG = Math.round(near[1] + (far[1] - near[1]) * t);
      const edgeB = Math.round(near[2] + (far[2] - near[2]) * t);
      const edgeCol = `rgba(${edgeR},${edgeG},${edgeB},0.7)`;

      for (let c = 0; c < cols; c++) {
        const p00 = pts[r][c];
        const p01 = pts[r][c + 1];
        const p10 = pts[r + 1][c];
        const p11 = pts[r + 1][c + 1];

        // Skip quads that straddle the circular wrap seam
        const dxTop = Math.abs(p00.wx - p01.wx);
        const dxBot = Math.abs(p10.wx - p11.wx);
        if (dxTop > 2 || dxBot > 2) continue;

        // Skip triangles entirely off-screen
        const minX = Math.min(p00.sx, p01.sx, p10.sx, p11.sx);
        const maxX = Math.max(p00.sx, p01.sx, p10.sx, p11.sx);
        if (maxX < 0 || minX > w) continue;

        // Triangle A: p00 - p01 - p11
        ctx.beginPath();
        ctx.moveTo(p00.sx, p00.sy);
        ctx.lineTo(p01.sx, p01.sy);
        ctx.lineTo(p11.sx, p11.sy);
        ctx.closePath();
        ctx.fillStyle = fillCol;
        ctx.fill();
        ctx.strokeStyle = edgeCol;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Triangle B: p00 - p11 - p10
        ctx.beginPath();
        ctx.moveTo(p00.sx, p00.sy);
        ctx.lineTo(p11.sx, p11.sy);
        ctx.lineTo(p10.sx, p10.sy);
        ctx.closePath();
        ctx.fillStyle = fillCol;
        ctx.fill();
        ctx.strokeStyle = edgeCol;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  /* ── Car (SVG edge + rotating wheels) ── */
  let _carCache = { w: 0, fill: null, edge: null };

  // Wheel geometry in SVG coordinate space (viewBox 0 0 960 384)
  const SVG_W = 960, SVG_H = 384;
  const WHEELS = [
    { cx: 214.04, cy: 260.07, outerR: 53.95, rimR: 39.06, hubR: 8.47 },
    { cx: 710.04, cy: 260.07, outerR: 53.95, rimR: 39.06, hubR: 8.47 },
  ];
  const SPOKE_COUNT = 5;

  function drawCar() {
    if (!carFillImg || !carEdgeImg) return;
    const horizonPx = h * HORIZON_Y;

    const carW = Math.ceil(w * CAR_WIDTH_FRAC);
    const carH = Math.ceil(carW * (carFillImg.height / carFillImg.width));
    const carX = (w - carW) / 2;
    const carY = horizonPx + (h - horizonPx) * CAR_Y_FRAC - carH / 2;

    // Rebuild cached scaled masks only when size changes
    if (_carCache.w !== carW) {
      _carCache.w = carW;
      _carCache.fill = smoothDownscale(carFillImg, carW, carH);
      // SVG renders crisp at any size — just draw directly to OffscreenCanvas
      const edgeOff = new OffscreenCanvas(carW, carH);
      const ec = edgeOff.getContext('2d');
      ec.drawImage(carEdgeImg, 0, 0, carW, carH);
      _carCache.edge = edgeOff;
    }

    // Draw fill layer — solid neutral-1 masked by fill alpha
    drawColorMasked(_carCache.fill, carX, carY, carW, carH, colors.carFill);
    // Draw edge layer — left-to-right gradient masked by edge alpha (SVG = sharp)
    drawGradientMasked(_carCache.edge, carX, carY, carW, carH, colors.carEdgeL, colors.carEdgeR);

    // Draw rotating wheels over the static spoke areas
    const scaleX = carW / SVG_W;
    const scaleY = carH / SVG_H;
    const wheelAngle = -scrollOffset * 2 * Math.PI * 0.5; // counterclockwise rotation

    for (const wh of WHEELS) {
      const cx = carX + wh.cx * scaleX;
      const cy = carY + wh.cy * scaleY;
      const rimR = wh.rimR * scaleX;
      const hubR = wh.hubR * scaleX;
      const lineW = 7.0 * scaleX; // thick to match car body stroke

      // Cover static spokes with fill color circle (inside the rim)
      ctx.beginPath();
      ctx.arc(cx, cy, rimR - lineW, 0, Math.PI * 2);
      ctx.fillStyle = rgbStr(colors.carFill);
      ctx.fill();

      // Interpolate gradient color at this X position
      const t = (cx - carX) / carW;
      const spokeColor = lerpRgb(colors.carEdgeL, colors.carEdgeR, t);

      // Draw rim circle
      ctx.beginPath();
      ctx.arc(cx, cy, rimR, 0, Math.PI * 2);
      ctx.strokeStyle = rgbStr(spokeColor);
      ctx.lineWidth = lineW;
      ctx.stroke();

      // Draw rotating spokes - extend to full rim radius to cover static spokes
      ctx.lineWidth = lineW;
      ctx.strokeStyle = rgbStr(spokeColor);
      for (let i = 0; i < SPOKE_COUNT; i++) {
        const angle = wheelAngle + (Math.PI * 2 * i) / SPOKE_COUNT;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * hubR, cy + Math.sin(angle) * hubR);
        ctx.lineTo(cx + Math.cos(angle) * rimR, cy + Math.sin(angle) * rimR);
        ctx.stroke();
      }

      // Draw hub circle
      ctx.beginPath();
      ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
      ctx.strokeStyle = rgbStr(spokeColor);
      ctx.lineWidth = lineW;
      ctx.stroke();
    }
  }

  /** Linearly interpolate two RGB triplets */
  function lerpRgb(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t),
    ];
  }

  /**
   * Step-down smooth downscale: halve repeatedly, then final resize.
   * Returns an OffscreenCanvas with the smoothly-scaled alpha mask.
   */
  function smoothDownscale(img, tw, th) {
    let srcW = img.width;
    let srcH = img.height;
    let current = img;

    // Halve until within 2× of target
    while (srcW / 2 > tw || srcH / 2 > th) {
      const halfW = Math.ceil(srcW / 2);
      const halfH = Math.ceil(srcH / 2);
      const step = new OffscreenCanvas(halfW, halfH);
      const sc = step.getContext('2d');
      sc.imageSmoothingEnabled = true;
      sc.imageSmoothingQuality = 'high';
      sc.drawImage(current, 0, 0, halfW, halfH);
      current = step;
      srcW = halfW;
      srcH = halfH;
    }

    // Final resize to exact target
    const out = new OffscreenCanvas(tw, th);
    const oc = out.getContext('2d');
    oc.imageSmoothingEnabled = true;
    oc.imageSmoothingQuality = 'high';
    oc.drawImage(current, 0, 0, tw, th);
    return out;
  }

  /** Draw a solid colour masked by an alpha-channel image. */
  function drawColorMasked(mask, x, y, tw, th, color) {
    const off = new OffscreenCanvas(tw, th);
    const oc = off.getContext('2d');
    oc.fillStyle = rgbStr(color);
    oc.fillRect(0, 0, tw, th);
    oc.globalCompositeOperation = 'destination-in';
    oc.drawImage(mask, 0, 0, tw, th);
    oc.globalCompositeOperation = 'source-over';
    ctx.drawImage(off, x, y);
  }

  /** Draw a left-to-right gradient masked by an alpha-channel image. */
  function drawGradientMasked(mask, x, y, tw, th, colorL, colorR) {
    const off = new OffscreenCanvas(tw, th);
    const oc = off.getContext('2d');
    const grad = oc.createLinearGradient(0, 0, tw, 0);
    grad.addColorStop(0, rgbStr(colorL));
    grad.addColorStop(1, rgbStr(colorR));
    oc.fillStyle = grad;
    oc.fillRect(0, 0, tw, th);
    oc.globalCompositeOperation = 'destination-in';
    oc.drawImage(mask, 0, 0, tw, th);
    oc.globalCompositeOperation = 'source-over';
    ctx.drawImage(off, x, y);
  }

  /* ── Animation loop ── */
  function frame() {
    if (!running) return;
    scrollOffset += SCROLL_RATE;
    resize();
    drawSky();
    drawSun();
    drawTerrain();
    drawCar();
    animId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    colors = extractColors(variant);
    heightMap = buildHeightMap();
    resize();
    frame();
  }

  function stop() {
    running = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  function update(newVariant) {
    variant = newVariant;
    colors = extractColors(variant);
  }

  return { canvas, start, stop, update };
}
