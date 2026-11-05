# WebGL / shader

Conteudo: 1 Quando usar, 2 Esqueleto minimo, 3 O fragment shader do motor (5 modos; 3.1 passthrough vs mosaic), 4 Uniforms, 5 Tamanho da celula (DPR e escala), 6 Texturas (premultiplicado, NEAREST, mipmap), 7 Entrada e transicao, 8 Ciclo de vida e limites, 9 Verificar o shader, 10 Halftone 3D em fragment shader.

Codigo-fonte do caso real: `rodada3/mockups/d3-cobalto-pixel.html` (classe `Dither`, constantes `VS` e `FS`) e `packages/ui/src/dither/field.tsx` (fundo "Mare Bayer" em React). A implementacao reutilizavel desta skill e `scripts/js/dither-gl.js` (classe `DitherGL`); o exemplo e `examples/shader-gradient-map.html`.

## 1. Quando usar WebGL (e quando nao)

Use quando precisa de: efeito por pixel em imagem real (gradient-map, hachura), transicao em tela cheia a 60 fps, muitos pixels animados, ou dissolve entre duas texturas. **Nao use** para fundo simples (Canvas 2D a 12 a 15 fps e mais leve e roda em qualquer lugar) nem para tingir imagem por paleta (filtro SVG resolve; ver `svg-css.md`).

Biblioteca ou shader cru? Para 1 efeito, shader cru (~120 linhas, 0 dependencias). Para varios efeitos prontos, Paper Shaders (`Dithering`, `ImageDithering`, `HalftoneDots`; exige WebGL2). Para cena 3D real, three.js. Veja `bibliotecas.md`.

## 2. Esqueleto minimo (WebGL1, funciona em quase tudo)

```js
const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
if (!gl) { /* fallback: imagem pre-assada ou gradiente CSS */ }
const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
const pr = gl.createProgram();
gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
gl.linkProgram(pr);
if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
gl.useProgram(pr);
const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);  // TRIANGLE_STRIP
const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc);
gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
```
Alternativa de 1 triangulo cobrindo a tela (usada em `field.tsx`): vertices `[-1,-1, 3,-1, -1,3]` com `gl.drawArrays(gl.TRIANGLES, 0, 3)`.

Defina `antialias: false` (antialias borra o dither) e dimensione o canvas em pixels reais: `canvas.width = cssW * dpr`, `canvas.height = cssH * dpr`, `gl.viewport(0,0,w,h)`.

## 3. O fragment shader do motor

Cinco modos num so shader (do caso real, simplificado em comentarios). `mode` e float; compare com limiares (`<.5`, `<1.5` ...).

| mode | Nome | O que faz |
|---|---|---|
| 0 | gradient-map | luminancia da textura -> N tons -> cor da rampa (c0..c3) com Bayer |
| 1 | fundo | gradiente radial/ondas quantizado em tons + Bayer; sem textura |
| 2 | hachura | linhas cuja espessura segue a luminancia (gravura) |
| 3 | overlay de transicao | cobre a tela onde `bayer(cell) < t`, com borda |
| 4 | passa-direto | textura original (ja na paleta), so com dissolve Bayer na entrada |

Trechos essenciais (completo em `d3-cobalto-pixel.html`, linhas 270 a 345):

```glsl
precision highp float;
uniform sampler2D tx; uniform vec2 res;
uniform float px, time, grain, amt, steps, mode, lo, hi, gam, reveal, revMode, aDither, hatchPer, t, sweep, bgK, bgWave;
uniform vec2 focus;
uniform vec3 c0, c1, c2, c3;                       // rampa: sombra -> brilho

float b2(vec2 a){ a=floor(a); return fract(a.x/2.+a.y*a.y*.75); }
float b4(vec2 a){ return b2(.5*a)*.25+b2(a); }
float b8(vec2 a){ return b4(.5*a)*.25+b2(a); }
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
vec3  pal(float k){ float u=k*3.; vec3 c=c0; c=mix(c,c1,step(.5,u)); c=mix(c,c2,step(1.5,u)); c=mix(c,c3,step(2.5,u)); return c; }
float quant(float l){ float k=floor(clamp(l,0.,.9999)*steps); return floor(k*(3./(steps-1.))+.5)/3.; }  // N niveis -> indices da rampa de 4
vec4  tap(vec2 uv){ vec4 s=texture2D(tx,uv); return vec4(s.rgb*s.a, s.a); }     // premultiplica a amostra

void main(){
  vec2 cell = floor(gl_FragCoord.xy/px);            // 1 celula = 1 "pixel de arte"
  vec2 q    = (cell+.5)*px/res;                     // amostra no CENTRO da celula => pixeliza
  vec2 uv   = vec2(q.x, 1.-q.y);                    // sem UNPACK_FLIP_Y, inverte aqui
  float d   = (b8(cell)-.5)*amt;
  float g   = (hash(cell+floor(time*8.))-.5)*grain;
  // mode 0 (gradient-map): media de 4 taps para suavizar antes de quantizar
  vec2 o = .25*px/res;
  vec4 s = tap(uv+vec2(-o.x,-o.y))+tap(uv+vec2(o.x,-o.y))+tap(uv+vec2(-o.x,o.y))+tap(uv+vec2(o.x,o.y));
  float a = s.a/4.;  vec3 rgb = s.rgb/max(s.a,.001);
  float lum = dot(rgb, vec3(.2126,.7152,.0722));
  lum = pow(clamp((lum-lo)/(hi-lo),0.,1.), gam);
  float vis = step(b8(cell+9.), reveal);            // entrada: dissolve Bayer
  vec3 col = pal(quant(lum + d/steps + g));
  float at = aDither>.5 ? b8(cell+3.)*.9+.05 : .5;  // alfa tramado (borda do objeto em dither)
  float al = step(at, a)*vis;
  gl_FragColor = vec4(col*al, al);                  // SAIDA PREMULTIPLICADA
}
```

Modo 1 (fundo) usa `l = 1 - distance(u*vec2(asp,1), focus*vec2(asp,1))*bgK + bgWave*sin(u.x*6.+time*.6)*sin(u.y*5.-time*.5)` e `pal(quant(l + d/steps + g))`.
Modo 3 (transicao): `thr=b8(cell); v=t*1.25-ax*.25; cov=step(thr,v); edge=cov*(1.-step(thr,v-.06)); col=mix(c0,c1,edge); gl_FragColor=vec4(col*cov,cov);` onde `ax = mix(uv.x, uv.y, sweep)` escolhe a direcao da varredura (horizontal ou vertical).

### Receita "campo + tons" (fundo sem textura), do `field.tsx`
```glsl
vec2 cell = floor(gl_FragCoord.xy/uCell);
vec2 uv = (cell+.5)*uCell/uRes;
float f = .5 + .25*sin(uv.x*7.+t*.55) + .25*sin(uv.y*9.-t*.45+uv.x*3.);   // campo suave em movimento
float lum = f * (.1 + .9*lit) * (.55 + .6*uLevel);                          // lit: ate onde "acende"
float q = clamp(floor(lum*3. + bayer8(cell))/3., 0., 1.);                    // 4 tons
```
Esta forma (`floor(lum*3 + bayer)`) e a do Python: mesma ideia, limiar uniforme em (0,1).

### 3.1 `passthrough`: nitido ou mosaico (`mosaic`)

O modo 4 mostra a textura original; so a **entrada** e tramada. Em `scripts/js/dither-gl.js`:

| `mosaic` | Resultado | Quando |
|---|---|---|
| `false` (padrao) | textura na resolucao cheia, nitida; so o dissolve Bayer (`reveal`) ou a varredura (`revealMode: 'sweep'`) decide quais celulas aparecem | arte ja em dither/pixel-art: o objeto chega tramado mas termina perfeito |
| `true` | a textura tambem vira **mosaico de celulas `px`** (amostra no centro da celula) | efeito pixel-resolve: anime `px` de 32 para 4 em potencias de 2 junto com `reveal` |

```js
// entrada nitida (dissolve Bayer)
g.draw({ mode: 'passthrough', reveal: v, px: 4 });
// pixel-resolve (mosaico que se divide)
g.draw({ mode: 'passthrough', mosaic: true, px: PX[idx], reveal: Math.min(1, v * 1.15) });
```
Sem `mosaic` o `px` so afeta a grade do dissolve. Para arte a ser **requantizada** na paleta use `gradient-map`, nao `passthrough`.

## 4. Uniforms (tabela do motor)

| Uniform | Tipo | Significado |
|---|---|---|
| `px` | float | tamanho da celula em px de CANVAS (ver secao 5) |
| `steps` | float | quantos niveis (2 a 4) |
| `amt` | float | forca do padrao Bayer, 0..1 |
| `grain`, `time` | float | grao e relogio (segundos) |
| `lo`, `hi`, `gam` | float | levels/gamma da luminancia antes de quantizar |
| `reveal` | float | 0..1, dissolve Bayer de entrada (`step(b8(cell+9.), reveal)`) |
| `revMode` | float | 0 = dissolve por celula; 1 = varredura diagonal |
| `aDither` | float | 1 = alfa da borda tramado |
| `hatchPer` | float | periodo da hachura em px de canvas |
| `t`, `sweep` | float | transicao: progresso 0..1 e eixo (0 = x, 1 = y) |
| `bgK`, `bgWave`, `focus` | float, float, vec2 | forma do fundo (modo 1) |
| `c0..c3` | vec3 | rampa de 4 cores, 0..1, escura -> clara |

Cores: converta hex para vec3 em 0..1 (`[1,3,5].map(i => parseInt(h.slice(i,i+2),16)/255)`). Para cor de marca, mande a cor em sRGB e deixe o shader trabalhar em sRGB (como o caso real); nao misture com linear sem motivo.

## 5. Tamanho da celula: DPR e escala

O erro mais caro: dimensionar a celula pela textura. Se o objeto e redimensionado por CSS `transform: scale(s)` depois de renderizado, cada pixel do canvas aparece com `s/DPR` px CSS. Para a celula ter `cell_css` px **na tela**:

```
px_canvas = cell_css * DPR / s          // s = escala CSS atual do objeto
```
No caso real (`drawObj`): `cellScreen = cell * resolve * hoverK * lerp(small, 1, clamp((s-.15)/.7))`, `px = max(1, cellScreen*DPR/s)`. Atualize `px` a cada quadro enquanto o objeto escala/morfa (FLIP), senao o dither borra ou engrossa.
`hatchPer` segue a mesma conta; use um piso (`max(2.5, ...)`) para a hachura nao sumir.

DPR: limite a 1.5 em fundos (`Math.min(devicePixelRatio, 1.5)`); como o dither e pixelado de proposito, DPR 1 ja fica bom.

## 6. Texturas

```js
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !!premult);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
if (!nearest) gl.generateMipmap(gl.TEXTURE_2D);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, nearest ? gl.NEAREST : gl.LINEAR_MIPMAP_LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, nearest ? gl.NEAREST : gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
```
- **Premultiplicado**: PNG com alfa + mipmap sem premultiplicar gera franja escura nas bordas. Ative `UNPACK_PREMULTIPLY_ALPHA_WEBGL` (ou premultiplique no shader como `tap()`, mas escolha UM lugar para nao premultiplicar duas vezes). E o canvas com `premultipliedAlpha: true` exige saida `vec4(rgb*a, a)`.
- **Pixel-art**: `NEAREST`, **sem** mipmap. Bordas nitidas.
- **WebGL1 e mipmap**: `generateMipmap` exige textura potencia de 2 (512, 1024...). Texturas NPOT: use `LINEAR` sem mipmap e `CLAMP_TO_EDGE`. WebGL2 nao tem essa restricao.
- **Origem Y**: sem `UNPACK_FLIP_Y_WEBGL` a textura vem de cabeca para baixo; o caso real inverte no shader (`uv.y = 1 - q.y`).
- **Cross-origin**: imagem de outro dominio sem CORS contamina a textura (erro de seguranca). Sirva as imagens do mesmo dominio ou com `crossOrigin='anonymous'` e cabecalho CORS.
- **`file://`**: bloqueia a textura. Sempre HTTP.

## 7. Entrada e transicao

- **Dissolve Bayer**: `reveal` de 0 a 1 por mola; `visible = step(b8(cell+9.), reveal)`.
- **Pixel-resolve**: comece com `px` grande (24) e desca para o valor final em potencias de 2.
- **Dissolve A -> B** entre duas texturas: `float pickB = step(b8(cell+17.), clamp(mixp*1.35 - tuv.x*.35, 0., 1.)); vec4 s = mix(texture2D(tA,tuv), texture2D(tB,tuv), pickB);` (varredura da esquerda para a direita, sem crossfade de alfa, que parece PowerPoint).
- **Overlay**: canvas tela cheia por cima da pagina, `pointer-events:none`; anime `t` 0 -> 1 (cobre), troque a pagina, anime 1 -> 0 (revela). Ver `workflows/transicao-pixelada.md`.

## 8. Ciclo de vida e limites

- Navegadores derrubam o contexto mais antigo depois de ~16 contextos WebGL. Um canvas por superficie grande; **nao** um por moeda. Para varios objetos pequenos, um canvas compartilhado com viewport/scissor, ou Canvas 2D.
- Pare o loop com `IntersectionObserver` (fora da viewport) e `visibilitychange`; desenhe 1 quadro estatico em `prefers-reduced-motion`.
- Ao desmontar: `gl.getExtension('WEBGL_lose_context')?.loseContext()` para nao vazar contexto.
- `precision highp float` nem sempre existe em GPU movel antiga; para fundos simples `mediump` serve (verificar o look).
- Sem WebGL: fallback em PNG pre-assado pelo mesmo algoritmo (`scripts/python/dither_image.py`), ou fundo Canvas 2D.

## 9. Verificar o shader

- Erro de compilacao: lance `getShaderInfoLog` e conte em `window.__shaderErrors`; o verificador falha se > 0.
- Contar cores: com a rampa de 4 tons, `readPixels` logo apos o `draw` deve dar ~4 cores opacas distintas (4 no modo gradient-map sem grao). Se `preserveDrawingBuffer` for falso, leia no mesmo tick do desenho.
- Headless sem GPU: `--use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`. O aviso "GPU stall due to ReadPixels" e inofensivo.

## 10. Halftone 3D em fragment shader (sem three.js)

`examples/halftone-3d.html` desenha uma **esfera** ou um **cubo** inteiros no fragment shader, sem malha nem textura, e aplica halftone (pontos) ou Bayer 8x8 sobre a luz. A luz segue o ponteiro; sem ponteiro ela deriva devagar; `prefers-reduced-motion` desliga rotacao e deriva.

Receita:
1. **Forma**: esfera por normal analitica (`z = sqrt(1 - x^2 - y^2)` dentro do disco, `n = vec3(x, y, z)`); cubo por intersecao raio-caixa ortografica (slabs) girando.
2. **Luz**: `lum = .07 + .93*max(dot(n, normalize(light)), 0.)` (ambiente pequeno + difusa). `light` vem do ponteiro (uniform `vec3`). A funcao `shade(p)` devolve `(lum, cobertura)`.
3. **Halftone**: grade girada 45 graus em px de tela (`cell*dpr`); amostre a luz no **centro da celula** (nao por pixel) para os pontos ficarem limpos; raio `r = sqrt(lum)*0.6` (pontos crescem com a luz); `ink = smoothstep(r + aa, r - aa, length(fract(p) - .5))`.
4. **Bayer** (no exemplo, 3 tons): `l = lum + (b8(cellId) - .5)*.55; cor = l < .30 ? t0 : (l < .62 ? t1 : t2)`, com a luz amostrada no centro da celula (`algoritmos.md` secao 2).
5. **Celula em px de tela**: uniform `cell` = css * `devicePixelRatio` (controle de 4 a 24 no exemplo).
6. Desenhe so sob demanda se movimento reduzido (ponteiro/controles).

Limite conhecido: o halftone girado a 45 graus **serrilha na borda da esfera** (os pontos cortados pela silhueta); aumente `aa`, reduza a celula ou desenhe a borda com um anel liso (`armadilhas.md`, Limites conhecidos). Com three.js real, renderize a cena num `WebGLRenderTarget` e aplique o mesmo halftone num passe de tela cheia (comentario no topo do HTML descreve o caminho com `EffectComposer`); so vale com cena 3D de verdade.
