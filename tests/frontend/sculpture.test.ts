// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { coins } from "../../web/fingerprint/data.js";
import { sculptureFailureMessage } from "../../web/fingerprint/render.js";
import {
  createFluidMesh,
  mountFluid,
} from "../../web/fingerprint/sculpture.js";

const state = {
  contextFails: false,
  linkFails: false,
  contexts: [] as any[],
};
// Minimal WebGL2 double: records calls, never touches a GPU.
function fakeGL() {
  const calls: [string, ...unknown[]][] = [];
  const gl: any = new Proxy(
    { calls },
    {
      get(target: any, key: string) {
        if (key in target) return target[key];
        if (/^[A-Z_0-9]+$/.test(key)) return key;
        return (...args: unknown[]) => {
          calls.push([key, ...args]);
          if (key === "getShaderPrecisionFormat") return { precision: 23 };
          if (key === "getProgramParameter") return !state.linkFails;
          if (key === "getAttribLocation") return 0;
          if (key.startsWith("create") || key === "getUniformLocation")
            return { key, args };
          return null;
        };
      },
    },
  );
  return gl;
}
beforeEach(() => {
  document.body.innerHTML = '<div id="host"></div>';
  state.contexts = [];
  state.contextFails = false;
  state.linkFails = false;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    function (this: HTMLCanvasElement) {
      if (state.contextFails) return null;
      const gl = fakeGL();
      gl.canvas = this;
      state.contexts.push(gl);
      return gl;
    } as any,
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const options = () => ({
  isPaused: () => false,
  reduced: () => false,
  onFailure: vi.fn(),
});
const called = (gl: any, name: string) =>
  gl.calls.filter(([key]: [string]) => key === name);

it("creates material directly from GLSL without evaluating Shader Park DSL", () => {
  const evaluate = vi.spyOn(globalThis, "eval").mockImplementation(() => {
    throw new Error("runtime eval must not be used");
  });
  try {
    const mesh = createFluidMesh(coins[0], { value: 68 });
    expect(mesh.material.fragmentShader).toContain("uniform float warp");
    expect(mesh.material.uniforms._scale).toBe(1.5);
    expect(mesh.material.uniforms.mood).toBe(0.68);
    // THREE.SphereGeometry(1.5, 8, 8): 81 vertices, 112 triangles.
    expect(mesh.geometry.position).toHaveLength(81 * 3);
    expect(mesh.geometry.index).toHaveLength(336);
    expect(evaluate).not.toHaveBeenCalled();
  } finally {
    evaluate.mockRestore();
  }
});
it("compiles with the former Three.js WebGL2 prefix and renders the first frame", () => {
  const host = document.querySelector("#host")!;
  mountFluid(host, coins[0], null, options());
  const gl = state.contexts[0],
    [vertex, fragment] = called(gl, "shaderSource").map(
      ([, , src]: any) => src,
    );
  expect(
    vertex.startsWith("#version 300 es\nprecision mediump sampler2DArray;"),
  ).toBe(true);
  expect(fragment).toContain(
    "layout(location = 0) out highp vec4 pc_fragColor;",
  );
  expect(fragment).toContain(
    "precision highp float;\nprecision highp int;\n#define HIGH_PRECISION",
  );
  expect(called(gl, "drawElements")).toEqual([
    ["drawElements", "TRIANGLES", 336, "UNSIGNED_SHORT", 0],
  ]);
  expect(host.querySelector("canvas")?.style.display).toBe("block");
});
it("detects first-frame GPU compile failure, disposes resources and preserves the existing DOM", () => {
  state.linkFails = true;
  const host = document.querySelector("#host")!;
  host.textContent = "placeholder";
  expect(() => mountFluid(host, coins[0], null, options())).toThrow(
    "SHADER_COMPILE",
  );
  expect(called(state.contexts[0], "deleteProgram")).toHaveLength(1);
  expect(host.textContent).toBe("placeholder");
  expect(requestAnimationFrame).not.toHaveBeenCalled();
});
it("releases GPU resources and reports context loss after mounting", () => {
  const host = document.querySelector("#host")!,
    opts = options(),
    stop = mountFluid(host, coins[0], null, opts),
    gl = state.contexts[0],
    canvas = host.querySelector("canvas")!;
  expect(canvas).not.toBeNull();
  canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  expect(opts.onFailure).toHaveBeenCalledWith(
    expect.objectContaining({ code: "WEBGL_LOST" }),
  );
  expect(called(gl, "deleteProgram")).toHaveLength(1);
  expect(cancelAnimationFrame).toHaveBeenCalledOnce();
  expect(host.querySelector("canvas")).toBeNull();
  stop();
  expect(called(gl, "deleteProgram")).toHaveLength(1);
});
it("does not blame module loading failures on device capability", () => {
  expect(
    sculptureFailureMessage(new ReferenceError("input is not defined")),
  ).toContain("加载或初始化失败");
  state.contextFails = true;
  expect(() =>
    mountFluid(document.querySelector("#host")!, coins[0], null, options()),
  ).toThrow("WEBGL_CONTEXT");
});
it("does not allocate a WebGL context for a view removed while importing", () => {
  mountFluid(document.createElement("div"), coins[0], null, options())();
  expect(state.contexts).toHaveLength(0);
});
