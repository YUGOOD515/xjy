// Regenerates web/fingerprint/sculpture-shader.json from the Shader Park source.
// shader-park-core is intentionally not a project dependency: the GLSL is committed,
// so builds and browsers never need the compiler. To change the sculpture, run:
//   pnpm add -D shader-park-core@0.2.8 && pnpm sculpture:compile && pnpm remove shader-park-core
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { sculptureSource } from "./sculpture-source.mjs";

export const sculptureSourceHash = () =>
  createHash("sha256").update(sculptureSource).digest("hex");

export async function compileSculpture() {
  let sculptToThreeJSShaderSource;
  try {
    ({ sculptToThreeJSShaderSource } = await import("shader-park-core"));
  } catch {
    throw new Error(
      "shader-park-core is not installed; run `pnpm add -D shader-park-core@0.2.8` temporarily",
    );
  }
  const result = sculptToThreeJSShaderSource(sculptureSource);
  if (result.error || !result.vert || !result.frag)
    throw new Error(
      `Shader Park compilation failed: ${result.error ?? "missing shader output"}`,
    );
  return {
    generator: "shader-park-core@0.2.8",
    sourceSha256: sculptureSourceHash(),
    uniforms: result.uniforms,
    vertexShader: result.vert,
    fragmentShader: result.frag,
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const shader = await compileSculpture();
  writeFileSync(
    new URL("../web/fingerprint/sculpture-shader.json", import.meta.url),
    JSON.stringify(shader) + "\n",
  );
  console.log(
    `Precompiled fluid shader: ${shader.fragmentShader.length} GLSL characters`,
  );
}
