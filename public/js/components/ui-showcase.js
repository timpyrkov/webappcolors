/**
 * <ui-showcase> — Renders a miniature UI demo inside each quadrant:
 *   - Gradient page background (applied to the quadrant itself)
 *   - Inner panel with gradient bg + highlighted edge
 *   - Typography (h1, h2, h3, p, accent)
 *   - Two rows of 3 gradient buttons (active / default / disabled)
 *     Row 1 uses primary accents, Row 2 uses secondary accents
 *   - A text input + checkbox row
 */

class UiShowcase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tokens = {};
    this._theme = "dark";
  }

  connectedCallback() { this._render(); }

  setTokens(tokens, theme) {
    this._tokens = tokens;
    this._theme = theme;
    this._render();
  }

  _render() {
    const T = this._tokens;
    if (!T["--bg-1"]) return;

    // Shorthands
    const bg1 = T["--bg-1"], bg2 = T["--bg-2"], bg3 = T["--bg-3"];
    const bg4 = T["--bg-4"], bg5 = T["--bg-5"], bg6 = T["--bg-6"], bg7 = T["--bg-7"];
    const fg1 = T["--fg-1"], fg2 = T["--fg-2"], fg3 = T["--fg-3"];
    const pa1 = T["--primary-accent-1"], pa2 = T["--primary-accent-2"];
    const pa3 = T["--primary-accent-3"], pa4 = T["--primary-accent-4"], pa5 = T["--primary-accent-5"];
    const sa1 = T["--secondary-accent-1"], sa2 = T["--secondary-accent-2"];
    const sa3 = T["--secondary-accent-3"], sa4 = T["--secondary-accent-4"], sa5 = T["--secondary-accent-5"];

    // Determine readable text on accent bg
    const paFg = this._contrastText(pa3);
    const saFg = this._contrastText(sa3);

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; height: 100%; }

        .page {
          height: 100%;
          min-height: 0;
          background: linear-gradient(180deg, ${bg1} 0%, ${bg2} 100%);
          color: ${fg1};
          padding: 10px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-family: system-ui, -apple-system, sans-serif;
          overflow: hidden;
        }

        /* ── Inner panel ── */
        .panel {
          background: linear-gradient(180deg, ${bg2} 0%, ${bg3} 100%);
          border: 1px solid ${bg7};
          border-radius: 6px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* ── Typography ── */
        .typo h1 { font-size: 0.85rem; font-weight: 700; color: ${fg1}; margin: 0; }
        .typo h2 { font-size: 0.7rem; font-weight: 600; color: ${fg1}; opacity: 0.85; margin: 0; }
        .typo h3 { font-size: 0.6rem; font-weight: 500; color: ${fg2}; margin: 0; }
        .typo p  { font-size: 0.55rem; line-height: 1.35; color: ${fg1}; opacity: 0.8; margin: 0; }
        .typo .accent { font-size: 0.55rem; color: ${pa3}; margin: 0; }

        /* ── Button rows ── */
        .btn-row {
          display: flex;
          gap: 4px;
          flex-wrap: nowrap;
        }
        .btn {
          flex: 1;
          padding: 5px 4px;
          border-radius: 5px;
          border: none;
          font: 500 0.5rem/1 system-ui, sans-serif;
          cursor: pointer;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: filter 0.12s;
        }

        /* Primary accent buttons */
        .btn.pa-active  { background: linear-gradient(180deg, ${pa4} 0%, ${pa2} 100%); color: ${paFg}; box-shadow: 0 1px 3px rgba(0,0,0,0.35); }
        .btn.pa-hover   { background: linear-gradient(180deg, ${pa5} 0%, ${pa3} 100%); color: ${paFg}; border: 1px solid ${pa4}; }
        .btn.pa-default { background: linear-gradient(180deg, ${bg5} 0%, ${bg4} 100%); color: ${fg1}; border: 1px solid ${bg7}; }
        .btn.pa-disabled { background: ${bg3}; color: ${fg2}; opacity: 0.5; cursor: default; }

        /* Secondary accent buttons */
        .btn.sa-active  { background: linear-gradient(180deg, ${sa4} 0%, ${sa2} 100%); color: ${saFg}; box-shadow: 0 1px 3px rgba(0,0,0,0.35); }
        .btn.sa-hover   { background: linear-gradient(180deg, ${sa5} 0%, ${sa3} 100%); color: ${saFg}; border: 1px solid ${sa4}; }
        .btn.sa-default { background: linear-gradient(180deg, ${bg5} 0%, ${bg4} 100%); color: ${fg1}; border: 1px solid ${bg7}; }
        .btn.sa-disabled { background: ${bg3}; color: ${fg2}; opacity: 0.5; cursor: default; }

        /* ── Input row ── */
        .input-row {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .text-input {
          flex: 1;
          padding: 4px 6px;
          font: 0.5rem/1 system-ui, sans-serif;
          background: ${bg4};
          color: ${fg1};
          border: 1px solid ${bg7};
          border-radius: 4px;
          outline: none;
        }
        .text-input::placeholder { color: ${fg2}; }
        .text-input:focus { border-color: ${fg3}; box-shadow: 0 0 0 1px ${fg3}; }

        /* ── Toggle switch ── */
        .toggle {
          width: 28px; height: 16px;
          background: ${bg6};
          border-radius: 8px;
          position: relative;
          cursor: pointer;
          flex-shrink: 0;
          border: 1px solid ${bg7};
        }
        .toggle.on { background: linear-gradient(90deg, ${pa2}, ${pa4}); }
        .toggle::after {
          content: '';
          position: absolute;
          top: 2px; left: 2px;
          width: 10px; height: 10px;
          background: ${fg1};
          border-radius: 50%;
          transition: transform 0.15s;
        }
        .toggle.on::after { transform: translateX(12px); }

        /* ── Checkbox ── */
        .checkbox {
          width: 14px; height: 14px;
          background: ${bg4};
          border: 1px solid ${bg7};
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          color: ${paFg};
          flex-shrink: 0;
          cursor: pointer;
        }
        .checkbox.checked { background: ${pa3}; border-color: ${pa3}; }

        .label { font-size: 0.48rem; color: ${fg2}; white-space: nowrap; }

        /* ── Separator ── */
        .sep { height: 1px; background: ${bg7}; margin: 2px 0; }

        /* ── Notification dots ── */
        .notif-row {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .dot {
          width: 8px; height: 8px;
          border-radius: 50%;
        }
      </style>

      <div class="page">
        <div class="panel">
          <div class="typo">
            <h1>Title</h1>
            <h2>Heading</h2>
            <h3>Sub-heading</h3>
            <p>Normal paragraph text in this theme.</p>
            <p class="accent">Accent comment text.</p>
          </div>

          <div class="sep"></div>

          <div class="btn-row">
            <button class="btn pa-active">Active</button>
            <button class="btn pa-hover">Hover</button>
            <button class="btn pa-default">Default</button>
            <button class="btn pa-disabled" disabled>Disabled</button>
          </div>
          <div class="btn-row">
            <button class="btn sa-active">Active</button>
            <button class="btn sa-hover">Hover</button>
            <button class="btn sa-default">Default</button>
            <button class="btn sa-disabled" disabled>Disabled</button>
          </div>

          <div class="sep"></div>

          <div class="input-row">
            <input class="text-input" type="text" placeholder="Placeholder..." value="" />
            <div class="toggle on"></div>
            <div class="checkbox checked">✓</div>
            <span class="label">Label</span>
          </div>

          <div class="notif-row">
            <div class="dot" style="background:${T["--color-note"]}"></div>
            <div class="dot" style="background:${T["--color-message"]}"></div>
            <div class="dot" style="background:${T["--color-success"]}"></div>
            <div class="dot" style="background:${T["--color-warning"]}"></div>
            <div class="dot" style="background:${T["--color-error"]}"></div>
            <span class="label">Notifications</span>
          </div>
        </div>
      </div>`;
  }

  _contrastText(hex) {
    if (!hex) return "#ffffff";
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const toLinear = (c) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    return lum > 0.35 ? "#000000" : "#ffffff";
  }
}

customElements.define("ui-showcase", UiShowcase);
