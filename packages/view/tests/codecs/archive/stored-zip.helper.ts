/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

/**
 * Creates deterministic classic ZIP fixtures without runtime dependencies.
 */

const encoder = new TextEncoder();

/**
 * Independent lookup table used to checksum test fixture contents.
 */
const fixtureCrcTable = Uint32Array.from({ length: 256 }, (_value, initial) => {
  let value = initial;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value >>> 1) ^ ((value & 1) === 0 ? 0 : 0xedb88320);
  }
  return value >>> 0;
});

/**
 * Calculates fixture CRC-32 without importing the production codec.
 *
 * @param bytes - Uncompressed fixture bytes.
 * @returns Unsigned CRC-32 for the central and local headers.
 */
function fixtureCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = (crc >>> 8) ^ fixtureCrcTable[(crc ^ byte) & 0xff]!;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Encodes raw DEFLATE stored blocks without a platform compression dependency.
 *
 * @param bytes - Uncompressed fixture contents.
 * @returns Deterministic method-eight payload with correctly aligned blocks.
 */
function deflateFixture(bytes: Uint8Array): Uint8Array {
  const blocks = Math.max(1, Math.ceil(bytes.length / 65535));
  const output = new Uint8Array(bytes.length + blocks * 5);
  let sourceOffset = 0;
  let targetOffset = 0;
  for (let block = 0; block < blocks; block += 1) {
    const length = Math.min(65535, bytes.length - sourceOffset);
    output[targetOffset] = block === blocks - 1 ? 1 : 0;
    writeInteger(output, targetOffset + 1, length, 2);
    writeInteger(output, targetOffset + 3, length ^ 0xffff, 2);
    output.set(bytes.subarray(sourceOffset, sourceOffset + length), targetOffset + 5);
    sourceOffset += length;
    targetOffset += length + 5;
  }
  return output;
}

/**
 * Writes a little-endian unsigned integer into a byte array.
 *
 * @param target - Destination byte array.
 * @param offset - Zero-based write position.
 * @param value - Unsigned integer value.
 * @param width - Number of bytes to write.
 */
function writeInteger(target: Uint8Array, offset: number, value: number, width: 2 | 4): void {
  for (let index = 0; index < width; index += 1) {
    target[offset + index] = (value >>> (index * 8)) & 0xff;
  }
}

/**
 * Concatenates byte arrays without retaining input buffers.
 *
 * @param parts - Byte arrays in output order.
 * @returns Combined owned byte array.
 */
function concatenate(parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

/**
 * Builds classic ZIP headers for one deterministic fixture compression method.
 *
 * @param entries - UTF-8 file contents keyed by normalized archive path.
 * @param method - Stored bytes or raw DEFLATE stored blocks.
 * @returns Minimal classic ZIP archive with actual CRC values.
 */
function createFixtureZip(entries: Readonly<Record<string, string>>, method: 0 | 8): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;
  for (const [path, source] of Object.entries(entries)) {
    const name = encoder.encode(path);
    const data = encoder.encode(source);
    const payload = method === 0 ? data : deflateFixture(data);
    const crc = fixtureCrc32(data);
    const local = new Uint8Array(30 + name.length + payload.length);
    writeInteger(local, 0, 0x04034b50, 4);
    writeInteger(local, 4, 20, 2);
    writeInteger(local, 8, method, 2);
    writeInteger(local, 14, crc, 4);
    writeInteger(local, 18, payload.length, 4);
    writeInteger(local, 22, data.length, 4);
    writeInteger(local, 26, name.length, 2);
    local.set(name, 30);
    local.set(payload, 30 + name.length);
    localParts.push(local);

    const central = new Uint8Array(46 + name.length);
    writeInteger(central, 0, 0x02014b50, 4);
    writeInteger(central, 4, 20, 2);
    writeInteger(central, 6, 20, 2);
    writeInteger(central, 10, method, 2);
    writeInteger(central, 16, crc, 4);
    writeInteger(central, 20, payload.length, 4);
    writeInteger(central, 24, data.length, 4);
    writeInteger(central, 28, name.length, 2);
    writeInteger(central, 42, localOffset, 4);
    central.set(name, 46);
    centralParts.push(central);
    localOffset += local.length;
  }
  const central = concatenate(centralParts);
  const end = new Uint8Array(22);
  writeInteger(end, 0, 0x06054b50, 4);
  writeInteger(end, 8, centralParts.length, 2);
  writeInteger(end, 10, centralParts.length, 2);
  writeInteger(end, 12, central.length, 4);
  writeInteger(end, 16, localOffset, 4);
  return concatenate([...localParts, central, end]);
}

/**
 * Creates a deterministic stored ZIP archive suitable for codec tests.
 *
 * @param entries - UTF-8 file contents keyed by normalized archive path.
 * @returns Minimal classic ZIP archive using method zero and actual CRC values.
 */
export function storedZip(entries: Readonly<Record<string, string>>): Uint8Array {
  return createFixtureZip(entries, 0);
}

/**
 * Creates deterministic raw-DEFLATE fixtures for bounded decompression tests.
 *
 * @param entries - UTF-8 file contents keyed by normalized archive path.
 * @returns Minimal classic ZIP archive using method eight and actual CRC values.
 */
export function deflatedZip(entries: Readonly<Record<string, string>>): Uint8Array {
  return createFixtureZip(entries, 8);
}
