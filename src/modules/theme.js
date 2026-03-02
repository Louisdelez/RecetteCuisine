/**
 * Theme — Gestion du thème clair/sombre
 */

import { icon } from './icons.js';

const STORAGE_KEY = 'rc_theme';

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const prefersDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (prefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

export function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';

  if (next === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  localStorage.setItem(STORAGE_KEY, next);

  // Update button icon
  const btn = document.getElementById('btn-theme');
  if (btn) btn.innerHTML = icon(next === 'dark' ? 'Sun' : 'Moon', 18);
}

export function updateThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const btn = document.getElementById('btn-theme');
  if (btn) btn.innerHTML = icon(isDark ? 'Sun' : 'Moon', 18);
}
