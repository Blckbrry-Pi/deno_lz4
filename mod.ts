import buildWithRuntime, { type LZ4Runtime } from "./mod_runtime_agnostic.ts";
export type * from "./mod_runtime_agnostic.ts";

const nativeRuntime: LZ4Runtime = await buildWithRuntime(WebAssembly);
const compress = nativeRuntime.compress;
const decompress = nativeRuntime.decompress;

export { compress, decompress };
