# Workflow: transicao pixelada (dither)

Objetivo: trocar de pagina/passo/estado com um overlay de dither que cobre e revela, ou fazer um objeto "se resolver" de pixels grandes para nitido, ou dissolver A -> B em celulas.
Ferramentas: `scripts/js/dither-gl.js` (modos `overlay`, `passthrough`), `scripts/js/motion-helpers.js` (`spring`, `tween`). Exemplo: `examples/transicao-pixelada.html`.
Referencias: `references/webgl-shader.md` (secoes 3, 5, 7), `references/animacao.md` (secao 5), `references/svg-css.md` (secao 5, fallback).

## Variante A: overlay cobre e revela (troca de pagina)

1. **Canvas de overlay** tela cheia (ou do modal): `position:fixed; inset:0; pointer-events:none; z-index:50`. Um `DitherGL` com `resize(innerWidth, innerHeight)`.
2. **Cores**: `c0` = cor de cobertura (cor da marca ou escura), `c1` = cor da borda de avanco (uma faisca, 1 celula de espessura).
3. **Sequencia**:
   ```js
   import { DitherGL } from '../scripts/js/dither-gl.js';
   import { tween } from '../scripts/js/motion-helpers.js';
   const ov = new DitherGL(canvas); ov.resize(innerWidth, innerHeight);
   const draw = t => ov.draw({ mode: 'overlay', px: 8, t, sweep: 0, colors: ['#0023C4', '#FFE24A'] });
   await tween(draw, 450);                 // t 0 -> 1: cobre
   goToNextPage();                         // troca o conteudo enquanto esta coberto
   await tween(t => draw(1 - t), 450);     // t 1 -> 0: revela
   ov.clear();
   ```
   `sweep` 0 varre na horizontal, 1 na vertical. `px` 6 a 10 css px para ler como pixel; menor fica fino demais.
4. **Direcao e ritmo**: cobrir mais rapido (350-450 ms) que revelar; easing `1 - (1-t)^3`. Em `steps` (ex.: quantizar `t` em 12 degraus) fica retro.

## Variante B: pixel-resolve (objeto se materializa)

1. Objeto em `<canvas>` com `DitherGL`, textura `setTexture(img, { premult: true })`.
2. Use `mode: 'passthrough'` com `mosaic: true` (a textura vira mosaico de celulas `px`; sem `mosaic` ela fica nitida e so o dissolve atua) ou `gradient-map` para requantizar na paleta. Anime `px` de 24 para o valor final em **potencias de 2** (24 -> 16 -> 8 -> 4 -> 2) e `reveal` 0 -> 1 (dissolve Bayer) com mola:
   ```js
   import { spring } from '../scripts/js/motion-helpers.js';
   const PX = [24, 16, 8, 4, 2];                       // degraus em potencias de 2: os blocos "se dividem"
   await spring(v => g.draw({ mode: 'gradient-map', px: PX[Math.min(4, Math.floor(Math.min(v, 1) * 5))],
                              reveal: Math.min(1, v * 1.15), colors }), { duration: .8, bounce: .15 });
   ```
3. Se o objeto escala (FLIP), passe `scale` ao `draw` para a celula manter o tamanho na tela.

## Variante C: dissolve entre duas telas/texturas
Shader com duas texturas e `pickB = step(b8(cell+17.), clamp(mix*1.35 - uv.x*.35, 0., 1.))` (`webgl-shader.md` secao 7). Sem WebGL, fallback: duas camadas com `mask-image` Bayer e `steps()` (`svg-css.md` secao 5).

Para o mesmo efeito como **arquivo** (GIF/WebM), use `dither_anim.py pixel-resolve` ou `wipe-overlay` (`workflows/animacao-em-arquivo.md`). Objetos que migram entre paginas: `flipSlots` (`references/animacao.md` secao 3.1, `examples/flip-slots.html`).

## Verificacao (transicao nao se fotografa por tempo)
- Exponha `window.__setT(v)` (ou `__setReveal`) e capture em `t = 0, .25, .5, .75, 1`; ou registre o valor de `t` a cada quadro e confira que sobe 0 -> 1 e desce 1 -> 0 sem saltos.
- `workflows/verificar-responsivo.md` para a matriz de tamanhos; confirme que o overlay cobre a tela inteira em 360x640 e 1280x800 e que nao deixa `pointer-events` ativos depois.

## Pronto quando
- [ ] Cobre 100% da area, troca o conteudo coberto, revela sem piscar mais de 3 vezes/s.
- [ ] Celula do overlay >= 6 css px e consistente em qualquer DPR/tamanho (`px` em unidades de tela).
- [ ] `prefers-reduced-motion`: corte seco ou fade de ~150 ms, sem overlay.
- [ ] Sem WebGL: fallback por mascara CSS ou corte limpo.
- [ ] Overlay destruido/limpo ao terminar (`clear()`/`destroy()`), sem bloquear cliques.
