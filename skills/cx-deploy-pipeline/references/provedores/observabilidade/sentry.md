# Sentry

Categoria: observabilidade · Estado: esboço

- Marque o release com o SHA no deploy: o pós-deploy compara "erros novos neste release" com o anterior ([smoke e canário](../../padroes/smoke-e-canario.md)).
- Envie source maps no build, não no runtime; o token de upload é segredo de build.
- Filtre dados pessoais antes do envio (por exemplo, e-mail, endereço e corpo de requisição).

## Aprendizados

| Data | Aprendizado |
|---|---|
| | |
