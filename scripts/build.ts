// Copyright 2020-present the denosaurs team. All rights reserved. MIT license.

import { encode } from "https://deno.land/std@0.56.0/encoding/base64.ts";
import Terser from "https://cdn.pika.dev/terser@^4.7.0";

const name = "deno_lz4";

const encoder = new TextEncoder();

async function requires(...executables: string[]) {
  const where = Deno.build.os === "windows" ? "where" : "which";

  for (const executable of executables) {
    const process = Deno.run({
      cmd: [where, executable],
      stderr: "null",
      stdin: "null",
      stdout: "null",
    });

    if (!(await process.status()).success) {
      err(`Could not find required build tool ${executable}`);
    }
  }
}

async function run(msg: string, cmd: string[]) {
  log(msg);

  const process = Deno.run({ cmd });

  if (!(await process.status()).success) {
    err(`${msg} failed`);
  }
}

function log(text: string): void {
  console.log(`[log] ${text}`);
}

function err(text: string): never {
  console.log(`[err] ${text}`);
  return Deno.exit(1);
}

await requires("rustup", "rustc", "cargo", "wasm-pack");

if (!(await Deno.stat("Cargo.toml")).isFile) {
  err(`the build script should be executed in the "${name}" root`);
}

await run(
  "building using wasm-pack",
  ["wasm-pack", "build", "--target", "web", "--release"],
);

const wasm = await Deno.readFile(`pkg/${name}_bg.wasm`);
const encoded = encode(wasm);
log(
  `encoded wasm using base64, size increase: ${encoded.length -
    wasm.length} bytes`,
);

log("inlining wasm in js");
const source =
  `export const source = Uint8Array.from(atob("${encoded}"), c => c.charCodeAt(0));`;

const init = await Deno.readTextFile(`pkg/${name}.js`);

log("minifying js");
const output = Terser.minify(`${source}\n${init}`, {
  mangle: { module: true },
  output: {
    preamble: "//deno-fmt-ignore-file",
  },
});

if (output.error) {
  err(`encountered error when minifying: ${output.error}`);
}

const reduction = new Blob([(`${source}\n${init}`)]).size -
  new Blob([output.code]).size;
log(`minified js, size reduction: ${reduction} bytes`);

log(`writing output to file ("wasm.js")`);
await Deno.writeFile("wasm.js", encoder.encode(output.code));

const outputFile = await Deno.stat("wasm.js");
log(
  `output file ("wasm.js"), final size is: ${outputFile.size} bytes`,
);
