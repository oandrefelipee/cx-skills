# Workflow: verificar de verdade (responsivo, console, layout, prints)

Objetivo: provar que o resultado funciona em celular e desktop, sem erros, com layout correto, e que alguem OLHOU os prints.
Ferramentas: `scripts/verify/serve.mjs`, `scripts/verify/shots.cjs`, `scripts/verify/check-layout.cjs` (usam `_browser.cjs`, que acha o Chromium headless ja em cache; nao instalam nada). Playwright precisa estar disponivel (`PLAYWRIGHT_PATH=/caminho/node_modules/playwright` se nao for achado).
Referencias: `references/verificacao.md`, `references/armadilhas.md`, `references/performance-a11y.md`.

## Passos

1. **Servir por HTTP** (nunca `file://`):
   ```bash
   node scripts/verify/serve.mjs . 8790 &      # imprime "SERVING <url>"; guarde o PID para encerrar so ele
   ```
   Abra `http://127.0.0.1:8790/examples/<arquivo>.html`. Se usar `python -m http.server`, rode as verificacoes em serie.
2. **Prints em matriz** (celular + desktop):
   ```bash
   node scripts/verify/shots.cjs http://127.0.0.1:8790/examples/bg-animado-canvas.html ./prints \
        --sizes 360x640,375x667,390x844,412x915,430x932,1280x800 --wait 2500 --ignore 'jsdelivr|GPU stall'
   ```
   Fluxo em passos: `--steps 1,2,3 --step-selector '[data-go="{n}"]'`. Sai com codigo 1 se houver erro de console/pagina/rede.
3. **Checagem de layout**:
   ```bash
   node scripts/verify/check-layout.cjs http://127.0.0.1:8790/examples/<arquivo>.html \
        --sizes 360x640,390x844,1280x800 --primary '[data-primary]' --min-target 44 --min-font 12
   ```
   Falha se: botao primario fora da viewport ou coberto; rolagem horizontal; alvo de toque < 44 px (so ate 768 px de largura); fonte < 12 px; texto coberto.
4. **Olhar cada PNG** com a ferramenta de leitura de imagem e **descrever** o que ve: celula do tamanho certo, texto legivel, nada cortado, sem franja. Amplie 400% um trecho do dither (PIL `crop().resize(NEAREST)`).
5. **Estados**: repita nos estados relevantes (passo 2, 3; hover; selecionado). Transicoes: force o estado (`window.__setT`) ou trace de rAF (`verificacao.md` secao 8).
6. **reduced-motion**: `page.emulateMedia({ reducedMotion: 'reduce' })` e confirme quadro estatico (nenhum rAF rodando; o estado final esta visivel).
7. **Sem WebGL / contexto perdido**: force `loseContext()` ou desligue WebGL e confirme o fallback.
8. **Corrigir e repetir** ate zerar as falhas. Liste o que ainda e duvidoso (ex.: desempenho em GPU real nao foi medido; SwiftShader nao representa fps).
9. **Encerrar o servidor**: so o PID que voce iniciou (`kill <pid>`), nunca por nome de processo.

## Convencoes que ajudam
- `window.__ready = true` quando imagens/texturas/fontes carregaram; `window.__shaderErrors` com a contagem de erros de shader.
- `?estado=...`/`?step=...` (so em dev) para abrir direto num estado.
- `data-primary` no botao principal e `data-*` estaveis nos elementos.

## Relatorio final (curto)
| Tamanho | Console | Layout | Prints olhados |
|---|---|---|---|
| 360x640 | ok/erro | ok/falha | sim |
| 390x844 | ... | ... | ... |
| 1280x800 | ... | ... | ... |
Mais: o que ficou duvidoso e como reproduzir.

## Pronto quando
- [ ] Zero erros de console (exceto avisos conhecidos filtrados), zero falhas de `check-layout`.
- [ ] Todos os prints abertos e descritos; problemas visuais corrigidos.
- [ ] reduced-motion e fallback verificados.
- [ ] Servidor encerrado pelo PID certo; prints salvos em pasta de saida.
