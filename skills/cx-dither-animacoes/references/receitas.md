# Receitas de dither e pixel (o que foi pedido, escolhido e aprovado, e como refazer)

Cada receita diz: **objetivo**, **quando usar**, **código mínimo** (sem imports de monorepo), **o que muda o estilo**, **variações** e **armadilhas**. Os exemplos que rodam abrindo o arquivo estão em `../examples/` (provados com Playwright). Algoritmos (Bayer, ruído azul, Floyd-Steinberg, halftone) ficam em `algoritmos.md`; escolha de tecnologia em `stack-e-libs.md`.

Origem: tudo isto foi construído e aprovado no projeto de origem (botão Gerar Pix, cursor Feixe, notas, cofre, palco, rota, celebração) e generalizado aqui. O Dither Kit é de Boring Software (MIT, <https://github.com/Boring-Software-Inc/dither-kit>): a receita 10 usa ideias e a API dele; mantenha o aviso de licença se copiar código.

## Índice

0. [Cor por token (base de tudo)](#0-cor-por-token-base-de-tudo)
1. [Botão em dither com feixe de luz (Brasa e Placa)](#1-botão-em-dither-com-feixe-de-luz-brasa-e-placa)
2. [Seletor de valor por arrasto, cursor Feixe e fonte pixel](#2-seletor-de-valor-por-arrasto-cursor-feixe-e-fonte-pixel)
3. [Fundo de campo com 4 tons (Maré Bayer)](#3-fundo-de-campo-com-4-tons-maré-bayer)
4. [Fundo de caixa com fade nas bordas, raios, ondas, chuva e lentes de vidro](#4-fundo-de-caixa-com-fade-nas-bordas-raios-ondas-chuva-e-lentes-de-vidro)
5. [Cena de objetos em pixel (quadro lógico + escala inteira)](#5-cena-de-objetos-em-pixel-quadro-lógico--escala-inteira)
6. [Arte procedural: dígitos 3×5, cédulas, cofre, impressora](#6-arte-procedural-dígitos-35-cédulas-cofre-impressora)
7. [3D leve por SDF: raymarching no shader e na CPU, com morph](#7-3d-leve-por-sdf-raymarching-no-shader-e-na-cpu-com-morph)
8. [Objetos 2D planos em "adesivo" com rampa de 5 tons](#8-objetos-2d-planos-em-adesivo-com-rampa-de-5-tons)
9. [Máscaras de dither em CSS e sprites de pixel em SVG](#9-máscaras-de-dither-em-css-e-sprites-de-pixel-em-svg)
10. [Gráfico em dither](#10-gráfico-em-dither)
11. [Celebração (cofre abrindo, confete, contador)](#11-celebração-cofre-abrindo-confete-contador)
12. [Transição entre páginas por dissolução Bayer](#12-transição-entre-páginas-por-dissolução-bayer)
13. [Marca-texto em dither](#13-marca-texto-em-dither)
14. [Rota: estrada rasterizada em células](#14-rota-estrada-rasterizada-em-células)
15. [Tipografia pixel](#15-tipografia-pixel)
16. [Paletas trocáveis por variável](#16-paletas-trocáveis-por-variável)
17. [Vidro líquido sobre dither](#17-vidro-líquido-sobre-dither-lente-de-refração)
18. [Seletor de notas com volume e níveis](#18-seletor-de-notas-com-volume-e-níveis)

---

## 0. Cor por token (base de tudo)

**Objetivo:** canvas e shader não entendem `var(--x)`, `color-mix()` nem `oklch()` escritos no CSS. Resolva a cor pelo próprio navegador e refaça a leitura quando o tema ou a cor global mudar. **Regra do autor (2026-11-04):** nada de hex fixo como padrão; se a cor global do app muda, o dither muda junto.

```js
let _cv;
/** [r,g,b] 0..255 de qualquer cor CSS. A sonda é um <span> DENTRO do elemento (herda as variáveis do escopo)
 *  e não tem transição (com reduced motion muitos apps zeram durações e a leitura pegaria a cor antiga). */
function rgbDe(el, css) {
  const s = document.createElement('span');
  s.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;transition:none;animation:none;color:' + css;
  el.appendChild(s);
  const calc = getComputedStyle(s).color;       // já resolvido: color(srgb …) ou oklab(…)
  s.remove();
  _cv ||= document.createElement('canvas'); _cv.width = _cv.height = 1;
  const x = _cv.getContext('2d', { willReadFrequently: true });
  x.clearRect(0, 0, 1, 1); x.fillStyle = '#000'; x.fillStyle = calc; x.fillRect(0, 0, 1, 1);
  const d = x.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];                     // divida por 255 para uniform vec3
}
// reler quando o tema/cor mudar:
new MutationObserver(releitura).observe(document.documentElement,
  { attributes: true, attributeFilter: ['style', 'class', 'data-theme'] });
```

**Rampa de tons a partir de UMA cor de marca** (CSS, no escopo do componente):

```css
.campo{
  --p1: color-mix(in oklab, var(--accent) 20%, var(--background));  /* fundo */
  --p2: color-mix(in oklab, var(--accent) 50%, var(--background));
  --p3: var(--accent);
  --p4: color-mix(in oklab, var(--accent) 50%, white);               /* destaque */
}
:root[data-theme="claro"] .campo{ --p4: color-mix(in oklab, var(--accent) 55%, black); }
```

A rampa vai do **fundo para o destaque**: no escuro o destaque clareia, no claro ele escurece (o `FundoDither` do projeto de origem troca de rampa pela luminância do fundo real, `groundOf`). Texto sobre cor cheia: calcule o contraste (WCAG) e escolha branco ou escuro (`examples/button-brasa.html`, função `contraste`); cinza nunca em cima de superfície colorida.

**Armadilhas**
- Não remapeie `--surface` para um token da mesma família **no mesmo elemento**: vira referência circular e a variável some.
- Para lista de cores de categoria fixas (ouro, turquesa, roxo), defina `--accent-2..4` no projeto e ligue a cena a elas; só a cor de marca troca com a paleta.
- Leia a cor com o elemento certo: uma sonda no `<body>` não vê variáveis definidas num `[data-pal]` mais fundo.
- Cor lida a cada quadro custa; leia na montagem, na mudança de tema e (opcional) a cada ~30 quadros.

---

## 1. Botão em dither com feixe de luz (Brasa e Placa)

**Objetivo:** botão principal que parece "aceso": campo de dither Bayer 8×8 no fundo + um feixe de luz que corre pela borda. **Quando usar:** CTA único da tela (Gerar Pix, Comprar, Publicar). **Exemplo completo:** `../examples/button-brasa.html`. Origem: `botao-gerar.tsx` do laboratório (Brasa e Placa curtidas pelo autor).

**Anatomia**

```html
<div class="dz-botao" data-variante="brasa" data-aceso="false">
  <div class="dz-feixe dz-brilho" aria-hidden="true"><i class="dz-ponto"></i><i class="dz-ponto"></i></div> <!-- cópia borrada -->
  <div class="dz-feixe" aria-hidden="true"><i class="dz-ponto"></i><i class="dz-ponto"></i></div>          <!-- feixe nítido -->
  <button type="button" class="dz-btn"><canvas class="dz-campo" aria-hidden="true"></canvas>Gerar Pix</button>
</div>
```

**Campo de dither (Canvas 2D).** O canvas tem 1 pixel por célula de 2 px de CSS (`cols = ceil(largura/2)`), ampliado com `image-rendering: pixelated`. Para cada célula calcule um valor 0..1 e compare com o limiar Bayer: `valor - bayer8[y%8][x%8] > 0` acende. ~24 fps (`FPS = 24`); agrupe as células por cor e pinte **um `fill` por cor**.

```js
// BRASA: fundo escuro, brasas sobem do rodapé na cor do valor
const sobe  = suave(0.1, 1, v);                                   // v = y/rows
const borda = 0.45 * suave(0.78, 1, Math.abs(u - 0.5) * 2);       // brasas nas laterais
const valor = sobe * (0.42 + 0.58*onda) * (0.68 + 0.32*grao) * (0.62 + 0.5*nivel)
            + borda * (0.5 + 0.5*nivel) + 0.22 * nivel * (1 - v) * onda;
const d = valor - lim;  if (d > 0.34) quente(x,y); else if (d > 0) cor(x,y);
// PLACA: cor cheia, sombreada em dither mais escura para o canto de baixo + faixa de luz que passa
```
`onda = .5+.5*sin(u*9 + t*.9 + sin(v*5 - t*.7)*1.5)`, `grao = .5+.5*sin(u*23 - t*1.3 + v*11)`; `nivel` vai de 0 a 1 suavizado (`nivel += (alvo-nivel)*0.18`) quando o botão acende (hover, foco, toque).

**Feixe de luz (CSS puro).** Um ponto com `offset-path: rect(0 auto auto 0 round 16px)` e `offset-distance` animado de 0% a 100% percorre a borda retangular sem distorção nos lados. O ponto só aparece dentro de um **anel de 1 px**: o contêiner tem `border: 1px solid transparent` e uma máscara que exclui o miolo.

```css
.dz-feixe{position:absolute;inset:-1px;border:1px solid transparent;border-radius:17px;pointer-events:none;
  -webkit-mask:linear-gradient(#000 0 0) padding-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) padding-box,linear-gradient(#000 0 0);mask-composite:exclude}
.dz-brilho{inset:-3px;border-width:3px;border-radius:19px;filter:blur(4px)}      /* o brilho em volta é a MESMA coisa, borrada */
.dz-ponto{position:absolute;aspect-ratio:1;width:var(--w,58px);offset-path:rect(0 auto auto 0 round 16px);
  animation:dz-corre 5.5s linear infinite;background:linear-gradient(to left,var(--b1),var(--b2) 35%,transparent 80%);
  opacity:var(--o,.55);transition:width .45s cubic-bezier(.2,.8,.2,1),opacity .45s}
.dz-botao[data-aceso="true"] .dz-ponto{--w:92px;--o:1}                           /* acende */
@keyframes dz-corre{from{offset-distance:0%}to{offset-distance:100%}}
@supports not (offset-path: rect(0 auto auto 0 round 16px)){.dz-feixe{display:none}}   /* sem feixe, o botão continua inteiro */
@media (prefers-reduced-motion: reduce){.dz-ponto{animation:none;offset-distance:14%}}
```
Dois pontos defasados (`--d:-2.75s`) dão a impressão de dois feixes. Use 1 px: o autor achou o primeiro feixe "grosso demais" e a versão aprovada tem anel de 1 px e botão `h-12`.

**Parâmetros do estilo:** `CELULA` (2 px é o miolo; 3 deixa mais grosso), `FPS`, frequências de `onda`/`grao`, os cortes `0.34` (brilho) e `0`, o mix do tom `quente` (45% para branco), `--w` do feixe (58 px parado, 92 aceso).

**Variações:** Brasa (fundo escuro derivado da cor: `color-mix(in oklab, var(--accent) 9%, black)`) e Placa (cor cheia); botão secundário só com o anel (sem campo); sem feixe em telas de toque (use só `data-aceso` ao pressionar).

**Armadilhas**
- `offset-path: rect()` é recente (Chrome 116+; confira Safari e Firefox antes de depender; **não foi testado fora do Chromium**). Mantenha o `@supports`.
- `mask-composite: exclude` precisa do par `-webkit-mask-composite: xor` para Safari/Chrome antigos.
- O canvas precisa de `inset:0; width:100%; height:100%` dentro de um `<button>` com `overflow:hidden; isolation:isolate`. Canvas é elemento substituído: `inset` sozinho NÃO estica; use largura/altura 100%.
- Texto sobre trama perde legibilidade: mantenha a densidade baixa no miolo, ou ponha `text-shadow` leve; confira em captura ampliada.
- Sem `getComputedStyle` da cor, `color-mix` não chega ao canvas (receita 0).
- React 19: o CSS do feixe pode ir num `<style href="..." precedence="default">` junto do componente.

---

## 2. Seletor de valor por arrasto, cursor Feixe e fonte pixel

**Objetivo:** o próprio número vira um controle: arraste na horizontal para mudar o valor. **Quando usar:** valor livre (créditos, quantidade, orçamento) com muitos passos e valores "âncora" (pacotes). Origem: `arrasto.tsx` + `PainelLivre.tsx` (Mix P4). O autor escolheu o cursor **Feixe** e a fonte **Jersey 25**.

**Lógica (independente de framework)**
- Mapa logarítmico: `K = ln(MAX/MIN)/PX_TOTAL` (PX_TOTAL = 520 px); ao arrastar, `valor = ajustar(exp(ln(v0) + (x - x0) * K))`. Arrastar pouco muda pouco em valores baixos e muito em valores altos.
- `ajustar(v)` aplica passo (50) e **ímã** nos valores âncora (os pacotes): perto de um pacote, gruda.
- `pointerdown` → `setPointerCapture(e.pointerId)`; `touch-action: none; user-select: none` no elemento.
- Acessibilidade de slider de verdade: `role="slider"`, `tabindex=0`, `aria-valuemin/max/now`, `aria-valuetext="1.200 créditos"`, setas (±passo), PageUp/PageDown (±10 passos), Home/End.
- Mouse ganha cursor customizado (`cursor: none` só no hover de `pointerType === "mouse"`); toque e caneta arrastam igual, **sem cursor**, com uma alça fixa visível embaixo do número.

**Cursor "Feixe"** (o ponteiro de texto do iPadOS, 24 px): uma barra de 2,5×24 px com `box-shadow` de halo na cor do valor; ao pressionar a barra afina (`scaleY .7`, `opacity .25`) e abrem `‹` e `›`, o do lado do movimento acende; o delta ("+50") aparece acima. Cor do traço: `var(--foreground)` com halo colorido (depois de uma correção de contraste: cursor em cor cheia sumia).

```css
.cursor-feixe{width:2.5px;height:24px;border-radius:9999px;background:var(--foreground);
  box-shadow:0 0 0 1px color-mix(in oklab,var(--background) 55%,transparent), 0 0 8px var(--cor-valor)}
```
Mola para seguir o ponteiro: `stiffness 620, damping 38, mass .5` (motion/spring). Outras peles testadas e descartadas: pílula pixel com setas, cabo elástico, régua, lente de vidro, gota, dial, eixo, etiqueta.

**Fonte pixel nos números:** receita 15. Espere a fonte carregar (`document.fonts.load('1em "Jersey 25"')`) antes de medir o número.

**Armadilhas:** não inverta a lógica entre mouse e toque (toque não tem hover); mantenha o foco visível; o número deve ser selecionável por leitor de tela (`aria-valuetext`), não só desenhado.

---

## 3. Fundo de campo com 4 tons (Maré Bayer)

**Objetivo:** fundo vivo e barato: um campo suave em movimento lento, quantizado em 4 tons por Bayer 8×8. **Quando usar:** palco, cabeçalho, cartão de saldo. **Exemplo completo:** `../examples/dither-field.html` (3 modos: maré, ondas, chuva). Origem: `dither/field.tsx` (`DitherField`).

**Truque de desempenho:** o canvas WebGL tem **a resolução da célula** (`cols = ceil(larguraEmPxDoDispositivo / celulaDev)`), e o CSS o amplia com `image-rendering: pixelated`. O shader roda 4 a 9 vezes menos pixels e as células saem exatas.

```glsl
#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uTime, uLevel, uReach; uniform vec3 uP[4]; out vec4 o;
float add4(float a,float b){return 2.*a+3.*b-4.*a*b;}
float bayer8(vec2 c){ vec2 q=mod(floor(c),8.);
  return (add4(floor(q.x/4.),floor(q.y/4.)) + 4.*add4(mod(floor(q.x/2.),2.),mod(floor(q.y/2.),2.)) + 16.*add4(mod(q.x,2.),mod(q.y,2.)) + .5)/64.; }
void main(){
  vec2 cell = floor(gl_FragCoord.xy), uv = (cell+.5)/uRes;
  float f   = .5 + .25*sin(uv.x*7.+uTime*.55) + .25*sin(uv.y*9.-uTime*.45+uv.x*3.);   // campo suave
  float lit = smoothstep(uReach+.06, uReach-.18, uv.x);                                // só acende até 'reach'
  float lum = f*(.1+.9*lit)*(.55+.6*uLevel);
  float l   = clamp(lum,0.,1.)*3. + bayer8(cell);                                      // 4 tons: floor(l) = 0..3
  o = vec4(uP[clamp(int(floor(l)),0,3)], 1.);
}
```
Vértice sem buffer: `gl_Position = vec4(vec2((gl_VertexID<<1)&2, gl_VertexID&2)*2.-1., 0., 1.)` e `drawArrays(TRIANGLES, 0, 3)`.

**O que muda o estilo:** tamanho da célula (2 a 6 px), frequências do campo, vinheta `1 - .35*pow(abs(uv.x-.5)*2., 3.)` nas laterais, número de tons (3 = mais gráfico, 4 = padrão, 5 = mais suave), `uReach` (até onde acende, ligado ao valor escolhido) e `uLevel` (esquenta a cor; no maior pacote entra o dourado).

**Variações do exemplo:** Ondas (faixas largas), Chuva (fios de 1 célula sobre névoa baixa; cada coluna é uma pista com velocidade, comprimento e pausa próprios via `hash(coluna)`).

**Armadilhas**
- Célula **inteira em px do dispositivo**: `celDev = round(cell*dpr)`. Com `dpr` 1,5 e célula 3 você teria 4,5 px e as células seriam desiguais.
- Um ponto isolado a cada 8 células no limite de dois tons é o próprio Bayer; não é bug.
- Sem WebGL2: `host.dataset.semWebgl` + gradiente CSS de reserva (o exemplo faz).
- `lerTons` deve usar as variáveis do **host** (a sonda herda o escopo).

---

## 4. Fundo de caixa com fade nas bordas, raios, ondas, chuva e lentes de vidro

**Objetivo:** fundo de um cartão/caixa de resumo em que o dither **nasce da cor da própria caixa**: a opacidade de cada célula sobe de forma contínua da borda para dentro, sem franja nem linha sólida. Origem: `fundo-dither.tsx` (`FundoDither`, v5, depois de várias rodadas de feedback do autor).

**Ideias reutilizáveis**
- `di = -sdBox(px - 0.5*uRes, 0.5*uRes, raio)` (distância para dentro, com os cantos arredondados da caixa) e `e = smoothstep(0., uFade, di)`; alfa = `pow(e, 1.3) * ganho`. Canvas com `premultipliedAlpha`: devolva `vec4(cor*alfa, alfa)`.
- Três cenas num shader (`uMode`): **raios** (sprites ⚡ de 8×11 células que descem devagar, poucos por vez, dois tamanhos, parte azul e parte rosa/laranja), **ondas** (faixas cheias estilo "Grain Gradient"), **chuva** (fios de 1 célula lentos e esparsos). Cada raio é uma "faixa" de colunas com `hash(faixa)` para velocidade, pausa e deslocamento.
- Sprite em grade no shader: uma função `boltRow(r)` devolve `[x0,x1]` preenchidos por linha; `bolt(r,c)` testa a célula. O mesmo padrão serve para qualquer ícone minúsculo.
- Luz vibrante que passeia na horizontal com cor que muda (rosa para laranja): `m = core*0.95 + (s-0.5)*0.5` e `k = smoothstep(.2,.8, .5+.5*sin(t*.3+2.4))` para misturar duas rampas.
- Rampas `ESCURO` e `CLARO` (4 tons cada) e troca pela luminância do fundo real (`0.2126 r + 0.7152 g + 0.0722 b < 0.5`).
- **Lentes de vidro líquido no mesmo shader**: retângulos de elementos DOM (`getBoundingClientRect`, convertidos para px do canvas com origem embaixo) viram lentes que refratam a cena (`over(mag + off)`), com dispersão cromática por canal, miolo fosco (6 amostras em disco giradas por pixel) e sombra; até 3 lentes. Sem lente, o fundo é só dither.
- `onFalha` e gradiente CSS de reserva sem WebGL; `gl.getExtension("WEBGL_lose_context")?.loseContext()` na limpeza.

**Correções que o autor pediu (não repita):** sem borda sólida nem quinas brancas (o painel não pode ter `shadow` nem fundo próprio por baixo do canvas), poucos raios e lentos, gráfico em "ladrilho" de canto pequeno e não em pílula, "pente" nas bordas da lente (colunas esticadas) some com bisel menor (12 px), offset menor (0,8) e jitter por pixel, pontos escuros na franja (use o tom médio e some com o fade).

---

## 5. Cena de objetos em pixel (quadro lógico + escala inteira)

**Objetivo:** ilustrações animadas (moedas, pacote, cartão, notas, cofre, impressora) desenhadas por **um fragment shader** num quadro lógico pequeno, ampliado por número inteiro. **Exemplo completo:** `../examples/scene-objects.html` (parte A). Origem: `pixel-scenes/pixel-gl.tsx` (`PixelCanvas` + `PRELUDE`) e `palco-cenas.tsx`.

**Contrato do motor**
- Quadro lógico (384×216 no projeto de origem; `cols = ceil(largura/zoom)` no exemplo), `image-rendering: pixelated`, **zoom inteiro** (`floor(largura/quadro)` quando ≥ 1). Abaixo de 1 aceite suavizar.
- Uniforms padrão: `uRes, uOff, uTime, uIdx` (pacote/forma 0..3, suavizado `idx += (alvo-idx)*0.14`), `uPhase` (fase do ciclo 0..1), `uLevel`, `uN` (peças), `uBg, uFg` (cores reais do contêiner), `uC0..uC3` (4 cores de objeto), `uShare` (vec4). Cada cena é só o corpo do shader; o resto é prelúdio comum.
- Prelúdio mínimo: `bayer()` 4×4, `shade(base, v)` (3 tons: sombra/base/luz, limiar Bayer), `box`, `seg`, `rot`, `hsh`.

```glsl
float bayer(vec2 p){ vec2 a=mod(p,2.), b=mod(floor(p/2.),2.); return (4.*b2(a)+b2(b)+.5)/16.; }   // b2(v)=2x+3y-4xy
vec3 shade(vec3 base, float v){           // v: 0 escuro .. 1 claro
  vec3 dk=mix(base,vec3(.05),.55), lt=mix(base,vec3(1.),.45); float d=bayer(P); v=clamp(v,0.,1.);
  if(v<.5) return (v*2.>d)?base:dk;  return ((v-.5)*2.>d)?lt:base; }
```
- Escala dos objetos acompanha o quadro: `S = min(uRes.y/150., uRes.x/250.)` (altura **e** largura; só pela altura os objetos cortam no celular).
- Objetos: moeda (topo elíptico + lateral serrilhada), pacote isométrico (3 faces), cartão inclinado, nota; céu em degradê Bayer; halo; nuvens; notas subindo; brilhos em cruz. Funções `coin`, `parcel`, `card`, `note` estão em `scene-objects.html`.
- Cena sobre fundo **transparente** (`transparent`): o que o shader pinta igual a `uBg` vira vidro (contexto com `alpha: true`, saída com alfa).
- `overlay`: uma camada DOM do tamanho exato do canvas para botões de toque sobre o desenho (o leque de notas é um grupo de rádio com botões invisíveis).
- `clock(seconds)`: relógio próprio de fase para cenas "de uma tomada" (a celebração).
- Movimento reduzido: tempo fixo (`3.3`) e fase `held`.

**Armadilhas**
- **Nuvens em dither com a distância no eixo errado viram faixas** (a distância precisa ser em px do quadro nos dois eixos, normalizada pela elipse: `length(d/vec2(46.,7.))`).
- O objeto precisa de `P=floor(gl_FragCoord.xy)` antes do `shade`, senão o Bayer sai com deslocamento fracionário.
- `layout` do Framer/motion em quem contém o canvas **estica os pixels**; o canvas não deve estar em elemento com layout animado.
- Em `fill`, recompilar o shader a cada redimensionamento é desperdício: recompile só quando `body` muda e atualize só o viewport.
- Até ~16 contextos WebGL por página: uma cena por vez ou um canvas compartilhado.

---

## 6. Arte procedural: dígitos 3×5, cédulas, cofre, impressora

**Objetivo:** objetos "gravados" por fórmulas (sem imagem): cédula com guilhochê, rosácea, fio de segurança, marca-d'água, microtexto, número de série e selo holográfico; cofre de porta giratória que abre em leque de notas; impressora de dados que transforma fichas em cédulas. Origem: `arte.ts` (`NOTE_LIB`, `COFRE`), `notas-dither.tsx`, `impressora.tsx`.

**Fonte de 3×5 pixels em um número** (útil para qualquer número em shader; verificada: desenha 0 a 9):

```glsl
float glyph(float d, vec2 c){        // d = dígito 0..9, c = célula (x 0..2, y 0..4 de cima para baixo)
  float v=31599.;                    // 0
  if(d>8.5) v=31695.; else if(d>7.5) v=31727.; else if(d>6.5) v=29257.; else if(d>5.5) v=31215.;
  else if(d>4.5) v=31183.; else if(d>3.5) v=23497.; else if(d>2.5) v=29647.; else if(d>1.5) v=29671.; else if(d>.5) v=11415.;
  float bit=(4.-c.y)*3.+(2.-c.x);
  return mod(floor(v/exp2(bit)+.001),2.);
}
```
Cada constante é a matriz 3×5 em 15 bits (`31599` = `111 101 101 101 111` = zero). Para vários dígitos, `gi = floor(cx/4.)` escolhe o dígito e `lx = cx - gi*4.` a coluna (4 = 3 + 1 de espaço).

**Receita da cédula:** cor do papel = mistura da cor do pacote com branco/escuro conforme a **luminância do fundo** (`lt = smoothstep(.35,.65,dot(uBg,vec3(.3333)))`); camadas em ordem: guilhochê (linhas senoidais cruzadas), marca-d'água oval, medalhão com rosácea (`rr = r + (2.6+t*.4)*cos((6.+t*2.)*a)*smoothstep(3.,17.,r)`), denominação com sombra de gravura, microtexto, fio de segurança, série, marcas táteis (uma por nível), selo holográfico só nos pacotes grandes, moldura. O leque é um grupo de rádio (botões invisíveis sobre o desenho).

**Armadilhas:** é ilustração: não prometa retorno financeiro em números; teste claro e escuro (o papel muda); cada nota extra custa laço no shader: limite com `for(int i=0;i<9;i++) if(fi<nb)`.

---

## 7. 3D leve por SDF: raymarching no shader e na CPU, com morph

**Objetivo:** objetos "esculpidos" em pontilhado (moeda, pacote, pilha, cofre, balão, envelope, escudo, gráfico, presente) sem three.js. **Exemplo completo (GPU):** `../examples/scene-objects.html` parte B. Origem: palco B (`CenaPalco3D`) e direção G · Dither (`d8/dither.ts`, na CPU).

**Pipeline**
1. Campo de distância por forma (primitivas: `sdBox` arredondada, disco em Z ou Y, esfera, cápsula, extrusão de forma 2D) e união suave (`min` com `k`).
2. Raymarching com passo conservador (`t += d*0.85`, 48 a 72 passos, teto de distância) e normal por diferenças centrais ou tetraedro.
3. Luz: Lambert (+ meia-luz) × oclusão de 1 tap (`.55 + .45*clamp(map(p+n*.12)/.12,0.,1.)`) + especular (`pow(dot(reflect(-L,n),-rd),26.)`) + Fresnel; a luz **segue o mouse**.
4. `lum` vira tom por Bayer 8×8 (`floor(clamp(lum,0.,1.)*3. + bayer8(cell))`) e o tom escolhe uma cor do **gradient map** (`--d0..--d3` derivadas de `--accent`: sombra, base, claro, branco). Objetos de imagem pintados por essa rampa não têm cor própria: seguem o token.
5. Fora do objeto: sombra de contato em dither (elipse achatada com limiar Bayer) e alfa pré-multiplicado.

**Morph entre formas:** `d = mix(da, db, smoothstep(0.,1.,fract(s)))` onde `s` é o índice contínuo da forma; com `m < .001` avalie só uma (custo). Passo menor no morph (a mistura não é um SDF exato). Em ~700 ms com `ease` cúbico o resultado é uma "dissolução" de uma forma na outra.

**Versão CPU (G · Dither):** SDF analítico marchado num canvas de baixa resolução (grade `w/up`), luminância interpolada bilinearmente **só entre pontos que acertaram a peça**, limiar Bayer 8×8 aplicado na grade fina (halftone fino e liso; a silhueta também vira pontilhado). Sem alocação no laço por pixel (só números). **Governador de carga:** meça o tempo gasto desenhando por segundo; se passar de ~28%, reduza o fator de quadros de todos os objetos (×0,75) e volte quando cair abaixo de ~12%; **um único `requestAnimationFrame`** serve todos os canvases (que dormem sozinhos fora da tela, com aba oculta ou em movimento reduzido).

**Armadilhas:** a versão CPU é pesada (36 fps em renderização por software com muitos objetos); prefira GPU. 72 passos × sombra suave pesam: comece com 48 e sem sombra. Resolução lógica 140×140 já basta para um objeto de herói. Não medimos GPU real: ver `animacao-e-performance.md`.

---

## 8. Objetos 2D planos em "adesivo" com rampa de 5 tons

**Objetivo:** sprites grandes, nítidos, com cara de adesivo (contorno branco, sombra dura), gerados por código num quadrado de `S` pixels, com formas em coordenadas 0..100 (serve para qualquer tamanho). Origem: `d11/engine.ts` (roda no navegador e no Bun, então dá para conferir o desenho sem build).

- Cada pixel recebe **material** e **luz** (0..1); a luz vira degrau de uma rampa de 5 tons (escuro a claro) por Bayer 4×4: `rampa(c, tinta, claro) = [mix(c,tinta,.66), mix(c,tinta,.34), c, mix(c,claro,.4), mix(c,claro,.76)]`.
- Luz por gradiente linear `grad(x0,y0,x1,y1,a,b)` ou constante; materiais de uma cor só (tinta) para contornos.
- Por fora: recorte de adesivo (dilatar a máscara e pintar de branco) e sombra dura de um degrau.
- Objetos prontos que o autor aprovou: caixa de rastreio com fita e etiqueta, balão de suporte com 3 pontos e faísca, painel de colunas com seta, loja com toldo listrado, baú (fechado e aberto), van de entregas, guichê.

---

## 9. Máscaras de dither em CSS e sprites de pixel em SVG

**Objetivo:** dither sem canvas: uma `mask-image` feita de SVG minúsculo em `data:` URI, repetida. A cor continua vindo de variáveis CSS (`background: var(--accent)`), então tema e paleta trocam sozinhos. Testado (Playwright).

```js
const B4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]], b4=(x,y)=>(B4[y&3][x&3]+.5)/16;
/** densidade por linha (0..1) -> máscara que repete na horizontal (período de 4 células) */
function faixaCss(dens, c = 2) {
  let d = ''; dens.forEach((dn, r) => { for (let x = 0; x < 4; x++) if (b4(x, r) < dn) d += `M${x*c} ${r*c}h${c}v${c}h-${c}z`; });
  const url = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${4*c}' height='${dens.length*c}' shape-rendering='crispEdges'><path d='${d}'/></svg>`)}")`;
  const tam = `${4*c}px ${dens.length*c}px`;
  return `-webkit-mask-image:${url};mask-image:${url};-webkit-mask-size:${tam};mask-size:${tam};-webkit-mask-repeat:repeat-x;mask-repeat:repeat-x`;
}
const rampa = (n, de = 1, ate = 0) => Array.from({length:n}, (_, i) => de + (ate-de)*i/Math.max(1,n-1));
el.style.cssText = faixaCss(rampa(32), 2);    // degradê vertical em pontilhado; background:var(--accent) por baixo
```
Variações: `coluna()` (a mesma ideia girada), faixas "que caem em degraus" para bordas e rodapés, máscara por Bayer 8×8.

**Sprites de pixel em SVG** (ícones e personagens de poucas células): arrays de strings `"0110"`, um `<rect>` por célula, `shape-rendering="crispEdges"`, `fill="currentColor"` para herdar a cor do texto/token:

```js
const spriteSvg = (linhas, s = 6) => `<svg viewBox="0 0 ${linhas[0].length*s} ${linhas.length*s}" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">`
  + linhas.flatMap((l,y)=>[...l].map((c,x)=>c==='1'?`<rect x="${x*s}" y="${y*s}" width="${s}" height="${s}"/>`:'')).join('') + '</svg>';
```
O projeto de origem usa isso nos ícones de frente (`icones.tsx`: 7×7 e 8×5 células) dentro de um botão redondo.

---

## 10. Gráfico em dither

**Objetivo:** gráficos de área, linha e barra num canvas pequeno, com cara do resto da interface. **Regra do projeto:** gráfico novo usa o **Dither Kit** (Boring Software, MIT) em vez de `recharts` ou canvas à mão. Origem: `packages/ui/src/dither/kit/` (cópia com mudanças listadas em `kit/NOTICE.md`; procedência: <https://github.com/Boring-Software-Inc/dither-kit>, commit `1e7faee`).

```tsx
<div style={{ height: 176 }}>                       {/* o pai define a altura */}
  <AreaChart data={rows} config={config} cell={3} replayOnData={false} label="Projeção do saldo">
    <XAxis dataKey="label" maxTicks={4} />
    <Area dataKey="com" variant="gradient" />
    <Line dataKey="sem" strokeVariant="dashed" />
    <Marker index={27} label="Black Friday" color="pink" />
    <Tooltip labelKey="label" valueFormatter={(v) => `${v.toLocaleString("pt-BR")} créditos`} />
  </AreaChart>
</div>
```
- `config` e `data` com identidade estável (`useMemo`); `replayOnData={false}` quando o dado muda por interação (o gráfico desliza em vez de refazer a entrada); `label` vira o texto alternativo.
- Cor: nome da paleta ou `[r,g,b]`; o kit usa só **opacidade** da mesma cor, por isso vale no claro e no escuro.
- Mini-barras de KPI: `DitherSpark` (`values`, `labels`, `color`, `height`).
- Carregue sob demanda (`React.lazy`) em telas que não são só gráfico.

**Ideias para escrever o seu (sem o kit):** densidade por coluna a partir da série; limiar Bayer 8×8 por célula; **duas camadas de opacidade da mesma cor** (célula "ligada" = camada cheia, "desligada" = `0,4×` da cheia) em vez de buracos, assim o fundo não aparece branco no tema claro; contorno do topo com 0,72 de opacidade (borda suave); grade de células (`CELL = 2`); `dashed` por colunas de 4 em 4.

**Armadilhas:** o gráfico demora 6 a 8 s para aparecer sob renderização por software (não é bug); um dado instável (`[]` novo a cada render) reconstrói o motor; legenda e tooltip precisam de contraste sobre o grão.

---

## 11. Celebração (cofre abrindo, confete, contador)

**Objetivo:** momento de comemoração depois de um fato real (pagamento confirmado, primeira loja, primeira fonte). Origem: `pixel-scenes/celebracao.tsx` (cofre em pixel) e `celebrate/` (confete, banner, conexão da Fonte em WebGL2); documentação em `docs/design/celebracoes*.md` do projeto de origem.

**Cofre em tela cheia sobre vidro** (aprovado): portal em `document.body`, `role="dialog" aria-modal`, véu `backdrop-filter: blur(16px) saturate(1.25)` com gradiente radial dourado + degradê do fundo, canvas **transparente** (só cofre e notas são pixels), porta que abre em ~4 s (`opening(s) = .66*smoothstep((s-.5)/3.4)`) e fica aberta com notas em leque e confete de notas (14 cédulas em queda com rotação, no shader), raios em dither atrás. Texto: contador (`@number-flow/react` ou `animate(0, n)` do motion com `tabular-nums`), `aria-live="polite"`, botão **Continuar** com foco, `Esc` fecha, `body.style.overflow = "hidden"` enquanto aberto. Zoom inteiro pelo viewport (4× se altura ≥ 1000, 3× se ≥ 640, senão 2×, limitado pela largura).

**Confete (`canvas-confetti` 1.9.4, ISC, 4,4 KB gz):** `confetti({ particleCount, spread, origin, disableForReducedMotion: true })`; formas por `shapeFromPath`/`shapeFromText`; CDN: `https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.browser.min.js` (no cdnjs dá 404).

**Regras (garantidas no motor do projeto de origem):** só em marco real, uma vez por marco (o servidor guarda que já celebrou); uma celebração por vez; `pointer-events: none` quando for só decorativa; ≤ 120 partículas vivas; salvas espaçadas ≥ 360 ms; **sem flash de tela cheia** (WCAG 2.3.1: ≤ 3 flashes/s); movimento reduzido = só o texto/banner estático; sem som; cliente final da página pública nunca recebe celebração; cor da loja/`--accent`, nunca hex.

**Peso medido (do projeto):** renderer WebGL2 da conexão da Fonte 16,9 KB gz carregado sob demanda; confete 4,3 KB gz. Não use tsParticles (24 a 38 KB gz), Rive, dotLottie ou GSAP só para isto.

---

## 12. Transição entre páginas por dissolução Bayer

**Objetivo:** trocar de passo/página célula a célula (sem cortina): cada célula passa da página antiga para a nova quando o progresso ultrapassa o seu limiar. Origem: `d12/dissolucao.ts`.

- Grade de máscara 280×175 células (4 px no palco); limiar da célula = `0.5*bayer8 + 0.5*varredura`, onde `varredura = x/(COLS-1)*0.78 + y/(LINS-1)*0.22` (a frente que avança na diagonal).
- 10 níveis pré-calculados em `canvas.toDataURL()` (cache por nível); aplica `mask-image` na página antiga (células que faltam) e na nova (células já trocadas) com `mask-size: 100% 100%; image-rendering: pixelated`.
- Anime o nível 0..10 em ~600 ms; ao final, limpe as máscaras (`removeProperty`) para não deixar custo de composição.
- Em movimento reduzido: troca direta (fade de 150 ms no máximo).

**Armadilhas:** o pai da máscara não pode ter `backdrop-filter` de filhos que precisem enxergar o fundo (raiz de backdrop); `AnimatePresence` com `mode="popLayout"` exige `exit` com valor real (só `transition` trava e o passo volta invisível).

---

## 13. Marca-texto em dither

**Objetivo:** destacar a palavra-chave de um título com uma faixa da cor da marca que **se desfaz em pontos de Bayer nas pontas** e entra varrida por uma frente de trama. Origem: `d9/efeitos.tsx` (`MarcaTexto`).

- Canvas 2D atrás do texto, `CEL = 3`, `OV = 18` px de sobra nas laterais; densidade `dens = xm/OV` na ponta esquerda e `(W+OV-xm)/OV` na direita; ao entrar, uma frente de largura `FRENTE = 36` px varre da esquerda para a direita (`frente = p*(largura+FRENTE)`).
- Cada célula acende se `b4(x,y) < dens` (Bayer 4×4); a entrada é feita em 14 repinturas espaçadas de 42 ms (`pinta(i/14)`, ~0,6 s, com atraso inicial de 0,45 s); cor lida do token por sonda (receita 0); em movimento reduzido ou nas trocas seguintes já nasce pronta (`pinta(1)`).

---

## 14. Rota: estrada rasterizada em células

**Objetivo:** uma trilha com paradas (ganhos, passos) por onde um veículo anda. Origem: `d13/rota.tsx`, `d14/estrada.tsx`.

- Geometria analítica: Béziers cúbicas entre as paradas, **horizontais na saída e na chegada** (`x` interpolado por `bez(a.x, a.x+dx, b.x-dx, b.x, t)`, `y` por `bez(a.y, a.y, b.y, b.y, t)`), amostradas por **comprimento de arco** (180 amostras por trecho) e consultadas por busca binária (`posEm(geo, s)`; `sPorX` porque a estrada só avança para a direita).
- A pista é rasterizada em **células de 4 px** (a mesma grade dos adesivos): corpo, sombra dura, bordas, tracejado do meio e poeira em trama Bayer saem como caminhos SVG de quadradinhos. A parte "acesa" é a mesma pista em outra cor, recortada pela posição horizontal do veículo.
- O seletor de valor pode virar a estrada (o veículo é o cursor).

---

## 15. Tipografia pixel

Todas são Google Fonts. Carregue por `<link>` com `display=swap` e **espere carregar antes de medir** (`document.fonts.load`). `escala` compensa a altura diferente de cada fonte.

| Fonte | Peso(s) | Escala | Caráter |
|---|---|---|---|
| **Jersey 25** (escolhida pelo autor para os números) | 400 (único) | 1,3 | numerais de camisa de esporte, estreitos e fortes |
| Pixelify Sans | 400 a 700 | 1 | pixel legível; a mais fácil de ler em número grande |
| Bitcount Prop Single | 100 a 900 | 1 | grade de pixels, cara de placar |
| Doto | 100 a 900 | 1,05 | matriz de pontos, letreiro de LED |
| Handjet | 100 a 900 | 1,3 | display de calculadora, estreita |

Link usado: `https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&family=Jersey+25&family=Bitcount+Prop+Single:wght@100..900&family=Doto:wght@100..900&family=Handjet:wght@100..900&display=swap`. A **Geist Pixel** foi descartada pelo autor. Regras: sem brilho (neon) no número; `font-variant-numeric: tabular-nums`; o título do passo usou Bricolage 800 (do mockup D3).

---

## 16. Paletas trocáveis por variável

**Objetivo:** trocar a "personalidade" de cor de uma cena sem mexer em código: tudo lê `--c1`, `--c2`, `--sol` e a base vem de `--accent`.

```css
[data-pal="lima"]   { --c1: <verde-limão>;  --c2: <rosa-choque>; --sol: <amarelo>; }
[data-pal="laranja"]{ --c1: <laranja>;      --c2: <coral>;       --sol: <amarelo>; }
[data-pal="menta"]  { --c1: <menta>;        --c2: <violeta>;     --sol: <amarelo>; }
[data-pal="notas"]  { /* ouro, turquesa, roxo derivados das cores de categoria */ }
[data-pal] { /* derivados da cor de marca (muda junto se --accent mudar) */
  --az-fundo: color-mix(in oklab, var(--accent) 58%, black);
  --painel:   color-mix(in oklab, var(--accent) 74%, black);
  --d0: color-mix(in oklab, var(--accent) 36%, black);  --d1: var(--accent);                       /* gradient map do 3D */
  --d2: color-mix(in oklab, var(--accent) 56%, white);  --d3: color-mix(in oklab, var(--accent) 6%, white);
  --p1: var(--az-fundo); --p2: var(--accent);                                                       /* 4 tons do campo */
  --p3: color-mix(in oklab, var(--accent) 88%, white);  --p4: color-mix(in oklab, var(--accent) 74%, white);
  --btn: var(--c1); --btn-texto: color-mix(in oklab, var(--accent) 28%, black);
}
```
Valores aprovados no projeto de origem (como ponto de partida; no projeto de destino, ligue-os a tokens): **lima** `#c8ff2e`/`#ff3d9a`, **laranja** `#ff9f1c`/`#ff5a4e`, **menta** `#3dffc1`/`#a06bff`, sol `#ffe24a`; **notas**: ouro `oklch(0.9 0.18 92)`, turquesa `oklch(0.9 0.13 185)`, roxo `oklch(0.93 0.08 305)` misturados com as cores de categoria. Base azul `#002FFF` (a `--accent` do projeto de origem).

**Regras:** o azul da plataforma é a base e as cores vibrantes entram como opções, sem neon e sem degradê gratuito; a cor que "pede clique" é a `--c1`; objetos de imagem são pintados por shader com a rampa dos tokens (sem cor própria); a paleta vale para todas as variações da mesma tela.

## 17. Vidro líquido sobre dither (lente de refração)

Lente de vidro sobre um fundo vivo em dither: borda de lente fina, **miolo fosco** (desfoque leve) para o texto e o gráfico ficarem legíveis, sem brilho branco no topo nem nas quinas. No projeto de origem veio da lib `vitrio` 0.1.2 (`packages/ui/src/launch/liquid-glass.ts`, estudo em `docs/design/anuncios-de-lancamento/liquid-glass.md`); com fundo em canvas ela precisa de `createCanvasSnapshot`. **Regras do autor:** usar só nos blocos principais (saldo, uso, recarga), nunca em peças decorativas; vidro "muito transparente" foi rejeitado (2026-11-03): dê película e miolo fosco. **Não provado:** refração fora do Chromium (relatos divergentes); sempre tenha reserva com `backdrop-filter: blur()` e borda de 1 px.

## 18. Seletor de notas com volume e níveis

Notas gravadas em dither (cédulas com selo, valor em dígitos 3x5), com **volume ao clicar** (um maço atrás da nota escolhida, mais espesso nos pacotes maiores) e destaque maior para os pacotes maiores. A gamificação por nível (folha metálica no nível 3, ouro no 4, estrelas) foi explorada e ficou como ajuste, não como escolha final. Notas "sem detalhe" e com cara de "AI slop" foram rejeitadas: detalhe é gravura em dither, não brilho.
