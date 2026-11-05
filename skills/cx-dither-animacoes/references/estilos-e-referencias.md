# Estilos e referencias

Conteudo: 1 Como usar uma referencia, 2 Higgsfield (dither cinematografico), 3 Duolingo (vetor grosso), 4 Craft (papel), 5 Pixel 1 bit, 6 Gravura de nota, 7 Halftone, 8 Retro/CRT e grao, 9 Fontes/UI, 10 Caso real (o gosto do usuario), 11 Onde buscar referencias.

Medicoes de Higgsfield/Craft abaixo vieram do estudo `pesquisa-design/estilo/higgsfield-craft-teardown.md` (valores de `getComputedStyle`, 2026-11-03). Duolingo e inferencia de linguagem visual (nao medido): marcado.

## 1. Como usar uma referencia

Extraia **a formula**, nao copie a obra: (1) paleta (1 dominante, 1 neutro, 1 faisca), (2) grade/celula, (3) material (chapado, papel, gravura), (4) movimento (calmo, em degraus, cinematografico), (5) onde o dither aparece. Diga ao usuario qual formula escolheu.

## 2. Higgsfield (dither cinematografico, lima + magenta)

| Item | Valor |
|---|---|
| Fundo | `#0F1113` (quase preto neutro-frio) |
| Texto | `#F7F7F8` |
| Acento "lima" | `#D1FE17`; superficie do acento `#222913` |
| Evento | magenta `#FF005B` com gradiente `#FA4AE7`, so no CTA do plano mais vendido |
| Titulos | Space Grotesk 700, caixa alta, tracking -0.04em, pequenos e secos |
| Corpo/botao | Inter 400/600 |
| Botao "keycap" | `inset 0 -3px 0 rgba(0,0,0,.32), 0 6px 4px rgba(0,0,0,.25), 0 32px 24px rgba(0,0,0,.15)` |
| Dither no vocabulario | presets de video citam "8-bit pixel-art" e "dithered shading" |

Pede: fundo escuro, **um** acento acido, conteudo (imagem/video) como heroi e UI como cenario; dither em shader com Bayer 4x4/8x8, gradiente quantizado em 3 a 4 tons, grao a 8 fps. Preco em odometro (coluna de digitos que desliza). Uso: hero de produto de IA criativa, tela de resultado. Receita: `fundo-animado.md` com campo + tons e o modo gradient-map para as imagens.

## 3. Duolingo (vetor grosso, simpatico) - inferido

Pede: formas grandes e arredondadas, contornos grossos escuros, cores saturadas e chapadas, sombra inferior dura (3D "de brinquedo"), personagens e objetos amigaveis, microanimacoes elasticas (overshoot). Para trazer dither: **so como textura de realce** (sombra pontilhada, confete, fundo sutil) sem perder o contorno grosso. Receita: `ilustracao-procedural.md` (contorno de tinta de 3 px + rampa de 4 tons) e `rabiscos-e-marcadores.md`. Evite o brilho 3D cromado.

## 4. Craft (papel)

| Item | Valor |
|---|---|
| Fundo | `#FCF9F7` (papel quente) |
| Texto/botao | `#030302`, botao pill preto-tinta |
| Acento | `#FF4500`; menta de apoio `#9BD8A9` |
| Titulos | serifa de display sem negrito (Untitled Serif), tracking -0.04em, entrelinha 1.0 |

Pede: neutro de papel, preto-tinta no botao, quase nenhum acento na UI; cor mora em fotos e colagens (recortes de papel, sombra de contato, bordas irregulares). Movimento calmo (parallax suave, marquee). Para dither: **adesivo/recorte de papel** (contorno branco irregular + sombra plana) e grao fino de papel; evitar shader chamativo. Pareia com Instrument Serif + Geist.

## 5. Pixel 1 bit / paleta limitada

Pede: grade logica fixa (ex.: 128x128 com pixel = 8x8), sem antialias, 2 a 5 cores exatas, alfa binario, `image-rendering: pixelated`, tipografia pixel ou mono, animacao em `steps()` e tempo quantizado. Usos: avatares, icones, cenas, transicoes. Receita: `pixel-art-nativa.md`. Headroom: silhueta pixelada em azul chapado. 1 bit "Mac classico": Atkinson (`algoritmos.md`).

## 6. Gravura de nota de banco (hachura)

Pede: linhas diagonais com espessura variavel pela luminancia, segunda familia cruzada nos tons escuros, guilhoche (curvas finas repetidas), tinta de 2 cores sobre creme, filetes de moldura. Receita: `halftone-e-hachura.md`. **No caso real o usuario rejeitou a hachura como visual** (a tecnica ficou no shader, modo 2); use como textura de detalhe (nota, certificado), nao como estilo da tela. Pergunte antes.

## 7. Halftone

Pede: grade de pontos rotacionada 45 graus, raio `sqrt(dark/pi)`, 1 tinta sobre papel (jornal) ou CMYK (offset). Bom para hero editorial e para "halftone 3D" (halftone como pos-processamento de uma cena three.js: renderiza em cinza, depois um shader de tela cheia faz os pontos). Receita: `algoritmos.md` secao 5 e `halftone-e-hachura.md`.

## 8. Retro / CRT / grao

Camadas baratas (CSS/canvas) por cima de uma UI: **scanlines** (`repeating-linear-gradient(transparent 0 2px, rgba(0,0,0,.15) 2px 3px)`), **grao** animado (ruido a 8 fps, 5 a 10% de opacidade), **vinheta** (`radial-gradient`), **curvatura/aberracao cromatica** so em titulos (duas copias deslocadas 1 a 2 px em vermelho/ciano; nunca no corpo). Mantenha sutil; reduza em `reduced-motion`.

## 9. Fontes e UI que combinam (caso real)

Titulo em Bricolage Grotesque 800; corpo Geist; numeros em Geist Mono; serifa Instrument Serif e Fraunces como alternativas editoriais. Mobbin/Inspo para pranchas de referencia. Barra de micro-texto animada no topo (marquee) como acabamento.

## 10. Caso real: o gosto do usuario (use como exemplo de como registrar um gosto)

- Gostou: chapado sem moldura fina; azul eletrico `#002FFF`; pixel-art de 1 bit em grade 8 px; adesivo branco; dither em "algumas coisas"; transicao de pagina em dither pixelado; relevo de botao que afunda; dinheiro desenhado em dither; paleta das notas (ouro, creme, turquesa, roxo) sobre azul; titulo Bricolage Grotesque 800.
- Rejeitou: 3D brilhante, neon, bloom, glow, paletas quentes/pastel, "cromado de IA", bordas finas, texto demais, dither em tudo, hachura como visual.
- Regra: dither e tempero.
Adapte: registre o gosto do SEU usuario em 2 listas (gostou/rejeitou) no inicio e consulte antes de cada decisao.

## 11. Onde buscar referencias
Mobbin (telas reais de apps), Inspo (arquivo de sites em producao), paginas de produto (Higgsfield, Krea, Raycast, Craft, Duolingo), Paper Shaders (galeria de efeitos), Dither Kit (graficos). Antes de decidir estilo: reuna 4 referencias por tema, monte uma prancha e mostre ao usuario.
