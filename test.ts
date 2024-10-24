// Copyright 2020-present the denosaurs team. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "jsr:@std/assert@0.221";

import { compress, decompress } from "./mod.ts";
import { compress as compressPolyfill, decompress as decompressPolyfill } from "./mod_polyfill.ts";

function encode(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

Deno.test({
  name: "compress",
  fn: () => {
    // empty
    assertEquals(compress(encode("")), Uint8Array.from([0]));
    assertEquals(compressPolyfill(encode("")), Uint8Array.from([0]));
    // 'X' x64 times
    assertEquals(
      compress(encode("X".repeat(64))),
      Uint8Array.from([31, 88, 1, 0, 44, 0]),
    );
    assertEquals(
      compressPolyfill(encode("X".repeat(64))),
      Uint8Array.from([31, 88, 1, 0, 44, 0]),
    );
  },
});

Deno.test({
  name: "decompress",
  fn: () => {
    // empty
    assertEquals(decompress(Uint8Array.from([0])), Uint8Array.from([]));
    assertEquals(decompressPolyfill(Uint8Array.from([0])), Uint8Array.from([]));
    // 'X' x64 times
    assertEquals(
      decompress(Uint8Array.from([31, 88, 1, 0, 44, 0])),
      encode("X".repeat(64)),
    );
    assertEquals(
      decompressPolyfill(Uint8Array.from([31, 88, 1, 0, 44, 0])),
      encode("X".repeat(64)),
    );

    // errors
    assertThrows(() => decompress(Uint8Array.from([16, 97, 2, 0])));
    assertThrows(() => decompressPolyfill(Uint8Array.from([16, 97, 2, 0])));
    assertThrows(() => decompress(Uint8Array.from([64, 97, 1, 0])));
    assertThrows(() => decompressPolyfill(Uint8Array.from([64, 97, 1, 0])));
    assertThrows(() => decompressPolyfill(Uint8Array.from([64, 97, 1, 0])));
  },
});
