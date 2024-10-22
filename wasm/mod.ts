import { source } from "./wasm.js";

export default async (_WebAssembly: typeof WebAssembly) => {
    const { instance } = await _WebAssembly.instantiate(source, {
        env: {
            panic: (ptr: number, len: number) => {
                const msg = new TextDecoder().decode(
                    new Uint8Array(memory.buffer, ptr, len),
                );
                dealloc(ptr, len);
                throw new Error(msg);
            },
        },
    });

    const memory = instance.exports.memory as typeof _WebAssembly.Memory.prototype;
    const alloc = instance.exports.alloc as (size: number) => number;
    const dealloc = instance.exports.dealloc as (
        ptr: number,
        size: number,
    ) => void;

    const compress = instance.exports.compress as (
        dataPtr: number,
        dataLen: number,

        outputDataPtr: number,
        outputLengthPtr: number,
        outputCapacityPtr: number,
    ) => void;

    const decompress = instance.exports.decompress as (
        dataPtr: number,
        dataLen: number,

        outputDataPtr: number,
        outputLengthPtr: number,
        outputCapacityPtr: number,
    ) => void;

    const deallocVec = instance.exports.dealloc_vec as (
        dataPtr: number,
        length: number,
        capacity: number,
    ) => void;

    return {
        memory,
        alloc,
        dealloc,
        compress,
        decompress,
        deallocVec,
    };
};
