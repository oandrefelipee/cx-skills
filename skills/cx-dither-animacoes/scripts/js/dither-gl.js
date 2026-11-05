/**
 * dither-gl.js - motor WebGL de dither ordenado (Bayer 8x8). Modulo ES, sem dependencias.
 *
 *   import { DitherGL, hexToRgb } from './dither-gl.js';
 *   if (!DitherGL.supported()) { ...use dither-canvas.js ou svg-tone-filter.js (fallback)... }
 *   const gl = new DitherGL(canvas);
 *   gl.resize(320, 320);                       // tamanho CSS; ja aplica DPR (max 2)
 *   gl.setTexture(img, { premult: true });     // img = HTMLImageElement/Canvas/ImageBitmap carregado
 *   gl.draw({ mode: 'gradient-map', px: 3, colors: ['#0A1A7A','#7BE8FF','#F5F7FF','#FFE24A'] });
 *
 * Modos (draw.mode):
 *   'gradient-map'  luminancia da textura -> 4 cores da rampa + Bayer (tinge qualquer imagem)
 *   'background'    fundo procedural (gradiente radial + ondas) quantizado em `steps` degraus
 *   'hatch'         hachura/gravura: espessura da linha cresce com a luminancia
 *   'overlay'       cobertura de transicao: cobre onde bayer(cell) < t  (t 0->1 cobre; 1->0 revela)
 *   'passthrough'   textura original NITIDA; so dissolve por Bayer na entrada (`reveal`, celula = px).
 *                   Com `mosaic: true` a textura tambem vira mosaico de celulas px (efeito pixel-resolve: px 32 -> 4).
 *
 * Tamanho do "pixel" do dither em UNIDADES DE TELA (CSS px): `px` e o lado da celula na tela;
 * internamente vira px * dpr / scale. Passe `scale` = escala atual do objeto quando ele encolhe
 * (morph/FLIP), assim o dither nao borra. `reveal` 0..1 (dissolve); `revealMode` 'bayer'|'sweep'.
 *
 * Erros: lanca DitherGLUnsupported se nao houver WebGL (ou contexto perdido). Sempre sirva a pagina
 * por HTTP: texturas de file:// sao bloqueadas pelo navegador.
 */

export class DitherGLUnsupported extends Error {}

const MODES = { 'gradient-map': 0, background: 1, hatch: 2, overlay: 3, passthrough: 4 };

const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

// Fragment shader (GLSL ES 1.00: roda em WebGL1 e WebGL2).
const FS = `precision highp float;
uniform sampler2D tx; uniform vec2 res;
uniform float px,time,grain,amt,steps,mode,lo,hi,gam,reveal,revMode,aDither,hatchPer,t,sweep,bgK,bgWave,premult,mosaic;
uniform vec2 focus;
uniform vec3 c0,c1,c2,c3;
float b2(vec2 a){a=floor(a);return fract(a.x/2.+a.y*a.y*.75);}
float b4(vec2 a){return b2(.5*a)*.25+b2(a);}
float b8(vec2 a){return b4(.5*a)*.25+b2(a);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 pal(float k){float u=k*3.;vec3 c=c0;c=mix(c,c1,step(.5,u));c=mix(c,c2,step(1.5,u));c=mix(c,c3,step(2.5,u));return c;}
float quant(float l){float k=floor(clamp(l,0.,.9999)*steps);return floor(k*(3./(steps-1.))+.5)/3.;}
// amostra sempre PREMULTIPLICADA (evita franja escura em bordas com alfa)
vec4 tap(vec2 uv){vec4 s=texture2D(tx,uv);return premult>.5?s:vec4(s.rgb*s.a,s.a);}
void main(){
  vec2 cell=floor(gl_FragCoord.xy/px);
  vec2 q=(cell+.5)*px/res;
  vec2 uv=vec2(q.x,1.-q.y);
  float d=(b8(cell)-.5)*amt;
  float g=(hash(cell+floor(time*8.))-.5)*grain;
  if(mode>3.5){ // passthrough: so dissolve/varredura na entrada
    float vis4=revMode<.5?step(b8(cell+9.),reveal):step(uv.x*.55+uv.y*.45,reveal*1.2-.1)*step(.001,reveal);
    // textura na resolucao cheia (nitida); so pixeliza (mosaico de celulas px) se mosaic=1
    vec2 uvf=mosaic>.5?uv:vec2(gl_FragCoord.x/res.x,1.-gl_FragCoord.y/res.y);
    vec4 s=texture2D(tx,uvf); if(premult<.5) s.rgb*=s.a;
    gl_FragColor=s*vis4;return;
  }
  if(mode<.5||(mode>1.5&&mode<2.5)){
    // 4 amostras em volta do centro da celula = filtro de caixa barato (estabiliza o dither)
    vec2 o=.25*px/res;
    vec4 s=tap(uv+vec2(-o.x,-o.y))+tap(uv+vec2(o.x,-o.y))+tap(uv+vec2(-o.x,o.y))+tap(uv+vec2(o.x,o.y));
    float a=s.a/4.;
    vec3 rgb=s.rgb/max(s.a,.001);
    float lum=dot(rgb,vec3(.2126,.7152,.0722));
    lum=pow(clamp((lum-lo)/(hi-lo),0.,1.),gam);
    float vis=1.;
    if(revMode<.5)vis=step(b8(cell+9.),reveal);
    else vis=step(uv.x*.55+uv.y*.45,reveal*1.2-.1)*step(.001,reveal);
    if(mode<.5){
      float l=lum+d/steps+g;
      vec3 col=pal(quant(l));
      float at=aDither>.5?b8(cell+3.)*.9+.05:.5; // alfa em Bayer (borda serrilhada de pixel-art)
      float al=step(at,a)*vis;
      gl_FragColor=vec4(col*al,al);return;
    }
    // hachura (gravura): densidade segue a luminancia
    vec2 p=gl_FragCoord.xy;
    float aa=1.2/hatchPer;
    float u1=fract((p.x+p.y)/hatchPer);
    float w1=.16+clamp(lum,0.,1.)*.62;
    float l1=smoothstep(w1+aa,w1-aa,u1);
    float u2=fract((p.x-p.y)/hatchPer);
    float w2=clamp((lum-.52)*1.7,0.,1.)*.7;
    float l2=w2>.01?smoothstep(w2+aa,w2-aa,u2):0.;
    float ink=max(l1,l2);
    vec3 line=mix(c2,c3,step(.84,lum));
    vec3 col=mix(c1,line,ink);
    col=mix(col,c0,step(lum,.1));
    float al=smoothstep(.35,.65,a)*vis;
    gl_FragColor=vec4(col*al,al);return;
  }
  if(mode<1.5){ // fundo procedural
    vec2 u=vec2(q.x,1.-q.y);
    float asp=res.x/res.y;
    vec2 f=focus;f.x+=.05*sin(time*.4);
    float l=1.-distance(u*vec2(asp,1.),f*vec2(asp,1.))*bgK;
    l+=bgWave*sin(u.x*6.+time*.6)*sin(u.y*5.-time*.5);
    l=l+d/steps+g;
    gl_FragColor=vec4(pal(quant(l)),1.);return;
  }
  // mode 3: overlay de transicao em dither (cobre quando b8 < t)
  float thr=b8(cell);
  float ax=mix(uv.x,uv.y,sweep);
  float v=t*1.25-ax*.25;
  float cov=step(thr,v);
  float edge=cov*(1.-step(thr,v-.06)); // faixa de 1 degrau com a cor c1 na frente da cobertura
  vec3 col=mix(c0,c1,edge);
  gl_FragColor=vec4(col*cov,cov);
}`;

const DEFAULTS = {
  mode: 'gradient-map', px: 3, colors: null, steps: 4, amt: 1, grain: 0, time: 0,
  lo: 0, hi: 1, gam: 1, reveal: 1, revealMode: 'bayer', aDither: false, hatchPer: 4,
  t: 0, sweep: 0, bgK: 1.1, bgWave: 0.1, focus: [0.5, 0.5], scale: 1, mosaic: false,
};

export function hexToRgb(h) {
  if (Array.isArray(h)) return h;
  h = String(h).replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
}

const isPow2 = n => (n & (n - 1)) === 0;

export class DitherGL {
  /** true se o navegador cria um contexto WebGL (testa num canvas descartavel). */
  static supported() {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch { return false; }
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{maxDpr?:number}} [opts]  maxDpr limita o devicePixelRatio (padrao 2: economiza fill-rate)
   */
  constructor(canvas, opts = {}) {
    this.cv = canvas;
    this.maxDpr = opts.maxDpr ?? 2;
    this.dpr = 1;
    this.ok = false;
    const attrs = { premultipliedAlpha: true, antialias: false, alpha: true };
    let gl = canvas.getContext('webgl2', attrs);
    this.v2 = !!gl;
    gl = gl || canvas.getContext('webgl', attrs);
    if (!gl) throw new DitherGLUnsupported('WebGL indisponivel: use dither-canvas.js ou svg-tone-filter.js como fallback.');
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(s));
      return s;
    };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.gl = gl; this.pr = pr; this.U = {}; this.tex = null; this.premult = true; this.ok = true;
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.ok = false; });
  }

  _u(n) { return this.U[n] ?? (this.U[n] = this.gl.getUniformLocation(this.pr, n)); }

  /**
   * Define o tamanho do canvas em px CSS e aplica DPR (buffer = css * dpr).
   * Se omitir w/h, usa o tamanho CSS atual do canvas.
   */
  resize(w, h) {
    const cv = this.cv;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    if (w == null) { const r = cv.getBoundingClientRect(); w = r.width; h = r.height; }
    else { cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
    cv.width = Math.max(1, Math.round(w * this.dpr));
    cv.height = Math.max(1, Math.round(h * this.dpr));
    return this;
  }

  /**
   * Envia a textura.
   * @param {TexImageSource} img carregada (use await img.decode() / onload)
   * @param {{premult?:boolean, nearest?:boolean}} [o]
   *   premult (padrao true): premultiplica o alfa no upload (obrigatorio com mipmap p/ nao ter franja escura)
   *   nearest: filtro NEAREST sem mipmap (pixel-art nitida)
   */
  setTexture(img, o = {}) {
    const gl = this.gl, premult = o.premult ?? true, nearest = !!o.nearest;
    if (this.tex) gl.deleteTexture(this.tex);
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premult);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    const w = img.naturalWidth || img.videoWidth || img.width, h = img.naturalHeight || img.videoHeight || img.height;
    const mip = !nearest && (this.v2 || (isPow2(w) && isPow2(h))); // WebGL1 so faz mipmap em potencia de 2
    if (mip) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, nearest ? gl.NEAREST : mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, nearest ? gl.NEAREST : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.tex = t; this.premult = premult;
    return this;
  }

  /** Desenha um quadro. Veja o cabecalho do arquivo para os campos. Retorna this. */
  draw(opts = {}) {
    if (!this.ok) return this;
    const gl = this.gl, cv = this.cv;
    const o = { ...DEFAULTS, ...opts };
    const mode = MODES[o.mode];
    if (mode == null) throw new Error('mode invalido: ' + o.mode);
    if (!o.colors && mode !== 4) o.colors = ['#0A1A7A', '#7BE8FF', '#F5F7FF', '#FFE24A'];
    gl.viewport(0, 0, cv.width, cv.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (this.tex) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex); }
    const f1 = (n, v) => { const l = this._u(n); if (l) gl.uniform1f(l, v); };
    gl.uniform1i(this._u('tx'), 0);
    gl.uniform2f(this._u('res'), cv.width, cv.height);
    // pixel do dither em px de dispositivo: px CSS * dpr / escala do objeto (>=1)
    const scale = Math.max(0.02, o.scale);
    f1('px', Math.max(1, o.px * this.dpr / scale));
    f1('hatchPer', Math.max(2.5, o.hatchPer * this.dpr / scale));
    f1('mode', mode); f1('steps', Math.max(2, o.steps)); f1('amt', o.amt); f1('grain', o.grain); f1('time', o.time);
    f1('lo', o.lo); f1('hi', o.hi); f1('gam', o.gam); f1('reveal', o.reveal);
    f1('revMode', o.revealMode === 'sweep' ? 1 : 0); f1('aDither', o.aDither ? 1 : 0);
    f1('t', o.t); f1('sweep', o.sweep); f1('bgK', o.bgK); f1('bgWave', o.bgWave); f1('premult', this.premult ? 1 : 0); f1('mosaic', o.mosaic ? 1 : 0);
    gl.uniform2f(this._u('focus'), o.focus[0], o.focus[1]);
    (o.colors || []).forEach((c, i) => gl.uniform3fv(this._u('c' + i), hexToRgb(c)));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return this;
  }

  /** Limpa o canvas (transparente). */
  clear() {
    if (!this.ok) return this;
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    return this;
  }

  /** Libera a textura e o contexto. */
  destroy() {
    if (this.tex) this.gl.deleteTexture(this.tex);
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.ok = false;
  }
}

/** Carrega uma imagem (Promise<HTMLImageElement>). */
export function loadImage(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('imagem nao carregou: ' + src));
    i.src = src;
  });
}
