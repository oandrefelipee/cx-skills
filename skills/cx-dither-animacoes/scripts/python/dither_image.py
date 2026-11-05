#!/usr/bin/env python3
"""dither_image.py - dither, halftone, hachura e pixel-art em imagens (Pillow + numpy).

Exemplos:
  python3 dither_image.py in.png out.png --algo bayer8 --preset pixel-azul --cell 4
  python3 dither_image.py in.png out.png --algo floyd --palette "#0A1A7A,#7BE8FF,#F5F7FF,#FFE24A"
  python3 dither_image.py in.png out.png --algo halftone --preset cinema --cell 8
  python3 dither_image.py in.png out.png --algo bayer8 --preset notas --pixel-grid 128 --scale 2

Algoritmos:
  bayer2|bayer4|bayer8  dither ordenado (matriz de Bayer). Cada "pixel" do dither tem --cell px.
  floyd                 difusao de erro Floyd-Steinberg (grao organico).
  atkinson              difusao de erro Atkinson (contraste alto, estilo Mac antigo).
  halftone              retícula de pontos a 45 graus; --cell = periodo do ponto em px.
  hatch                 hachura diagonal (gravura); --cell = periodo das linhas em px;
                        regioes bem escuras ganham a hachura cruzada.

Paleta: --palette "#a,#b,#c,#d" (do MAIS ESCURO ao MAIS CLARO, ordem usada tal qual) ou
  --preset (pixel-azul | cinema | notas | ... veja `palette_tools.py presets`). N cores = N tons.

Tamanho:
  --scale S      redimensiona a entrada (Lanczos) por S ANTES do dither (2 = o dobro de resolucao).
  --cell C       lado, em pixels de saida, de cada "pixel" do dither (blocos C x C).
  --pixel-grid N reduz o maior lado para uma grade logica de N pixels, dithera pixel a pixel e
                 amplia com NEAREST (fator inteiro). Cada pixel logico vira um bloco nitido.
Alfa:
  Por padrao o alfa e preservado em blocos (alfa >= 50% da celula = opaco, senao transparente:
  borda nitida de pixel-art). --keep-alpha mantem o alfa ORIGINAL (bordas suaves, resolucao cheia).
Ajustes: --gamma (>1 escurece meios-tons), --lo/--hi (niveis de entrada 0..1), --invert,
  --amount (forca do dither ordenado: 0 = posteriza, 1 = normal).
Saida determinística (sem aleatoriedade). Error-diffusion em Python puro: com --cell 1 em
imagens grandes leva alguns segundos; prefira --cell >= 2 ou --pixel-grid.
"""
import argparse
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from palette_tools import PRESETS, luma, parse_palette  # noqa: E402

ALGOS = ["bayer2", "bayer4", "bayer8", "floyd", "atkinson", "halftone", "hatch"]


# ------------------------------------------------------------------ matrizes / limiares
def bayer(n):
    """Matriz de Bayer n x n (n potencia de 2) com inteiros 0..n*n-1."""
    m = np.array([[0]])
    while m.shape[0] < n:
        m = np.block([[4 * m, 4 * m + 2], [4 * m + 3, 4 * m + 1]])
    return m


def bayer_threshold(shape, n):
    """Limiar 0..1 (centro do degrau) ladrilhado para o formato `shape` (h, w)."""
    b = (bayer(n) + 0.5) / (n * n)
    h, w = shape
    return np.tile(b, (h // n + 1, w // n + 1))[:h, :w].astype(np.float32)


def apply_levels(lum, lo, hi, gamma, invert):
    out = np.clip((lum - lo) / max(1e-6, hi - lo), 0, 1)
    if gamma != 1:
        out = out ** gamma
    return 1 - out if invert else out


def tone_index(lum, thr, n):
    """lum 0..1 + limiar 0..1 -> indice de tom 0..n-1 (gradient-map com dither)."""
    f = np.clip(lum, 0, 1) * (n - 1)
    base = np.floor(f)
    frac = f - base
    return np.clip(base + (frac > thr), 0, n - 1).astype(np.int32)


# ------------------------------------------------------------------ difusao de erro
def diffuse(lum, n, kind):
    """Floyd-Steinberg / Atkinson sobre luminancia 0..1 com n niveis. Retorna indices."""
    h, w = lum.shape
    pad = 3
    buf = [[0.0] * (w + 2 * pad) for _ in range(h + 3)]
    for y in range(h):
        buf[y][pad:pad + w] = lum[y].astype(float).tolist()
    out = np.zeros((h, w), np.int32)
    k = n - 1
    if kind == "floyd":
        taps = ((1, 0, 7 / 16), (-1, 1, 3 / 16), (0, 1, 5 / 16), (1, 1, 1 / 16))
    else:  # atkinson: espalha so 6/8 do erro (perde 2/8): mais contraste
        e = 1 / 8
        taps = ((1, 0, e), (2, 0, e), (-1, 1, e), (0, 1, e), (1, 1, e), (0, 2, e))
    for y in range(h):
        row = buf[y]
        orow = out[y]
        for x in range(w):
            v = row[x + pad]
            q = min(k, max(0, int(v * k + 0.5)))
            orow[x] = q
            err = v - q / k
            for dx, dy, wt in taps:
                buf[y + dy][x + pad + dx] += err * wt
    return out


# ------------------------------------------------------------------ halftone / hatch
def screen_threshold(shape, kind, period):
    """Limiar 0..1 em resolucao cheia. Quanto MAIOR, mais escuro o pixel permanece."""
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    s2 = np.float32(np.sqrt(0.5))
    if kind == "halftone":
        a = (xx + yy) * s2 / period
        b = (xx - yy) * s2 / period
        spot = (np.cos(2 * np.pi * a) + np.cos(2 * np.pi * b)) / 4 + 0.5  # 1 no centro do ponto
        return spot * 0.98
    u1 = (xx + yy) * s2 / period
    t1 = 1 - np.abs((u1 % 1.0) - 0.5) * 2          # 1 no centro da linha
    u2 = (xx - yy) * s2 / period
    t2 = 1 - np.abs((u2 % 1.0) - 0.5) * 2
    return np.maximum(t1, t2 * 0.5) * 0.98          # 2a familia so aparece onde lum < ~0.5


# ------------------------------------------------------------------ reducao ciente de alfa
def reduce_lum(lum, alpha, gw, gh):
    """Media por celula da luminancia ponderada por alfa -> (lum_grid, alpha_grid)."""
    def box(a):
        return np.asarray(Image.fromarray(a.astype(np.float32), "F").resize((gw, gh), Image.BOX))
    am = box(alpha)
    lm = box(lum * alpha)
    return np.where(am > 1e-4, lm / np.maximum(am, 1e-4), 0).astype(np.float32), am


def resize_f(a, size, resample):
    return np.asarray(Image.fromarray(a.astype(np.float32), "F").resize(size, resample))


# ------------------------------------------------------------------ pipeline
def dither_image(im, algo="bayer8", palette="pixel-azul", cell=4, scale=1.0, pixel_grid=0,
                 keep_alpha=False, gamma=1.0, lo=0.0, hi=1.0, invert=False, amount=1.0):
    if algo not in ALGOS:
        raise ValueError(f"algo invalido: {algo} (use {ALGOS})")
    pal = parse_palette(palette)
    n = len(pal)
    im = im.convert("RGBA")
    if scale != 1:
        im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    W, H = im.size
    arr = np.asarray(im)
    lum = apply_levels(luma(arr[..., :3]), lo, hi, gamma, invert)
    alpha = arr[..., 3].astype(np.float32) / 255.0

    if pixel_grid:
        # grade logica: maior lado = pixel_grid; cada pixel logico vira k x k na saida
        if W >= H:
            gw, gh = pixel_grid, max(1, round(pixel_grid * H / W))
        else:
            gh, gw = pixel_grid, max(1, round(pixel_grid * W / H))
        k = max(1, round(max(W, H) / pixel_grid))
        blocks = True
    else:
        k = max(1, int(cell))
        gw, gh = -(-W // k), -(-H // k)
        blocks = algo in ("bayer2", "bayer4", "bayer8", "floyd", "atkinson")

    if blocks:
        lg, ag = reduce_lum(lum, alpha, gw, gh)
        if algo.startswith("bayer"):
            nb = int(algo[5:])
            thr = 0.5 + (bayer_threshold((gh, gw), nb) - 0.5) * amount
            idx = tone_index(lg, thr, n)
        elif algo in ("floyd", "atkinson"):
            idx = diffuse(lg, n, algo)
        else:  # halftone/hatch em grade logica: periodo = cell em pixels logicos (so com --pixel-grid)
            period = max(2.0, float(cell))
            idx = tone_index(lg, screen_threshold((gh, gw), algo, period), n)
        rgb = pal[idx]
        ah = (ag >= 0.5)
        up = lambda a: np.repeat(np.repeat(a, k, axis=0), k, axis=1)
        rgb = up(rgb)
        ahard = up(ah)
        outW, outH = gw * k, gh * k
        if not pixel_grid:  # recorta a sobra do ultimo bloco
            rgb, ahard, outW, outH = rgb[:H, :W], ahard[:H, :W], W, H
        a8 = np.where(ahard, 255, 0).astype(np.uint8)
        if keep_alpha:
            a8 = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).resize((outW, outH), Image.LANCZOS))
    else:
        # halftone / hatch em resolucao cheia, luminancia suavizada pelo periodo
        period = max(2.0, float(cell))
        lg, ag = reduce_lum(lum, alpha, max(1, round(W / period)), max(1, round(H / period)))
        lf = resize_f(lg, (W, H), Image.BILINEAR)
        thr = screen_threshold((H, W), algo, period)
        idx = tone_index(lf, thr, n)
        rgb = pal[idx]
        a8 = (alpha * 255).astype(np.uint8) if keep_alpha else np.where(alpha >= 0.5, 255, 0).astype(np.uint8)

    out = np.dstack([rgb.astype(np.uint8), a8])
    return Image.fromarray(out, "RGBA")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("inp")
    ap.add_argument("out")
    ap.add_argument("--algo", choices=ALGOS, default="bayer8")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--palette", help='"#a,#b,..." do mais escuro ao mais claro')
    g.add_argument("--preset", choices=sorted(PRESETS), help="paleta pronta")
    ap.add_argument("--cell", type=int, default=4, help="px de saida por pixel do dither (padrao 4)")
    ap.add_argument("--scale", type=float, default=1.0, help="escala da entrada antes do dither (padrao 1)")
    ap.add_argument("--pixel-grid", type=int, default=0, metavar="N", help="grade logica de N px no maior lado")
    ap.add_argument("--keep-alpha", action="store_true", help="mantem o alfa original (bordas suaves)")
    ap.add_argument("--gamma", type=float, default=1.0)
    ap.add_argument("--lo", type=float, default=0.0)
    ap.add_argument("--hi", type=float, default=1.0)
    ap.add_argument("--invert", action="store_true")
    ap.add_argument("--amount", type=float, default=1.0, help="forca do dither ordenado (0..1)")
    a = ap.parse_args()

    pal = a.palette or a.preset or "pixel-azul"
    res = dither_image(Image.open(a.inp), a.algo, pal, a.cell, a.scale, a.pixel_grid, a.keep_alpha,
                       a.gamma, a.lo, a.hi, a.invert, a.amount)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    res.save(a.out)
    print(f"ok {a.out} {res.size[0]}x{res.size[1]} algo={a.algo} tons={len(parse_palette(pal))}")


if __name__ == "__main__":
    main()
