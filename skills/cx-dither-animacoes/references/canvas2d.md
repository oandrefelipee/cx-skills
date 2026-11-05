# Canvas 2D

Conteudo: 1 Por que Canvas 2D, 2 Fundo animado Bayer (codigo), 3 Controle de fps, pausa e reduced-motion, 4 Sombra pontilhada, 5 Marcador pontilhado, 6 Confete em quadradinhos, 7 Dicas.

Implementacao reutilizavel: `scripts/js/dither-canvas.js`. Exemplo: `examples/bg-animado-canvas.html`. Origem do caso real: `rodada4/build_r5g.py` (bloco `DITHER_JS`, funcao `paintDz`) e `build_r5h.py`.

## 1. Por que Canvas 2D

- Roda em qualquer lugar (sem WebGL, sem GPU), leve, facil de depurar.
- O truque: o canvas tem **resolucao baixa** (`W/CELL x H/CELL`) e o CSS o amplia com `image-rendering: pixelated`. 1 pixel do canvas = 1 celula de dither; o custo cai com CELL^2.
- Limite: efeitos por pixel em imagem real e 60 fps em tela cheia pedem WebGL.

## 2. Fundo animado Bayer

```js
const CELL = 4;                                             // css px por celula
const BAYER = [0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5].map(v => (v + .5) / 16);
const hex = h => [1,3,5].map(i => parseInt(h.slice(i, i + 2), 16));
const TONES = ['#0023C4', '#1F3FE0', '#4F6BFF'].map(hex);   // 3 tons do mesmo matiz: base, medio, claro

function paint(cv, t) {                                      // t em segundos
  const W = cv.parentElement.offsetWidth, H = cv.parentElement.offsetHeight;
  const cw = Math.max(1, Math.round(W / CELL)), ch = Math.max(1, Math.round(H / CELL));
  if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; cv._g = null; }
  const g = cv._g || (cv._g = cv.getContext('2d'));
  const im = g.createImageData(cw, ch), d = im.data, L = TONES.length;
  const asp = cw / ch, fx = .5 + .3 * Math.sin(t * .35), fy = .5 + .25 * Math.cos(t * .28);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const u = x / cw, w = y / ch;
    let v = Math.max(0, 1 - Math.hypot((u - fx) * asp * .5, (w - fy) * .9) * 1.35)       // mancha que se move
          + .1 * Math.sin(u * 6 + t * .6) * Math.sin(w * 5 - t * .5);                    // ondas lentas
    v = Math.min(1, Math.max(0, v));
    const k = Math.min(L - 1e-6, v * (L - 1)), b = Math.floor(k);
    const col = TONES[b + ((k - b) > BAYER[(y & 3) * 4 + (x & 3)] ? 1 : 0)] || TONES[L - 1];  // dither entre tons vizinhos
    const i = (y * cw + x) * 4; d[i] = col[0]; d[i+1] = col[1]; d[i+2] = col[2]; d[i+3] = 255;
  }
  g.putImageData(im, 0, 0);
}
```
CSS do canvas: `position:absolute; inset:0; width:100%; height:100%; image-rendering:pixelated; pointer-events:none;`.

Ideia-chave: com L tons, `k = v*(L-1)`; a parte fracionaria `k - b` e comparada ao limiar Bayer para decidir entre o tom `b` e o `b+1`. E a mesma conta de `floor(lum*(N-1) + t)`.

Variantes do caso real (campo `mode`): `sel` (brilho que varre um cartao selecionado: `v = 1 - min(1, abs((u*.7 + w*.5) - fase)*4.5)`), `glow` (halo no canto, so no passo final), `road` (faixa que corre numa barra de progresso), `spark` (mancha com centelhas: `hash(x,y,floor(t*4)) < .014` pinta 1 pixel da cor de destaque).

## 3. fps, pausa e reduced-motion

```js
const RM = matchMedia('(prefers-reduced-motion: reduce)');
let last = 0, raf = 0, visible = true;
function loop(now) {
  raf = requestAnimationFrame(loop);
  if (document.hidden || !visible || RM.matches) return;
  if (now - last < 1000 / 12) return;                  // ~12 fps (83 ms); 15 fps tambem funcionou
  last = now; paint(cv, now / 1000);
}
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cv);
if (RM.matches) paint(cv, 2);                           // um quadro estatico
else raf = requestAnimationFrame(loop);
```
Repinte sob demanda ao redimensionar (`ResizeObserver`) e depois que as fontes carregam (`document.fonts.ready`), porque o tamanho do pai muda. Se o tom depende da cor de fundo do pai (`getComputedStyle(parent).backgroundColor`), invalide o cache de tons quando o tema/atributo mudar (`MutationObserver`).

12 a 15 fps ja parece "vivo" em dither e custa pouco; 30 a 60 fps so se o movimento for rapido (e use WebGL).

## 4. Sombra pontilhada (sombra de contato)

Troca o `drop-shadow` chapado por uma trama Bayer sob o objeto. Em CSS, um tile 4x4 como `background`:

```css
.sombra {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4' shape-rendering='crispEdges'%3E%3Crect x='0' y='0' width='1' height='1' fill='%23000a50'/%3E%3Crect x='2' y='2' width='1' height='1' fill='%23000a50'/%3E%3C/svg%3E");
  background-size: 8px 8px;          /* cada ponto = 2 px */
  image-rendering: pixelated;
}
```
Dois tiles do caso real: **esparso** (`(0,0),(2,2)` = ~12% de cobertura) e **xadrez** (8 de 16 pontos = 50%). Gere o tile em Python/JS (`tile(pts)` em `build_r5g.py`) e use mais denso perto do objeto, mais esparso longe (duas camadas). Escureca o fundo na mesma familia de cor, nao preto puro.

## 5. Marcador pontilhado sob a palavra de destaque

Barra 44x4 em que a densidade cai da esquerda para a direita (`dens = 1 - 0.72*(x/(W-1))`) e cada ponto e um `rect 1x1` pintado se `dens > bayer4[(y+off)%4][(x+off)%4]`:

```python
BAY = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]
def marker_svg(off, W=44, H=4):
    r = ''.join(f'<rect x="{x}" y="{y}" width="1" height="1"/>'
                for y in range(H) for x in range(W)
                if 1.0 - 0.72*(x/(W-1)) > (BAY[(y+off)%4][(x+off)%4] + .5)/16)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="none" shape-rendering="crispEdges">{r}</svg>'
```
Duas versoes (`off=0` e `off=2`) alternadas com `steps(1)` dao um "tremor" de pixel.

## 6. Confete em quadradinhos 4x4

Canvas de **meia resolucao** (`modal.offsetWidth/2`), particulas de 2x2 px de canvas = 4x4 px na tela, 2 tons:
```js
parts.push({ x, y: -4, vx: (Math.random()-.5)*18, vy: 30 + Math.random()*40, c: COLORS[i % COLORS.length], z: 2, life: 5, g: 12 });
// por quadro:
p.vy += p.g*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt;
fg.fillStyle = p.c; fg.fillRect(Math.round(p.x), Math.round(p.y), p.z, p.z);   // round => pixel-perfect
```
Rajada ao clicar: `a = rand*2PI, s = 40 + rand*90, vx = cos(a)*s, vy = sin(a)*s - 60, g = 260, life = .7 + rand*.4`.
Regras: pare quando `document.hidden`; so confete "de parede" nas laterais para nao cobrir texto; `Math.round` nas posicoes; limite o numero de particulas (< 150).

## 7. Dicas

- Nunca pinte dither por cima de texto: se precisar, deixe o centro limpo (aneis/halos com miolo vazio, particulas nas laterais).
- Use poucas cores (3 a 4) por canvas. Dither com 10 cores vira ruido.
- Tons do mesmo matiz (azul sobre azul) leem como textura; tons de matizes diferentes leem como padrao e brigam com o conteudo.
- Em tema escuro/claro, derive os tons da cor de fundo do pai (`base`, `base + 12% branco`, `base + 24% branco`) em vez de fixar hex.
