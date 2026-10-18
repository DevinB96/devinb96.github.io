// Hero: morning sunlight through a window, falling across a linen wall and floor, with soft
// leaf shadows moving in the breeze. On load a single bright "squeegee" pass sweeps across and
// the haze clears. One fragment shader, no libraries; pauses when off screen.

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uClear;   // 0 hazy -> 1 crisp (the opening sweep)
uniform float uSweep;   // position of the sweep band, -0.4 .. 1.6
uniform vec2 uPointer;  // smoothed pointer, -1..1
uniform float uScroll;  // 0..1 through the hero
uniform float uPortrait;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}
// Soft-edged window: 3 x 2 panes with glazing bars, in window space q (0..1).
float windowLight(vec2 q, float soft) {
  float s = soft;
  float frame = smoothstep(-s, s, q.x) * smoothstep(-s, s, 1.0 - q.x) * smoothstep(-s, s, q.y) * smoothstep(-s, s, 1.0 - q.y);
  float bx = abs(fract(q.x * 3.0 + 0.5) - 0.5) / 3.0;      // distance to vertical bars
  float by = abs(fract(q.y * 2.0 + 0.5) - 0.5) / 2.0;      // distance to horizontal bar
  float bars = smoothstep(0.012 - s * 0.6, 0.012 + s * 0.9, bx) * smoothstep(0.016 - s * 0.6, 0.016 + s * 0.9, by);
  return frame * bars;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);

  // Room: wall above, floor below the skirting line.
  float floorY = mix(0.2, 0.14, uPortrait);
  float isFloor = 1.0 - smoothstep(floorY - 0.002, floorY + 0.002, uv.y);
  vec3 wall = mix(vec3(0.925, 0.900, 0.858), vec3(0.952, 0.935, 0.902), uv.y);
  vec3 flr = mix(vec3(0.835, 0.780, 0.700), vec3(0.880, 0.835, 0.765), uv.y / floorY);
  vec3 base = mix(wall, flr, isFloor);
  // Skirting board highlight
  base += vec3(0.04) * smoothstep(0.012, 0.0, abs(uv.y - floorY - 0.012)) * (1.0 - isFloor);

  // Light patch on the wall: a skewed projection of the window, drifting with time of day.
  float drift = sin(uTime * 0.03) * 0.02 + uScroll * 0.08;
  vec2 origin = vec2(aspect * mix(0.50, 0.08, uPortrait) + drift + uPointer.x * 0.015, mix(0.30, 0.48, uPortrait) + uPointer.y * 0.01);
  vec2 d = p - origin;
  float w = aspect * mix(0.40, 0.92, uPortrait);
  float h = mix(0.62, 0.44, uPortrait);
  // Skew: sunlight arrives from the upper right, so the patch shears.
  vec2 q = vec2((d.x - d.y * 0.38) / w, d.y / h);
  float soft = mix(0.035, 0.012, uClear) + q.y * 0.02;
  float light = windowLight(q, soft);

  // Continuation on the floor, foreshortened.
  vec2 qf = vec2((d.x + (floorY - uv.y) * 1.6 - (floorY - origin.y) * 0.38) / (w * 1.15), 1.0 - (floorY - uv.y) / (floorY * 0.9));
  float floorLight = windowLight(vec2(qf.x, qf.y), soft * 1.6) * isFloor * 0.85;
  light = mix(light, floorLight, isFloor);

  // Leaf shadows from a tree outside, swaying.
  vec2 lp = q * vec2(2.4, 2.0) + vec2(uTime * 0.035, sin(uTime * 0.21) * 0.06);
  float leaves = fbm(lp * 2.2 + fbm(lp * 1.3 + uTime * 0.02) * 0.9);
  float leafMask = smoothstep(0.47, 0.62 - 0.04 * uClear, leaves) * smoothstep(0.1, 0.6, q.x + q.y * 0.5);
  light *= 1.0 - leafMask * 0.7;

  // Light colour: warm sun, cool shadow.
  vec3 sun = vec3(1.0, 0.93, 0.78);
  vec3 col = base * vec3(0.955, 0.945, 0.93);
  col += sun * light * 0.34;
  // Bounce and bloom around the patch
  float glow = exp(-dot(q - vec2(0.5, 0.5), q - vec2(0.5, 0.5)) * 2.6);
  col += sun * glow * 0.07;

  // The opening sweep: a bright diagonal band passing once from left to right.
  float band = (uv.x + uv.y * 0.35) - uSweep;
  col += vec3(1.0, 0.98, 0.92) * exp(-band * band * 90.0) * 0.18 * (1.0 - uClear * 0.6);

  // Haze before the sweep: lower contrast, slightly desaturated.
  float haze = 1.0 - uClear;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(lum) * 0.98 + 0.03, haze * 0.45);

  // Vignette and fine grain
  float vig = smoothstep(1.25, 0.35, length((uv - vec2(0.55, 0.55)) * vec2(1.1, 1.3)));
  col *= mix(0.92, 1.0, vig);
  col += (hash(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * 0.012;
  gl_FragColor = vec4(col, 1.0);
}`;

const VERT = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';

export function start(canvas, { reduced = false } = {}) {
  // Low-memory devices keep the static CSS light instead.
  if ((navigator.deviceMemory || 8) <= 2 || navigator.connection?.saveData) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  if (!gl) return;
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = Object.fromEntries(['uRes', 'uTime', 'uClear', 'uSweep', 'uPointer', 'uScroll', 'uPortrait'].map((n) => [n, gl.getUniformLocation(prog, n)]));

  // Render below native resolution: the image is soft by nature and this keeps the GPU cool.
  const scale = Math.min(window.devicePixelRatio || 1, 1.5) * (innerWidth < 760 ? 0.6 : 0.7);
  function resize() {
    const w = Math.max(1, Math.round(canvas.clientWidth * scale));
    const h = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    gl.uniform2f(U.uRes, w, h);
    gl.uniform1f(U.uPortrait, canvas.clientWidth < canvas.clientHeight * 0.95 ? 1 : 0);
  }
  addEventListener('resize', resize);
  resize();

  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduced) addEventListener('pointermove', (e) => { ptr.tx = (e.clientX / innerWidth) * 2 - 1; ptr.ty = -((e.clientY / innerHeight) * 2 - 1); }, { passive: true });

  const t0 = performance.now();
  let visible = true;
  let raf = 0;
  const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

  // Phones draw at 30fps: the light moves slowly, and it halves the GPU work.
  const minGap = innerWidth < 760 ? 32 : 0;
  let lastDraw = 0;
  function frame(now) {
    if (now - lastDraw < minGap) { raf = requestAnimationFrame(frame); return; }
    lastDraw = now;
    const t = (now - t0) / 1000;
    const k = reduced ? 1 : Math.min(1, Math.max(0, (t - 0.35) / 2.2));
    ptr.x += (ptr.tx - ptr.x) * 0.04;
    ptr.y += (ptr.ty - ptr.y) * 0.04;
    gl.uniform1f(U.uTime, reduced ? 12 : t + 12);
    gl.uniform1f(U.uClear, easeInOut(k));
    gl.uniform1f(U.uSweep, -0.4 + easeInOut(k) * 2.0);
    gl.uniform2f(U.uPointer, ptr.x, ptr.y);
    gl.uniform1f(U.uScroll, Math.min(1, scrollY / Math.max(1, canvas.clientHeight)));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!canvas.classList.contains('is-on')) canvas.classList.add('is-on');
    raf = !reduced && visible && !document.hidden ? requestAnimationFrame(frame) : 0;
  }
  const kick = () => { if (!raf && visible && !document.hidden && !reduced) raf = requestAnimationFrame(frame); };
  // Use the latest entry: several changes can arrive in one batch after a fast scroll.
  new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; kick(); }).observe(canvas);
  document.addEventListener('visibilitychange', kick);
  if (reduced) addEventListener('resize', () => requestAnimationFrame(frame));
  raf = requestAnimationFrame(frame);
}
