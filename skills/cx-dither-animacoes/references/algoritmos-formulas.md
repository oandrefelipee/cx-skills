# Algoritmos de dither

Conteudo: 1 Base comum, 2 Bayer, 3 Blue noise e IGN, 4 Difusao de erro (Floyd-Steinberg, Atkinson), 5 Halftone, 6 Hachura/gravura, 7 Ruido aleatorio e grao, 8 Escolha rapida, 9 Dither em celulas (pixel-grid).

## 1. Base comum

Todo dither faz o mesmo: reduz tons e usa um padrao (limiar) para que, na media, o olho veja o tom original.

- **Luminancia** (Rec. 709): `L = 0.2126 R + 0.7152 G + 0.0722 B`, com R,G,B em [0,1]. Em imagem com alfa, tire o premultiplicado antes (`rgb/alpha`).
- **Gamma**: para o *estilo* (arte, UI) quantize direto em sRGB, e o que o trabalho original fez. Para fidelidade tonal (fotos), linearize antes: `lin = c^2.2` (ou formula sRGB exata), dither, e volte. Teste os dois; escolha pelo print.
- **Contraste antes de quantizar**: `lum = pow(clamp((lum - lo)/(hi - lo), 0, 1), gamma)`. Com poucos tons, puxar `lo/hi` evita que tudo caia no mesmo degrau.
- **Quantizacao com limiar** (forma usada em Python): `idx = min(floor(lum*(N-1) + t), N-1)`, `t` em (0,1) vindo da matriz. N = numero de tons.
- **Quantizacao centrada** (forma usada em GLSL): `l = lum + (t - 0.5)*amt/steps; idx = floor(clamp(l,0,.9999)*steps)`. `amt` < 1 suaviza o padrao; `amt = 1` e o look de jornal.

## 2. Bayer (ordered dithering)

Padrao regular, previsivel, estavel entre quadros (por isso e o melhor para animacao e UI). Cara "retro", quadriculada.

Gerar a matriz por recursao: `M(2n) = [[4M, 4M+2],[4M+3, 4M+1]]`, com `M(1) = [[0]]`.

```
2x2:  0 2        4x4:  0  8  2 10        8x8: (64 valores, 0..63)
      3 1              12  4 14  6
                        3 11  1  9
                       15  7 13  5
```
Limiar normalizado: `t = (v + 0.5) / (n*n)`.

Python (numpy), igual ao `money_dither.py`:
```python
import numpy as np
def bayer(n):                      # n = 2, 4, 8, 16
    m = np.array([[0]])
    while m.shape[0] < n:
        m = np.block([[4*m, 4*m+2], [4*m+3, 4*m+1]])
    return m
B8 = bayer(8)
CELL = 4                           # 1 celula de dither = 4x4 px da imagem
yy, xx = np.mgrid[0:H, 0:W]
THR = ((B8[(yy//CELL) % 8, (xx//CELL) % 8] + 0.5) / 64).astype(np.float32)
idx = np.minimum(np.floor(lum*3 + THR).astype(int), 3)    # 4 tons
```

JS (para Canvas 2D), matriz 4x4 normalizada como no fundo animado real:
```js
const BAYER4 = [0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5].map(v => (v + .5) / 16);
const t = BAYER4[(y & 3) * 4 + (x & 3)];
```

GLSL sem arrays (WebGL1 e 2). `a` e a coordenada de celula (inteira):
```glsl
float b2(vec2 a){ a=floor(a); return fract(a.x/2. + a.y*a.y*.75); }
float b4(vec2 a){ return b2(.5*a)*.25 + b2(a); }
float b8(vec2 a){ return b4(.5*a)*.25 + b2(a); }
```
Variante com aritmetica de bits (usada no `DitherField` do repositorio):
```glsl
float add4(float xb, float yb){ return 2.0*xb + 3.0*yb - 4.0*xb*yb; }
float bayer8(vec2 c){
  vec2 q = mod(floor(c), 8.0);
  float b0x=mod(q.x,2.), b0y=mod(q.y,2.), b1x=mod(floor(q.x/2.),2.), b1y=mod(floor(q.y/2.),2.);
  float b2x=floor(q.x/4.), b2y=floor(q.y/4.);
  return (add4(b2x,b2y) + 4.*add4(b1x,b1y) + 16.*add4(b0x,b0y) + .5) / 64.;
}
```
Nota: `gl_FragCoord` tem origem embaixo-esquerda; o padrao fica espelhado verticalmente em relacao ao Canvas 2D. Nao importa a menos que voce case os dois na mesma tela.

Tamanho: 2x2 = muito grosseiro (3 niveis aparentes); 4x4 = grao visivel, bom para pixel; 8x8 = padrao da casa, mais suave, mais "tecido". Para mais de 4 tons, 8x8 ou 16x16.

## 3. Blue noise e IGN

**Blue noise**: limiar sem padrao repetitivo visivel, mais organico (bom para pele, gradientes, fotos). Gerado por void-and-cluster; na pratica use uma textura 64x64 pronta e amostre com `texture2D(tNoise, cell/64.).r` no lugar de `b8(cell)`. Texturas CC0 existem (ex.: pacote "free blue noise textures" de Christoph Peters; verificar a fonte e a licenca antes de embutir). Custo: 1 textura de ~4 KB, filtro NEAREST, `REPEAT`. Em WebGL1, textura nao-potencia-de-2 nao repete: use 64x64.

**Interleaved Gradient Noise** (Jimenez), sem textura, bom para animacao porque nao tem a trama quadriculada:
```glsl
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
```
Use `p = floor(gl_FragCoord.xy/px)` como celula. Qualidade menor que blue noise de verdade, mas gratis.

## 4. Difusao de erro

Espalha o erro de quantizacao para vizinhos ainda nao processados. Resultado mais fiel e "organico", mas **serial** (nao roda em shader simples) e **instavel entre quadros** (o padrao muda quando um pixel muda): bom para imagem estatica, ruim para video/animacao sem cuidado.

**Floyd-Steinberg** (pesos 7,3,5,1 sobre 16):
```python
def floyd(g, levels=2):                      # g: float32 [0,1], shape (h,w)
    g = g.copy(); h, w = g.shape
    for y in range(h):
        for x in range(w):
            old = g[y, x]; new = round(old*(levels-1))/(levels-1)
            g[y, x] = new; e = old - new
            if x+1 < w:               g[y,   x+1] += e*7/16
            if y+1 < h:
                if x > 0:             g[y+1, x-1] += e*3/16
                                      g[y+1, x  ] += e*5/16
                if x+1 < w:           g[y+1, x+1] += e*1/16
    return g
```
Serpentina (alternar o sentido a cada linha) reduz artefatos de "minhoca". Para paleta de cores (nao so cinza), troque `new` pelo ponto mais proximo da paleta e propague o erro por canal.

**Atkinson** (Mac classico): propaga so 6/8 do erro, 1/8 por vizinho; descarta 2/8. Resultado de alto contraste, brancos limpos, pretos estourados; look "Macintosh 1-bit".
```python
def atkinson(g, levels=2):
    g = g.copy(); h, w = g.shape
    for y in range(h):
        for x in range(w):
            old = g[y, x]; new = round(old*(levels-1))/(levels-1)
            g[y, x] = new; e = (old - new)/8
            for dx, dy in ((1,0),(2,0),(-1,1),(0,1),(1,1),(0,2)):
                xx, yy = x+dx, y+dy
                if 0 <= xx < w and 0 <= yy < h: g[yy, xx] += e
    return g
```
Loops Python em imagem grande sao lentos (1024x1024 leva segundos). Reduza a imagem para a grade de celulas primeiro (secao 9) ou use numba (verificar se instalado; nao instale sem pedir).

## 5. Halftone (meio-tom)

Modula o **tamanho** do ponto, em grade rotacionada (45 graus para preto; CMYK usa 15/75/0/45). Cara de impressao/jornal.

Formula: ponto circular de raio `r = sqrt(dark/pi)` na celula unitaria (area do ponto = escuridao), `dark = 1 - lum`.
```python
def halftone(gray, cell=8, angle=45):        # gray: float [0,1]; retorna mascara de tinta
    h, w = gray.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    a = np.deg2rad(angle); c, s = np.cos(a), np.sin(a)
    u = ( xx*c + yy*s)/cell;  v = (-xx*s + yy*c)/cell      # coords de grade rotacionada
    cu, cv = np.floor(u)+.5, np.floor(v)+.5                 # centro da celula
    sx = ((cu*c - cv*s)*cell).clip(0, w-1).astype(int)      # volta ao pixel para amostrar o cinza
    sy = ((cu*s + cv*c)*cell).clip(0, h-1).astype(int)
    dark = 1 - gray[sy, sx]                                 # um valor por celula => pontos limpos
    r = np.sqrt(dark/np.pi)
    return np.hypot(u-cu, v-cv) < r                         # True = tinta
```
GLSL (por celula, com suavizacao):
```glsl
vec2 p = rot(angle) * gl_FragCoord.xy / cell;
vec2 f = fract(p) - .5;
float r = sqrt(dark/3.14159);                 // dark amostrado no centro da celula
float ink = smoothstep(r + aa, r - aa, length(f));   // aa ~ 1.0/cell
```
Variantes: pontos so (`HalftoneDots` do Paper Shaders), CMYK (`HalftoneCmyk`), linhas (hachura, secao 6), quadrados (troque `length` por `max(abs(f.x),abs(f.y))`).

## 6. Hachura / gravura

Linhas diagonais cuja **espessura** cresce com a escuridao; uma segunda familia cruzada entra nos tons mais escuros. Cara de gravura de nota de banco. Do shader real (modo 2):
```glsl
float aa = 1.2/hatchPer;
float u1 = fract((p.x + p.y)/hatchPer);
float w1 = .16 + clamp(lum,0.,1.)*.62;               // espessura segue a luminancia
float l1 = smoothstep(w1+aa, w1-aa, u1);
float u2 = fract((p.x - p.y)/hatchPer);               // segunda direcao, so nos tons claros do canal
float w2 = clamp((lum-.52)*1.7,0.,1.)*.7;
float l2 = w2>.01 ? smoothstep(w2+aa, w2-aa, u2) : 0.;
float ink = max(l1, l2);
```
Observacao do caso real: `lum` aqui e a luminancia da textura (alta = mais tinta, porque a cor da linha e a clara sobre fundo escuro). Se a sua tinta e escura sobre papel claro, inverta (`1 - lum`). `hatchPer` (periodo em px) segue a regra do dither: escale com DPR e com a escala do objeto para nao engrossar quando o objeto encolhe.
Em Python: some duas funcoes `((x+y) % per)/per < w` e combine com `max`.

## 7. Ruido aleatorio e grao

- **Random dither**: limiar = ruido branco. Feio como dither principal, bom como **grao** por cima.
- **Grao animado a 8 fps**: `hash(cell + floor(time*8.))` somado antes de quantizar; da vida a fundo parado a custo ~0.
```glsl
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float g = (hash(cell + floor(time*8.)) - .5) * grain;      // grain 0..0.3
```
- Em JS (inteiros, sem `sin`):
```js
const hash = (x, y, k) => { let h = (x*374761393 + y*668265263 + k*2147483647)|0; h = (h ^ (h>>>13)) * 1274126177; return ((h ^ (h>>>16))>>>0) / 4294967296; };
```

## 8. Escolha rapida

| Quer | Use | Por que |
|---|---|---|
| Animar, UI, fundo | Bayer 8x8 (ou 4x4 para mais grosso) | Estavel entre quadros, rodar em shader/Canvas |
| Imagem estatica fiel | Floyd-Steinberg | Menos padrao visivel |
| 1 bit "Mac classico", alto contraste | Atkinson | Brancos limpos |
| Foto/pele em shader, sem trama | Blue noise ou IGN | Sem quadriculado |
| Jornal/impressao | Halftone | Tamanho do ponto |
| Gravura/nota de banco | Hachura | Linha com espessura variavel |
| Tom plano com um toque de vida | Bayer + grao 8 fps | Barato |

## 9. Dither em celulas (pixel-grid)

Em vez de pontilhar em pixels de tela, **trabalhe numa grade grossa** (cada "pixel de arte" = CELL pixels) e amplie com NEAREST. E o que da o look de pixel-art honesto e mantem o dither do tamanho certo em qualquer escala.

Passos: (1) reduza a imagem para `W/CELL x H/CELL` com media de caixa (BOX); (2) aplique o algoritmo nessa grade pequena; (3) amplie `CELL`x com NEAREST. No shader, o equivalente e `cell = floor(gl_FragCoord.xy/px)` e amostrar a textura no **centro** da celula `q = (cell+.5)*px/res`, o que pixeliza e tramas ao mesmo tempo.
Para animar "o objeto se resolve": comece com `px` grande (24) e desca em potencias de 2 (24 -> 16 -> 8 -> 4 -> 2): os blocos "se dividem" em vez de borrar. Use `Math.pow(2, Math.round(Math.log2(px)))`.
