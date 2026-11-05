---
name: dither-motion
description: "Recria estilos e animacoes em DITHER e afins (ordered/Bayer, Floyd-Steinberg, Atkinson, blue noise, halftone, hachura/gravura, pixel-art de 1 bit e paleta limitada, retro/CRT, grao), parados ou animados, em WebGL/shader, Canvas 2D, SVG/CSS e imagem por script (Python/Pillow). Use SEMPRE que o pedido envolver dither, dithering, Bayer, halftone, meio-tom, pixel-art, pixelar, 8-bit, 1-bit, retro, CRT, grao, gravura, hachura, 'estilo Higgsfield', fundo em dither animado, transicao pixelada ou dissolve em pixels, tingir/recolorir por paleta (gradient-map), sticker/adesivo com contorno, ilustracao procedural em poucas cores, sombra ou confete pontilhado, rabiscos desenhados por mascara, ou converter uma imagem em pixel-art/dither, mesmo que o usuario nao diga a palavra dither. Cobre workflows curtos, scripts, exemplos, bibliotecas, paletas, performance, acessibilidade (reduced-motion) e verificacao por prints."
---

# dither-motion

Skill geral para criar e animar texturas e estilos de dither (e primos: halftone, hachura, pixel-art, grao) de forma que o resultado fique bonito, leve e legivel. Nasceu de um trabalho real de 3 rodadas (modal de recarga, 2026); os trechos "caso real" sao exemplos, nao regras do dominio.

## Principio central

**Dither e tempero, nao prato.** Quantizar tudo em poucos tons e pontilhar tudo vira ruido e cansa. O que funcionou: base limpa e chapada (cor lisa, sem borda fina) com dither em UM ou DOIS elementos por tela: fundo, sombra de contato, realce, confete, transicao, ou a ilustracao-heroi. Pergunte a si mesmo: "qual e o unico lugar onde a textura ganha o olhar?" e deixe o resto quieto.

Por que isso importa: o dither chama atencao justamente por ser textura de alta frequencia. Dois focos disputam o olhar e o texto perde leitura.

### Gosto de referencia (caso real, ajuste ao seu cliente)
- Funcionou: cores chapadas e saturadas (um azul eletrico dominante), pixel-art nativa de 1 bit em grade de 8 px, adesivo (contorno branco de recorte), sombra dura que "afunda" o botao, dither so em algumas coisas, transicao de pagina em dither pixelado, paleta de 4 tons por material.
- Foi rejeitado: 3D brilhante, neon, bloom, glow, paletas quentes/pastel genericas, visual "cromado de IA", bordas finas, texto demais, dither em tudo, gravura por hachura como visual principal (a tecnica ficou, o gosto nao).
- Se o usuario nao disse o gosto dele, pergunte (ou mostre 2 a 3 variacoes pequenas) antes de gastar tempo polindo.

## Quando NAO usar
- Texto corrido, tabelas, formularios: dither sob texto menor que 12 px vira ruido.
- Dados que precisam de precisao (graficos de leitura fina) sem uma versao limpa ao lado.
- Publico/marca que pede acabamento suave, realista ou "premium discreto".
- Quando o efeito e so decoracao e o dispositivo e fraco: ofereca fallback estatico (ver `references/performance-a11y.md`).

## Antes de comecar (4 perguntas, 30 segundos)
1. **Onde vive o resultado?** Imagem/arquivo (PNG/WebP/GIF), pagina web, app React, video.
2. **Parado ou animado?** Se animado: continuo (fundo), por evento (transicao, entrada, hover) ou por rolagem.
3. **Quantas cores e quais?** (2, 3, 4 tons; paleta da marca; fundo azul/branco/escuro.) Veja `references/paletas.md`.
4. **Qual o "foco unico"?** Onde o dither aparece e onde fica limpo.

## Arvore de decisao

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

## Mapa de arquivos
- `references/algoritmos.md` Bayer 2/4/8, blue noise, IGN, Floyd-Steinberg, Atkinson, halftone, hachura (formulas + codigo)
- `references/webgl-shader.md` GLSL do motor, uniforms, modos, premultiplicado, NEAREST, DPR
- `references/canvas2d.md` fundo animado, sombra pontilhada, marcador, confete
- `references/svg-css.md` filtro de tom, mascaras, clip-path, `steps()`, tiles Bayer em CSS
- `references/python-imagem.md` Pillow/numpy, adesivo, rampas, validacao de pixel-art, ImageMagick/ffmpeg
- `references/animacao.md` Motion/spring, FLIP por slots, transicoes, hover, parallax, marquee, reduced-motion
- `references/paletas.md` rampas de 4 tons, paletas prontas, contraste
- `references/bibliotecas.md` quando usar cada biblioteca
- `references/performance-a11y.md` orcamento, fallback, reduced-motion, contraste
- `references/verificacao.md` matriz de tamanhos, checagens, como olhar prints
- `references/armadilhas.md` sintoma, causa e solucao, mais "Limites conhecidos" dos scripts
- `references/estilos-e-referencias.md` Higgsfield, Duolingo, Craft, pixel 1 bit, gravura, halftone
- `references/aprendizados.md` resumo curado do trabalho original
- `references/ideias-de-cenas.md` ideias de cenas (cofre, impressora de dinheiro, notas, fundo, gráfico) para se inspirar

- `scripts/README.md` indice de todos os scripts; `examples/README.md` indice dos 9 exemplos (incluindo `flip-slots.html`, `halftone-3d.html`, `hero-completo.html`)

Leia so o que o pedido pedir. Comece pelo workflow da tabela; va as referencias quando precisar de formula, codigo ou diagnostico.

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

## Como verificar (resumo; detalhe em `references/verificacao.md`)
1. Servir por HTTP: `node scripts/verify/serve.mjs <pasta>` (nao `file://`, WebGL bloqueia a textura; nao `python -m http.server` sob carga, derruba conexoes).
2. Prints em matriz: `node scripts/verify/shots.cjs` (360x640, 375x667, 390x844, 412x915, 430x932, 1280x800), com SwiftShader para WebGL headless.
3. Layout: `node scripts/verify/check-layout.cjs` (botao na viewport, rolagem horizontal, alvos >= 44 px, fonte < 12 px, texto coberto).
4. Abra cada PNG com a ferramenta de leitura de imagem e descreva o que ve antes de dizer que esta bom. Monte uma prancha (`scripts/python/make_sheet.py`) para comparar sobre varios fundos.
5. Para transicoes, forcar o estado (ex.: `reveal=0.5`) ou conferir por trace de rAF: o print "no meio da transicao" por tempo nao funciona.

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
