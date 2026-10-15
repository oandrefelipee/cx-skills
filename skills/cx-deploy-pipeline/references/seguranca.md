# Segurança do pipeline

## Segredos

- O agente **nunca** digita, imprime, comita ou passa segredo por argumento de linha de comando (aparece em `ps` e no histórico). O humano cola no painel do provedor ou num prompt seguro.
- Todo log que sai do terminal passa por `scripts/redigir.mjs`. Vazou? Trocar a credencial é obrigatório; apagar a mensagem não basta.
- Segredo de build (token de pacote privado) entra como segredo de build, nunca como `ARG` gravado na imagem; confira o histórico da imagem.
- Variáveis de ambiente distintas por ambiente: staging e produção nunca compartilham chave.
- PR de fork não recebe segredos. Não ligue "passar segredos para forks".

## Runners

- Runner self-hosted roda com um usuário próprio, sem `sudo`, sem acesso ao Docker do host de produção e com limites de CPU, memória e disco.
- Só código do próprio repositório: confira a origem no primeiro passo do job.
- Limpeza do runner roda com o **mesmo usuário** do runner, nunca como root.

## A lição do cron como root (escalada por symlink)

Um cron rodando como **root** apagava periodicamente uma pasta de trabalho que pertencia ao usuário do runner. Como o usuário do runner controla o conteúdo dessa pasta, ele podia trocar um item por um **link simbólico** apontando para qualquer lugar do sistema, e o root seguia o link e apagava ou alterava o alvo. Um job malicioso vira root.

Regras que saem disso:

- Processo privilegiado **nunca** escreve, apaga, muda dono ou permissão dentro de um caminho controlado por um usuário menos privilegiado.
- Se precisar, rode a tarefa **como esse usuário** (`runuser -u <usuario> --`, `systemd` com `User=`), não como root.
- Sem saída: resolva o caminho real antes de agir (`realpath`), recuse links (`find -P ... -xdev`, `rm` sem seguir links, `--no-dereference` em `chown`) e confira dono e tipo de cada item.
- Revise todo `cron`, `systemd timer` e script de manutenção que toque pastas de runners, uploads ou home de outro usuário.

## Deploy

- A chave de API do provedor de deploy fica na configuração da CLI do humano ou num cofre; o agente usa a CLI já autenticada.
- Ações de infraestrutura (criar serviço, domínio, banco, mudar firewall) não são deploy: pedem o "pode" e, quando mexem em rede ou acesso, são executadas pelo humano com o agente guiando.
