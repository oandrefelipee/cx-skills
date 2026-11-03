// Decisão do veredito do `ci-status.mjs`, sem I/O, para poder ser testada (`ci-status.test.mjs`).
//
// Sem checks exigidos (adaptador ausente ou sem `ci.requiredChecks`), todos os checks decidem.
// Com eles, só os exigidos decidem; os demais (CI antigo, bots de revisão) ficam informativos.
//
// Um exigido casa com um check pelo nome exato. O nome curto ("ci/circleci: gates" → "gates") só vale quando o
// prefixo identifica um provedor e esse é o provedor do check: assim um `gates` de outro CI continua informativo.

const PROVEDORES = ["circleci", "buildkite", "github-actions", "vercel", "railway", "netlify", "gitlab"];

export function provedorDoPrefixo(prefixo) {
  const p = prefixo.toLowerCase();
  if (p === "github actions" || p === "github-actions") return "github-actions";
  return PROVEDORES.find((nome) => p.split(/[/\s]+/).includes(nome)) ?? null;
}

export function casa(exigido, linha) {
  if (exigido === linha.check) return true;
  const m = /^([^:]+):\s*(.+)$/.exec(exigido);
  if (!m || m[2] !== linha.check) return false;
  const prov = provedorDoPrefixo(m[1]);
  return prov !== null && prov === linha.provedor;
}

/**
 * @param {{check: string, estado: string, provedor: string}[]} linhas
 * @param {string[]} exigidos
 */
export function decidir(linhas, exigidos = []) {
  const marcadas = linhas.map((l) => ({ ...l, informativo: exigidos.length > 0 && !exigidos.some((n) => casa(n, l)) }));
  const exigidosAusentes = exigidos.filter((n) => !linhas.some((l) => casa(n, l)));
  const decidem = marcadas.filter((l) => !l.informativo);
  const conta = (b) => decidem.filter((l) => l.estado === b).length;
  const falhas = conta("fail") + conta("cancel");
  const pendentes = conta("pending");
  const informativosVermelhos = marcadas.filter((l) => l.informativo && (l.estado === "fail" || l.estado === "cancel"));
  let veredito;
  let codigo;
  if (falhas || exigidosAusentes.length) { veredito = "VERMELHO"; codigo = 1; }
  else if (pendentes) { veredito = "PENDENTE"; codigo = 8; }
  else if (!decidem.length) { veredito = "SEM CHECKS"; codigo = 8; }
  else { veredito = "VERDE"; codigo = 0; }
  return { linhas: marcadas, exigidosAusentes, informativosVermelhos, veredito, codigo, conta, falhas, pendentes };
}
