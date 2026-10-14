// Production minification regression, without opening a browser or requiring a GPU.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "vite";
import { sculptureSourceHash } from "./compile-sculpture.mjs";
import { coins } from "../web/fingerprint/data.js";
const shader = JSON.parse(
  readFileSync("web/fingerprint/sculpture-shader.json", "utf8"),
);
assert.equal(
  shader.sourceSha256,
  sculptureSourceHash(),
  "sculpture-source.mjs changed: rerun `pnpm sculpture:compile` (see the script header)",
);
await build({
  logLevel: "error",
  build: {
    outDir: resolve("output/sculpture-regression"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve("web/fingerprint/sculpture.js"),
      preserveEntrySignatures: "strict",
      output: { entryFileNames: "sculpture.mjs" },
    },
  },
});
const original = globalThis.eval;
try {
  globalThis.eval = () => {
    throw new Error(
      "Runtime eval reintroduced into the production fluid module",
    );
  };
  const module = await import(
    pathToFileURL(resolve("output/sculpture-regression/sculpture.mjs"))
  );
  for (const coin of coins) {
    const mesh = module.createFluidMesh(
      { ...coin, amplitude: 4, volume: 1e9 },
      { value: 68 },
    );
    assert.equal(mesh.material.fragmentShader, shader.fragmentShader);
    assert.equal(mesh.material.uniforms.mood, 0.68);
    assert.equal(mesh.material.uniforms._scale, 1.5);
    assert.equal(mesh.geometry.index.length, 336);
  }
} finally {
  globalThis.eval = original;
}
const assets = readdirSync("dist/assets").filter((f) => f.endsWith(".js"));
assert.ok(
  assets.some((f) => f.startsWith("sculpture-")),
  "main production build must include the fluid renderer",
);
for (const file of assets) {
  const js = readFileSync(resolve("dist/assets", file), "utf8");
  assert.ok(
    !js.includes("sculptToGLSL"),
    "Shader Park compiler must not ship to browsers",
  );
  assert.ok(
    !js.includes("createSculpture("),
    "runtime DSL compilation must not ship",
  );
  assert.ok(!js.includes("three.js r"), "Three.js must not ship to browsers");
}
const result = {
  precompiledSource: "hash matches",
  minifiedProductionMaterials: coins.length,
  runtimeEval: "not used",
  browserCompiler: "absent",
  threeJs: "absent",
  gpuRendering: "not visually verified",
};
mkdirSync("output/sculpture-regression", { recursive: true });
writeFileSync(
  "output/sculpture-regression/result.json",
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result));
