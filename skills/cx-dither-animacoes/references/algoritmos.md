# Algoritmos de dither: fórmulas, código curto e quando usar cada um

Pesquisa e testes de 2026-11-05. Todo código deste arquivo foi executado (Node 22, Chromium + SwiftShader); o que não foi
provado está marcado. Confiança: **alta** = rodei e/ou várias fontes concordam; **média** = uma fonte boa, não reconferida
na origem; **baixa** = memória ou prática geral, confira antes de apostar.

## Índice

1. [Escolha rápida](#1-escolha-rápida)
2. [Ideia comum: limiar, tons e luz linear](#2-ideia-comum-limiar-tons-e-luz-linear)
3. [Ordenado (Bayer 2/4/8/16)](#3-ordenado-bayer-248-16)
4. [Ruído azul (void-and-cluster) e IGN](#4-ruído-azul-void-and-cluster-e-ign)
5. [Difusão de erro (Floyd-Steinberg, Atkinson e família)](#5-difusão-de-erro)
6. [Halftone: pontos, linhas, rosetas](#6-halftone-pontos-linhas-rosetas)
7. [Padrões simples: xadrez e linhas](#7-padrões-simples-xadrez-e-linhas)
8. [Paletas: RGB x luminância, retrô, k-means, tokens](#8-paletas-quantização-rgb-x-luminância-retrô-k-means-tokens)
9. [Dither em movimento sem "nadar"](#9-dither-em-movimento-sem-nadar)
10. [Tabela de comparação](#10-tabela-de-comparação)
11. [Ferramentas deste pacote que provam cada item](#11-ferramentas-deste-pacote-que-provam-cada-item)
12. [Fontes e nível de confiança](#12-fontes-e-nível-de-confiança)
13. [O que não foi provado](#13-o-que-não-foi-provado)

---

## 1. Escolha rápida

| Quero | Use | Por quê |
|---|---|---|
| Fundo ou objeto **animado** com cara retrô, trama regular | Bayer 8x8 (ou 4x4 mais grosseiro) | por pixel, sem vizinhos: não ferve; roda em shader, CSS, canvas |
| Animado, mas **sem trama visível** (orgânico) | Ruído azul 64x64 (textura) ou IGN | mesmo custo do Bayer, sem o "xadrez" |
| **Foto ou arte parada**, máxima fidelidade de detalhe | Floyd-Steinberg (ou Sierra2, Stucki) | difusão de erro preserva bordas e meios-tons |
| Parado, **contraste alto e visual Macintosh clássico** | Atkinson | descarta 25% do erro de propósito: sombras e luzes estouram |
| Pontos/linhas de **impressão** | Halftone (grade rotacionada) | tom vira tamanho de ponto, não densidade de pixels |
| Poucos tons (2 a 4) ligados a **tokens** do tema | Bayer ou ruído azul com `floor(L*(K-1)+t)` | o mesmo shader serve para qualquer paleta |
| Vídeo/GIF dither | ordenado (`ffmpeg paletteuse=dither=bayer`) | difusão por quadro ferve e incha o arquivo (item 9) |
| 3D com dither que **acompanha a superfície** | tela fixa (simples) ou padrão ancorado (Pope, Dither3D) | item 9 |

Regra de bolso: **animou, use ordenado ou ruído azul. Parou, pode usar difusão.**

---

## 2. Ideia comum: limiar, tons e luz linear

Dither troca níveis que faltam por **densidade** de níveis disponíveis: o olho faz a média. Todo método abaixo calcula, para
cada célula, uma luminância `L` em 0..1 e decide o tom.

- **2 tons (1 bit):** acende se `L > t`, onde `t` é o limiar da célula (constante 0,5 = corte duro; matriz = ordenado).
- **K tons** (rampa de K cores, do escuro ao claro): `q = floor(L*(K-1) + t)` limitado a `0..K-1`; `t` em (0,1). A parte fracionária
  de `L*(K-1)` vira a probabilidade de subir um tom. É a fórmula dos snippets e do playground (K = 4; receita completa em `receitas.md` §3).
- **Célula:** dither em 1 pixel de tela costuma ficar fino demais. Trabalhe em células de `cell` px (2 a 4) e ampliar com
  `image-rendering: pixelated`, ou use `uCell` no shader (receita completa: `receitas.md` §3, fundo de campo com 4 tons).

### Luz linear x valores de tela (gama)

A média do olho é feita em luz **linear**. Se metade das células está acesa, a luminância percebida é 50% em luz linear, que
equivale a ~188/255 em sRGB (não 128). Consequências:

- Dither feito direto nos valores sRGB (o que quase todo shader de jogo faz) deixa os **meios-tons mais claros** que a fonte.
  Muita gente gosta desse visual "clássico"; só não o chame de fiel.
- Dither fiel: converter a imagem para linear antes (`srgbToLinear`), limiar nesse espaço, e as cores da paleta (tokens)
  também entram em linear para decidir a rampa.
- `scripts/dither-image.mjs` usa `--space linear` (padrão) e `--space srgb`; compare os dois com a mesma foto.

Confiança: alta (princípio físico; verificado por `selftest.mjs`: a cobertura de pixels acesos iguala a luminância em linear).

---

## 3. Ordenado (Bayer 2/4/8/16)

Cada célula compara `L` com um limiar que só depende de `(x mod N, y mod N)`. Vizinhos não se afetam: por isso o resultado é
estável em animação e roda em paralelo (GPU).

### Matriz por recursão

```
M1 = [0]            M2n = [ 4·Mn     4·Mn+2 ]
                          [ 4·Mn+3   4·Mn+1 ]
```

```js
// n = 2, 4, 8, 16, 32 ... (igual a scripts/bayer.mjs: conferido para 2..32)
function bayer(n) {
  let m = [[0]];
  while (m.length < n) {
    const s = m.length;
    m = Array.from({ length: 2 * s }, (_, y) => Array.from({ length: 2 * s }, (_, x) =>
      4 * m[y % s][x % s] + [[0, 2], [3, 1]][Math.floor(y / s)][Math.floor(x / s)]));
  }
  return m;
}
```

| N | matriz | tons intermediários (N²+1 níveis) |
|---|---|---|
| 2 | `[[0,2],[3,1]]` | 5 |
| 4 | `[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]` | 17 |
| 8 | linha 0: `0 32 8 40 2 34 10 42` ... (use `node scripts/bayer.mjs 8 --format ascii`) | 65 |
| 16 | `node scripts/bayer.mjs 16` | 257 |

**Limiar normalizado:** `t = (M[y mod N][x mod N] + 0,5) / N²`, sempre dentro de (0,1). Acende quando `L > t`.

### Forma fechada (sem tabela), a que o shader usa

Para cada nível de bit `b` (do bit mais alto para o mais baixo, peso `4^b` crescendo), com `xb`, `yb` os bits de `x` e `y`:

```
v = Σ 4^b · (2·xb + 3·yb − 4·xb·yb)        t = (v + 0,5) / N²
```

GLSL ES 1.00/3.00 (N = 8). Gere outros tamanhos com `node scripts/bayer.mjs N --format glsl`:

```glsl
float bayer8(vec2 c) {                       // c = coordenada inteira de CÉLULA (floor(gl_FragCoord.xy / uCell))
  vec2 q = mod(floor(c), 8.0); float v = 0.0;
  { float x = floor(q.x / 4.0), y = floor(q.y / 4.0); v += (2.0*x + 3.0*y - 4.0*x*y); }
  { float x = mod(floor(q.x / 2.0), 2.0), y = mod(floor(q.y / 2.0), 2.0); v += (2.0*x + 3.0*y - 4.0*x*y) * 4.0; }
  { float x = mod(q.x, 2.0), y = mod(q.y, 2.0); v += (2.0*x + 3.0*y - 4.0*x*y) * 16.0; }
  return (v + 0.5) / 64.0;
}
// 4 tons c0..c3 (tokens do tema):  float q = clamp(floor(lum * 3.0 + bayer8(cell)), 0.0, 3.0);
```

Prova: `node scripts/selftest.mjs --gl` renderiza a função em WebGL1 e WebGL2 (SwiftShader) e compara com a matriz: diferença
máxima 0/255 para N = 4, 8, 16, 32.

### Escolhendo N e a célula

- **2x2**: só 5 níveis, xadrez forte; efeito "gráfico".
- **4x4**: trama bem visível, retrô; barato de ler no olho.
- **8x8**: padrão da skill: 65 níveis, suave, ainda com trama.
- **16x16 ou mais**: quase sem trama, mas o período grande aparece em gradientes lentos; ruído azul costuma ser melhor aí.
- A trama só aparece de verdade com `cell` ≥ 2 px. Com 1 px o olho funde tudo (em tela de alta densidade, pior ainda): use `cell` em px CSS e multiplique por `devicePixelRatio`.

### Armadilhas

- **Matriz nunca é "o" Bayer em todo lugar.** O ImageMagick 6.9.12 tem `o4x4` com a mesma disposição do Bayer 4x4, mas `o8x8`
  é outra matriz (origem: função `OrderedDither()` antiga; primeira linha `1 49 13 61 4 52 16 64`, divisor 65). Na prova local
  (`convert g.png -ordered-dither o8x8` x `bayer.mjs`) 14,5% dos pixels de um degradê divergiram. Para o Bayer "de livro", gere a máscara
  com `bayer.mjs --format png` ou defina o mapa no `thresholds.xml`. Confiança: alta (testado).
- **Normalização do limiar muda alguns pixels.** `(m+0,5)/N²` (aqui) x `(m+1)/(N²+1)` (ImageMagick): ~2% de diferença
  em um degradê 4x4. Nada grave, mas não compare pixel a pixel entre ferramentas.
- **Viés:** o Bayer tem uma tendência fixa de arredondamento (Surma, "Ditherpunk"); se a imagem sair clara ou escura demais,
  inverta o limiar (`1 - t`) ou ajuste o contraste antes, em vez de culpar o dado.
- **Dither em cinza só vai até onde a luz vai:** com cor, escolha entre modo luma e modo rgb (item 8).

Em CSS puro: `node scripts/bayer.mjs 8 --format css` gera a receita testada (tile em `data:` URL + `mix-blend-mode: plus-lighter`
+ `filter: contrast(1000)`): vale só para cinza, 1 bit, e o Safari/Firefox não foram testados. `background-blend-mode: plus-lighter` **não** funciona
(testado no Chromium 153); precisa ser `mix-blend-mode` em um pseudo-elemento.

Confiança: alta.

---

## 4. Ruído azul (void-and-cluster) e IGN

Ruído azul = ruído com pouca energia nas **baixas** frequências: sem aglomerados nem buracos; quando gerado em um toro
(a convolução "dá a volta"), o bloco repete sem emenda. Como limiar, dá o aspecto orgânico da difusão de erro, mas por
pixel e paralelo como o Bayer. Resultado medido aqui: nas baixas frequências a variância é **0,2%** da do ruído branco (32x32, `blue-noise.mjs --test`).

### Void-and-cluster (Ulichney, 1993), em resumo

1. Parte de um padrão binário aleatório com ~10% de 1s. Convolui com uma gaussiana (σ ≈ 1,5 células) **em toro** para medir a "energia"
   de cada posição.
2. **Relaxa:** troca o 1 do maior aglomerado (energia máxima entre os 1s) pelo maior vazio (energia mínima entre os 0s); repete até que a troca
   volte ao mesmo ponto (padrão inicial estável).
3. **Fase 1:** remove, um a um, o 1 do maior aglomerado; o posto de cada um é o número de 1s restantes (de `k-1` até 0).
4. **Fase 2:** a partir do padrão inicial, põe 1s no maior vazio, dando postos crescentes até a metade das células.
5. **Fase 3:** continua pondo 1s no maior vazio (dos 0s) até preencher tudo. Detalhe que `blue-noise.mjs` usa: no toro a soma da gaussiana é
   constante, então o maior vazio dos 1s é o mesmo ponto que o maior aglomerado dos 0s (o paper manda procurar o aglomerado dos 0s).
6. Limiar `t = (posto + 0,5) / N²`.

`node scripts/blue-noise.mjs 64 --out blue64.png` gera a textura (64x64 em ~0,12 s no sandbox; determinística por `--seed`).

No shader (WebGL2): textura `R32F` (ou R8), `NEAREST`, `REPEAT`, sem mipmap:

```glsl
float blueNoise(vec2 cell) { return texelFetch(uBlue, ivec2(mod(floor(cell), 64.0)), 0).r; }
```

(O `shader-playground.html` já traz isso pronto: preset "Ruído azul animado".) No Canvas2D, use o vetor de limiares como a matriz Bayer.

**Texturas prontas:** Christoph Peters publica texturas de ruído azul gratuitas (blog "Moments in Graphics" e o repositório espelhado em
`Calinou/free-blue-noise-textures`). Não as baixei aqui; confira a licença no repositório antes de embutir (o blog fala em domínio público, não reverifiquei).

### IGN (interleaved gradient noise): azul "de graça"

Jimenez (2014, Call of Duty: Advanced Warfare). Sem textura, 3 operações:

```glsl
float ign(vec2 c) { return fract(52.9829189 * fract(dot(c, vec2(0.06711056, 0.00583715)))); }
```

Não é ruído azul de verdade (a estrutura diagonal aparece em campos lisos), mas é bom o bastante para movimento e custa quase nada.
Presente no playground como `ign()`. Confiança: média (constantes consistentes com implementações públicas e com o slide, não conferidas nos slides originais).

### Quando preferir ao Bayer

- Fundo grande com gradiente lento (o período do Bayer vira faixa visível).
- Estilo orgânico/granulado em vez de xadrez.
- **Contra:** a textura precisa ser carregada ou gerada; no CSS puro não dá; o "xadrez" do Bayer é justamente o que dá ar de pixel art.

Obra Dinn usa ruído azul para o cenário e Bayer para pessoas e objetos de interesse, para criar contraste de textura (Surma). Boa regra de
direção de arte: **duas tramas, duas hierarquias**.

Confiança: alta (algoritmo e medição); a metodologia da Fase 3 é a minha implementação, igual em resultado ao paper.

---

## 5. Difusão de erro

Varre os pixels em ordem; quantiza; **espalha o erro** (valor − tom escolhido) para vizinhos ainda não visitados.

```js
// lum: Float32Array em luz linear 0..1 (w*h). Devolve Uint8Array 0/1. Serpentina: linhas ímpares da direita para a esquerda.
function floydSteinberg(lum, w, h) {
  const out = new Uint8Array(w * h), buf = Float32Array.from(lum);
  for (let y = 0; y < h; y++) {
    const rev = y & 1;
    for (let i = 0; i < w; i++) {
      const x = rev ? w - 1 - i : i, d = rev ? -1 : 1, k = y * w + x;
      const v = Math.min(1, Math.max(0, buf[k]));          // clamp: sem isso o erro acumula e surgem "vermes"
      const q = v >= 0.5 ? 1 : 0, e = v - q;
      out[k] = q;
      if (x + d >= 0 && x + d < w) buf[k + d] += (e * 7) / 16;
      if (y + 1 < h) {
        if (x - d >= 0 && x - d < w) buf[k + w - d] += (e * 3) / 16;
        buf[k + w] += (e * 5) / 16;
        if (x + d >= 0 && x + d < w) buf[k + w + d] += e / 16;
      }
    }
  }
  return out;
}
```

Para vários tons, troque `q` pelo tom mais próximo da rampa e `e = v − tom`. A implementação geral (todos os núcleos abaixo, `serpentine`, K tons,
modo rgb) está em `scripts/dither-core.mjs` (`KERNELS`, `ditherImage`).

### Núcleos (peso / divisor; `*` = pixel atual, colunas = x−2 .. x+2)

| Algoritmo | Linha y | Linha y+1 | Linha y+2 | Divisor | Notas |
|---|---|---|---|---|---|
| **Floyd-Steinberg** | `* 7` | `3 5 1` (x−1..x+1) | | 16 | padrão; ótimo para foto; pode mostrar "vermes" em tons quase planos |
| **Atkinson** | `* 1 1` | `1 1 1` (x−1..x+1) | `1` (x) | 8 | só 6/8 do erro é propagado: contraste alto, perde detalhe nos extremos; visual Mac clássico |
| **Jarvis-Judice-Ninke** | `* 7 5` | `3 5 7 5 3` | `1 3 5 3 1` | 48 | suave, mais lento (12 vizinhos) |
| **Stucki** | `* 8 4` | `2 4 8 4 2` | `1 2 4 2 1` | 42 | parecido com Jarvis, mais nítido |
| **Burkes** | `* 8 4` | `2 4 8 4 2` | | 32 | Stucki sem a 3ª linha: rápido e bom |
| **Sierra (3 linhas)** | `* 5 3` | `2 4 5 4 2` | `2 3 2` | 32 | |
| **Sierra2 (2 linhas)** | `* 4 3` | `1 2 3 2 1` | | 16 | ótimo custo-benefício |
| **Sierra-lite** | `* 2` | `1 1` (x−1, x) | | 4 | o mais rápido que ainda é decente |

Todos conferem: cada divisor é a soma dos pesos (menos o Atkinson, que soma 6 de 8 de propósito). Autoteste em `selftest.mjs`.

### Detalhes que decidem a qualidade

- **Serpentina** (`--serpentine`): inverta a direção nas linhas ímpares e espelhe o núcleo. Quebra as estrias diagonais direcionais.
- **Clamp antes de quantizar** (como acima), principalmente em Atkinson e Floyd-Steinberg com paletas reduzidas.
- **Faça em luz linear** (item 2) e converta de volta só para exibir.
- **Riemersma:** em vez de linhas, percorre a imagem por uma curva de Hilbert e soma os últimos `n` erros com peso exponencial
  (`weight[i] = r^(-i/(n-1))`, Surma usa `r = 1/8`, `n = 32`). Orgânico, simples, mas continua sequencial. Disponível no ImageMagick (`-dither Riemersma`, testado).
- **Não roda por pixel no shader:** cada pixel depende dos anteriores. Para GPU use ordenado/ruído azul; para difusão, pré-calcule em CPU/Worker.
- **Em movimento ferve:** medido em `scripts/frame-stability.mjs` (item 9): um clarão de +2% muda 25% dos pixels em Floyd-Steinberg e 0,9% em Bayer.

Confiança: alta nos núcleos (conferidos contra Tanner Helland; somas batem); média nos adjetivos estéticos (gosto).

---

## 6. Halftone: pontos, linhas, rosetas

Halftone de tela AM: a **grade** é fixa; o tom vira o **tamanho** do ponto (ou a espessura da linha). Não é dither de limiar por pixel: precisa de borda
suave (anti-alias), então o canvas costuma ter a resolução do dispositivo e a célula entra como passo da grade (`uCell`).

```glsl
// grade rotacionada por 'angle' (rad), passo 'pitch' (px de dispositivo); cover 0..1 = cobertura de tinta desejada
float dotLayer(vec2 fc, float angle, float pitch, float cover) {
  vec2 g = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * fc / pitch;
  float d = length(fract(g) - 0.5);                  // 0 no centro, ~0,71 nos cantos
  float r = 0.7071 * sqrt(clamp(cover, 0.0, 1.0));    // aproximação visual: raio ~ raiz da cobertura
  float aa = 1.2 / pitch;
  return 1.0 - smoothstep(r - aa, r + aa, d);
}
```

- **Cobertura exata** de um disco de raio `r` (célula de lado 1): `c = π·r²` para `r ≤ 0,5`; entre 0,5 e 0,7071 os discos vizinhos se tocam e
  `c = π·r² − 4·(r²·acos(0,5/r) − 0,5·√(r² − 0,25))`, chegando a 1 em `r = √2/2`. (Conferi por Monte Carlo: r = 0,62 dá 0,9680 pela fórmula e 0,9678 no sorteio.)
  A aproximação `r ≈ 0,7071·√c` do código escurece levemente os meios-tons; para fidelidade, inverta a fórmula acima por tabela.
- **Linhas:** `d = abs(fract(g.y) - 0.5) * 2.0` e acenda onde `d < cover`: a espessura segue o tom. Ângulo de 45° é o menos visível.
- **Rosetas (cor):** uma tela por tinta, em ângulos diferentes, que se sobrepõem em rosetas em vez de moiré feio. Conjunto padrão dos EUA para
  CMYK: **C 15°, M 75°, Y 0°, K 45°** (europeu: C 15°, M 45°, Y 0°, K 75°). O amarelo fica a 15° do ciano e pode gerar moiré, por isso costuma ter
  frequência ~108% maior. Esses ângulos nasceram de telas fotomecânicas; com telas eletrônicas há variações (ex.: ângulos deslocados 7,5° para evitar moiré de canal único).
  Preto único (1 tinta): 45°.
- **Para tokens do tema** (2 a 4 tons): duas telas em 15° e 45° (como no preset "Halftone rotacionado" do playground) já dão a impressão de
  rosetas sem simular CMYK.
- **Pronto na ImageMagick:** `convert in.png -colorspace Gray -ordered-dither h6x6a out.png` (halftone angulado 6x6; também `h4x4a`, `h8x8a`, ortogonais `h4x4o`...), testado.

Confiança: alta nos ângulos (The Print Guide, G. Pritchard) e na fórmula de cobertura (testada); média na parte de moiré de canal único.

---

## 7. Padrões simples: xadrez e linhas

São mapas de limiar de 1 passo, úteis para "3 tons com cara de gráfico":

```glsl
float checker(vec2 c) { return mod(c.x + c.y, 2.0) < 1.0 ? 0.25 : 0.75; }   // 50% de cinza = xadrez perfeito
float hlines(vec2 c, float n) { return (mod(c.y, n) + 0.5) / n; }            // n linhas de espessura crescente
```

O xadrez 1x1 em um tom intermediário simula um tom a mais (técnica clássica de pixel art, ex.: Game Boy: alternar #8bac0f e #9bbc0f
cria uma "5ª cor"). Combine com Bayer 2x2 se quiser. Não precisa de biblioteca.

---

## 8. Paletas: quantização RGB x luminância, retrô, k-means, tokens

### Dois modos

- **luma** (padrão): a paleta é uma **rampa tonal** ordenada por luminância. Dither da luminância com `floor(L*(K-1)+t)` e mapeia para a rampa.
  Perfeito para os 4 tons de um tema (c0 mais escuro ... c3 mais claro). Para ficar fiel, a rampa precisa ser monotônica em luminância.
- **rgb** (`--mode rgb`): preserva o matiz. Soma um deslocamento por canal ao pixel, `c' = c + spread·(t − 0,5)`, e escolhe a cor da paleta mais
  próxima. `spread` ≈ distância média entre cores vizinhas da paleta (o `dither-core.mjs` calcula em `auto`). Use com paletas coloridas
  não monotônicas (CGA, PICO-8) e quando a foto tem cor que importa.
  Em RGB a "linha entre duas cores" não é a luminância: a trama pode ter tons que o olho lê como cor errada em paletas esparsas.

### Paletas retrô: valores populares, não normas oficiais

| Nome (`--palette`) | Cores | Fonte e ressalva |
|---|---|---|
| `1bit` / `mac` | `#000000 #ffffff` | Macintosh original era 1 bit (tela 512x342); preto/branco |
| `gameboy` | `#0f380f #306230 #8bac0f #9bbc0f` | valores populares em sites de paleta; **o hardware varia por LCD** e não há "verde oficial" |
| `cga0` / `cga0-hi` | `#000 #00aa00 #aa0000 #aa5500` / `#000 #55ff55 #ff5555 #ffff55` | Wikipedia, "Color Graphics Adapter" (RGBI): marrom é caso especial (`#aa5500`, não amarelo escuro) |
| `cga1` / `cga1-hi` | `#000 #00aaaa #aa00aa #aaaaaa` / `#000 #55ffff #ff55ff #ffffff` | idem; o fundo (cor 0) é escolhido pelo programa; `#000` é o padrão |
| `ega` | 16 cores do RGBI (as de cima) | EGA suporta todos os modos CGA; paleta de 64 cores existiu, usei as 16 padrão |
| `apple2` | `#000 #fff #14f53c #ff44fd #ff6a3c #14cff5` | alta resolução, **aproximação NTSC**: varia por TV e emulador; sem fonte primária conferida (baixa) |
| `pico8` | 16 cores (`#1d2b53 #7e2553 #008751 ...`) | paleta do PICO-8; valores amplamente publicados, não conferidos na origem (média) |
| `rgb8` | primárias e secundárias + preto e branco | cubo RGB de 3 bits, só para teste |
| `gray:N` | N tons de cinza | uniforme em sRGB |
| `kmeans:N` | N cores da imagem | k-means leve (abaixo) |

`node scripts/dither-image.mjs --list` mostra tudo. CGA e PICO-8 não são rampas: use `--mode rgb`.

### Paleta a partir dos tokens do seu projeto

A paleta de uma tela real vem do tema. Em canvas/WebGL não leia `#hex` fixo: resolva o token (a técnica é a mesma em todos os snippets) e
passe `uC0..uC3`:

```js
const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
const token = (name) => {                         // '--c0' -> [r,g,b] em 0..255; entende oklch, color-mix, light-dark
  const el = document.body.appendChild(document.createElement('i'));
  el.style.color = `var(${name})`;
  probe.canvas.width = probe.canvas.height = 1;
  probe.fillStyle = '#000'; probe.fillStyle = getComputedStyle(el).color; probe.fillRect(0, 0, 1, 1);
  el.remove();
  return [...probe.getImageData(0, 0, 1, 1).data.slice(0, 3)];
};
```

CLI: `node scripts/resolve-tokens.mjs pagina.html --vars=--c0,--c1,--c2,--c3 --schemes light,dark --format csv`.

**Uma só cor com opacidade (Dither Kit, Boring Software, MIT):** em vez de 4 cores, desenhe uma cor e varie o alfa por célula
(só opacidade). Funciona nos dois temas com o mesmo código, porque a cor vem do `currentColor`/token e o fundo faz o resto. Limite:
só rampa de 1 cor.

### k-means leve (paleta tirada da imagem)

```js
export function kmeansPalette(rgba, k = 4, iters = 12) {       // em scripts/dither-core.mjs
  // amostra ~4096 pixels; centros iniciais espaçados por luminância (determinístico); devolve escuro -> claro
}
```

`node scripts/dither-image.mjs foto.png out.png --algo floyd-steinberg --palette kmeans:4 --cell 2 --serpentine` (prova em `scripts/proof/kmeans4-fs.png`).
~45 ms para uma imagem 512x320. É k-means no RGB sRGB: para "separar bem" paletas de poucas cores basta; para fidelidade perceptual use Lab/OKLab
(não implementado). Confiança: alta (testado).

---

## 9. Dither em movimento sem "nadar"

Três problemas diferentes costumam ser chamados de "nadar":

1. **Fervura (boiling):** o padrão muda de um quadro para o outro mesmo onde o conteúdo quase não mudou. É característica da difusão de
   erro. Medição (`node scripts/frame-stability.mjs`, imagem de teste 512x320, 1 bit, fração de pixels de saída que mudam):

   | algoritmo | brilho +2% | desloca 1 px |
   |---|---|---|
   | Bayer | 0,9% | 0,8% |
   | ruído azul | 0,9% | 0,8% |
   | ruído branco (semente fixa) | 1,0% | 0,8% |
   | Floyd-Steinberg | 24,6% | 28,6% |
   | Atkinson | 15,6% | 19,2% |
   | Sierra2 | 24,4% | 26,9% |

   Com semente nova a cada quadro, o ruído branco mudou 24,8% desta imagem (chuvisco de TV). No GIF de teste do `ffmpeg` (24 quadros de um degradê animado, 160x90, 4 cores, mesma paleta): `paletteuse=dither=bayer:bayer_scale=3`
   deu 9,7 kB (`bayer_scale=0`: 12,5 kB; `=5`: 8,4 kB); `atkinson`, 31,0 kB; `floyd_steinberg`, 35,0 kB; `sierra2_4a`, 35,6 kB; `none`, 7,7 kB.
   Arquivo ~3,6x menor e sem ferver: **vídeo e GIF em ordenado.** (Fonte sintética: confirme com o seu material.)

2. **Efeito "porta de chuveiro" (shower door):** o padrão está fixo na **tela** e o objeto se mexe "por trás" dele. É o que o ordenado em
   tela faz de graça. Em UI e fundos é o normal e muitas vezes o desejado.

3. **Padrão que deveria acompanhar o objeto** (3D, ou sprite que se move): aqui é preciso ancorar.
   - **2D / sprite:** calcule o limiar com coordenadas **relativas ao objeto** (`cell - floor(objetoPos / cell)`), deslocando em **células inteiras**
     (sem fração, para não tremer). O objeto "carrega" a trama.
   - **3D, câmera girando:** Lucas Pope (Return of the Obra Dinn) desloca o padrão de tela pela rotação da câmera:
     `DitherOffset = ScreenSize * CameraRotation / CameraFov` (uma tela por campo de visão); e mapeia o padrão em um cubo/esfera
     centrado na câmera, o que prende o padrão ao mundo na **rotação** (não na translação).
   - **3D, superfície:** "Surface-Stable Fractal Dithering" (Rune Skovbo Johansen / runevision, código aberto em `runevision/Dither3D`) prende o padrão à
     superfície e mantém a célula com tamanho constante na tela em qualquer distância. É o estado da arte; exige UVs e shader de material.
   - O preset SDF do playground usa dither em tela (item 2): é intencional e simples. Ancorar em 3D **não** foi implementado aqui.

### Dither temporal (animar o limiar)

Se quiser **mais níveis do que a trama dá**, mude o limiar a cada quadro e deixe o olho integrar (princípio do FRC em telas LCD):

```glsl
float t = fract(blueNoise(cell) + float(uFrame) * 0.61803398875);   // sequência de razão áurea, aditiva
```

O deslocamento por `φ⁻¹` mantém cada quadro quase azul e faz a média no tempo convergir rápido (técnica de A. Wolfe et al., "Spatiotemporal
Blue Noise Masks", EGSR 2022; explicação no blog técnico da NVIDIA). Isso **pisca** em 30 Hz ou menos e se perde com `prefers-reduced-motion`;
com movimento reduzido, congele `uFrame`. Para o visual de pixel, prefira trama fixa e anime o conteúdo (campo, objeto), como no fundo de campo com 4 tons (`receitas.md` §3).
No playground, `uTemporal` liga/desliga esse deslocamento (preset "Ruído azul animado"); lá `uFrame` avança a 12 por segundo, de propósito lento para a diferença aparecer.

### Receita de decisão

1. O visual é "retrô/trama"? Ordenado em tela, conteúdo animado, trama fixa.
2. Há objeto que se move dentro do campo? Trama fixa; só ancore se o balanço incomodar.
3. Vai virar GIF/vídeo? Ordenado, `bayer_scale` 2-3 no ffmpeg (intervalo 0..5, testado) e paleta global.
4. Movimento reduzido: quadro parado (as páginas animadas de `scripts/snippets/` fazem isso; `test-snippets.mjs` prova).

Confiança: alta nas medições e no GIF (rodado aqui); alta em Pope e runevision (leitura das fontes); média no uso do FRC e da razão áurea
(técnica documentada, mas não medi flicker em tela real).

---

## 10. Tabela de comparação

| Algoritmo | Aparência | Custo por pixel | Anima bem? | Onde roda | Use quando |
|---|---|---|---|---|---|
| Limiar (0,5) | cartaz de 1 bit, sem tom | trivial | sim | tudo | silhueta, "stencil" |
| Aleatório (branco) | granulado forte, aglomera | trivial | sim (chuvisco) ou estático | tudo | grão de filme, glitch |
| **Bayer 2/4/8/16** | trama regular, retrô | O(1), tabela ou bits | **sim, estável** | GPU, CPU, CSS (1 bit) | padrão para fundos e UI animados |
| **Ruído azul** | orgânico, sem trama | O(1) + textura 64² | **sim, estável** | GPU, CPU | gradiente grande, visual "natural" |
| IGN | azul aproximado | ~5 operações | sim | GPU | tempo real sem textura |
| Floyd-Steinberg | detalhe alto, orgânico | O(1) sequencial | **não** (ferve) | CPU/Worker | foto parada |
| Atkinson | contraste alto, Mac clássico | sequencial, 6 vizinhos | não | CPU | ícone/foto parada, estilo clássico |
| Jarvis / Stucki / Burkes / Sierra | suave, bordas limpas | 7-12 vizinhos | não | CPU | máxima qualidade parada |
| Riemersma | muito orgânico | sequencial, curva de Hilbert | não | CPU | qualidade de difusão com menos estrias |
| Halftone (AM) | pontos/linhas de impressão | O(1) com anti-alias | sim | GPU melhor | pôster, jornal, "risograph" |
| Xadrez/linhas | gráfico, 2-3 níveis | trivial | sim | tudo | 3 tons rápidos |
| Temporal (limiar animado) | mais tons, cintila | O(1) | sim, mas pisca | GPU | tela rápida, ≥ 60 Hz, sem reduced-motion |

Custo medido só o que consta no pacote: ver `fps-probe.mjs` (cadência do rAF, **em CPU por software**: não vale para GPU real).

---

## 11. Ferramentas deste pacote que provam cada item

| Item | Comando | Prova |
|---|---|---|
| Matrizes Bayer, GLSL, JS, CSS, PNG | `node scripts/bayer.mjs 8 --format glsl` | `selftest.mjs`: 114 verificações, GLSL = matriz em WebGL1 e WebGL2 |
| Ruído azul | `node scripts/blue-noise.mjs 64 --out blue.png` | permutação 0..N²-1, determinístico, 0,2% de variância em baixas frequências |
| Difusão, paletas, k-means, ordenado em imagem | `node scripts/dither-image.mjs in.png out.png --algo atkinson --palette gameboy` | PNGs em `scripts/proof/` |
| Fervura entre quadros | `node scripts/frame-stability.mjs` | tabela do item 9 |
| Shader ao vivo | `scripts/shader-playground.html` | `test-playground.mjs`: 26 verificações, 4 presets |
| Snippets por biblioteca | `node scripts/test-snippets.mjs` | 24 combinações (12 snippets x 2 temas) e folhas em `proof/snippets-*.png` |
| Captura, tema, reduced-motion | `node scripts/capture.mjs` | ver `scripts/README.md` |

---

## 12. Fontes e nível de confiança

Acessadas em 2026-11-05.

| Tema | Fonte | Confiança |
|---|---|---|
| Visão geral, ordenado "adequado para animações" | Wikipedia, "Dither" e "Ordered dithering" (en.wikipedia.org/wiki/Dither) | alta |
| Bayer, ruído azul, Atkinson, Riemersma, Obra Dinn | Surma, "Ditherpunk" (surma.dev/things/ditherpunk/) | alta |
| Núcleos de difusão (11 algoritmos) | Tanner Helland, "Image Dithering: Eleven Algorithms and Source Code" (tannerhelland.com/2012/12/28/dithering-eleven-algorithms-source-code.html) | alta |
| Void-and-cluster, texturas livres | Christoph Peters, "Free blue noise textures" (momentsingraphics.de/BlueNoise.html); R. Ulichney, "The void-and-cluster method for dither array generation", SPIE 1913, 1993 (não abri o paper) | alta / média |
| IGN | J. Jimenez, "Next Generation Post Processing in Call of Duty: Advanced Warfare", SIGGRAPH 2014 (iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare/) | média nas constantes |
| Ruído azul espaço-temporal, razão áurea | Wolfe, Peters, Hart et al., "Spatiotemporal Blue Noise Masks", EGSR 2022; NVIDIA Developer Blog, "Rendering in Real Time with Spatiotemporal Blue Noise Textures, Part 2" | média |
| Dither estável em 3D (Pope) | L. Pope, devlog TIGSource nov/2017, "Stabilizing The Dither" (dukope.com/devlogs/obra-dinn/tig-32/) | alta |
| Dither fixo na superfície | R. Skovbo Johansen, "Surface-Stable Fractal Dithering" (runevision.com/tech/dither3d/, github.com/runevision/Dither3D) | alta |
| Ângulos de tela CMYK, rosetas | G. Pritchard, "Halftone screen angles", The Print Guide (the-print-guide.blogspot.com/2009/05/halftone-screen-angles.html) | alta |
| CGA | Wikipedia, "Color Graphics Adapter" e "List of 8-bit computer hardware graphics" | alta |
| Game Boy | paletas comunitárias (pixel-editor.com/palettes/gameboy-green, magicpixel.art/palettes/gameboy-dmg) | média (não é norma) |
| ImageMagick `-ordered-dither`, `thresholds.xml` | execução local no ImageMagick 6.9.12-98; `convert -list threshold` | alta (testado) |
| ffmpeg `paletteuse` (`bayer_scale` 0..5) | execução local no ffmpeg 6.1.1 | alta (intervalo); média (descrição do efeito visual) |

---

## 13. O que não foi provado

- **Desempenho em GPU real** e em celular: todos os testes usaram SwiftShader (WebGL por software) no Chromium. Provam correção e comparação relativa, não FPS.
- **Safari e Firefox:** a receita CSS (`mix-blend-mode: plus-lighter` + `contrast(1000)`) e o filtro SVG só rodaram no Chromium 153.
- **Pixels "no limiar" no CSS:** nos quadros estáticos da receita CSS ~0,05% dos pixels (os que caem exatamente no limiar) oscilaram entre capturas; o teste tolera 0,2%.
- Flicker perceptual do dither temporal em monitor real; ancoragem 3D do dither (Pope/Dither3D) não foi implementada, só descrita.
- Matriz de ImageMagick 7: só testei o 6.9.12 (as opções são as mesmas com `magick`).
- Aseprite e Dither Me This: não usei (ver `stack-e-libs.md`).
