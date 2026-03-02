/**
 * Download — Export recettes en .md et .pdf
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';
import html2pdf from 'html2pdf.js';
import { sanitizeFilename } from './utils.js';
import { t } from './i18n.js';

function generateMarkdown(recipe) {
  const rTags = recipe.tags || [];

  let md = `# ${recipe.name}\n\n`;

  const meta = [];
  if (recipe.servings) meta.push(`**${t('portions_export')}** ${recipe.servings}`);
  if (recipe.time) meta.push(`**${t('time_export')}** ${recipe.time} ${t('minutes_label')}`);
  if (meta.length) md += meta.join(' | ') + '\n\n';

  if (rTags.length) md += `**${t('tags_export')}** ${rTags.join(', ')}\n\n`;

  md += '---\n\n' + (recipe.content || '');
  return md;
}

export function downloadMd(recipe) {
  const md = generateMarkdown(recipe);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = sanitizeFilename(recipe.name) + '.md';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

export function downloadPdf(recipe) {
  const md = generateMarkdown(recipe);
  const div = document.createElement('div');
  div.innerHTML = `
    <div style="font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;color:#1d1d1f;line-height:1.7;padding:24px;">
      ${DOMPurify.sanitize(marked.parse(md))}
    </div>
  `;

  html2pdf().set({
    margin: [15, 15, 15, 15],
    filename: sanitizeFilename(recipe.name) + '.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }).from(div).save().catch(err => console.error('PDF generation error:', err));
}
