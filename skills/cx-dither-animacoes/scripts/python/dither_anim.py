#!/usr/bin/env python3
"""dither_anim.py - animacoes em dither como ARQUIVO: GIF, sequencia de PNG e WebM/MP4 (se houver ffmpeg).

Modos:
  reveal         dissolve Bayer: a imagem (ja em dither) aparece celula a celula, t de 0 a 1.
  pixel-resolve  a imagem "se resolve": celulas grandes (32 -> 16 -> 8 -> 4 px, potencias de 2).
  sweep          varredura diagonal com borda pontilhada (esquerda/cima -> direita/baixo).
  breathe        fundo Bayer que respira em LOOP perfeito (nao precisa de imagem; use --size).
  wipe-overlay   uma cobertura Bayer cobre a tela e depois revela (t 0 -> 1 -> 0), sobre a imagem.

Exemplos:
  python3 dither_anim.py reveal  in.png -o reveal.gif --preset pixel-azul --cell 4 --fps 20 --duration 1.4
  python3 dither_anim.py pixel-resolve in.png -o resolve.gif --preset notas --from-px 32 --cell 4
  python3 dither_anim.py sweep   in.png -o sweep.gif --palette "#0A1A7A,#7BE8FF,#F5F7FF,#FFE24A" --loop 1
  python3 dither_anim.py breathe -o bg.gif --size 320x180 --preset cobalto-3 --cell 4 --fps 12 --duration 4
  python3 dither_anim.py wipe-overlay in.png -o wipe.gif --overlay-colors "#0C27B4,#7BE8FF" --bg "#1235E6"
  # tudo de uma vez: GIF + sequencia de PNG + WebM (com alfa) + MP4 (precisa de ffmpeg no PATH)
  python3 dither_anim.py reveal in.png -o out/reveal.gif --png-seq out/frames --video out/reveal.webm --video out/reveal.mp4

Saidas:
  -o X.gif           GIF (paleta exata, indice transparente quando ha alfa; sem quantizacao).
  --png-seq DIR      frame_0000.png... (RGBA, com alfa).
  --video X.webm|mp4 requer `ffmpeg` (WebM VP9 mantem o alfa; MP4 H.264 achata o alfa sobre --bg
                     ou preto). Sem ffmpeg, o script avisa e continua com GIF/PNG.
Parametros: --fps (20), --duration em s (1.5), --hold fim parado em s (0.4; modos nao-loop),
  --loop N (0 = infinito, padrao; 1 = toca uma vez; N = N execucoes), --ease linear|out|inout (out),
  --cell (4), --scale, --palette/--preset (sombra -> luz), --bg transparent|#hex (transparent).
Fundo transparente: no GIF o alfa e 1 bit (pixel-art nitida, ok); use WebM/PNG para alfa suave.
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dither_image import bayer_threshold, dither_image  # noqa: E402
from palette_tools import PRESETS, hex_to_rgb, parse_palette  # noqa: E402

MODES = ["reveal", "pixel-resolve", "sweep", "breathe", "wipe-overlay"]


# ------------------------------------------------------------------ easing / tempo
def ease(name, t):
    t = np.clip(t, 0.0, 1.0)
    if name == "out":
        return 1 - (1 - t) ** 3
    if name == "inout":
        return np.where(t < 0.5, 4 * t ** 3, 1 - (-2 * t + 2) ** 3 / 2)
    return t


def timeline(fps, duration, hold, loop_mode):
    """Lista de t (0..1) por frame. Modos nao-loop seguram o ultimo quadro `hold` s."""
    n = max(2, int(round(fps * duration)))
    ts = [i / (n - 1) for i in range(n)]
    ts += [1.0] * (int(round(fps * hold)) if not loop_mode else 0)
    return ts


# ------------------------------------------------------------------ grades por celula
def cell_maps(h, w, cell):
    """thr (0..1, Bayer 8x8 por celula) e diag (0..1, diagonal) em resolucao cheia."""
    gh, gw = -(-h // cell), -(-w // cell)
    thr_g = bayer_threshold((gh, gw), 8)
    yy, xx = np.mgrid[0:gh, 0:gw].astype(np.float32)
    diag_g = (xx + 0.5) / gw * 0.55 + (yy + 0.5) / gh * 0.45
    up = lambda a: np.repeat(np.repeat(a, cell, 0), cell, 1)[:h, :w]
    return up(thr_g), up(diag_g)


def over_bg(rgba, bg):
    """Achata RGBA sobre uma cor opaca (bg=None mantem o alfa)."""
    if bg is None:
        return rgba
    a = rgba[..., 3:4].astype(np.float32) / 255
    rgb = rgba[..., :3] * a + np.array(bg, np.float32) * (1 - a)
    return np.dstack([np.round(rgb).astype(np.uint8), np.full(rgba.shape[:2], 255, np.uint8)])


# ------------------------------------------------------------------ modos (cada um devolve lista de RGBA)
def frames_reveal(base, ts, cell, ease_n, bg, sweep=False):
    h, w = base.shape[:2]
    thr, diag = cell_maps(h, w, cell)
    out = []
    for t in ts:
        e = float(ease(ease_n, t))
        if sweep:  # frente diagonal com borda dithered de ~20% de largura
            vis = (diag * 0.8 + thr * 0.2) < e
        else:
            vis = thr < e + (1e-6 if e >= 1 else 0)
        f = base.copy()
        f[..., 3] = np.where(vis, base[..., 3], 0)
        out.append(over_bg(f, bg))
    return out


def frames_pixel_resolve(im, pal, ts, cell, from_px, ease_n, bg, kw):
    ladder, p = [], max(cell, from_px)
    while p > cell:
        ladder.append(p)
        p //= 2
    ladder.append(cell)  # termina exatamente em `cell`
    cache = {}
    out = []
    for t in ts:
        e = float(ease(ease_n, t))
        step = min(len(ladder) - 1, int(e * len(ladder)))
        if t >= 1:
            step = len(ladder) - 1
        px = ladder[step]
        if px not in cache:
            cache[px] = np.asarray(dither_image(im, "bayer8", pal, px, **kw))
        out.append(over_bg(cache[px], bg))
    return out


def frames_breathe(size, pal, ts, cell, bg):
    """Fundo que respira; ts em [0,1) = fase do ciclo: o ultimo quadro volta ao primeiro (loop perfeito)."""
    w, h = size
    gh, gw = -(-h // cell), -(-w // cell)
    thr = bayer_threshold((gh, gw), 8)
    yy, xx = np.mgrid[0:gh, 0:gw].astype(np.float32)
    u, v = xx / gw, yy / gh
    asp = gw / gh
    n = len(pal)
    out = []
    for t in ts:
        ph = 2 * np.pi * t
        fx, fy = 0.5 + 0.28 * np.sin(ph), 0.5 + 0.22 * np.cos(ph)
        d = np.hypot((u - fx) * asp * 0.5, (v - fy) * 0.9)
        l = np.clip(np.maximum(0, 1 - d * 1.35) + 0.12 * np.sin(u * 6 + ph) * np.sin(v * 5 - ph), 0, 1)
        f = l * (n - 1)
        base = np.floor(f)
        idx = np.clip(base + ((f - base) > thr), 0, n - 1).astype(int)
        rgb = pal[idx]
        rgb = np.repeat(np.repeat(rgb, cell, 0), cell, 1)[:h, :w]
        out.append(np.dstack([rgb, np.full((h, w), 255, np.uint8)]))
    return out


def frames_wipe(base, ts, cell, ease_n, oc, bg):
    """Cobre (t 0->1) e revela (1->0) com overlay Bayer; borda de 1 degrau na cor oc[1]."""
    h, w = base.shape[:2]
    thr, diag = cell_maps(h, w, cell)
    out = []
    for t in ts:
        tri = 1 - abs(2 * float(ease(ease_n, t)) - 1) if t < 1 else 0.0  # 0 -> 1 -> 0
        v = tri * 1.25 - diag * 0.25
        cov = thr < v
        edge = cov & ~(thr < v - 0.06)
        f = base.copy()
        f[cov] = (*oc[0], 255)
        f[edge] = (*oc[1], 255)
        out.append(over_bg(f, bg))
    return out


# ------------------------------------------------------------------ saida
def save_gif(frames, path, fps, loop):
    """GIF com paleta EXATA (cores discretas do dither); alfa < 128 -> indice transparente."""
    stack = np.stack(frames)  # (n,h,w,4)
    opaque = stack[..., 3] >= 128
    rgb = stack[..., :3].astype(np.uint32)
    packed = (rgb[..., 0] << 16) | (rgb[..., 1] << 8) | rgb[..., 2]
    uniq = np.unique(packed[opaque]) if opaque.any() else np.array([0], np.uint32)
    has_t = (~opaque).any()
    if len(uniq) > (255 if has_t else 256):
        print("aviso: mais de 255 cores; GIF vai quantizar (use --palette com poucos tons).", file=sys.stderr)
        ims = [Image.fromarray(f, "RGBA").convert("P", palette=Image.ADAPTIVE, colors=255) for f in frames]
        tr = None
    else:
        pal = np.zeros((256, 3), np.uint8)
        pal[:len(uniq)] = np.stack([(uniq >> 16) & 255, (uniq >> 8) & 255, uniq & 255], 1)
        tr = len(uniq) if has_t else None
        flat = pal.reshape(-1).tolist()
        ims = []
        for i in range(len(frames)):
            idx = np.searchsorted(uniq, packed[i]).clip(0, len(uniq) - 1).astype(np.uint8)
            if tr is not None:
                idx = np.where(opaque[i], idx, tr).astype(np.uint8)
            im = Image.fromarray(idx, "P")
            im.putpalette(flat)
            ims.append(im)
    kw = dict(save_all=True, append_images=ims[1:], duration=int(round(1000 / fps)), disposal=2, optimize=False)
    # GIF: ausencia da extensao NETSCAPE = toca uma vez; valor 0 = infinito; N>0 = N repeticoes extras
    if loop == 0:
        kw["loop"] = 0
    elif loop > 1:
        kw["loop"] = loop - 1
    if tr is not None:
        kw["transparency"] = tr
    ims[0].save(path, **kw)


def save_png_seq(frames, d):
    os.makedirs(d, exist_ok=True)
    for i, f in enumerate(frames):
        Image.fromarray(f, "RGBA").save(os.path.join(d, f"frame_{i:04d}.png"))
    return d


def save_video(frames, path, fps, bg):
    ff = shutil.which("ffmpeg")
    if not ff:
        print(f"aviso: ffmpeg nao encontrado no PATH; pulando {path}. (GIF/PNG foram gerados normalmente.)", file=sys.stderr)
        return False
    ext = os.path.splitext(path)[1].lower()
    with tempfile.TemporaryDirectory() as tmp:
        save_png_seq(frames, tmp)
        src = ["-framerate", str(fps), "-i", os.path.join(tmp, "frame_%04d.png")]
        if ext == ".webm":
            cmd = [ff, "-y", "-loglevel", "error", *src, "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-auto-alt-ref", "0", "-b:v", "0", "-crf", "30", path]
        elif ext == ".mp4":
            vf = "pad=ceil(iw/2)*2:ceil(ih/2)*2"  # H.264 exige dimensoes pares; sem alfa (achatado sobre o fundo)
            if bg is None:
                vf = "format=rgba,colorchannelmixer=aa=1," + vf  # alfa -> preto
            cmd = [ff, "-y", "-loglevel", "error", *src, "-vf", vf, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path]
        else:
            print(f"aviso: extensao de video nao suportada: {ext} (use .webm ou .mp4)", file=sys.stderr)
            return False
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            print("aviso: ffmpeg falhou:", r.stderr.strip()[:300], file=sys.stderr)
            return False
    return True


# ------------------------------------------------------------------ main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", choices=MODES)
    ap.add_argument("inp", nargs="?", help="PNG de entrada (obrigatorio, exceto em breathe; opcional em wipe-overlay)")
    ap.add_argument("-o", "--out", help="arquivo .gif de saida")
    ap.add_argument("--png-seq", metavar="DIR", help="grava frame_0000.png... em DIR")
    ap.add_argument("--video", action="append", default=[], metavar="ARQ", help=".webm ou .mp4 (repetivel; requer ffmpeg)")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--palette", help='"#a,#b,..." sombra -> luz')
    g.add_argument("--preset", choices=sorted(PRESETS))
    ap.add_argument("--cell", type=int, default=4)
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--fps", type=float, default=20)
    ap.add_argument("--duration", type=float, default=1.5)
    ap.add_argument("--hold", type=float, default=0.4, help="segundos parado no fim (nao-loop)")
    ap.add_argument("--loop", type=int, default=0, help="execucoes do GIF: 0 = infinito, 1 = uma vez, N = N vezes")
    ap.add_argument("--ease", choices=["linear", "out", "inout"], default="out")
    ap.add_argument("--bg", default="transparent", help="transparent (padrao) ou #hex opaco")
    ap.add_argument("--from-px", type=int, default=32, help="pixel-resolve: celula inicial (potencia de 2)")
    ap.add_argument("--size", default="320x180", help="breathe: LxA em px")
    ap.add_argument("--overlay-colors", help='wipe-overlay: "#cobre,#borda" (padrao: 2 primeiras da paleta)')
    ap.add_argument("--gamma", type=float, default=1.0)
    a = ap.parse_args()

    if not (a.out or a.png_seq or a.video):
        ap.error("informe pelo menos -o X.gif, --png-seq DIR ou --video X.webm")
    if a.mode not in ("breathe", "wipe-overlay") and not a.inp:
        ap.error(f"o modo {a.mode} precisa de uma imagem de entrada")
    pal_spec = a.palette or a.preset or "pixel-azul"
    pal = parse_palette(pal_spec)
    bg = None if a.bg == "transparent" else hex_to_rgb(a.bg)
    loop_mode = a.mode == "breathe"

    if a.mode == "breathe":
        w, h = (int(x) for x in a.size.lower().split("x"))
        n = max(2, int(round(a.fps * a.duration)))
        frames = frames_breathe((w, h), pal, [i / n for i in range(n)], a.cell, bg)  # [0,1): ultimo quadro encosta no primeiro
    else:
        ts = timeline(a.fps, a.duration, a.hold, False)
        kw = dict(scale=a.scale, gamma=a.gamma)
        if a.inp:
            im = Image.open(a.inp).convert("RGBA")
            base = np.asarray(dither_image(im, "bayer8", pal, a.cell, **kw))
        else:  # wipe-overlay sem imagem: base transparente 320x180
            w, h = (int(x) for x in a.size.lower().split("x"))
            base = np.zeros((h, w, 4), np.uint8)
            im = None
        if a.mode == "reveal":
            frames = frames_reveal(base, ts, a.cell, a.ease, bg)
        elif a.mode == "sweep":
            frames = frames_reveal(base, ts, a.cell, a.ease, bg, sweep=True)
        elif a.mode == "pixel-resolve":
            frames = frames_pixel_resolve(im, pal_spec, ts, a.cell, a.from_px, a.ease, bg, kw)
        else:
            oc = [hex_to_rgb(c) for c in a.overlay_colors.split(",")] if a.overlay_colors else [tuple(pal[0]), tuple(pal[1])]
            tsw = timeline(a.fps, a.duration, a.hold, False)
            frames = frames_wipe(base, tsw, a.cell, a.ease, oc, bg)

    h, w = frames[0].shape[:2]
    msgs = []
    if a.out:
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        save_gif(frames, a.out, a.fps, a.loop)
        msgs.append(a.out)
    if a.png_seq:
        msgs.append(save_png_seq(frames, a.png_seq) + "/frame_*.png")
    for v in a.video:
        os.makedirs(os.path.dirname(os.path.abspath(v)), exist_ok=True)
        if save_video(frames, v, a.fps, bg):
            msgs.append(v)
    print(f"ok {a.mode}: {len(frames)} quadros {w}x{h} @ {a.fps:g}fps -> " + ", ".join(msgs))


if __name__ == "__main__":
    main()
