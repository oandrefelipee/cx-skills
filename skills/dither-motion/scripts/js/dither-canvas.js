/**
 * dither-canvas.js - dither em Canvas 2D, sem WebGL e sem dependencias (leve, roda em qualquer lugar).
 *
 *   import { createDitherBackground, ditherShadow, confetti } from './dither-canvas.js';
 *
 *   const bg = createDitherBackground(canvas, { colors: ['#0A1A7A', '#1235E6', '#2E5BFF'], cell: 4, fps: 12 });
 *   bg.stop(); bg.start(); bg.setColors([...]); bg.destroy();
 *
 *   ditherShadow(ctx, x, y, w, h, { color: '#001A9A', cell: 4 });   // pontilhado de contato sob objeto
 *   const fx = confetti(fxCanvas, { colors: ['#FFE24A', '#7BE8FF', '#FFFFFF'] });
 *   fx.burst(x, y, 24); fx.rain(40); fx.stop();
 *
 * Regras embutidas: pausa com document.hidden e fora da tela (IntersectionObserver);
 * respeita prefers-reduced-motion (quadro estatico); 12 a 15 fps bastam para fundo.
 * O canvas deve ter `image-rendering: pixelated` (aplicado aqui) e tamanho CSS definido
 * (ex.: position:absolute; inset:0; width:100%; height:100%). O buffer = css / cell (pequeno e barato).
 */

// Bayer 8x8 normalizado (centro do degrau) em array plano 64.
const BAYER8 = (() => {
  const b = (n) => (n === 1 ? [[0]] : (() => {
    const m = b(n / 2), s = m.length, o = Array.from({ length: n }, () => new Array(n));
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const v = 4 * m[y][x];
      o[y][x] = v; o[y][x + s] = v + 2; o[y + s][x] = v + 3; o[y + s][x + s] = v + 1;
    }
    return o;
  })());
  return b(8).flat().map(v => (v + 0.5) / 64);
})();

const toRgb = (h) => {
  if (Array.isArray(h)) return h;
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
};

const prefersReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Fundo animado em Bayer 8x8: mancha de luz que passeia + ondas suaves, quantizada nas `colors`
 * (da mais escura para a mais clara; 3 tons costuma bastar).
 * @param {HTMLCanvasElement} canvas
 * @param {{colors?:string[], cell?:number, fps?:number, speed?:number, reducedMotion?:boolean, focus?:[number,number], wave?:number}} [o]
 *   cell: px CSS por celula (4 padrao); fps: 12; speed: 1 = velocidade base; reducedMotion: forca estatico
 *   (padrao: segue prefers-reduced-motion).
 */
export function createDitherBackground(canvas, o = {}) {
  const opt = { colors: ['#0A1A7A', '#1235E6', '#2E5BFF'], cell: 4, fps: 12, speed: 1, focus: [0.5, 0.5], wave: 0.1, ...o };
  let tones = opt.colors.map(toRgb);
  const ctx = canvas.getContext('2d');
  canvas.style.imageRendering = 'pixelated';
  let img = null, cw = 0, ch = 0, raf = 0, last = 0, running = false, visible = true, t = 0;
  const reduced = () => opt.reducedMotion ?? prefersReduced();

  function size() {
    const r = canvas.getBoundingClientRect();
    cw = Math.max(1, Math.round(r.width / opt.cell));
    ch = Math.max(1, Math.round(r.height / opt.cell));
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    img = ctx.createImageData(cw, ch);
  }

  function paint(time) {
    if (!img) size();
    const d = img.data, L = tones.length, asp = cw / ch;
    const fx = opt.focus[0] + 0.3 * Math.sin(time * 0.35), fy = opt.focus[1] + 0.25 * Math.cos(time * 0.28);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const u = x / cw, v = y / ch;
        const dist = Math.hypot((u - fx) * asp * 0.5, (v - fy) * 0.9);
        let l = Math.max(0, 1 - dist * 1.35) + opt.wave * Math.sin(u * 6 + time * 0.6) * Math.sin(v * 5 - time * 0.5);
        l = Math.min(1, Math.max(0, l));
        const k = Math.min(L - 1e-6, l * (L - 1)), b = Math.floor(k);
        const c = tones[b + ((k - b) > BAYER8[(y & 7) * 8 + (x & 7)] ? 1 : 0)] || tones[L - 1];
        const i = (y * cw + x) * 4;
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!running || document.hidden || !visible) return;
    if (now - last < 1000 / opt.fps) return;
    last = now;
    t += (1 / opt.fps) * opt.speed;
    paint(t);
  }

  const ro = new ResizeObserver(() => { size(); paint(t); });
  ro.observe(canvas);
  const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting; });
  io.observe(canvas);

  const api = {
    start() { if (reduced()) { paint(t); return api; } running = true; if (!raf) raf = requestAnimationFrame(frame); return api; },
    stop() { running = false; return api; },
    setColors(c) { tones = c.map(toRgb); paint(t); return api; },
    destroy() { running = false; cancelAnimationFrame(raf); raf = 0; ro.disconnect(); io.disconnect(); },
  };
  size(); paint(0);
  api.start();
  return api;
}

/**
 * Sombra de contato em pontilhado Bayer (no lugar de drop-shadow chapado): uma elipse que
 * esmaece para as bordas, desenhada em celulas `cell` x `cell`.
 * @param {CanvasRenderingContext2D} ctx contexto de um canvas na escala 1:1 (px do canvas)
 * @param {number} x,y,w,h retangulo da elipse
 * @param {{color?:string, cell?:number, density?:number}} [o]
 */
export function ditherShadow(ctx, x, y, w, h, o = {}) {
  const { color = '#001A9A', cell = 4, density = 0.9 } = o;
  ctx.save();
  ctx.fillStyle = color;
  const cx = x + w / 2, cy = y + h / 2;
  for (let py = y; py < y + h; py += cell) {
    for (let px = x; px < x + w; px += cell) {
      const dx = (px + cell / 2 - cx) / (w / 2), dy = (py + cell / 2 - cy) / (h / 2);
      const r = Math.hypot(dx, dy);
      if (r > 1) continue;
      const v = (1 - r) * density * 1.3;
      const bx = Math.floor(px / cell) & 7, by = Math.floor(py / cell) & 7;
      if (v > BAYER8[by * 8 + bx]) ctx.fillRect(px, py, cell, cell);
    }
  }
  ctx.restore();
}

/**
 * Confete de quadradinhos (pixel) em 2+ tons, num canvas de overlay (pointer-events:none).
 * Coordenadas em px do canvas. Sem partículas sobre o centro de texto: prefira burst lateral.
 * @param {HTMLCanvasElement} canvas
 * @param {{colors?:string[], size?:number, gravity?:number, reducedMotion?:boolean}} [o]
 * @returns {{burst(x:number,y:number,n?:number):void, rain(n?:number):void, stop():void}}
 */
export function confetti(canvas, o = {}) {
  const opt = { colors: ['#FFE24A', '#7BE8FF', '#FFFFFF'], size: 3, gravity: 260, ...o };
  const g = canvas.getContext('2d');
  canvas.style.imageRendering = 'pixelated';
  let parts = [], raf = 0, last = 0;
  const reduced = () => opt.reducedMotion ?? prefersReduced();

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    g.clearRect(0, 0, canvas.width, canvas.height);
    parts = parts.filter(p => p.life > 0 && p.y < canvas.height + 8);
    for (const p of parts) {
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      g.fillStyle = p.c;
      g.fillRect(Math.round(p.x), Math.round(p.y), opt.size, opt.size);
    }
    raf = parts.length && !document.hidden ? requestAnimationFrame(loop) : (g.clearRect(0, 0, canvas.width, canvas.height), 0);
  }
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };

  return {
    burst(x, y, n = 24) {
      if (reduced()) return;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 90;
        parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, c: opt.colors[i % opt.colors.length], life: 0.7 + Math.random() * 0.4, g: opt.gravity });
      }
      kick();
    },
    rain(n = 40) {
      if (reduced()) return;
      for (let i = 0; i < n; i++) {
        parts.push({ x: Math.random() * canvas.width, y: -4 - Math.random() * 30, vx: (Math.random() - 0.5) * 18, vy: 30 + Math.random() * 40, c: opt.colors[i % opt.colors.length], life: 5, g: 12 });
      }
      kick();
    },
    stop() { parts = []; cancelAnimationFrame(raf); raf = 0; g.clearRect(0, 0, canvas.width, canvas.height); },
  };
}
