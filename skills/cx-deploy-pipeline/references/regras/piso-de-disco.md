# Piso de disco

**Regra:** abaixo de `recursos.pisoDiscoGb` (padrão 5 GB), o agente para o pesado, faz commit e push do WIP e só então limpa o que é seu.

**Por quê:** build, install e git com disco cheio corrompem arquivos, travam o banco local e podem perder trabalho não enviado.

**Como cumprir:** `node scripts/preflight-disco.mjs` antes de install, build e E2E; protocolo em [09](../../workflows/09-disco-e-recursos.md).

**Anti-padrão:** apagar caches globais ou pastas de outros agentes para continuar; seguir "só mais um build".
