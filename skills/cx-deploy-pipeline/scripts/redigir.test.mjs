#!/usr/bin/env node
// Testes do redigir.mjs, sem dependências: node redigir.test.mjs (saída 1 se algum falhar).
import { redigir } from "./redigir.mjs";
import { spawnSync } from "node:child_process";
import { mkdtempSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const devemMascarar = [
  ["Authorization com Bearer", "Authorization: Bearer abcdef123456", "abcdef123456"],
  ["authorization com Basic", "authorization: Basic dXNlcjpwYXNz", "dXNlcjpwYXNz"],
  ["Circle-Token", "Circle-Token: abc123def456", "abc123def456"],
  ["x-api-key", "curl -H 'x-api-key: k3y-v4lue-9' https://api.exemplo.dev", "k3y-v4lue-9"],
  ["bearer minúsculo", "bearer abc123def456", "abc123def456"],
  ["Bearer solto", "usando Bearer abc.def-ghi_jkl123 no teste", "abc.def-ghi_jkl123"],
  ["Basic solto", "header Basic dXNlcjpwYXNzd29yZA== enviado", "dXNlcjpwYXNzd29yZA=="],
  ["senha com / na URL", "postgres://user:pa/ss@db:5432/x", "pa/ss"],
  ["senha com @ na URL", "https://u:p@ss:w0rd@h.com", "ss:w0rd"],
  ["JWT solto", "token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c ok", "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV"],
  ["token do GitHub", "remote ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123 ok", "ghp_ABCDEF"],
  ["chave sk-", "OPENAI sk-proj-abcdefghijklmnop1234 ok", "sk-proj-abcdef"],
  ["chave AWS", "id AKIAIOSFODNN7EXAMPLE fim", "AKIAIOSFODNN7EXAMPLE"],
  ["variável sensível", "API_TOKEN=abc123def456ghi", "abc123def456ghi"],
];
const naoMudam = [
  ["URL comum", "veja https://github.com/acme/loja-exemplo/pull/42/checks?check_run_id=123 depois"],
  ["SHA de commit", "merge 3f9a2c1e8b7d6a5f4e3d2c1b0a9f8e7d6c5b4a39 na main"],
];

let falhas = 0;
for (const [nome, entrada, segredo] of devemMascarar) {
  const { saida } = redigir(entrada);
  const ok = !saida.includes(segredo) && saida.includes("[REDIGIDO]");
  if (!ok) falhas++;
  console.log(`${ok ? "ok   " : "FALHA"}  mascara ${nome}${ok ? "" : `  → ${saida}`}`);
}
for (const [nome, entrada] of naoMudam) {
  const { saida, total } = redigir(entrada);
  const ok = saida === entrada && total === 0;
  if (!ok) falhas++;
  console.log(`${ok ? "ok   " : "FALHA"}  mantém ${nome}${ok ? "" : `  → ${saida}`}`);
}
// --extra com grupos: nada do segredo pode sobrar.
{
  const { saida } = redigir("xxsegredoxx", "(seg)(redo)");
  const ok = saida === "xx[REDIGIDO]xx";
  if (!ok) falhas++;
  console.log(`${ok ? "ok   " : "FALHA"}  --extra com grupos troca o trecho inteiro${ok ? "" : `  → ${saida}`}`);
}
// Execução por symlink (como a skill é instalada): a saída tem de sair mascarada.
{
  const pasta = mkdtempSync(join(process.env.TMPDIR || tmpdir(), "redigir-link-"));
  const link = join(pasta, "redigir.mjs");
  symlinkSync(join(dirname(fileURLToPath(import.meta.url)), "redigir.mjs"), link);
  const r = spawnSync(process.execPath, [link], { input: "Authorization: Bearer abcdef123456\n", encoding: "utf8" });
  rmSync(pasta, { recursive: true, force: true });
  const ok = r.status === 0 && r.stdout.includes("[REDIGIDO]") && !r.stdout.includes("abcdef123456");
  if (!ok) falhas++;
  console.log(`${ok ? "ok   " : "FALHA"}  execução por symlink mascara${ok ? "" : `  → status ${r.status} ${r.stdout}${r.stderr}`}`);
}
console.log(falhas ? `${falhas} falha(s).` : "Todos os casos passaram.");
process.exit(falhas ? 1 : 0);
