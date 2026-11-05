/**
 * doodle-mask.js - "desenha" rabiscos SVG (setas, sublinhados, circulos) revelando uma mascara.
 *
 * O SVG usa `currentColor`/fill so como FORMA: vira mascara CSS (mask: url(x.svg)) sobre um
 * elemento colorido, e o traco e revelado por clip-path (esquerda -> direita).
 *   - suave   : easing continuo (rabisco de pincel).
 *   - em passos: steps(N,end) (estilo pixel; combine com SVG de pixels e shape-rendering:crispEdges).
 *
 *   import { drawDoodle } from './doodle-mask.js';
 *   // <i class="doodle" style="position:absolute; width:200px; height:30px"></i>
 *   const anim = drawDoodle(el, { src: 'assets/doodles/sublinhado-onda-pixel.svg', color: '#FFE24A', steps: 8, duration: 700 });
 *   await anim.finished;      // anim e um Animation (Web Animations API); reduced-motion => ja finalizado
 *
 * Opcoes: src (obrigatorio), color (CSS), steps (0/omitido = suave), duration ms (700), delay ms (0),
 *   direction 'ltr'|'rtl'|'ttb'|'btt' ('ltr'), pixelated (true se steps>0), fit 'fill'|'contain' ('fill').
 * Observacao: mask-image de arquivo exige servir por HTTP (CORS de file:// bloqueia a mascara).
 */

const CLIP = {
  ltr: ['inset(0 100% 0 0)', 'inset(0 0 0 0)'],
  rtl: ['inset(0 0 0 100%)', 'inset(0 0 0 0)'],
  ttb: ['inset(0 0 100% 0)', 'inset(0 0 0 0)'],
  btt: ['inset(100% 0 0 0)', 'inset(0 0 0 0)'],
};

export function drawDoodle(el, o = {}) {
  const { src, color = 'currentColor', steps = 0, duration = 700, delay = 0, direction = 'ltr', fit = 'fill' } = o;
  if (!src) throw new Error('drawDoodle: src e obrigatorio');
  const size = fit === 'contain' ? 'contain' : '100% 100%';
  const mask = `url("${src}") center / ${size} no-repeat`;
  const s = el.style;
  s.background = color;
  s.webkitMask = mask; s.mask = mask;
  s.pointerEvents = 'none';
  if (steps > 0 || o.pixelated) s.imageRendering = 'pixelated';
  const [from, to] = CLIP[direction] || CLIP.ltr;
  s.clipPath = from;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const anim = el.animate([{ clipPath: from }, { clipPath: to }], {
    duration: reduced ? 0 : duration,
    delay: reduced ? 0 : delay,
    easing: steps > 0 ? `steps(${steps}, end)` : 'cubic-bezier(.45,.05,.25,1)',
    fill: 'forwards',
  });
  anim.finished.then(() => { s.clipPath = to; anim.cancel(); }).catch(() => {});
  return anim;
}

/** Esconde de novo (sem animar) para poder redesenhar. */
export function resetDoodle(el, direction = 'ltr') {
  el.getAnimations().forEach(a => a.cancel());
  el.style.clipPath = (CLIP[direction] || CLIP.ltr)[0];
}
