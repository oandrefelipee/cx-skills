# Paletas

Conteudo: 1 Rampa de 4 tons, 2 Como montar uma rampa, 3 Paletas prontas (caso real), 4 Contraste (WCAG), 5 Gradient-map, 6 Testar em varios fundos, 7 Ordem dos tons.

Ferramenta: `scripts/python/palette_tools.py` (rampas, gradient-map, contraste WCAG, tons de cinza -> paleta).

## 1. Rampa de 4 tons

Dither com poucos tons le melhor com **4 cores ordenadas do escuro ao claro**:

| Indice | Papel | Exemplo (verde "lima") |
|---|---|---|
| 0 | sombra / contorno interno | `#1F6B3A` |
| 1 | medio-escuro | `#6FB82E` |
| 2 | medio-claro (cor "da marca" do material) | `#B8F23B` |
| 3 | brilho / realce | `#F4FFD0` |

Um material = uma rampa. Fundo, sombra de contato e contorno de tinta tem a sua propria. 3 tons funcionam para fundos (base, medio, claro do mesmo matiz). Mais de 4 tons raramente ajuda: o charme do dither vem de poucos degraus.

## 2. Como montar uma rampa

1. Escolha a **cor da marca do material** (indice 2).
2. Indice 3: misture com branco/creme (~70 a 85%) e deslize o matiz levemente para o quente (luz).
3. Indices 1 e 0: escureca e **desloque o matiz** para o frio e aumente a saturacao (sombra com matiz, nao cinza). Ex.: verde claro -> verde-azulado escuro.
4. Garanta passos de luminancia crescentes (cada tom >= ~12% mais claro que o anterior); confira com a funcao de luminancia relativa (secao 4).
5. Nao use preto puro nem branco puro (exceto contorno de tinta `#0B1033` e adesivo `#FFFFFF` por decisao de design).

Python:
```python
def hx(s): s = s.lstrip('#'); return [int(s[i:i+2], 16) for i in (0, 2, 4)]
def ramp(*c): return np.array([hx(x) for x in c], np.uint8)
def mix(a, b, t):
    pa, pb = hx(a), hx(b); return '#' + ''.join(f'{round(x + (y-x)*t):02X}' for x, y in zip(pa, pb))
light = mix('#2DD4BF', '#FFFFFF', .75)         # indice 3 a partir da cor-base
```

## 3. Paletas prontas (caso real; use como ponto de partida)

Tinta (contorno): `#0B1033`. Fundo da marca do caso real: `#002FFF` (azul eletrico), superficie `#0023C4`, sombra `#001A9A`.

**Sticker vivo** (objetos vivos sobre azul eletrico; verde-lima, coral, ouro):
```
LIME      #1F6B3A  #6FB82E  #B8F23B  #F4FFD0
CORAL     #8A1F3B  #D63A5E  #FF4F7B  #FFC2CF
GOLD_SUN  #8A5A00  #E09A00  #FFC21A  #FFE79A
```
**Paleta das notas / cedula** (ouro brilhante, creme, turquesa, roxo; sobre azul):
```
GOLD_BRIGHT  #8A5A00  #D99A00  #FFC933  #FFF3C8
TURQ         #0E6B66  #16A39A  #2DD4BF  #D9FFF7
TURQ_LIGHT   #0E8A83  #2DD4BF  #7FF0DE  #D9FFF7
PURPLE       #4C1D95  #6D3FD6  #8B5CF6  #E4D8FF
CREAM        #BFB394  #DCD2BA  #F2ECDC  #FAF6EA
```
**Dither cinema** (4 tons para tingir cinza por filtro; testadas A/B/C):
```
A  #0B1033  #4C1D95  #2DD4BF  #FFC933
B  #0B1033  #8B5CF6  #2DD4BF  #F2ECDC
C  #0B1033  #0E6B66  #8B5CF6  #FFC933
```
**Pixel 8-bit** (azul profundo, azul claro, lima, branco):
```
#00104F  #5E7BFF  #C8FF3D  #FFFFFF
```
**Fundo em 3 tons de azul** (Canvas 2D / shader): `#0023C4`, `#1F3FE0`, `#4F6BFF`. No `DitherField` do repositorio (fundo escuro): `bg vec3(.027,.031,.051)` (cerca de `#07080D`), `mid vec3(.14,.2,.62)`, `hi vec3(.42,.53,1.)`, topo `vec3(.82,.88,1.)` (e dourado `vec3(.96,.72,.35)` no nivel maximo).
**Higgsfield** (ver `estilos-e-referencias.md`): fundo `#0F1113`, texto `#F7F7F8`, lima `#D1FE17`, magenta `#FF005B`.

Regra: **uma dominante + um neutro + uma faisca**. Quatro matizes de mesmo peso viram "arco-iris de starter kit".

## 4. Contraste (WCAG)

Luminancia relativa (sRGB -> linear):
```python
def lin(c): c /= 255; return c/12.92 if c <= .04045 else ((c + .055)/1.055) ** 2.4
def L(rgb): r, g, b = (lin(v) for v in rgb); return .2126*r + .7152*g + .0722*b
def contrast(a, b):
    la, lb = sorted((L(a), L(b)), reverse=True); return (la + .05) / (lb + .05)
```
Metas: texto normal >= 4.5:1; texto grande (>= 24 px, ou 18.66 px bold) >= 3:1; componentes de UI e graficos informativos >= 3:1. Medir o **tom mais claro/escuro do dither** contra o fundo imediato, nao a media. Dica do caso real: ouro e turquesa sobre papel claro dao ~2:1 (reprovam); sobre azul escuro leem bem. Texto branco sobre `#537FEB` ~3.75:1 reprova para texto pequeno.

## 5. Gradient-map

Mapear luminancia -> rampa (o que o modo 0 do shader e o filtro SVG fazem). Em Python: `idx = floor(lum*3 + THR)` (ordenado) ou `floor(lum*3 + .5)` (sem dither, posterizado) e `ramp[idx]`. Vantagens: recolore qualquer ilustracao para a marca, e consistente entre objetos de origens diferentes (vira "o mesmo universo"). Cuidado: a ilustracao de origem deve ter **luminancia bem distribuida**; use `lo/hi/gamma` para esticar.

## 6. Testar em varios fundos

Sempre mostre cada objeto/rampa sobre: o fundo da marca, branco, escuro e (se aplicavel) o tingido. Objeto azul sobre fundo azul so le com adesivo branco. Dither claro sobre azul perde contraste se o tom 3 for muito proximo do fundo. Use `scripts/python/make_sheet.py`.

## 7. Ordem dos tons

O mapeamento discreto depende da ordem dos tons. Em vez de supor, gere as variantes (A, B, C) e compare nos prints; a que "le" melhor nem sempre e a de maior contraste (muitas vezes e a que tem o 2o tom mais proximo do matiz da marca).
