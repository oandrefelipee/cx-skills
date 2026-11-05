# Workflow: fundo animado em dither

Objetivo: fundo (hero, painel, card, modal) com dither que respira, leve e sem atrapalhar o texto.
Ferramentas: `scripts/js/dither-canvas.js` (Canvas 2D, padrao), `scripts/js/dither-gl.js` (WebGL, quando precisar de mais). Exemplos: `examples/bg-animado-canvas.html`, `examples/shader-gradient-map.html`.
Referencias: `references/canvas2d.md`, `references/webgl-shader.md`, `references/performance-a11y.md`.

## Escolha do motor
| Precisa | Use |
|---|---|
| Fundo de manchas/ondas, 3 tons, 12-15 fps | Canvas 2D (`createDitherBackground`) |
| Gradient-map de uma imagem ou video, hachura, 60 fps, tela cheia | WebGL (`DitherGL`, modo `background`/`gradient-map`) |
| Nenhum JS | Tile Bayer + `linear-gradient` em CSS (`svg-css.md` secao 4) |

## Passos (Canvas 2D)

1. **Estrutura**: um pai com `position: relative; overflow: hidden; background: <cor base>` e, dentro, o canvas `position:absolute; inset:0; width:100%; height:100%; pointer-events:none` (`aria-hidden="true"`), atras do conteudo (`z-index: 0`; conteudo `position: relative; z-index: 1`).
2. **Tons**: 3 tons do mesmo matiz da cor do pai (base, +medio, +claro). Dica: derive da cor de fundo: `base`, `base + 12% branco`, `base + 24% branco`.
3. **Ligar**:
   ```js
   import { createDitherBackground } from '../scripts/js/dither-canvas.js';
   const bg = createDitherBackground(document.querySelector('#bg'), {
     colors: ['#0023C4', '#1F3FE0', '#4F6BFF'], cell: 4, fps: 12, speed: 1 });
   // bg.stop(); bg.start(); bg.setColors([...]); bg.destroy();
   ```
   O helper ja pausa com `document.hidden` e fora da viewport e mostra 1 quadro estatico em `prefers-reduced-motion`.
4. **Calibrar** olhando um print: `cell` 4 a 6 para fundo (2 a 3 para objeto); velocidade lenta (o campo se move devagar); sem tons de matizes diferentes.
5. **Leitura**: o texto fica sobre area calma do fundo (mancha de luz longe do titulo) ou sobre uma "placa" chapada; contraste >= 4.5:1 contra o **tom mais claro** do fundo atras do texto.
6. **WebGL (se necessario)**:
   ```js
   import { DitherGL } from '../scripts/js/dither-gl.js';
   if (!DitherGL.supported()) { /* usar createDitherBackground */ }
   const g = new DitherGL(canvas); g.resize(w, h);
   const loop = t => { g.draw({ mode: 'background', px: 4, time: t/1000, steps: 3,
                       colors: ['#0023C4','#1F3FE0','#4F6BFF','#9DB2FF'] }); raf = requestAnimationFrame(loop); };
   ```
   Pare o rAF com `IntersectionObserver`/`visibilitychange`; 1 quadro em reduced-motion.
7. **Verifique**: `workflows/verificar-responsivo.md` (360x640 a 1280x800), console limpo, reduced-motion com `page.emulateMedia({reducedMotion:'reduce'})`.

## Variacoes
- **Brilho que varre** um cartao selecionado, **halo no canto** no passo final, **faixa que corre** numa barra de progresso: modos `sel`, `glow`, `road` do caso real (`canvas2d.md` secao 2).
- **Fundo escuro "mare"**: campo suave quantizado em 4 tons que so acende ate um ponto (`DitherField`, `webgl-shader.md` secao 3).

## Pronto quando
- [ ] 1 so elemento animado dominante na tela; fundo nao compete com o conteudo.
- [ ] 12-15 fps (Canvas) ou DPR <= 1.5 (WebGL); pausa fora da viewport/aba oculta.
- [ ] `prefers-reduced-motion`: 1 quadro estatico, sem rAF.
- [ ] Texto legivel (>= 4.5:1) e nunca coberto por dither; mobile 360x640 sem rolagem horizontal.
- [ ] Fallback definido (imagem pre-assada ou gradiente CSS) e testado.
