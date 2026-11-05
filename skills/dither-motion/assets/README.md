# assets/

Imagens pequenas de exemplo (512x512 RGBA) e SVGs de rabisco, usados por `examples/` e para testar os scripts.
Origem: trabalho do modal da primeira recarga (rodadas 3 a 5) em
`.codex-objetos-modal/` (abreviado `CO/`). Os PNGs foram reduzidos de 1024 para 512
(Lanczos; `pixel-cofre.png` com NEAREST para manter os blocos nítidos).

| Arquivo | Origem | Notas |
|---------|--------|-------|
| `sticker-moedas.png` | `CO/rodada4/out/sticker-vivo/moedas.png` | adesivo vivo (cores cheias, contorno branco) |
| `sticker-escudo.png` | `CO/rodada4/out/sticker-vivo/escudo.png` | idem |
| `sticker-encomenda.png` | `CO/rodada4/out/sticker-vivo/encomenda.png` | idem |
| `sticker-chat-ia.png` | `CO/rodada4/out/sticker-vivo/chat-ia.png` | idem |
| `cinema-moedas.png` | `CO/rodada4/out/dither-cinema/moedas.png` | 4 tons de cinza (base para tingir por filtro/shader) |
| `cinema-grafico.png` | `CO/rodada4/out/dither-cinema/grafico.png` | 4 tons de cinza |
| `dinheiro-crescimento.png` | `CO/rodada4/out/dinheiro/atual/crescimento.png` | dinheiro em dither Bayer 8x8 (money_dither.py) |
| `pixel-cofre.png` | `CO/rodada3/out/d3-cobalto-pixel/cofre.png` | pixel-art em grade lógica (usar NEAREST) |
| `doodles/*-pixel.svg` | `CO/rodada3/out/d3-cobalto-pixel/rabiscos/` | rabiscos em pixels (`shape-rendering:crispEdges`), `currentColor` |
| `doodles/*-brush.svg` | `CO/rodada3/out/d2-papel-e-fio/rabiscos/` | rabiscos de pincel, `currentColor` |
| `doodles/*-engrave.svg` | `scripts/python/doodle_gen.py --style engrave` (seed 7) | rabiscos de gravura (fio duplo + hachura), `currentColor` |
| `generated/anim-*.gif` | `scripts/python/dither_anim.py` (reveal, pixel-resolve, breathe, wipe-overlay) | animações em dither prontas; paleta exata, alfa de 1 bit |
| `generated/*.png` | gerados por `scripts/python/dither_image.py` a partir de `sticker-encomenda.png` | comparação de algoritmos (usado em `examples/halftone-hachura.html`) |

Regerar os `generated/`:

```
cd scripts/python
python3 dither_image.py ../../assets/sticker-encomenda.png ../../assets/generated/encomenda-bayer8.png    --algo bayer8    --preset cinema    --cell 4
python3 dither_image.py ../../assets/sticker-encomenda.png ../../assets/generated/encomenda-floyd.png     --algo floyd     --preset cinema    --cell 2
python3 dither_image.py ../../assets/sticker-encomenda.png ../../assets/generated/encomenda-atkinson.png  --algo atkinson  --preset cinema    --cell 2
python3 dither_image.py ../../assets/sticker-encomenda.png ../../assets/generated/encomenda-halftone.png  --algo halftone  --preset cinema    --cell 9
python3 dither_image.py ../../assets/sticker-encomenda.png ../../assets/generated/encomenda-hatch.png     --algo hatch     --preset cinema    --cell 7
python3 dither_image.py ../../assets/sticker-encomenda.png ../../assets/generated/encomenda-pixel64.png   --algo bayer8    --preset pixel-azul --pixel-grid 64
```

Regerar as animações (de `scripts/python`):

```
python3 dither_anim.py reveal        ../../assets/sticker-escudo.png -o ../../assets/generated/anim-reveal.gif --preset pixel-azul --duration 1.2 --fps 16 --scale 0.5 --cell 2
python3 dither_anim.py pixel-resolve ../../assets/sticker-moedas.png -o ../../assets/generated/anim-pixel-resolve.gif --preset notas --scale 0.5 --cell 2 --from-px 16 --duration 1.2
python3 dither_anim.py breathe       -o ../../assets/generated/anim-breathe.gif --size 320x180 --preset cobalto-3 --fps 12 --duration 3
python3 dither_anim.py wipe-overlay  ../../assets/sticker-moedas.png -o ../../assets/generated/anim-wipe.gif --overlay-colors "#0C27B4,#7BE8FF" --bg "#1235E6" --scale 0.5 --cell 2 --fps 16
python3 doodle_gen.py --style engrave --only seta-curva,sublinhado-onda --out /tmp/d   # depois copie p/ assets/doodles/*-engrave.svg
```
