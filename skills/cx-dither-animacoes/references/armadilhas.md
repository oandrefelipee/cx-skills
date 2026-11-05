# Armadilhas (o que quebrou de verdade e como corrigimos)

Cada item: **sintoma → causa → correção**. A maioria saiu do laboratório de pagamentos do projeto de origem (2026-11-03 e 2026-11-04); os marcados com **[teste]** foram reproduzidos ao escrever os exemplos deste pacote; os marcados com **[relatado]** vieram de pesquisa e não foram reproduzidos aqui.

## Índice
1. [Cor e tokens](#1-cor-e-tokens)
2. [Canvas 2D e WebGL](#2-canvas-2d-e-webgl)
3. [Shader (GLSL)](#3-shader-glsl)
4. [CSS e layout](#4-css-e-layout)
5. [React e ciclo de vida](#5-react-e-ciclo-de-vida)
6. [Movimento, acessibilidade e desempenho](#6-movimento-acessibilidade-e-desempenho)
7. [Teste e captura](#7-teste-e-captura)
8. [Processo e gosto do autor](#8-processo-e-gosto-do-autor)
9. [Achados do chat (engenharia reversa)](#9-achados-do-chat-engenharia-reversa)

## 1. Cor e tokens

- **Canvas pinta preto/transparente ao usar `var(--x)`** → `fillStyle` não resolve `var()` (nem sempre `color-mix`/`oklch`, sobretudo em navegadores mais velhos) → resolva por uma sonda `getComputedStyle(span).color` dentro do elemento e converta num canvas 1×1 (`rgbDe`, receita 0). **[teste]**
- **Cor lida "atrasada" depois de trocar o tema** → com `prefers-reduced-motion` o app zera durações e liga transições curtas em tudo, a sonda lê o meio da transição → sonda com `transition: none; animation: none`.
- **Variável que "some"** → `--surface: var(--surface-secondary)` no mesmo elemento vira referência circular → remapeie só em escopos filhos, ou derive por `color-mix` de um token de outra família.
- **Tema trocou e o canvas ficou com a cor antiga** → leitura só na montagem → `MutationObserver` em `style`/`class`/`data-theme` do `<html>` (+ `prefers-color-scheme`) que relê e redesenha (também o quadro parado de movimento reduzido). **[teste]**
- **Dither "furado" no tema claro mostra branco** → células apagadas deixam o fundo aparecer → duas opacidades da mesma cor (cheia e ~0,4×) em vez de buracos, ou rampa invertida (destaque mais escuro no claro).
- **Texto ilegível sobre a cor cheia da Placa** → a cor de marca varia (lima aceita texto escuro, azul exige branco) e o dither escuro passa por baixo das letras → escolher branco/escuro pelo **contraste calculado** e pôr halo da cor da placa no `text-shadow`. **[teste]**
- **Hex fixo escondido no shader** → vira a cor "padrão" para sempre → toda cor entra por uniform lido de token (`uC0..uC3`, `uP[4]`); constantes só para branco/preto de brilho e sombra.
- **Cor de loja/hue no confete** → o `canvas-confetti` só entende hex → converter `hsl()`/`oklch()` para hex no motor antes de passar.

## 2. Canvas 2D e WebGL

- **Canvas pixelado sai com células de tamanhos diferentes** → `cell × devicePixelRatio` não inteiro (dpr 1,25/1,5) → `celDev = round(cell*dpr)` e `style.width = cols*celDev/dpr px`. **[teste]**
- **Canvas com `inset:0` não preenche** → canvas é elemento substituído: `inset` sozinho não estica → `width:100%; height:100%` (ou um wrapper com `size-full`).
- **Pixels esticados** → `layout`/`layoutId` do Framer/motion num ancestral do canvas, ou `transform: scale` não inteiro → canvas fora de elementos com layout animado; zoom inteiro.
- **Contexto WebGL morto depois do StrictMode** → `loseContext()` na limpeza de um canvas que o React reutiliza na segunda montagem → criar o `<canvas>` **dentro do efeito** e removê-lo na limpeza (o hook do pacote faz). O `PixelCanvas` original optou por nunca chamar `loseContext`. **[teste: 2 canvases após StrictMode, sem duplicar]**
- **Contexto perdido do nada** → efeito recriado por props instáveis (um objeto novo por render) → deps estáveis e o resto por `ref`; há teto de ~16 contextos por página **[relatado]**.
- **Vazamento no iOS Safari ao redimensionar canvas WebGL** **[relatado]** → redimensione só quando a grade de células muda.
- **Shader recompilando a cada resize** (modo `fill` do `PixelCanvas`) → recompile só quando o corpo muda; no resize atualize `viewport`.
- **Halo escuro ao redor de cena transparente** → saída não pré-multiplicada → com `premultipliedAlpha: true` devolva `vec4(cor*alfa, alfa)`.
- **Laço roda com a aba oculta/fora da tela/movimento reduzido** → só `requestAnimationFrame` → `IntersectionObserver` + `document.hidden` + `matchMedia`. **[teste]**
- **Canvas 2D lento** → um `fillRect` por célula ou `getImageData` por quadro → um path por cor (`rect`… `fill`), `ImageData` reutilizado, sonda de cor só na releitura.
- **Sem WebGL2** → gradiente CSS de reserva (`[data-sem-webgl]`) e mensagem curta; nunca uma caixa vazia. **[teste]**
- **Gráfico em dither "em branco" na captura** → ~6 a 8 s para aparecer sob SwiftShader (dois contextos) → esperar mais; não é bug. **[teste do relato]**

## 3. Shader (GLSL)

- **Bayer com deslocamento fracionário** → usar `gl_FragCoord` sem `floor` → `P = floor(gl_FragCoord.xy)` antes de `shade`/`bayer`.
- **Eixo Y invertido** → `gl_FragCoord` tem origem embaixo; o DOM, no topo → `cy = rows - 1 - cell.y` quando precisar contar do topo; no uniform das lentes use origem embaixo.
- **Nuvens em dither viram faixas** → distância calculada só no eixo x → distância em pixels do quadro nos dois eixos, normalizada pela elipse (`length(d/vec2(46.,7.))`).
- **Objetos cortados no celular** → escala só pela altura do quadro → `S = min(uRes.y/150., uRes.x/250.)`. **[teste]**
- **Glifo de 3×5 com dígito errado** → comparação de `float` sem tolerância → `mod(floor(v/exp2(bit) + .001), 2.)`.
- **Laço com limite variável não compila (WebGL1/GLSL ES 1.00)** → índice constante no `for` e `if (fi < n)` dentro; em GLSL ES 3.00 (WebGL2) o limite pode ser uniform, mas mantenha pequeno.
- **Array de uniform com índice dinâmico** → válido em GLSL ES 3.00 (`uP[ix]`); em ES 1.00 use `ix<.5?a:(ix<1.5?b:...)` como o `PRELUDE`.
- **Raymarching com buraco/serrilha em morph** → a mistura de duas distâncias não é um SDF exato → passo menor (`t += d*0.72..0.85`) e mais passos só se precisar.
- **"Comb" (colunas esticadas) na borda de uma lente** → bisel grande e deslocamento uniforme → bisel ≤ 12 px, offset 0,8 e jitter por pixel.
- **Pontos escuros na franja do fade** → usar o tom escuro na borda → tom médio e opacidade que cai com o fade.
- **Quinas brancas e linha sólida na caixa** → painel com `shadow` e fundo próprio por baixo do canvas → remova; o dither precisa nascer da cor da própria caixa.
- **Raios ⚡ demais e rápidos** → poucos por vez, lentos, com pausas (`per` aleatório por faixa).

## 4. CSS e layout

- **Vidro (`backdrop-filter`) deixa de borrar** → ancestral com `filter`, `opacity < 1`, `mask`, `clip-path` ou `mix-blend-mode` cria uma raiz de backdrop → nenhum desses em ancestrais de peças de vidro; limpe o `clip-path` ao fim da entrada; anime a opacidade nas peças, não no contêiner; um irmão com `mix-blend-mode` no palco já desliga o blur do véu (nenhum efeito usa blend).
- **Alguns componentes de biblioteca pulam o `backdrop-filter`** (HeroUI v3 em certas versões) **[relatado]** → confirme no DevTools antes de depender.
- **Feixe de luz não aparece** → navegador sem `offset-path: rect()` → `@supports` esconde o feixe; o botão continua válido. Máscara em anel precisa de `-webkit-mask-composite: xor` + `mask-composite: exclude`. **[teste no Chromium; Safari/Firefox não testados]**
- **Aro cônico animado num painel de 1140 px** → laço infinito de pintura → medir na aba Performance; trocar por canvas ou `conic-gradient` estático com `@property` só onde pequeno.
- **Palco escalado (`transform: scale`)** → a projeção do `layoutId` pode errar → spike de 30 min antes; plano B: `AnimateView`/View Transitions do React.
- **Texto pequeno no celular** quando o palco só escala → layout próprio para celular (folha de baixo para cima, texto ≥ 15 px, alvos ≥ 44 px).
- **Vazio de ~90 px no passo 3** e **leque cortado pelo rodapé em 844 px** → conferir cada passo em 360/390/430 px, não só o primeiro.
- **Selecionar texto e arrastar disputam** → `touch-action: none; user-select: none` só no controle de arrasto.
- **Fonte pixel mede errado** → número medido antes da fonte carregar → `await document.fonts.load('1em "Jersey 25"')` e remeça.

## 5. React e ciclo de vida

- **Passo 1 volta invisível** → `AnimatePresence mode="popLayout"` com `exit` só com `transition`, sem valor → `exit={{ opacity: 0 }}` com valor real.
- **Efeito duplica canvas ou listeners em StrictMode** → limpeza incompleta → todo `addEventListener`/`observe`/`setTimeout` desfeito no `return`.
- **Modal quebra na hidratação** → monta antes da hidratação → render só depois de hidratar.
- **Re-render por quadro** → estado do React atualizado no laço → `MotionValue`/`ref`; leia no laço.
- **Dados do gráfico novos a cada render** → o motor se reconstrói → `useMemo`/constante de módulo para `config` e `data`; `replayOnData={false}` quando o dado muda por interação.
- **Typecheck do app estoura memória** → `NODE_OPTIONS=--max-old-space-size=3072` (até 6144).

## 6. Movimento, acessibilidade e desempenho

- **`MotionConfig reducedMotion="user"` não cobre** parallax por ponteiro nem o seu canvas → portão manual com `matchMedia`.
- **Cursor customizado em toque** não existe → alça fixa; cursor só para `pointerType === "mouse"`.
- **Celebração dispara em qualquer recarga** → só em marco real, uma vez, com estado guardado no servidor; nunca para o cliente final da página pública.
- **Flash de tela cheia** → nada de clarão; véu suave que entra uma vez.
- **K "palco de teatro" pesada na CPU** (~36 fps em software) → usar GPU/shader ou reduzir objetos; governador de carga.
- **Animação lenta sob SwiftShader parece bug** → compare variantes, não prometa FPS (ver `animacao-e-performance.md`).

## 7. Teste e captura

- **Acentos quebrados abrindo de `file://`** → falta `<meta charset="utf-8">` (já está no `inline_dist.py`).
- **Fontes caem em serifa nas capturas** → o sandbox não carrega Google Fonts (Bricolage, Jersey 25, Geist Mono) → diga isso; confira no artefato publicado ou numa máquina com rede.
- **Captura "no meio do frame"** → animação ao vivo → use movimento reduzido (quadro determinístico) ou o relógio virtual do `capture.mjs`; cores que dependem do tempo da página (acento rosa em ~18 s, laranja em ~5 s) variam entre capturas.
- **Console cheio de `GL Driver Message`/`GPU stall`** → ruído de SwiftShader; filtre.
- **Query string não existe no artefato publicado** → use `#hash`.
- **Hover não acende na captura** → o laço precisa de ~1 s: `hover` + espera; mova o mouse para fora antes do estado parado.

## 8. Processo e gosto do autor

- **Sobrescrever variante antiga** → ele cobrou: **duplicar**, nunca sobrescrever; registrar em `variantes.ts` e manter tudo salvo.
- **Pesquisar e decidir sozinho** → mostrar galeria numerada (V1, M2, R3…), ele escolhe por ids; combinar o que ele curtiu.
- **"AI slop"** → paleta estranha, kicker mono acima de título, gradiente em texto, borda lateral colorida, vidro decorativo, ouro/neon. Ele quer: azul da plataforma como base + cores vibrantes como opções, sem neon, fonte pixel que **não** seja a Geist Pixel, cursor pequeno estilo Apple, bordas que não existem (fundo e bloco chapados), relevo por sombra dura de um degrau.
- **"Feio e estranho, quero dither mais detalhado e feixe ao redor acendendo"** → o botão: Bayer 8×8 detalhado + feixe 1 px que acende.
- **Cinza sobre superfície colorida** → nunca.
- **Prometer retorno em números numa ilustração de dinheiro** → nunca; ilustração não é promessa.
- **Dizer "pronto" sem prova** → capturas olhadas, claro/escuro, 2 larguras, console limpo, e dizer o que **não** foi provado (GPU real, Safari, Firefox).

## 9. Achados do chat (engenharia reversa)

- **Linha ou contorno nos cantos do bloco com dither** → vinha da sombra e do fundo do painel, não do dither → tire sombra e fundo do bloco e deixe o dither se desfazer direto na cor da página num degradê de ~52 px.
- **Dither "separado da caixa"** → canvas do dither fora do painel com fundo → dither dentro do próprio bloco, sem fundo de caixa por baixo.
- **Brilho branco no topo e nas quinas do vidro** → especular da lente → tire o brilho; mantenha só a refração fina na borda.
- **Vidro transparente e gráfico ilegível sobre ele** → sem suporte atrás → miolo fosco, película e placa própria para o gráfico.
- **Raios rápidos demais** → velocidade alta na lente de fundo → lentos, poucos por vez. Cuidado: um relatório do assistente chegou a dizer "menores e mais rápidos", contra o pedido; confira a velocidade na captura em vídeo ou quadros, não no texto.
- **Zero das notas aparecia como "n"** → glifo ausente na fonte/sprite de dígitos → conferir os dez dígitos antes de entregar.
- **Selo da celebração mostrava "v1k"** → reaproveitou o efeito de publicar → celebração com efeito próprio e texto próprio.
- **Reusar o esqueleto e trocar só o shader** foi rejeitado várias vezes: variante nova muda composição, objeto e movimento, não só parâmetro.
- **Correção dita e não aplicada** é o que mais irrita: o autor compara com a captura, não com o relatório.
