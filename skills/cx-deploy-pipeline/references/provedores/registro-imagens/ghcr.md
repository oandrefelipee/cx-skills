# GHCR (GitHub Container Registry)

Categoria: registro-imagens · Estado: esboço

- Útil para rollback por imagem: cada deploy aponta para uma tag imutável (`<ambiente>-<sha>`), e voltar é apontar para a anterior.
- Plano gratuito com repositório privado tem cota pequena de armazenamento e tráfego: construir na própria hospedagem pode sair mais barato.
- Publicar só a partir da branch principal ou de tag; o token do CI com escopo de escrita só no pacote.
- Confira que a imagem final não carrega token, `.env` nem histórico com segredo.

## Aprendizados

| Data | Aprendizado |
|---|---|
| | |
