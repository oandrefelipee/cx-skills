# Prova e captura (Playwright, SwiftShader, o que olhar)

Regra do autor: **provar com captura que você mesmo abriu e olhou**, em claro e escuro e em duas larguras, antes de dizer "pronto". Sem GPU na máquina de cloud, WebGL roda em SwiftShader (CPU): serve para provar que **desenha certo**, não que **roda rápido**.

## 1. Ambiente (sem instalar nada)

- Node 22, Bun, Python 3 e Playwright já existem. Use o Playwright **global**: `export NODE_PATH=$(npm root -g)` e `require('playwright')` (ou `createRequire` em `.mjs`). Chromium em `/opt/pw-browsers/` (o Playwright o acha sozinho).
- Flags que fazem o WebGL funcionar sem GPU: `--use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
- Ruídos de console **benignos** com SwiftShader (filtre, não mostre como erro): `GL Driver Message`, `GPU stall due to ReadPixels`, `Automatic fallback to software WebGL`.
- Abrir de `file://` exige `<meta charset="utf-8">` (sem ele os acentos quebram). O artefato publicado não precisa; o arquivo local sim.
- No artefato publicado a query string não sobrevive: use hash (`#p2`).

## 2. Ferramentas prontas do pacote

```bash
export NODE_PATH=$(npm root -g)
# capturas: larguras x temas, tempo virtual, seletor, DPR, falha em erro de console
node scripts/capture.mjs examples/button-brasa.html --widths 390,1280 --wait 1800 --fail-on-error --out /tmp/caps
node scripts/capture.mjs examples/dither-field.html --reduced-motion --schemes dark --selector "#campo" --dpr 2
# FPS (média, mediana, p95) com o aviso honesto de SwiftShader
node scripts/fps-probe.mjs examples/dither-field.html --seconds 6 --width 1280 --height 720
```
Atenção: o `fps-probe.mjs` mede a cadência do `requestAnimationFrame` (nos exemplos deu 60 médio, porque o laço do rAF roda sempre). Como os laços do pacote **limitam o desenho** a 24 (ou 18) quadros/s, a taxa efetiva de desenho vem do HUD da própria página (quadros desenhados por segundo) ou do contador de `drawArrays` (ver `animacao-e-performance.md`, seção 9). Use o probe para achar travadas (p95/p99 do tempo de quadro), não para dizer "24 fps".

Os exemplos do pacote seguem `prefers-color-scheme` no início (e têm seletor próprio de tema), então `--schemes light,dark` do `capture.mjs` troca o tema de verdade. Saída esperada do primeiro comando: 4 PNGs (`*-390w-light/dark`, `*-1280w-light/dark`) e `console limpo: nenhum erro, aviso, exceção nem requisição falha.`

## 3. Script mínimo (quando você precisa de um fluxo específico)

```js
// node shot.mjs <arquivo.html> <saida.png> [--scheme dark|light] [--reduced] [--wait 1500] [--hover css] [--click css] [--clip css] [--dpr 2]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [html, out, ...rest] = process.argv.slice(2);
const opt = {}; for (let i = 0; i < rest.length; i++) if (rest[i].startsWith('--')) { const k = rest[i].slice(2); const v = rest[i+1] && !rest[i+1].startsWith('--') ? rest[++i] : true; (opt[k] ||= []).push(v); }
const um = (k, d) => opt[k]?.at(-1) ?? d;
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: +um('width', 900), height: +um('height', 700) }, colorScheme: um('scheme', 'dark'),
  reducedMotion: opt.reduced ? 'reduce' : 'no-preference', deviceScaleFactor: +um('dpr', 1) });
const p = await ctx.newPage(); const logs = [];
p.on('pageerror', e => logs.push('PAGEERR ' + e));
p.on('console', m => { if (['error','warning'].includes(m.type()) && !/GL Driver|GPU stall|ReadPixels|software WebGL/.test(m.text())) logs.push(m.text()); });
await p.goto('file://' + html); await p.waitForTimeout(+um('wait', 1500));
for (const s of opt.click || []) { await p.click(s); await p.waitForTimeout(600); }
for (const s of opt.hover || []) { await p.hover(s); await p.waitForTimeout(1100); }   // o laço precisa de tempo para "acender"
const clip = um('clip'); clip ? await p.locator(clip).first().screenshot({ path: out }) : await p.screenshot({ path: out });
console.log(logs.join('\n') || 'sem erros no console'); await b.close();
```
Útil: `--init "js"` com `page.addInitScript` para simular **sem WebGL2** (`HTMLCanvasElement.prototype.getContext = () => null`) e conferir o fallback.

## 4. O que capturar (matriz mínima)

| Eixo | Valores | Por quê |
|---|---|---|
| Tema | claro e escuro (e, se houver, cada paleta/`--accent`) | prova que a cor vem do token e que a rampa de tons inverte direito |
| Largura | 390 (celular) e 1280/1440 (computador) | corte de objetos, quebra de linha, escala de zoom |
| Estado | parado, hover/foco (`--hover`), pressionado, após troca de valor | feixe aceso, brasas, mudança de forma |
| Movimento | normal e `reducedMotion: 'reduce'` | o quadro parado é determinístico: ótimo para comparar versões |
| DPR | 1 e 2 (recorte ampliado) | células iguais, texto legível sobre a trama |
| Sem WebGL | `getContext → null` | fallback aparece e não quebra a página |

Espera antes de capturar: **1,5 a 2,5 s** para campos e botões; **6 a 8 s** para o gráfico em dither (Dither Kit) e telas com dois contextos WebGL sob SwiftShader (o gráfico "em branco" em 3,3 s não é bug do código). Mova o mouse para fora (`mouse.move(5,5)`) antes do print do estado parado.

## 5. O que olhar na captura (abra a imagem)

1. **Células do mesmo tamanho** (amplie a 3x/4x): bordas serrilhadas nítidas, sem borrão de suavização.
2. **A cor vem do token**: troque `--accent` e o tema e recapture; nada pode ficar na cor antiga.
3. **Contraste do texto sobre o dither**, nos dois temas e no estado aceso.
4. **Cortes e vazios** no celular: objeto cortado na borda, espaço morto de 90 px, texto pequeno (< 15 px).
5. **Bordas do dither**: fade contínuo, sem linha sólida, sem "pente" (colunas esticadas), sem quinas brancas.
6. **Quadro parado em movimento reduzido** com cara de arte, não de estado quebrado.
7. **Console**: zero erros (além dos benignos acima). Rode com `--fail-on-error` no `capture.mjs`.
8. **Transbordo horizontal**: `document.documentElement.scrollWidth > innerWidth` em 390 px.
9. **Contagem de canvases/contextos** (`document.querySelectorAll('canvas').length`) depois de montar, desmontar e montar (StrictMode): não pode duplicar.
10. **FPS** relativo (`fps-probe.mjs`) e HUD da página.

## 6. Verificações automáticas úteis

```js
// transbordo horizontal e canvases duplicados
await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, canvases: document.querySelectorAll('canvas').length }));

// axe-core (acessibilidade): use o pacote que o projeto já tem em node_modules
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
await page.evaluate(axe);
const violacoes = await page.evaluate(async () => (await axe.run({ runOnly: ['wcag2a','wcag2aa','wcag21aa','best-practice'] })).violations);
```
Nos exemplos do pacote o `axe` deu **0 violações** em claro e escuro (ele não lê o canvas: contraste sobre dither é revisão visual).

## 7. Protótipo do app inteiro em HTML único (o pipeline do projeto de origem, generalizado)

Para mostrar uma tela do app (React + Vite) ao autor sem subir nada: build standalone, juntar tudo num HTML, abrir de `file://`, capturar e publicar como artefato.

```bash
# 1) build do protótipo (num vite.config próprio, com a rota/tela do laboratório como entrada)
cd apps/<app> && NODE_OPTIONS=--max-old-space-size=3072 bunx vite build -c .standalone/vite.config.ts      # gera /tmp/dist
# 2) juntar JS + CSS num arquivo só
python3 inline_dist.py /tmp/dist /tmp/proto.html "Protótipo"        # script abaixo (testado)
# 3) abrir e capturar (a tela e a opção vêm por query/hash que o seu app lê)
node shot.mjs /tmp/proto.html /tmp/p1.png --width 1440 --wait 3500
```
Builds concorrentes (vários agentes) devem ser **serializados** (`flock /tmp/rebuild.lock`). O `tsc` de apps grandes precisa de `NODE_OPTIONS=--max-old-space-size=3072` a `6144`.

```python
#!/usr/bin/env python3
"""uso: python3 inline_dist.py <pasta-dist> <saida.html> [titulo]"""
import glob, sys, os
dist, out = sys.argv[1], sys.argv[2]; titulo = sys.argv[3] if len(sys.argv) > 3 else 'Protótipo'
css = ''.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(dist, 'assets', '*.css'))))
js  = ''.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(dist, 'assets', '*.js'))))
js = js.replace('</script', '<\\/script')            # um "</script" dentro do JS fecharia a tag
html = f'<!doctype html>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>{titulo}</title>\n<style>{css}\nbody{{margin:0}}</style>\n<div id="root"></div>\n<script type="module">{js}</script>\n'
open(out, 'w', encoding='utf-8').write(html); print(f'{out}: {len(html)//1024} KB')
```
Observações do artefato: scripts só de `cdnjs`, `cdn.jsdelivr.net/npm`, `unpkg`; fontes só do Google Fonts; query string não sobrevive (use `#hash`); o visualizador não embute outros sites; para claro/escuro o app pode ler `data-viewer` do `<html>`.

## 8. Vídeo e GIF (se pedir movimento)

Playwright grava webm (`recordVideo: { dir, size }` no contexto); o `ffmpeg` do sistema converte: `ffmpeg -i v.webm -vf "fps=12,scale=640:-1:flags=lanczos" -loop 0 saida.gif`. Com SwiftShader o vídeo sai mais lento que no seu monitor: use o relógio virtual (`capture.mjs --times 0,700,1400`) para uma sequência de quadros nítidos em vez de vídeo.

## 9. Honestidade

Diga sempre: renderização **por software**; GPU real, celular, Safari e Firefox **não testados**; números de FPS só comparam variantes; contraste sobre dither foi conferido por olho/captura, não por ferramenta.
