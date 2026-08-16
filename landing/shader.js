/**
 * WebGL Interactive Fluid & Grain Background Shader
 * Renders a subtle monochrome refractive fluid / grain mesh responding to pointer physics
 * 60fps, GPU-accelerated, respects prefers-reduced-motion
 */

export function initBackgroundShader(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
  if (!gl) return;

  const vsSource = `
    attribute vec2 position;
    varying vec2 vUv;
    void main() {
      vUv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fsSource = `
    precision mediump float;
    uniform vec2 uResolution;
    uniform vec2 uPointer;
    uniform float uTime;
    uniform float uDark;
    varying vec2 vUv;

    // Simplex Noise Approximation
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution.xy;
      vec2 p = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);

      // Pointer influence with ripple physics
      float dist = length(uv - uPointer);
      float ripple = sin(dist * 22.0 - uTime * 2.8) * exp(-dist * 4.0) * 0.07;

      // Layered Noise for luxury fluid motion
      float n1 = snoise(p * 0.75 + vec2(uTime * 0.035, uTime * 0.025) + ripple);
      float n2 = snoise(p * 1.5 - vec2(uTime * 0.025, uTime * 0.045) - ripple * 0.5);
      float combined = (n1 * 0.65 + n2 * 0.35);

      // Fine film grain
      float grain = (fract(sin(dot(uv.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.038;

      if (uDark > 0.5) {
        // Dark Mode: Deep pitch black with subtle silver refraction
        float glow = smoothstep(-0.6, 0.9, combined);
        vec3 color = mix(vec3(0.0, 0.0, 0.0), vec3(0.095, 0.095, 0.115), glow);
        color += grain;
        gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
      } else {
        // Light Mode: Luxury silver-platinum fluid mesh with tactile matte paper texture
        float flow = smoothstep(-0.75, 0.75, combined);
        
        // Fluid waves: soft cool zinc/slate shadows (0.83, 0.85, 0.89) to luminous crisp white crests
        vec3 shadow = vec3(0.83, 0.85, 0.89);
        vec3 crest  = vec3(0.995, 0.995, 1.0);
        vec3 color  = mix(shadow, crest, flow);
        
        // Interactive pointer gaze light
        float pointerGaze = smoothstep(0.35, 0.0, dist) * 0.05;
        color += pointerGaze;
        
        // Tactile paper grain
        color += grain * 0.8;
        
        gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
      }
    }
  `;

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  const program = gl.createProgram();
  gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vsSource));
  gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fsSource));
  gl.linkProgram(program);
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1,
  ]), gl.STATIC_DRAW);

  const posAttr = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(posAttr);
  gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, 'uResolution');
  const uPointer = gl.getUniformLocation(program, 'uPointer');
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uDark = gl.getUniformLocation(program, 'uDark');

  let pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  window.addEventListener('pointermove', (e) => {
    pointer.targetX = e.clientX / window.innerWidth;
    pointer.targetY = 1.0 - (e.clientY / window.innerHeight);
  }, { passive: true });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let startTime = performance.now();

  function render(now) {
    const elapsed = prefersReducedMotion ? 0 : (now - startTime) * 0.001;
    
    // Smooth lerp pointer
    pointer.x += (pointer.targetX - pointer.x) * 0.08;
    pointer.y += (pointer.targetY - pointer.y) * 0.08;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uPointer, pointer.x, pointer.y);
    gl.uniform1f(uTime, elapsed);
    gl.uniform1f(uDark, isDark ? 1.0 : 0.0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (!prefersReducedMotion) {
      requestAnimationFrame(render);
    }
  }

  requestAnimationFrame(render);
}
