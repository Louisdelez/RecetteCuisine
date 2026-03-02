/**
 * Events — Tous les handlers d'événements
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';
import * as store from './store.js';
import { state } from './state.js';
import { esc, normalize } from './utils.js';
import { render, renderPanel, renderAuthUI } from './render.js';
import { downloadMd, downloadPdf } from './download.js';
import { toggleTheme, updateThemeIcon } from './theme.js';
import { currentUser, signUpWithEmail, signInWithEmail, signInWithGoogle, signOut } from './auth.js';
import { t, getLang, setLang } from './i18n.js';

// ---- Helpers ----
const $ = (id) => document.getElementById(id);

let authIsRegister = false;
let editorTags = []; // current tags in the editor (raw strings)

function openPanel(id) {
  const r = store.recipes.find(x => x.id === id);
  if (!r) return;
  state.viewId = id;
  renderPanel(r);
  $('panel-overlay').classList.add('open');
  $('recipe-panel').classList.add('open');
}

function closePanel() {
  $('panel-overlay').classList.remove('open');
  $('recipe-panel').classList.remove('open');
  state.viewId = null;
}

// ---- Editor tag input helpers ----
function renderEditorTags() {
  const wrap = $('ed-tags');
  const input = $('ed-tag-input');
  // Remove existing pills
  wrap.querySelectorAll('.tag-input-pill').forEach(p => p.remove());
  // Insert pills before input
  editorTags.forEach((tag, i) => {
    const pill = document.createElement('span');
    pill.className = 'tag-input-pill';
    pill.innerHTML = `${esc(tag)} <button data-rm-ed-tag="${i}">&times;</button>`;
    wrap.insertBefore(pill, input);
  });
}

function addEditorTag(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;
  // Check for duplicate (normalized)
  const norm = normalize(trimmed);
  if (editorTags.some(t => normalize(t) === norm)) return;
  editorTags.push(trimmed);
  renderEditorTags();
  $('ed-tag-input').value = '';
  hideSuggestions();
}

function removeEditorTag(index) {
  editorTags.splice(index, 1);
  renderEditorTags();
}

function showSuggestions(query) {
  const sugBox = $('ed-tag-suggestions');
  if (!query.trim()) { hideSuggestions(); return; }
  const q = normalize(query);
  const allTags = store.getAllTags();
  const currentNorms = editorTags.map(normalize);
  const matches = allTags.filter(t => !currentNorms.includes(t.normalized) && t.normalized.includes(q));
  if (!matches.length) { hideSuggestions(); return; }
  sugBox.innerHTML = matches.slice(0, 8).map(t =>
    `<div class="tag-suggestion" data-sug="${esc(t.label)}">${esc(t.label)} <span class="tag-sug-count">(${t.count})</span></div>`
  ).join('');
  sugBox.style.display = '';
}

function hideSuggestions() {
  $('ed-tag-suggestions').style.display = 'none';
  $('ed-tag-suggestions').innerHTML = '';
}

function openEditor(id) {
  state.editId = id || null;
  editorTags = [];

  if (id) {
    const r = store.recipes.find(x => x.id === id);
    if (!r) return;
    $('ed-title').textContent = t('edit_recipe_title');
    $('ed-name').value = r.name;
    $('ed-servings').value = r.servings || '';
    $('ed-time').value = r.time || '';
    $('ed-lang').value = r.lang || getLang();
    $('ed-content').value = r.content || '';
    editorTags = [...(r.tags || [])];
  } else {
    $('ed-title').textContent = t('new_recipe_title');
    $('ed-name').value = '';
    $('ed-servings').value = '';
    $('ed-time').value = '';
    $('ed-lang').value = getLang();
    $('ed-content').value = '';
  }

  renderEditorTags();
  $('ed-tag-input').value = '';
  hideSuggestions();
  switchTab('edit');
  $('editor-modal').classList.add('visible');
  setTimeout(() => $('ed-name').focus(), 120);
}

function closeEditor() {
  $('editor-modal').classList.remove('visible');
  state.editId = null;
  editorTags = [];
}

async function saveRecipe() {
  const name = $('ed-name').value.trim();
  if (!name) {
    $('ed-name').style.borderColor = 'var(--danger)';
    $('ed-name').focus();
    setTimeout(() => $('ed-name').style.borderColor = '', 2000);
    return;
  }

  const rawServings = $('ed-servings').value ? parseInt($('ed-servings').value, 10) : null;
  const rawTime = $('ed-time').value ? parseInt($('ed-time').value, 10) : null;

  const data = {
    name,
    servings: rawServings && rawServings > 0 && isFinite(rawServings) ? rawServings : null,
    time: rawTime && rawTime > 0 && isFinite(rawTime) ? rawTime : null,
    tags: editorTags.slice(0, 20),
    content: $('ed-content').value.slice(0, 50000),
    lang: $('ed-lang').value,
  };

  try {
    if (state.editId) {
      await store.updateRecipe(state.editId, data);
    } else {
      await store.addRecipe(data);
    }
    closeEditor();
  } catch (err) {
    console.error('Save error:', err);
  }
}

function switchTab(tab) {
  document.querySelectorAll('.editor-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  const textarea = $('ed-content');
  const preview = $('ed-preview');
  if (tab === 'edit') { textarea.style.display = ''; preview.style.display = 'none'; }
  else { textarea.style.display = 'none'; preview.style.display = ''; preview.innerHTML = DOMPurify.sanitize(marked.parse(textarea.value || `*${t('no_content_preview')}*`)); }
}

function openDelete(id) {
  state.deleteTarget = { id };
  const item = store.recipes.find(x => x.id === id);
  const label = item ? item.name : '';
  $('del-msg').textContent = t('delete_confirm', { name: label });
  $('delete-modal').classList.add('visible');
}

function closeDelete() { $('delete-modal').classList.remove('visible'); state.deleteTarget = null; }

async function confirmDelete() {
  if (!state.deleteTarget) return;
  const { id } = state.deleteTarget;
  try {
    await store.removeRecipe(id);
    if (state.viewId === id) closePanel();
    closeDelete();
  } catch (err) {
    console.error('Delete error:', err);
  }
}

// ---- Auth modal ----
function openAuthModal() {
  authIsRegister = false;
  updateAuthMode();
  $('auth-error').style.display = 'none';
  $('auth-email').value = '';
  $('auth-password').value = '';
  $('auth-name').value = '';
  $('auth-modal').classList.add('visible');
  setTimeout(() => $('auth-email').focus(), 120);
}

function closeAuthModal() {
  $('auth-modal').classList.remove('visible');
}

function updateAuthMode() {
  $('auth-title').textContent = authIsRegister ? t('register_title') : t('login_title');
  $('btn-auth-submit').textContent = authIsRegister ? t('register_btn') : t('login_btn');
  $('auth-name-field').style.display = authIsRegister ? '' : 'none';
  $('auth-switch-text').textContent = authIsRegister ? t('has_account') : t('no_account');
  $('btn-auth-toggle').textContent = authIsRegister ? t('sign_in') : t('create_account');
}

function showAuthError(msg) {
  const el = $('auth-error');
  el.textContent = msg;
  el.style.display = '';
}

async function handleAuthSubmit() {
  $('auth-error').style.display = 'none';
  const email = $('auth-email').value.trim();
  const password = $('auth-password').value;

  if (!email || !password) {
    showAuthError(t('err_fill_fields'));
    return;
  }

  try {
    if (authIsRegister) {
      const name = $('auth-name').value.trim();
      if (!name) { showAuthError(t('err_enter_name')); return; }
      await signUpWithEmail(email, password, name);
    } else {
      await signInWithEmail(email, password);
    }
    closeAuthModal();
    renderAuthUI();
  } catch (err) {
    const messages = {
      'auth/email-already-in-use': t('err_email_in_use'),
      'auth/invalid-email': t('err_invalid_email'),
      'auth/weak-password': t('err_weak_password'),
      'auth/invalid-credential': t('err_invalid_credential'),
      'auth/user-not-found': t('err_user_not_found'),
      'auth/wrong-password': t('err_wrong_password'),
    };
    const code = err.code || '';
    showAuthError(messages[code] || t('err_generic', { msg: err.message }));
  }
}

async function handleGoogleSignIn() {
  $('auth-error').style.display = 'none';
  try {
    await signInWithGoogle();
    closeAuthModal();
    renderAuthUI();
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      showAuthError(t('err_google', { msg: err.message }));
    }
  }
}

async function handleLogout() {
  try {
    await signOut();
    renderAuthUI();
    if (state.viewId) {
      const r = store.recipes.find(x => x.id === state.viewId);
      if (r) renderPanel(r);
    }
  } catch (err) {
    console.error('Logout error:', err);
  }
}

// ---- Copy prompt ----
function getRecipePrompt() {
  const tpl = [
    'Tu es un chef cuisinier expert. Donne-moi une recette en Markdown.',
    '',
    'Ta réponse doit être UNIQUEMENT un bloc de code Markdown, sans explication, sans introduction, sans texte avant ou après. Juste un bloc de code que je copie-colle directement.',
    '',
    'Structure à respecter :',
    '',
    '## Ingrédients',
    '- Liste à puces avec quantités précises (grammes, ml, cuillères, etc.)',
    '',
    '## Préparation',
    '- Étapes numérotées (1. 2. 3.), détaillées et claires',
    '',
    '## Notes',
    '- Astuces, variantes ou conseils (optionnel)',
    '',
    '---',
    '',
    'Exemple de réponse attendue :',
    '',
    '## Ingrédients',
    '',
    '- 400g de nouilles ramen fraîches',
    '- 1L de bouillon de porc',
    '- 200g de poitrine de porc',
    '- 4 œufs',
    '- 2 oignons verts émincés',
    '- 2 cuillères à soupe de sauce soja',
    '- 1 cuillère à soupe d\'huile de sésame',
    '',
    '## Préparation',
    '',
    '1. Faire bouillir les œufs 6 minutes 30. Les plonger dans l\'eau glacée puis les écaler.',
    '2. Chauffer le bouillon à feu doux avec la sauce soja et l\'huile de sésame pendant 10 minutes.',
    '3. Couper le porc en tranches fines et les saisir 2 minutes de chaque côté.',
    '4. Cuire les nouilles 2-3 minutes, les égoutter.',
    '5. Répartir les nouilles dans les bols, verser le bouillon, garnir avec le porc, les œufs coupés en deux et les oignons verts.',
    '',
    '## Notes',
    '',
    '- Ajoutez une cuillère de pâte de miso blanc pour un bouillon plus riche.',
    '- Les œufs peuvent être marinés la veille dans un mélange sauce soja + mirin.',
    '',
    '---',
    '',
    'Donne-moi la recette de : ',
  ];
  return tpl.join('\n');
}

async function copyRecipePrompt() {
  const text = getRecipePrompt();
  const btn = $('btn-copy-prompt');
  const label = btn.querySelector('.btn-label');
  const orig = label.textContent;

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  label.textContent = t('copied');
  btn.classList.add('btn-copied');
  setTimeout(() => { label.textContent = orig; btn.classList.remove('btn-copied'); }, 2000);
}

// ---- Document-level events (called once) ----
let documentEventsInitialized = false;
export function initDocumentEvents() {
  if (documentEventsInitialized) return;
  documentEventsInitialized = true;

  // Sidebar: click "all"
  document.addEventListener('click', e => {
    const item = e.target.closest('[data-nav="all"]');
    if (item) {
      state.tags = [];
      render();
      $('sidebar').classList.remove('open');
    }
  });

  // Click suggestion (sidebar tag search)
  document.addEventListener('click', e => {
    const sug = e.target.closest('.tag-sug-item');
    if (sug) {
      const norm = sug.dataset.sugNorm;
      if (!state.tags.includes(norm)) {
        state.tags.push(norm);
        $('tag-search').value = '';
        $('tag-search-suggestions').style.display = 'none';
        $('tag-search-suggestions').innerHTML = '';
        render();
      }
    }
  });

  // Remove active tag pill
  document.addEventListener('click', e => {
    const pill = e.target.closest('[data-rm-stag]');
    if (pill) {
      state.tags = state.tags.filter(t => t !== pill.dataset.rmStag);
      render();
    }
  });

  // Card click
  document.addEventListener('click', e => {
    const card = e.target.closest('.recipe-card');
    if (card) openPanel(card.dataset.rid);
  });

  // Download menu close
  document.addEventListener('click', () => {
    const dlMenu = $('dl-menu');
    if (dlMenu) dlMenu.classList.remove('open');
  });

  // Click on editor tag suggestion
  document.addEventListener('click', e => {
    const sug = e.target.closest('.tag-suggestion');
    if (sug) {
      addEditorTag(sug.dataset.sug);
    }
  });

  // Remove tag pill in editor
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-rm-ed-tag]');
    if (btn) {
      removeEditorTag(+btn.dataset.rmEdTag);
    }
  });

  // Filter removal
  document.addEventListener('click', e => {
    const rt = e.target.closest('[data-rm-tag]');
    if (rt) {
      const norm = rt.dataset.rmTag;
      state.tags = state.tags.filter(t => t !== norm);
      render();
    }
  });

  // Auth delegated clicks (login/logout buttons are dynamic)
  document.addEventListener('click', e => {
    if (e.target.closest('#btn-login')) openAuthModal();
    if (e.target.closest('#btn-logout')) handleLogout();
  });

  // Mobile sidebar overlay close
  document.addEventListener('click', e => {
    const sb = $('sidebar');
    if (sb && sb.classList.contains('open') && !sb.contains(e.target) && !e.target.closest('#btn-menu')) sb.classList.remove('open');
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if ($('auth-modal') && $('auth-modal').classList.contains('visible')) closeAuthModal();
      else if ($('delete-modal') && $('delete-modal').classList.contains('visible')) closeDelete();
      else if ($('editor-modal') && $('editor-modal').classList.contains('visible')) closeEditor();
      else if ($('recipe-panel') && $('recipe-panel').classList.contains('open')) closePanel();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !($('editor-modal') && $('editor-modal').classList.contains('visible')) && currentUser) {
      e.preventDefault();
      openEditor(null);
    }
  });
}

// ---- Shell-level events (called on each rebuild) ----
export function initShellEvents() {
  // Sidebar tag search
  const tagSearch = $('tag-search');
  const tagSugBox = $('tag-search-suggestions');

  function showTagSuggestions() {
    const q = normalize(tagSearch.value || '');
    if (!q) { tagSugBox.style.display = 'none'; tagSugBox.innerHTML = ''; return; }
    const allTags = store.getAllTags();
    const matches = allTags.filter(t => !state.tags.includes(t.normalized) && t.normalized.includes(q));
    if (!matches.length) { tagSugBox.innerHTML = `<div class="tag-sug-empty">${t('no_tag_found')}</div>`; tagSugBox.style.display = 'block'; return; }
    tagSugBox.innerHTML = matches.slice(0, 8).map(tg =>
      `<div class="tag-sug-item" data-sug-norm="${tg.normalized}">${esc(tg.label)} <span class="tag-sug-count">(${tg.count})</span></div>`
    ).join('');
    tagSugBox.style.display = 'block';
  }

  tagSearch.addEventListener('input', showTagSuggestions);

  tagSearch.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = normalize(tagSearch.value || '');
      if (!q) return;
      const allTags = store.getAllTags();
      const match = allTags.find(t => !state.tags.includes(t.normalized) && t.normalized.includes(q));
      if (match) {
        state.tags.push(match.normalized);
        tagSearch.value = '';
        tagSugBox.style.display = 'none';
        tagSugBox.innerHTML = '';
        render();
      }
    }
  });

  tagSearch.addEventListener('blur', () => {
    setTimeout(() => { tagSugBox.style.display = 'none'; tagSugBox.innerHTML = ''; }, 150);
  });

  // Buttons
  $('btn-new').addEventListener('click', () => openEditor(null));
  $('btn-empty-new').addEventListener('click', () => openEditor(null));
  $('btn-copy-prompt').addEventListener('click', copyRecipePrompt);
  $('btn-theme').addEventListener('click', toggleTheme);
  updateThemeIcon();

  // Panel
  $('btn-close-panel').addEventListener('click', closePanel);
  $('panel-overlay').addEventListener('click', closePanel);
  $('btn-edit-panel').addEventListener('click', () => { const id = state.viewId; closePanel(); setTimeout(() => openEditor(id), 180); });
  $('btn-del-panel').addEventListener('click', () => openDelete(state.viewId));

  // Download
  $('btn-dl').addEventListener('click', e => { e.stopPropagation(); $('dl-menu').classList.toggle('open'); });
  $('btn-dl-md').addEventListener('click', () => { const r = store.recipes.find(x => x.id === state.viewId); if (r) downloadMd(r); $('dl-menu').classList.remove('open'); });
  $('btn-dl-pdf').addEventListener('click', () => { const r = store.recipes.find(x => x.id === state.viewId); if (r) downloadPdf(r); $('dl-menu').classList.remove('open'); });

  // Editor
  $('btn-close-editor').addEventListener('click', closeEditor);
  $('btn-cancel-editor').addEventListener('click', closeEditor);
  $('btn-save').addEventListener('click', saveRecipe);
  document.querySelectorAll('.editor-tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

  // Tag input in editor
  $('ed-tag-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = e.target.value.replace(/,/g, '');
      addEditorTag(val);
    }
    // Backspace on empty input removes last tag
    if (e.key === 'Backspace' && !e.target.value && editorTags.length) {
      removeEditorTag(editorTags.length - 1);
    }
  });

  $('ed-tag-input').addEventListener('input', e => {
    showSuggestions(e.target.value);
  });

  $('ed-tag-input').addEventListener('blur', () => {
    // Delay to allow click on suggestion
    setTimeout(() => hideSuggestions(), 150);
  });

  // Delete modal
  $('btn-close-delete').addEventListener('click', closeDelete);
  $('btn-cancel-delete').addEventListener('click', closeDelete);
  $('btn-confirm-delete').addEventListener('click', confirmDelete);

  // Auth modal
  $('btn-close-auth').addEventListener('click', closeAuthModal);
  $('btn-auth-submit').addEventListener('click', handleAuthSubmit);
  $('btn-auth-google').addEventListener('click', handleGoogleSignIn);
  $('btn-auth-toggle').addEventListener('click', () => {
    authIsRegister = !authIsRegister;
    updateAuthMode();
    $('auth-error').style.display = 'none';
  });
  $('auth-password').addEventListener('keydown', e => { if (e.key === 'Enter') handleAuthSubmit(); });

  // Search (debounced)
  let searchTimer = null;
  $('search').addEventListener('input', e => {
    state.search = e.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(render, 200);
  });

  // Clear filters
  $('btn-clear-filters').addEventListener('click', () => { state.tags = []; render(); });

  // Mobile sidebar
  $('btn-menu').addEventListener('click', () => $('sidebar').classList.toggle('open'));

  // Editor content shortcuts
  $('ed-content').addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); saveRecipe(); }
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = e.target.selectionStart;
      e.target.value = e.target.value.substring(0, s) + '  ' + e.target.value.substring(e.target.selectionEnd);
      e.target.selectionStart = e.target.selectionEnd = s + 2;
    }
  });

  // Language selector
  $('lang-select').addEventListener('change', e => {
    setLang(e.target.value);
  });
}
