# PR grande, por história

**Regra:** um PR por história ou onda; as correções do caminho entram no mesmo PR. A hora de fechar segue os sinais de [quando fechar o PR](../padroes/quando-fechar-o-pr.md).

**Por quê:** cada PR custa uma rodada de CI, uma revisão e um relatório. PRs picados multiplicam esse custo e espalham uma história em pedaços que ninguém revisa inteira.

**Como cumprir:** continue commitando na mesma branch enquanto o trabalho for da mesma história; feche quando um sinal de fechamento aparecer.

**Anti-padrão:** um PR por arquivo; PR separado para "corrigir o lint do PR anterior"; acumular duas histórias sem relação.
