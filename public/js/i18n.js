/**
 * i18n.js — Lightweight internationalisation module.
 *
 * Loads JSON language packs from /i18n/<code>.json.
 * Provides t(key) lookup with fallback: selected → EN → raw key.
 * Applies translations to all elements with [data-i18n] attributes.
 */

const FALLBACK_LANG = "en";
let _strings = {};          // current language strings
let _fallback = {};         // English fallback strings
let _currentLang = FALLBACK_LANG;

/**
 * Load a language pack and apply it to the DOM.
 * @param {string} langCode - e.g. "en", "es", "fr"
 */
export async function loadLanguage(langCode) {
  langCode = langCode.toLowerCase();
  _currentLang = langCode;
  document.documentElement.lang = langCode;

  // Always ensure fallback is loaded
  if (Object.keys(_fallback).length === 0) {
    try {
      const res = await fetch(`/i18n/${FALLBACK_LANG}.json`);
      if (res.ok) _fallback = await res.json();
    } catch { /* silent */ }
  }

  if (langCode === FALLBACK_LANG) {
    _strings = _fallback;
  } else {
    try {
      const res = await fetch(`/i18n/${langCode}.json`);
      if (res.ok) _strings = await res.json();
      else _strings = {};
    } catch { _strings = {}; }
  }

  applyTranslations();
  document.dispatchEvent(new CustomEvent("language-changed", { detail: { lang: langCode } }));
}

/**
 * Translate a key.
 * @param {string} key
 * @returns {string}
 */
export function t(key) {
  return _strings[key] || _fallback[key] || key;
}

/**
 * Get the current language code.
 * @returns {string}
 */
export function getCurrentLang() {
  return _currentLang;
}

/**
 * Apply translations to all elements with [data-i18n] in the document.
 * Supports:
 *   data-i18n="key"              → sets textContent
 *   data-i18n-placeholder="key"  → sets placeholder attribute
 *   data-i18n-label="key"        → sets label attribute (for Web Components)
 *   data-i18n-title="key"        → sets title attribute
 *   data-i18n-message="key"      → sets message attribute (for notification-bar)
 *   data-i18n-values="key1,key2" → sets values attribute on segmented-control
 *                                   (translates each key, builds JSON array)
 */
export function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
  });
  document.querySelectorAll("[data-i18n-label]").forEach((el) => {
    el.setAttribute("label", t(el.dataset.i18nLabel));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.setAttribute("title", t(el.dataset.i18nTitle));
  });
  document.querySelectorAll("[data-i18n-message]").forEach((el) => {
    el.setAttribute("message", t(el.dataset.i18nMessage));
  });
  document.querySelectorAll("[data-i18n-caption]").forEach((el) => {
    el.setAttribute("caption", t(el.dataset.i18nCaption));
  });
  // Segmented controls: translate display values from i18n keys
  document.querySelectorAll("[data-i18n-values]").forEach((el) => {
    const keys = el.dataset.i18nValues.split(",").map((k) => k.trim());
    const translated = keys.map((k) => t(k));
    el.setAttribute("values", JSON.stringify(translated));
  });
  // HTML content translations (allows bold, links, etc.)
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
}
