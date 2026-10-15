# Sintomas → o que abrir

Parta do que você está vendo. Cada linha leva ao workflow ou item que resolve.

| Sintoma | Provável causa | Abra |
|---|---|---|
| Check amarelo há mais de 1 h | Fila do provedor, cota, runner desligado ou job sem gatilho | [01](../workflows/01-ler-e-triar-ci.md), página do provedor |
| Check exigido nunca aparece no PR | Nome do job mudou, filtro de branch, "só PRs" desligado, PR de fork | [01](../workflows/01-ler-e-triar-ci.md), [trocar provedor](../workflows/08-trocar-ou-acrescentar-provedor.md) |
| Passa no laptop, falha no CI | Ambiente diferente (versão, fuso, locale, cache, segredo ausente) | [02](../workflows/02-corrigir-ci-vermelho.md) |
| Falha às vezes, passa no rerun | Teste instável | [03](../workflows/03-tratar-flaky.md), [quarentena](padroes/quarentena-de-flaky.md) |
| Install "passa" e o build quebra depois | Pacote privado sem token no ambiente do CI | página do provedor (Aprendizados), [segurança](seguranca.md) |
| "Quase tudo verde, posso mesclar?" | Não | [merge só verde](regras/merge-so-verde.md) |
| Merge feito, deploy não subiu | Gatilho do ambiente, webhook, build na hospedagem | [05](../workflows/05-deploy-com-pode.md), página da hospedagem |
| Deploy "ok", site com erro | Health não cobre o caminho quebrado; SHA errado | [06](../workflows/06-verificar-pos-deploy.md), [health check](padroes/health-check.md) |
| Rollback do app quebrou o banco | Migração não era compatível com a versão anterior | [expand-contract](padroes/expand-contract.md), [07](../workflows/07-rollback.md) |
| "No space left on device" | Disco abaixo do piso | [09](../workflows/09-disco-e-recursos.md) |
| Máquina lenta, testes estourando tempo | Carga acima dos núcleos, vários E2E ao mesmo tempo | [09](../workflows/09-disco-e-recursos.md), [camadas](padroes/camadas-de-validacao.md) |
| Token apareceu num log ou comentário | Log colado sem redigir | [segredos](regras/segredos.md), troque a credencial |
| PR com 3 histórias e 4.000 linhas | Fechou tarde demais | [quando fechar o PR](padroes/quando-fechar-o-pr.md) |
| Vários PRs prontos, CI caro | Rodar a suíte cheia por PR | [trem ou merge queue](padroes/trem-ou-merge-queue.md) |
