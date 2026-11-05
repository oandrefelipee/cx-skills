# Animação e performance

Regras práticas para animar dither e pixel sem pesar a página. Os números marcados **(software)** foram medidos aqui em Chromium headless com SwiftShader (WebGL na CPU): servem para comparar variantes entre si, **não** para prometer FPS em GPU real, celular ou Safari (nada disso foi medido).

## Índice
1. [Taxa de quadros](#1-taxa-de-quadros)
2. [Resolução interna × CSS (a célula)](#2-resolução-interna--css-a-célula)
3. [Ciclo de vida do laço](#3-ciclo-de-vida-do-laço)
4. [Custo de shader](#4-custo-de-shader)
5. [Custo em Canvas 2D e na CPU](#5-custo-em-canvas-2d-e-na-cpu)
6. [Vários canvases, contextos e memória](#6-vários-canvases-contextos-e-memória)
7. [Movimento de interface (CSS, motion, molas)](#7-movimento-de-interface-css-motion-molas)
8. [Primeiro quadro e pré-aquecimento](#8-primeiro-quadro-e-pré-aquecimento)
9. [Como medir](#9-como-medir)
10. [O que não foi provado](#10-o-que-não-foi-provado)

## 1. Taxa de quadros

| O que anima | Alvo | Por quê |
|---|---|---|
| Campo/fundo de dither, botão, cena em pixel | **24 fps** | pixel art pede ritmo "de desenho"; 24 fps corta ~60% do custo e ainda parece fluido |
| 3D leve por SDF (140×140 lógico) | **18 fps** | cada pixel marcha 48 a 72 passos |
| Cursor, arrasto, mola que segue o ponteiro | **60 fps** (rAF puro) | é interação direta; atrasar parece lag |
| Estados parados (movimento reduzido, fora da tela) | **0 fps** | um quadro só |

Implementação: um `requestAnimationFrame` que sempre se reagenda mas só desenha se `agora - ultimo >= 1000/fps`:

```js
const passo = (agora) => { raf = requestAnimationFrame(passo);
  if (document.hidden || !visivel || agora - ultimo < 1000 / FPS) return;
  ultimo = agora; desenhar(agora / 1000); };
```
Tempo vem do relógio (`agora/1000`), **não** de somar `dt` fixo por quadro: assim a animação anda na mesma velocidade em 18 ou 60 fps e dá para capturar um instante exato (relógio virtual em `scripts/capture.mjs --freeze`).

## 2. Resolução interna × CSS (a célula)

- O truque central: **o canvas tem 1 pixel por célula** e o CSS o amplia sem suavizar (`image-rendering: pixelated`). Célula de 2 a 3 px de CSS é o miolo do estilo (botão = 2, campos = 3, quadro de cena = zoom 3 a 4).
- Custo ≈ `cols × rows` fragmentos. Campo de 760×340 com célula 3 → 254×114 = 29 mil fragmentos (em vez de 258 mil em resolução cheia).
- **A célula em px do dispositivo precisa ser inteira**: `celDev = Math.max(1, Math.round(cell * dpr))`, `cols = ceil(larguraEmPxDoDispositivo / celDev)` e o canvas recebe `style.width = cols*celDev/dpr px` (passa um pouco das bordas; o pai corta com `overflow:hidden`). Com `dpr` 1,5 e célula 3 você teria 4,5 px e as células sairiam de tamanhos diferentes.
- `devicePixelRatio`: para shader de resolução cheia, limite a 1,5 (`Math.min(devicePixelRatio, 1.5)`). Em tela 3x, não pague 9 pixels por pixel de CSS para um efeito pontilhado.
- Pixel art em **quadro lógico** (ex.: 384×216): ampliação por número inteiro (`floor(largura/quadro)`); abaixo de 1× aceite suavizar. Escala dos objetos dentro do shader por `min(altura/150, largura/250)` para não cortar no celular.
- `ResizeObserver`: remeça a grade e atualize `viewport`; **não** recompile o shader (só recompile se o corpo do shader mudou). Com movimento reduzido, redesenhe o quadro parado depois do resize.

## 3. Ciclo de vida do laço

Todo laço decorativo deve:
1. **Pausar fora da tela:** `IntersectionObserver` (`visivel = entry.isIntersecting`).
2. **Pausar com aba oculta:** `document.hidden` no laço + `visibilitychange` para reiniciar.
3. **Respeitar movimento reduzido:** um quadro com `t = 3.3` (um instante bonito e determinístico); reler `matchMedia(...).addEventListener('change', ...)`; redesenhar o quadro parado quando algo mudar (resize, cor, valor).
4. **Parar de verdade ao desmontar:** `cancelAnimationFrame`, `disconnect()` dos observers, `removeEventListener`; no React 18/19 o StrictMode monta, desmonta e monta de novo: crie o `<canvas>` **dentro** do efeito e remova-o na limpeza (ver `armadilhas.md`).
5. **Suavizar valores que vêm da interface:** `atual += (alvo - atual) * 0.08..0.18` por quadro; evita saltos e esconde a taxa de 24 fps.

Um canvas que "dorme sozinho" quando nada se mexe (sem animação ativa e sem estado sujo) economiza bateria: o motor de objetos do laboratório cancela o `requestAnimationFrame` quando nenhum alvo precisa desenhar e o "acorda" ao mudar algo.

## 4. Custo de shader

- Meça por **fragmentos × operações**. Os maiores vilões: laços com muitas voltas (`for` de 72 passos de raymarching, 14 moedas, 9 notas, 14 confetes), `sin/cos/pow/exp2` por pixel, texturas procedurais empilhadas, chamadas repetidas ao mapa de distâncias (normal = 4 chamadas, oclusão = +1).
- Reduza: **resolução lógica menor** (140×140 basta para um objeto herói), teto de passos (48), sem sombra suave, `if (fi < n)` dentro do laço para sair cedo, calcule `bayer` uma vez por pixel, evite ramificações caras dentro de laços aninhados.
- `antialias: false` (dither não precisa), `alpha: false` quando o fundo é opaco (composição mais barata), `powerPreference: "low-power"` para fundo decorativo.
- Estruturas de dados: **vértice sem buffer** (`gl_VertexID`, um triângulo de tela cheia) em WebGL2; em WebGL1 use um buffer de 3 vértices (`[-1,-1, 3,-1, -1,3]`).
- Não crie `vec`/`array` dinâmicos pesados; uniform arrays pequenos (`uP[4]`) com índice dinâmico são aceitos em GLSL ES 3.00.
- **(software)** campo de maré 254×114 células a 24 fps: ~20 quadros/s medidos (teto do rAF + CPU compartilhada); 3D leve 140×140 a 18 fps: ~15 quadros/s; a direção K (palco de teatro com 3D dither por CPU) ficou em ~36 fps no total da página.

## 5. Custo em Canvas 2D e na CPU

- Agrupe por cor e faça **um `fill` por cor** com milhares de `rect(x,y,1,1)` num único path (`beginPath` → `rect`… → `fill`). Milhares de `fillRect` separados são bem mais lentos.
- Alternativa mais rápida para campos grandes: preencha um `ImageData`/`Uint32Array` reutilizado e `putImageData` (zero alocação no laço).
- **Zero alocação no laço por pixel**: sem `[x, y]`, sem objetos temporários; só números (o motor SDF da CPU do projeto não cria vetores dentro do laço).
- Marcha de raios na CPU em grade menor (`w/up`) e dither na grade fina; interpolação bilinear da luminância só entre pontos que acertaram a peça.
- **Governador de carga:** meça `gasto` (ms desenhando por segundo). Se passar de ~28% do tempo, reduza o fator de quadros ×0,75 (mín. 0,3); volte ×1,15 quando cair abaixo de ~12%. Um único `requestAnimationFrame` serve todos os objetos.
- Troque a cor lida de `getComputedStyle` por cache e releitura só em mudança de tema (ou a cada ~30 quadros).
- Nada de `getImageData` no laço (força sincronização com a GPU em canvas acelerado); a sonda de cor usa um canvas 1×1 com `willReadFrequently: true` e só na releitura.

## 6. Vários canvases, contextos e memória

- Há um teto de ~16 contextos WebGL por página (os mais antigos são perdidos). Um canvas por cena visível; para listas, **um canvas compartilhado** ou 2D.
- Libere: `gl.getExtension("WEBGL_lose_context")?.loseContext()` na limpeza **de um canvas criado no próprio efeito**. Não chame `loseContext()` num canvas que o React reutiliza entre montagens (StrictMode devolveria um contexto morto): foi um bug real aqui e a regra do projeto passou a ser "canvas criado no efeito".
- Redimensionar canvas WebGL repetidamente é caro e foi relatado como fonte de vazamento no iOS Safari (**não verificado aqui**): redimensione só quando o tamanho de células muda.
- Cache de máscaras e sprites (`Map` por nível/chave): a dissolução Bayer gera 10 PNGs de máscara uma vez.
- Props instáveis recriando o efeito derrubam o contexto: mantenha `frag`, `cell`, `fps` estáveis e passe o resto por `ref`.

## 7. Movimento de interface (CSS, motion, molas)

- Anime só `transform` e `opacity` quando puder; `offset-distance` (feixe de luz) é composto pela GPU e barato; `filter: blur()` num elemento grande é caro (use em anel fino, como o brilho do botão).
- Molas: seguir o cursor `stiffness 620, damping 38, mass 0.5`; entrada de modal `{ type: "spring", bounce: .25, visualDuration: .5 }`; contador `animate(0, n, { duration: 1.2, ease: "easeOut" })` com `tabular-nums`; letras com `stagger(.03)`.
- Evite re-render por quadro: lance valores em `MotionValue`/`ref` e leia no laço (o brilho de dither do modal lê `intro`, `morph`, `pulso`, `mouseX/Y` de `MotionValue`: zero re-render).
- **Um momento de movimento autoral por tela**, o resto discreto; sem gradiente em texto, sem vidro decorativo (regras do Impeccable usadas na revisão do modal).
- O aro cônico animado (`.rx-aro`) num painel de 1140 px gerou **laço infinito de pintura**: teste painéis grandes com a aba Performance.
- `MotionConfig reducedMotion="user"` não cobre parallax por ponteiro nem seu próprio canvas: faça o portão manual (ver `acessibilidade-e-reduced-motion.md`).
- Transição de página/passos: dissolução Bayer por máscara (receita 12) ou `layoutId`/View Transitions. `Escala` por `transform: scale` pode errar a projeção do `layoutId`: faça um spike de 30 min antes de adotar.

## 8. Primeiro quadro e pré-aquecimento

- A primeira celebração travava porque tudo era `import()` sob demanda. Solução: `preloadCelebrations()` em `requestIdleCallback` (fallback `setTimeout`) que resolve os efeitos, carrega o confete, espera `document.fonts.load(...)` (teto 300 ms) e compila um shader de teste. Meça com `performance.mark("rx-cel:request:N")` e `rx-cel:first-frame:N` dois `requestAnimationFrame` depois, `PerformanceObserver` de `longtask`.
- Fontes: espere a fonte pixel antes de medir o número.
- O gráfico em dither demora 6 a 8 s sob software; em captura espere (receita 10).
- Carregue pesado sob demanda (`React.lazy`, `import()`): renderer WebGL2 de 17 KB gz, gráfico (Dither Kit), confete.

## 9. Como medir

- `node scripts/fps-probe.mjs pagina.html --seconds 6 --wait-for "JS"` (média, mediana, p95/p99 do tempo de quadro, quadros lentos; `--cpu-throttle 4` aproxima um celular médio **de CPU**, não de GPU).
- HUD dentro da página (como nos exemplos): conte quadros **desenhados** (não ticks do rAF) por segundo e mostre a grade (`cols×rows`).
- Contar chamadas de desenho sem tocar no código: `WebGL2RenderingContext.prototype.drawArrays = (f => function(...a){ window.__draws=(window.__draws||0)+1; return f.apply(this,a) })(WebGL2RenderingContext.prototype.drawArrays)` via `addInitScript`.
- Compare variantes entre si (célula 2 × 4, 48 × 72 passos), sempre no mesmo ambiente.
- DevTools Performance: procure `Recalculate Style`/`Paint` contínuos (aro cônico), `Long tasks` e GPU raster.

## 10. O que não foi provado

- FPS em **GPU real**, em celular, em Safari/Firefox e em telas 4K/DPR 3.
- Consumo de bateria e de memória a longo prazo.
- `offset-path: rect()` fora do Chromium (botão com feixe).
- O vazamento de memória no iOS ao redimensionar canvas WebGL e o teto exato de contextos por navegador (números de pesquisa, não de teste).
Diga isso ao entregar; combine com o autor um teste em dispositivo real antes de produção.
