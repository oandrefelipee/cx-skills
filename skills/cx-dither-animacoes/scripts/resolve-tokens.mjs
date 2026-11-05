#!/usr/bin/env node
// resolve-tokens.mjs — resolve tokens de cor do SEU projeto (variáveis CSS) para hex, no claro e no escuro, usando o Chromium.
// É a ponte entre "cor ligada a tokens" e as ferramentas que precisam de um número: dither-image.mjs --palette, canvas, shader.
//
// Uso:
//   node resolve-tokens.mjs pagina.html --vars=--c0,--c1,--c2,--c3
//   node resolve-tokens.mjs http://localhost:3000 --vars="--brand,--surface,color-mix(in oklab, var(--brand) 40%, white)" --schemes light,dark --format csv
//   node dither-image.mjs foto.png saida.png --palette "$(node resolve-tokens.mjs pagina.html --vars=--c0,--c1,--c2,--c3 --schemes dark --format csv --quiet)"
//
// Opções:  --vars=a,b,c   nomes de variável (--x) ou qualquer expressão de cor CSS (color-mix, oklch, light-dark, var()...)
//          --schemes light,dark (padrão)   --format table|csv|json (padrão table)   --quiet (só os valores, sem rótulos; use com 1 esquema)
//          --selector CSS   elemento em que o token é resolvido (padrão :root; útil para temas por escopo)
// Cada cor passa por getComputedStyle (resolve var(), color-mix(), oklch(), light-dark() e herança) e por um canvas 1x1,
// então o resultado é sRGB de 8 bits: o que a tela realmente mostra.
import { launchChromium, parseArgs, resolveTarget } from "./lib-browser.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2), { booleans: ["quiet"] });
if (!positional[0] || typeof flags.vars !== "string") {
  console.error('uso: node resolve-tokens.mjs <arquivo|url> --vars="--c0,--c1,color-mix(in oklab, var(--brand) 40%, white)" [--schemes light,dark] [--format table|csv|json]\n(use a forma --vars=... com o sinal de igual, porque os nomes das variáveis começam com "--")');
  process.exit(2);
}
function splitTop(s) { // divide por vírgulas fora de parênteses
  const out = []; let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
const list = splitTop(flags.vars);
const schemes = String(flags.schemes ?? "light,dark").split(",");
const format = flags.format ?? "table";

const { url, close } = await resolveTarget(String(positional[0]));
const browser = await launchChromium();
const result = {};
try {
  for (const scheme of schemes) {
    const ctx = await browser.newContext({ colorScheme: scheme === "dark" ? "dark" : "light" });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "load" });
    result[scheme] = await page.evaluate(({ list, selector }) => {
      const host = document.querySelector(selector) ?? document.documentElement;
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;width:0;height:0;visibility:hidden";
      host.appendChild(probe);
      const cv = document.createElement("canvas");
      cv.width = cv.height = 1;
      const ctx2 = cv.getContext("2d", { willReadFrequently: true });
      const out = list.map((t) => {
        probe.style.color = "";
        probe.style.color = t.startsWith("--") ? `var(${t})` : t;
        const computed = getComputedStyle(probe).color;
        ctx2.clearRect(0, 0, 1, 1);
        ctx2.fillStyle = "#000";
        ctx2.fillStyle = computed;
        ctx2.fillRect(0, 0, 1, 1);
        const d = ctx2.getImageData(0, 0, 1, 1).data;
        const hex = "#" + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join("");
        const defined = !t.startsWith("--") || getComputedStyle(host).getPropertyValue(t).trim() !== "";
        return { token: t, computed, hex, alpha: +(d[3] / 255).toFixed(3), defined };
      });
      probe.remove();
      return out;
    }, { list, selector: String(flags.selector ?? ":root") });
    await ctx.close();
  }
} finally {
  await browser.close();
  await close();
}
const undefinedTokens = [...new Set(Object.values(result).flat().filter((r) => !r.defined).map((r) => r.token))];
if (format === "json") console.log(JSON.stringify(result, null, 2));
else if (format === "csv") {
  for (const s of schemes) console.log(flags.quiet ? result[s].map((r) => r.hex).join(",") : `${s}: ${result[s].map((r) => r.hex).join(",")}`);
} else {
  const w = Math.max(...list.map((t) => t.length), 5);
  console.log("token".padEnd(w), ...schemes.map((s) => s.padEnd(9)));
  list.forEach((t, k) => console.log(t.padEnd(w), ...schemes.map((s) => (result[s][k].hex + (result[s][k].alpha < 1 ? `@${result[s][k].alpha}` : "")).padEnd(9))));
}
if (undefinedTokens.length) console.error(`\naviso: variável(is) não definida(s) na página: ${undefinedTokens.join(", ")} (o valor mostrado é a cor de texto herdada, não o token).`);
