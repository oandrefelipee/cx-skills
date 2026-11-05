# Workflow: pixel-art nativa

Objetivo: arte em grade logica fixa (ex.: 128x128 em que cada pixel logico = bloco 8x8 na imagem de 1024), sem antialias, poucas cores exatas, alfa binario; exibida nitida em qualquer tela.
Ferramentas: `scripts/python/dither_image.py` (`--pixel-grid N`, `--cell`), `scripts/python/palette_tools.py`, validador (snippet em `references/python-imagem.md` secao 6). Texturas NEAREST: `DitherGL.setTexture(img, { nearest: true })`.
Referencias: `references/python-imagem.md`, `references/svg-css.md` (secao 6), `references/estilos-e-referencias.md` (secao 5).

## Passos

1. **Decida a grade**: lado logico `N` (32, 64, 128) e o fator de ampliacao inteiro `F` (8 => 128 -> 1024). Quanto menor `N`, mais "8-bit". Defina o numero de cores (2 a 5) e a paleta exata.
2. **Origem da arte**:
   - de uma imagem: `python3 scripts/python/dither_image.py in.png out/pixel.png --algo bayer8 --preset pixel-azul --pixel-grid 128` (reduz o maior lado para 128 pixels logicos, dithera pixel a pixel e ja amplia com NEAREST em fator inteiro; `--cell` e ignorado nesse modo para Bayer/Floyd/Atkinson);
   - por codigo: desenhe numa matriz `NxN` (numpy) e salve com `Image.fromarray(...).resize((N*F, N*F), Image.NEAREST)`;
   - de IA: gere com alfa nativo e **normalize** (passo 3), IA nao respeita grade nem hex exato.
3. **Normalizar** o que veio de fora: reduza para `NxN` com `Image.NEAREST` (ou `BOX` se veio muito sujo), quantize para a paleta (ponto mais proximo), alfa `>= 128 => 255`, e amplie `F`x com NEAREST.
4. **Validar por script** (obrigatorio):
   - 100% dos blocos `F x F` uniformes;
   - numero de cores opacas == paleta (ou <= N);
   - alfa binario (apenas 0 e 255).
   Use `validate_grid(path, cell=F, max_colors=5)` de `python-imagem.md` secao 6. Se falhar, volte ao passo 3.
5. **Exibir**: `image-rendering: pixelated` (e `crisp-edges` para Firefox), tamanho CSS em multiplos inteiros do nativo; em canvas, `imageSmoothingEnabled = false`; em WebGL, textura `NEAREST` sem mipmap.
6. **Animar (opcional)**: `steps()` no CSS, `spring(..., { steps: 8 })` em `motion-helpers.js` (tempo quantizado) e posicoes arredondadas ao pixel da grade; hover que "pixeliza" (px 4 -> 8).
7. **Prancha**: `python3 scripts/python/make_sheet.py out/*.png -o out/prancha.png --bgs azul,branco,escuro` e olhe a nitidez das bordas.

## Armadilhas
- Ampliar com LANCZOS/BICUBIC borra; sempre NEAREST.
- Escala fracionaria no navegador cria colunas irregulares; use multiplos inteiros.
- Mipmap em textura de pixel-art apaga a nitidez.
- Sombra/blur CSS em pixel-art quebra o estilo: use sombra dura (sem blur) ou dither.

## Pronto quando
- [ ] Validacao por script: blocos uniformes 100%, cores exatas, alfa binario.
- [ ] Renderiza nitida em DPR 1, 2 e 3 (print de cada) sem bordas moles.
- [ ] Legivel em tamanho pequeno (thumbnail 64 px) e sobre azul, branco e escuro.
- [ ] Fallback: PNG pre-assado com `image-rendering: pixelated` (sem JS).
