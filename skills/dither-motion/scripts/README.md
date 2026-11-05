# scripts/ - índice

Tudo roda sem instalar nada (Python 3 com Pillow + numpy; Node 18+; Playwright e Chromium já em cache).
Caminhos abaixo relativos a `dither-motion/`. Sirva por HTTP: `node scripts/verify/serve.mjs . 8790`.

## python/

| Script | O que faz | Exemplo |
|--------|-----------|---------|
| `dither_image.py` | dither/halftone/hachura/pixel-art em PNG (bayer2/4/8, floyd, atkinson, halftone, hatch), paleta ou preset, alfa preservado | `python3 scripts/python/dither_image.py in.png out.png --algo bayer8 --preset pixel-azul --cell 4` |
| `dither_anim.py` | animações em dither como arquivo: `reveal`, `pixel-resolve`, `sweep`, `breathe` (loop), `wipe-overlay`; GIF, PNG-seq, WebM/MP4 (ffmpeg) | `python3 scripts/python/dither_anim.py reveal in.png -o out.gif --preset notas --fps 20 --duration 1.4` |
| `procedural_sticker.py` | ilustração em dither por código (moeda, pilha, cédula, cena) + adesivo/contorno/sombra em qualquer PNG | `python3 scripts/python/procedural_sticker.py scene out.png` / `... sticker in.png out.png --ring 12` |
| `palette_tools.py` | presets, rampas de N tons, gradient-map, contraste WCAG, tableValues para filtro SVG | `python3 scripts/python/palette_tools.py ramp "#0A1A7A" "#F5F7FF" -n 4` |
| `doodle_gen.py` | gera rabiscos SVG em `currentColor` (setas, riscos, círculos, asterisco, faísca, sublinhados) nos estilos brush/engrave/pixel | `python3 scripts/python/doodle_gen.py --style all --out ./doodles --seed 7 --contact` (`--list` mostra os nomes) |
| `make_sheet.py` | prancha de conferência: PNGs com alfa sobre azul, branco, escuro e xadrez | `python3 scripts/python/make_sheet.py a.png b.png -o prancha.png` |

## js/ (módulos ES, sem dependências)

| Módulo | O que faz | Uso rápido |
|--------|-----------|------------|
| `dither-gl.js` | motor WebGL Bayer: gradient-map, background, hatch, overlay, passthrough (nítido; `mosaic:true` pixeliza) | `new DitherGL(canvas).resize(320,320).setTexture(img).draw({mode:'gradient-map',px:3})` |
| `dither-canvas.js` | fundo Bayer 8x8 animado, sombra pontilhada, confete (Canvas 2D) | `createDitherBackground(canvas,{colors,cell:4,fps:12})` |
| `svg-tone-filter.js` | tinge imagem cinza por paleta via filtro SVG, troca ao vivo | `mountTone('tone',[...4 hex]); applyTone(img,'tone'); setTones('tone',[...])` |
| `doodle-mask.js` | "desenha" rabisco SVG por máscara + clip-path (suave ou em passos) | `drawDoodle(el,{src,color,steps:8,duration:700})` |
| `motion-helpers.js` | `spring`, `tween`, `flipSlots` (objetos migram entre slots), `loadMotion` (CDN opcional) | `await spring(v=>draw(v),{duration:.7,bounce:.2})` |

## verify/ (Node)

| Script | O que faz | Exemplo |
|--------|-----------|---------|
| `serve.mjs` | servidor estático robusto (keep-alive, MIME corretos, porta livre com `0`) | `node scripts/verify/serve.mjs . 0` |
| `shots.cjs` | prints em vários tamanhos com SwiftShader; lista erros de console/rede (exit 1) | `node scripts/verify/shots.cjs URL ./prints --sizes 390x844,1280x800 --wait 2500` |
| `check-layout.cjs` | botão primário na viewport, sem rolagem horizontal, alvos >=44px, fonte >=12px, texto não coberto (JSON, exit 1) | `node scripts/verify/check-layout.cjs URL --primary '[data-primary]' --sizes 360x640,390x844,1280x800` |
| `_browser.cjs` | helper interno (acha Playwright/Chromium em cache, flags de GPU) | usado pelos dois acima |

Fluxo típico: gerar assets com `python/`, montar a tela com `js/`, servir com `serve.mjs`, conferir com `shots.cjs` (olhar os PNGs) e `check-layout.cjs`.
