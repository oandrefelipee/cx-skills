# Trigger.dev

Categoria: jobs-filas · Estado: esboço

- As tarefas têm deploy próprio, separado do app: o deploy do app não atualiza as tarefas. Inclua as duas coisas no plano do 05.
- Chave secreta por ambiente (dev, staging, produção); trocar uma exige atualizar app e worker juntos.
- Mantenha o SDK atrás de uma porta no app (por exemplo, um agendador de jobs), para trocar de provedor sem mexer no domínio.
- Idempotência: a mesma tarefa pode rodar de novo; o efeito tem de ser o mesmo.

## Aprendizados

| Data | Aprendizado |
|---|---|
| | |
