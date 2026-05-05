/**
 * <segmented-control> — Grid-based segmented selector.
 * Extracted from the original flat.js for standalone use.
 */
class SegmentedControl extends HTMLElement {
  static get observedAttributes() { return ["values", "keys", "value", "columns", "disabled", "accent", "no-hover-edge"]; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._values = [];   // display labels
    this._keys = [];     // stable identifiers (optional, defaults to values)
    this._value = "";    // currently selected key (or display value if no keys)
    this._columns = 4;
  }

  connectedCallback() { this._readAttrs(); this._render(); }
  attributeChangedCallback() { this._readAttrs(); if (this.shadowRoot.querySelector(".grid")) this._render(); }

  _readAttrs() {
    const raw = this.getAttribute("values");
    if (raw) {
      try { this._values = JSON.parse(raw); }
      catch { this._values = raw.split(",").map((s) => s.trim()); }
    }
    const rawKeys = this.getAttribute("keys");
    if (rawKeys) {
      try { this._keys = JSON.parse(rawKeys); }
      catch { this._keys = rawKeys.split(",").map((s) => s.trim()); }
    } else {
      this._keys = [];
    }
    // value attr stores the key (or display value when no keys)
    this._value = this.getAttribute("value") || (this._keys.length ? this._keys[0] : this._values[0]) || "";
    this._columns = parseInt(this.getAttribute("columns") ?? 4, 10);
  }

  /** Map a display label → key, or key → key */
  _keyOf(index) { return this._keys.length ? this._keys[index] : this._values[index]; }

  _render() {
    const cols = this._columns;
    const total = this._values.length;
    const rows = Math.ceil(total / cols);
    const isSecondary = this.getAttribute("accent") === "secondary";
    const accentBg  = "var(--fg)";
    const accentFg  = "#111";
    const hoverEdge = "var(--fg-2)";
    const noHoverEdge = this.hasAttribute("no-hover-edge");

    const items = this._values.map((v, i) => {
      const key = this._keyOf(i);
      const sel = key === this._value;
      const row = Math.floor(i / cols);
      const col = i % cols;
      const colsInRow = Math.min(cols, total - row * cols);
      const r = 6;
      const tl = (row === 0 && col === 0) ? r : 0;
      const tr = (row === 0 && col === colsInRow - 1) ? r : 0;
      const bl = (row === rows - 1 && col === 0) ? r : 0;
      const br = (row === rows - 1 && col === colsInRow - 1) ? r : 0;
      return `<button class="seg${sel ? " active" : ""}" data-key="${key}" data-index="${i}"
        style="border-radius:${tl}px ${tr}px ${br}px ${bl}px">${v}</button>`;
    }).join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-block; user-select: none; -webkit-user-select: none; }
        :host([disabled]) { opacity: 0.38; pointer-events: none; }
        .grid {
          display: grid;
          grid-template-columns: repeat(${cols}, 1fr);
        }
        .seg {
          padding: var(--seg-padding, 7px 10px);
          font-size: var(--seg-font-size, 13px);
          line-height: 1;
          font-family: var(--font-display, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
          background: var(--bg-3);
          color: var(--fg);
          border: 1px solid var(--bg-7);
          margin: -0.5px;
          cursor: pointer;
          position: relative;
          transition: background 0.12s, color 0.12s, border-color 0.12s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .seg:hover:not(.active) {
          z-index: 2;
          background: var(--bg-5);
          ${noHoverEdge ? "" : `border-color: ${hoverEdge};`}
        }
        .seg.active {
          z-index: 1;
          background: ${accentBg};
          color: ${accentFg};
          border-color: var(--bg-7);
          font-weight: 600;
        }
      </style>
      <div class="grid">${items}</div>`;

    this.shadowRoot.querySelectorAll(".seg").forEach((el) => {
      el.addEventListener("pointerup", () => {
        const key = el.dataset.key;
        if (key === this._value) return;
        this._value = key;
        this.setAttribute("value", key);
        this._render();
        this.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { value: key } }));
      });
    });
  }

  getValue() { return this._value; }
  setValue(v) {
    const valid = this._keys.length ? this._keys.includes(v) : this._values.includes(v);
    if (valid) {
      this._value = v;
      this.setAttribute("value", v);
      this._render();
    }
  }
}

customElements.define("segmented-control", SegmentedControl);
