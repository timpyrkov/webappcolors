const express = require("express");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

/* ── Version info from git tag ────────────────────────────────── */

const { execSync } = require("child_process");

app.get("/api/version", (_req, res) => {
  try {
    const tag = execSync("git describe --tags --abbrev=0", { encoding: "utf8" }).trim();
    const msg = execSync(`git tag -l --format='%(contents)' ${tag}`, { encoding: "utf8" }).trim();
    res.json({ tag, message: msg });
  } catch {
    res.json({ tag: "dev", message: "" });
  }
});

/* ── Save palette seeds back to palettes.js ─────────────────────────── */

const PALETTES_PATH = path.join(__dirname, "public", "js", "palettes.js");

app.post("/api/save-palette", (req, res) => {
  const { key, main, accents, gems, natural, flower, beverage } = req.body;
  if (!key) return res.status(400).json({ ok: false, error: "Missing key" });

  try {
    let src = fs.readFileSync(PALETTES_PATH, "utf8");

    // Update seed data in PALETTES block
    const paletteRe = new RegExp(
      `(${key}:\\s*\\{[^}]*?main:\\s*")#[0-9a-fA-F]{6}(")`,
      "s"
    );
    if (main) src = src.replace(paletteRe, `$1${main}$2`);

    if (accents) {
      const accRe = new RegExp(
        `(${key}:\\s*\\{[^}]*?accents:\\s*)\\[[^\\]]*\\]`,
        "s"
      );
      const accStr = JSON.stringify(accents);
      src = src.replace(accRe, `$1${accStr}`);
    }

    // Update display names in PALETTES block
    if (gems) {
      const gemsRe = new RegExp(
        `(${key}:\\s*\\{\\s*gems:\\s*")([^"]*)(".*?natural:)`,
        "s"
      );
      src = src.replace(gemsRe, `$1${gems}$3`);
    }
    if (natural) {
      const natRe = new RegExp(
        `(${key}:\\s*\\{[^}]*?natural:\\s*")([^"]*)(".*?flower:)`,
        "s"
      );
      src = src.replace(natRe, `$1${natural}$3`);
    }
    if (flower) {
      const flRe = new RegExp(
        `(${key}:\\s*\\{[^}]*?flower:\\s*")([^"]*)(".*?beverage:)`,
        "s"
      );
      src = src.replace(flRe, `$1${flower}$3`);
    }
    if (beverage) {
      const bevRe = new RegExp(
        `(${key}:\\s*\\{[^}]*?beverage:\\s*")([^"]*)(")`,
        "s"
      );
      src = src.replace(bevRe, `$1${beverage}$3`);
    }

    fs.writeFileSync(PALETTES_PATH, src, "utf8");
    res.json({ ok: true });
  } catch (err) {
    console.error("Save palette error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ── Export reusable modules as zip ────────────────────────────── */

app.get("/api/export-modules", (_req, res) => {
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="palette-modules.zip"');

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => res.status(500).send({ error: err.message }));
  archive.pipe(res);

  const jsDir = path.join(__dirname, "public", "js");
  archive.file(path.join(jsDir, "palette_tools.js"),  { name: "js/palette_tools.js" });
  archive.file(path.join(jsDir, "palettes.js"),       { name: "js/palettes.js" });
  const dataDir = path.join(__dirname, "public", "data");
  archive.file(path.join(dataDir, "PALETTES.md"),    { name: "PALETTES.md" });
  archive.file(path.join(dataDir, "PROMPT.md"),      { name: "PROMPT.md" });
  archive.file(path.join(__dirname, "LICENSE"),       { name: "LICENSE" });

  archive.finalize();
});

/* ── Static files ────────────────────────────────────────────── */

app.get("/favicon.ico", (_req, res) => res.redirect(301, "/icons/favicon.ico"));
app.use(express.static(path.join(__dirname, "public")));

/* ── Start ───────────────────────────────────────────────────── */

app.listen(PORT, () => {
  console.log(`✓ Dev server running at http://localhost:${PORT}`);
});

// Export for Vercel serverless
module.exports = app;
