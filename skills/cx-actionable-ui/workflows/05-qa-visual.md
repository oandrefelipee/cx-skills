# 05. QA visual

Objetivo: provar que a tela ficou mais clara, fiel ao wireframe aprovado e que nada quebrou.

1. Tire prints em desktop e 390 px, claro e escuro, da tela já alterada. Refaça a matriz inteira, não só o tema em que você trabalhou.
2. Rode `scripts/checar-capturas.mjs <pasta> --ui <código da UI>`: nenhuma captura pode estar mais velha que o último commit de UI nem faltar na matriz. Tela que só existe numa largura (um drawer de celular, por exemplo) entra no relatório como exceção explicada.
3. **Compare com o wireframe aprovado**, bloco por bloco, pelo roteiro de `../references/wireframe-ascii.md` ("Comparar a captura com o wireframe aprovado"). Visual aprovado que sumiu (gradiente, selo sólido, cor, ícone) é regressão; visual acrescentado sem aprovação (brilho, sombra decorativa, ✨) sai. Veja `../references/anti-slop.md`.
4. Compare com os prints do passo 01. Confira: layout estável (nada pula ao trocar de visão ou carregar), espaçamento no ritmo do projeto, texto sem corte em 390 px, contraste e foco visíveis, ⓘ acessível por teclado.
5. Meça o texto: `scripts/contar-palavras.mjs` sobre o HTML (com `data-bloco`) ou o `innerText` por bloco, contra o orçamento do passo 00.
6. Rode o checklist de `../references/checklist.md` e o piso de `../references/anti-slop.md`.
7. Rode as verificações automáticas do projeto (tipos, lint, testes do módulo afetado).
8. Anexe os prints ao relatório ou PR. Em UI, quem revisa é o dono, pelos prints.

Com a impeccable: `critique` fecha o ciclo; corrija o que for alto e pare. Verifique em passes limitados, não em loop.

Saída: prints antes/depois, tabela bloco · wireframe · captura · veredito, saída do `checar-capturas` e checklist marcado.
