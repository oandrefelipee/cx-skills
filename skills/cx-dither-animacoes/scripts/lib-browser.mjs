// lib-browser.mjs — utilidades compartilhadas pelos scripts que abrem o Chromium do Playwright:
// carregar o playwright já instalado (sem instalar nada), argumentos do Chromium com SwiftShader (WebGL por software),
// servidor estático local (para módulos ES e fetch funcionarem) e resolução de "arquivo ou URL".
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

/** Carrega o `playwright` já instalado (NODE_PATH, ou a pasta global do npm). Nunca instala nada. */
export function loadPlaywright() {
  try { return require("playwright"); } catch { /* tenta a pasta global */ }
  try {
    const root = execSync("npm root -g", { encoding: "utf8" }).trim();
    return createRequire(path.join(root, "noop.js"))("playwright");
  } catch {
    throw new Error("playwright não encontrado. Rode com NODE_PATH=$(npm root -g) node ... (este kit não instala pacotes).");
  }
}

/** SwiftShader = WebGL por software no Chromium sem GPU. Serve para provar CORREÇÃO, não desempenho de GPU real. */
export const SWIFTSHADER_ARGS = [
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--ignore-gpu-blocklist",
  "--enable-webgl",
];

/** WebGPU no Chromium headless sem GPU: Vulkan por software (SwiftShader). Só com --enable-unsafe-webgpu o adaptador aparece, mas o submit
 *  falha ("A valid external Instance reference no longer exists"). Chrome/Edge/Safari com GPU real não precisam de flag. Testado no Chromium 153. */
export const WEBGPU_ARGS = ["--enable-unsafe-webgpu", "--enable-features=Vulkan", "--use-vulkan=swiftshader", "--disable-vulkan-surface"];

export async function launchChromium({ gpu = false, headless = true, webgpu = false, extraArgs = [] } = {}) {
  const { chromium } = loadPlaywright();
  return chromium.launch({ headless, args: [...(gpu ? [] : SWIFTSHADER_ARGS), ...(webgpu ? WEBGPU_ARGS : []), ...extraArgs] });
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".wasm": "application/wasm", ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2",
  ".glsl": "text/plain; charset=utf-8", ".frag": "text/plain; charset=utf-8", ".vert": "text/plain; charset=utf-8",
};

/** Servidor estático mínimo em 127.0.0.1 (porta livre). Devolve { url, close }. Só serve arquivos dentro de `dir`. */
export function serveDir(dir) {
  const root = path.resolve(dir);
  const server = http.createServer((req, res) => {
    try {
      const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
      const file = path.resolve(root, "." + rel);
      if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end("proibido"); return; }
      let target = file;
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
      if (!fs.existsSync(target)) { res.writeHead(404).end("não encontrado"); return; }
      res.writeHead(200, { "content-type": MIME[path.extname(target).toLowerCase()] ?? "application/octet-stream", "cache-control": "no-store" });
      fs.createReadStream(target).pipe(res);
    } catch (e) { res.writeHead(500).end(String(e.message)); }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) });
    });
  });
}

/** "http(s)://..." passa direto; caminho local vira http://127.0.0.1:porta/<arquivo> servindo a pasta do arquivo. */
export async function resolveTarget(arg, query = "") {
  if (/^https?:\/\//i.test(arg) || /^file:\/\//i.test(arg)) return { url: arg + query, close: async () => {} };
  const abs = path.resolve(arg);
  if (!fs.existsSync(abs)) throw new Error("arquivo não encontrado: " + abs);
  if (fs.statSync(abs).isDirectory()) {
    const s = await serveDir(abs);
    return { url: s.url + "/" + query, close: s.close };
  }
  const s = await serveDir(path.dirname(abs));
  return { url: `${s.url}/${encodeURIComponent(path.basename(abs))}${query}`, close: s.close };
}

/** Parser mínimo de argumentos: --flag, --chave valor, --chave=valor, posicionais. */
export function parseArgs(argv, { booleans = [] } = {}) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      const key = a.slice(2, eq > 0 ? eq : undefined);
      if (eq > 0) flags[key] = a.slice(eq + 1);
      else if (booleans.includes(key) || i + 1 >= argv.length || argv[i + 1].startsWith("--")) flags[key] = true;
      else flags[key] = argv[++i];
    } else positional.push(a);
  }
  return { flags, positional };
}

export const here = path.dirname(fileURLToPath(import.meta.url));

/** Descobre o renderizador WebGL real (para o relatório dizer se foi SwiftShader ou GPU). */
export async function glRenderer(page) {
  return page.evaluate(() => {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return "sem WebGL";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return (ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) + " (" + (c.getContext("webgl2") ? "WebGL2" : "WebGL1") + ")";
  });
}
