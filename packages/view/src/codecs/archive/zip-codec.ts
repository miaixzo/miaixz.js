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
 * Provides the bounded ZIP archive codec and entry decompression.
 */

import type { ResourceBudget } from "../../shared/contracts/resource-budget.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";
import { decompressBounded } from "../../runtime/decompress-bounded.js";
import { ResourceBudgetGuard } from "../../runtime/resource-budget-guard.js";
import { ByteReader } from "../binary/byte-codec.js";

/**
 * Describes one central-directory entry.
 */
export interface ZipEntry {
  readonly path: string;
  readonly compressedSize: number;
  readonly uncompressedSize: number;
  readonly compressionMethod: number;
  readonly localHeaderOffset: number;
  readonly directory: boolean;
  readonly encrypted: boolean;
}

const decoder = new TextDecoder();
const utf8PathDecoder = new TextDecoder("utf-8", { fatal: true });
const legacyPathDecoder = new TextDecoder("windows-1252", { fatal: true });
const encoder = new TextEncoder();

/**
 * Avoids false positives from small, highly repetitive Office metadata while total and per-entry
 * expansion limits continue to bound every archive.
 */
const compressionRatioMinimumBytes = 16 * 1024 * 1024;

/**
 * Locates the classic ZIP end-of-central-directory record.
 *
 * @param bytes - Complete ZIP source bytes.
 * @returns Byte offset of the end-of-central-directory signature.
 */
function findEndOfCentralDirectory(bytes: Uint8Array): number {
  const minimum = Math.max(0, bytes.length - 65_557);
  for (let offset = bytes.length - 22; offset >= minimum; offset -= 1) {
    if (
      bytes[offset] === 0x50 &&
      bytes[offset + 1] === 0x4b &&
      bytes[offset + 2] === 0x05 &&
      bytes[offset + 3] === 0x06
    ) {
      const commentLength = (bytes[offset + 20] ?? 0) | ((bytes[offset + 21] ?? 0) << 8);
      if (offset + 22 + commentLength === bytes.length) return offset;
    }
  }
  throw new ViewerError("PARSE_FAILED", "parse");
}

/**
 * Configures one bounded archive instance.
 */
export interface ZipArchiveOptions {
  readonly budget: ResourceBudget;
  readonly depth?: number;
  readonly guard: ResourceBudgetGuard;
  readonly signal: AbortSignal;
}

interface IndexedZipEntry {
  readonly entry: ZipEntry;
  readonly flags: number;
}

/**
 * Decodes a central-directory name as strict UTF-8.
 *
 * @param bytes - Raw name bytes.
 * @param utf8 - Whether the ZIP UTF-8 general-purpose flag is set.
 * @returns Decoded path.
 */
function decodePath(bytes: Uint8Array, utf8: boolean): string {
  try {
    return (utf8 ? utf8PathDecoder : legacyPathDecoder).decode(bytes);
  } catch {
    throw new ViewerError("PARSE_FAILED", "parse");
  }
}

/**
 * Rejects paths which could escape a virtual archive root or exhaust path processing.
 *
 * @param path - Decoded central-directory path.
 */
function assertSafePath(path: string): void {
  const segments = path.split("/");
  if (
    path.length === 0 ||
    path.includes("\0") ||
    path.includes("\\") ||
    path.startsWith("/") ||
    /^[A-Za-z]:/u.test(path) ||
    segments.includes("..") ||
    segments.length > 256 ||
    encoder.encode(path).byteLength > 4096
  ) {
    throw new ViewerError("PARSE_FAILED", "parse");
  }
}

/**
 * Parses and safely reads a classic ZIP archive without third-party runtime code.
 */
export class ZipArchive {
  readonly entries: readonly ZipEntry[];
  readonly #reader: ByteReader;
  readonly #budget: ResourceBudget;
  readonly #guard: ResourceBudgetGuard;
  readonly #signal: AbortSignal;
  readonly #indexedEntries = new Map<string, IndexedZipEntry>();

  /**
   * Parses the central directory and enforces entry-count limits.
   *
   * @param bytes - Complete ZIP source bytes.
   * @param options - Security limits and session accounting applied to the archive.
   */
  constructor(bytes: Uint8Array, options: ZipArchiveOptions | ResourceBudget) {
    const resolvedOptions: ZipArchiveOptions =
      "budget" in options
        ? options
        : {
            budget: options,
            guard: new ResourceBudgetGuard(options),
            signal: new AbortController().signal,
          };
    const { budget, guard, signal } = resolvedOptions;
    this.#reader = new ByteReader(bytes);
    this.#budget = budget;
    this.#guard = guard;
    this.#signal = signal;
    guard.assertDepth(resolvedOptions.depth ?? 0, "maxArchiveDepth");
    guard.checkpoint(signal);
    const end = findEndOfCentralDirectory(bytes);
    const disk = this.#reader.uint16(end + 4);
    const directoryDisk = this.#reader.uint16(end + 6);
    const diskEntryCount = this.#reader.uint16(end + 8);
    const entryCount = this.#reader.uint16(end + 10);
    const directorySize = this.#reader.uint32(end + 12);
    const directoryOffset = this.#reader.uint32(end + 16);
    if (
      disk !== 0 ||
      directoryDisk !== 0 ||
      diskEntryCount !== entryCount ||
      entryCount === 0xffff ||
      directorySize === 0xffffffff ||
      directoryOffset === 0xffffffff
    ) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    if (entryCount > budget.maxArchiveEntries) {
      throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "parse");
    }
    if (directoryOffset + directorySize !== end) throw new ViewerError("PARSE_FAILED", "parse");
    const entries: ZipEntry[] = [];
    let totalExpandedBytes = 0;
    let offset = directoryOffset;
    for (let index = 0; index < entryCount; index += 1) {
      if ((index & 0xff) === 0) guard.checkpoint(signal);
      if (this.#reader.uint32(offset) !== 0x02014b50) {
        throw new ViewerError("PARSE_FAILED", "parse");
      }
      const flags = this.#reader.uint16(offset + 8);
      const compressionMethod = this.#reader.uint16(offset + 10);
      const compressedSize = this.#reader.uint32(offset + 20);
      const uncompressedSize = this.#reader.uint32(offset + 24);
      const nameLength = this.#reader.uint16(offset + 28);
      const extraLength = this.#reader.uint16(offset + 30);
      const commentLength = this.#reader.uint16(offset + 32);
      const localHeaderOffset = this.#reader.uint32(offset + 42);
      const path = decodePath(this.#reader.slice(offset + 46, nameLength), (flags & 0x0800) !== 0);
      assertSafePath(path);
      if (this.#indexedEntries.has(path)) throw new ViewerError("PARSE_FAILED", "parse");
      const entry: ZipEntry = {
        path,
        compressedSize,
        uncompressedSize,
        compressionMethod,
        localHeaderOffset,
        directory: path.endsWith("/"),
        encrypted: (flags & 1) !== 0,
      };
      entries.push(entry);
      this.#indexedEntries.set(path, { entry, flags });
      totalExpandedBytes += uncompressedSize;
      guard.assertLimit("maxExpandedBytes", totalExpandedBytes);
      if (!entry.directory) guard.assertLimit("maxArchiveEntryBytes", uncompressedSize);
      if (
        compressedSize > 0 &&
        uncompressedSize > compressionRatioMinimumBytes &&
        uncompressedSize / compressedSize > budget.maxCompressionRatio
      ) {
        throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "parse", false, [], {
          field: "maxCompressionRatio",
          actual: Math.ceil(uncompressedSize / compressedSize),
          allowed: budget.maxCompressionRatio,
        });
      }
      offset += 46 + nameLength + extraLength + commentLength;
      if (!Number.isSafeInteger(offset) || offset > directoryOffset + directorySize) {
        throw new ViewerError("PARSE_FAILED", "parse");
      }
    }
    if (offset !== directoryOffset + directorySize) throw new ViewerError("PARSE_FAILED", "parse");
    this.entries = entries;
  }

  /**
   * Reads and decompresses one entry subject to source and expansion limits.
   *
   * @param path - Exact normalized path of the archive entry.
   * @returns Uncompressed entry bytes.
   */
  async read(path: string): Promise<Uint8Array> {
    this.#guard.checkpoint(this.#signal);
    const indexed = this.#indexedEntries.get(path);
    const entry = indexed?.entry;
    if (entry === undefined || indexed === undefined || entry.directory || entry.encrypted) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    this.#guard.assertLimit("maxArchiveEntryBytes", entry.uncompressedSize);
    const offset = entry.localHeaderOffset;
    if (this.#reader.uint32(offset) !== 0x04034b50) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    const localFlags = this.#reader.uint16(offset + 6);
    const localMethod = this.#reader.uint16(offset + 8);
    const localCompressedSize = this.#reader.uint32(offset + 18);
    const localUncompressedSize = this.#reader.uint32(offset + 22);
    const nameLength = this.#reader.uint16(offset + 26);
    const extraLength = this.#reader.uint16(offset + 28);
    const localPath = decodePath(
      this.#reader.slice(offset + 30, nameLength),
      (indexed.flags & 0x0800) !== 0,
    );
    const usesDataDescriptor = (indexed.flags & 0x08) !== 0;
    if (
      localPath !== entry.path ||
      localMethod !== entry.compressionMethod ||
      (localFlags & 0x0809) !== (indexed.flags & 0x0809) ||
      (!usesDataDescriptor &&
        (localCompressedSize !== entry.compressedSize ||
          localUncompressedSize !== entry.uncompressedSize))
    ) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    if (
      (entry.compressionMethod !== 0 && entry.compressionMethod !== 8) ||
      (entry.compressionMethod === 0 && entry.compressedSize !== entry.uncompressedSize)
    ) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    const compressed = this.#reader.slice(
      offset + 30 + nameLength + extraLength,
      entry.compressedSize,
    );
    let result: Uint8Array;
    if (entry.compressionMethod === 0) {
      result = compressed.slice();
      this.#guard.consumeExpandedBytes(result.byteLength);
    } else {
      result = await decompressBounded(compressed, {
        budget: this.#budget,
        format: "deflate-raw",
        guard: this.#guard,
        maxOutputBytes: Math.min(this.#budget.maxArchiveEntryBytes, entry.uncompressedSize),
        signal: this.#signal,
      });
    }
    if (
      result.length !== entry.uncompressedSize ||
      result.length > this.#budget.maxArchiveEntryBytes
    ) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    return result;
  }

  /**
   * Decodes one UTF-8 XML or text entry.
   *
   * @param path - Exact normalized path of the archive entry.
   * @returns UTF-8 text decoded from the requested entry.
   */
  async text(path: string): Promise<string> {
    let text: string;
    try {
      text = decoder.decode(await this.read(path));
    } catch (error) {
      if (error instanceof ViewerError) throw error;
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    this.#guard.consumeTextCharacters(text.length);
    return text;
  }
}

/**
 * Defines caller-owned limits for strict classic ZIP inspection and reading.
 *
 * @public
 */
export type ZipArchiveBudget = Readonly<
  Pick<
    ResourceBudget,
    "maxSourceBytes" | "maxExpandedBytes" | "maxArchiveEntryBytes" | "maxArchiveEntries"
  >
>;

/**
 * Configures strict ZIP inspection without viewer-specific policies.
 *
 * @public
 */
export interface ZipArchiveInspectOptions {
  /**
   * Positive safe integer limits supplied by the caller.
   */
  readonly budget: ZipArchiveBudget;

  /**
   * Optional cancellation whose original reason is propagated unchanged.
   */
  readonly signal?: AbortSignal;
}

/**
 * Adds the maximum permitted output size for one strict entry read.
 *
 * @public
 */
export interface ZipEntryReadOptions extends ZipArchiveInspectOptions {
  /**
   * Positive safe integer limit for the selected entry's expanded bytes.
   */
  readonly maxOutputBytes: number;
}

/**
 * Describes one validated classic ZIP entry using source-view-relative offsets.
 *
 * @public
 */
export interface ZipArchiveEntry {
  /**
   * Exact UTF-8 path, including a trailing slash for a directory entry.
   */
  readonly path: string;

  /**
   * Declared uncompressed byte count.
   */
  readonly size: number;

  /**
   * Stored or raw-DEFLATE compression method.
   */
  readonly method: 0 | 8;

  /**
   * Declared compressed byte count.
   */
  readonly compressed: number;

  /**
   * Entry content offset relative to the supplied Uint8Array view.
   */
  readonly offset: number;

  /**
   * Unsigned CRC-32 declared by the central directory.
   */
  readonly crc: number;
}

/**
 * Identifies a structural, resource, or integrity failure in the strict ZIP API.
 *
 * @public
 */
export type ZipArchiveErrorReason =
  | "source-invalid"
  | "directory-missing"
  | "unsupported-layout"
  | "directory-invalid"
  | "central-header-invalid"
  | "entry-offset-invalid"
  | "path-invalid"
  | "unsupported-entry"
  | "symlink"
  | "duplicate-path"
  | "expanded-limit"
  | "local-header-mismatch"
  | "entry-content-invalid"
  | "directory-length-mismatch"
  | "output-limit"
  | "integrity-mismatch";

/**
 * Reports a strict ZIP failure without retaining archive paths or content.
 *
 * @public
 */
export class ZipArchiveError extends Error {
  /**
   * Stable, presentation-neutral reason for the rejected archive operation.
   */
  readonly reason: ZipArchiveErrorReason;

  /**
   * Creates a ZIP error containing only its neutral reason.
   *
   * @param reason - Structural, resource, or integrity failure category.
   */
  constructor(reason: ZipArchiveErrorReason) {
    super(`Invalid ZIP archive: ${reason}.`);
    this.name = "ZipArchiveError";
    this.reason = reason;
  }
}

/**
 * Rejects invalid configuration without substituting a viewer default.
 *
 * @param value - Caller-supplied resource limit.
 */
function assertStrictZipLimit(value: number): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError("ZIP limits must be positive safe integers.");
  }
}

/**
 * Validates exactly the four limits used by the strict ZIP API.
 *
 * @param budget - Caller-owned archive limits.
 */
function assertStrictZipBudget(budget: ZipArchiveBudget): void {
  if (budget === null || typeof budget !== "object") {
    throw new TypeError("A ZIP archive budget is required.");
  }
  assertStrictZipLimit(budget.maxSourceBytes);
  assertStrictZipLimit(budget.maxExpandedBytes);
  assertStrictZipLimit(budget.maxArchiveEntryBytes);
  assertStrictZipLimit(budget.maxArchiveEntries);
}

/**
 * Checks a range before invoking the viewer's bounded byte reader.
 *
 * @param offset - View-relative byte offset.
 * @param length - Number of bytes required.
 * @param boundary - Exclusive end of the permitted region.
 * @param reason - Strict ZIP category for an invalid range.
 */
function assertStrictZipRange(
  offset: number,
  length: number,
  boundary: number,
  reason: ZipArchiveErrorReason,
): void {
  if (
    !Number.isSafeInteger(offset) ||
    !Number.isSafeInteger(length) ||
    offset < 0 ||
    length < 0 ||
    !Number.isSafeInteger(offset + length) ||
    offset + length > boundary
  ) {
    throw new ZipArchiveError(reason);
  }
}

/**
 * Rejects unsafe portable paths without imposing viewer path-length policies.
 *
 * @param path - Strictly decoded UTF-8 archive path.
 */
function assertStrictZipPath(path: string): void {
  if (
    !path ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes(":") ||
    [...path].some((character) => character.charCodeAt(0) < 32) ||
    path.split("/").some((part) => part === ".." || part === ".")
  ) {
    throw new ZipArchiveError("path-invalid");
  }
}

/**
 * Inspects every entry of a classic ZIP archive synchronously without extracting it.
 *
 * Paths are decoded as fatal UTF-8 regardless of the UTF-8 flag. Directory entries
 * are retained and inspected with the same structural and resource checks as files.
 * No entry content is decompressed or checked against its CRC during inspection.
 *
 * @param source - Complete archive bytes, including only the supplied view's range.
 * @param options - Explicit archive limits and optional cancellation signal.
 * @returns Frozen entry metadata and a frozen array, including an empty valid directory.
 * @throws TypeError When a configured resource limit is invalid or UTF-8 decoding fails.
 * @throws ZipArchiveError When an archive structure or declared limit is invalid.
 * @public
 */
export function inspectZipArchive(
  source: Uint8Array,
  options: ZipArchiveInspectOptions,
): readonly ZipArchiveEntry[] {
  assertStrictZipBudget(options.budget);
  options.signal?.throwIfAborted();
  if (
    !(source instanceof Uint8Array) ||
    source.byteLength < 22 ||
    source.byteLength > options.budget.maxSourceBytes
  ) {
    throw new ZipArchiveError("source-invalid");
  }

  const reader = new ByteReader(source);
  let end: number;
  try {
    end = findEndOfCentralDirectory(source);
  } catch (error) {
    if (error instanceof ViewerError) throw new ZipArchiveError("directory-missing");
    throw error;
  }
  assertStrictZipRange(end, 22, source.byteLength, "directory-invalid");
  const count = reader.uint16(end + 10);
  const start = reader.uint32(end + 16);
  const directorySize = reader.uint32(end + 12);
  if (
    reader.uint16(end + 4) !== 0 ||
    reader.uint16(end + 6) !== 0 ||
    reader.uint16(end + 8) !== count ||
    count === 0xffff ||
    start === 0xffffffff ||
    directorySize === 0xffffffff
  ) {
    throw new ZipArchiveError("unsupported-layout");
  }
  if (count > options.budget.maxArchiveEntries || start + directorySize !== end) {
    throw new ZipArchiveError("directory-invalid");
  }

  const entries: ZipArchiveEntry[] = [];
  const paths = new Set<string>();
  const pathDecoder = new TextDecoder("utf-8", { fatal: true });
  let cursor = start;
  let total = 0;
  for (let index = 0; index < count; index += 1) {
    options.signal?.throwIfAborted();
    assertStrictZipRange(cursor, 46, end, "central-header-invalid");
    if (reader.uint32(cursor) !== 0x02014b50) {
      throw new ZipArchiveError("central-header-invalid");
    }
    const flags = reader.uint16(cursor + 8);
    const method = reader.uint16(cursor + 10);
    const compressed = reader.uint32(cursor + 20);
    const size = reader.uint32(cursor + 24);
    const length = reader.uint16(cursor + 28);
    const extra = reader.uint16(cursor + 30);
    const comment = reader.uint16(cursor + 32);
    const localOffset = reader.uint32(cursor + 42);
    if (
      reader.uint16(cursor + 34) !== 0 ||
      compressed === 0xffffffff ||
      size === 0xffffffff ||
      localOffset === 0xffffffff
    ) {
      throw new ZipArchiveError("unsupported-layout");
    }
    const next = cursor + 46 + length + extra + comment;
    assertStrictZipRange(cursor, next - cursor, end, "entry-offset-invalid");
    assertStrictZipRange(localOffset, 30, start, "entry-offset-invalid");
    const path = pathDecoder.decode(reader.slice(cursor + 46, length));
    assertStrictZipPath(path);
    if ((flags & 1) !== 0 || (method !== 0 && method !== 8)) {
      throw new ZipArchiveError("unsupported-entry");
    }
    if (((reader.uint32(cursor + 38) >>> 16) & 0xf000) === 0xa000) {
      throw new ZipArchiveError("symlink");
    }
    const foldedPath = path.toLowerCase();
    if (paths.has(foldedPath)) throw new ZipArchiveError("duplicate-path");
    paths.add(foldedPath);
    total += size;
    if (
      !Number.isSafeInteger(total) ||
      total > options.budget.maxExpandedBytes ||
      size > options.budget.maxArchiveEntryBytes
    ) {
      throw new ZipArchiveError("expanded-limit");
    }
    if (
      reader.uint32(localOffset) !== 0x04034b50 ||
      reader.uint16(localOffset + 8) !== method ||
      reader.uint16(localOffset + 6) !== flags
    ) {
      throw new ZipArchiveError("local-header-mismatch");
    }
    const localNameLength = reader.uint16(localOffset + 26);
    const localExtraLength = reader.uint16(localOffset + 28);
    const contentStart = localOffset + 30 + localNameLength + localExtraLength;
    assertStrictZipRange(
      localOffset + 30,
      localNameLength + localExtraLength,
      start,
      "entry-content-invalid",
    );
    assertStrictZipRange(contentStart, compressed, start, "entry-content-invalid");
    if (pathDecoder.decode(reader.slice(localOffset + 30, localNameLength)) !== path) {
      throw new ZipArchiveError("entry-content-invalid");
    }
    entries.push(
      Object.freeze({
        path,
        size,
        method,
        compressed,
        offset: contentStart,
        crc: reader.uint32(cursor + 16),
      }),
    );
    cursor = next;
  }
  if (cursor !== end) throw new ZipArchiveError("directory-length-mismatch");
  options.signal?.throwIfAborted();
  return Object.freeze(entries);
}

/**
 * Calculates the unsigned CRC-32 of one selected entry's bytes.
 *
 * @param bytes - Expanded entry bytes.
 * @returns Unsigned CRC-32 checksum.
 */
function strictZipCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) !== 0 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Reads native raw-DEFLATE output with a byte limit and exact cancellation reasons.
 *
 * @param compressed - Owned compressed bytes copied before asynchronous reading.
 * @param maxBytes - Maximum allowed expanded bytes for this entry.
 * @param signal - Optional cancellation signal.
 * @returns Complete bounded uncompressed bytes.
 */
async function readStrictZipDeflate(
  compressed: Uint8Array,
  maxBytes: number,
  signal: AbortSignal | undefined,
): Promise<Uint8Array> {
  signal?.throwIfAborted();
  const reader = new Blob([Uint8Array.from(compressed).buffer])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"))
    .getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let rejectAbort: ((reason: unknown) => void) | undefined;
  const aborted =
    signal === undefined
      ? undefined
      : new Promise<never>((_resolve, reject) => {
          rejectAbort = reject;
        });
  /**
   * Rejects the pending read without replacing the caller's cancellation reason.
   */
  const abort = (): void => {
    if (signal === undefined) return;
    rejectAbort?.(signal.reason);
    void reader.cancel(signal.reason).catch(() => undefined);
  };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    signal?.throwIfAborted();
    while (true) {
      const result = await (aborted === undefined
        ? reader.read()
        : Promise.race([reader.read(), aborted]));
      signal?.throwIfAborted();
      if (result.done) break;
      total += result.value.byteLength;
      if (!Number.isSafeInteger(total) || total > maxBytes) {
        throw new ZipArchiveError("output-limit");
      }
      chunks.push(result.value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return bytes;
  } catch (error) {
    void reader.cancel(error).catch(() => undefined);
    throw error;
  } finally {
    signal?.removeEventListener("abort", abort);
    try {
      reader.releaseLock();
    } catch {
      /**
       * Cancellation may still be completing; cleanup cannot replace the failure.
       */
    }
  }
}

/**
 * Re-inspects an archive and reads one exact entry under explicit output limits.
 *
 * The selected compressed range is copied before asynchronous decompression.
 * Stored-size mismatches and final length or CRC failures are integrity errors;
 * raw-DEFLATE output exceeding its declared size or read limit is an output error.
 * Native decoding, decompression, and cancellation failures propagate unchanged.
 *
 * @param source - Complete archive bytes restricted to the supplied Uint8Array view.
 * @param path - Exact entry path selected from the freshly inspected directory.
 * @param options - Archive limits, selected-entry output limit, and optional signal.
 * @returns Independent expanded bytes whose actual size and CRC match the directory.
 * @throws TypeError When a resource limit is invalid or UTF-8 path decoding fails.
 * @throws ZipArchiveError When archive inspection, output limits, or integrity checks fail.
 * @public
 */
export async function readZipEntry(
  source: Uint8Array,
  path: string,
  options: ZipEntryReadOptions,
): Promise<Uint8Array> {
  assertStrictZipLimit(options.maxOutputBytes);
  const entry = inspectZipArchive(source, options).find((candidate) => candidate.path === path);
  if (entry === undefined) throw new ZipArchiveError("entry-content-invalid");
  if (entry.size > options.maxOutputBytes) throw new ZipArchiveError("output-limit");
  if (entry.method === 0 && entry.compressed !== entry.size) {
    throw new ZipArchiveError("integrity-mismatch");
  }
  options.signal?.throwIfAborted();
  const compressed = Uint8Array.from(
    source.subarray(entry.offset, entry.offset + entry.compressed),
  );
  const bytes =
    entry.method === 0
      ? compressed
      : await readStrictZipDeflate(
          compressed,
          Math.min(options.maxOutputBytes, entry.size),
          options.signal,
        );
  options.signal?.throwIfAborted();
  if (bytes.byteLength !== entry.size || strictZipCrc32(bytes) !== entry.crc) {
    throw new ZipArchiveError("integrity-mismatch");
  }
  return bytes;
}
