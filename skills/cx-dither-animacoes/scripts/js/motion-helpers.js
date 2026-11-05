/**
 * motion-helpers.js - molas, tween e FLIP por slots para animar objetos (inclusive canvases WebGL).
 *
 *   import { spring, tween, flipSlots, loadMotion, sleep, clamp, lerp } from './motion-helpers.js';
 *
 *   await spring(v => gl.draw({ ..., reveal: v }), { duration: .7, bounce: .2, delay: 0, steps: 8 });
 *   await tween(t => overlay.draw({ t }), 600);                  // easing simples, sem sobra de mola
 *   const flip = flipSlots({ layer, objects: { coin: coinEl, bill: billEl }, base: 400 });
 *   flip.goTo(pageEl, { duration: .7, bounce: .15, stagger: .05 });
 *
 * Motion (https://motion.dev) e OPCIONAL: carregado do jsDelivr ESM `motion@12.23.12`; se a rede
 * falhar (ou window.DITHER_MOTION_CDN === false) usa um fallback em requestAnimationFrame.
 * Tudo respeita prefers-reduced-motion (salta para o valor final).
 */

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let motionP = null;
/** Carrega a lib Motion uma unica vez. Resolve com o modulo ou null (fallback rAF). */
export function loadMotion() {
  if (globalThis.DITHER_MOTION_CDN === false) return Promise.resolve(null);
  motionP = motionP || import('https://cdn.jsdelivr.net/npm/motion@12.23.12/+esm').catch(() => {
    console.warn('[motion-helpers] Motion indisponivel, usando fallback rAF');
    return null;
  });
  return motionP;
}

/**
 * Anima 0 -> 1 com mola e chama onUpdate(v) a cada quadro (v pode passar de 1 com bounce).
 * @param {(v:number)=>void} onUpdate
 * @param {{duration?:number, bounce?:number, delay?:number, steps?:number}} [o]
 *   duration em SEGUNDOS (visualDuration da Motion), bounce 0..1, delay em s;
 *   steps: quantiza v em N degraus (animacao "em passos", estilo pixel; ex. 8).
 * @returns {Promise<void>} resolve ao terminar, ja com onUpdate(1) chamado.
 */
export async function spring(onUpdate, o = {}) {
  const { duration = 0.7, bounce = 0.2, delay = 0, steps = 0 } = o;
  const emit = steps ? v => onUpdate(Math.round(clamp(v, 0, 1.5) * steps) / steps) : onUpdate;
  if (reduced()) { emit(1); return; }
  const M = await loadMotion();
  if (M) {
    const c = M.animate(0, 1, { type: 'spring', visualDuration: duration, bounce, delay, onUpdate: emit });
    await (c.finished || c);
    emit(1);
    return;
  }
  // fallback: ease-out quartico com leve sobra (aproxima a mola)
  const d = duration * 1100, t0 = performance.now() + delay * 1000;
  await new Promise(res => {
    const f = now => {
      const t = clamp((now - t0) / d);
      if (now >= t0) emit(1 - Math.pow(1 - t, 4));
      t < 1 ? requestAnimationFrame(f) : (emit(1), res());
    };
    requestAnimationFrame(f);
  });
}

/** Tween por tempo (ms) sem mola: ideal para overlays e fundos. ease: t => t. */
export function tween(onUpdate, ms, ease = t => 1 - Math.pow(1 - t, 3)) {
  if (reduced()) { onUpdate(1); return Promise.resolve(); }
  return new Promise(res => {
    const t0 = performance.now();
    const f = now => {
      const t = clamp((now - t0) / ms);
      onUpdate(ease(t));
      t < 1 ? requestAnimationFrame(f) : res();
    };
    requestAnimationFrame(f);
  });
}

/**
 * FLIP por slots: objetos vivem numa camada acima das paginas e MIGRAM entre "slots" medidos.
 *
 * HTML:  <div class="layer"> <div data-obj="coin" class="obj">...</div> </div>
 *        <section class="page" id="p1"> <i data-slot="coin"></i> </section>
 *        <section class="page" id="p2"> <i data-slot="coin"></i> <i data-slot="bill"></i> </section>
 * Cada objeto e um elemento de lado `base` px (position:absolute; left:0; top:0; transform-origin:center)
 * posicionado por translate+scale. Objeto sem slot na pagina destino some (scale ~ 0); objeto que estava oculto entra com "pop" no proprio slot.
 *
 * @param {{layer:HTMLElement, objects:Record<string,HTMLElement>, base?:number, slotAttr?:string,
 *          onFrame?:(id:string, st:{cx:number,cy:number,s:number,rot:number})=>void}} cfg
 *   onFrame: chamado a cada quadro por objeto (ex.: redesenhar um canvas WebGL com `scale: st.s`).
 * @returns {{goTo(page:HTMLElement, o?:object):Promise<void>, place(page:HTMLElement):void, state:object}}
 */
export function flipSlots({ layer, objects, base = 400, slotAttr = 'data-slot', onFrame }) {
  const state = {}; // id -> {cx, cy, s, rot}

  const measure = (page) => {
    const lr = layer.getBoundingClientRect(), out = {};
    page.querySelectorAll(`[${slotAttr}]`).forEach(sl => {
      const r = sl.getBoundingClientRect();
      out[sl.getAttribute(slotAttr)] = {
        cx: r.left - lr.left + r.width / 2, cy: r.top - lr.top + r.height / 2,
        s: r.width / base, rot: +(sl.dataset.rot || 0),
      };
    });
    return out;
  };

  const apply = (id, st) => {
    const el = objects[id];
    const s = Math.max(0.001, st.s);
    el.style.transform = `translate(${st.cx - base / 2}px,${st.cy - base / 2}px) scale(${s}) rotate(${st.rot}deg)`;
    el.style.visibility = st.s < 0.01 ? 'hidden' : 'visible';
    state[id] = { ...st };
    onFrame?.(id, st);
  };

  /** Posiciona sem animar (inicio ou resize). */
  const place = (page) => {
    const m = measure(page);
    for (const id of Object.keys(objects)) apply(id, m[id] || { ...(state[id] || { cx: 0, cy: 0, rot: 0 }), s: 0 });
  };

  const goTo = async (page, o = {}) => {
    const { duration = 0.7, bounce = 0.15, stagger = 0.04, steps = 0 } = o;
    const m = measure(page), ids = Object.keys(objects);
    await Promise.all(ids.map((id, i) => {
      const prev = state[id];
      const to = m[id] || { ...(prev || { cx: 0, cy: 0, rot: 0 }), s: 0 };           // sem slot: encolhe onde esta
      const from = prev && prev.s > 0.01 ? prev : { ...to, s: 0 };                     // estava oculto: "pop" no destino
      return spring(v => apply(id, {
        cx: lerp(from.cx, to.cx, v), cy: lerp(from.cy, to.cy, v),
        s: lerp(from.s, to.s, v), rot: lerp(from.rot, to.rot, v),
      }), { duration, bounce, delay: i * stagger, steps });
    }));
  };

  return { goTo, place, state, measure };
}
