/**
 * Utils — Fonctions utilitaires
 */

const escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, c => escMap[c]);
}

export function normalize(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function excerpt(md, max = 110) {
  const text = md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/[-*+]\s+/g, '')
    .replace(/\d+\.\s+/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  return text.length > max ? text.slice(0, max) + '...' : text;
}

export function sanitizeFilename(name) {
  if (!name) return 'recette';
  const clean = name
    .normalize('NFD')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s+/g, '_')
    .trim();
  return clean || 'recette';
}
