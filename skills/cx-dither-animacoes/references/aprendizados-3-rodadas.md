# Aprendizados (resumo curado)

Resumo do que foi feito, testado e aprovado/rejeitado no trabalho original (rodadas 3 a 5 do modal da primeira recarga). Fonte completa: `skill-dither/_fontes/APRENDIZADOS-DO-CHAT.md`. Os caminhos do codigo real sao relativos a `.codex-objetos-modal/` (abreviado `CO/`). Tudo aqui e "caso real": serve de exemplo, nao de regra do dominio.

## 1. Gosto como dado de design
Chapado, azul eletrico dominante, pixel-art de 1 bit, adesivo, dither so em algumas coisas, relevo de botao que afunda. Rejeitou brilho 3D, neon, bloom, glow, pastel, cromado, bordas finas, texto demais, dither em tudo. **Dither e tempero.**

## 2. Tecnicas que funcionaram (onde esta o codigo)

| # | Tecnica | Onde | Referencia na skill |
|---|---|---|---|
| 1 | Bayer 8x8 em GLSL, 5 modos (gradient-map, fundo, hachura, transicao, passa-direto) | `CO/rodada3/mockups/d3-cobalto-pixel.html` (classe `Dither`, `VS`, `FS`) | `webgl-shader.md` |
| 2 | Celula em unidades de TELA: `px = cell*DPR/escala` | `drawObj` no mesmo arquivo | `webgl-shader.md` secao 5 |
| 3 | Entrada em dissolve Bayer (`reveal`) e pixel-resolve (px 24 -> 4 em potencias de 2) | idem | `webgl-shader.md` secao 7, `animacao.md` |
| 4 | Premultiplicado com mipmap; NEAREST sem mipmap para pixel-art | classe `Dither.texture` | `webgl-shader.md` secao 6 |
| 5 | Fundo animado Canvas 2D (Bayer, 12-15 fps, 3 tons, pausa em aba oculta/reduced-motion) | `CO/rodada4/build_r5g.py`, `build_r5h.py` (`paintDz`) | `canvas2d.md` |
| 6 | Sombra pontilhada, marcador pontilhado, brilho que varre, confete 4x4 | `build_r5g.py` (`marker_svg`, `tile`, particulas) | `canvas2d.md` |
| 7 | Tingir cinza de 4 tons por filtro SVG (`feColorMatrix` + `feComponentTransfer discrete`) | `CO/rodada4/build.py` (`tone_filter`) | `svg-css.md` |
| 8 | Ilustracao por codigo (Pillow): supersampling 2x, luz por material, Bayer 8x8 em celulas de 4 px, rampas de 4 tons, linhas em tom forcado, contorno 3 px, adesivo 12 px, sombra plana | `CO/rodada4/tools/money_dither.py`, `extras_dither.py` | `python-imagem.md` |
| 9 | Pixel-art nativa (128x128, pixel = 8x8) validada por script | rodada 4/5 | `python-imagem.md` secao 6 |
| 10 | Gravura por hachura (modo 2) | shader do item 1 | `algoritmos.md` secao 6 |
| 11 | Rabiscos como mascara CSS + `clip-path` | `CO/rodada3/gerar-rabiscos.py`, `build.py` (`.dd`) | `svg-css.md` secao 2 |
| 12 | Dither Kit adaptado (graficos), `DitherField` (fundo "Mare Bayer"), `DitherSpark` | `packages/ui/src/dither/*`, `docs/design/dither.md` (branch `origin/claude/project-thread-wg8oue`) | `bibliotecas.md` |

## 3. Animacao e movimento que funcionaram
Motion (spring) com fallback rAF; FLIP por slots; transicoes em overlay de dither, pagina que vira, moeda que gira, tudo em `steps()`; rabiscos que se desenham; hover com mola ou pixelizando; parallax por lerp so com ponteiro fino; flutuacao em wrapper separado; marquee de micro-texto; respeitar reduced-motion, pausar fora de vista, fundo a 12-15 fps. Detalhe: `animacao.md`.

## 4. Armadilhas
HTTP, nao `file://`; servidor Node em vez de `python -m http.server`; SwiftShader no headless; print de meio de transicao nao funciona; `executablePath` do Playwright; `fill-mode: both` mata hover; dither sobre texto; texto < 12 px; contraste; ordem dos tons; IA nao respeita hex nem grade. Tabela: `armadilhas.md`.

## 5. Verificacao
Verificador Playwright por mockup: varios tamanhos, passos, cliques, erros de console, rolagem horizontal, botao na viewport, alvos >= 44 px, texto coberto, fontes < 12 px; matriz 360x640, 375x667, 390x844, 412x915, 430x932 + 1280x800; **olhar as imagens de verdade**; prancha comparativa sobre azul, branco e tingido. Detalhe: `verificacao.md`.

## 6. Bibliotecas e referencias
`motion` 12.23.12 (jsDelivr ESM); Google Fonts (Bricolage Grotesque, Geist, Geist Mono, Instrument Serif, Fraunces); Dither Kit (MIT); Paper Shaders (`Dithering`, WebGL2); three.js/ogl/regl; Pillow + numpy; Playwright. Referencias: Higgsfield, Duolingo, Craft, Headroom, Mobbin/Inspo. Detalhe: `bibliotecas.md`, `estilos-e-referencias.md`.

## 7. Padroes de entrega
Prancha/galeria navegavel; versoes multiplas salvas e catalogadas (nada se apaga); explicar o que ficou duvidoso; perguntas uma por vez, com ASCII/tabela antes e a opcao recomendada primeiro; subagentes reaproveitados, em paralelo, com criterio de aceite verificavel.

## 8. Liçoes de processo (curtas)
- Gere uma versao pequena e olhe antes de animar.
- A primeira versao de uma paleta raramente e a melhor: gere A/B/C.
- "Quase funciona" quase sempre e HTTP, DPR, celula errada ou premultiplicado.
- Valide arte de IA por script, nunca por olho.
- Se o usuario rejeitou uma tecnica como visual, mantenha-a no kit (pode servir de detalhe), mas nao a ofereca como padrao.
