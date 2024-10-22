import buildWithRuntime, { type LZ4Runtime } from "./mod_runtime_agnostic.ts";
export type * from "./mod_runtime_agnostic.ts";
import { WebAssembly } from "@blckbrry/polywasm";

const polyfillRuntime: LZ4Runtime = await buildWithRuntime(WebAssembly as unknown as typeof globalThis.WebAssembly);
const compress = polyfillRuntime.compress;
const decompress = polyfillRuntime.decompress;

export { compress, decompress };
