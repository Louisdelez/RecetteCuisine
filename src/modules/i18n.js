/**
 * i18n — Internationalisation module
 */

import { translations } from './translations.js';

const STORAGE_KEY = 'rc_lang';

let currentLang = 'fr';
let onLangChange = null;

export const SUPPORTED_LANGS = {
  fr: 'Fran\u00e7ais',
  en: 'English',
  de: 'Deutsch',
  it: 'Italiano',
  es: 'Espa\u00f1ol',
};

export function t(key, params) {
  const str = (translations[currentLang] && translations[currentLang][key]) || translations.fr[key] || key;
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => params[k] !== undefined ? params[k] : `{${k}}`);
}

export function getLang() {
  return currentLang;
}

export function setLang(code) {
  if (!SUPPORTED_LANGS[code]) return;
  currentLang = code;
  localStorage.setItem(STORAGE_KEY, code);
  if (onLangChange) onLangChange();
}

export function initLang() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && SUPPORTED_LANGS[saved]) {
    currentLang = saved;
    return;
  }
  const nav = (navigator.language || '').slice(0, 2).toLowerCase();
  currentLang = SUPPORTED_LANGS[nav] ? nav : 'fr';
}

export function setOnLangChange(fn) {
  onLangChange = fn;
}
