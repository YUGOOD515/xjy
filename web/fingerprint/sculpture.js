import shader from "./sculpture-shader.json";
import { visualParameters } from "./data.js";

const failure = (code, cause) =>
  Object.assign(new Error(code), { code, cause });

// Plain WebGL2 replacement for the former Three.js r155 ShaderMaterial pipeline.
// The prefixes below are byte-for-byte what Three.js prepended to the precompiled
// Shader Park GLSL, and the GL state/maths mirror its renderer, so frames stay identical.
const VERTEX_PREFIX = (PRECISION) => `#version 300 es
precision mediump sampler2DArray;
#define attribute in
#define varying out
#define texture2D texture
${PRECISION}
#define SHADER_TYPE ShaderMaterial
#define SHADER_NAME\x20
#define FLIP_SIDED
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
uniform bool isOrthographic;
#ifdef USE_INSTANCING
	attribute mat4 instanceMatrix;
#endif
#ifdef USE_INSTANCING_COLOR
	attribute vec3 instanceColor;
#endif
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
#ifdef USE_UV1
	attribute vec2 uv1;
#endif
#ifdef USE_UV2
	attribute vec2 uv2;
#endif
#ifdef USE_UV3
	attribute vec2 uv3;
#endif
#ifdef USE_TANGENT
	attribute vec4 tangent;
#endif
#if defined( USE_COLOR_ALPHA )
	attribute vec4 color;
#elif defined( USE_COLOR )
	attribute vec3 color;
#endif
#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )
	attribute vec3 morphTarget0;
	attribute vec3 morphTarget1;
	attribute vec3 morphTarget2;
	attribute vec3 morphTarget3;
	#ifdef USE_MORPHNORMALS
		attribute vec3 morphNormal0;
		attribute vec3 morphNormal1;
		attribute vec3 morphNormal2;
		attribute vec3 morphNormal3;
	#else
		attribute vec3 morphTarget4;
		attribute vec3 morphTarget5;
		attribute vec3 morphTarget6;
		attribute vec3 morphTarget7;
	#endif
#endif
#ifdef USE_SKINNING
	attribute vec4 skinIndex;
	attribute vec4 skinWeight;
#endif

`;
const FRAGMENT_PREFIX = (PRECISION) => `#version 300 es
#define varying in
layout(location = 0) out highp vec4 pc_fragColor;
#define gl_FragColor pc_fragColor
#define gl_FragDepthEXT gl_FragDepth
#define texture2D texture
#define textureCube texture
#define texture2DProj textureProj
#define texture2DLodEXT textureLod
#define texture2DProjLodEXT textureProjLod
#define textureCubeLodEXT textureLod
#define texture2DGradEXT textureGrad
#define texture2DProjGradEXT textureProjGrad
#define textureCubeGradEXT textureGrad
${PRECISION}
#define SHADER_TYPE ShaderMaterial
#define SHADER_NAME\x20
#define FLIP_SIDED
uniform mat4 viewMatrix;
uniform vec3 cameraPosition;
uniform bool isOrthographic;
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 linearToOutputTexel( vec4 value ) { return LinearTosRGB( value ); }

`;
const CONTEXT = {
  alpha: true,
  depth: true,
  stencil: true,
  antialias: true,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  powerPreference: "default",
  failIfMajorPerformanceCaveat: false,
};
const FOV = 40,
  NEAR = 0.1,
  FAR = 100,
  CAMERA_Z = 4.6;

function precisionOf(gl) {
  const ok = (type) =>
    gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, type).precision > 0 &&
    gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, type).precision > 0;
  const p = ok(gl.HIGH_FLOAT)
    ? "highp"
    : ok(gl.MEDIUM_FLOAT)
      ? "mediump"
      : "lowp";
  return `precision ${p} float;\nprecision ${p} int;\n#define ${{ highp: "HIGH", mediump: "MEDIUM", lowp: "LOW" }[p]}_PRECISION`;
}

// THREE.SphereGeometry(1.5, 8, 8): only the position attribute reaches the shader.
function sphere(radius, segments) {
  const position = [],
    index = [];
  for (let iy = 0; iy <= segments; iy++)
    for (let ix = 0; ix <= segments; ix++) {
      const u = ix / segments,
        v = iy / segments;
      position.push(
        -radius * Math.cos(u * Math.PI * 2) * Math.sin(v * Math.PI),
        radius * Math.cos(v * Math.PI),
        radius * Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI),
      );
    }
  const at = (iy, ix) => iy * (segments + 1) + ix;
  for (let iy = 0; iy < segments; iy++)
    for (let ix = 0; ix < segments; ix++) {
      const a = at(iy, ix + 1),
        b = at(iy, ix),
        c = at(iy + 1, ix),
        d = at(iy + 1, ix + 1);
      if (iy !== 0) index.push(a, b, d);
      if (iy !== segments - 1) index.push(b, c, d);
    }
  return {
    position: new Float32Array(position),
    index: new Uint16Array(index),
  };
}

// Object3D.rotation (Euler XYZ, z = 0) -> quaternion -> Matrix4.compose, as Three.js does.
function modelMatrix(x, y) {
  const c1 = Math.cos(x / 2),
    c2 = Math.cos(y / 2),
    c3 = Math.cos(0),
    s1 = Math.sin(x / 2),
    s2 = Math.sin(y / 2),
    s3 = Math.sin(0);
  const qx = s1 * c2 * c3 + c1 * s2 * s3,
    qy = c1 * s2 * c3 - s1 * c2 * s3,
    qz = c1 * c2 * s3 + s1 * s2 * c3,
    qw = c1 * c2 * c3 - s1 * s2 * s3;
  const x2 = qx + qx,
    y2 = qy + qy,
    z2 = qz + qz;
  const xx = qx * x2,
    xy = qx * y2,
    xz = qx * z2,
    yy = qy * y2,
    yz = qy * z2,
    zz = qz * z2,
    wx = qw * x2,
    wy = qw * y2,
    wz = qw * z2;
  // prettier-ignore
  return [
    1 - (yy + zz), xy + wz, xz - wy, 0,
    xy - wz, 1 - (xx + zz), yz + wx, 0,
    xz + wy, yz - wx, 1 - (xx + yy), 0,
    0, 0, 0, 1,
  ];
}

// PerspectiveCamera(40, aspect, 0.1, 100).updateProjectionMatrix()
function projectionMatrix(aspect) {
  const top = (NEAR * Math.tan((Math.PI / 180) * 0.5 * FOV)) / 1,
    height = 2 * top,
    width = aspect * height,
    left = -0.5 * width,
    right = left + width,
    bottom = top - height;
  // prettier-ignore
  return [
    (2 * NEAR) / (right - left), 0, 0, 0,
    0, (2 * NEAR) / (top - bottom), 0, 0,
    (right + left) / (right - left), (top + bottom) / (top - bottom), -(FAR + NEAR) / (FAR - NEAR), -1,
    0, 0, (-2 * FAR * NEAR) / (FAR - NEAR), 0,
  ];
}

// Pure description of the fluid sculpture, testable without a GPU.
export function createFluidMesh(coin, sentiment) {
  const params = visualParameters(coin, sentiment);
  const uniforms = Object.fromEntries(
    shader.uniforms.map(({ name, value }) => [
      name,
      Array.isArray(value) ? [...value] : value,
    ]),
  );
  Object.assign(uniforms, {
    _scale: 1.5,
    opacity: 1,
    mouse: [0, 0, 0],
    warp: params.roughness,
    mood: params.mood,
    seed: params.seed,
    cameraPosition: [0, 0, CAMERA_Z],
  });
  return {
    material: {
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      uniforms,
    },
    geometry: sphere(1.5, 8),
  };
}

function compile(gl, mesh) {
  const precision = precisionOf(gl),
    program = gl.createProgram(),
    sources = [
      [gl.VERTEX_SHADER, VERTEX_PREFIX(precision) + mesh.material.vertexShader],
      [
        gl.FRAGMENT_SHADER,
        FRAGMENT_PREFIX(precision) + mesh.material.fragmentShader,
      ],
    ];
  const shaders = sources.map(([type, source]) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    gl.attachShader(program, s);
    return s;
  });
  gl.linkProgram(program);
  shaders.forEach((s) => gl.deleteShader(s));
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw failure("SHADER_COMPILE", log);
  }
  return program;
}

function createRenderer(canvas, mesh) {
  const gl = canvas.getContext("webgl2", CONTEXT);
  if (!gl) throw failure("WEBGL_CONTEXT");
  const resources = { buffers: [], program: null, vao: null };
  const dispose = () => {
    resources.buffers.forEach((b) => gl.deleteBuffer(b));
    if (resources.vao) gl.deleteVertexArray(resources.vao);
    if (resources.program) gl.deleteProgram(resources.program);
    resources.buffers = [];
    resources.vao = resources.program = null;
  };
  try {
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.clearStencil(0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    // Material side: BackSide, rendered by flipping the front face like Three.js.
    gl.frontFace(gl.CW);
    // transparent + NormalBlending with premultipliedAlpha: false
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
    const program = (resources.program = compile(gl, mesh));
    gl.useProgram(program);
    const vao = (resources.vao = gl.createVertexArray());
    gl.bindVertexArray(vao);
    const upload = (target, data) => {
      const buffer = gl.createBuffer();
      resources.buffers.push(buffer);
      gl.bindBuffer(target, buffer);
      gl.bufferData(target, data, gl.STATIC_DRAW);
    };
    upload(gl.ARRAY_BUFFER, mesh.geometry.position);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 12, 0);
    upload(gl.ELEMENT_ARRAY_BUFFER, mesh.geometry.index);
    const locations = new Map();
    const set = (name, value) => {
      if (!locations.has(name))
        locations.set(name, gl.getUniformLocation(program, name));
      const at = locations.get(name);
      if (at === null) return;
      if (value.length === 16) gl.uniformMatrix4fv(at, false, value);
      else if (value.length === 3) gl.uniform3f(at, ...value);
      else if (value.length === 2) gl.uniform2f(at, ...value);
      else gl.uniform1f(at, value);
    };
    for (const [name, value] of Object.entries(mesh.material.uniforms))
      set(name, value);
    return {
      gl,
      set,
      draw() {
        gl.clear(
          gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT,
        );
        gl.drawElements(
          gl.TRIANGLES,
          mesh.geometry.index.length,
          gl.UNSIGNED_SHORT,
          0,
        );
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

export function mountFluid(
  host,
  coin,
  sentiment,
  { isPaused, reduced, onFailure = () => {} },
) {
  if (!host.isConnected) return () => {};
  const canvas = document.createElement("canvas");
  canvas.style.display = "block";
  const mesh = createFluidMesh(coin, sentiment);
  let renderer,
    observer,
    frame = 0,
    disposed = false;
  try {
    renderer = createRenderer(canvas, mesh);
  } catch (error) {
    if (error?.code) throw error;
    throw failure("WEBGL_CONTEXT", error);
  }
  const pixelRatio = Math.min(globalThis.devicePixelRatio || 1, 1.5);
  let elapsed = 0,
    last = performance.now(),
    mx = 0,
    my = 0;
  const move = (event) => {
    const r = host.getBoundingClientRect();
    mx = (event.clientX - r.left) / Math.max(r.width, 1) - 0.5;
    my = (event.clientY - r.top) / Math.max(r.height, 1) - 0.5;
  };
  const leave = () => {
    mx = 0;
    my = 0;
  };
  const lost = (event) => {
    event.preventDefault();
    stop();
    onFailure(failure("WEBGL_LOST"));
  };
  function stop() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    host.removeEventListener("pointermove", move);
    host.removeEventListener("pointerleave", leave);
    canvas.removeEventListener("webglcontextlost", lost);
    renderer.dispose();
    canvas.remove();
  }
  const size = () => {
    const r = host.getBoundingClientRect(),
      width = Math.max(r.width, 1),
      height = Math.max(r.height, 1);
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    renderer.gl.viewport(
      0,
      0,
      Math.floor(width * pixelRatio),
      Math.floor(height * pixelRatio),
    );
    renderer.set("projectionMatrix", projectionMatrix(width / height));
    renderer.set("resolution", [width, height]);
  };
  const render = () => {
    const model = modelMatrix(my * 0.3, mx * 0.4),
      view = [...model];
    view[14] = -CAMERA_Z; // camera at z = 4.6: viewMatrix * modelMatrix
    renderer.set("t", elapsed);
    renderer.set("modelViewMatrix", view);
    renderer.set("modelMatrix", model);
    renderer.draw();
  };
  const tick = () => {
    if (disposed) return;
    const now = performance.now();
    if (!isPaused() && !reduced()) elapsed += Math.min(now - last, 100) / 1000;
    last = now;
    if (!document.hidden)
      try {
        render();
      } catch (error) {
        stop();
        onFailure(error);
        return;
      }
    frame = requestAnimationFrame(tick);
  };
  try {
    size();
    render();
    host.replaceChildren(canvas);
    observer = new ResizeObserver(size);
    observer.observe(host);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    canvas.addEventListener("webglcontextlost", lost);
    frame = requestAnimationFrame(tick);
    return stop;
  } catch (error) {
    stop();
    throw error;
  }
}
