# Stack e bibliotecas para dither e animação

Pesquisa feita em **2026-11-05**. Versões fixadas = a mais nova publicada há **pelo menos 14 dias** (corte 2026-10-22; datas do registro npm).
Cada snippet citado está em `scripts/snippets/` e foi executado em Chromium 153 + SwiftShader pelo `scripts/test-snippets.mjs`
(24 combinações snippet x tema passaram: 12 snippets, claro e escuro). O que **não** foi provado está marcado com "não verificado".
Tamanhos: arquivo baixado do jsDelivr e comprimido com `gzip -9` (na rede real o brotli costuma ser menor).

## Índice

1. [Tabela-resumo](#1-tabela-resumo)
2. [Sem biblioteca: Canvas2D, WebGL2, WebGPU](#2-sem-biblioteca-canvas2d-webgl2-webgpu)
3. [Camadas finas sobre WebGL: ogl, regl, twgl.js](#3-camadas-finas-sobre-webgl-ogl-regl-twgljs)
4. [Cena 3D: three.js e pós-processamento](#4-cena-3d-threejs-e-pós-processamento)
5. [pixi.js, p5.js, Paper Shaders, runners estilo Shadertoy](#5-pixijs-p5js-paper-shaders-runners-estilo-shadertoy)
6. [Sem JS: filtros SVG e CSS puro](#6-sem-js-filtros-svg-e-css-puro)
7. [Bibliotecas de dither de imagem](#7-bibliotecas-de-dither-de-imagem)
8. [Ferramentas externas: ImageMagick, ffmpeg, Aseprite, Dither Me This](#8-ferramentas-externas)
9. [React, SSR e ciclo de vida](#9-react-ssr-e-ciclo-de-vida)
10. [Guia "quero X, use Y"](#10-guia-quero-x-use-y)
11. [O que não foi verificado](#11-o-que-não-foi-verificado)

---

## 1. Tabela-resumo

| Opção | Versão fixada | gzip | Curva | Licença | Anima? | Use quando |
|---|---|---|---|---|---|---|
| Canvas2D | nativo | 0 | baixa | n/a | sim (CPU) | grade pequena (até ~320x180), sem shader, fácil de depurar |
| **WebGL2 puro** | nativo (97,13% dos usuários, caniuse 2026-11-05) | 0 | média | n/a | sim (GPU) | **padrão da skill**: um fragment shader de tela cheia |
| WebGPU | nativo (Chrome/Edge 113+, Safari 26, Firefox 141+ no Windows) | 0 | alta | n/a | sim (GPU) | só se já precisa de compute; sempre com plano B WebGL2 |
| ogl | 1.0.11 (2025-01-27) | 39 kB | média | Unlicense | sim | vários efeitos/malhas leves, sem o peso do three |
| regl | 2.1.1 (2024-11-12) | 28 kB | média | MIT | sim | estilo funcional, vários passes, pouco código |
| twgl.js | 7.0.0 (2025-07-16) | 29 kB (min) | baixa | MIT | sim | só tirar o boilerplate do WebGL2 |
| three.js | 0.186.1 (2026-09-24) | ~194 kB (core + módulo) | média/alta | MIT | sim | há cena 3D/modelo/material real |
| pmndrs `postprocessing` | 6.39.5 (2026-09-09) | 157 kB (+ three) | alta | Zlib | sim | pilha de efeitos já em three |
| pixi.js | 8.22.0 (2026-10-01) | 237 kB | média | MIT | sim | cena 2D com sprites/filtros |
| p5.js | 2.3.4 (2026-09-25) | 284 kB | baixa | **LGPL-2.1** | sim (CPU) | protótipo, ensino, pixel a pixel rápido de escrever |
| Paper Shaders | 0.0.82 (2026-10-21) | 64 kB (+esm) | **muito baixa** | Apache-2.0 | sim | fundo dither pronto com 2 cores, sem escrever shader |
| Filtro SVG | nativo | 0 | média | n/a | estático (ou animado por JS) | grão de 1 bit sobre qualquer elemento, sem JS |
| CSS puro | nativo | 0 | média | n/a | estático | Bayer/halftone 1 bit em cinza, sem JS |

Regra: **comece pelo WebGL2 puro** (um arquivo, zero dependências, controle total). Só suba para uma biblioteca quando ela der algo que você
não quer reescrever (malha 3D, sprites, texto, pós-processamento encadeado).

Custos medidos no sandbox (Node 22, só CPU): o laço Canvas2D do snippet (campo de senos + Bayer 8x8 + 4 tons) leva **0,5 ms** a 160x90, **1,9 ms** a 320x180,
**8,6 ms** a 640x360 e **35 ms** a 1280x720 por quadro (tabela 8x8; a fórmula por bits custa de 4% a 25% a mais), sem contar o `putImageData`. Por isso a regra de
"1 pixel por célula, CSS amplia" importa: 160x90 cabe com folga em 60 fps em CPU; a tela cheia em Canvas2D, não. Depende da CPU de quem roda.

---

## 2. Sem biblioteca: Canvas2D, WebGL2, WebGPU

### Canvas2D

- Instalar: nada. Snippet testado: `scripts/snippets/canvas2d.html`.
- Núcleo (o resto é o token e o `bayer`):

```js
const c = document.querySelector('canvas'), ctx = c.getContext('2d'), img = ctx.createImageData(c.width, c.height);
const tones = [0, 1, 2, 3].map((i) => token(`--c${i}`));            // [r,g,b] 0..255 dos tokens do tema
function draw(t) {
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    const f = field(x / c.width, y / c.height, t);                  // luminância 0..1 (sua função)
    const q = Math.min(3, Math.floor(f * 3 + bayer(x & 7, y & 7))); // algoritmos.md §3
    img.data.set([...tones[q], 255], (y * c.width + x) * 4);
  }
  ctx.putImageData(img, 0, 0);                                      // CSS: image-rendering: pixelated para ampliar
}
```

- Use quando: grade pequena, conteúdo desenhado com a API 2D (texto, formas) e dithering por cima, ou imagens (via `getImageData`).
- **Não use** para tela cheia animada a 60 fps (ver custos acima) nem quando o efeito já é um campo matemático (vira shader).

### WebGL2 puro (um triângulo + fragment shader)

- Instalar: nada. Snippet testado: `scripts/snippets/webgl2-puro.html`; editor ao vivo: `scripts/shader-playground.html`.
- Núcleo:

```js
const gl = canvas.getContext('webgl2', { antialias: false });
const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o);
  if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(o)); return o; };
const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
gl.linkProgram(pr); gl.useProgram(pr);                              // VS: um triângulo [-1,-1, 3,-1, -1,3] cobre a tela
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
[0, 1, 2, 3].forEach((i) => gl.uniform3fv(gl.getUniformLocation(pr, 'uC' + i), token('--c' + i)));   // 0..1
gl.uniform2f(gl.getUniformLocation(pr, 'uRes'), canvas.width, canvas.height);
const draw = (t) => { gl.uniform1f(gl.getUniformLocation(pr, 'uTime'), t); gl.drawArrays(gl.TRIANGLES, 0, 3); };
```

- Vantagens: zero dependência, o mesmo fragment cabe em ogl/regl/twgl/Shadertoy com ajustes mínimos, SSR irrelevante (só roda no cliente).
- **Não use** se precisa de malhas com materiais, cenas com muitos objetos ou texto: use três ou pixi.
- Contexto WebGL: não crie dezenas de canvases; navegadores limitam contextos ativos e perdem os mais antigos (relatado; **não medi**). Um canvas grande ou
  poucos pequenos, e trate `webglcontextlost`.

### WebGPU: estado e suporte

- **Suporte (consultado 2026-11-05):** Chrome/Edge 113+ em Windows, macOS e ChromeOS; Android 12+ no Chrome 121+; Linux só com Intel Gen12+ (Chrome 144) e
  NVIDIA com Wayland (147), outros atrás de flag; Firefox 141 no Windows e 145 no macOS Tahoe ARM64, Linux/Android ainda não por padrão; **Safari 26** (macOS Tahoe,
  iOS e iPadOS 26) ligado por padrão. Fontes: web.dev (25/11/2025) e a página "Implementation Status" do gpuweb. caniuse mostra o Safari 26 como suporte parcial.
- Em resumo: existe nos quatro motores, mas **a cobertura de plataformas ainda tem furos** (Linux, Android fora de ARM/Qualcomm/Intel, Firefox fora do Windows/macOS ARM).
- Snippet testado: `scripts/snippets/webgpu.html` (WGSL, mesmo efeito de 4 tons + Bayer 8x8, com `<p>` de plano B quando `navigator.gpu` não existe).
  No Chromium headless sem GPU, funciona com `--enable-unsafe-webgpu --enable-features=Vulkan --use-vulkan=swiftshader --disable-vulkan-surface`
  (já embutido em `lib-browser.mjs`; use `--webgpu` em `capture.mjs` e `fps-probe.mjs`). **Só** `--enable-unsafe-webgpu` mostra o adaptador mas falha no `submit`.
- Núcleo (WGSL; coordenada de fragmento com origem no canto **superior** esquerdo, diferente do GLSL):

```js
const adapter = await navigator.gpu?.requestAdapter();            // null/undefined = sem WebGPU: caia para WebGL2
const device = await adapter.requestDevice(), ctx = canvas.getContext('webgpu'), format = navigator.gpu.getPreferredCanvasFormat();
ctx.configure({ device, format, alphaMode: 'opaque' });
const module = device.createShaderModule({ code: WGSL });          // @vertex vs (triângulo) + @fragment fs; uniforms em var<uniform>
const pipeline = device.createRenderPipeline({ layout: 'auto', vertex: { module, entryPoint: 'vs' },
  fragment: { module, entryPoint: 'fs', targets: [{ format }] }, primitive: { topology: 'triangle-list' } });
const ubo = device.createBuffer({ size: 80, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
const bind = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: ubo } }] });
// por quadro: device.queue.writeBuffer(ubo, 0, dados); encoder -> beginRenderPass(view: ctx.getCurrentTexture().createView()) -> draw(3) -> submit
```

- **Não use** como padrão: para um fragment shader de tela cheia, WebGPU não traz nada que o WebGL2 não faça, exige contexto seguro (https/localhost) e tem menos
  cobertura. Vale para compute (partículas em milhões, simulações), ou se o resto do app já está em WebGPU (three `WebGPURenderer`).
- Ordem de grandeza de cobertura: WebGL2 97,13%; para WebGPU não há número equivalente consultado: **não verificado**.

---

## 3. Camadas finas sobre WebGL: ogl, regl, twgl.js

Os três tiram o boilerplate e deixam você escrever o shader. Todos testados com o mesmo efeito (campo de ondas + Bayer 8x8 + 4 tokens).

### ogl

- Instalar: **não há build UMD no pacote** (o `dist/ogl.umd.js` do jsDelivr devolve 404); use o ESM do jsDelivr: `import { Renderer, Program, Mesh, Triangle } from 'https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm'`. Em bundler: `npm i ogl@1.0.11`.
- 134 kB raw, **39 kB gzip**; Unlicense. Snippet: `scripts/snippets/ogl.html`.
- Pegadinha achada no teste: o OGL escreve `width`/`height` em **px inline** no canvas (`setSize`); a regra CSS de ampliação precisa de `!important`.

```js
const renderer = new Renderer({ canvas, width: 160, height: 90, dpr: 1, antialias: false });
const gl = renderer.gl;
const program = new Program(gl, { vertex: VS, fragment: FS,
  uniforms: { uRes: { value: [160, 90] }, uTime: { value: 0 }, uC0: { value: token('--c0') }, uC1: { value: token('--c1') }, uC2: { value: token('--c2') }, uC3: { value: token('--c3') } } });
const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
requestAnimationFrame(function loop(ms) { program.uniforms.uTime.value = ms / 1000; renderer.render({ scene: mesh }); requestAnimationFrame(loop); });
```

- Use quando: quer câmera/malha leve + shaders próprios sem carregar três. **Não use** se precisa de ecossistema (loaders, controles, pós-processamento): three.

### regl

- Instalar: `<script src="https://cdn.jsdelivr.net/npm/regl@2.1.1/dist/regl.min.js"></script>` (global `createREGL`). MIT, 86 kB raw, **28 kB gzip**. Snippet: `regl.html`.

```js
const regl = createREGL({ canvas, attributes: { antialias: false } });
const draw = regl({ vert: VS, frag: FS, attributes: { p: [[-1, -1], [3, -1], [-1, 3]] }, count: 3,
  uniforms: { uRes: (ctx) => [ctx.viewportWidth, ctx.viewportHeight], uTime: regl.prop('t'), uC0: token('--c0'), uC1: token('--c1'), uC2: token('--c2'), uC3: token('--c3') } });
regl.frame(({ time }) => draw({ t: time }));
```

- Use quando: vários passes/framebuffers com API declarativa. **Não use** se quer WebGL2: o README não menciona WebGL2 e o snippet roda em GLSL ES 1.00 (não confirmei suporte a 2.0); a v2.1.1 é de 11/2024. Para WebGL2 prefira twgl ou puro.

### twgl.js

- Instalar: `<script src="https://cdn.jsdelivr.net/npm/twgl.js@7.0.0/dist/7.x/twgl-full.min.js"></script>` (global `twgl`). MIT, 106 kB raw, **29 kB gzip**. Snippet: `twgl.html` (WebGL2).

```js
const gl = canvas.getContext('webgl2', { antialias: false });
const programInfo = twgl.createProgramInfo(gl, [VS, FS]);
const bufferInfo = twgl.createBufferInfoFromArrays(gl, { position: { numComponents: 2, data: [-1, -1, 3, -1, -1, 3] } });
const draw = (t) => { gl.useProgram(programInfo.program); twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  twgl.setUniforms(programInfo, { uRes: [160, 90], uTime: t, uC0: token('--c0'), uC1: token('--c1'), uC2: token('--c2'), uC3: token('--c3') });
  twgl.drawBufferInfo(gl, bufferInfo); };
```

- Use quando: quer o WebGL2 "puro" com menos linhas. **Não use** se o puro já está sob controle: o ganho é pequeno.

---

## 4. Cena 3D: three.js e pós-processamento

- Instalar (pinado; só há builds de módulo, **sem UMD**): importmap com `three@0.186.1` e `three/addons/` apontando para `examples/jsm/` (veja `scripts/snippets/three-postprocessing.html`).
  `three.module.min.js` importa `three.core.min.js`: 393 + 416 kB raw, **90 + 104 kB gzip (~194 kB)** antes dos addons. Em bundler, tree-shaking reduz bastante. MIT.
- Cadeia testada: `RenderPass` -> `OutputPass` (tone mapping + sRGB) -> `ShaderPass` com o dither (em espaço de tela, já em sRGB). O dither precisa vir **depois** do `OutputPass`.

```js
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(1); renderer.setSize(160, 90, false);          // false: não mexe no tamanho CSS (CSS amplia, pixelated)
const composer = new EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(160, 90);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new OutputPass());
composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null }, uC0: { value: token('--c0') } /* ... */ },
  vertexShader: VS, fragmentShader: FS }));                            // FS: lum = dot(tDiffuse.rgb, ...); Bayer por gl_FragCoord
renderer.setAnimationLoop((ms) => { mesh.rotation.y = ms / 1000; composer.render(); });
```

- Notas verificadas:
  - `material.dithering = true` do three **não é** dither estilístico: é anti-banding (ruído de ~1 bit para esconder faixas). Não confunda.
  - `EffectComposer` é o caminho clássico (WebGL). Para o `WebGPURenderer`, o caminho novo é `RenderPipeline`/TSL (export `three/webgpu` e `three/tsl`); eu **não** testei essa trilha.
  - Addons que já existem em `three/addons/` (confirmado por HTTP 200 no jsDelivr; **não executei**): `HalftonePass`/`HalftoneShader` (halftone RGB com formas ponto, elipse, linha, quadrado, losango; ângulos padrão 15°/30°/45° por canal), `DotScreenPass`, `FilmPass`.
  - **pmndrs `postprocessing` 6.39.5** (Zlib; 157 kB gzip + three): exporta `ASCIIEffect`, `ColorDepthEffect`, `DotScreenEffect`, `NoiseEffect`, `PixelationEffect`, `ScanlineEffect`; **não há efeito de dither ordenado dedicado** nessa lista. Para Bayer escreva um `Effect` próprio. Não testei esse pacote.
  - Em React: `@react-three/fiber` 9.8.2 e `@react-three/postprocessing` 3.2.2 (MIT) existem (datas 2026-10-14 e 2026-10-21); não testei.
- **Use** quando: há malha/modelo/material real, sombras, câmera 3D. **Não use** só para "um efeito de fundo": ~194 kB para fazer o que o WebGL2 puro faz em 3 kB.

---

## 5. pixi.js, p5.js, Paper Shaders, runners estilo Shadertoy

### pixi.js

- Instalar: `<script src="https://cdn.jsdelivr.net/npm/pixi.js@8.22.0/dist/pixi.min.js"></script>` (global `PIXI`). MIT, 841 kB raw, **237 kB gzip**. Snippet: `pixi-filter.html`.
- Um `Filter` com fragment shader próprio quantiza a luminância do que estiver no container. API v8: `new PIXI.Filter({ glProgram: new PIXI.GlProgram({ vertex, fragment }), resources: { ditherUniforms: { uC0: { value: Float32Array, type: 'vec3<f32>' }, ... } } })`.
- **Pegadinha achada no teste:** com o fragment sem declaração de precisão, o link falhou ("Precisions of uniform uInputSize differ between VERTEX and FRAGMENT"): o Pixi não dá ao fragment a mesma precisão do vertex. Declarar `precision highp float;` no topo do fragment resolveu.
- Use quando: já há cena 2D (sprites, texto, gráficos) e você quer dither no resultado. **Não use** só para o efeito: 237 kB.

### p5.js

- Instalar: `<script src="https://cdn.jsdelivr.net/npm/p5@2.3.4/lib/p5.min.js"></script>`. **LGPL-2.1** (via CDN, como lib separada, costuma bastar; confirme com quem cuida de licenças se for empacotar). 991 kB raw, **284 kB gzip**. Snippet: `p5.html` (modo instância, `loadPixels`/`updatePixels`, canvas 160x90).
- Use quando: protótipo rápido, ensino, mexer pixel a pixel sem WebGL. **Não use** em produção leve: é a mais pesada da lista e roda em CPU.
- A série 2.x mudou APIs em relação à 1.x (a mudança mais citada: `preload()` saiu em favor de `async setup` com `await`; não reconferi nas notas de versão). Conferi só o que o snippet usa: modo instância, `createCanvas`, `loadPixels`/`updatePixels`.

### Paper Shaders (`@paper-design/shaders`)

- Instalar: `import { ShaderMount, ditheringFragmentShader, DitheringShapes, DitheringTypes, ShaderFitOptions, getShaderColorFromString } from 'https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.82/+esm'`. Apache-2.0, 213 kB raw, **64 kB gzip**. Snippet: `paper-shaders.html` (versão vanilla; existe `@paper-design/shaders-react` 0.0.82).
- O shader de dither usa **duas cores** (`u_colorBack`, `u_colorFront`) e aceita `u_shape` (o snippet usa `sphere`), `u_type` (`'4x4'` no snippet) e `u_pxSize`. Também exporta `imageDitheringFragmentShader`, `halftoneCmykFragmentShader` e `halftoneDotsFragmentShader` (existência vista na lista de exports; **não executei** esses).
- **Pegadinha:** o pacote pede cor como **string** (hex/rgb/hsl): resolva o token antes (`getShaderColorFromString(tokenHex('--c0'))`, como no snippet).
- **Aviso do próprio README:** a API muda em versões 0.0.x. Fixe a versão e reteste ao subir. A 0.0.82 saiu em 2026-10-21 (15 dias atrás: acima do corte de 14 dias, mas recente).
- Use quando: quer um fundo/hero dither pronto com poucas linhas. **Não use** para algo que precise de 4 tons ou do seu shader: duas cores e formas fixas.

### Runners estilo Shadertoy

- `glslCanvas` 0.2.6 (MIT, última publicação 2022-11), `glsl-canvas-js` 0.2.9 (MIT, 2022-05), `shadertoy-react` 1.1.2 (MIT, 2022-05): **todos parados desde 2022**. Servem para colar um shader do Shadertoy (`mainImage(out vec4, in vec2)`) e ver rodando, mas não os recomendo como dependência.
- Alternativa deste pacote: `scripts/shader-playground.html` aceita `mainImage` no formato Shadertoy com o prelúdio de dither (`bayer8`, `blueNoise`, `ign`, `ditherTone4`, tokens `uC0..uC3`). É a melhor forma de iterar um shader antes de levar ao projeto.
- Shadertoy.com em si: não tem API de embed estável para uso comercial; não verificado.

---

## 6. Sem JS: filtros SVG e CSS puro

### Filtro SVG

- Instalar: nada. Snippet testado: `snippets/svg-filter.html`. Ruído com `feTurbulence`, soma com o conteúdo (`feComposite arithmetic`), corte em 0,5 (`feComponentTransfer discrete`):

```html
<svg width="0" height="0" aria-hidden="true" style="position:absolute"><filter id="grain-dither" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7" result="noise"/>
  <feColorMatrix in="noise" type="matrix" values="0.833 0.833 0.833 0 -0.75  0.833 0.833 0.833 0 -0.75  0.833 0.833 0.833 0 -0.75  0 0 0 0 1" result="gray"/>
  <feComposite in="SourceGraphic" in2="gray" operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.5" result="sum"/>
  <feComponentTransfer in="sum"><feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/></feComponentTransfer>
</filter></svg>
<style>.grain { filter: url(#grain-dither); }</style>
```

- Resultado medido: só preto e branco (100% dos pixels), ~50% acesos num degradê, estável entre quadros.
- **Limites:** ruído fractal/Perlin (não é azul), o "ganho" da matriz foi calibrado a olho; só 1 bit; preto e branco (colorir pede mais um `feColorMatrix`/`feFlood`); filtros SVG em elementos grandes são caros em CPU. **Safari/Firefox não testados.**
- Use quando: grão de 1 bit sobre qualquer elemento (texto, imagem) sem JS. **Não use** quando precisa de tons ou da trama Bayer.

### CSS puro

- Instalar: nada. `node scripts/bayer.mjs 8 --format css` gera a receita; exemplo testado em `snippets/css-only.html` (Bayer 8x8 e halftone rotacionado a 45°): tile `data:` PNG + `mix-blend-mode: plus-lighter` num `::before` + `filter: contrast(1000)` no pai.
- Princípio: `0,5·L + 0,5·(1 − t) ≥ 0,5` equivale a `L ≥ t`, o teste do ordenado; a imagem precisa ser **cinza e ir só até #808080**.
- Medido: só preto e branco; ~0,05% dos pixels exatamente no limiar oscilam entre capturas (aceito pelo teste).
- **`background-blend-mode: plus-lighter` não funciona** (testado). Safari e Firefox não testados.
- Use quando: fundo/máscara de 1 bit em cinza, sem JS. **Não use** para tons, cor ou animação por conteúdo.

---

## 7. Bibliotecas de dither de imagem

Existem para **converter imagens** (arquivos/`ImageData`), não para animar. Verificadas no npm em 2026-11-05.

| Biblioteca | O que é | Versão / licença / última publicação | Ressalva |
|---|---|---|---|
| **Dither Kit** (Boring Software, Inc) | gráficos (area, line, bar, pie, radar) e avatar, botão, gradiente com **dither ordenado em um motor de canvas** mínimo; registry do shadcn/ui | MIT; último commit conferido: `1e7faee` (2026-07-14); `npx shadcn@latest add Boring-Software-Inc/dither-kit/dither-kit` | **copia código para o seu projeto** (cada time é dono da sua cópia); docs em tripwire.sh/dither-kit. Crédito obrigatório (MIT). |
| npm `dither-kit` | port React com o mesmo nome | 0.1.0, MIT, 2026-10-26, repositório `abilliontokens/dither-next` | **não é da Boring Software**; não confunda pelo nome. Não testei. |
| `ditherjs` | dither de imagem no navegador/Node | 0.10.0, **CC-BY-SA-4.0** (copyleft), 2022-06 | licença incomum para código; atribuição e compartilha-igual. Parado desde 2022. |
| `image-q` | quantização de paleta (NeuQuant, RGBQuant, Wu) + distâncias | 4.0.0, MIT, 2022-06 | **não tem dither ordenado**; faz difusão (Floyd-Steinberg, etc.) e escolha de paleta. Útil como "paleta ótima" antes do dither. |
| `floyd-steinberg` | difusão de erro numa só função | 1.0.6, MIT, 2022-06 | só Floyd-Steinberg, 1 função. |
| `@thi.ng/pixel-dither` | difusão de erro e ordenado extensível, vários presets | 1.1.206, Apache-2.0, 2026-08 | parte do ecossistema thi.ng; mais ativa. Não testei. |
| `dither-me-this` (npm) | dither em build time para geradores estáticos | 0.0.5, ISC, 2022-04 | só pipeline de build. Não é a ferramenta web de mesmo nome (item 8). |

Para o dia a dia **este pacote já cobre**: `scripts/dither-image.mjs` (Bayer, ruído azul, 8 núcleos de difusão, paletas retrô, `kmeans:N`, serpentina,
modo luma/rgb, linear/sRGB) em Node puro, sem dependência. `dithercn` (citado em pesquisas anteriores): **não consegui confirmar** que exista; não use sem verificar.

---

## 8. Ferramentas externas

Todas as linhas de comando abaixo foram **executadas** em ImageMagick 6.9.12-98 (`convert`) e ffmpeg 6.1.1. Com ImageMagick 7 troque `convert` por `magick` (não testei).

### ImageMagick

```bash
convert -list threshold                                            # mapas: o2x2 o3x3 o4x4 o8x8 h4x4a h6x6a h8x8a h4x4o ... c5x5b ...
convert foto.png -colorspace Gray -ordered-dither o4x4 out.png     # Bayer 4x4 (1 bit). Atenção: o8x8 NÃO é o Bayer 8x8 de livro (algoritmos.md §3)
convert foto.png -colorspace Gray -ordered-dither o4x4,4 out.png   # 4 níveis por canal (a saída tem 4 cores)
convert foto.png -colorspace Gray -ordered-dither h6x6a out.png    # halftone angulado 6x6
convert foto.png -colorspace Gray -dither FloydSteinberg -colors 2 out.png     # difusão, 2 cores (também Riemersma)
convert xc:'#0f380f' xc:'#306230' xc:'#8bac0f' xc:'#9bbc0f' +append gb.png     # paleta de 4 cores em uma imagem
convert foto.png -dither FloydSteinberg -remap gb.png out.png                  # dither para a paleta dada
convert foto.png -colorspace Gray -ordered-dither o8x8 -scale 400% out.png     # ampliar no fim, vizinho mais próximo
```

- Prova local: cada comando gerou a contagem de cores esperada (`o4x4,4`: 4 cores; `-remap`: 4; `h6x6a`/`-colors 2`/Riemersma: 2).
- Comparação com `bayer.mjs`: `o4x4` tem a mesma disposição; 2,3% dos pixels de um degradê divergem por causa da normalização do limiar; `o8x8` é outra matriz (14,5% de divergência).
- Use quando: lote de arquivos, scripts de build. **Não use** para animação em tempo real.

### ffmpeg (vídeo e GIF)

```bash
ffmpeg -i in.mp4 -vf "fps=12,scale=160:-1:flags=neighbor,split[a][b];[a]palettegen=max_colors=4[p];[b][p]paletteuse=dither=bayer:bayer_scale=3" out.gif
# opções de dither do paletteuse (testadas): bayer, floyd_steinberg, sierra2_4a, atkinson, heckbert, none
```

- `bayer_scale` aceita **0 a 5** (6 ou mais dá erro "out of range [0 - 5]"). Mais baixo = trama mais visível. Tamanho do GIF de teste (24 quadros, 160x90, 4 cores): bayer escala 3 = 9,7 kB; floyd_steinberg = 35,0 kB (3,6x maior); escala 0 = 12,5 kB; escala 5 = 8,4 kB.
- `scale=...:flags=neighbor` mantém os pixels duros ao reduzir. A mesma paleta para todos os quadros (`palettegen` global) evita cintilar de cor entre quadros.
- Use quando: vídeo/GIF de saída. Para o **navegador**, prefira o shader.

### Aseprite

- Editor de pixel art pago (código-fonte aberto sob licença própria); ao converter para modo indexado oferece dither (ordenado e difusão Floyd-Steinberg, conforme o fórum oficial,
  community.aseprite.org/t/what-are-the-changepixelformat-dithering-modes/8385). **Não usei nem testei**: use para arte feita à mão e exportar PNG com a paleta do projeto.

### Dither Me This (web)

- Ferramenta web gratuita, no navegador: doodad.dev/dither-me-this (a página existe; **não testei**). Há outras iguais (por exemplo, spiralbetty.net/dither-image). Para um resultado
  rápido de um arquivo; não serve como parte do build.

---

## 9. React, SSR e ciclo de vida

- **Nunca crie contexto WebGL/canvas no render nem no servidor.** Crie em `useEffect` (ou `useLayoutEffect`) e limpe no retorno: cancele o `requestAnimationFrame`, remova listeners e,
  em WebGL, solte o contexto com `gl.getExtension('WEBGL_lose_context')?.loseContext()` quando desmontar muito (relatado como necessário em alguns navegadores; **não medi**).
- Em Next.js/SSR: componente `'use client'` e, para bibliotecas que tocam `window`/`document` na importação (p5, pixi, paper shaders), use `import()` dinâmico **dentro do efeito** ou `next/dynamic` com `ssr: false`.
  Regra segura: importe a biblioteca dentro do efeito, nunca no topo do módulo, para qualquer uma delas.
- StrictMode monta duas vezes em desenvolvimento: o `cleanup` precisa desfazer tudo (a Parte A tem um componente React testado, `examples/react-dither-canvas.tsx`).
- Valor do token em canvas/WebGL: leia na montagem **e** quando o tema mudar (`matchMedia('(prefers-color-scheme: dark)')`, ou um `MutationObserver` no atributo de tema), senão o canvas fica com a cor do tema antigo.
- `prefers-reduced-motion` e aba oculta: todos os snippets animados têm as duas proteções (e o teste prova o quadro parado com reduced-motion); o `ShaderMount` do Paper Shaders declara pausar fora da tela. Ver `acessibilidade-e-reduced-motion.md`.

---

### Já usadas no projeto de origem (não são recomendação geral)

- `vitrio` 0.1.2: vidro líquido (lente de refração); `@number-flow/react` 0.6.2: números que rolam; `motion`: transições e contadores. Versões conferidas no `package.json` do projeto de origem em 2026-11-05; sem teste visual neste pacote.
- Fontes pixel testadas: **Jersey 25** (aprovada nos números), Pixelify Sans, Geist Pixel Square (rejeitada), Doto. Dither Kit (Boring Software): MIT declarado, sem arquivo LICENSE no repositório.

## 10. Guia "quero X, use Y"

| Quero | Use | Arquivo |
|---|---|---|
| Fundo animado em dither com **os tokens do tema** (4 tons) | WebGL2 puro | `snippets/webgl2-puro.html`, `shader-playground.html` |
| O mesmo, **sem WebGL** (grade pequena) | Canvas2D | `snippets/canvas2d.html` |
| Fundo dither pronto com **2 cores**, poucas linhas | Paper Shaders | `snippets/paper-shaders.html` |
| Vários passes/efeitos encadeados, leve | ogl ou regl | `ogl.html`, `regl.html` |
| WebGL2 puro com menos boilerplate | twgl.js | `twgl.html` |
| **Objeto 3D** (malha, material, sombra) com dither | three.js + `ShaderPass` depois do `OutputPass` | `three-postprocessing.html` |
| Cena 2D com sprites e filtros | pixi.js (`Filter` + `precision highp`) | `pixi-filter.html` |
| Protótipo/aula, pixel a pixel | p5.js | `p5.html` |
| Grão de 1 bit sobre elemento, **sem JS** | filtro SVG | `svg-filter.html` |
| Bayer ou halftone de 1 bit em cinza, **sem JS** | CSS puro | `css-only.html`, `bayer.mjs --format css` |
| **Foto/arte parada** em dither (arquivo) | `scripts/dither-image.mjs` (ou ImageMagick) | `algoritmos.md` §5 |
| Lote de imagens em build | ImageMagick | item 8 |
| **Vídeo ou GIF** em dither | ffmpeg `paletteuse=dither=bayer` | item 8 |
| Ver/editar o shader ao vivo, testar tokens, achar erro de linha | `shader-playground.html` | `scripts/README.md` |
| Compute pesado (simulação, milhões de partículas) | WebGPU, com plano B | `webgpu.html` |
| Gráficos (área, barra, pizza) em dither no React/shadcn | Dither Kit (cópia, MIT, crédito) | item 7 |
| Dither que **acompanha a superfície** em 3D | padrão ancorado (Pope / Dither3D) | `algoritmos.md` §9 |

Como decidir em 3 perguntas: (1) Tem 3D de verdade? três. (2) Precisa de 4 tons ligados ao tema ou de shader próprio? WebGL2 puro. (3) Só um fundo bonito com 2 cores? Paper Shaders.

---

## 11. O que não foi verificado

- **Desempenho em GPU real e em celular:** tudo foi em SwiftShader. Os tamanhos (gzip) e a contagem de linhas são reais; FPS e consumo, não.
- **Safari e Firefox:** CSS puro, filtro SVG, WebGPU e os snippets só rodaram no Chromium 153.
- Teto de contextos WebGL por página e vazamento ao desmontar (relatos, não medi); iOS Safari em particular.
- `pmndrs postprocessing`, `@react-three/*`, `HalftonePass`, `imageDitheringFragmentShader`/`halftoneCmykFragmentShader` do Paper Shaders, `@thi.ng/pixel-dither`, Aseprite e Dither Me This:
  conferi existência e metadados, não executei.
- three `WebGPURenderer` com TSL (`RenderPipeline`): não testado.
- WebGPU: sem número de cobertura global consultado; o estado por plataforma vem do web.dev/gpuweb (25/11/2025) e pode ter avançado.
- ImageMagick 7 (`magick`): não testei; ffmpeg: só 6.1.1.
- Pacotes de 2022 (`ditherjs`, `image-q`, `floyd-steinberg`, runners Shadertoy): existem e têm licença/versão conferidas, mas **não os executei**.
