# SVG e CSS

Conteudo: 1 Tingir cinza por paleta (filtro SVG), 2 Rabiscos como mascara CSS, 3 Revelar com clip-path e `steps()`, 4 Tiles Bayer em CSS, 5 Dissolve por mascara (fallback sem WebGL), 6 Pixel-art em CSS, 7 Relevo de botao.

Implementacoes: `scripts/js/svg-tone-filter.js`, `scripts/js/doodle-mask.js`. Exemplos: `examples/tingir-paleta-svg.html`, `examples/rabiscos-clip.html`. Origem: `rodada4/build.py` (`tone_filter`, classe `.dd`).

## 1. Tingir imagem cinza de 4 tons por paleta (filtro SVG)

Quando a arte foi gerada em 4 tons de cinza, **troque a paleta inteira so com CSS**, sem regerar nem usar WebGL. Dois passos no filtro: (1) `feColorMatrix` converte para luminancia; (2) `feComponentTransfer` com `type="discrete"` mapeia cada faixa de luminancia para um valor por canal.

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="tone" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values=".2126 .7152 .0722 0 0  .2126 .7152 .0722 0 0  .2126 .7152 .0722 0 0  0 0 0 1 0"/>
    <feComponentTransfer>
      <feFuncR type="discrete" tableValues="0.043 0.298 0.784 1.000"/>
      <feFuncG type="discrete" tableValues="0.063 0.482 1.000 1.000"/>
      <feFuncB type="discrete" tableValues="0.200 1.000 0.239 1.000"/>
    </feComponentTransfer>
  </filter>
</svg>
<style>.tn { filter: url(#tone); }</style>
```
`tableValues` = um valor por tom, por canal, 0..1. Gerador (o `tone_filter` real):
```python
def tone_filter(t):                       # t = ['#00104F', '#5E7BFF', '#C8FF3D', '#FFFFFF']  (escuro -> claro)
    ch = lambda i: ' '.join(f'{int(c[1+2*i:3+2*i],16)/255:.3f}' for c in t)
    return ('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="tone" color-interpolation-filters="sRGB">'
            '<feColorMatrix type="matrix" values=".2126 .7152 .0722 0 0  .2126 .7152 .0722 0 0  .2126 .7152 .0722 0 0  0 0 0 1 0"/>'
            f'<feComponentTransfer><feFuncR type="discrete" tableValues="{ch(0)}"/><feFuncG type="discrete" tableValues="{ch(1)}"/><feFuncB type="discrete" tableValues="{ch(2)}"/></feComponentTransfer></filter></svg>')
```

Como o `discrete` funciona: com n valores, a entrada `c` em [0,1] cai no indice `floor(c*n)` (o 1.0 vai para o ultimo). Para 4 tons, a imagem precisa ter luminancias proximas de 0, .33, .67, 1 (cinzas 0, 85, 170, 255) para cada tom cair no degrau certo.

Cuidados:
- **`color-interpolation-filters="sRGB"` e obrigatorio.** O padrao e linearRGB e desloca os valores, trocando os degraus.
- **Bordas com antialias** criam tons intermediarios que caem no degrau errado (franja de outra cor). Gere a arte de origem sem antialias, ou com contorno de tinta no tom mais escuro.
- **A ordem dos tons importa**: o mapeamento depende da ordem; teste variacoes (A/B/C) em vez de supor qual rampa fica melhor.
- O filtro se aplica a qualquer elemento (`img`, `div`, `svg`); troca de paleta em runtime: reescreva os `tableValues` ou crie varios filtros (`#tone-a`, `#tone-b`).
- `filter` + `drop-shadow` na mesma declaracao: `filter: url(#tone) drop-shadow(0 6px 0 rgba(0,16,80,.55))` (sombra dura abaixo, depois do tingimento).
- Suporte: todos os navegadores modernos aceitam `filter:url(#id)` em HTML; testar no Safari (verificar).

## 2. Rabiscos desenhados por mascara

Cada rabisco (seta, sublinhado, circulo, faisca) e um SVG de um traco, usado como **mascara** de um elemento colorido; a cor vem de `currentColor`/`background`, entao o mesmo SVG serve em qualquer cor. A animacao "desenhar" revela a mascara com `clip-path`.

```css
.dd {
  position: absolute; pointer-events: none;
  background: currentColor;
  -webkit-mask: var(--u) center/100% 100% no-repeat;
          mask: var(--u) center/100% 100% no-repeat;
  clip-path: inset(0 100% 0 0);                 /* escondido: toda a largura cortada pela direita */
}
.page.on .dd { animation: ddraw .7s cubic-bezier(.3,.9,.3,1) both; animation-delay: var(--dl, 1.1s); }
@keyframes ddraw { to { clip-path: inset(0 0 0 0); } }
.dd.fl { transform: scaleX(-1); }               /* espelhar sem novo asset */
@media (prefers-reduced-motion: reduce) { .dd, .page.on .dd { animation: none !important; clip-path: none; } }
```
Uso: `<i class="dd" style="--u:url(rabiscos/seta.svg); color:var(--accent); left:530px; top:176px; width:44px; height:44px; --dl:1.5s"></i>`.

- **Suave** (curva): `ease` normal. **Pixel**: `animation-timing-function: steps(8, end)`, a revelacao vai em degraus.
- Sublinhado sob uma palavra: `.hl{position:relative} .hl>.dd.ul{left:-2%; width:104%; bottom:-.16em; height:.26em}`.
- Em celular, esconda enfeites que cobrem texto (`.hide-m{display:none}` no breakpoint).
- **Gerar os SVG de rabiscos**: `python3 scripts/python/doodle_gen.py --style all --out ./doodles --seed 7 --contact` (so stdlib). Generalizado de `rodada3/gerar-rabiscos.py` do caso real. 17 desenhos (`--list`): `seta-curva`, `seta-reta`, `seta-laco`, `seta-baixo`, `seta-direita`, `seta-curva-baixo`, `risco-reto`, `risco-duplo`, `risco-onda`, `risco-zigue`, `sublinhado-reto`, `sublinhado-onda`, `circulo-largo`, `circulo-aberto`, `circulo-duplo`, `asterisco`, `faisca`. Tres estilos, cada um em `<out>/<estilo>/NOME.svg`, todos em `currentColor`:
  | Estilo | Visual | Combina com |
  |---|---|---|
  | `brush` | pincel: contorno preenchido de largura variavel, afina nas pontas, borda irregular | animacao suave (`ease`) |
  | `engrave` | gravura: fio duplo oco + riscas de hachura transversais | detalhe editorial/nota |
  | `pixel` | grade logica (celula 10 u), blocos nitidos, `shape-rendering:crispEdges` | `steps(N)` + `image-rendering: pixelated` |
  Opcoes: `--only a,b` (so alguns), `--seed N` (reprodutivel), `--weight K` (espessura x K), `--contact` (escreve `<out>/index.html`, prancha que usa mascara CSS: **sirva por HTTP**). Alguns exemplos prontos estao em `assets/doodles/`. Em `scripts/js/doodle-mask.js` ha a versao em JS que anima o clip-path.
- A mascara usa so o **alfa** do SVG; a cor do traco dentro do SVG nao importa.

## 3. clip-path e `steps()`

- Revelar com inset: `clip-path: inset(0 100% 0 0) -> inset(0)` (esquerda para direita). Circulo: `circle(0% at 50% 50%) -> circle(120% at 50% 50%)`. A string precisa ter a **mesma estrutura** nos dois lados, senao nao interpola.
- Animacao "pixel": `steps(n, end)` em qualquer propriedade transforma curva em degraus. Hover em estilo pixel: `.obj .node{transition: transform .22s steps(3,end)} .obj.hv .node{transform: scale(1.07) rotate(2deg)}`.
- Quantizar o tempo da animacao em JS (efeito "stop-motion"): arredonde o progresso, `v => Math.round(clamp(v,0,1.5) * Q) / Q` com `Q` = 8 a 12. Todas as molas passam a andar em degraus.
- **Cantos de degrau (pixel corners)** por `clip-path: polygon(...)`: para raio de 16 px em passos de 4 px, a lista tem a forma `0 16px, 4px 16px, 4px 12px, 8px 12px, 8px 8px, 12px 8px, 12px 4px, 16px 4px, 16px 0, calc(100% - 16px) 0, ...` (espelhada nos 4 cantos). Gere por script em vez de escrever a mao.
- Armadilha: animacao CSS com `fill-mode: both` mantem o `transform` final e anula hover/estado selecionado. Anime `translate`/`scale` (propriedades individuais) em vez de `transform`, ou remova a classe depois.

## 4. Tiles Bayer em CSS puro

Textura Bayer sem JS, como `background`:
```css
.bayer {
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4' shape-rendering='crispEdges'%3E%3Cpath d='M0 0h1v1H0zM2 0h1v1H2zM1 1h1v1H1zM3 1h1v1H3zM0 2h1v1H0zM2 2h1v1H2zM1 3h1v1H1zM3 3h1v1H3z' fill='%23000'/%3E%3C/svg%3E") 0 0/8px 8px,
    linear-gradient(#1F3FE0, #0023C4);
  image-rendering: pixelated;
}
```
(esse tile e o xadrez 50%). Para gradiente dithered sem JS: empilhe 3 tiles de densidades diferentes (12%, 25%, 50%) com `mask-image: linear-gradient(...)` por faixa, ou gere o PNG 8x8 por tom em Python e use `mix-blend-mode: overlay` sobre um `linear-gradient` de 3 tons. Nao anima, mas mantem o grao.

## 5. Dissolve por mascara (fallback sem WebGL)

Duas `<img>`/`div` empilhadas e `mask-image` com uma textura Bayer 8x8 em PNG: anime `mask-size` (de 0 a cheio) ou `mask-position` por `steps()`. E a versao "grossa" do dissolve Bayer. Teste em Safari (prefixo `-webkit-mask`).

## 6. Pixel-art em CSS

```css
.px { image-rendering: pixelated; image-rendering: crisp-edges; }   /* ordem: o primeiro para Chromium, o segundo para Firefox */
```
- Exiba em multiplos inteiros do tamanho nativo (128 px nativo -> 256, 384, 512...). Ampliacao fracionaria cria colunas de largura irregular.
- Em `<canvas>` 2D: `ctx.imageSmoothingEnabled = false`.
- Em SVG: `shape-rendering="crispEdges"` em retangulos 1x1.

## 7. Relevo de botao (sombra dura que afunda)

Sem blur: `box-shadow: 0 6px 0 var(--shade)` e, no `:active`, `transform: translateY(4px); box-shadow: 0 2px 0 var(--shade)`. Tres camadas "tecla fisica" (Higgsfield/Raycast): `inset 0 -3px 0 rgba(0,0,0,.32), 0 6px 4px rgba(0,0,0,.25), 0 32px 24px rgba(0,0,0,.15)`. Em estilo pixel, troque a ultima por uma sombra de dither (secao 4 de `canvas2d.md`).
