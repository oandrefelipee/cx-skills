# Workflow: rabiscos, marcadores e realces em dither

Objetivo: dar vida a uma UI limpa com poucos realces: rabiscos desenhados (setas, sublinhados, circulos), marcador pontilhado sob a palavra de destaque, sombra de contato pontilhada, brilho que varre, confete de quadradinhos.
Ferramentas: `scripts/python/doodle_gen.py` (gera o conjunto de SVG), `scripts/js/doodle-mask.js` (`drawDoodle`, `resetDoodle`), `scripts/js/dither-canvas.js` (`createDitherBackground`, `ditherShadow`, `confetti`), SVGs prontos em `assets/doodles/`. Exemplos: `examples/rabiscos-clip.html`, `examples/bg-animado-canvas.html`.
Referencias: `references/svg-css.md` (secoes 2 a 4, 7), `references/canvas2d.md` (secoes 4 a 6).

## Regra de ouro
No maximo **2 ou 3 realces por tela**, escolhidos para guiar o olho (palavra de destaque, CTA, objeto-heroi). Realce em tudo vira poluicao.

## Passos

1. **Escolha o realce** por funcao:
   | Quer destacar | Use |
   |---|---|
   | uma palavra do titulo | sublinhado-onda (rabisco) ou marcador pontilhado |
   | o objeto principal | circulo aberto / faisca / asterisco ao redor (rabisco) |
   | um CTA | seta curva apontando + relevo de botao (sombra dura) |
   | um item selecionado | brilho que varre (`sel`) |
   | uma conquista | confete 4x4 em 2 tons, uma vez |
   | profundidade de objeto | sombra pontilhada de contato |
2. **Rabisco desenhado** (mascara + `clip-path`):
   ```html
   <i class="doodle" style="position:absolute; left:530px; top:176px; width:44px; height:44px"></i>
   ```
   ```js
   import { drawDoodle } from '../scripts/js/doodle-mask.js';
   drawDoodle(el, { src: '../assets/doodles/seta-curva-brush.svg', color: '#FFC933', duration: 700, delay: 1100 });   // suave
   drawDoodle(el2, { src: '../assets/doodles/sublinhado-onda-pixel.svg', color: '#B8F23B', steps: 8 });                // em passos (pixel)
   ```
   Variantes em `assets/doodles/`: `*-brush.svg` (curva suave), `*-engrave.svg` (gravura) e `*-pixel.svg` (pixels, usar `steps`). Precisa de HTTP (a mascara de `file://` e bloqueada).
   **Outro desenho ou estilo**: gere o conjunto com o gerador (17 desenhos x 3 estilos, tudo `currentColor`):
   ```bash
   python3 scripts/python/doodle_gen.py --list                                   # nomes disponiveis
   python3 scripts/python/doodle_gen.py --style pixel --out ./doodles --seed 7   # so o estilo pixel
   python3 scripts/python/doodle_gen.py --style all --only seta-curva,sublinhado-onda,circulo-aberto --out ./doodles --contact
   node scripts/verify/serve.mjs ./doodles 8791                                   # abra /index.html: prancha de conferencia
   ```
   `--seed` fixa o resultado, `--weight 1.2` engrossa o traco. Escolha 3 a 5 desenhos do mesmo estilo para a tela (estilos misturados poluem) e copie os SVG para o projeto.
3. **Marcador pontilhado**: gere o SVG 44x4 por Python (`canvas2d.md` secao 5) e use como `background`/`mask` sob a palavra; alterne duas versoes (`off=0` e `off=2`) com `steps(1)` para "tremer".
4. **Sombra pontilhada**: `ditherShadow(ctx, x, y, w, h, { color: '#001A9A', cell: 4 })` num canvas sob o objeto, ou o tile CSS (`canvas2d.md` secao 4); duas densidades (perto denso, longe esparso). Cor = fundo escurecido, nunca preto puro.
5. **Confete**:
   ```js
   import { confetti } from '../scripts/js/dither-canvas.js';
   const fx = confetti(fxCanvas, { colors: ['#FFC933', '#2DD4BF', '#FFFFFF'] });
   fx.burst(x, y, 24);     // rajada ao clicar
   fx.rain(40);            // chuva leve (final de fluxo)
   ```
   So nas laterais, nunca sobre o titulo; limite de particulas; pare com `document.hidden`.
6. **Relevo de botao**: `box-shadow: 0 6px 0 var(--shade)`; `:active` desce 4 px e encurta a sombra (`svg-css.md` secao 7).
7. **Mobile**: esconda enfeites que cobrem texto em telas estreitas (`.hide-m{display:none}` no breakpoint).
8. **reduced-motion**: rabiscos aparecem completos (sem animar), confete nao dispara, brilho fica parado.

## Pronto quando
- [ ] 2 a 3 realces por tela, cada um com funcao clara.
- [ ] Nenhum realce cobre texto ou alvo de toque (checagem de `check-layout.cjs`: "texto coberto").
- [ ] Rabiscos usam a cor da marca (mudam trocando `color`), sem asset novo por cor.
- [ ] `prefers-reduced-motion` respeitado; nada pisca > 3 vezes/s.
- [ ] Verificado em 360x640 e 1280x800 (`verificar-responsivo.md`).
