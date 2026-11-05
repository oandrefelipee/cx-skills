#!/usr/bin/env python3
"""Ferramentas de paleta para dither: rampas, gradient-map, contraste WCAG e presets.

Convencao: toda paleta/rampa e uma lista de cores do MAIS ESCURO para o MAIS CLARO
(indice 0 = sombra, ultimo = luz). O dither usa a ordem exatamente como foi dada.

Uso (CLI):
  python3 palette_tools.py presets
  python3 palette_tools.py ramp "#0A1A7A" "#F5F7FF" -n 4
  python3 palette_tools.py map in.png out.png --palette "#0A1A7A,#7BE8FF,#F5F7FF,#FFE24A"
  python3 palette_tools.py contrast "#FFE24A" "#0A1A7A"
  python3 palette_tools.py svg-tones --preset pixel-azul      # tableValues p/ svg-tone-filter.js
Como modulo: from palette_tools import parse_palette, ramp, gradient_map, contrast, PRESETS
"""
import argparse
import sys

import numpy as np
from PIL import Image

# Presets reais do trabalho (rodadas 3 a 5). Ordem: sombra -> luz.
PRESETS = {
    # azul cobalto pixel-art (d3): marinho, ciano, quase branco, amarelo
    "pixel-azul": ["#0A1A7A", "#7BE8FF", "#F5F7FF", "#FFE24A"],
    # "dither cinema": 4 tons de cinza neutros (base para tingir depois por filtro/shader)
    "cinema": ["#0A0A0A", "#5A5A5A", "#B0B0B0", "#FFFFFF"],
    # dinheiro/notas: roxo, turquesa, ouro brilhante, creme
    "notas": ["#4C1D95", "#2DD4BF", "#FFC933", "#F2ECDC"],
    # extras uteis
    "lima": ["#1F6B3A", "#6FB82E", "#B8F23B", "#F4FFD0"],
    "ouro": ["#8A5A00", "#E09A00", "#FFC21A", "#FFE79A"],
    "coral": ["#8A1F3B", "#D63A5E", "#FF4F7B", "#FFC2CF"],
    "cobalto-3": ["#001A9A", "#002FFF", "#4D7BFF"],
    "papel": ["#2B2118", "#7A5C3E", "#D8C7A5", "#FAF6EA"],
}


# ------------------------------------------------------------------ cores
def hex_to_rgb(h):
    h = h.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) != 6:
        raise ValueError(f"cor invalida: {h!r} (use #RRGGBB)")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgb_to_hex(rgb):
    return "#%02X%02X%02X" % tuple(int(round(max(0, min(255, c)))) for c in rgb)


def parse_palette(spec):
    """'#a,#b,#c' | nome de preset | lista -> np.ndarray (N,3) uint8."""
    if isinstance(spec, str):
        key = spec.strip().lower()
        spec = PRESETS[key] if key in PRESETS else [s for s in spec.split(",") if s.strip()]
    if len(spec) < 2:
        raise ValueError("a paleta precisa de pelo menos 2 cores")
    return np.array([hex_to_rgb(c) if isinstance(c, str) else tuple(c) for c in spec], np.uint8)


# ------------------------------------------------------------------ rampas
def ramp(c0, c1, n=4, space="srgb"):
    """Rampa de n tons entre duas cores. space: 'srgb' (padrao) ou 'linear' (mistura em luz linear)."""
    a = np.array(hex_to_rgb(c0) if isinstance(c0, str) else c0, float)
    b = np.array(hex_to_rgb(c1) if isinstance(c1, str) else c1, float)
    t = np.linspace(0, 1, n)[:, None]
    if space == "linear":
        la, lb = _to_lin(a / 255), _to_lin(b / 255)
        out = _from_lin(la + (lb - la) * t) * 255
    else:
        out = a + (b - a) * t
    return np.clip(np.round(out), 0, 255).astype(np.uint8)


def _to_lin(c):
    c = np.asarray(c, float)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def _from_lin(c):
    c = np.asarray(c, float)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(np.maximum(c, 0), 1 / 2.4) - 0.055)


# ------------------------------------------------------------------ luminancia / contraste
def luma(rgb):
    """Luminancia perceptual simples (Rec.709 em sRGB) 0..1; funciona com arrays (...,3)."""
    rgb = np.asarray(rgb, np.float32)
    return (rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722) / 255.0


def rel_luminance(rgb):
    """Luminancia relativa WCAG (com linearizacao)."""
    lin = _to_lin(np.asarray(rgb, float) / 255)
    return float(lin[0] * 0.2126 + lin[1] * 0.7152 + lin[2] * 0.0722)


def contrast(c0, c1):
    """Razao de contraste WCAG 2.x entre duas cores (1..21)."""
    a = rel_luminance(hex_to_rgb(c0) if isinstance(c0, str) else c0)
    b = rel_luminance(hex_to_rgb(c1) if isinstance(c1, str) else c1)
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)


def wcag_grade(r):
    return "AAA" if r >= 7 else "AA" if r >= 4.5 else "AA-grande" if r >= 3 else "FALHA"


# ------------------------------------------------------------------ gradient-map
def gradient_map(img, palette, smooth=False):
    """Mapeia a luminancia de uma imagem (RGB/RGBA/L) para a paleta; alfa preservado.

    smooth=False -> tons discretos (N faixas iguais, como o filtro SVG 'discrete').
    smooth=True  -> interpola entre os tons (gradiente continuo).
    """
    pal = parse_palette(palette) if not isinstance(palette, np.ndarray) else palette
    im = img.convert("RGBA")
    arr = np.asarray(im)
    lum = luma(arr[..., :3])
    n = len(pal)
    if smooth:
        f = lum * (n - 1)
        i0 = np.clip(np.floor(f).astype(int), 0, n - 2)
        t = (f - i0)[..., None]
        rgb = pal[i0] * (1 - t) + pal[i0 + 1] * t
    else:
        idx = np.clip((lum * n).astype(int), 0, n - 1)
        rgb = pal[idx]
    out = np.dstack([np.round(rgb).astype(np.uint8), arr[..., 3]])
    return Image.fromarray(out, "RGBA")


# alias semantico: converter um PNG cinza (poucos tons) para a paleta
gray_to_palette = gradient_map


def svg_table_values(palette):
    """Tres strings (R,G,B) de tableValues 0..1 para feComponentTransfer discrete."""
    pal = parse_palette(palette)
    return [" ".join(f"{c / 255:.3f}" for c in pal[:, ch]) for ch in range(3)]


# ------------------------------------------------------------------ CLI
def _cli():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("presets", help="lista os presets (sombra -> luz)")
    r = sub.add_parser("ramp", help="rampa de N tons entre duas cores")
    r.add_argument("c0"); r.add_argument("c1")
    r.add_argument("-n", type=int, default=4)
    r.add_argument("--space", choices=["srgb", "linear"], default="srgb")
    m = sub.add_parser("map", help="gradient-map de uma imagem para uma paleta (alfa preservado)")
    m.add_argument("inp"); m.add_argument("out")
    m.add_argument("--palette", required=True, help='"#a,#b,..." ou nome de preset')
    m.add_argument("--smooth", action="store_true", help="interpola em vez de tons discretos")
    c = sub.add_parser("contrast", help="contraste WCAG entre duas cores")
    c.add_argument("c0"); c.add_argument("c1")
    s = sub.add_parser("svg-tones", help="imprime tableValues e a lista de hex para svg-tone-filter.js")
    s.add_argument("--preset"); s.add_argument("--palette")
    a = ap.parse_args()

    if a.cmd == "presets":
        for k, v in PRESETS.items():
            print(f"{k:12s} {','.join(v)}")
    elif a.cmd == "ramp":
        out = ramp(a.c0, a.c1, a.n, a.space)
        print(",".join(rgb_to_hex(c) for c in out))
    elif a.cmd == "map":
        gradient_map(Image.open(a.inp), a.palette, a.smooth).save(a.out)
        print("ok", a.out)
    elif a.cmd == "contrast":
        k = contrast(a.c0, a.c1)
        print(f"{k:.2f}:1  {wcag_grade(k)}")
    elif a.cmd == "svg-tones":
        spec = a.palette or a.preset
        if not spec:
            sys.exit("informe --preset ou --palette")
        pal = parse_palette(spec)
        print("hex:", ",".join(rgb_to_hex(c) for c in pal))
        for ch, tv in zip("RGB", svg_table_values(pal)):
            print(f"func{ch}: {tv}")


if __name__ == "__main__":
    _cli()
