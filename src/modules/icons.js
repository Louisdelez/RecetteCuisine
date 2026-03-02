/**
 * Icons — Helper pour générer les SVG Lucide inline
 */

import { icons } from 'lucide';

const SVG_BASE = {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  viewBox: '0 0 24 24',
};

export function icon(name, size = 18) {
  const paths = icons[name];
  if (!paths) return '';

  const attrs = Object.entries({ ...SVG_BASE, width: size, height: size, class: 'lucide' })
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');

  const inner = paths
    .map(([tag, a]) => {
      const at = Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ');
      return `<${tag} ${at}/>`;
    })
    .join('');

  return `<svg ${attrs}>${inner}</svg>`;
}
