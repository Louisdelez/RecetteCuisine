/**
 * Shell — Template HTML principal de l'application
 */

import { icon } from './icons.js';
import { t, getLang, SUPPORTED_LANGS } from './i18n.js';

function langOptions() {
  const current = getLang();
  return Object.entries(SUPPORTED_LANGS)
    .map(([code, name]) => `<option value="${code}"${code === current ? ' selected' : ''}>${name}</option>`)
    .join('');
}

export function buildShell() {
  return `
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-scroll">
        <div class="sidebar-scroll-inner">
          <div class="sidebar-header">
            <div class="sidebar-brand">
              <div class="sidebar-brand-icon">${icon('ChefHat', 18)}</div>
              <h1>${t('brand_name')}</h1>
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-nav">
              <div class="nav-item active" id="nav-all" data-nav="all">
                ${icon('BookOpen', 18)}
                <span class="nav-label">${t('all_recipes')}</span>
                <span class="nav-count" id="count-all">0</span>
              </div>
            </div>
          </div>

          <div class="sidebar-divider"></div>

          <div class="sidebar-section">
            <div class="sidebar-section-header">
              <span>${t('filter_by_tags')}</span>
            </div>
            <div class="tag-search-box">
              ${icon('Search', 14)}
              <input type="text" id="tag-search" placeholder="${t('search_tag_placeholder')}" autocomplete="off" aria-label="${t('search_tag_placeholder')}">
              <div class="tag-search-suggestions" id="tag-search-suggestions"></div>
            </div>
            <div class="tags-wrap" id="active-tags"></div>
          </div>
        </div>
        <div id="auth-area" class="sidebar-auth"></div>
      </div>
    </aside>

    <!-- Main -->
    <main class="main">
      <header class="topbar">
        <button class="btn-icon mobile-toggle" id="btn-menu" aria-label="Menu">${icon('Menu', 20)}</button>
        <div class="search-box">
          ${icon('Search', 16)}
          <input type="text" id="search" placeholder="${t('search_placeholder')}" autocomplete="off" aria-label="${t('search_placeholder')}">
        </div>
        <select id="lang-select" aria-label="${t('lang_label')}">${langOptions()}</select>
        <button class="btn-icon" id="btn-theme" title="${t('change_theme')}">${icon('Moon', 18)}</button>
        <button class="btn-secondary btn-copy-prompt" id="btn-copy-prompt" title="${t('copy_prompt_label')}">
          ${icon('Copy', 16)}
          <span class="btn-label">${t('copy_prompt')}</span>
        </button>
        <button class="btn-primary auth-required" id="btn-new" style="display:none">
          ${icon('Plus', 16)}
          <span class="btn-label">${t('new_recipe')}</span>
        </button>
      </header>

      <div class="filters-bar" id="filters-bar">
        <span class="filters-bar-label">${t('active_filters')}</span>
        <div id="filters-list"></div>
        <button class="filters-clear" id="btn-clear-filters">${t('clear_all')}</button>
      </div>

      <div class="content-scroll">
        <div class="recipes-grid" id="grid"></div>
        <div class="empty-state" id="empty" style="display:none;">
          <div class="empty-icon">${icon('CookingPot', 32)}</div>
          <h3>${t('no_recipes')}</h3>
          <p>${t('no_recipes_desc')}</p>
          <button class="btn-primary auth-required" id="btn-empty-new" style="display:none">${icon('Plus', 16)} ${t('new_recipe')}</button>
        </div>
      </div>
    </main>

    <!-- Panel overlay -->
    <div class="panel-overlay" id="panel-overlay"></div>

    <!-- Recipe panel -->
    <section class="recipe-panel" id="recipe-panel">
      <div class="panel-head">
        <button class="btn-icon" id="btn-close-panel" aria-label="${t('close')}">${icon('X', 18)}</button>
        <div class="panel-head-actions">
          <button class="btn-ghost" id="btn-edit-panel" style="display:none">${icon('Pencil', 15)} ${t('edit')}</button>
          <div class="dropdown" id="dl-dropdown">
            <button class="btn-ghost" id="btn-dl">${icon('Download', 15)} ${t('export')}</button>
            <div class="dropdown-menu" id="dl-menu">
              <button id="btn-dl-md">${icon('FileText', 16)} ${t('export_md')}</button>
              <button id="btn-dl-pdf">${icon('FileDown', 16)} ${t('export_pdf')}</button>
            </div>
          </div>
          <button class="btn-icon danger" id="btn-del-panel" title="${t('delete')}" style="display:none">${icon('Trash2', 16)}</button>
        </div>
      </div>
      <div class="panel-body" id="panel-body"></div>
    </section>

    ${editorModal()}
    ${deleteModal()}
    ${authModal()}
  `;
}

function editorModal() {
  return `
    <div class="modal-backdrop" id="editor-modal">
      <div class="modal modal-editor">
        <div class="modal-head">
          <h2 id="ed-title">${t('new_recipe_title')}</h2>
          <button class="btn-icon" id="btn-close-editor" aria-label="${t('close')}">${icon('X', 18)}</button>
        </div>
        <div class="modal-content">
          <div class="field">
            <label for="ed-name">${t('recipe_name_label')}</label>
            <input type="text" id="ed-name" placeholder="${t('recipe_name_placeholder')}">
          </div>
          <div class="field-row field-row-3">
            <div class="field">
              <label for="ed-servings">${t('servings_label')}</label>
              <input type="number" id="ed-servings" placeholder="${t('servings_placeholder')}" min="1">
            </div>
            <div class="field">
              <label for="ed-time">${t('time_label')}</label>
              <input type="number" id="ed-time" placeholder="${t('time_placeholder')}" min="1">
            </div>
            <div class="field">
              <label for="ed-lang">${t('lang_label')}</label>
              <select id="ed-lang">
                ${Object.entries(SUPPORTED_LANGS).map(([code, name]) => `<option value="${code}">${name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="field">
            <label for="ed-tag-input">${t('tags_label')}</label>
            <div class="tag-input-wrap" id="ed-tags">
              <input type="text" class="tag-input-field" id="ed-tag-input" placeholder="${t('tag_input_placeholder')}">
            </div>
            <div class="tag-suggestions" id="ed-tag-suggestions"></div>
          </div>
          <div class="field field-grow">
            <div class="editor-bar">
              <label>${t('content_label')}</label>
              <div class="editor-tabs">
                <button class="editor-tab active" data-tab="edit">${t('tab_edit')}</button>
                <button class="editor-tab" data-tab="preview">${t('tab_preview')}</button>
              </div>
            </div>
            <textarea id="ed-content" placeholder="${t('content_placeholder')}"></textarea>
            <div id="ed-preview" class="md-body" style="display:none;padding:14px 16px;border:1px solid var(--border-strong);border-radius:var(--radius-sm);background:var(--bg-elevated);overflow-y:auto;min-height:200px;flex:1;"></div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-secondary" id="btn-cancel-editor">${t('cancel')}</button>
          <button class="btn-primary" id="btn-save">${icon('Check', 16)} ${t('save')}</button>
        </div>
      </div>
    </div>
  `;
}

function deleteModal() {
  return `
    <div class="modal-backdrop" id="delete-modal">
      <div class="modal modal-sm">
        <div class="modal-head">
          <h2>${t('confirm_delete')}</h2>
          <button class="btn-icon" id="btn-close-delete" aria-label="${t('close')}">${icon('X', 18)}</button>
        </div>
        <div class="modal-content">
          <p id="del-msg" style="font-size:14.5px;line-height:1.55;color:var(--text-secondary);letter-spacing:-0.1px;"></p>
        </div>
        <div class="modal-foot">
          <button class="btn-secondary" id="btn-cancel-delete">${t('cancel')}</button>
          <button class="btn-primary btn-danger" id="btn-confirm-delete">${icon('Trash2', 16)} ${t('delete_btn')}</button>
        </div>
      </div>
    </div>
  `;
}

function authModal() {
  return `
    <div class="modal-backdrop" id="auth-modal">
      <div class="modal modal-sm">
        <div class="modal-head">
          <h2 id="auth-title">${t('login_title')}</h2>
          <button class="btn-icon" id="btn-close-auth" aria-label="${t('close')}">${icon('X', 18)}</button>
        </div>
        <div class="modal-content">
          <div class="auth-error" id="auth-error" style="display:none"></div>
          <div class="field" id="auth-name-field" style="display:none">
            <label for="auth-name">${t('name_label')}</label>
            <input type="text" id="auth-name" placeholder="${t('name_placeholder')}">
          </div>
          <div class="field">
            <label for="auth-email">${t('email_label')}</label>
            <input type="email" id="auth-email" placeholder="${t('email_placeholder')}">
          </div>
          <div class="field">
            <label for="auth-password">${t('password_label')}</label>
            <input type="password" id="auth-password" placeholder="${t('password_placeholder')}">
          </div>
          <button class="btn-primary" id="btn-auth-submit" style="width:100%;justify-content:center">${t('login_btn')}</button>
          <div class="auth-divider"><span>${t('or_divider')}</span></div>
          <button class="auth-google-btn" id="btn-auth-google">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            ${t('google_btn')}
          </button>
          <div class="auth-switch">
            <span id="auth-switch-text">${t('no_account')}</span>
            <button class="auth-link" id="btn-auth-toggle">${t('create_account')}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
