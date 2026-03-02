/**
 * Main — Point d'entrée de l'application
 */

import './style.css';
import { marked } from 'marked';
import { buildShell } from './modules/shell.js';
import { render, renderAuthUI } from './modules/render.js';
import { initDocumentEvents, initShellEvents } from './modules/events.js';
import { initTheme } from './modules/theme.js';
import { updateThemeIcon } from './modules/theme.js';
import { setOnChange, initStore } from './modules/store.js';
import { initAuth, onAuthChange } from './modules/auth.js';
import { initLang, setOnLangChange } from './modules/i18n.js';

// Configure marked
marked.setOptions({ breaks: true, gfm: true });

// Apply saved theme before shell to avoid flash
initTheme();

// Init language before building shell
initLang();

// Build DOM
document.getElementById('app').innerHTML = buildShell();

// Init document-level events (once)
initDocumentEvents();

// Init shell-level events (attached to shell DOM elements)
initShellEvents();

// Rebuild shell when language changes
setOnLangChange(() => {
  document.getElementById('app').innerHTML = buildShell();
  initShellEvents();
  render();
  renderAuthUI();
  updateThemeIcon();
});

// Wire Firestore changes to render
setOnChange(render);

// Wait for auth before starting store to avoid flash
initAuth().then(() => {
  initStore();
  renderAuthUI();
  render();
});

// Re-render on subsequent auth changes
onAuthChange(() => {
  renderAuthUI();
  render();
});
