#!/usr/bin/env python3
"""make_sheet.py - prancha de conferencia: PNGs (com alfa) sobre varios fundos em um unico PNG.

Uso:
  python3 make_sheet.py a.png b.png c.png -o prancha.png [--tile 240] [--cols 6]
          [--bgs azul,branco,escuro,xadrez] [--bg "#FF00AA"] [--labels]

Cada linha da prancha e um fundo; cada coluna e uma imagem. Serve para ver se a borda do
objeto le bem sobre azul, branco, escuro e xadrez (revela franja escura/clara no alfa).
Fundos nomeados: azul (#002FFF), branco, escuro (#0B1033), xadrez, cinza. Qualquer #hex tambem vale.
"""
import argparse
import os

from PIL import Image, ImageDraw

NAMED = {"azul": "#002FFF", "branco": "#FFFFFF", "escuro": "#0B1033", "cinza": "#808080"}


def checker(size, sq=12, a=(200, 200, 200), b=(150, 150, 150)):
    im = Image.new("RGB", size, a)
    d = ImageDraw.Draw(im)
    for y in range(0, size[1], sq):
        for x in range(0, size[0], sq):
            if (x // sq + y // sq) % 2:
                d.rectangle([x, y, x + sq - 1, y + sq - 1], fill=b)
    return im


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def make_sheet(paths, bgs, tile=240, cols=0, labels=True):
    cols = cols or len(paths)
    rows_per_bg = -(-len(paths) // cols)
    W, H = cols * tile, len(bgs) * rows_per_bg * tile
    sheet = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(sheet)
    y = 0
    for bg in bgs:
        for r in range(rows_per_bg):
            for c in range(cols):
                i = r * cols + c
                x0, y0 = c * tile, y
                if bg == "xadrez":
                    sheet.paste(checker((tile, tile)), (x0, y0))
                else:
                    sheet.paste(Image.new("RGB", (tile, tile), hex_rgb(NAMED.get(bg, bg))), (x0, y0))
                if i < len(paths):
                    im = Image.open(paths[i]).convert("RGBA")
                    im.thumbnail((tile - 12, tile - 12), Image.LANCZOS)
                    sheet.paste(im, (x0 + (tile - im.width) // 2, y0 + (tile - im.height) // 2), im)
                    if labels and bg == bgs[0]:
                        name = os.path.basename(paths[i])[:28]
                        d.rectangle([x0, y0, x0 + 7 * len(name) + 6, y0 + 13], fill=(0, 0, 0))
                        d.text((x0 + 3, y0 + 1), name, fill=(255, 255, 255))
            y += tile
    return sheet


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pngs", nargs="+")
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--tile", type=int, default=240)
    ap.add_argument("--cols", type=int, default=0, help="colunas por fundo (padrao: todas as imagens)")
    ap.add_argument("--bgs", default="azul,branco,escuro,xadrez", help="lista separada por virgula")
    ap.add_argument("--bg", action="append", default=[], help="fundo extra #hex (repetivel)")
    ap.add_argument("--no-labels", action="store_true")
    a = ap.parse_args()
    bgs = [b.strip() for b in a.bgs.split(",") if b.strip()] + a.bg
    sh = make_sheet(a.pngs, bgs, a.tile, a.cols, not a.no_labels)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    sh.save(a.out)
    print(f"ok {a.out} {sh.width}x{sh.height}")


if __name__ == "__main__":
    main()
