/**
 * Demonstração de react-dither-canvas.tsx: um botão-brasa (Canvas 2D) e um campo de maré (WebGL2), ambos pintados
 * com `--accent`. Não faz parte da biblioteca: serve para provar que o hook roda.
 *
 * Como rodar (num diretório onde `react` e `react-dom` 18+ estejam instalados):
 *   bun build examples/react-dither-canvas.demo.tsx --target=browser --outfile=examples/react-dither-canvas.demo.js
 *   abra examples/react-dither-canvas.demo.html no navegador (file:// funciona)
 * Com Vite/Next, importe `DitherCanvas` / `ShaderCanvas` direto de "react-dither-canvas" e ignore este arquivo.
 */
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import { BAYER8, DitherCanvas, ShaderCanvas, pintarCelulas, type Quadro } from "./react-dither-canvas";

const suave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Brasas subindo do rodapé na cor do token (o mesmo cálculo do botão Brasa, sem o estado "aceso"). */
function pintarBrasas(q: Quadro) {
  const { ctx, cols, rows, t } = q;
  const cor: number[] = [];
  const quente: number[] = [];
  for (let y = 0; y < rows; y++) {
    const v = y / rows;
    const linha = BAYER8[y % 8] ?? [];
    for (let x = 0; x < cols; x++) {
      const u = x / cols;
      const onda = 0.5 + 0.5 * Math.sin(u * 9 + t * 0.9 + Math.sin(v * 5 - t * 0.7) * 1.5);
      const grao = 0.5 + 0.5 * Math.sin(u * 23 - t * 1.3 + v * 11);
      const valor = suave(0.1, 1, v) * (0.42 + 0.58 * onda) * (0.68 + 0.32 * grao) * 0.8;
      const d = valor - (linha[x % 8] ?? 0.5);
      if (d > 0.34) quente.push(x, y);
      else if (d > 0) cor.push(x, y);
    }
  }
  pintarCelulas(ctx, cor, q.cor("var(--accent)"));
  pintarCelulas(ctx, quente, q.cor("color-mix(in oklab, var(--accent) 45%, white)"));
}

const FRAG_MARE = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uTime;
uniform vec3 uC0, uC1, uC2, uC3;          // 4 tons: fundo -> destaque (vêm de tokens CSS)
out vec4 o;
float add4(float a,float b){return 2.*a+3.*b-4.*a*b;}
float bayer8(vec2 c){vec2 q=mod(floor(c),8.);
  return (add4(floor(q.x/4.),floor(q.y/4.))+4.*add4(mod(floor(q.x/2.),2.),mod(floor(q.y/2.),2.))+16.*add4(mod(q.x,2.),mod(q.y,2.))+.5)/64.;}
void main(){
  vec2 cell=floor(gl_FragCoord.xy), uv=(cell+.5)/uRes, q=vec2(uv.x*uRes.x/uRes.y,uv.y);
  float f=.5+.25*sin(q.x*3.8+uTime*.55)+.25*sin(q.y*9.-uTime*.45+q.x*2.2);
  float l=clamp(f*(.6+.4*uv.x),0.,1.)*3.+bayer8(cell);
  int i=clamp(int(floor(l)),0,3);
  o=vec4(i==0?uC0:(i==1?uC1:(i==2?uC2:uC3)),1.);
}`;

const CORES_MARE = {
  uC0: "color-mix(in oklab, var(--accent) 20%, var(--background))",
  uC1: "color-mix(in oklab, var(--accent) 50%, var(--background))",
  uC2: "var(--accent)",
  uC3: "color-mix(in oklab, var(--accent) 50%, white)",
};

const CORES = [
  ["Azul", "oklch(0.6 0.2 265)"],
  ["Lima", "oklch(0.84 0.19 125)"],
  ["Laranja", "oklch(0.75 0.18 50)"],
] as const;

function App() {
  const [tema, setTema] = useState<"escuro" | "claro">(() => (document.documentElement.dataset.theme === "claro" ? "claro" : "escuro"));
  const [n, setN] = useState(0);
  const trocar = (t: "escuro" | "claro") => {
    setTema(t);
    document.documentElement.dataset.theme = t;
  };
  return (
    <main style={{ width: "min(100%, 520px)", margin: "0 auto", display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 18, margin: 0 }}>React · DitherCanvas e ShaderCanvas</h1>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {CORES.map(([nome, v]) => (
          <button key={nome} onClick={() => document.documentElement.style.setProperty("--accent", v)} type="button">
            {nome}
          </button>
        ))}
        <button aria-pressed={tema === "escuro"} onClick={() => trocar("escuro")} type="button">
          Escuro
        </button>
        <button aria-pressed={tema === "claro"} onClick={() => trocar("claro")} type="button">
          Claro
        </button>
        <button onClick={() => setN((v) => v + 1)} type="button">
          Re-render ({n})
        </button>
      </div>

      <button
        data-testid="botao"
        style={{ position: "relative", isolation: "isolate", height: 52, border: 0, borderRadius: 16, overflow: "hidden", color: "white", font: "600 16px system-ui", background: "color-mix(in oklab, var(--accent) 9%, black)" }}
        type="button"
      >
        <DitherCanvas cell={2} pintar={pintarBrasas} style={{ position: "absolute", inset: 0, zIndex: -1 }} />
        Gerar Pix
      </button>

      <ShaderCanvas
        cell={3}
        cores={CORES_MARE}
        frag={FRAG_MARE}
        label="Campo decorativo em pontilhado"
        style={{ height: 220, borderRadius: 18, background: "color-mix(in oklab, var(--accent) 30%, var(--background))" }}
      />
      <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>
        Em StrictMode (ativo aqui) o efeito monta, desmonta e monta de novo; os canvases são criados dentro do efeito, então não sobra contexto morto.
      </p>
    </main>
  );
}

const raiz = document.getElementById("root");
if (raiz) createRoot(raiz).render(<StrictMode><App /></StrictMode>);
