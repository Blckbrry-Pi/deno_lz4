import wasmBuilder from "./wasm/mod.ts";

export type FunctionType = (input: BufferSource) => Uint8Array;
export type LZ4Runtime = { compress: FunctionType; decompress: FunctionType };

export default async (
    _WebAssembly: typeof WebAssembly,
): Promise<LZ4Runtime> => {
    const wasm = await wasmBuilder(_WebAssembly);

    function bufferSourceArrayBuffer(data: BufferSource) {
        if (ArrayBuffer.isView(data)) {
            return data.buffer;
        } else if (data instanceof ArrayBuffer) {
            return data;
        }

        throw new TypeError(
            `Could extract ArrayBuffer from alleged BufferSource type. Got ${data} instead.`,
        );
    }

    /**
     * Transfers an {@link ArrayBufferLike} to wasm, automatically allocating it in memory.
     *
     * Remember to unallocate the transfered buffer with {@link wasm.dealloc}
     */
    function transfer(buffer: BufferSource): [number, number] {
        const length = buffer.byteLength;
        const pointer = wasm.alloc(length);
        new Uint8Array(wasm.memory.buffer, pointer, length).set(
            new Uint8Array(bufferSourceArrayBuffer(buffer)),
        );
        return [pointer, length];
    }

    function callFn(data: BufferSource, fn: "compress" | "decompress") {
        const [dataPtr, dataLen] = transfer(data);

        const outputLocationPtr = wasm.alloc(4);
        const outputLengthPtr = wasm.alloc(4);
        const outputCapacityPtr = wasm.alloc(4);

        wasm[fn](
            dataPtr,
            dataLen,
            outputLocationPtr,
            outputLengthPtr,
            outputCapacityPtr,
        );
        wasm.dealloc(dataPtr, dataLen);

        // Copy output length from wasm memory into js
        const outputLengthBuffer = new ArrayBuffer(4);
        new Uint8Array(outputLengthBuffer).set(
            new Uint8Array(wasm.memory.buffer, outputLengthPtr, 4),
        );
        // Copy output capacity from wasm memory into js
        const outputCapacityBuffer = new ArrayBuffer(4);
        new Uint8Array(outputCapacityBuffer).set(
            new Uint8Array(wasm.memory.buffer, outputCapacityPtr, 4),
        );
        // Copy output location from wasm memory into js
        const outputLocationBuffer = new ArrayBuffer(4);
        new Uint8Array(outputLocationBuffer).set(
            new Uint8Array(wasm.memory.buffer, outputLocationPtr, 4),
        );
        wasm.dealloc(outputLengthPtr, 4);
        wasm.dealloc(outputCapacityPtr, 4);
        wasm.dealloc(outputLocationPtr, 4);

        // WASM uses little-endian
        const outputLength = new DataView(outputLengthBuffer).getUint32(
            0,
            true,
        );
        const outputCapacity = new DataView(outputCapacityBuffer).getUint32(
            0,
            true,
        );
        const outputLocation = new DataView(outputLocationBuffer).getUint32(
            0,
            true,
        );

        // Copy output data from WASM memory into js
        const outputBuffer = new ArrayBuffer(outputLength);
        new Uint8Array(outputBuffer).set(
            new Uint8Array(wasm.memory.buffer, outputLocation, outputLength),
        );
        wasm.deallocVec(outputLocation, outputLength, outputCapacity);

        return new Uint8Array(outputBuffer);
    }

    function compress(
        data: BufferSource,
    ): Uint8Array {
        return callFn(data, "compress");
    }

    function decompress(
        data: BufferSource,
    ): Uint8Array {
        return callFn(data, "decompress");
    }

    return { compress, decompress };
};
