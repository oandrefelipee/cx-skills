---
name: cx-dither-animacoes
description: Cria, recria e adapta animações e estilos em dither, pixel art, halftone, Bayer, ruído azul, grão e retro, parados ou animados, em Canvas 2D, WebGL2/shader (GLSL), SDF/raymarching leve, CSS ou SVG, com cores ligadas aos tokens do projeto, movimento reduzido, pausa fora da tela e prova por captura (Playwright). Use SEMPRE que o pedido envolver dither, pontilhado, Bayer, pixelado, 8-bit, shader, WebGL, canvas animado, botão/CTA com feixe de luz na borda, fundo de campo granulado, cena de objetos em pixel, 3D "dither" sem three.js, gráfico em dither (Dither Kit), cursor ou fonte pixel, celebração/confete, transição por dissolução, "recriar este efeito/referência", converter imagem em dither (Floyd-Steinberg, Atkinson) ou escolher biblioteca (ogl, regl, twgl, three, pixi, p5). NÃO use para animação comum de interface sem trama (fade, mola, layout), vídeo e Lottie, 3D realista com malhas, dataviz sem estilo dither nem para quem só quer um GIF pronto. Também para halftone, meio-tom, hachura/gravura, retro/CRT, 1-bit, "estilo Higgsfield", sticker/adesivo com contorno, rabiscos por máscara, tingir/recolorir por paleta (gradient-map), converter imagem em pixel-art por Python e animação como arquivo (GIF, WebM).
---

# Dither e animações em pixel (geral, para qualquer projeto)

Skill para fazer, recriar e adaptar efeitos em **dither** (trama de pontos que simula tons com poucas cores), **pixel art** e parentes (halftone, grão, retro), parados ou animados. Foi construída a partir de peças reais que o autor pediu, escolheu e aprovou (botão com feixe de luz, cursor e fonte pixel, campos Bayer de 4 tons, cenas de objetos em pixel, 3D leve por SDF, gráfico em dither, celebração, modal com rota) e **generalizada**: nada aqui depende de um monorepo ou de tokens de um produto. O que é de um projeto (tokens, motor local, vereditos, aprendizados) fica no **adaptador do projeto** (seção abaixo).

Duas ideias sustentam tudo:
1. **A célula é o pixel.** O canvas tem 1 pixel por célula e o CSS o amplia sem suavizar (`image-rendering: pixelated`). Fica barato e as bordas saem nítidas.
2. **A cor nunca é fixa.** Toda cor vem de variável CSS/token do projeto de destino, lida com `getComputedStyle` quando o canvas/shader precisa de número. Se a cor de marca muda, o dither muda junto.

## Quando usar / quando NÃO usar

Use: botão ou CTA "aceso", fundo de palco/cartão, cena ilustrada em pixel, objeto 3D leve pontilhado, gráfico com cara retro, número/cursor/fonte pixel, transição ou celebração em trama, imagem convertida em dither, recriar uma referência (site, Dribbble, Mobbin), escolher a tecnologia certa.

Não use (e diga isso): animação comum sem trama; vídeo/Lottie; 3D fotorrealista; dataviz sem estilo dither; efeito que o `box-shadow` ou um `conic-gradient` já resolve; quando a pessoa quer só um GIF/imagem pronta.

## Principio central

**Dither e tempero, nao prato.** Quantizar tudo em poucos tons e pontilhar tudo vira ruido e cansa. O que funcionou: base limpa e chapada (cor lisa, sem borda fina) com dither em UM ou DOIS elementos por tela: fundo, sombra de contato, realce, confete, transicao, ou a ilustracao-heroi. Pergunte a si mesmo: "qual e o unico lugar onde a textura ganha o olhar?" e deixe o resto quieto.

Por que isso importa: o dither chama atencao justamente por ser textura de alta frequencia. Dois focos disputam o olhar e o texto perde leitura.

### Gosto de referencia (caso real das 3 primeiras rodadas; ajuste ao seu cliente)
- Funcionou: cores chapadas e saturadas (um azul eletrico dominante), pixel-art nativa de 1 bit em grade de 8 px, adesivo (contorno branco de recorte), sombra dura que "afunda" o botao, dither so em algumas coisas, transicao de pagina em dither pixelado, paleta de 4 tons por material.
- Foi rejeitado: 3D brilhante, neon, bloom, glow, paletas quentes/pastel genericas, visual "cromado de IA", bordas finas, texto demais, dither em tudo, gravura por hachura como visual principal (a tecnica ficou, o gosto nao).
- Depois dessas rodadas o autor aprovou paletas vibrantes (lima, laranja, menta) sobre o azul da plataforma: o gosto muda, confirme antes de assumir.
- Se o usuario nao disse o gosto dele, pergunte (ou mostre 2 a 3 variacoes pequenas) antes de gastar tempo polindo.

## Antes de começar: 6 perguntas (leia `references/workflow-referencias.md` §6)

1. Parado ou animado? Onde vive (botão, fundo, cena, gráfico, celebração, imagem)?
2. Qual é a **cor global** (token) e há paletas alternativas? Claro e escuro?
3. O que o objeto/tela representa (dinheiro, escala, privacidade...)? O que já existe?
4. Há referências citadas (nomes, links) e algo que a pessoa **não** quer?
5. Quantas variantes mostrar? Nunca sobrescreva uma escolha anterior: **duplique**.
6. Que prova espera (capturas, protótipo rodando, link)? Há WebGL2 no alvo (sem WebGL2 precisa de reserva)?

Se for factual (copy, regra de produto), pergunte em vez de inventar. Para o autor, "jitter" quase sempre quer dizer **dither**: confirme o termo. Gosto, vereditos e o que irritou ficam no adaptador do projeto (seção "Adaptador por projeto") e, no geral, em `references/workflow-referencias.md`.

## Escolha da stack (decisão do autor)

Sem padrão fixo. Em cada pedido, antes de escrever código, mostre **2 ou 3 rotas** em tabela curta (tamanho, dependências, portabilidade, esforço, risco no celular e no Safari) e **recomende uma** com o motivo; a pessoa decide. Ponto de partida habitual quando nada muda a conta: Canvas 2D para botões e poucas células, WebGL2 puro para campos e SDF, CSS/SVG sem JS para textura parada; biblioteca só quando poupa trabalho real (`references/stack-e-libs.md`, guia "quero X, use Y"). Bibliotecas seguem a mesma regra (decisão do autor, 2026-11-05): nada é padrão nem proibido; a tabela de rotas inclui versão, licença e o que o projeto já tem instalado, e a pessoa decide.

## Dispositivos alvo (decisão do autor, 2026-11-05)

Qualquer navegador, **com reserva**: todo efeito tem um plano B que funciona sem WebGL e sem animação (Canvas 2D, CSS/SVG ou quadro parado), escolhido por detecção de recurso (`getContext` nulo, contexto perdido, `prefers-reduced-motion`, aba oculta). Prove em Chromium e, quando o ambiente permitir, em WebKit (Safari/iPhone) e Firefox; o que não foi aberto fora do Chromium entra no relatório como "não provado".

## Cor padrão (decisão do autor, 2026-11-05)

Sem pedido de cor, use o **token de destaque do app** (`--accent`) e derive os 4 tons por `color-mix(in oklab, var(--accent) N%, var(--background))`; claro e escuro saem do tema, sem hex fixo. Paletas alternativas (lima, laranja, menta, notas, retrô) e o preto e branco de 1 bit só entram quando a pessoa pedir ou quando uma categoria pede cor própria (`--accent-2..4`).

## Régua de qualidade (decisão do autor, 2026-11-05)

O modelo de qualidade é uma peça **real, no produto, com prova**: o modal de 4 passos do projeto de origem (versão de computador e folha para celular, cor por token, `prefers-reduced-motion`, canvas parado fora da tela, capturas em vários tamanhos). O adaptador do projeto diz onde ela está. A régua, para qualquer peça: encaixe de 360x640 a 430x932, alvos de 44 px, texto de 15 px, sem rolagem horizontal, cor só por token, claro e escuro, movimento reduzido, console limpo e capturas olhadas. Brasa/Placa, raios, dither de modal e as demais peças são receitas, não o modelo.

**Botão principal (decisão do autor, 2026-11-05):** sem padrão único. `examples/button-brasa.html` traz **Brasa** (fundo escuro em Bayer) e **Placa** (cor cheia em dither) lado a lado, escolhidas por `data-variante`; mostre as duas e deixe a pessoa escolher por tela. Feixe fino (o último ajuste do autor: "mais fino, botão menor").

## Árvore de decisão

```
PARADO (imagem, ilustração, textura)
 ├─ já existe uma foto/arte para converter ........ scripts/dither-image.mjs (PNG) ou receita 9 (máscara CSS)
 ├─ ícone/sprite pequeno ........................... SVG de células, crispEdges, currentColor (receitas §9)
 ├─ textura repetida / degradê pontilhado .......... mask-image com SVG data-URI (receitas §9), zero JS
 └─ objeto procedural (cédula, cofre, moeda) ...... shader com quadro parado em t=3.3 (receitas §5, §6)

ANIMADO
 ├─ DECORAÇÃO (fundo, botão, cena)
 │   ├─ poucas células, borda, brasa, marca-texto ... Canvas 2D, 1 fill por cor, 24 fps (receitas §1, §13)
 │   ├─ campo contínuo / onda / chuva / fundo largo .. WebGL2 fullscreen triangle, canvas na resolução da célula (§3, §4)
 │   ├─ vários objetos com luz e profundidade ........ shader de quadro lógico (§5) ou SDF raymarching (§7)
 │   └─ transição de página/passo ..................... máscara Bayer 280x175 em 10 níveis (§12)
 ├─ DADOS (gráfico, KPI) ............................... Dither Kit (Boring Software, MIT) ou duas camadas de opacidade (§10)
 ├─ INTERAÇÃO (arrasto, cursor, hover) ................. rAF a 60 fps, DOM + canvas decorativo (§2)
 └─ MOMENTO (celebração, conquista) .................... só em marco real, uma vez, sem flash (§11)

2D x 3D leve
 ├─ 2D plano / "adesivo" / sprite ..................... sem shader ou shader simples (§8, §5)
 └─ profundidade, rotação, luz que segue o mouse ....... SDF raymarching, 140x140 lógico, 48 passos, 18 fps (§7)
     (three.js só se houver malha/modelo/material real; ver stack-e-libs.md)

TECNOLOGIA (decisão do autor, 2026-11-05: NÃO há stack padrão fixo; a cada pedido mostre 2 ou 3 rotas
 com custo e recomende uma. Detalhes e CDNs em references/stack-e-libs.md)
 ├─ sem lib, 1 arquivo HTML ............................ WebGL2 puro (examples/dither-field.html)
 ├─ React ................................................ examples/react-dither-canvas.tsx (canvas criado no efeito)
 ├─ muitos efeitos/post-process ......................... ogl, regl ou twgl (scripts/snippets/)
 ├─ só CSS/SVG (sem JS) ................................. scripts/snippets/css-only.html
 └─ sem WebGL2 no alvo ................................... Canvas 2D ou gradiente CSS de reserva
```

## Pedidos que viram arquivo ou script (workflows/)

| Pedido | Tecnica preferida | Workflow | Script / exemplo |
|---|---|---|---|
| Converter uma imagem em dither, pixel-art de N cores, halftone, hachura | Python (Pillow + numpy) | `workflows/imagem-para-dither.md` | `scripts/python/dither_image.py` |
| Fundo animado em dither (hero, painel, card) | Canvas 2D (leve) ou WebGL (mais rico) | `workflows/fundo-animado.md` | `scripts/js/dither-canvas.js`, `scripts/js/dither-gl.js`, `examples/bg-animado-canvas.html`, `examples/shader-gradient-map.html` |
| Transicao de pagina/passo pixelada, dissolve, "pixel-resolve" | WebGL overlay (modo transicao) ou mascara CSS (fallback) | `workflows/transicao-pixelada.md` | `scripts/js/dither-gl.js`, `examples/transicao-pixelada.html` |
| Recolorir uma imagem cinza por paleta (trocar tema sem regerar) | Filtro SVG discreto ou gradient-map em shader | `workflows/tingir-por-paleta.md` | `scripts/js/svg-tone-filter.js`, `scripts/python/palette_tools.py`, `examples/tingir-paleta-svg.html` |
| Objeto/ilustracao feito por codigo (moeda, nota, icone, adesivo) | Python procedural com rampas de 4 tons + Bayer | `workflows/ilustracao-procedural.md` | `scripts/python/procedural_sticker.py` |
| Pixel-art nativa (grade logica, `image-rendering: pixelated`) | Gerar sem antialias e validar a grade | `workflows/pixel-art-nativa.md` | `scripts/python/dither_image.py` (modo pixel-grid) |
| Halftone 2D/3D, gravura, hachura | Shader (hachura/halftone) ou Python | `workflows/halftone-e-hachura.md` | `examples/halftone-hachura.html` |
| UI com realces: sombra pontilhada, marcador, confete, rabiscos desenhados | Canvas 2D + SVG/CSS | `workflows/rabiscos-e-marcadores.md` | `scripts/js/dither-canvas.js`, `scripts/js/doodle-mask.js`, `examples/rabiscos-clip.html` |
| Animacao como arquivo (GIF, PNG-seq, WebM/MP4: logo, reveal, pixel-resolve, loop) | Python gera os quadros | `workflows/animacao-em-arquivo.md` | `scripts/python/dither_anim.py` |
| Gerar um conjunto de rabiscos SVG (brush, engrave, pixel) | Gerador em Python + mascara CSS | `workflows/rabiscos-e-marcadores.md` | `scripts/python/doodle_gen.py` |
| Halftone 3D (esfera, cubo) sem three.js | Fragment shader com normal analitica | `workflows/halftone-e-hachura.md` | `examples/halftone-3d.html` |
| Pagina de hero completa com 1 a 2 focos de dither | Composicao de motores baratos | `workflows/hero-completo.md` | `examples/hero-completo.html` |
| Objetos que migram entre paginas/passos (morph continuo) | FLIP por slots + dither por quadro | `references/animacao.md` (secao 3) | `scripts/js/motion-helpers.js` (`flipSlots`), `examples/flip-slots.html` |
| Provar que funciona (celular, console, layout) | Playwright + prints | `workflows/verificar-responsivo.md` | `scripts/verify/serve.mjs`, `shots.cjs`, `check-layout.cjs` |

Pedido hibrido ("hero com fundo em dither, titulo e botao com relevo, entrada pixelada"): combine. Fundo = Canvas 2D; entrada = WebGL ou CSS `steps()`; botao = CSS (sombra dura). Um motor por superficie, nunca tudo em WebGL.

## Mini workflows

### W1. Recriar uma referência em dither
1. Pegue a referência (imagem, vídeo, link) e descreva em 3 linhas: **objeto, movimento, paleta, densidade da trama, tamanho da célula**. Se for vídeo ou site, capture 3 quadros (`scripts/capture.mjs --times`).
2. Classifique na árvore de decisão (parado/animado, decoração/dados, 2D/3D).
3. Escolha o algoritmo: ordenado (Bayer 4x4/8x8: trama regular, serve para animar), ruído azul (orgânico), difusão de erro (só imagens paradas: Floyd-Steinberg, Atkinson). Ver `references/algoritmos.md`.
4. Parta do exemplo mais próximo em `examples/` e mude só os parâmetros do estilo (célula, tons, frequências, limiares). Copie a receita de `references/receitas.md`.
5. Ligue a cor aos tokens (W7). Capture, compare lado a lado com a referência, ajuste a célula e o contraste.
6. Entregue com prova (W9) e diga o que se afastou da referência.

### W2. Botão animado (Brasa/Placa com feixe de luz)
1. Abra `examples/button-brasa.html` (Canvas 2D, sem libs). Receita completa: `receitas.md` §1.
2. Estrutura: contêiner `data-aceso` + feixe nítido + cópia borrada + `<button>` com `<canvas aria-hidden>` dentro.
3. Campo: células de 2 px, Bayer 8x8, ~24 fps, um `fill` por cor; "acende" (nível 0..1 suavizado) em hover, foco e toque.
4. Feixe: `offset-path: rect(0 auto auto 0 round 16px)` num anel de 1 px (máscara `exclude`/`xor`), `@supports` esconde se faltar.
5. Texto: escolha branco ou escuro pelo **contraste calculado**; halo da cor da placa no `text-shadow` na variante Placa.
6. Movimento reduzido: feixe parado em `offset-distance: 14%`, `nivel = alvo`, sem `scale` no `:active`.

### W3. Fundo ou campo em shader
1. Abra `examples/dither-field.html` (WebGL2, modos maré, ondas e chuva). Receita: `receitas.md` §3 e §4.
2. Canvas na resolução da célula (`celDev = round(cell*dpr)` inteiro), `image-rendering: pixelated`, triângulo de tela cheia por `gl_VertexID`.
3. Fórmula: campo suave -> `lum` -> `floor(lum*3 + bayer8(cell))` -> uma das 4 cores `uP[0..3]` lidas dos tokens.
4. Ciclo de vida: `IntersectionObserver` + `document.hidden` + `prefers-reduced-motion` (um quadro em `t=3.3`). `ResizeObserver` sem recompilar.
5. Fallback sem WebGL2 (gradiente CSS) e sem `getContext` nulo quebrando a página.

### W4. Cena de objetos (pixel ou 3D leve)
1. Abra `examples/scene-objects.html` (parte A: quadro lógico pixel; parte B: SDF). Receitas: `receitas.md` §5 a §8.
2. Pixel: quadro lógico pequeno + zoom inteiro; escala dos objetos `min(uRes.y/150., uRes.x/250.)`; `P = floor(gl_FragCoord.xy)` antes do Bayer.
3. 3D leve: SDF de cada forma, raymarching (48 passos, `t += d*.85`), luz Lambert + Fresnel que segue o mouse, `lum` -> Bayer -> **gradient map** `--d0..--d3` derivado de `--accent`.
4. Morph entre formas misturando distâncias (`mix(da,db,smoothstep(...))`), passo menor durante o morph.
5. Teste em 390 e 1280 px: objeto não corta, não sobra espaço morto.

### W5. Gráfico em dither
1. Prefira o **Dither Kit** (Boring Software, MIT, <https://github.com/Boring-Software-Inc/dither-kit>), mantendo o aviso de licença; API em `receitas.md` §10.
2. Sem o kit: densidade por coluna, limiar Bayer 8x8, **duas opacidades da mesma cor** (ligada e ~0,4x) em vez de buracos, contorno do topo a 0,72.
3. `label` vira texto alternativo; dê também uma tabela ou resumo em texto. `config` e `data` estáveis (`useMemo`).
4. Em captura espere 6 a 8 s (SwiftShader); legenda e tooltip precisam de contraste sobre o grão.

### W6. Dither de uma imagem parada
1. `node scripts/dither-image.mjs entrada.png saida.png --algo bayer --cell 2` (Bayer 8x8; `--algo bayer-n --size 4` para outras; lista: `--list`). Para foto: `--algo floyd-steinberg` ou `atkinson`. Sem imagem à mão: `--make-test teste.png`.
2. Paleta vinda do projeto: `node scripts/resolve-tokens.mjs pagina.html --vars=--c0,--c1,--c2,--c3 --schemes dark --format csv --quiet` e passe a `--palette`.
3. Matriz para colar no shader/JS/CSS: `node scripts/bayer.mjs 8 --format glsl|js|css`.
4. Imagem em dither não vira CSS: salve como PNG com `image-rendering: pixelated` e dimensões múltiplas da célula.

### W7. Adaptar ao tema e aos tokens
1. Descubra os tokens do projeto: cor de marca (`--accent`), fundo, texto, `data-theme`/`class` do tema.
2. Rampa de 4 tons por `color-mix(in oklab, var(--accent) N%, var(--background))` do fundo ao destaque; **no claro o destaque escurece** (`receitas.md` §0, §16).
3. Canvas/shader: função `rgbDe(el, css)` (sonda `<span>` com `transition:none` + canvas 1x1). Releia com `MutationObserver` em `<html>` (`style`, `class`, `data-theme`) e em `prefers-color-scheme`.
4. Categorias fixas (ouro, turquesa, roxo) viram `--accent-2..4` do projeto; só a marca troca com a paleta.
5. Nunca hex como padrão. Constantes só para branco/preto de brilho e sombra. Teste trocando `--accent` e o tema.

### W8. Interação e momentos (arrasto, cursor, celebração, transição)
1. Arrasto: mapa logarítmico, passo com ímãs, `setPointerCapture`, `role="slider"` com teclado completo (`receitas.md` §2). Cursor customizado só para mouse.
2. Celebração: só em marco real, uma vez, `role="dialog"`, `aria-live`, foco no botão, `Esc` fecha, sem flash de tela cheia (WCAG 2.3.1) (§11).
3. Transição: dissolução Bayer por máscara, 600 ms, limpar máscaras no fim; reduzido = troca direta (§12).
4. Tipografia pixel: Jersey 25, Pixelify Sans, Doto etc.; espere `document.fonts.load` antes de medir (§15).

### W9. Provar e entregar
1. `export NODE_PATH=$(npm root -g)` e rode `node scripts/capture.mjs pagina.html --widths 390,1280 --wait 1800 --fail-on-error --out CAMINHO`.
2. **Abra as imagens**: células do mesmo tamanho, cor do token, contraste do texto, cortes no celular, bordas sem linha sólida.
3. Repita com `--reduced-motion` (quadro parado deve parecer arte) e sem WebGL2 (`getContext -> null`).
4. `axe-core` em claro e escuro; `document.documentElement.scrollWidth > innerWidth` em 390 px; contagem de canvases após StrictMode.
5. `node scripts/fps-probe.mjs pagina.html --seconds 6` só para comparar variantes (ver aviso).
6. Entregue o **link ou arquivo**, o que ficou fraco dito sem rodeio e o que **não** foi provado (GPU real, celular, Safari, Firefox). Detalhes: `references/prova-e-captura.md`.

### W10. Escolher com a pessoa (referências e variantes)
1. Pesquise em paralelo (Mobbin para telas e fluxos, web para galerias) e monte uma **galeria numerada** (V1.., R1.., M1..), cada item com "levar" e "evitar".
2. A pessoa escolhe por ids; funda o que ela curtiu em variantes **novas**, duplicando as anteriores, e registre cada uma (letra, nome, pasta, estado, uma frase).
3. Mantenha a mesma URL do artefato nas rodadas. Detalhes: `references/workflow-referencias.md`.

## Galeria de inspiração (escolha na hora)

Pedido do autor (2026-11-05): estas peças são **referência para se inspirar, não receitas obrigatórias**. A ideia é só um ponto de partida: a cada pedido, mostre 2 ou 3 delas que combinem, misture ou invente outra, e a pessoa escolhe.

| Peça | Onde está a receita |
|---|---|
| Gráficos em dither (barras, linhas, áreas, rosca, sparkline) | `receitas.md` §10 |
| Cofre que abre, cédulas, impressora de dinheiro | §6 e §11 |
| Notas dos pacotes no seletor de créditos (volume ao clicar, níveis) | §18 e §6 |
| Fundos: campo de 4 tons, caixa com fade, raios, ondas, chuva | §3 e §4 |
| Botão com feixe de luz (Brasa/Placa), cursor Feixe, fonte pixel | §1, §2 e §15 |
| Objetos 3D leves por SDF, adesivos de 5 tons, cena de objetos | §7, §8 e §5 |
| Rota com van, vidro líquido sobre dither, dissolução entre páginas, marca-texto | §14, §17, §12 e §13 |
| Celebração (confete, contador, cofre) e paletas trocáveis | §11 e §16 |

## Índice de arquivos

| Arquivo | Para quê |
|---|---|
| `references/algoritmos.md` | Bayer, ruído azul, Floyd-Steinberg, Atkinson, halftone, ordenado x difusão, paletas e linear x gama |
| `references/stack-e-libs.md` | Canvas2D, WebGL2, shader puro, ogl/regl/twgl/three/pixi/p5, SVG/CSS, libs prontas, trade-offs, versões e CDNs, "quero X, use Y" |
| `references/receitas.md` | 18 receitas com código: cor por token, botão, arrasto/cursor, campo, fundo de caixa, cena pixel, arte procedural, SDF, adesivos, máscaras CSS, gráfico, celebração, dissolução, marca-texto, rota, fontes, paletas |
| `references/animacao-e-performance.md` | fps alvo, célula inteira, ciclo de vida do laço, custo de shader/CPU, contextos, medir |
| `references/acessibilidade-e-reduced-motion.md` | reduced motion peça a peça, WCAG 2.2.2/2.3.1, alt text, contraste, foco, toque |
| `references/prova-e-captura.md` | Playwright + SwiftShader, matriz de capturas, o que olhar, protótipo HTML único |
| `references/armadilhas.md` | o que quebrou de verdade (sintoma, causa, correção) |
| `references/workflow-referencias.md` | pesquisar referências, galeria numerada, variantes duplicadas, gosto do autor |
| `examples/button-brasa.html` | botão Canvas 2D com feixe de luz, Brasa e Placa, seletor de tema e cor |
| `examples/dither-field.html` | WebGL2: campo de 4 tons (maré, ondas, chuva), HUD, fallback |
| `examples/scene-objects.html` | cena em pixel (moeda, pacote, cartão) e SDF 3D leve com morph |
| `examples/react-dither-canvas.tsx` (+ `.demo.tsx`/`.demo.html`) | hook e componente React genéricos, seguros em StrictMode |
| `scripts/capture.mjs` | capturas (larguras, temas, reduzido, relógio virtual, `--fail-on-error`) |
| `scripts/fps-probe.mjs` | cadência do rAF, p95/p99, `--cpu-throttle`, `--webgpu` |
| `scripts/dither-image.mjs`, `bayer.mjs`, `blue-noise.mjs`, `resolve-tokens.mjs` | converter imagem (Bayer, Floyd-Steinberg, Atkinson, paleta fixa ou `--palette kmeans:N`), gerar matrizes (JSON, GLSL, JS, CSS), ruído azul, resolver tokens para hex |
| `scripts/shader-playground.html` | editor de fragment shader ao vivo com prelúdio de dither |
| `scripts/snippets/*.html` (12) | o mesmo campo dither em WebGL2 puro, WebGPU, Canvas2D, CSS puro, SVG filter, ogl, regl, twgl, three (post-processing), pixi (filtro), p5 e Paper Shaders; os de biblioteca precisam de rede (CDN com versão fixa) |
| `scripts/frame-stability.mjs` | mede quanto a trama "ferve" entre quadros (Bayer ~1%, Floyd-Steinberg ~25%) |
| `scripts/selftest.mjs`, `test-playground.mjs`, `test-snippets.mjs` | autotestes dos scripts (114), do playground (26) e dos snippets (24) |
| `references/adaptador-modelo.md` | modelo do adaptador do projeto (tokens, motor local, peça-modelo, gosto, armadilhas locais) |
| `workflows/*.md` (11) | imagem para dither, fundo animado, transição pixelada, tingir por paleta, ilustração procedural, pixel-art nativa, rabiscos, halftone e hachura, animação em arquivo, hero completo, verificar responsivo (tabela "Pedidos que viram arquivo ou script") |
| `references/algoritmos-formulas.md`, `webgl-shader.md`, `canvas2d.md`, `svg-css.md`, `python-imagem.md`, `animacao.md`, `paletas.md`, `bibliotecas.md`, `performance-a11y.md`, `verificacao.md`, `estilos-e-referencias.md`, `aprendizados-3-rodadas.md`, `ideias-de-cenas.md` | fórmulas e código por motor (GLSL, Canvas 2D, SVG/CSS, Python), movimento, paletas e contraste, estilos de referência e ideias de cenas |
| `scripts/python/*.py` (6) | `dither_image` (Bayer, Floyd-Steinberg, Atkinson, halftone, hachura), `dither_anim` (GIF/WebM), `procedural_sticker`, `doodle_gen`, `palette_tools`, `make_sheet` (Pillow + numpy) |
| `scripts/js/*.js` (5) e `scripts/verify/*` (3) | `dither-gl`, `dither-canvas`, `svg-tone-filter`, `doodle-mask`, `motion-helpers`; `serve.mjs`, `shots.cjs`, `check-layout.cjs` |
| `examples/*.html` (13) e `assets/` | exemplos autônomos (fundo, transição, halftone 3D, hero, FLIP por slots, rabiscos, tingir) e imagens de apoio; índice em `examples/README.md` |
| `evals/evals.json` | 12 pedidos de teste com expectativas (formato do skill-creator) |

## Adaptador por projeto

A skill é genérica. O que é do projeto fica num adaptador dentro dele, descoberto nesta ordem: `.cx/dither/adaptador.md`, a seção do `AGENTS.md` ou `CLAUDE.md` (até 3 linhas apontando o arquivo) e `docs/design/dither-animacoes/`. Ele diz: quais são os tokens de cor e de tema; se há motor ou componentes locais para reaproveitar (e onde); qual peça real é o modelo de qualidade; paletas alternativas aprovadas; o gosto já registrado (vereditos, o que irritou); armadilhas locais. Sem adaptador, pergunte as 6 perguntas e siga as decisões acima. Modelo em [`references/adaptador-modelo.md`](references/adaptador-modelo.md).

## Receita minima (para nao depender de arquivo nenhum)

Dither ordenado em 4 tons, a base de quase tudo:

```
bayer8[x%8][y%8]  ->  limiar t em (0,1)         // (v + 0.5) / 64
tom = min( floor( lum * 3 + t ), 3 )            // lum em [0,1], 4 tons = indices 0..3
cor = rampa[tom]
```

- Matriz Bayer por recursao: `M(2n) = [[4M, 4M+2],[4M+3, 4M+1]]`, normalizada `(v+0.5)/N^2`.
- Em GLSL sem arrays: `b2(a)=fract(a.x/2.+a.y*a.y*.75); b4(a)=b2(.5*a)*.25+b2(a); b8(a)=b4(.5*a)*.25+b2(a);` (a = coordenada de celula inteira).
- **Celula de dither em unidades de TELA, nao da textura**: `px_canvas = cell_css * DPR / escala_do_objeto`. Sem isso o grao borra quando o objeto encolhe ou morfa.
- Rampa de 4 tons por material (sombra, medio-escuro, medio-claro, brilho), com luz sempre da mesma direcao (cima-esquerda) em todos os objetos para formarem um universo so.
- Linhas finas (filetes, guilhoche, texto) em tom forcado, SEM dither; contorno de tinta de 3 px; adesivo branco de 12 px; sombra plana deslocada.
- Para pixel-art: `image-rendering: pixelated` (ou textura NEAREST sem mipmap) e tamanhos em multiplos inteiros da celula.

## Checklist de qualidade (passe antes de entregar)
- [ ] **Foco unico**: o dither esta em 1 a 2 elementos, nao na tela inteira.
- [ ] **Leitura**: texto >= 12 a 13 px, sem dither por tras; titulo com contraste >= 4.5:1 (3:1 se grande). Veja `references/paletas.md`.
- [ ] **Paleta**: rampas ordenadas do escuro ao claro; testada sobre fundo azul, branco e escuro; objeto da cor do fundo so le com contorno/adesivo.
- [ ] **Grade**: celula consistente na tela (px_canvas calculado por DPR e escala); sem meia-celula nas bordas; `image-rendering` correto.
- [ ] **Movimento**: fundo a 12 a 15 fps; 1 ou 2 elementos animados por tela; `prefers-reduced-motion` mostra um quadro estatico; pausa com `document.hidden` e fora da viewport; nada pisca mais de 3 vezes por segundo.
- [ ] **Desempenho**: canvas pequeno (fundo em 1/CELL da resolucao), DPR limitado a 1.5 em WebGL, um contexto por superficie, contexto destruido ao fechar.
- [ ] **Fallback**: sem WebGL ou sem JS ha imagem pre-assada, gradiente CSS ou quadro textual; a informacao nunca vive so no dither.
- [ ] **Mobile**: 360x640 a 430x932 sem rolagem horizontal; botao primario dentro da viewport; alvos de toque >= 44 px.
- [ ] **Verificado de verdade**: servido por HTTP (nunca `file://`), prints abertos e OLHADOS, console sem erros.

## Comandos rapidos
```bash
# imagem -> dither (algos: bayer2|bayer4|bayer8|floyd|atkinson|halftone|hatch; paleta escuro->claro)
python3 scripts/python/dither_image.py in.png out.png --algo bayer8 --preset pixel-azul --cell 4
python3 scripts/python/dither_image.py in.png out.png --algo bayer8 --palette "#0A1A7A,#7BE8FF,#F5F7FF,#FFE24A" --pixel-grid 128
# paletas e contraste
python3 scripts/python/palette_tools.py presets
python3 scripts/python/palette_tools.py contrast "#FFE24A" "#0A1A7A"
# animacao como arquivo (modos: reveal|pixel-resolve|sweep|breathe|wipe-overlay); GIF + WebM com alfa
python3 scripts/python/dither_anim.py reveal in.png -o out/reveal.gif --preset notas --fps 20 --duration 1.4 --video out/reveal.webm
# conjunto de rabiscos SVG (currentColor) com prancha de conferencia
python3 scripts/python/doodle_gen.py --style all --out ./doodles --seed 7 --contact
# objeto procedural + adesivo; prancha sobre varios fundos
python3 scripts/python/procedural_sticker.py coin out.png --ramp ouro --cell 4
python3 scripts/python/make_sheet.py a.png b.png -o prancha.png --bgs azul,branco,escuro,xadrez --labels
# servir e verificar
node scripts/verify/serve.mjs . 8790
node scripts/verify/shots.cjs http://127.0.0.1:8790/examples/bg-animado-canvas.html ./prints --sizes 390x844,1280x800
```
Exemplos autonomos (sirva por HTTP): `examples/*.html`, descritos em `examples/README.md`; indice dos scripts em `scripts/README.md`. Imagens e rabiscos de apoio: `assets/`. Em duvida sobre uma flag, rode o script com `--help`.

## Como adaptar a qualquer pedido
1. Classifique pela tabela; se cair em duas linhas, divida em duas superficies.
2. Escolha o motor mais barato que entrega o look: CSS/SVG < Canvas 2D < WebGL. Suba de nivel so se precisar de textura, 60 fps ou efeito por pixel.
3. Defina paleta de 3 ou 4 tons e a celula (2 a 4 css px para objetos, 4 a 6 para fundos).
4. Gere uma versao pequena, olhe o print, ajuste celula e rampa antes de animar.
5. Anime por ultimo, com mola (Motion) ou `steps()`, e valide reduced-motion.
6. Entregue 2 a 3 variacoes quando o gosto e incerto, todas salvas e catalogadas; diga o que ficou duvidoso.

## Padroes de entrega
- Prancha ou galeria navegavel, nao so um arquivo solto.
- Nada se apaga: versoes multiplas salvas.
- Explique o que ficou duvidoso (ex.: "a IA nao respeitou a grade 8x8, normalizei e validei por script").
- Onde nao tiver certeza de uma API ou flag, marque "verificar" e teste antes de afirmar.

## Regras de ouro

1. **Cor por token, sempre.** `getComputedStyle` para canvas/shader; teste trocando tema e `--accent`.
2. **Célula inteira em px do dispositivo.** `celDev = round(cell*dpr)`; canvas na resolução da célula; `pixelated`.
3. **24 fps para pixel, 18 para SDF, 60 só para cursor e arrasto.** Tempo do relógio, não soma de `dt`.
4. **Todo laço pausa**: fora da tela, aba oculta, e com movimento reduzido vira **um quadro** em `t=3.3`.
5. **Dither nunca comunica estado sozinho**: texto, ícone ou forma junto. Decorativo = `aria-hidden`; informativo = `role="img"` + `aria-label`.
6. **Contraste no pior quadro**: texto sobre trama com painel quase sólido, halo ou densidade baixa no miolo.
7. **Canvas criado dentro do efeito e removido na limpeza** (StrictMode). `loseContext` só no que você criou. Máximo ~16 contextos por página.
8. **Sem WebGL2 não quebra**: gradiente CSS ou Canvas 2D de reserva, mensagem curta, nunca caixa vazia.
9. **Duplique variantes, nunca sobrescreva.** Mostre opções numeradas e deixe a pessoa escolher.
10. **Prove olhando**: abra as capturas (claro/escuro, 390 e 1280, reduzido, console limpo) antes de dizer "pronto".
11. **Seja honesto**: SwiftShader prova que desenha certo, não que roda rápido; GPU real, celular, Safari e Firefox só valem se foram testados.
12. **Sem neon, sem gradiente em texto, sem "AI slop"**; um momento de movimento autoral por tela.

## O que não foi provado neste pacote

Os scripts Python/JS, os 11 workflows e os exemplos vindos da antiga `dither-motion` foram revisados na fusão, mas não reexecutados depois dela; rode `scripts/selftest.mjs` (100 verificações) e um dos comandos de "Comandos rápidos" antes de confiar. FPS em GPU real, celular, Safari/Firefox; vidro líquido (lente de refração) fora do Chromium (o laboratório de origem viu refração só no Chromium, o cabeçalho da lib `vitrio` diz Chrome, Safari e Firefox: testar antes de afirmar); `@number-flow/react` e `motion` sem teste visual neste pacote; WebGPU só por software (SwiftShader); dither ancorado à superfície em 3D (Pope/Dither3D) está descrito, não implementado; ImageMagick 7 e Aseprite não foram executados; `offset-path: rect()` fora do Chromium (o botão tem `@supports`); vazamento de WebGL ao redimensionar no iOS e o teto exato de contextos (relatados, não medidos); fontes Google (Jersey 25 etc.) não carregam no sandbox das capturas.

## Procedência e licenças

Receitas colhidas do laboratório de design do projeto de origem (botão Gerar Pix, palco de cenas, cursor Feixe, rota, celebração) e generalizadas. **Dither Kit**: Boring Software, MIT declarado no README (o repositório não traz arquivo LICENSE: registre a procedência e confirme antes de publicar). **Bayer/ruído azul/difusão**: ver `references/algoritmos.md` (Wikipedia, Surma "Ditherpunk", Ulichney 1993). `canvas-confetti` 1.9.4 (ISC). Referência é inspiração, não cópia: código de terceiros só com licença e procedência registradas; imagem de marca de terceiros não vai para o produto.
