# Animacao

Conteudo: 1 Principios, 2 Motion (spring) com fallback, 3 FLIP por slots, 4 Entrada em cascata, 5 Transicoes, 6 Hover e parallax, 7 Flutuacao, 8 Marquee, 9 Estilo pixel (steps, tempo quantizado), 10 reduced-motion, 11 Armadilhas.

Implementacao: `scripts/js/motion-helpers.js` (spring com Motion via CDN e fallback rAF, FLIP por slots, tween). Origem do caso real: `rodada3/mockups/d3-cobalto-pixel.html` (`drive`, `tween`, `measure`, `place`, `enter`, `morph`) e `pesquisa-design/estilo/tecnica-dither-shader-motion.md`.

## 1. Principios

- Um ou dois elementos animados por tela; o resto parado. Movimento sincronizado em tudo parece template.
- Fases e duracoes diferentes por objeto (5.2 s, 6.1 s, 4.7 s), nunca sincronizadas.
- Em dither, movimento "em degraus" (`steps()`, tempo quantizado) combina mais que curva suave; mola funciona para entrada e morph.
- Luz e profundidade consistentes: mesma direcao de luz e sombra em todos.

## 2. Motion (spring) com fallback

```js
// Motion via CDN ESM (pinar versao; o caso real usou 12.23.12; verificar a mais recente)
let M = null;
try { M = await import('https://cdn.jsdelivr.net/npm/motion@12.23.12/+esm'); } catch (e) { /* segue com fallback */ }
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function drive(onUpdate, o = {}) {                       // retorna Promise
  if (RM) { onUpdate(1); return Promise.resolve(); }
  if (M) {
    const c = M.animate(0, 1, { type: 'spring', visualDuration: o.d || .7, bounce: o.b ?? .2, delay: o.delay || 0, onUpdate });
    return Promise.resolve(c.finished || c).then(() => onUpdate(1));
  }
  return new Promise(res => {                            // fallback: ease-out quartico em rAF
    const d = (o.d || .7) * 1100, t0 = performance.now() + (o.delay || 0) * 1000;
    const f = now => { const t = clamp((now - t0) / d); if (now >= t0) onUpdate(1 - Math.pow(1 - t, 4)); t < 1 ? requestAnimationFrame(f) : (onUpdate(1), res()); };
    requestAnimationFrame(f);
  });
}
```
`visualDuration` e o tempo em que o movimento "parece" chegar (a parte elastica vem depois); `bounce` 0.15 a 0.3 e o intervalo agradavel. Sempre force `onUpdate(1)` ao fim para nao deixar o estado a 0.98.

Em React: `motion/react` (`animate`, `useMotionValue`, `useSpring`, `AnimatePresence`, `layoutId`, `stagger`). Fora do React: `motion` (`animate`, `scroll`, `stagger`, `spring`). Spring em CSS puro: `` transition: `transform ${spring(0.4, 0.3)}` `` gera `duration + linear(...)` (verificar a assinatura na sua versao).

## 3. FLIP por slots (morph continuo entre passos)

Problema: objetos (canvas/img) que mudam de tamanho e posicao entre passos de um fluxo, com morph continuo. Solucao: uma camada `.layer` acima das paginas, objetos absolutos nela, e **slots** invisiveis em cada pagina marcando onde cada objeto deve estar.

```html
<section class="page" data-step="1"> ... <i class="slot" data-o="moeda" data-rot="-6"></i> </section>
<section class="page" data-step="2"> ... <i class="slot" data-o="moeda"></i> </section>
```
```js
function measure() {                                    // posicao de cada slot relativa a camada, na escala do modal
  const lr = layer.getBoundingClientRect(), out = {};
  document.querySelectorAll('.page .slot').forEach(sl => {
    const st = sl.closest('.page').dataset.step, r = sl.getBoundingClientRect();
    (out[st] = out[st] || {})[sl.dataset.o] = {
      cx: (r.left - lr.left + r.width/2) / K, cy: (r.top - lr.top + r.height/2) / K,
      s: (r.width / K) / BASE, rot: +(sl.dataset.rot || 0) };
  });
  return out;
}
const place = (o, s) => o.el.style.transform =
  `translate(${s.cx - BASE/2}px,${s.cy - BASE/2}px) scale(${s.s}) rotate(${s.rot}deg)`;

async function morph(to) {                              // from = estado atual de cada objeto, to = slots do passo novo
  const T = measure()[to];
  await Promise.all(Object.keys(OBJ).map(id => drive(v => {
    const a = OBJ[id].st, b = T[id] || OFF;               // objeto ausente na pagina nova => slot 'off' (1px, oculto)
    place(OBJ[id], { cx: lerp(a.cx,b.cx,v), cy: lerp(a.cy,b.cy,v), s: lerp(a.s,b.s,v), rot: lerp(a.rot,b.rot,v) });
  }, { d: .6 })));
}
```
Regras: meca de novo no `resize`; `K` e o fator de escala do modal (`Math.min(1, (innerWidth-32)/dw, (innerHeight-32)/dh)`); a cada quadro recalcule `px` do dither com a nova escala (ver `webgl-shader.md` secao 5). Alternativa em React: `layoutId` (Motion) com `AnimatePresence mode="popLayout"`; atencao: canvas distorce durante o layout animation (usa `transform: scale`), entao mantenha tamanho fixo e deixe o wrapper escalar, ou use `layout="position"` e re-renderize o dither ao fim.

### 3.1 Versao pronta: `flipSlots` (`scripts/js/motion-helpers.js`)

O helper implementa o padrao acima. Exemplo completo e testado: `examples/flip-slots.html` (duas paginas, objetos migrando, dissolve Bayer de entrada via `DitherGL` modo `passthrough`).

```html
<div id="layer" style="position:absolute; inset:0; pointer-events:none"> <!-- acima das paginas -->
  <div id="coin"   style="position:absolute; width:400px; height:400px"><canvas width="400" height="400"></canvas></div>
  <div id="shield" style="position:absolute; width:400px; height:400px"><canvas width="400" height="400"></canvas></div>
</div>
<section id="p1"> ... <i data-slot="coin" class="big"></i> <i data-slot="shield" class="small"></i> </section>
<section id="p2"> ... <i data-slot="coin" class="small"></i> <i data-slot="shield" class="big"></i> </section>
```
```js
import { flipSlots, spring } from '../scripts/js/motion-helpers.js';
const flip = flipSlots({
  layer: document.getElementById('layer'),
  objects: { coin: coinEl, shield: shieldEl },       // elementos de tamanho base fixo (base px)
  base: 400,                                          // lado do elemento do objeto
  onFrame: (id, st) => redrawDither(id, st.s),        // st = {cx, cy, s, rot}: redesenhe o dither com scale: st.s
});
flip.place(p1);                                       // posiciona sem animar (inicio e resize)
await flip.goTo(p2, { duration: .8, bounce: .18, stagger: .05 });   // morph; steps: 8 para estilo pixel
```
Comportamento: objeto sem slot na pagina destino encolhe onde esta e fica oculto; objeto oculto que ganha slot entra com "pop". `onFrame` e o gancho para manter a celula do dither com o tamanho certo na tela: `gl.draw({ ..., px: 3, scale: st.s })` (o `DitherGL` calcula `px*DPR/scale`). Chame `flip.place(paginaAtual)` no `resize`.

## 4. Entrada em cascata

Ordene os objetos; cada um com `delay = base + i * stagger` (0.25 + i * 0.09 s no caso real). Estado inicial: `cy + 60`, `scale * .72`, `reveal = 0` (dissolve Bayer) e `px` grande (pixel-resolve). Na animacao: `reveal = clamp(v*1.15)`, `resolve = lerp(24 -> 1, v)`, posicao por `lerp`. Fim: forcar `reveal = 1`.
Em CSS: `.rise{animation: rise .5s both; animation-delay: calc(var(--i) * 80ms)}` com `translate`/`opacity`. Blur em cascata (`filter: blur`) custa raster por quadro; limite a textos curtos.

## 5. Transicoes

| Tipo | Como | Obs |
|---|---|---|
| Overlay de dither (pagina muda) | modo 3 do shader: `t` 0->1, troca a pagina, `t` 1->0 | `transicao-pixelada.md` |
| Pagina que vira | `rotateY` com `perspective` e sombra dinamica | em `steps()` fica retro |
| Moeda que gira | `rotateY` 0->360 em passos | gira o sprite; nao troca de textura |
| Pixel-resolve | `px` 24->2 em potencias de 2 | objeto "se materializa" |
| Dissolve A->B | limiar Bayer entre texturas | sem crossfade de alfa |
| Fallback sem WebGL | `clip-path` / `mask-image` Bayer por `steps()` | `svg-css.md` |

Tween simples para overlays (sem sobra de mola): `ease = t => 1 - Math.pow(1 - t, 3)` em rAF. Em `RM`, pule: `onUpdate(1)`.

## 6. Hover e parallax

- Hover com mola: classe `.hv` com `transition: transform .3s cubic-bezier(.3,1.7,.5,1)` (overshoot). No estilo pixel: pixelize (px 4 -> 8) ou `steps(3,end)`.
- Parallax por ponteiro: `lerp` do alvo ao longo dos quadros, **somente com ponteiro fino** (`matchMedia('(pointer: fine)')`); profundidade diferente por objeto (0.6, 1, 1.4). Em React: `useMotionValue` + `useSpring({stiffness:120, damping:16, mass:.6})` + `useTransform`.
- Brilho que varre o cartao selecionado: modo `sel` do canvas (`canvas2d.md`) ou `mask-image` com `linear-gradient` animado.

## 7. Flutuacao

Use **dois wrappers**: o externo recebe o transform do JS (posicao/parallax), o interno a flutuacao CSS (`@keyframes` com `translateY(var(--fa))`, `animation-duration: var(--fd)`, `animation-delay: var(--fdl)`). Assim CSS e JS nao brigam pelo mesmo `transform`.

## 8. Marquee (barra de micro-texto)

Texto repetido 2 vezes numa linha, `animation: run 30s linear infinite` de `translateX(0)` a `translateX(-50%)`, mascarada nas bordas (`mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)`). Pause em `reduced-motion` e em `:hover` se for clicavel.

## 9. Estilo pixel no movimento

- `animation-timing-function: steps(6, end)` ou `steps(8, end)` em entradas.
- Tempo quantizado em JS: `window.QSTEPS = 8`; `onUpdate = v => cb(Math.round(clamp(v,0,1.5) * Q) / Q)`. A mola continua suave por baixo, mas o que se ve anda em degraus (efeito stop-motion).
- Posicoes arredondadas ao pixel da grade (`Math.round(x / CELL) * CELL`).

## 10. reduced-motion

- CSS: `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }` e restaure o estado final visivel (nao deixe `clip-path` ou `opacity: 0` do estado inicial).
- JS: `const RM = matchMedia('(prefers-reduced-motion: reduce)')`; no `drive`, `onUpdate(1)` imediato; shaders e canvas desenham **um quadro** e param; escute `RM.addEventListener('change', ...)`.
- Motion React: `<MotionConfig reducedMotion="user">` (desliga transform/layout, mantem opacidade/cor).
- Dissolve e pixelar viram corte seco ou fade de 150 ms.

## 11. Armadilhas

- `animation-fill-mode: both` + `transform`: segura o transform final e mata hover. Anime `translate`.
- Animar `left/top/width/height`: layout a cada quadro. Use `transform` e `opacity`.
- Mola sem `onUpdate(1)` final deixa o objeto fora do slot por fracoes de pixel.
- `getBoundingClientRect` dentro do loop de animacao: meca uma vez antes.
- Dois sistemas animando o mesmo `transform` (CSS e JS): separe em wrappers.

## 12. Animacao como arquivo (`scripts/python/dither_anim.py`)

Quando o entregavel e um **arquivo** (GIF para e-mail/README, WebM para site, PNG-seq para editar em outra ferramenta) e nao uma animacao ao vivo, gere os quadros em Python com o mesmo Bayer 8x8. Workflow completo: `workflows/animacao-em-arquivo.md`.

| Modo | Efeito | Loop | Entrada |
|---|---|---|---|
| `reveal` | dissolve Bayer: a imagem aparece celula a celula | nao (segura o fim com `--hold`) | PNG |
| `pixel-resolve` | celulas grandes -> pequenas em potencias de 2 (`--from-px 32`) | nao | PNG |
| `sweep` | varredura diagonal com borda pontilhada | nao | PNG |
| `breathe` | fundo Bayer que respira | **loop perfeito** | nenhuma (`--size LxA`) |
| `wipe-overlay` | cobertura Bayer cobre e revela (t 0 -> 1 -> 0) | nao | PNG opcional |

```bash
python3 scripts/python/dither_anim.py reveal in.png -o out/reveal.gif --preset pixel-azul --cell 4 --fps 20 --duration 1.4
python3 scripts/python/dither_anim.py breathe -o out/bg.gif --size 320x180 --preset cobalto-3 --cell 4 --fps 12 --duration 4
python3 scripts/python/dither_anim.py reveal in.png -o out/r.gif --png-seq out/frames --video out/r.webm --video out/r.mp4
```
Saidas: GIF (paleta exata, alfa de 1 bit), `--png-seq DIR` (RGBA), `--video X.webm|mp4` (precisa de `ffmpeg`; WebM VP9 mantem alfa, MP4 achata). Parametros: `--fps` (20), `--duration` (1.5 s), `--hold` (0.4 s), `--loop` (0 = infinito, 1 = uma vez), `--ease` (`linear|out|inout`), `--bg` (`transparent` ou `#hex`), `--cell`, `--scale`. Quando preferir ao vivo: shader/Canvas (secoes 2 e 5) ou `motion-helpers.js`.
