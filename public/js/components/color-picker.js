/**
 * <color-picker> — OKLCh colour wheel with L×C area picker.
 * Extracted from the original flat.js for standalone use.
 */
import { hexToOklch, oklchToHex } from "../gen_colors.js";

class ColorPicker extends HTMLElement {
  static get observedAttributes() { return ["value", "disabled", "size"]; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._L = 0.6; this._C = 0.15; this._h = 60;
    this._dragging = null; // "ring" | "area"
  }

  connectedCallback() {
    const hex = this.getAttribute("value") || "#d08028";
    this._fromHex(hex);
    this._render();
    this._draw();
  }

  attributeChangedCallback(name) {
    if (name === "value" && !this._dragging) {
      this._fromHex(this.getAttribute("value") || "#d08028");
      if (this.shadowRoot.querySelector("canvas")) this._draw();
    }
  }

  _fromHex(hex) {
    try {
      const [L, C, h] = hexToOklch(hex);
      this._L = L; this._C = C; this._h = h;
    } catch { /* keep current */ }
  }

  _toHex() { return oklchToHex([this._L, this._C, this._h]); }

  _render() {
    const size = parseInt(this.getAttribute("size")) || 180;
    const hideInput = this.hasAttribute("no-input");
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-block; user-select: none; }
        :host([disabled]) { opacity: 0.38; pointer-events: none; }
        .wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        canvas { border-radius: 50%; cursor: crosshair; }
        .hex-row { display: flex; align-items: center; gap: 6px; }
        .swatch-preview {
          width: 24px; height: 24px; border-radius: 4px;
          border: 1px solid var(--bg-7);
        }
        .hex-input {
          width: 80px; padding: 4px 6px;
          font: 12px/1 monospace;
          background: var(--bg-3); color: var(--fg);
          border: 1px solid var(--bg-7); border-radius: 4px;
        }
      </style>
      <div class="wrap">
        <canvas width="${size}" height="${size}" style="width:${size}px;height:${size}px;border-radius:0;"></canvas>
        ${hideInput ? '' : `<div class="hex-row">
          <div class="swatch-preview" id="preview"></div>
          <input class="hex-input" id="hexInput" type="text" maxlength="7" />
        </div>`}
      </div>`;

    const canvas = this.shadowRoot.querySelector("canvas");
    canvas.addEventListener("pointerdown", (e) => this._onPointerDown(e, canvas));

    const hexInput = this.shadowRoot.getElementById("hexInput");
    if (hexInput) {
      hexInput.addEventListener("change", () => {
        let v = hexInput.value.trim();
        if (!v.startsWith("#")) v = "#" + v;
        if (/^#[0-9a-fA-F]{6}$/.test(v)) {
          this._fromHex(v);
          this.setAttribute("value", this._toHex());
          this._draw();
          this._fireChange();
        }
      });
    }
  }

  _draw() {
    const canvas = this.shadowRoot.querySelector("canvas");
    if (!canvas) return;
    const size = canvas.width;
    const ctx = canvas.getContext("2d");
    const cx = size / 2, cy = size / 2;
    const outerR = size / 2 - 2;
    const ringW = Math.max(10, Math.round(size * 0.12));
    const innerR = outerR - ringW;

    ctx.clearRect(0, 0, size, size);

    // ── Hue ring (OKLCh) ──
    const ringImg = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= innerR && dist <= outerR) {
          let angle = Math.atan2(dy, dx) * (180 / Math.PI);
          if (angle < 0) angle += 360;
          const hex = oklchToHex([0.7, 0.15, angle]);
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          const i = (y * size + x) * 4;
          ringImg.data[i] = r; ringImg.data[i + 1] = g;
          ringImg.data[i + 2] = b; ringImg.data[i + 3] = 255;
        }
      }
    }
    ctx.putImageData(ringImg, 0, 0);

    // Hue indicator on ring
    const hRad = this._h * Math.PI / 180;
    const midR = (innerR + outerR) / 2;
    const hx = cx + midR * Math.cos(hRad);
    const hy = cy + midR * Math.sin(hRad);
    ctx.beginPath();
    ctx.arc(hx, hy, ringW / 2 - 2, 0, Math.PI * 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // ── L × C rectangle inside ring ──
    const areaR = innerR - 6;
    const areaSize = Math.floor(areaR * Math.sqrt(2));
    const areaX = cx - areaSize / 2, areaY = cy - areaSize / 2;

    const areaImg = ctx.createImageData(areaSize, areaSize);
    for (let py = 0; py < areaSize; py++) {
      for (let px = 0; px < areaSize; px++) {
        const L = 1 - py / areaSize;
        const C = (px / areaSize) * 0.37;
        const hex = oklchToHex([L, C, this._h]);
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const i = (py * areaSize + px) * 4;
        areaImg.data[i] = r; areaImg.data[i + 1] = g;
        areaImg.data[i + 2] = b; areaImg.data[i + 3] = 255;
      }
    }

    const offscreen = document.createElement("canvas");
    offscreen.width = areaSize; offscreen.height = areaSize;
    offscreen.getContext("2d").putImageData(areaImg, 0, 0);
    ctx.drawImage(offscreen, areaX, areaY);

    // Area border
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(areaX, areaY, areaSize, areaSize);

    // L×C crosshair
    const cursorX = areaX + (this._C / 0.37) * areaSize;
    const cursorY = areaY + (1 - this._L) * areaSize;
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, 3, 0, Math.PI * 2);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Store area bounds for hit testing
    this._area = { x: areaX, y: areaY, size: areaSize };
    this._ring = { cx, cy, innerR, outerR };

    // Update preview + input
    const hex = this._toHex();
    const preview = this.shadowRoot.getElementById("preview");
    if (preview) preview.style.background = hex;
    const hexInput = this.shadowRoot.getElementById("hexInput");
    if (hexInput && document.activeElement !== hexInput) hexInput.value = hex;
  }

  _onPointerDown(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX, y = (e.clientY - rect.top) * scaleY;
    const { cx, cy, innerR, outerR } = this._ring;
    const dx = x - cx, dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist >= innerR && dist <= outerR) {
      this._dragging = "ring";
    } else if (x >= this._area.x && x <= this._area.x + this._area.size &&
               y >= this._area.y && y <= this._area.y + this._area.size) {
      this._dragging = "area";
    } else {
      return;
    }

    canvas.setPointerCapture(e.pointerId);
    this._updateFromPointer(x, y);

    const onMove = (ev) => {
      const mx = (ev.clientX - rect.left) * scaleX, my = (ev.clientY - rect.top) * scaleY;
      this._updateFromPointer(mx, my);
    };
    const onUp = () => {
      this._dragging = null;
      canvas.removeEventListener("pointermove", onMove);
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp, { once: true });
  }

  _updateFromPointer(x, y) {
    if (this._dragging === "ring") {
      let angle = Math.atan2(y - this._ring.cy, x - this._ring.cx) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      this._h = angle;
    } else if (this._dragging === "area") {
      const { x: ax, y: ay, size: as } = this._area;
      const px = Math.max(0, Math.min(1, (x - ax) / as));
      const py = Math.max(0, Math.min(1, (y - ay) / as));
      this._C = px * 0.37;
      this._L = 1 - py;
    }
    this._draw();
    const hex = this._toHex();
    this.setAttribute("value", hex);
    this._fireChange();
  }

  _fireChange() {
    this.dispatchEvent(new CustomEvent("change", {
      bubbles: true,
      detail: { value: this._toHex(), L: this._L, C: this._C, h: this._h },
    }));
  }

  getValue() { return this._toHex(); }
  setValue(hex) {
    this._fromHex(hex);
    this.setAttribute("value", hex);
    if (this.shadowRoot.querySelector("canvas")) this._draw();
  }
}

customElements.define("color-picker", ColorPicker);
