#!/usr/bin/env python3
"""procedural_sticker.py - ilustracao em dither feita por codigo + adesivo (contorno, recorte, sombra).

Tecnica (aprovada no trabalho do modal de recarga):
  1. desenhar cada forma como MASCARA (supersampling 2x -> bordas limpas);
  2. calcular uma LUMINANCIA por material (luz de cima a esquerda: caras claras, lados escuros);
  3. quantizar com Bayer 8x8 em celulas de `cell` px numa rampa de 4 tons (shade_bayer);
  4. linhas finas (filetes, guilhoche) em tom FORCADO, sem dither (flat);
  5. contorno de tinta de 3 px em volta de cada forma; adesivo branco (dilatacao do alfa) e
     sombra plana por fim.

Uso (CLI):
  python3 procedural_sticker.py coin   out.png [--ramp ouro] [--size 512] [--cell 4]
  python3 procedural_sticker.py stack  out.png [--n 5]
  python3 procedural_sticker.py bill   out.png [--ramp notas-note] [--field-ramp creme]
  python3 procedural_sticker.py scene  out.png            # cedula + pilha de moedas
  python3 procedural_sticker.py sticker in.png out.png [--ring 12] [--shadow-dy 8] [--ring-color "#FFFFFF"]
Como modulo: from procedural_sticker import Art, shade_bayer, ink_outline, sticker_outline, add_sticker
"""
import argparse
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from palette_tools import PRESETS, hex_to_rgb, parse_palette  # noqa: E402

INK = (11, 16, 51)  # #0B1033, tinta do contorno

# Rampas extras (sombra -> luz) especificas de notas/moedas; as demais vem de palette_tools.PRESETS.
RAMPS = dict(PRESETS)
RAMPS.update({
    "ouro": ["#8A5A00", "#E09A00", "#FFC21A", "#FFE79A"],
    "turquesa": ["#0E6B66", "#16A39A", "#2DD4BF", "#D9FFF7"],
    "roxo": ["#4C1D95", "#6D3FD6", "#8B5CF6", "#E4D8FF"],
    "creme": ["#BFB394", "#DCD2BA", "#F2ECDC", "#FAF6EA"],
})


# ------------------------------------------------------------------ Bayer
def bayer(n):
    m = np.array([[0]])
    while m.shape[0] < n:
        m = np.block([[4 * m, 4 * m + 2], [4 * m + 3, 4 * m + 1]])
    return m


_B8 = (bayer(8) + 0.5) / 64.0


def shade_bayer(luminance, ramp, cell=4, origin=(0, 0)):
    """Quantiza luminancia 0..1 (H,W) numa rampa (N,3) com Bayer 8x8 em celulas de `cell` px.

    Devolve uint8 (H,W,3). `origin` desloca a matriz para o padrao casar entre camadas
    (passe sempre a posicao global do recorte, ou use Art.paint que ja faz isso).
    """
    ramp = parse_palette(ramp) if not isinstance(ramp, np.ndarray) else ramp
    n = len(ramp)
    lum = np.clip(np.asarray(luminance, np.float32), 0, 1)
    h, w = lum.shape
    yy = (np.arange(h) + origin[1]) // cell % 8
    xx = (np.arange(w) + origin[0]) // cell % 8
    thr = _B8[yy[:, None], xx[None, :]]
    f = lum * (n - 1)
    base = np.floor(f)
    idx = np.clip(base + ((f - base) > thr), 0, n - 1).astype(int)
    return ramp[idx].astype(np.uint8)


# ------------------------------------------------------------------ mascaras
def dilate(mask, r):
    """Dilatacao circular de raio r (px) por somas acumuladas (rapida, sem scipy)."""
    if r <= 0:
        return mask.copy()
    h, wd = mask.shape
    pad = np.pad(mask.astype(np.int32), ((0, 0), (r, r)))
    cs = np.concatenate([np.zeros((h, 1), np.int32), np.cumsum(pad, axis=1)], axis=1)
    ar = np.arange(wd)
    cache = {}

    def row_span(w):
        if w not in cache:
            cache[w] = (cs[:, r + ar + w + 1] - cs[:, r + ar - w]) > 0
        return cache[w]

    out = np.zeros_like(mask)
    for dy in range(-r, r + 1):
        w = int(math.floor(math.sqrt(r * r - dy * dy) + 0.5))
        m = row_span(w)
        if dy > 0:
            out[dy:] |= m[: h - dy]
        elif dy < 0:
            out[:dy] |= m[-dy:]
        else:
            out |= m
    return out


def shift(mask, dx, dy):
    out = np.zeros_like(mask)
    h, w = mask.shape
    ys0, ys1, xs0, xs1 = max(0, dy), min(h, h + dy), max(0, dx), min(w, w + dx)
    out[ys0:ys1, xs0:xs1] = mask[ys0 - dy:ys1 - dy, xs0 - dx:xs1 - dx]
    return out


def ink_outline(mask, r=3):
    """Anel de contorno (so a borda externa) de raio r."""
    return dilate(mask, r) & ~mask


def sticker_outline(alpha_mask, r=12):
    """Adesivo: dilatacao do alfa por r px (inclui o objeto). Ring = resultado & ~alpha."""
    return dilate(alpha_mask, r)


def flat_shadow(mask, dy=8, dx=0):
    """Sombra plana: a silhueta deslocada, sem a parte coberta pelo proprio objeto."""
    return shift(mask, dx, dy) & ~mask


def add_sticker(im, ring=12, ring_color="#FFFFFF", shadow_dy=8, shadow_color="#001A9A", shadow_opacity=0.45, ink=0, ink_color=None):
    """Aplica contorno de tinta opcional + adesivo + sombra a QUALQUER PNG RGBA. Retorna PIL RGBA."""
    im = im.convert("RGBA")
    a = np.asarray(im)[..., 3] > 127
    body = im
    if ink:
        ic = hex_to_rgb(ink_color) if ink_color else INK
        ring_i = ink_outline(a, ink)
        lay = np.zeros(a.shape + (4,), np.uint8)
        lay[ring_i] = (*ic, 255)
        body = Image.alpha_composite(Image.fromarray(lay, "RGBA"), im)
        a = a | ring_i
    st = dilate(a, ring) if ring else a
    out = np.zeros(a.shape + (4,), np.uint8)
    if shadow_dy:
        sh = shift(st, 0, shadow_dy)
        out[sh] = (*hex_to_rgb(shadow_color), int(255 * shadow_opacity))
    if ring:
        out[st] = (*hex_to_rgb(ring_color), 255)
    res = Image.alpha_composite(Image.fromarray(out, "RGBA"), body)
    return res


# ------------------------------------------------------------------ canvas de pintura
class Art:
    """Tela quadrada size x size. paint() = sombrear com dither + contorno; flat() = tom forcado."""

    def __init__(self, size=512, cell=4, ink_r=3, ss=2):
        self.n, self.cell, self.ink_r, self.ss = size, cell, ink_r, ss
        self.rgb = np.zeros((size, size, 3), np.uint8)
        self.alpha = np.zeros((size, size), bool)
        self.Y, self.X = np.mgrid[0:size, 0:size].astype(np.float32)
        self.X += 0.5
        self.Y += 0.5

    # --- formas
    def poly(self, polys):
        im = Image.new("L", (self.n * self.ss, self.n * self.ss), 0)
        d = ImageDraw.Draw(im)
        for p in polys:
            d.polygon([(float(x) * self.ss, float(y) * self.ss) for x, y in p], fill=255)
        return np.asarray(im.resize((self.n, self.n), Image.BOX)) >= 128

    def lines(self, paths, width=2.0):
        im = Image.new("L", (self.n * self.ss, self.n * self.ss), 0)
        d = ImageDraw.Draw(im)
        for p in paths:
            d.line([(float(x) * self.ss, float(y) * self.ss) for x, y in p], fill=255, width=int(round(width * self.ss)), joint="curve")
        return np.asarray(im.resize((self.n, self.n), Image.BOX)) >= 110

    @staticmethod
    def ellipse_pts(cx, cy, rx, ry, k=120, rot=0.0):
        t = np.linspace(0, 2 * np.pi, k, endpoint=False)
        x, y = rx * np.cos(t), ry * np.sin(t)
        c, s = math.cos(rot), math.sin(rot)
        return np.stack([cx + x * c - y * s, cy + x * s + y * c], 1)

    @staticmethod
    def rrect_pts(x0, y0, x1, y1, rad, k=8):
        pts = []
        for cx, cy, a0 in ((x1 - rad, y0 + rad, -90), (x1 - rad, y1 - rad, 0), (x0 + rad, y1 - rad, 90), (x0 + rad, y0 + rad, 180)):
            for i in range(k + 1):
                a = math.radians(a0 + 90 * i / k)
                pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
        return pts

    # --- pintura
    def paint(self, mask, lum, ramp, ink=True):
        """Pinta `mask` sombreando com Bayer. lum: float ou funcao (X, Y) -> array (n,n) 0..1."""
        ramp = parse_palette(ramp) if not isinstance(ramp, np.ndarray) else ramp
        if ink and self.ink_r:
            ring = ink_outline(mask, self.ink_r)
            self.rgb[ring] = INK
            self.alpha |= ring
        L = lum(self.X, self.Y) if callable(lum) else np.full((self.n, self.n), lum, np.float32)
        shaded = shade_bayer(L, ramp, self.cell)  # origem global: padrao continuo entre camadas
        self.rgb[mask] = shaded[mask]
        self.alpha |= mask

    def flat(self, mask, color, only=None):
        """Tom forcado (sem dither) dentro de `mask` (opcionalmente so onde `only` e verdadeiro)."""
        m = mask & self.alpha
        if only is not None:
            m &= only
        self.rgb[m] = hex_to_rgb(color) if isinstance(color, str) else color

    def image(self):
        a = np.where(self.alpha, 255, 0).astype(np.uint8)
        return Image.fromarray(np.dstack([self.rgb, a]), "RGBA")

    def finish(self, ring=None, **kw):
        """Imagem final com adesivo branco + sombra (ring padrao = 3% do lado)."""
        return add_sticker(self.image(), ring=ring if ring is not None else max(4, round(self.n * 0.023)), **kw)


# ------------------------------------------------------------------ iluminacao
LX, LY = -0.6, -0.8  # luz vem de cima a esquerda


def _face_lum(u, v):
    r = np.hypot(u, v)
    d = (u * LX + v * LY) / np.maximum(r, 1e-4)
    out = 0.64 + 0.20 * (u * LX + v * LY)
    out = np.where(r < 0.28, out + 0.05, out)                          # miolo
    out = np.where((r >= 0.28) & (r < 0.36), 0.82 + 0.06 * d, out)     # aro interno claro
    out = np.where((r >= 0.58) & (r < 0.68), 0.60 - 0.24 * d, out)     # sulco
    out = np.where((r >= 0.68) & (r < 0.80), 0.84, out)                # plano
    out = np.where(r >= 0.80, 0.70 + 0.28 * d, out)                    # borda chanfrada
    return out.astype(np.float32)


def _ridge(p, k=22):
    return (np.sin(k * np.arcsin(np.clip(p, -0.999, 0.999))) > 0).astype(np.float32)


# ------------------------------------------------------------------ objetos prontos
def coin(art, cx, cy, rx, ry, thick, ramp):
    """Moeda deitada: lateral estriada + face com aros."""
    edge = art.poly([art.ellipse_pts(cx, cy + thick, rx, ry), [(cx - rx, cy), (cx + rx, cy), (cx + rx, cy + thick), (cx - rx, cy + thick)]])
    art.paint(edge, lambda X, Y: 0.50 - 0.30 * np.clip((X - cx) / rx, -1, 1) - 0.17 * _ridge(np.clip((X - cx) / rx, -1, 1)), ramp)
    face = art.poly([art.ellipse_pts(cx, cy, rx, ry)])
    art.paint(face, lambda X, Y: _face_lum((X - cx) / rx, (Y - cy) / ry), ramp)


def coin_stack(art, cx, cy, rx, ry, thick, n, ramp, jitter=4, seed=3):
    """Pilha de n moedas (a de baixo primeiro) com leve desalinho deterministico."""
    rng = np.random.RandomState(seed)
    for i in range(n):
        coin(art, cx + rng.uniform(-jitter, jitter), cy - i * thick, rx, ry, thick, ramp)


def bill(art, cx, cy, w, h, ramp, field_ramp, angle=0.0):
    """Cedula generica: fundo na rampa `ramp`, campo claro, moldura, guilhoche e medalhao oval."""
    c, s = math.cos(math.radians(angle)), math.sin(math.radians(angle))
    T = lambda pts: [(cx + x * c - y * s, cy + x * s + y * c) for x, y in pts]
    hw, hh = w / 2, h / 2
    m = h * 0.075
    ramp = parse_palette(ramp) if not isinstance(ramp, np.ndarray) else ramp
    field_ramp = parse_palette(field_ramp) if not isinstance(field_ramp, np.ndarray) else field_ramp
    local = lambda X, Y: ((X - cx) * c + (Y - cy) * s, -(X - cx) * s + (Y - cy) * c)

    outer = art.poly([T([(-hw, -hh), (hw, -hh), (hw, hh), (-hw, hh)])])
    art.paint(shift(outer, 0, 6), 0.10, ramp)  # espessura/sombra da borda inferior
    art.paint(outer, lambda X, Y: 0.40 - 0.10 * (local(X, Y)[0] / w + local(X, Y)[1] / h), ramp)
    inner = art.poly([T([(-hw + m, -hh + m), (hw - m, -hh + m), (hw - m, hh - m), (-hw + m, hh - m)])])
    art.paint(inner, lambda X, Y: 0.90 - 0.07 * (local(X, Y)[0] / w + local(X, Y)[1] / h), field_ramp, ink=False)
    # guilhoche (ondas finas, tom forcado)
    sp, lam = h * 0.058, w * 0.15
    xs = np.arange(-hw + m * 1.1, hw - m * 1.1 + 1, 3.0)
    waves = []
    for i in range(int((h - 3.2 * m) / sp)):
        yc = -hh + m * 1.8 + i * sp
        waves.append(T(np.stack([xs, yc + sp * 0.5 * np.sin(2 * np.pi * xs / lam + i * 0.9)], 1)))
    art.flat(art.lines(waves, 2.0), ramp[1].tolist(), only=inner)
    # moldura dupla
    i1 = 1.55 * m
    art.flat(art.lines([T([(-hw + i1, -hh + i1), (hw - i1, -hh + i1), (hw - i1, hh - i1), (-hw + i1, hh - i1), (-hw + i1, -hh + i1)])], 2.5), ramp[0].tolist(), only=inner)
    # medalhao oval concentrico
    for sx, sy, lm, rp, ink in ((0.215, 0.43, 0.92, field_ramp, False), (0.18, 0.36, 0.42, ramp, False), (0.145, 0.30, 0.94, field_ramp, False), (0.075, 0.15, 0.70, field_ramp, False)):
        art.paint(art.poly([art.ellipse_pts(cx, cy, w * sx, h * sy, rot=math.radians(angle))]), lm, rp, ink=ink)


# ------------------------------------------------------------------ cenas de exemplo
def _ramp(name):
    return parse_palette(RAMPS[name] if name in RAMPS else name)


def scene_coin(size, cell, ramp):
    a = Art(size, cell)
    coin(a, size * 0.5, size * 0.5, size * 0.30, size * 0.12, size * 0.055, _ramp(ramp))
    return a.finish()


def scene_stack(size, cell, ramp, n):
    a = Art(size, cell)
    coin_stack(a, size * 0.5, size * 0.72, size * 0.27, size * 0.105, size * 0.05, n, _ramp(ramp))
    return a.finish()


def scene_bill(size, cell, ramp, field):
    a = Art(size, cell)
    bill(a, size * 0.5, size * 0.5, size * 0.78, size * 0.40, _ramp(ramp), _ramp(field), angle=-8)
    return a.finish()


def scene_all(size, cell, ramp_coin, ramp_bill, field):
    a = Art(size, cell)
    bill(a, size * 0.42, size * 0.36, size * 0.62, size * 0.32, _ramp(ramp_bill), _ramp(field), angle=-10)
    coin_stack(a, size * 0.62, size * 0.80, size * 0.22, size * 0.085, size * 0.042, 5, _ramp(ramp_coin), seed=5)
    coin(a, size * 0.26, size * 0.80, size * 0.19, size * 0.075, size * 0.04, _ramp(ramp_coin))
    return a.finish()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=["coin", "stack", "bill", "scene", "sticker"])
    ap.add_argument("paths", nargs="+", help="coin|stack|bill|scene: out.png   sticker: in.png out.png")
    ap.add_argument("--size", type=int, default=512)
    ap.add_argument("--cell", type=int, default=4, help="px por celula do dither")
    ap.add_argument("--ramp", default=None, help="rampa (preset ou #a,#b,..): moeda (padrao ouro) ou cedula (padrao turquesa)")
    ap.add_argument("--field-ramp", default="creme")
    ap.add_argument("--n", type=int, default=5, help="moedas na pilha")
    ap.add_argument("--ring", type=int, default=12, help="espessura do adesivo (px)")
    ap.add_argument("--ring-color", default="#FFFFFF")
    ap.add_argument("--shadow-dy", type=int, default=8)
    ap.add_argument("--shadow-color", default="#001A9A")
    ap.add_argument("--ink", type=int, default=0, help="contorno de tinta em px antes do adesivo (sticker)")
    a = ap.parse_args()
    if a.cmd == "sticker":
        if len(a.paths) != 2:
            sys.exit("sticker precisa de in.png out.png")
        res = add_sticker(Image.open(a.paths[0]), a.ring, a.ring_color, a.shadow_dy, a.shadow_color, ink=a.ink)
        out = a.paths[1]
    else:
        out = a.paths[0]
        if a.cmd == "coin":
            res = scene_coin(a.size, a.cell, a.ramp or "ouro")
        elif a.cmd == "stack":
            res = scene_stack(a.size, a.cell, a.ramp or "ouro", a.n)
        elif a.cmd == "bill":
            res = scene_bill(a.size, a.cell, a.ramp or "turquesa", a.field_ramp)
        else:
            res = scene_all(a.size, a.cell, a.ramp or "ouro", "turquesa", a.field_ramp)
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    res.save(out)
    print("ok", out, res.size)


if __name__ == "__main__":
    main()
