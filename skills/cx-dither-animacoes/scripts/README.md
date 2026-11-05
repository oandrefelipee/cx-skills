# scripts/: ferramentas, páginas de teste e provas

Tudo em Node 22 (ESM, sem dependências) e Chromium do Playwright **já instalado**. Nada aqui instala pacote nem baixa binário.
Rode a partir desta pasta, com `export NODE_PATH=$(npm root -g)` (o `lib-browser.mjs` também procura o Playwright sozinho no `npm root -g`).
Textos e saídas em pt-BR. Capturas e relatórios de erro usam o **Chromium + SwiftShader** (WebGL por software): provam **correção**, não FPS de GPU real.

Cada linha da tabela diz o que é, o comando, a entrada, a saída esperada e **como foi provado** (todos os comandos foram executados em 2026-11-05).

| Script | Para que serve | Comando |
|---|---|---|
| `bayer.mjs` | matrizes de Bayer 2..32 em JSON, GLSL, JS, CSS, PNG, ASCII | `node bayer.mjs 8 --format glsl` |
| `blue-noise.mjs` | textura de ruído azul (void-and-cluster) | `node blue-noise.mjs 64 --out blue64.png` |
| `dither-image.mjs` | converte PNG em dither (Bayer, ruído azul, 8 difusões, paletas, k-means) | `node dither-image.mjs foto.png out.png --algo atkinson --palette gameboy --cell 2` |
| `frame-stability.mjs` | mede o "ferver" entre quadros por algoritmo | `node frame-stability.mjs` |
| `resolve-tokens.mjs` | resolve tokens CSS (var, color-mix, oklch, light-dark) em hex, claro e escuro | `node resolve-tokens.mjs pagina.html --vars=--c0,--c1 --schemes light,dark` |
| `capture.mjs` | capturas em larguras, temas, reduced-motion, relógio virtual, WebGPU | `node capture.mjs pagina.html --widths 390,1280 --fail-on-error` |
| `fps-probe.mjs` | cadência do rAF, p95/p99, CPU lenta | `node fps-probe.mjs pagina.html --seconds 5` |
| `shader-playground.html` | editor de fragment shader WebGL2 ao vivo com prelúdio de dither | abra no navegador (ou `capture.mjs shader-playground.html`) |
| `snippets/*.html` | o mesmo efeito em 12 técnicas (Canvas2D, WebGL2, WebGPU, ogl, regl, twgl, three, pixi, p5, Paper Shaders, SVG, CSS) | `node test-snippets.mjs` |
| `selftest.mjs` | autoteste de bayer, ruído azul, núcleos, imagem e GLSL | `node selftest.mjs --gl` |
| `test-playground.mjs` | 26 verificações do playground | `node test-playground.mjs` |
| `test-snippets.mjs` | roda cada snippet (claro e escuro) e confere cores, animação e reduced-motion | `node test-snippets.mjs` |
| `lib-browser.mjs`, `dither-core.mjs`, `png.mjs` | bibliotecas internas (Chromium, algoritmos, PNG sem dependência) | usadas pelos demais |

---

## bayer.mjs

- **Entrada:** `N` (2, 4, 8, 16 ou 32), `--format json|glsl|js|css|ascii|png`, `--out arquivo`, `--test`.
- **Saída esperada:** `node bayer.mjs 4 --format ascii` imprime
  `0 8 2 10 / 12 4 14 6 / 3 11 1 9 / 15 7 13 5`. `--format glsl` imprime a tabela `const float BAYER8[64]` e a função procedural `bayer8(vec2)`.
  `--format css` imprime a receita CSS (tile em `data:` + `mix-blend-mode: plus-lighter` + `filter: contrast(1000)`).
  `--format png --out b.png` grava `escreveu b.png (8x8)`.
- **Prova:** `node bayer.mjs --test` -> `42 verificações passaram` (soma, valores únicos, recursão = forma fechada, simetria, N não potência de 2 rejeitado).
  `node selftest.mjs --gl` renderiza o GLSL gerado em WebGL1 e WebGL2 (SwiftShader) e compara com a matriz: diferença máxima 0/255 (N = 4, 8, 16, 32).
  A receita CSS rodou no Chromium 153 (`snippets/css-only.html`): só preto e branco, 50,4% acesos num degradê.

## blue-noise.mjs

- **Entrada:** `N` (64 é o padrão útil), `--out arquivo.png | --format json`, `--seed`, `--sigma`, `--test`.
- **Saída esperada:** `escreveu bn64.png (64x64, seed 1, 120 ms)`; PNG cinza que repete sem emenda.
- **Prova:** `node blue-noise.mjs --test` -> 3 verificações (ranks são uma permutação de 0..N²-1; determinístico; energia em baixas frequências 0,2% da do ruído branco). Uso real em WebGL2 no preset "Ruído azul animado" do playground.

## dither-image.mjs

- **Entrada:** PNG (JPG, WebP, GIF e SVG por `--browser`, que usa o canvas do Chromium: **esse caminho não foi testado**), saída `.png`.
  Opções: `--algo bayer|bayer-n|blue-noise|threshold|random|floyd-steinberg|atkinson|jarvis|stucki|burkes|sierra|sierra2|sierra-lite`, `--size`, `--palette 1bit|gameboy|cga0|cga0-hi|cga1|cga1-hi|ega|apple2|pico8|mac|rgb8|gray:N|kmeans:N|"#hex,#hex"`,
  `--mode luma|rgb`, `--space linear|srgb`, `--cell N`, `--width`, `--serpentine`, `--contrast`, `--brightness`, `--invert`, `--spread`, `--seed`, `--no-upscale`.
  `--list` mostra algoritmos e paletas; `--make-test t.png` gera uma imagem de teste (rampa, esfera, listras, 8 degraus de cinza) sem precisar de arquivo.
- **Saída esperada:** `escreveu out.png: 512x320 (grade 256x160), algoritmo atkinson, 2 cores na paleta (2 usadas), 78 ms`.
- **Prova:** `selftest.mjs` (114 verificações): saída só tem cores da paleta; ordenado com cobertura = luminância; difusão preserva a média; núcleos somam o divisor; cell, serpentina, modo rgb, `kmeans:N` (determinístico).
  Resultados abertos e olhados em `proof/`: `bayer8-1bit.png`, `atkinson-1bit.png`, `fs-gameboy.png`, `bayer4-gray4.png`, `blue-1bit.png`, `bayer-cga.png`, `fs-pico8.png`, `kmeans4-fs.png` (entrada: `proof/teste.png`).
- **Para usar os tokens do seu projeto:** `--palette "$(node resolve-tokens.mjs pagina.html --vars=--c0,--c1,--c2,--c3 --schemes dark --format csv --quiet)"`.

## frame-stability.mjs

- **Entrada:** PNG opcional (padrão: imagem de teste 512x320), `--algos`, `--palette`, `--shift`, `--gain`.
- **Saída esperada:** tabela com a fração de pixels que mudam entre dois quadros: Bayer, ruído azul e ruído branco fixo ~1%; Floyd-Steinberg 24,6% (brilho +2%) e 28,6% (desloca 1 px); Atkinson 15,6% e 19,2%; Sierra2 24,4% e 26,9%.
- **Prova:** é a própria medição (determinística); números reproduzidos duas vezes. Base do argumento "animou, use ordenado" em `references/algoritmos.md` §9.

## resolve-tokens.mjs

- **Entrada:** página (arquivo ou URL), `--vars=--c0,--c1` (use o `=`: nomes começam com `--`) ou expressões de cor CSS (`color-mix(...)`, `oklch(...)`, `light-dark(...)`), `--schemes`, `--format table|csv|json`, `--quiet`, `--selector`.
- **Saída esperada (em `snippets/canvas2d.html`):**
  `--c0 #eef0fb #090a13 / --c1 #a9b7f0 #1f2c78 / --c2 #5a72d4 #5f79e8 / --c3 #1b2766 #f1ecd9` (claro e escuro); com `--schemes dark --format csv --quiet`: `#090a13,#1f2c78,#5f79e8,#f1ecd9`.
- **Prova:** valores batem com as cores que os snippets desenham (a contagem de cores do `test-snippets.mjs` usa a mesma técnica). `proof/tokens-dark.png` mostra a tabela no escuro.

## capture.mjs

- **Entrada:** arquivo ou URL; opções no cabeçalho do arquivo: `--widths`, `--schemes light,dark`, `--reduced-motion`, `--freeze MS`/`--times a,b` (relógio virtual), `--selector`, `--query`, `--eval`, `--wait-for`, `--webgpu`, `--gpu`, `--fail-on-error`.
- **Saída esperada:** lista dos PNGs gerados, `renderizador WebGL: ... SwiftShader ... (por software: prova correção, não desempenho de GPU)` e `console limpo: nenhum erro, aviso, exceção nem requisição falha.`
  Com erro: lista cada console error, exceção e requisição falha; com `--fail-on-error` sai com código 1.
- **Prova:** usado nas capturas de `proof/playground-presets.png` (4 presets, claro e escuro, `--query "preset=N&panel=0&t=3&mouse=0.62,0.4"`) e em `snippets/webgpu.html --webgpu`. Relógio virtual: `--freeze` fixa `performance.now`, `Date.now` e o timestamp do rAF (bom para animações de tempo absoluto como o playground; não serve para animações que somam `dt`).

## fps-probe.mjs

- **Entrada:** arquivo ou URL, `--seconds`, `--warmup`, `--width/--height`, `--dpr`, `--cpu-throttle X`, `--query`, `--wait-for`, `--webgpu`, `--json`.
- **Saída esperada:** `renderizador: ... <- POR SOFTWARE (CPU)`, `quadros: 119 em 2 s`, `FPS médio: 60`, `tempo/quadro: média 16.67 ms | mediana | p95 | p99 | máx`, `quadros lentos: ...` e o aviso de SwiftShader.
- **Prova:** rodado no playground e em `snippets/webgpu.html`. **Limite:** mede a cadência do rAF (travada em 60 Hz no headless), não os quadros desenhados; use o número só para comparar variantes e achar regressão.

## shader-playground.html

- **O que é:** arquivo único, WebGL2. Prelúdio com `uRes`, `uTime`, `uMouse`, `uCell`, `uFrame`, `uTemporal`, `uC0..uC3`, `uBlue` e funções `bayer8`, `blueNoise`, `ign`, `pick`, `ditherTone4`, `cellId`, `cellCenter`, `rot`, `hash21`.
  4 presets: "Campo de ondas Bayer", "Halftone rotacionado" (resolução cheia), "SDF esfera 3D com dither", "Ruído azul animado". Editor com recompilação ao vivo e **mapeamento de erro para a linha do seu código**, amostras dos tokens, seletor de tema e controle de célula.
  Parâmetros de URL: `preset`, `cell`, `t` (congela o tempo), `panel=0`, `theme=dark|light`, `mouse=x,y` (trava o ponteiro).
  Pausa com aba oculta, fora da tela e com `prefers-reduced-motion` (quadro fixo).
- **Prova:** `node test-playground.mjs` -> `26 verificações passaram` (cores só dos tokens nos dois temas, shader novo aceito, erro apontando a linha, pausa, reduced-motion, 360 px sem rolagem horizontal, console limpo). Presets vistos em `proof/playground-presets.png` (linha de cima claro, de baixo escuro).

## snippets/ e test-snippets.mjs

12 páginas independentes que desenham o mesmo efeito (campo de ondas, 4 tons nos tokens `--c0..--c3`, Bayer 8x8), todas com `window.__ready`, pausa em aba oculta e quadro parado em reduced-motion:

`canvas2d`, `webgl2-puro`, `webgpu`, `ogl` (**1.0.11** via jsDelivr `+esm`), `regl` (2.1.1), `twgl` (7.0.0), `three-postprocessing` (0.186.1), `pixi-filter` (8.22.0), `p5` (2.3.4), `paper-shaders` (0.0.82), `svg-filter`, `css-only`.
As bibliotecas vêm do CDN: **precisa de rede**.

- **Comando:** `node test-snippets.mjs` (todos, claro e escuro), `node test-snippets.mjs snippets/ogl.html`, `--out DIR` guarda as capturas, `--sheet arq.png --sheet-scheme light|dark` gera a folha de contato.
- **Saída esperada:** uma linha por snippet e tema (`OK ... 4 cores, 100.0% nos tokens [...] | anima | reduced-motion: parado`) e `24/24 combinações (snippet x tema) passaram.`
  O teste confere: pronto (`__ready`), nenhum erro de console/exceção/rede, **100% dos pixels nas cores dos tokens** (2 cores preto/branco nos snippets de 1 bit), que anima onde deve e que fica parado com reduced-motion.
- **Prova:** 24/24; folhas de contato com os 12 snippets em `proof/snippets-claro.png` e `proof/snippets-escuro.png` (ordem: canvas2d, css-only, ogl, p5, paper-shaders, pixi-filter, regl, svg-filter, three-postprocessing, twgl, webgl2-puro, webgpu).
- **Bugs que o teste achou e corrigi:** `pixi-filter` não ligava (faltava `precision highp float;` no fragment); `ogl` ficava em 160x90 (o OGL escreve o tamanho inline: precisou de `!important`); WebGPU só com `--enable-unsafe-webgpu` mostrava o adaptador mas falhava no `submit`.
- **Tolerância:** quadros estáticos de CSS/SVG oscilam em ~0,05% dos pixels (os que caem exatamente no limiar do corte); o teste aceita até 0,2% de diferença.

## selftest.mjs e test-playground.mjs

- `node selftest.mjs` (sem Chromium) e `node selftest.mjs --gl` (compara o GLSL gerado com a matriz em WebGL1/WebGL2): `114 verificações passaram, 0 falharam.`
- `node test-playground.mjs`: `26 verificações passaram, 0 falharam.`

## proof/

| Arquivo | O que prova |
|---|---|
| `teste.png` | imagem de teste (rampa, esfera, listras, degraus) |
| `bayer8-1bit.png`, `blue-1bit.png`, `atkinson-1bit.png` | ordenado, ruído azul e difusão em 1 bit |
| `bayer4-gray4.png`, `bayer-cga.png`, `fs-gameboy.png`, `fs-pico8.png`, `kmeans4-fs.png` | vários tons e paletas retrô, k-means |
| `tokens-dark.png` | `resolve-tokens.mjs` no escuro |
| `playground-presets.png` | 4 presets do playground, claro (em cima) e escuro (embaixo) |
| `snippets-claro.png`, `snippets-escuro.png` | os 12 snippets lado a lado |

## Comandos externos (testados à parte; ver `references/stack-e-libs.md` §8)

```bash
convert foto.png -colorspace Gray -ordered-dither o4x4 out.png              # ImageMagick 6.9.12-98
ffmpeg -i in.mp4 -vf "fps=12,scale=160:-1:flags=neighbor,split[a][b];[a]palettegen=max_colors=4[p];[b][p]paletteuse=dither=bayer:bayer_scale=3" out.gif    # ffmpeg 6.1.1
```

---

## Pegadinhas que custaram tempo (vale para quem for usar os scripts)

1. **O Chromium headless dispara um `pointermove` falso em (0,0).** Páginas que reagem ao ponteiro "giram" sozinhas na captura. O playground ignora esse evento e aceita `?mouse=x,y` para travar o ponteiro. Em páginas suas, ignore `pointermove` sem movimento real ou trave o ponteiro por parâmetro.
2. **A ferramenta de leitura de imagens rejeita alguns PNGs** (os do Playwright e os de paleta do ImageMagick). Para **olhar** uma captura, converta: `convert x.png -strip -define png:color-type=6 x-ver.png` (RGBA) ou JPEG. Os PNGs deste pacote já estão em RGBA.
3. **`background-blend-mode: plus-lighter` não funciona; `mix-blend-mode: plus-lighter` sim** (Chromium 153). Safari e Firefox não testados.
4. **SwiftShader limita o que se prova:** correção sim, FPS não. WebGPU precisa de `--enable-unsafe-webgpu --enable-features=Vulkan --use-vulkan=swiftshader --disable-vulkan-surface` (já em `lib-browser.mjs`; flag `--webgpu`).
5. **`--vars` do `resolve-tokens.mjs` precisa do `=`** (`--vars=--c0,--c1`), senão o parser trata `--c0` como outra opção.
6. **`ogl` não tem UMD:** use `https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm`. O OGL escreve `width`/`height` inline no canvas: `!important` no CSS.
7. **Rede montada em `/mnt/project-files/`:** use barra final nos diretórios e releia o arquivo uns 10 s depois de escrever, antes de editar algo que outro agente também edita.
8. **Nada aqui foi provado em GPU real, celular, Safari ou Firefox.**
