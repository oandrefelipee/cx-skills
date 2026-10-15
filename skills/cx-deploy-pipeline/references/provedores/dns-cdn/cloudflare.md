# Cloudflare

Categoria: dns-cdn · Estado: esboço

- Mudança de DNS é infraestrutura: mostre o antes e o depois, ensaie (`--dry-run` quando a ferramenta oferecer) e espere o "pode".
- Com proxy ligado, a origem vê o IP do proxy: configure a lista de proxies confiáveis no app antes de confiar no IP do cliente.
- Certificado na origem com desafio HTTP: o registro precisa apontar antes; com proxy, prefira o modo de TLS completo e estrito.
- Token de API com escopo mínimo (uma zona, só DNS), criado pelo humano.
- Compra de domínio é do humano.

## Aprendizados

| Data | Aprendizado |
|---|---|
| | |
