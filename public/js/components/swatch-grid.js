/**
 * <swatch-grid> — Displays 5 rows × 5 columns of colour swatches.
 *
 * Usage:
 *   const grid = document.querySelector("swatch-grid");
 *   grid.setTokens(tokenMap, theme);
 *
 * Rows:
 *   1. Primary accents  (--primary-accent-1..5)
 *   2. Secondary accents (--secondary-accent-1..5)
 *   3. Neutral lights   (--fg-1..5 in dark theme, --bg-1..5 in light)
 *   4. Neutral darks    (--bg-1..5 in dark theme, --fg-1..5 in light)
 *   5. Notifications    (--color-note, --color-message, --color-success, --color-warning, --color-error)
 */

const ROW_DEFS = [
  {
    label: "Primary accents",
    tokens: ["--primary-accent-1", "--primary-accent-2", "--primary-accent-3", "--primary-accent-4", "--primary-accent-5"],
  },
  {
    label: "Secondary accents",
    tokens: ["--secondary-accent-1", "--secondary-accent-2", "--secondary-accent-3", "--secondary-accent-4", "--secondary-accent-5"],
  },
  {
    label: "Neutral lights",
    // resolved dynamically based on theme
    tokensDark:  ["--fg-1", "--fg-2", "--fg-3", "--fg-4", "--fg-5"],
    tokensLight: ["--bg-1", "--bg-2", "--bg-3", "--bg-4", "--bg-5"],
  },
  {
    label: "Neutral darks",
    tokensDark:  ["--bg-1", "--bg-2", "--bg-3", "--bg-4", "--bg-5"],
    tokensLight: ["--fg-1", "--fg-2", "--fg-3", "--fg-4", "--fg-5"],
  },
  {
    label: "Notifications",
    tokens: ["--color-note", "--color-message", "--color-success", "--color-warning", "--color-error"],
  },
];

class SwatchGrid extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tokens = {};
    this._theme = "dark";
  }

  connectedCallback() {
    this._render();
  }

  /**
   * @param {Object<string,string>} tokens - Flat token map (e.g. { "--bg-1": "#181610", ... })
   * @param {"dark"|"light"} theme
   */
  setTokens(tokens, theme) {
    this._tokens = tokens;
    this._theme = theme;
    this._render();
  }

  _resolveRow(def) {
    if (def.tokens) return def.tokens;
    return this._theme === "dark" ? def.tokensDark : def.tokensLight;
  }

  _render() {
    const tokens = this._tokens;
    const rows = ROW_DEFS.map((def) => {
      const names = this._resolveRow(def);
      const cells = names.map((name) => {
        const hex = tokens[name] || "#000000";
        const lum = this._relativeLuminance(hex);
        const textColor = lum > 0.4 ? "#000" : "#fff";
        return `<div class="cell" style="background:${hex};color:${textColor}">
          <span class="cell-name">${name}</span>
          <span class="cell-hex">${hex}</span>
        </div>`;
      }).join("");
      return `<div class="row">
        <div class="row-label">${def.label}</div>
        <div class="row-cells">${cells}</div>
      </div>`;
    }).join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .row { margin-bottom: 6px; }
        .row-label {
          font-size: 9px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          opacity: 0.5;
          margin-bottom: 2px;
          font-family: system-ui, sans-serif;
        }
        .row-cells {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 2px;
        }
        .cell {
          border-radius: 4px;
          padding: 4px 3px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1px;
          min-height: 36px;
        }
        .cell-name {
          font: 500 7px/1 system-ui, sans-serif;
          opacity: 0.7;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .cell-hex {
          font: 400 8px/1 monospace;
          opacity: 0.9;
        }
      </style>
      <div class="grid">${rows}</div>`;
  }

  _relativeLuminance(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const toLinear = (c) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }
}

customElements.define("swatch-grid", SwatchGrid);
