/**
 * EXEMPLO 4 · Hook e componentes genéricos de dither para React (sem dependências além do React 18+).
 *
 *   <DitherCanvas pintar={fn} cell={2} fps={24} label="..." />   Canvas 2D: você pinta células (cols × rows).
 *   <ShaderCanvas frag={glsl} cores={{ uC0: "var(--accent)" }} /> WebGL2: um fragment shader por célula.
 *   useReducedMotion()                                            prefers-reduced-motion como hook.
 *   bayerMatrix(), BAYER8, rgbDoCss(), pintarCelulas()           utilitários.
 *
 * Decisões que valem em qualquer projeto (ver references/armadilhas.md):
 *  - o <canvas> é criado DENTRO do efeito e removido na limpeza: seguro em StrictMode (montar, desmontar, montar)
 *    e permite chamar loseContext() sem deixar um contexto morto para a próxima montagem;
 *  - resolução interna = nº de células; o CSS amplia sem suavizar (image-rendering: pixelated);
 *  - a célula em px do DISPOSITIVO é inteira (senão as células saem de tamanhos diferentes em telas 1,25x/1,5x);
 *  - cor só por token: o painter pede `q.cor("var(--accent)")`; a leitura usa uma sonda getComputedStyle (entende
 *    var, color-mix e oklch) e é refeita quando o tema ou a cor global mudam;
 *  - teto de FPS, pausa com aba oculta e fora da tela; movimento reduzido = um quadro parado (t = 3,3 s);
 *  - o painter mais novo é lido por ref: trocar a função não recria o canvas nem o laço.
 *
 * Teste: veja react-dither-canvas.demo.tsx (comando de build no topo dele).
 */
import { type CSSProperties, useEffect, useRef, useSyncExternalStore } from "react";

/* ───────────────────────── Bayer ───────────────────────── */

/** Matriz Bayer (2^ordem)² normalizada em (0,1). ordem 2 = 4×4, ordem 3 = 8×8. Mesma recursão do Dither Kit. */
export function bayerMatrix(ordem = 3): number[][] {
  let m: number[][] = [[0]];
  for (let k = 0; k < ordem; k++) {
    const n = m.length;
    const prox: number[][] = [];
    for (let y = 0; y < n * 2; y++) {
      const linha: number[] = [];
      for (let x = 0; x < n * 2; x++) {
        const quad = y < n ? (x < n ? 0 : 2) : x < n ? 3 : 1;
        linha.push((m[y % n]?.[x % n] ?? 0) * 4 + quad);
      }
      prox.push(linha);
    }
    m = prox;
  }
  const total = m.length * m.length;
  return m.map((l) => l.map((v) => (v + 0.5) / total));
}
export const BAYER8 = bayerMatrix(3);

/* ───────────────────────── Cor por token ───────────────────────── */

let sondaCanvas: HTMLCanvasElement | undefined;

/** [r,g,b] 0..255 de QUALQUER cor CSS (var(--x), color-mix, oklch), lida dentro de `el` para herdar as variáveis.
 *  A sonda não tem transição: com reduced motion muitos apps zeram durações e a leitura pegaria a cor antiga. */
export function rgbDoCss(el: HTMLElement, css: string): [number, number, number] {
  const s = document.createElement("span");
  s.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;transition:none;animation:none;color:${css}`;
  el.appendChild(s);
  const calculada = getComputedStyle(s).color;
  s.remove();
  sondaCanvas ??= document.createElement("canvas");
  sondaCanvas.width = sondaCanvas.height = 1;
  const x = sondaCanvas.getContext("2d", { willReadFrequently: true });
  if (!x) return [128, 128, 128];
  x.clearRect(0, 0, 1, 1);
  x.fillStyle = "#000";
  x.fillStyle = calculada;
  x.fillRect(0, 0, 1, 1);
  const d = x.getImageData(0, 0, 1, 1).data;
  return [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0];
}

/** Chama `fn` quando o tema/cor global muda (atributo ou style no <html>) ou o esquema do sistema troca. */
function observarTema(fn: () => void) {
  const mo = new MutationObserver(fn);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class", "data-theme"] });
  const mq = matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", fn);
  return () => {
    mo.disconnect();
    mq.removeEventListener("change", fn);
  };
}

/* ───────────────────────── Movimento reduzido ───────────────────────── */

const MQ = "(prefers-reduced-motion: reduce)";
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = matchMedia(MQ);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => matchMedia(MQ).matches,
    () => false
  );
}

/* ───────────────────────── Laço de animação ───────────────────────── */

type Laco = { pedir: () => void; parar: () => void };

/** rAF com teto de FPS, pausa fora da tela/aba oculta e, em movimento reduzido, um único quadro (t = 3,3 s). */
function criarLaco(host: HTMLElement, quadro: (t: number, parado: boolean) => void, fps: number): Laco {
  const mq = matchMedia(MQ);
  let raf = 0;
  let ultimo = 0;
  let visivel = true;
  const passo = (agora: number) => {
    raf = requestAnimationFrame(passo);
    if (document.hidden || !visivel || agora - ultimo < 1000 / fps) return;
    ultimo = agora;
    quadro(agora / 1000, false);
  };
  const iniciar = () => {
    cancelAnimationFrame(raf);
    if (mq.matches) quadro(3.3, true);
    else raf = requestAnimationFrame(passo);
  };
  const io = new IntersectionObserver(([e]) => {
    visivel = e?.isIntersecting ?? true;
  });
  io.observe(host);
  document.addEventListener("visibilitychange", iniciar);
  mq.addEventListener("change", iniciar);
  iniciar();
  return {
    pedir: () => {
      if (mq.matches) quadro(3.3, true);
    },
    parar: () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", iniciar);
      mq.removeEventListener("change", iniciar);
    },
  };
}

/** Tamanho da grade: a célula em px do dispositivo é inteira e o canvas passa um pouco das bordas (o host corta). */
function medirGrade(host: HTMLElement, cv: HTMLCanvasElement, cell: number) {
  const dpr = window.devicePixelRatio || 1;
  const celDev = Math.max(1, Math.round(cell * dpr));
  const cols = Math.max(1, Math.ceil((host.clientWidth * dpr) / celDev));
  const rows = Math.max(1, Math.ceil((host.clientHeight * dpr) / celDev));
  cv.width = cols;
  cv.height = rows;
  cv.style.width = `${(cols * celDev) / dpr}px`;
  cv.style.height = `${(rows * celDev) / dpr}px`;
  return { cols, rows };
}

const ESTILO_HOST: CSSProperties = { position: "relative", overflow: "hidden" };
const ESTILO_CANVAS = "position:absolute;left:0;top:0;display:block;image-rendering:pixelated";

/* ───────────────────────── Canvas 2D ───────────────────────── */

export type Quadro = Readonly<{
  ctx: CanvasRenderingContext2D;
  cols: number;
  rows: number;
  /** segundos */
  t: number;
  /** true quando é o quadro único do movimento reduzido */
  parado: boolean;
  /** cor de um token em "rgb(r g b / a)": q.cor("var(--accent)"), q.cor("color-mix(in oklab, var(--accent) 40%, white)", 0.5) */
  cor: (css: string, alfa?: number) => string;
}>;

/** Pinta uma lista [x0,y0,x1,y1,...] de células com UM fill (milhares de rects num path são baratos; milhares de fills não). */
export function pintarCelulas(ctx: CanvasRenderingContext2D, celulas: readonly number[], estilo: string) {
  if (!celulas.length) return;
  ctx.fillStyle = estilo;
  ctx.beginPath();
  for (let i = 0; i < celulas.length; i += 2) ctx.rect(celulas[i] ?? 0, celulas[i + 1] ?? 0, 1, 1);
  ctx.fill();
}

export function DitherCanvas({
  pintar,
  cell = 2,
  fps = 24,
  label,
  className,
  style,
}: Readonly<{
  pintar: (q: Quadro) => void;
  /** px de CSS por célula (inteiro; 2 a 4 é o miolo do estilo) */
  cell?: number;
  fps?: number;
  /** texto alternativo; sem ele o canvas é decorativo (aria-hidden) */
  label?: string;
  className?: string;
  style?: CSSProperties;
}>) {
  const host = useRef<HTMLDivElement>(null);
  const pintarRef = useRef(pintar);
  pintarRef.current = pintar; // o painter mais novo, sem recriar o laço

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const cv = document.createElement("canvas");
    cv.style.cssText = ESTILO_CANVAS;
    cv.setAttribute("aria-hidden", "true");
    el.appendChild(cv);
    const ctx = cv.getContext("2d");
    if (!ctx) return () => cv.remove();
    let grade = medirGrade(el, cv, cell);
    const cache = new Map<string, [number, number, number]>();
    const cor = (css: string, alfa = 1) => {
      let c = cache.get(css);
      if (!c) {
        c = rgbDoCss(el, css);
        cache.set(css, c);
      }
      return `rgb(${c[0]} ${c[1]} ${c[2]} / ${alfa})`;
    };
    const quadro = (t: number, parado: boolean) => {
      ctx.clearRect(0, 0, grade.cols, grade.rows);
      pintarRef.current({ ctx, cols: grade.cols, rows: grade.rows, t, parado, cor });
    };
    const laco = criarLaco(el, quadro, fps);
    const ro = new ResizeObserver(() => {
      grade = medirGrade(el, cv, cell); // mudar width/height do canvas já o limpa
      laco.pedir();
    });
    ro.observe(el);
    const largarTema = observarTema(() => {
      cache.clear();
      laco.pedir();
    });
    return () => {
      laco.parar();
      ro.disconnect();
      largarTema();
      cv.remove();
    };
  }, [cell, fps]);

  return (
    <div
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={className}
      ref={host}
      role={label ? "img" : undefined}
      style={{ ...ESTILO_HOST, ...style }}
    />
  );
}

/* ───────────────────────── Canvas WebGL2 (fragment shader) ───────────────────────── */

const VERT = `#version 300 es
void main(){ vec2 p = vec2((gl_VertexID<<1)&2, gl_VertexID&2); gl_Position = vec4(p*2.-1., 0., 1.); }`;

/**
 * Contrato do shader: `#version 300 es`, `uniform vec2 uRes` (tamanho da grade em CÉLULAS), `uniform float uTime`,
 * `out vec4 ...`; gl_FragCoord já é a coordenada da célula. Cada chave de `cores` vira um `uniform vec3` com o
 * token resolvido (RGB 0..1); `uniformes` roda a cada quadro para o que mais você precisar (nível, mouse, forma).
 */
export function ShaderCanvas({
  frag,
  cell = 3,
  fps = 24,
  cores = {},
  uniformes,
  label,
  className,
  style,
}: Readonly<{
  frag: string;
  cell?: number;
  fps?: number;
  cores?: Readonly<Record<string, string>>;
  uniformes?: (gl: WebGL2RenderingContext, loc: (nome: string) => WebGLUniformLocation | null, t: number) => void;
  label?: string;
  className?: string;
  style?: CSSProperties;
}>) {
  const host = useRef<HTMLDivElement>(null);
  const coresRef = useRef(cores);
  coresRef.current = cores;
  const uniRef = useRef(uniformes);
  uniRef.current = uniformes;
  const relerCores = useRef<() => void>(() => {});
  const chaveCores = JSON.stringify(cores);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const cv = document.createElement("canvas");
    cv.style.cssText = ESTILO_CANVAS;
    cv.setAttribute("aria-hidden", "true");
    el.appendChild(cv);
    const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) {
      el.dataset.semWebgl = "true"; // estilize [data-sem-webgl] com um gradiente de reserva
      return () => cv.remove();
    }
    const compila = (tipo: number, src: string) => {
      const s = gl.createShader(tipo);
      if (!s) throw new Error("createShader falhou");
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    const prog = gl.createProgram();
    try {
      gl.attachShader(prog, compila(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compila(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
    } catch (e) {
      console.error("[ShaderCanvas]", e);
      el.dataset.semWebgl = "true";
      return () => cv.remove();
    }
    gl.useProgram(prog);
    const locs = new Map<string, WebGLUniformLocation | null>();
    const loc = (n: string) => {
      if (!locs.has(n)) locs.set(n, gl.getUniformLocation(prog, n));
      return locs.get(n) ?? null;
    };
    let grade = medirGrade(el, cv, cell);
    gl.viewport(0, 0, grade.cols, grade.rows);
    let rgbs: [string, number[]][] = [];
    const lerCores = () => {
      rgbs = Object.entries(coresRef.current).map(([nome, css]) => [nome, rgbDoCss(el, css).map((v) => v / 255)]);
    };
    lerCores();
    const quadro = (t: number) => {
      gl.uniform2f(loc("uRes"), grade.cols, grade.rows);
      gl.uniform1f(loc("uTime"), t);
      for (const [nome, [r, g, b]] of rgbs) gl.uniform3f(loc(nome), r ?? 0, g ?? 0, b ?? 0);
      uniRef.current?.(gl, loc, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const laco = criarLaco(el, quadro, fps);
    const ro = new ResizeObserver(() => {
      grade = medirGrade(el, cv, cell);
      gl.viewport(0, 0, grade.cols, grade.rows);
      laco.pedir();
    });
    ro.observe(el);
    relerCores.current = () => {
      lerCores();
      laco.pedir();
    };
    const largarTema = observarTema(() => relerCores.current());
    return () => {
      relerCores.current = () => {};
      laco.parar();
      ro.disconnect();
      largarTema();
      gl.getExtension("WEBGL_lose_context")?.loseContext(); // libera a GPU (há um teto de ~16 contextos por página)
      cv.remove();
    };
  }, [frag, cell, fps]);

  // trocou o mapa de cores (ex.: outro token)? relê sem recriar o contexto WebGL
  useEffect(() => {
    relerCores.current();
  }, [chaveCores]);

  return (
    <div
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={className}
      ref={host}
      role={label ? "img" : undefined}
      style={{ ...ESTILO_HOST, ...style }}
    />
  );
}
