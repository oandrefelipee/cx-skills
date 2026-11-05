# Workflow: ilustracao procedural (objeto/adesivo em dither por codigo)

Objetivo: desenhar por codigo um objeto (moeda, nota, escudo, icone) em rampas de 4 tons com Bayer, contorno de tinta, adesivo branco e sombra plana; trocar a paleta sem mudar a geometria.
Ferramentas: `scripts/python/procedural_sticker.py` (CLI `coin|stack|bill|scene|sticker` e modulo `Art`, `shade_bayer`, `ink_outline`, `sticker_outline`, `add_sticker`), `scripts/python/palette_tools.py`, `scripts/python/make_sheet.py`.
Referencias: `references/python-imagem.md` (secoes 4 e 5), `references/paletas.md`. Origem: `rodada4/tools/money_dither.py`.

## Passos

1. **Objeto e luz**: liste as formas do objeto e o material de cada uma (ex.: face, borda, faixa, selo). Luz **sempre de cima a esquerda** em todos os objetos do conjunto, para parecerem do mesmo universo.
2. **Rampas**: uma de 4 tons por material (sombra -> brilho). Ponto de partida: `palette_tools.py presets` (`ouro`, `lima`, `coral`, `notas`...) ou monte (`paletas.md` secao 2).
3. **Gerar com o CLI** quando o objeto existe pronto (moeda, pilha, nota):
   ```bash
   python3 scripts/python/procedural_sticker.py coin  out/moeda.png --ramp ouro --size 512 --cell 4
   python3 scripts/python/procedural_sticker.py stack out/pilha.png --n 5
   python3 scripts/python/procedural_sticker.py bill  out/nota.png --ramp turquesa --field-ramp creme
   python3 scripts/python/procedural_sticker.py scene out/cena.png
   ```
   Para qualquer PNG com alfa, so o adesivo (contorno + sombra):
   ```bash
   python3 scripts/python/procedural_sticker.py sticker in.png out/adesivo.png --ring 12 --shadow-dy 8 --ring-color "#FFFFFF"
   ```
4. **Objeto novo (modulo)**: importe `Art` e componha mascaras em supersampling 2x; para cada material defina `lum(u, v)` (luz + aneis/faixas), quantize com `shade_bayer` (Bayer 8x8 em celulas `cell` px, 4 tons), ponha linhas finas em **tom forcado** sem dither (filetes, guilhoche, texto), contorno de tinta de 3 px (`ink_outline`), adesivo de 12 px (`sticker_outline`/`add_sticker`). Confirme a assinatura com `python3 -c "import procedural_sticker as p; help(p.Art)"` dentro de `scripts/python`.
5. **Duas paletas, mesma geometria**: gere a cena com cada dicionario `{material: rampa}`; compare em prancha:
   ```bash
   python3 scripts/python/make_sheet.py out/*.png -o out/prancha.png --bgs azul,branco,escuro --labels
   ```
6. **Verifique**: celula de 4 px visivel no tamanho final; linhas finas nitidas; adesivo continuo (sem furos); sombra plana sem blur forte; objeto legivel em 120 px (thumbnail).
7. **Exportar**: PNG 1024x1024 com alfa (ou 512), nome `<objeto>-<paleta>.png`; versao WebP lossless se precisar de peso menor.

## Regras de gosto (caso real)
- Contorno de tinta escuro (3 px) e adesivo branco (12 px) fazem o objeto ler sobre qualquer fundo, inclusive o azul da marca.
- Sombra **plana** deslocada (8 px), nunca borrada em excesso e sem brilho 3D/glow.
- Paletas: sticker "vivo" (lima, coral, ouro) ou "cedula" (turquesa, roxo, ouro, creme).
- Evite texto fino dentro do objeto (< 12 px) e mais de 4 tons por material.

## Pronto quando
- [ ] Luz consistente em todos os objetos do conjunto.
- [ ] Quantizacao Bayer em celulas de 4 px; sem tons fora das rampas (exceto contorno/adesivo/sombra).
- [ ] Prancha sobre azul, branco e escuro revisada (olhada, nao so gerada).
- [ ] Alfa limpo (sem franja), PNG com transparencia validada (`sips -g hasAlpha arq.png` no macOS ou `Image.open().mode == 'RGBA'`).
- [ ] Duas paletas geradas se o produto precisar de tema.
