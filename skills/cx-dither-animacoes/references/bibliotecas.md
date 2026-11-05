# Bibliotecas

Regra: a biblioteca mais barata que entrega o look. Muitas vezes e **nenhuma** (shader cru de ~120 linhas, ou Canvas 2D). Versoes abaixo sao as vistas no trabalho original (nov/2026) e **devem ser reverificadas** com `npm view <pkg> version` antes de pinar. Licencas: confirme no repositorio antes de embutir; linhas marcadas "verificar" nao foram conferidas.

## Tabela

| Biblioteca | Para que | Versao vista / pinar | Licenca | Quando usar | Prós | Contras |
|---|---|---|---|---|---|---|
| **Shader cru WebGL** | dither, gradient-map, hachura, transicao, pixel-resolve | n/a | n/a | 1 ou 2 efeitos; controle total | 0 dependencia, ~120 linhas, rapido | voce cuida do ciclo de vida (resize, DPR, pausa, perda de contexto) |
| **Canvas 2D** | fundos animados, confete, sombra pontilhada | n/a | n/a | fundo leve, sem GPU | roda em qualquer lugar | sem efeito por pixel em tela cheia a 60 fps |
| **Motion** (`motion`, `motion/react`) | molas, FLIP, layout, stagger, scroll | 12.23.12 no caso real; 14.9.0 vista no npm em 2026-11 (verificar) | MIT | morph entre passos, entrada em cascata, springs em CSS | API pequena, springs bons, `layoutId`, `reducedMotion` | `layoutId` distorce canvas; bundle (usar `motion/mini` ou `LazyMotion`) |
| **GSAP** | timelines complexas, ScrollTrigger, SVG morph | verificar | licenca propria do GSAP (verificar termos atuais antes de usar em produto comercial) | landing com sequencia longa e scroll | timelines e plugins maduros | licenca/plugins pagos (verificar), mais pesado que Motion |
| **Dither Kit** (Boring Software) | graficos de area/linha/barra em dither (canvas) | commit `1e7faee` (jul/2026), copiado como registro shadcn | MIT | grafico dithered em React; pode ser adaptado em React (Bayer 8x8, `Marker`, `replayOnData`) | graficos prontos, API de filhos | nao e dither de imagem; so graficos |
| **Paper Shaders** (`@paper-design/shaders-react`, `@paper-design/shaders`) | `Dithering`, `ImageDithering`, `HalftoneDots`, `HalftoneCmyk`, `GrainGradient`, `MeshGradient`, `ShaderMount` | 0.0.82 (verificar) | Apache-2.0 (verificar) | quer componentes prontos com resize/DPR/pausa | rapido de integrar; pausa fora da tela e aba oculta | exige **WebGL2** e lanca erro sem ele (usar error boundary); sem `resolve`/`dissolve` prontos |
| **three.js** (+ `@react-three/fiber`) | cena 3D real, halftone 3D, pos-processamento | 0.187.0 (verificar) | MIT | cena 3D de verdade | ecossistema enorme | pesado para filtro 2D; contexto extra |
| **ogl** | WebGL minimo, varias malhas | 1.0.11 (verificar) | verificar (Unlicense) | cena simples sem three | pequeno (~400 KB unpacked) | menos ecossistema |
| **regl** | WebGL funcional, shaders declarativos | verificar | MIT | muitos efeitos de shader sem boilerplate | API limpa | projeto menos ativo (verificar) |
| **twgl.js** | helpers finos sobre WebGL (uniforms, buffers) | verificar | MIT | quer encurtar o boilerplate sem framework | leve | so helpers |
| **PixiJS** | 2D WebGL com filtros, sprites | verificar | MIT | muitos sprites e filtros em 2D; jogos | filtros prontos, desempenho | peso; overkill para 1 efeito |
| **Pillow** | gerar/quantizar imagens, adesivos | verificar | HPND (verificar) | qualquer dither em imagem | simples, onipresente | loops puros sao lentos |
| **numpy** | vetorizar Bayer, mascaras, dilatacao | verificar | BSD-3 | sempre que usar Pillow para dither | rapido | difusao de erro nao vetoriza |
| **Playwright** | prints, verificacao, matriz de tamanhos | verificar | Apache-2.0 | provar que funciona | headless, SwiftShader para WebGL | precisa do Chromium certo (ver `verificacao.md`) |
| **ImageMagick** | dither/posterize/remap por linha de comando | verificar | licenca propria (verificar) | atalho para 1 imagem | `-ordered-dither o8x8`, `-remap` | sem controle fino de material |
| **ffmpeg** | GIF/video com `paletteuse=dither=bayer` | verificar | LGPL/GPL conforme build | exportar animacao em GIF/video | dither Bayer/Floyd/Atkinson nativos | so na etapa de exportacao |
| **flubber** | morph de contornos SVG | 0.4.2 (verificar) | MIT (verificar) | silhuetas muito diferentes | morph suave | perde detalhe interno; ~88 KB, carregar sob demanda |

## Como escolher

```
Preciso de...                                   -> Use
um fundo animado simples                        -> Canvas 2D (scripts/js/dither-canvas.js)
dither numa imagem com alfa, animado            -> shader cru (scripts/js/dither-gl.js) ou ImageDithering
varios efeitos prontos, sem escrever GLSL       -> Paper Shaders (WebGL2)
recolorir arte cinza por paleta                 -> filtro SVG (scripts/js/svg-tone-filter.js)
grafico em dither                               -> Dither Kit
molas e morph entre passos                      -> Motion
timeline longa com scroll                       -> GSAP (ver licenca)
cena 3D com halftone/dither de pos-processo     -> three.js
gerar sprite/adesivo/moeda por codigo           -> Pillow + numpy
```

## Sobre CDN
Para prototipos (um HTML autonomo), use ESM por CDN com **versao exata**: `https://cdn.jsdelivr.net/npm/motion@12.23.12/+esm`. Sempre com fallback (try/catch no `import()`) porque o CDN pode falhar. Em produto, instale o pacote e faca bundle.

## Referencias
- Motion: https://motion.dev/docs
- Paper Shaders: https://github.com/paper-design/shaders
- Dither Kit: https://github.com/Boring-Software-Inc/dither-kit
- three.js: https://threejs.org/docs
- ogl: https://github.com/oframe/ogl
- regl: https://github.com/regl-project/regl
- twgl: https://twgljs.org
- PixiJS: https://pixijs.com
- Pillow: https://pillow.readthedocs.io
- Playwright: https://playwright.dev
- ImageMagick `-ordered-dither`: https://imagemagick.org/script/command-line-options.php#ordered-dither
- ffmpeg `paletteuse`: https://ffmpeg.org/ffmpeg-filters.html#paletteuse
