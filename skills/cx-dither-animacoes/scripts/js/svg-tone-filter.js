/**
 * svg-tone-filter.js - tinge uma imagem CINZA de poucos tons com uma paleta, sem WebGL.
 *
 * Como funciona: feColorMatrix (luminancia -> R=G=B) + feComponentTransfer type="discrete"
 * (um valor por canal e por faixa de tom). A paleta inteira troca em CSS (filter:url(#id)).
 *
 *   import { toneFilter, mountTone, applyTone, setTones } from './svg-tone-filter.js';
 *   document.body.insertAdjacentHTML('beforeend', toneFilter('tone', ['#0A1A7A','#7BE8FF','#F5F7FF','#FFE24A']));
 *   applyTone(imgEl, 'tone');            // imgEl.style.filter = 'url(#tone)'
 *   setTones('tone', ['#4C1D95','#2DD4BF','#FFC933','#F2ECDC']);   // troca ao vivo
 *
 * Tons: ordem do MAIS ESCURO ao MAIS CLARO; N tons = N faixas iguais de luminancia.
 * Atencao: bordas antialias criam tons intermediarios (use a imagem ja posterizada, ex. a
 * saida --preset cinema do dither_image.py) e a ordem dos tons muda o resultado: teste variacoes.
 */

const ID_RE = /^[A-Za-z][\w-]*$/;

function hexToRgb(h) {
  if (!/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h)) throw new Error('cor invalida: ' + h);
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
}

function tables(hexTones) {
  const rgb = hexTones.map(hexToRgb);
  return [0, 1, 2].map(ch => rgb.map(c => c[ch].toFixed(3)).join(' '));
}

/** Devolve o markup `<svg><filter id>` (invisivel) para inserir no DOM. */
export function toneFilter(id, hexTones) {
  if (!ID_RE.test(id)) throw new Error('id invalido: ' + id);
  if (!hexTones || hexTones.length < 2) throw new Error('precisa de >= 2 tons');
  const [r, g, b] = tables(hexTones);
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">` +
    `<filter id="${id}" color-interpolation-filters="sRGB">` +
    `<feColorMatrix type="matrix" values=".2126 .7152 .0722 0 0  .2126 .7152 .0722 0 0  .2126 .7152 .0722 0 0  0 0 0 1 0"/>` +
    `<feComponentTransfer><feFuncR type="discrete" tableValues="${r}"/><feFuncG type="discrete" tableValues="${g}"/><feFuncB type="discrete" tableValues="${b}"/></feComponentTransfer>` +
    `</filter></svg>`;
}

/** Insere (ou substitui) o filtro no <body>; devolve o elemento <svg>. */
export function mountTone(id, hexTones, root = document.body) {
  document.getElementById(id)?.closest('svg')?.remove();
  root.insertAdjacentHTML('beforeend', toneFilter(id, hexTones));
  return document.getElementById(id).closest('svg');
}

/** Aplica o filtro a um elemento (img, canvas, div com background...). */
export function applyTone(el, id) {
  el.style.filter = `url(#${id})`;
  return el;
}

/** Atualiza as tabelas de um filtro ja montado (troca de paleta ao vivo, sem remontar). */
export function setTones(id, hexTones) {
  const f = document.getElementById(id);
  if (!f) throw new Error('filtro nao montado: ' + id);
  const [r, g, b] = tables(hexTones);
  f.querySelector('feFuncR').setAttribute('tableValues', r);
  f.querySelector('feFuncG').setAttribute('tableValues', g);
  f.querySelector('feFuncB').setAttribute('tableValues', b);
}
