# Nada pesado no laptop

**Regra:** no laptop roda só o que é rápido e do escopo: tipos (filtrados ao pacote), lint, unitários do módulo e o E2E do arquivo tocado. A suíte E2E completa, smoke com banco, build de imagem, testes com GPU e tudo em `recursos.proibidoNoLaptop` rodam no CI.

**Por quê:** vários agentes dividem a mesma máquina; a suíte cheia disputa CPU, enche o disco, trava portas e ainda é menos confiável que um runner limpo. O CI é a prova; o laptop só evita mandar erro óbvio.

**Como cumprir:** antes de um comando longo, confira a lista proibida do adaptador. Precisa da prova completa? Push e leia o CI.

**Anti-padrão:** "vou rodar tudo só para ter certeza"; reproduzir a falha do CI rodando a suíte inteira em vez do teste que falhou.
