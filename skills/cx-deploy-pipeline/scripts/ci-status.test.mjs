#!/usr/bin/env node
// Testes do veredito do ci-status.mjs (_veredito.mjs), sem dependências: node ci-status.test.mjs (saída 1 se algum falhar).
import { decidir } from "./_veredito.mjs";

const bk = (check, estado) => ({ check, estado, provedor: "buildkite" });
const circle = (check, estado) => ({ check, estado, provedor: "circleci" });

const casos = [
  ["sem adaptador, todos decidem: um vermelho reprova", [bk("gates", "pass"), circle("lint", "fail")], [], "VERMELHO", []],
  ["sem adaptador, tudo verde aprova", [bk("gates", "pass"), circle("lint", "pass")], [], "VERDE", []],
  ["exigido falhando reprova", [bk("buildkite/app/gates", "fail"), circle("lint", "pass")], ["buildkite/app/gates"], "VERMELHO", []],
  ["informativo falhando não bloqueia", [bk("buildkite/app/gates", "pass"), circle("lint", "fail")], ["buildkite/app/gates"], "VERDE", ["lint"]],
  ["exigido ausente reprova", [circle("lint", "pass")], ["buildkite/app/gates"], "VERMELHO", []],
  ["exigido pendente fica pendente", [bk("buildkite/app/gates", "pending")], ["buildkite/app/gates"], "PENDENTE", []],
  ["nome curto casa com o provedor certo", [circle("gates", "pass")], ["ci/circleci: gates"], "VERDE", []],
  ["nome curto de outro provedor não casa (fica ausente)", [bk("gates", "fail")], ["ci/circleci: gates"], "VERMELHO", ["gates"]],
  ["nome curto de outro provedor falhando é informativo", [circle("gates", "pass"), bk("gates", "fail")], ["ci/circleci: gates"], "VERDE", ["gates"]],
  ["sem nenhum check", [], [], "SEM CHECKS", []],
];

let falhou = 0;
for (const [nome, linhas, exigidos, esperado, informativos] of casos) {
  const r = decidir(linhas, exigidos);
  const infos = r.informativosVermelhos.map((l) => l.check);
  const ok = r.veredito === esperado && JSON.stringify(infos) === JSON.stringify(informativos);
  if (!ok) falhou++;
  console.log(`${ok ? "ok  " : "FALHA"}   ${nome}${ok ? "" : ` (veio ${r.veredito}, informativos ${JSON.stringify(infos)})`}`);
}
const ausente = decidir([bk("gates", "fail")], ["ci/circleci: gates"]).exigidosAusentes;
if (JSON.stringify(ausente) !== JSON.stringify(["ci/circleci: gates"])) { falhou++; console.log("FALHA   ausente não reportado"); }
console.log(falhou ? `${falhou} caso(s) falharam.` : "Todos os casos passaram.");
process.exit(falhou ? 1 : 0);
