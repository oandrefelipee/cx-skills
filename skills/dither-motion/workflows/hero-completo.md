# Workflow: hero completo (composicao com 1 a 2 focos de dither)

Objetivo: montar uma pagina/hero que usa dither com moderacao: o dither aparece em 1 foco continuo (fundo) e, no maximo, 1 foco pontual (entrada do objeto, ou uma transicao), e todo o resto fica chapado e limpo.
Base de partida: `examples/hero-completo.html` (autonomo; passa em `scripts/verify/check-layout.cjs --primary '[data-primary]'`). Modulos: `scripts/js/dither-canvas.js`, `scripts/js/dither-gl.js`, `scripts/js/doodle-mask.js`, `scripts/js/motion-helpers.js`.
Referencias: `references/canvas2d.md`, `references/svg-css.md`, `references/performance-a11y.md`, `references/paletas.md`.

## Anatomia do exemplo (o que e dither e o que e limpo)

| Camada | Tecnica | Dither? | Custo |
|---|---|---|---|
| Fundo do cabecalho | Canvas 2D Bayer 8x8, 3 tons de azul, 12 fps, celula 4 px (`createDitherBackground`) | **foco 1 (continuo)** | baixo; pausa fora da viewport/aba oculta |
| Painel de texto | cor chapada + sombra dura (`box-shadow: 0 6px 0`), sem moldura fina | nao | zero |
| Titulo e paragrafo | texto limpo sobre o painel (contraste >= 4.5:1) | nao | zero |
| Objeto (adesivo) | WebGL `passthrough` com dissolve Bayer na entrada (`reveal` por mola em passos); depois fica estatico, so uma flutuacao `steps(6)` | **foco 2 (so na entrada)** | 1 contexto WebGL |
| Sombra do objeto | `ditherShadow` em canvas minusculo ampliado com `image-rendering: pixelated` | pequeno realce | minimo |
| Sublinhado da palavra | rabisco SVG como mascara + `clip-path` em passos (`drawDoodle`, `steps: 8`) | nao (rabisco) | minimo |
| Marcador "trabalhar por voce" | `repeating-conic-gradient` (xadrez 2 px) em CSS | micro-realce | zero |
| Botao | cor chapada + relevo (sombra dura que afunda no `:active`) | nao | zero |

## Passos

1. **Copie a base**: `cp examples/hero-completo.html minha-pagina.html` (ajuste os `../scripts` e `../assets` para os caminhos do projeto). Sirva por HTTP (`node scripts/verify/serve.mjs . 8790`).
2. **Defina os focos**: escreva "foco 1 = ____ ; foco 2 = ____" (maximo 2). Tudo que nao for foco fica chapado. Se duvidar, corte um.
3. **Paleta**: 1 matiz dominante (fundo e painel), 1 neutro (texto), 1 faisca (botao e rabisco). Fundo dither = 3 tons do **mesmo** matiz do painel (`paletas.md`). Troque as constantes `--bg/--navy/--accent` e o array `colors` do fundo.
4. **Objeto**: use uma imagem com alfa (adesivo com contorno branco, `scripts/python/procedural_sticker.py sticker in.png out.png --ring 12`) ou o PNG de `assets/`. Troque o `loadImage(...)`. Sem WebGL o exemplo cai para `<img>` normal.
5. **Texto**: titulo curto com uma palavra de destaque (a do rabisco). Troque o `src` do `drawDoodle` por um rabisco do mesmo estilo (gere com `doodle_gen.py`, `workflows/rabiscos-e-marcadores.md`).
6. **Botao primario**: mantenha `data-primary` (o verificador usa) e alvo >= 44 px (`min-height: 52px`).
7. **Responsivo**: grid de 1 coluna ate 819 px (objeto em cima, painel embaixo); 2 colunas depois. Verifique 360x640 sem rolagem horizontal e botao primario na viewport.
8. **Movimento reduzido e fallback**: o fundo vira 1 quadro estatico, o objeto aparece sem entrada, a flutuacao some (`@media (prefers-reduced-motion: reduce)`). Sem WebGL, `<img>`.
9. **Verificar** (`workflows/verificar-responsivo.md`):
   ```bash
   node scripts/verify/shots.cjs http://127.0.0.1:8790/minha-pagina.html ./prints --sizes 360x640,390x844,1280x800 --wait 2500
   node scripts/verify/check-layout.cjs http://127.0.0.1:8790/minha-pagina.html --primary '[data-primary]' --sizes 360x640,390x844,1280x800
   ```
   Abra os prints e descreva. Confirme que o dither nao fica por tras do texto.

## Variacoes (troque 1 foco por vez)
- **Fundo WebGL** em vez de Canvas 2D (campo + tons, `webgl-shader.md` secao 3) quando quiser 60 fps ou gradient-map de uma imagem.
- **Transicao de entrada da pagina** (overlay) em vez da entrada do objeto (`workflows/transicao-pixelada.md`).
- **Halftone 3D** no lugar do objeto (`examples/halftone-3d.html`) para hero editorial.
- **Objetos migrando** entre secoes (`flipSlots`, `examples/flip-slots.html`).

## Pronto quando
- [ ] No maximo 2 focos de dither, descritos no relatorio; o resto chapado.
- [ ] Texto nunca sobre dither; contraste >= 4.5:1; fonte >= 12 px; alvos >= 44 px.
- [ ] `check-layout.cjs` sem falhas em 360x640, 390x844 e 1280x800; console limpo.
- [ ] reduced-motion e sem-WebGL verificados.
- [ ] Prints olhados e anexados na entrega; o que ficou duvidoso listado.
