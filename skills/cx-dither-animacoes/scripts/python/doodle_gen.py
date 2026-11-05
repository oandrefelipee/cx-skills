#!/usr/bin/env python3
"""doodle_gen.py - gerador de rabiscos SVG (setas, riscos, circulos, asterisco, faisca, sublinhados).

Todos os SVG saem em `currentColor` (colorem por CSS) e prontos para doodle-mask.js
(mask CSS + clip-path). Generalizado de rodada3/gerar-rabiscos.py; so stdlib.

Estilos:
  brush    pincel: contorno preenchido de largura variavel (afina nas pontas), borda irregular.
  engrave  gravura: fio duplo oco + riscas de hachura transversais (estilo nota de banco).
  pixel    pixel-art: grade logica (celula 10 u), blocos nitidos (`shape-rendering:crispEdges`),
           ideal com steps(N) e image-rendering:pixelated.

Exemplos:
  python3 doodle_gen.py --list
  python3 doodle_gen.py --style brush --out ./doodles --seed 7
  python3 doodle_gen.py --style all --out ./doodles --only seta-curva,sublinhado-onda --contact
  python3 doodle_gen.py --style pixel --out ./d --weight 1.2

Opcoes:
  --style brush|engrave|pixel|all   (padrao: all; cada estilo vai para <out>/<estilo>/NOME.svg)
  --out DIR     (padrao ./doodles)        --seed N   semente (mesmo seed = mesmos SVGs)
  --only a,b    so esses desenhos         --list     lista os nomes e sai
  --weight K    multiplica a espessura do traco (1 = padrao)
  --contact     escreve <out>/index.html com a prancha de conferencia (mascara CSS; sirva por HTTP)
"""
import argparse
import math
import os
import random
import sys


# ------------------------------------------------------------------ geometria
def bez(p0, c1, c2, p1, n=40):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        pts.append((u**3 * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t**3 * p1[0],
                    u**3 * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t**3 * p1[1]))
    return pts


def chain(segs, n=40):
    pts = []
    for s in segs:
        b = bez(*s, n=n)
        pts += b if not pts else b[1:]
    return pts


def tangent_end(pts, back=3):
    a, b = pts[-1 - back], pts[-1]
    d = math.hypot(b[0] - a[0], b[1] - a[1]) or 1
    return ((b[0] - a[0]) / d, (b[1] - a[1]) / d)


def head(pts, size=22, spread=0.55, rnd=None):
    """Duas hastes da ponta de seta."""
    tx, ty = tangent_end(pts)
    tip = pts[-1]
    out = []
    for sgn in (1, -1):
        a = math.atan2(-ty, -tx) + sgn * spread
        L = size * (0.92 + (rnd.random() * 0.16 if rnd else 0))
        out.append([(tip[0] + L * math.cos(a), tip[1] + L * math.sin(a)), tip])
    return out


def dense(pts, step=2.0):
    """Reamostra por comprimento de arco."""
    L = [0]
    for a, b in zip(pts, pts[1:]):
        L.append(L[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    tot = L[-1]
    if tot == 0:
        return pts
    n = max(2, int(tot / step))
    out, j = [], 0
    for i in range(n + 1):
        s = tot * i / n
        while j < len(L) - 2 and L[j + 1] < s:
            j += 1
        seg = (L[j + 1] - L[j]) or 1
        t = (s - L[j]) / seg
        out.append((pts[j][0] + (pts[j + 1][0] - pts[j][0]) * t, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * t))
    return out


def ellipse(cx, cy, rx, ry, a0, turns, rnd, wob=0.06, spiral=0.0, rot=0.0, n=90):
    pts = []
    ph = [rnd.random() * 6.28 for _ in range(3)]
    for i in range(n + 1):
        t = i / n
        a = a0 + t * turns * 2 * math.pi
        k = 1 + wob * math.sin(a * 2 + ph[0]) + wob * 0.6 * math.sin(a * 3 + ph[1]) + spiral * t
        x, y = rx * k * math.cos(a), ry * k * math.sin(a)
        pts.append((cx + x * math.cos(rot) - y * math.sin(rot), cy + x * math.sin(rot) + y * math.cos(rot)))
    return pts


def wobble(pts, rnd, amp=1.2, freq=3):
    ph = [rnd.random() * 6.28 for _ in range(2)]
    out = []
    for i, p in enumerate(pts):
        t = i / max(1, len(pts) - 1)
        out.append((p[0] + amp * math.sin(t * freq * 6.28 + ph[0]), p[1] + amp * math.cos(t * freq * 5.1 + ph[1])))
    return out


# ------------------------------------------------------------------ catalogo de desenhos
# nome -> (largura, altura, [tracos], base_brush?, celula_pixel?)  (os 2 ultimos so nas variantes largas)
def shapes(rnd):
    S = {}

    def arrow(name, w, h, segs, size=22, spread=0.55, n=36):
        p = chain(segs, n)
        S[name] = (w, h, [p] + head(p, size, spread, rnd))

    arrow("seta-curva", 200, 140, [((14, 118), (30, 30), (120, 0), (176, 56))])
    arrow("seta-reta", 200, 140, [((12, 74), (70, 66), (120, 76), (182, 68))], size=24)
    arrow("seta-laco", 200, 140, [((12, 112), (70, 120), (112, 110), (112, 76)),
                                  ((112, 76), (110, 34), (60, 34), (66, 66)),
                                  ((66, 66), (72, 98), (130, 92), (184, 38))], size=24)
    arrow("seta-baixo", 140, 200, [((60, 12), (100, 50), (34, 92), (70, 184))], size=24)
    arrow("seta-direita", 200, 140, [((12, 96), (50, 40), (104, 128), (184, 64))], size=24)
    arrow("seta-curva-baixo", 200, 200, [((16, 22), (110, 6), (184, 56), (160, 176))], size=26, spread=0.5)
    # riscos / sublinhados
    S["risco-reto"] = (220, 40, [wobble(dense(chain([((10, 22), (70, 14), (150, 26), (210, 16))])), rnd, 0.9, 2)])
    S["risco-duplo"] = (220, 50, [chain([((10, 16), (80, 10), (150, 18), (208, 12))]),
                                  chain([((24, 34), (90, 30), (160, 38), (200, 31))])])
    S["risco-onda"] = (220, 44, [chain([((10, 24), (34, 4), (52, 42), (78, 22)), ((78, 22), (100, 2), (118, 42), (144, 22)),
                                        ((144, 22), (166, 4), (184, 40), (210, 18))], 24)])
    xs = [14, 40, 66, 92, 118, 144, 170, 204]
    S["risco-zigue"] = (220, 44, [wobble(dense([(x, 8 if i % 2 == 0 else 36) for i, x in enumerate(xs)], 2), rnd, 0.8, 3)])
    # variantes LARGAS (esticam sobre texto): (w,h,tracos,base_brush,celula_pixel)
    S["sublinhado-reto"] = (300, 26, [wobble(dense(chain([((8, 15), (90, 9), (200, 17), (292, 10))]), 2), rnd, 0.8, 2)], 5.2, 7)
    S["sublinhado-onda"] = (300, 30, [chain([((8, 16), (34, 2), (52, 30), (80, 15)), ((80, 15), (106, 1), (124, 29), (152, 15)),
                                            ((152, 15), (178, 2), (196, 29), (224, 15)), ((224, 15), (250, 3), (270, 26), (292, 12))], 22)], 5.2, 7)
    S["circulo-largo"] = (260, 80, [ellipse(130, 40, 118, 29, -2.5, 1.1, rnd, 0.04, spiral=0.05, rot=-0.03)], 5.4, 8)
    # circulos
    S["circulo-aberto"] = (160, 110, [ellipse(80, 55, 66, 40, -2.4, 1.12, rnd, 0.05, spiral=0.06, rot=-0.08)])
    S["circulo-duplo"] = (160, 110, [ellipse(80, 55, 64, 38, -2.0, 1.0, rnd, 0.05, rot=-0.06),
                                     ellipse(82, 56, 70, 42, -2.7, 1.08, rnd, 0.06, spiral=-0.05, rot=0.05)])
    # asterisco e faisca
    ast = []
    for k in range(3):
        a = k * math.pi / 3 + 0.15
        r = 38 + rnd.random() * 3
        ast.append(wobble([(60 - r * math.cos(a), 60 - r * math.sin(a)), (60 + r * math.cos(a), 60 + r * math.sin(a))], rnd, 0.8, 1))
    S["asterisco"] = (120, 120, [dense(p, 2) for p in ast])
    S["faisca"] = (120, 120, [chain([((60, 8), (62, 38), (80, 56), (112, 60))], 18), chain([((112, 60), (82, 64), (62, 82), (60, 112))], 18),
                              chain([((60, 112), (58, 84), (40, 66), (8, 60))], 18), chain([((8, 60), (38, 56), (58, 38), (60, 8))], 18)])
    return S


# ------------------------------------------------------------------ renderizadores
def smooth_noise(rnd, n=6, amp=0.25):
    v = [1 + (rnd.random() * 2 - 1) * amp for _ in range(n)]

    def f(t):
        x = t * (n - 1)
        i = min(n - 2, int(x))
        u = x - i
        u = u * u * (3 - 2 * u)
        return v[i] * (1 - u) + v[i + 1] * u
    return f


def ribbon(pts, base, rnd, jag=0.45, taper=(0.18, 0.22), noise_amp=0.25):
    """Contorno fechado de largura variavel (afina nas duas pontas)."""
    pts = dense(pts, 1.6)
    n = len(pts)
    nz = smooth_noise(rnd, 7, noise_amp)
    L, R = [], []
    for i, p in enumerate(pts):
        a, b = pts[max(0, i - 1)], pts[min(n - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        d = math.hypot(dx, dy) or 1
        nx, ny = -dy / d, dx / d
        t = i / (n - 1)
        w = base * nz(t)
        if t < taper[0]:
            w *= 0.25 + 0.75 * (t / taper[0]) ** 0.7
        if t > 1 - taper[1]:
            w *= 0.15 + 0.85 * ((1 - t) / taper[1]) ** 0.8
        wl, wr = w / 2 + (rnd.random() - 0.5) * jag, w / 2 + (rnd.random() - 0.5) * jag
        L.append((p[0] + nx * wl, p[1] + ny * wl))
        R.append((p[0] - nx * wr, p[1] - ny * wr))
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in L + R[::-1]) + "Z"


def svg_wrap(w, h, body, extra=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" '
            f'fill="currentColor" {extra}>{body}</svg>\n')


def render_brush(shape, rnd, weight=1.0):
    w, h, strokes = shape[:3]
    base = 6.5 * weight
    if len(shape) > 3:
        base = shape[3] * base / 8
    paths = [ribbon(s, base * (0.85 if i and len(strokes) > 1 and len(s) < 6 else 1), rnd, 0.5) for i, s in enumerate(strokes)]
    return svg_wrap(w, h, f'<path d="{" ".join(paths)}"/>')


def render_engrave(shape, rnd, weight=1.0):
    """Fio duplo oco + hachura transversal a cada ~9 u."""
    w, h, strokes = shape[:3]
    out = []
    for s in strokes:
        d = dense(s, 1.8)
        n = len(d)
        top, bot = [], []
        for i, p in enumerate(d):
            a, b = d[max(0, i - 1)], d[min(n - 1, i + 1)]
            dx, dy = b[0] - a[0], b[1] - a[1]
            k = math.hypot(dx, dy) or 1
            nx, ny = -dy / k, dx / k
            t = i / (n - 1)
            e = min(1, t / 0.14, (1 - t) / 0.2) ** 0.8
            o = 3.4 * e * weight
            top.append((p[0] + nx * o, p[1] + ny * o))
            bot.append((p[0] - nx * o, p[1] - ny * o))
        for line in (top, bot):
            out.append("M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in line))
        for i in range(4, n - 4, 5):
            p, a, b = d[i], d[i - 1], d[i + 1]
            dx, dy = b[0] - a[0], b[1] - a[1]
            k = math.hypot(dx, dy) or 1
            nx, ny, tx, ty = -dy / k, dx / k, dx / k, dy / k
            t = i / (n - 1)
            o = 3.0 * min(1, t / 0.14, (1 - t) / 0.2) ** 0.8 * weight
            if o < 1:
                continue
            out.append(f"M{p[0]+nx*o-tx*1.2:.1f} {p[1]+ny*o-ty*1.2:.1f} L{p[0]-nx*o+tx*1.2:.1f} {p[1]-ny*o+ty*1.2:.1f}")
    body = f'<path d="{" ".join(out)}" fill="none" stroke="currentColor" stroke-width="{1.45 * weight:.2f}" stroke-linecap="round" stroke-linejoin="round"/>'
    return svg_wrap(w, h, body)


def render_pixel(shape, rnd, weight=1.0, cell=10):
    w, h, strokes = shape[:3]
    if len(shape) > 4:
        cell = shape[4]
    thick = max(1, round(weight))
    gw, gh = int(w / cell), int(h / cell)
    on = set()
    for s in strokes:
        for x, y in dense(s, cell / 2):
            cx, cy = int(x / cell), int(y / cell)
            for dx in range(thick):
                for dy in range(thick):
                    if 0 <= cx + dx < gw and 0 <= cy + dy < gh:
                        on.add((cx + dx, cy + dy))
    path = []
    for y in range(gh):  # junta pixels contiguos da linha em um retangulo
        x = 0
        while x < gw:
            if (x, y) in on:
                x0 = x
                while x < gw and (x, y) in on:
                    x += 1
                path.append(f"M{x0} {y}h{x-x0}v1h-{x-x0}z")
            else:
                x += 1
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {gw} {gh}" width="{gw*8}" height="{gh*8}" '
            f'fill="currentColor" shape-rendering="crispEdges"><path d="{"".join(path)}"/></svg>\n')


RENDER = {"brush": render_brush, "engrave": render_engrave, "pixel": render_pixel}


def contact_html(out, styles, names):
    css = ("body{margin:0;font:12px system-ui;background:#1235E6;color:#F5F7FF}section{padding:14px 20px}h2{font:700 14px system-ui;margin:0 0 8px}"
           ".g{display:flex;flex-wrap:wrap;gap:14px;padding:16px;background:#0C27B4}.c{display:grid;gap:4px;justify-items:center}"
           ".m{display:block;background:#FFE24A;-webkit-mask:var(--u) center/contain no-repeat;mask:var(--u) center/contain no-repeat;height:84px}")
    wh = {"seta": 110, "risc": 190, "circ": 120, "aste": 84, "fais": 84, "subl": 260}
    parts = [f"<!doctype html><meta charset=utf-8><title>Rabiscos</title><style>{css}</style>"]
    for st in styles:
        parts.append(f'<section><h2>{st}</h2><div class="g">')
        for n in names:
            w = wh.get(n[:4], 110)
            if n == "seta-baixo":
                w = 60
            if n == "circulo-largo":
                w = 200
            parts.append(f'<div class="c"><i class="m" style="--u:url({st}/{n}.svg);width:{w}px"></i><span>{n}</span></div>')
        parts.append("</div></section>")
    with open(os.path.join(out, "index.html"), "w") as f:
        f.write("".join(parts))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--style", choices=["brush", "engrave", "pixel", "all"], default="all")
    ap.add_argument("--out", default="./doodles")
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--only", help="lista de nomes separada por virgula")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--weight", type=float, default=1.0)
    ap.add_argument("--contact", action="store_true")
    a = ap.parse_args()

    names = list(shapes(random.Random(0)))
    if a.list:
        print("\n".join(names))
        return
    if a.only:
        want = [n.strip() for n in a.only.split(",") if n.strip()]
        bad = [n for n in want if n not in names]
        if bad:
            sys.exit("nomes desconhecidos: " + ", ".join(bad) + " (veja --list)")
        names = want
    styles = list(RENDER) if a.style == "all" else [a.style]
    total = 0
    for st in styles:
        os.makedirs(os.path.join(a.out, st), exist_ok=True)
        rnd = random.Random(a.seed + sum(map(ord, st)))  # estilo fixa a semente: reproduzivel
        S = shapes(rnd)
        for n in names:
            with open(os.path.join(a.out, st, n + ".svg"), "w") as f:
                f.write(RENDER[st](S[n], rnd, a.weight))
            total += 1
    if a.contact:
        contact_html(a.out, styles, names)
    print(f"ok {total} SVGs em {a.out} ({', '.join(styles)})" + (" + index.html" if a.contact else ""))


if __name__ == "__main__":
    main()
