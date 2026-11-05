# Workflow: animacao em arquivo (do PNG ao GIF/WebM)

Objetivo: transformar um PNG (logo, objeto, icone) em animacao de dither entregue como arquivo: GIF (e-mail, README, redes), WebM/MP4 (site, apresentacao) ou sequencia de PNG (edicao em outra ferramenta).
Ferramenta: `scripts/python/dither_anim.py` (Pillow + numpy; `ffmpeg` so para WebM/MP4). Complementos: `scripts/python/dither_image.py`, `scripts/python/palette_tools.py`, `scripts/python/make_sheet.py`.
Referencias: `references/animacao.md` (secao 12), `references/paletas.md`, `references/armadilhas.md` (Limites conhecidos).

## Quando usar (e quando nao)
Use quando o destino NAO executa JS (e-mail, README, rede social, slide) ou quando o efeito e fixo. Para site interativo, prefira Canvas/WebGL ao vivo (`workflows/fundo-animado.md`, `workflows/transicao-pixelada.md`): menor, nitido em qualquer DPR e respeita `prefers-reduced-motion`.

## Passos

1. **Prepare o PNG**: RGBA, fundo transparente, lado 256 a 512 px (o logo em alta resolucao reduza antes: `python3 scripts/python/dither_image.py logo.png base.png --algo bayer8 --preset notas --cell 4` gera a base ja em dither; as animacoes tambem aplicam a paleta). Contorno nitido, poucas cores.
2. **Escolha o modo**:
   | Quer | Modo | Notas |
   |---|---|---|
   | logo "aparece" celula a celula | `reveal` | seguro e barato; segura o fim com `--hold` |
   | logo "se materializa" de pixels grandes | `pixel-resolve` | `--from-px 32` (potencia de 2) |
   | varredura diagonal com borda pontilhada | `sweep` | bom para destaque |
   | fundo que respira, em loop | `breathe` | sem PNG: `--size 320x180`; loop perfeito |
   | cobertura que cobre e revela (transicao) | `wipe-overlay` | `--overlay-colors "#cobre,#borda"`, PNG opcional |
3. **Gere o GIF** (parametros recomendados):
   ```bash
   python3 scripts/python/dither_anim.py reveal logo.png -o out/logo.gif \
       --preset notas --cell 4 --fps 20 --duration 1.4 --hold 0.6 --loop 0 --ease out
   ```
   - `--fps`: 12 a 15 para fundo e GIF leve; 20 para entrada de logo; nao passe de 24.
   - `--duration`: 1.2 a 1.8 s para entradas; 3 a 5 s para `breathe`.
   - `--hold`: 0.4 a 1 s de quadro final parado antes de recomecar (nos modos nao-loop).
   - `--loop 0` infinito (padrao); `--loop 1` toca uma vez e para (bom para e-mail/README).
   - `--cell 4` (2 a 6): celula do dither em px de saida; menor deixa o GIF pesado.
   - `--scale 0.5` reduz a entrada antes do dither (menor arquivo).
   - `--bg transparent` (padrao) ou `--bg "#1235E6"` opaco.
4. **WebM/MP4 e PNG-seq no mesmo comando** (precisa de `ffmpeg` no PATH; sem ele o script avisa e segue com GIF/PNG):
   ```bash
   python3 scripts/python/dither_anim.py reveal logo.png -o out/logo.gif \
       --png-seq out/frames --video out/logo.webm --video out/logo.mp4 --preset notas --fps 20 --duration 1.4
   ```
5. **Confira**: abra o GIF no navegador (HTTP ou arquivo local serve para `<img>`) e olhe os quadros: `out/frames/frame_0000.png...` em prancha (`python3 scripts/python/make_sheet.py out/frames/frame_000{0,8,16,24,32}.png -o out/prancha.png --bgs azul,branco,escuro --labels`). Teste sobre o fundo real: o alfa do GIF e de **1 bit** (veja abaixo).
6. **Tamanho**: ajuste ate caber no limite do destino (e-mail ideal < 500 KB; README < 1 MB). Reduza nesta ordem: `--scale`, `--fps`, `--duration`, numero de cores da paleta.
7. **Incorpore**:
   ```html
   <img src="logo.gif" width="256" height="256" alt="Logo da Loja">
   <video autoplay muted loop playsinline width="256" height="256" poster="frame_0000.png">
     <source src="logo.webm" type="video/webm"><source src="logo.mp4" type="video/mp4">
   </video>
   ```
   Para `prefers-reduced-motion`, mostre o ultimo quadro em PNG (`<picture>` com `media="(prefers-reduced-motion: reduce)"`) ou pause o video.

## GIF versus WebM versus MP4

| Formato | Alfa | Cores | Medido (reveal 512x512, 36 quadros, 20 fps, preset notas) | Use |
|---|---|---|---|---|
| GIF | **1 bit** (pixel ou totalmente transparente; sem borda suave) | paleta exata, sem requantizar | ~220 KB (~53 KB a 256 px/12 fps) | e-mail, README, redes; pixel-art e adesivo de borda nitida |
| WebM VP9 | **alfa suave** | cor plena | ~42 KB | site moderno; sobre fundos variados |
| MP4 H.264 | **achata** o alfa sobre `--bg` ou preto | cor plena | ~24 KB | apresentacoes, redes que nao aceitam WebM; use `--bg` da cor do destino |
| PNG-seq | alfa completo | cor plena | pasta de quadros | editar em After Effects/Figma/ffmpeg |

Regras praticas:
- Arte com borda suave sobre fundo desconhecido: **WebM** (ou PNG-seq). GIF vai mostrar serrilhado/halo.
- Pixel-art e dither: GIF e otimo (a borda de 1 bit combina com o estilo).
- MP4 nunca tem transparencia: gere com `--bg` igual ao fundo da pagina.
- Alfa em WebM e suportado nos navegadores baseados em Chromium e no Firefox; Safari: **verificar** (pode exigir HEVC com alfa em .mov); mantenha o GIF como fallback.
- **Quadros identicos sao fundidos** no GIF (a duracao do quadro soma), entao o `--hold` nao incha o arquivo; mas a contagem de quadros no arquivo pode ser menor que `fps * duration`.

## Loop
- `breathe` e **loop perfeito** (primeiro e ultimo quadro casam).
- Modos de entrada (`reveal`, `pixel-resolve`, `sweep`): com `--loop 0` recomecam do zero depois do `--hold`; o salto do quadro final para o primeiro e visivel (aceitavel para entrada de logo). Para loop suave, termine e comece em quadros parecidos (use `wipe-overlay` ou `breathe`).
- Para tocar uma vez: `--loop 1`; o ultimo quadro e o resultado final (ponha a pose final no `--hold`).

## Pronto quando
- [ ] GIF abre e anima no destino real (e-mail/README/navegador); loop como planejado.
- [ ] Alfa testado sobre o fundo real (GIF 1 bit sem halo visivel, ou WebM/PNG-seq quando precisa de borda suave).
- [ ] Tamanho dentro do limite do destino; poster/ultimo quadro em PNG disponivel (movimento reduzido).
- [ ] Prancha de quadros olhada (celula do tamanho certo, paleta correta, sem tons fora da rampa).
- [ ] Todas as variantes e a paleta usada catalogadas (nome: modo, preset, cell, fps).
