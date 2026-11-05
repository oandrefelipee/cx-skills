# Workflow: imagem para dither

Objetivo: converter uma imagem existente em dither, pixel-art de N cores, halftone ou hachura (PNG/WebP).
Ferramentas: `scripts/python/dither_image.py` (Pillow + numpy), `scripts/python/palette_tools.py`, `scripts/python/make_sheet.py`.
Referencias: `references/algoritmos.md`, `references/python-imagem.md`, `references/paletas.md`.

## Passos

1. **Defina o look** (30 s): algoritmo (tabela em `algoritmos.md` secao 8), numero de tons (2, 3 ou 4) e celula. Padrao seguro para UI: `bayer8`, 4 tons, `--cell 4`.
2. **Escolha a paleta** do mais escuro ao mais claro: `--preset` (`python3 scripts/python/palette_tools.py presets`) ou `--palette "#a,#b,#c,#d"`. Confira contraste do tom claro contra o fundo de destino: `python3 scripts/python/palette_tools.py contrast "#FFE24A" "#0A1A7A"`.
3. **Gere uma versao pequena** e olhe:
   ```bash
   python3 scripts/python/dither_image.py in.png out/bayer8.png --algo bayer8 --preset pixel-azul --cell 4
   ```
4. **Gere variacoes** para comparar (2 a 4): outro algoritmo (`floyd`, `atkinson`, `halftone`, `hatch`), outra celula (2, 4, 6), outra paleta. Para pixel-art honesta use grade logica:
   ```bash
   python3 scripts/python/dither_image.py in.png out/pixel128.png --algo bayer8 --preset notas --pixel-grid 128 --scale 2
   ```
5. **Ajuste tons**: foto escura/clara demais => `--lo 0.05 --hi 0.95 --gamma 1.2`; negativo => `--invert`; padrao mais suave => `--amount 0.7`.
6. **Alfa**: por padrao o alfa vira blocos nitidos (pixel-art). Para bordas suaves de adesivo/logo use `--keep-alpha`.
7. **Prancha de comparacao** sobre varios fundos:
   ```bash
   python3 scripts/python/make_sheet.py out/*.png -o out/prancha.png --bgs azul,branco,escuro,xadrez --labels
   ```
   Abra a prancha e descreva o que ve (celula do tamanho certo? franja nas bordas? tons intermediarios?).
8. **Escolha** com o usuario (ou pela checagem de leitura), salve a versao final em PNG/WebP lossless. Mantenha as variacoes catalogadas.

## Notas
- Difusao de erro (`floyd`, `atkinson`) em Python puro e lenta com `--cell 1` em imagens grandes: use `--cell >= 2` ou `--pixel-grid`.
- Para usar a imagem em shader/animacao depois, gere tambem a versao cinza `--preset cinema` (4 tons neutros) para tingir por filtro SVG ou gradient-map (`tingir-por-paleta.md`).
- Sem Pillow/numpy? Alternativa de uma linha: `magick in.png -colorspace Gray -ordered-dither o8x8 out.png` (verificar flags; ver `python-imagem.md` secao 8).
- Exibicao: `image-rendering: pixelated` e tamanhos em multiplos inteiros.

## Pronto quando
- [ ] Pelo menos 2 variacoes comparadas em prancha sobre azul, branco e escuro.
- [ ] Tamanho da celula legivel no tamanho final de exibicao (amplie 400% um trecho e confirme).
- [ ] Contraste do tom mais claro contra o fundo >= 3:1 (>= 4.5:1 se houver texto).
- [ ] Sem franja escura/clara nas bordas (alfa) e so as cores da paleta (sem tons intermediarios).
- [ ] Arquivo final PNG/WebP lossless, nome que diz algoritmo, paleta e celula.
