/**
 * Render — Fonctions de rendu de l'interface
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';
import * as store from './store.js';
import { state } from './state.js';
import { currentUser } from './auth.js';
import { esc, excerpt, normalize } from './utils.js';
import { icon } from './icons.js';
import { t, getLang, SUPPORTED_LANGS } from './i18n.js';

export function render() {
  renderSidebar();
  renderGrid();
  renderFilters();
}

// ---- Auth UI ----
export function renderAuthUI() {
  const area = document.getElementById('auth-area');
  if (!area) return;

  if (currentUser) {
    const name = esc(currentUser.displayName || currentUser.email);
    const initial = (currentUser.displayName || currentUser.email || '?')[0].toUpperCase();
    const safePhoto = currentUser.photoURL && /^https:\/\//.test(currentUser.photoURL) ? currentUser.photoURL : null;
    const avatar = safePhoto
      ? `<img class="user-avatar" src="${esc(safePhoto)}" alt="${initial}" referrerpolicy="no-referrer">`
      : `<div class="user-avatar">${initial}</div>`;
    area.innerHTML = `
      <div class="user-info">
        ${avatar}
        <span class="user-name">${name}</span>
        <button class="btn-icon" id="btn-logout" title="${t('logout')}">${icon('LogOut', 16)}</button>
      </div>
    `;
  } else {
    area.innerHTML = `<button class="btn-ghost" id="btn-login">${icon('LogIn', 15)} ${t('login')}</button>`;
  }

  document.querySelectorAll('.auth-required').forEach((el) => {
    el.style.display = currentUser ? '' : 'none';
  });
}

// ---- Sidebar ----
function renderSidebar() {
  const allBtn = document.getElementById('nav-all');
  allBtn.classList.toggle('active', state.tags.length === 0);
  document.getElementById('count-all').textContent = store.recipes.length;

  // Only show active filter tags as pills
  const allTags = store.getAllTags();
  const el = document.getElementById('active-tags');
  if (!state.tags.length) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = state.tags.map(norm => {
    const found = allTags.find(t => t.normalized === norm);
    const label = found ? found.label : norm;
    return `<span class="tag-pill active" data-rm-stag="${norm}">${esc(label)} <button>&times;</button></span>`;
  }).join('');
}

// ---- Grid ----
function renderGrid() {
  const list = getFilteredRecipes();
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');

  if (!list.length) {
    grid.style.display = 'none';
    empty.style.display = '';
    const hasFilters = state.search || state.tags.length > 0;
    empty.querySelector('h3').textContent = hasFilters ? t('no_results') : t('no_recipes');
    empty.querySelector('p').textContent = hasFilters ? t('no_results_desc') : t('no_recipes_desc');
    return;
  }

  grid.style.display = '';
  empty.style.display = 'none';

  const uiLang = getLang();

  grid.innerHTML = list.map(r => {
    const rTags = r.tags || [];
    const langBadge = r.lang && r.lang !== uiLang && SUPPORTED_LANGS[r.lang]
      ? `<span class="recipe-lang-badge">${SUPPORTED_LANGS[r.lang]}</span>`
      : '';
    return `
      <article class="recipe-card" data-rid="${r.id}">
        ${langBadge}
        <div class="recipe-card-top">
          <h3>${esc(r.name)}</h3>
        </div>
        <div class="recipe-card-meta">
          ${r.time ? `<span>${icon('Clock', 14)} ${esc(String(r.time))} ${t('minutes_short')}</span>` : ''}
          ${r.servings ? `<span>${icon('Users', 14)} ${esc(String(r.servings))} ${t('servings_short')}</span>` : ''}
        </div>
        <p class="recipe-card-excerpt">${esc(excerpt(r.content || ''))}</p>
        ${rTags.length ? `<div class="recipe-card-tags">${rTags.map(tg => `<span class="mini-tag">${esc(tg)}</span>`).join('')}</div>` : ''}
        ${r.authorName ? `<div class="recipe-card-author">${icon('User', 12)} ${esc(r.authorName)}</div>` : ''}
      </article>
    `;
  }).join('');
}

// ---- Filters bar ----
function renderFilters() {
  const bar = document.getElementById('filters-bar');
  const hasFilters = state.tags.length > 0;
  bar.classList.toggle('visible', hasFilters);

  if (!hasFilters) {
    document.getElementById('filters-list').innerHTML = '';
    return;
  }

  const allTags = store.getAllTags();
  const html = state.tags.map(norm => {
    const found = allTags.find(tg => tg.normalized === norm);
    const label = found ? found.label : norm;
    return `<span class="filter-badge" style="background:var(--accent-light);color:var(--accent)">${icon('Tag', 12)} ${esc(label)} <button data-rm-tag="${norm}">&times;</button></span>`;
  }).join('');
  document.getElementById('filters-list').innerHTML = html;
}

// ---- Panel ----
export function renderPanel(recipe) {
  const rTags = recipe.tags || [];
  const isOwner = currentUser && recipe.userId === currentUser.uid;

  const editBtn = document.getElementById('btn-edit-panel');
  const delBtn = document.getElementById('btn-del-panel');
  if (editBtn) editBtn.style.display = isOwner ? '' : 'none';
  if (delBtn) delBtn.style.display = isOwner ? '' : 'none';

  const uiLang = getLang();
  const langInfo = recipe.lang && recipe.lang !== uiLang && SUPPORTED_LANGS[recipe.lang]
    ? `<span class="panel-meta-item">${icon('Globe', 16)} ${SUPPORTED_LANGS[recipe.lang]}</span>`
    : '';

  document.getElementById('panel-body').innerHTML = `
    <h1 class="panel-recipe-title">${esc(recipe.name)}</h1>
    ${recipe.authorName ? `<div class="panel-author">${icon('User', 14)} ${esc(recipe.authorName)}</div>` : ''}
    <div class="panel-meta">
      ${recipe.time ? `<span class="panel-meta-item">${icon('Clock', 16)} ${esc(String(recipe.time))} ${t('minutes_label')}</span>` : ''}
      ${recipe.servings ? `<span class="panel-meta-item">${icon('Users', 16)} ${esc(String(recipe.servings))} ${t('portions_label')}</span>` : ''}
      ${langInfo}
    </div>
    ${rTags.length ? `<div class="panel-tags">${rTags.map(tg => `<span class="ptag">${esc(tg)}</span>`).join('')}</div>` : ''}
    <div class="panel-content md-body">${DOMPurify.sanitize(marked.parse(recipe.content || ''))}</div>
  `;
}

// ---- Helpers ----
function getFilteredRecipes() {
  return store.recipes.filter(r => {
    // Multi-tag filter (AND logic)
    if (state.tags.length > 0) {
      const recipeTags = (r.tags || []).map(normalize);
      if (!state.tags.every(tg => recipeTags.includes(tg))) return false;
    }
    // Search
    if (state.search) {
      const q = normalize(state.search);
      const nameMatch = normalize(r.name).includes(q);
      const tagMatch = (r.tags || []).some(tg => normalize(tg).includes(q));
      const contentMatch = normalize(r.content || '').includes(q);
      return nameMatch || tagMatch || contentMatch;
    }
    return true;
  });
}
