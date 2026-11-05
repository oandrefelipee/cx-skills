# Imagem por script (Python, Pillow, numpy)

Conteudo: 1 Quando usar, 2 Dither de imagem existente, 3 Modo pixel-grid, 4 Ilustracao procedural (materiais, luz, rampas), 5 Contorno de tinta, adesivo e sombra, 6 Validar pixel-art nativa, 7 Prancha comparativa, 8 ImageMagick e ffmpeg, 9 Erros comuns.

Scripts da skill: `scripts/python/dither_image.py`, `procedural_sticker.py`, `palette_tools.py`, `make_sheet.py`. Confirme flags com `--help`. Origem do caso real: `rodada4/tools/money_dither.py` (moedas, cedulas, macos), `extras_dither.py` (avisos, carrinho), `rodada3/gerar-rabiscos.py`.

## 1. Quando usar

Quando o resultado final e uma **imagem** (PNG/WebP com alfa) ou quando voce quer **controle total** sobre uma ilustracao: geometria, luz por material, linhas em tom forcado. Tambem como fallback pre-assado de qualquer efeito de shader. Dependencias: `pillow`, `numpy` (nao instale sem pedir; verifique com `python3 -c "import PIL, numpy"`).

## 2. Dither de uma imagem existente

Pipeline: carregar RGBA -> separar alfa -> luminancia (de rgb nao premultiplicado) -> contraste (lo/hi/gamma) -> quantizar com o algoritmo -> mapear tons para a paleta -> reaplicar alfa.

```python
import numpy as np
from PIL import Image

def load(path):
    im = Image.open(path).convert('RGBA'); a = np.asarray(im).astype(np.float32) / 255
    return a[..., :3], a[..., 3]

def luminance(rgb):
    return rgb @ np.array([.2126, .7152, .0722], np.float32)

def ordered(lum, ramp, cell=4, n=8):               # ramp: array (N,3) uint8, escuro -> claro
    h, w = lum.shape
    B = bayer(n)                                     # ver algoritmos.md
    yy, xx = np.mgrid[0:h, 0:w]
    thr = (B[(yy//cell) % n, (xx//cell) % n] + .5) / (n*n)
    idx = np.minimum(np.floor(lum*(len(ramp)-1) + thr).astype(int), len(ramp)-1)
    return ramp[idx]

rgb, a = load('in.png')
lum = np.clip((luminance(rgb) - .05) / .9, 0, 1) ** 1.0    # lo=.05, hi=.95, gamma=1
ramp = np.array([[11,16,51],[76,29,149],[45,212,191],[255,201,51]], np.uint8)
out = np.dstack([ordered(lum, ramp), (a > .5).astype(np.uint8) * 255])   # alfa binario
Image.fromarray(out, 'RGBA').save('out.png')
```
- Alfa: para pixel-art/dither use alfa **binario** (`a > .5`) para as bordas ficarem nitidas; para suavidade, mantenha alfa e use o ruido de Bayer para tramar a borda (`aDither`).
- Para Floyd-Steinberg/Atkinson com paleta (nao so cinza), ponto mais proximo por distancia euclidiana em RGB (ou Lab para fidelidade) e propague o erro por canal; ver `algoritmos.md`.

## 3. Modo pixel-grid

Trabalhe na grade grossa e amplie:
```python
cell = 8
small = im.resize((im.width//cell, im.height//cell), Image.BOX)       # media de caixa
# ... aplique o algoritmo em 'small' (aqui o tamanho da celula de dither e 1 pixel) ...
big = small.resize((small.width*cell, small.height*cell), Image.NEAREST)
```
Resultado: cada pixel logico e um bloco `cell x cell` identico; combina com `image-rendering: pixelated`. `LANCZOS` e para reduzir arte normal; **nunca** use LANCZOS/BICUBIC para ampliar pixel-art.

## 4. Ilustracao procedural (dither por material)

A tecnica do caso real: **geometria e luz calculadas uma vez; so a rampa de cores muda** entre paletas.

1. Desenhe cada forma como mascara booleana em **supersampling 2x** (`ImageDraw.polygon` em canvas 2N, depois `resize(..., Image.BOX)` e `>= 128`).
2. Cada forma tem um **material** (inteiro) e uma **luminancia** por pixel, calculada por funcao `lum(u, v)` em coordenadas locais da forma (rotacionadas), com luz de **cima a esquerda** (`LX, LY = -0.6, -0.8`): `lum = base + k*(u*LX + v*LY)`; aneis/degraus de cor por faixa de raio; cristas `sin(K*arcsin(u)) > 0` para o serrilhado da borda de moeda.
3. Quantize **por material** com Bayer 8x8 em celulas de 4 px: `idx = min(floor(clip(lum,0,1)*3 + THR), 3)`; cada material tem uma **rampa de 4 tons** (sombra, medio-escuro, medio-claro, brilho).
4. **Linhas finas** (guilhoche, filetes, texto, numeros) entram como "detalhe": `force = material*4 + tom`, em tom fixo, **sem dither**, so onde o material permite (`np.isin(mat, only)`).
5. Trocar a paleta = trocar o dicionario `{material: rampa}`; a composicao e identica.

Estrutura de dados do original (resumo):
```python
mat   = np.zeros((N,N), uint8)    # 0 = vazio, 1 = tinta, 2.. = materiais
lum   = np.zeros((N,N), float32)  # luminancia 0..1 por pixel
force = np.full((N,N), -1, int16) # -1 = usar dither; >=0 = (material*4 + tom) fixo
```
Pintar (`paint(mask, mat, lum, F, ink=True)`) escreve o contorno de tinta ANTES (dilata a mascara em `INK_R` px), depois o material.

Quantizacao e colorizacao do original:
```python
def tones(S):
    v = np.clip(S.lum, 0, 1) * 3
    return np.minimum(np.floor(v + THR).astype(np.int32), 3)

def colorize(S, idx, pal):
    out = np.zeros((N, N, 4), np.uint8)
    for mat, rp in pal.items():                       # rp: array (4,3) uint8
        sel = (S.mat == mat) & (S.force < 0)
        out[sel, :3] = rp[idx[sel]]
    f = (S.force >= 0) & (S.mat > INK)                # detalhes em tom forcado
    # ... aplica rp[force % 4] por material ...
    out[S.mat > 0, 3] = 255
    out[S.mat == INK, :3] = INK_COLOR
    return out
```
Escala: normalize para a arte caber em `FIT` px (itere `k *= 0.97` ate o bbox caber), assim a arte tem tamanho consistente com o adesivo.

## 5. Contorno de tinta, adesivo e sombra

- **Contorno de tinta**: dilate a mascara em 3 px e pinte com a cor de tinta (a mais escura da paleta).
- **Adesivo** (recorte de papel): dilate o alfa total em ~12 px, pinte branco (`#FFFFFF` ou creme `#FFFCF6`), suavize com blur 0.8.
- **Sombra plana**: a mascara do adesivo deslocada em `(0, +8)`, cor azul-escuro (`#001A9A`), alfa ~0.45, sem blur forte.
- Ordem de composicao: sombra, adesivo, arte (`Image.alpha_composite`).

Dilatacao circular eficiente (do original): para cada `dy`, calcule a largura horizontal `w = round(sqrt(r^2 - dy^2))` e use soma cumulativa por linha; o `MaxFilter` do Pillow dilata em **quadrado**, o que arredonda mal os cantos (aceitavel para `r <= 4`).
```python
from PIL import ImageFilter
def dilate_pil(mask_bool, r):                      # quadrado, rapido
    im = Image.fromarray((mask_bool*255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.MaxFilter(2*r+1))) > 0
```

## 6. Validar pixel-art nativa

A IA (e voce) nao garante a grade nativa. Valide por script antes de aceitar:
```python
def validate_grid(path, cell=8, max_colors=5):
    im = Image.open(path).convert('RGBA'); a = np.asarray(im)
    H, W = a.shape[:2]
    blocks = a.reshape(H//cell, cell, W//cell, cell, 4).transpose(0, 2, 1, 3, 4)
    uniform = (blocks == blocks[:, :, :1, :1]).all(axis=(2, 3, 4)).mean()      # fracao de blocos 100% uniformes
    colors = {tuple(c) for c in a.reshape(-1, 4)[a[..., 3].reshape(-1) > 0]}
    alpha_binary = set(np.unique(a[..., 3])) <= {0, 255}
    print(f'blocos uniformes: {uniform:.3%}, cores opacas: {len(colors)}, alfa binario: {alpha_binary}')
```
Aprove com 100% de blocos uniformes, `cores <= max_colors`, alfa binario. Se falhar, normalize: reduza com NEAREST para a grade logica (`resize((W//cell, H//cell), Image.NEAREST)`), quantize para a paleta exata (ponto mais proximo), e amplie com NEAREST. Para objetos gerados por IA: exija alfa nativo (`sips -g hasAlpha arquivo.png` no macOS) e normalize: Lanczos para imagens normais, NEAREST para pixel-art.

## 7. Prancha comparativa

Sempre compare sobre varios fundos (azul da marca, branco, escuro, tingido) antes de aprovar: `scripts/python/make_sheet.py`. Padrao do original: linhas = (fundo, paleta); colunas = objetos; thumbnails 300 px com LANCZOS; uma faixa final de 120 px para checar legibilidade pequena. Objeto da cor do fundo so le com adesivo branco.

## 8. ImageMagick e ffmpeg (atalhos, verificar flags na sua versao)

```bash
# Bayer 8x8 em 1 bit
magick in.png -colorspace Gray -ordered-dither o8x8 out.png
# Halftone (meio-tom ordenado)
magick in.png -colorspace Gray -ordered-dither h8x8a out.png
# Floyd-Steinberg com paleta propria (palette.png = tiras de cor)
magick in.png -dither FloydSteinberg -remap palette.png out.png
# Posterizar sem dither
magick in.png +dither -posterize 4 out.png
# Pixelar: reduzir com box e ampliar com ponto
magick in.png -filter box -resize 12.5% -filter point -resize 800% out.png
```
`magick -list threshold` mostra os mapas (o2x2, o3x3, o4x4, o8x8, h4x4a, h6x6a, h8x8a...). ffmpeg (GIF/video): `-vf "palettegen"` e `-vf "paletteuse=dither=bayer:bayer_scale=3"` (outros: `floyd_steinberg`, `sierra2`, `atkinson`, `none`).

## 9. Erros comuns

- Luminancia de RGB premultiplicado (cores escuras nas bordas): divida por alfa antes.
- Esquecer `THR` por celula (usar por pixel): o grao fica fino demais e deixa de ser "pixel".
- Ordem dos tons da rampa invertida (claro -> escuro): o objeto sai em negativo.
- Salvar JPEG: arte de poucas cores vira lixo; salve PNG ou WebP lossless.
- `Image.LANCZOS` ao ampliar pixel-art: borra; use `NEAREST`.
- Python puro em loop por pixel em 1024x1024: lento; use numpy vetorizado (Bayer e vetorizavel; difusao de erro nao).
