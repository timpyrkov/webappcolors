require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.SESSION_SECRET || "fallback-secret";
const LOGIN_USER = process.env.LOGIN_USER || "demo";
const LOGIN_PASS = process.env.LOGIN_PASS || "demo";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ── Auth helpers ─────────────────────────────────────────────── */

function createToken(username) {
  return jwt.sign({ user: username }, SECRET, { expiresIn: "24h" });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

/* ── API routes ──────────────────────────────────────────────── */

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === LOGIN_USER && password === LOGIN_PASS) {
    const token = createToken(username);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: "Invalid credentials" });
});

app.get("/api/logout", (_req, res) => {
  res.clearCookie("token");
  res.redirect("/login.html");
});

app.get("/api/me", (req, res) => {
  const payload = verifyToken(req.cookies.token);
  if (payload) return res.json({ ok: true, user: payload.user });
  return res.status(401).json({ ok: false });
});

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


/* ── Auth guard middleware ────────────────────────────────────── */

const PUBLIC_PATHS = ["/login.html", "/css/login.css", "/api/login"];

app.use((req, res, next) => {
  if (PUBLIC_PATHS.some((p) => req.path === p)) return next();
  if (req.path.startsWith("/api/")) return next();

  const payload = verifyToken(req.cookies.token);
  if (!payload) return res.redirect("/login.html");
  next();
});

/* ── Static files ────────────────────────────────────────────── */

app.use(express.static(path.join(__dirname, "public")));

/* ── Start ───────────────────────────────────────────────────── */

app.listen(PORT, () => {
  console.log(`✓ Dev server running at http://localhost:${PORT}`);
});
