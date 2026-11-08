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
 * Verifies ZIP path safety and central/local metadata agreement.
 */

import { describe, expect, it } from "vitest";
import {
  inspectZipArchive,
  readZipEntry,
  ZipArchiveError,
  type ZipArchiveBudget,
  type ZipArchiveEntry,
  type ZipArchiveErrorReason,
  type ZipArchiveInspectOptions,
  type ZipEntryReadOptions,
} from "../../../src/index.js";
import { ZipArchive } from "../../../src/codecs/archive/zip-codec.js";
import { defaultResourceBudget } from "../../../src/runtime/resource-budget.js";
import { deflatedZip, storedZip } from "./stored-zip.helper.js";

describe("ZipArchive security boundaries", () => {
  it("rejects absolute, traversal, backslash, and drive-qualified paths", () => {
    for (const path of ["/root.txt", "../escape.txt", "a\\b.txt", "C:drive.txt"]) {
      expect(() => new ZipArchive(storedZip({ [path]: "x" }), defaultResourceBudget)).toThrowError(
        expect.objectContaining({ code: "PARSE_FAILED" }),
      );
    }
  });

  it("rejects a local filename which disagrees with the central directory", async () => {
    const bytes = storedZip({ "safe.txt": "content" });
    bytes[30] = "x".charCodeAt(0);
    const archive = new ZipArchive(bytes, defaultResourceBudget);
    await expect(archive.read("safe.txt")).rejects.toMatchObject({ code: "PARSE_FAILED" });
  });

  it("rejects trailing bytes and multi-disk metadata", () => {
    const trailing = storedZip({ "safe.txt": "content" });
    const extended = new Uint8Array(trailing.length + 1);
    extended.set(trailing);
    expect(() => new ZipArchive(extended, defaultResourceBudget)).toThrowError(
      expect.objectContaining({ code: "PARSE_FAILED" }),
    );

    const multiDisk = storedZip({ "safe.txt": "content" });
    const end = multiDisk.length - 22;
    multiDisk[end + 4] = 1;
    expect(() => new ZipArchive(multiDisk, defaultResourceBudget)).toThrowError(
      expect.objectContaining({ code: "PARSE_FAILED" }),
    );
  });

  it("rejects stored entries with inconsistent compressed sizes before copying", async () => {
    const bytes = storedZip({ "safe.txt": "content" });
    const end = bytes.length - 22;
    const directory =
      (bytes[end + 16] ?? 0) |
      ((bytes[end + 17] ?? 0) << 8) |
      ((bytes[end + 18] ?? 0) << 16) |
      ((bytes[end + 19] ?? 0) << 24);
    bytes[directory + 20] = 6;
    const archive = new ZipArchive(bytes, defaultResourceBudget);
    await expect(archive.read("safe.txt")).rejects.toMatchObject({ code: "PARSE_FAILED" });
  });

  it("enforces declared entry and total expansion limits while indexing", () => {
    expect(
      () =>
        new ZipArchive(storedZip({ "large.txt": "1234" }), {
          ...defaultResourceBudget,
          maxArchiveEntryBytes: 3,
        }),
    ).toThrowError(
      expect.objectContaining({
        code: "RESOURCE_LIMIT_EXCEEDED",
        resourceLimit: { field: "maxArchiveEntryBytes", actual: 4, allowed: 3 },
      }),
    );
  });
});

const strictBudget: ZipArchiveBudget = {
  maxSourceBytes: 262_144,
  maxExpandedBytes: 262_144,
  maxArchiveEntryBytes: 131_072,
  maxArchiveEntries: 16,
};
const inspectOptions: ZipArchiveInspectOptions = { budget: strictBudget };
const readOptions: ZipEntryReadOptions = { ...inspectOptions, maxOutputBytes: 131_072 };
const invalidLimits = [
  0,
  -1,
  0.5,
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.MAX_SAFE_INTEGER + 1,
];
type ArchiveMutation = (bytes: Uint8Array, fields: DataView, central: number, end: number) => void;

/**
 * Addresses fields relative to the supplied source view rather than its backing buffer.
 *
 * @param bytes - Complete deterministic fixture view.
 * @returns Little-endian field reader and writer for that view.
 */
function fieldsOf(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

/**
 * Locates a central header before a fixture is mutated.
 *
 * @param bytes - Unmodified helper archive, without an archive comment.
 * @param index - Zero-based directory entry index.
 * @returns View-relative central header offset.
 */
function centralAt(bytes: Uint8Array, index = 0): number {
  const fields = fieldsOf(bytes);
  let offset = fields.getUint32(bytes.length - 6, true);
  for (let current = 0; current < index; current += 1) {
    offset +=
      46 +
      fields.getUint16(offset + 28, true) +
      fields.getUint16(offset + 30, true) +
      fields.getUint16(offset + 32, true);
  }
  return offset;
}

/**
 * Changes only the target constraint in a fresh stored fixture.
 *
 * @param mutate - Explicit malformed header or content change.
 * @param entries - Neutral fixture entries.
 * @returns Independently owned malformed archive.
 */
function changedZip(
  mutate: ArchiveMutation,
  entries: Readonly<Record<string, string>> = { "sample.txt": "content" },
): Uint8Array {
  const bytes = storedZip(entries);
  mutate(bytes, fieldsOf(bytes), centralAt(bytes), bytes.length - 22);
  return bytes;
}

/**
 * Captures synchronous failures without losing primitive cancellation reasons.
 *
 * @param source - Candidate archive bytes.
 * @param options - Explicit limits and optional signal.
 * @returns The original thrown value, or undefined if inspection succeeded.
 */
function inspectionError(source: Uint8Array, options = inspectOptions): unknown {
  try {
    inspectZipArchive(source, options);
    return undefined;
  } catch (error) {
    return error;
  }
}

/**
 * Checks the public runtime error class as well as its neutral reason.
 *
 * @param source - Archive violating one inspection constraint.
 * @param reason - Expected mechanical failure category.
 * @param budget - Caller-owned limits for this case.
 */
function expectInspectionReason(
  source: Uint8Array,
  reason: ZipArchiveErrorReason,
  budget = strictBudget,
): void {
  const error = inspectionError(source, { budget });
  expect(error).toBeInstanceOf(ZipArchiveError);
  expect(error).toMatchObject({ name: "ZipArchiveError", reason });
  expect(error).not.toHaveProperty("path");
}

/**
 * Checks one asynchronous public read without executing the operation twice.
 *
 * @param source - Archive with invalid selected content or limits.
 * @param path - Exact requested entry path.
 * @param reason - Expected mechanical failure category.
 * @param options - Explicit overrides for this read.
 */
async function expectReadReason(
  source: Uint8Array,
  path: string,
  reason: ZipArchiveErrorReason,
  options: Partial<ZipEntryReadOptions> = {},
): Promise<void> {
  const reading = readZipEntry(source, path, { ...readOptions, ...options });
  await expect(reading).rejects.toBeInstanceOf(ZipArchiveError);
  await expect(reading).rejects.toMatchObject({ name: "ZipArchiveError", reason });
}

describe("public strict ZIP inspection", () => {
  it("returns frozen six-field metadata, retains every entry, and accepts an empty archive", () => {
    const source = storedZip({
      "Sample.txt": "123456789",
      "folder/": "",
      "__MACOSX/side.txt": "side",
      ".DS_Store": "metadata",
    });
    const original = source.slice();
    const entries: readonly ZipArchiveEntry[] = inspectZipArchive(source, inspectOptions);
    expect(entries.map((entry) => entry.path)).toEqual([
      "Sample.txt",
      "folder/",
      "__MACOSX/side.txt",
      ".DS_Store",
    ]);
    expect(entries[0]).toEqual({
      path: "Sample.txt",
      size: 9,
      method: 0,
      compressed: 9,
      offset: 40,
      crc: 0xcbf43926,
    });
    expect(Object.isFrozen(entries)).toBe(true);
    for (const entry of entries) {
      expect(Object.keys(entry).sort()).toEqual([
        "compressed",
        "crc",
        "method",
        "offset",
        "path",
        "size",
      ]);
      expect(Object.isFrozen(entry)).toBe(true);
    }
    expect(source).toEqual(original);
    const empty = inspectZipArchive(storedZip({}), inspectOptions);
    expect(empty).toEqual([]);
    expect(Object.isFrozen(empty)).toBe(true);
  });

  it("rejects short or oversized sources and missing or non-terminal directories", () => {
    expectInspectionReason(new Uint8Array(21), "source-invalid");
    const source = storedZip({ "sample.txt": "x" });
    expectInspectionReason(source, "source-invalid", {
      ...strictBudget,
      maxSourceBytes: source.length - 1,
    });
    expectInspectionReason(new Uint8Array(22), "directory-missing");
    const trailing = new Uint8Array(source.length + 1);
    trailing.set(source);
    expectInspectionReason(trailing, "directory-missing");
  });

  it.each([
    { name: "archive disk", base: "end", offset: 4, width: 2, value: 1 },
    { name: "directory disk", base: "end", offset: 6, width: 2, value: 1 },
    { name: "unequal disk count", base: "end", offset: 8, width: 2, value: 2 },
    { name: "ZIP64 directory size", base: "end", offset: 12, width: 4, value: 0xffffffff },
    { name: "ZIP64 directory offset", base: "end", offset: 16, width: 4, value: 0xffffffff },
    { name: "entry disk", base: "central", offset: 34, width: 2, value: 1 },
    { name: "ZIP64 compressed size", base: "central", offset: 20, width: 4, value: 0xffffffff },
    { name: "ZIP64 expanded size", base: "central", offset: 24, width: 4, value: 0xffffffff },
    { name: "ZIP64 local offset", base: "central", offset: 42, width: 4, value: 0xffffffff },
  ] as const)("rejects unsupported $name independently", ({ base, offset, width, value }) => {
    const source = changedZip((_bytes, fields, central, end) => {
      const target = (base === "end" ? end : central) + offset;
      if (width === 2) fields.setUint16(target, value, true);
      else fields.setUint32(target, value, true);
    });
    expectInspectionReason(source, "unsupported-layout");
  });

  it("rejects ZIP64 entry counts, directory extents, and caller entry-count overflow", () => {
    expectInspectionReason(
      changedZip((_bytes, fields, _central, end) => {
        fields.setUint16(end + 8, 0xffff, true);
        fields.setUint16(end + 10, 0xffff, true);
      }),
      "unsupported-layout",
    );
    expectInspectionReason(
      changedZip((_bytes, fields, _central, end) => {
        fields.setUint32(end + 12, fields.getUint32(end + 12, true) - 1, true);
      }),
      "directory-invalid",
    );
    expectInspectionReason(storedZip({ "one.txt": "1", "two.txt": "2" }), "directory-invalid", {
      ...strictBudget,
      maxArchiveEntries: 1,
    });
  });

  it("checks fixed central headers before reading any variable-length fields", () => {
    expectInspectionReason(
      changedZip((_bytes, fields, central) => fields.setUint32(central, 0, true)),
      "central-header-invalid",
    );
    expectInspectionReason(
      changedZip((_bytes, fields, _central, end) => {
        fields.setUint16(end + 8, 2, true);
        fields.setUint16(end + 10, 2, true);
      }),
      "central-header-invalid",
    );
  });

  it.each([28, 30, 32])("bounds the central variable field at offset %s", (offset) => {
    expectInspectionReason(
      changedZip((_bytes, fields, central) => fields.setUint16(central + offset, 0xffff, true)),
      "entry-offset-invalid",
    );
  });

  it("bounds the complete local fixed header before decoding an unsafe central path", () => {
    const source = changedZip((bytes, fields, central) => {
      fields.setUint32(central + 42, central - 29, true);
      bytes[central + 46] = "/".charCodeAt(0);
    });
    expectInspectionReason(source, "entry-offset-invalid");
  });

  it.each([
    "",
    "/root.txt",
    "../file.txt",
    "a/./file.txt",
    "a/../file.txt",
    "a\\b.txt",
    "C:file.txt",
    "a:b.txt",
    "a\u001fb.txt",
  ])("rejects the unsafe portable path %j", (path) =>
    expectInspectionReason(storedZip({ [path]: "x" }), "path-invalid"),
  );

  it.each([
    { name: "encryption", offset: 8, value: 1 },
    { name: "compression method", offset: 10, value: 99 },
  ])("rejects unsupported $name before checking the local header", ({ offset, value }) => {
    expectInspectionReason(
      changedZip((_bytes, fields, central) => fields.setUint16(central + offset, value, true)),
      "unsupported-entry",
    );
  });

  it("rejects symbolic links and both case-folded and exact duplicate paths", () => {
    expectInspectionReason(
      changedZip((_bytes, fields, central) => fields.setUint32(central + 38, 0xa0000000, true)),
      "symlink",
    );
    expectInspectionReason(storedZip({ "A.txt": "1", "a.txt": "2" }), "duplicate-path");
    const duplicate = changedZip(
      (bytes, fields) => {
        const second = centralAt(bytes, 1);
        const local = fields.getUint32(second + 42, true);
        bytes[second + 46] = "a".charCodeAt(0);
        bytes[local + 30] = "a".charCodeAt(0);
      },
      { "a.txt": "1", "b.txt": "2" },
    );
    expectInspectionReason(duplicate, "duplicate-path");
  });

  it("enforces per-entry and accumulated declarations during synchronous inspection", () => {
    expectInspectionReason(storedZip({ "sample.txt": "1234" }), "expanded-limit", {
      ...strictBudget,
      maxArchiveEntryBytes: 3,
    });
    expectInspectionReason(storedZip({ "one.txt": "12", "two.txt": "34" }), "expanded-limit", {
      ...strictBudget,
      maxArchiveEntryBytes: 2,
      maxExpandedBytes: 3,
    });
  });

  it.each(["folder/", "__MACOSX/item.txt", ".DS_Store"])(
    "validates declarations and unsupported metadata on retained entry %s",
    async (path) => {
      const entries = { "sample.txt": "ok", [path]: "1234" };
      expectInspectionReason(storedZip(entries), "expanded-limit", {
        ...strictBudget,
        maxArchiveEntryBytes: 3,
      });
      const source = changedZip((bytes, fields) => {
        fields.setUint16(centralAt(bytes, 1) + 10, 99, true);
      }, entries);
      expectInspectionReason(source, "unsupported-entry");
      await expectReadReason(source, "sample.txt", "unsupported-entry");
    },
  );

  it.each([
    { name: "signature", offset: 0, width: 4, value: 0 },
    { name: "compression", offset: 8, width: 2, value: 8 },
    { name: "complete flags", offset: 6, width: 2, value: 2 },
  ] as const)("checks local $name agreement while indexing", ({ offset, width, value }) => {
    expectInspectionReason(
      changedZip((_bytes, fields) => {
        if (width === 4) fields.setUint32(offset, value, true);
        else fields.setUint16(offset, value, true);
      }),
      "local-header-mismatch",
    );
  });

  it.each([26, 28])("bounds the local variable field at offset %s", (offset) => {
    expectInspectionReason(
      changedZip((_bytes, fields) => fields.setUint16(offset, 0xffff, true)),
      "entry-content-invalid",
    );
  });

  it("checks compressed content ranges and exact local names without reading content", () => {
    expectInspectionReason(
      changedZip((_bytes, fields, central) => fields.setUint32(central + 20, central, true)),
      "entry-content-invalid",
    );
    expectInspectionReason(
      changedZip((bytes) => {
        bytes[30] = "x".charCodeAt(0);
      }),
      "entry-content-invalid",
    );
    expectInspectionReason(
      changedZip(
        (_bytes, fields, _central, end) => {
          fields.setUint16(end + 8, 1, true);
          fields.setUint16(end + 10, 1, true);
        },
        { "one.txt": "1", "two.txt": "2" },
      ),
      "directory-length-mismatch",
    );
  });

  it.each([0, 0x0800])("decodes ASCII and non-ASCII UTF-8 with flags=%s", async (flags) => {
    for (const path of ["sample.txt", "样例.txt"]) {
      const source = changedZip(
        (_bytes, fields, central) => {
          fields.setUint16(6, flags, true);
          fields.setUint16(central + 8, flags, true);
        },
        { [path]: "value" },
      );
      expect(inspectZipArchive(source, inspectOptions)[0]?.path).toBe(path);
      expect(new TextDecoder().decode(await readZipEntry(source, path, readOptions))).toBe("value");
    }
  });

  it.each(["central", "local"] as const)(
    "preserves native fatal UTF-8 failures in the %s name",
    async (location) => {
      const source = changedZip((bytes, _fields, central) => {
        bytes[location === "central" ? central + 46 : 30] = 0xff;
      });
      const error = inspectionError(source);
      expect(error).toBeInstanceOf(TypeError);
      expect(error).not.toBeInstanceOf(ZipArchiveError);
      expect(error).not.toHaveProperty("code", "PARSE_FAILED");
      const reading = readZipEntry(source, "sample.txt", readOptions);
      await expect(reading).rejects.toBeInstanceOf(TypeError);
      await expect(reading).rejects.not.toBeInstanceOf(ZipArchiveError);
    },
  );

  it("accepts safe long paths without inheriting preview path-length or depth limits", async () => {
    for (const path of ["a".repeat(5000), `${"x/".repeat(257)}sample.txt`]) {
      const source = storedZip({ [path]: "x" });
      expect(inspectZipArchive(source, inspectOptions)[0]?.path).toBe(path);
      expect(Array.from(await readZipEntry(source, path, readOptions))).toEqual([120]);
      expect(() => new ZipArchive(source, defaultResourceBudget)).toThrowError(
        expect.objectContaining({ code: "PARSE_FAILED" }),
      );
    }
  });

  it.each(
    (
      ["maxSourceBytes", "maxExpandedBytes", "maxArchiveEntryBytes", "maxArchiveEntries"] as const
    ).flatMap((field) => invalidLimits.map((value) => ({ field, value }))),
  )("rejects invalid budget $field=$value before source parsing", ({ field, value }) => {
    const error = inspectionError(new Uint8Array(0), {
      budget: { ...strictBudget, [field]: value },
    });
    expect(error).toBeInstanceOf(TypeError);
    expect(error).not.toBeInstanceOf(ZipArchiveError);
  });
});

describe("public strict ZIP reads", () => {
  it.each([
    { name: "stored", create: storedZip, method: 0 },
    { name: "raw DEFLATE", create: deflatedZip, method: 8 },
  ])(
    "reads real $name bytes, including a literal independent CRC vector",
    async ({ create, method }) => {
      const source = create({ "sample.txt": "123456789", "empty.txt": "" });
      expect(inspectZipArchive(source, inspectOptions)[0]).toMatchObject({
        method,
        crc: 0xcbf43926,
        size: 9,
      });
      const original = source.slice();
      const output = await readZipEntry(source, "sample.txt", readOptions);
      expect(ArrayBuffer.isView(output)).toBe(true);
      expect(Object.prototype.toString.call(output)).toBe("[object Uint8Array]");
      expect(Array.from(output)).toEqual([49, 50, 51, 52, 53, 54, 55, 56, 57]);
      output[0] = 0;
      expect(source).toEqual(original);
      expect(await readZipEntry(source, "empty.txt", readOptions)).toEqual(new Uint8Array(0));
    },
  );

  it("reads real raw-DEFLATE data across fixture blocks", async () => {
    const text = "part-".repeat(14_000);
    const source = deflatedZip({ "sample.txt": text });
    expect(Array.from(await readZipEntry(source, "sample.txt", readOptions))).toEqual(
      Array.from(new TextEncoder().encode(text)),
    );
  });

  it("respects subarray boundaries and returns view-relative content offsets", async () => {
    const archive = storedZip({ "sample.txt": "content" });
    const backing = new Uint8Array(archive.length + 19).fill(0xff);
    backing.set(archive, 7);
    const source = backing.subarray(7, 7 + archive.length);
    expect(source.byteOffset).not.toBe(0);
    expect(inspectZipArchive(source, inspectOptions)[0]?.offset).toBe(40);
    expect(new TextDecoder().decode(await readZipEntry(source, "sample.txt", readOptions))).toBe(
      "content",
    );
  });

  it("selects an exact path and re-inspects the current source on every read", async () => {
    const source = storedZip({ "Sample.txt": "content" });
    expect(inspectZipArchive(source, inspectOptions)[0]?.path).toBe("Sample.txt");
    await expectReadReason(source, "sample.txt", "entry-content-invalid");
    await expectReadReason(source, "missing.txt", "entry-content-invalid");
    const central = centralAt(source);
    source[30] = "X".charCodeAt(0);
    source[central + 46] = "X".charCodeAt(0);
    await expectReadReason(source, "Sample.txt", "entry-content-invalid");
    expect(new TextDecoder().decode(await readZipEntry(source, "Xample.txt", readOptions))).toBe(
      "content",
    );
  });

  it("checks CRC only for the selected content while validating every entry's structure", async () => {
    const source = storedZip({ "sample.txt": "valid", "other.txt": "broken" });
    const fields = fieldsOf(source);
    const second = centralAt(source, 1);
    const local = fields.getUint32(second + 42, true);
    const payload = local + 30 + fields.getUint16(local + 26, true);
    source[payload] = 0;
    expect(inspectZipArchive(source, inspectOptions)).toHaveLength(2);
    expect(new TextDecoder().decode(await readZipEntry(source, "sample.txt", readOptions))).toBe(
      "valid",
    );
    await expectReadReason(source, "other.txt", "integrity-mismatch");
  });

  it.each([
    {
      name: "changed payload",
      mutate: (bytes: Uint8Array) => {
        bytes[40] = 0;
      },
    },
    {
      name: "changed central CRC",
      mutate: (_bytes: Uint8Array, fields: DataView, central: number) => {
        fields.setUint32(central + 16, 0, true);
      },
    },
    {
      name: "stored length disagreement",
      mutate: (_bytes: Uint8Array, fields: DataView, central: number) => {
        fields.setUint32(central + 20, 6, true);
      },
    },
  ])("rejects $name only when reading the selected entry", async ({ mutate }) => {
    const source = changedZip(mutate);
    expect(inspectZipArchive(source, inspectOptions)).toHaveLength(1);
    await expectReadReason(source, "sample.txt", "integrity-mismatch");
  });

  it.each([
    { name: "stored", create: storedZip },
    { name: "raw DEFLATE", create: deflatedZip },
  ])("enforces the single-read limit before extracting $name", async ({ create }) => {
    await expectReadReason(create({ "sample.txt": "content" }), "sample.txt", "output-limit", {
      maxOutputBytes: 6,
    });
  });

  it("checks the read limit before a stored size-integrity failure", async () => {
    const source = changedZip((_bytes, fields, central) => fields.setUint32(central + 20, 6, true));
    await expectReadReason(source, "sample.txt", "output-limit", { maxOutputBytes: 6 });
  });

  it("distinguishes actual DEFLATE output beyond a smaller declaration from insufficient final output", async () => {
    const excessive = deflatedZip({ "sample.txt": "content" });
    fieldsOf(excessive).setUint32(centralAt(excessive) + 24, 6, true);
    expect(inspectZipArchive(excessive, inspectOptions)[0]?.size).toBe(6);
    await expectReadReason(excessive, "sample.txt", "output-limit", { maxOutputBytes: 7 });

    const insufficient = deflatedZip({ "sample.txt": "content" });
    fieldsOf(insufficient).setUint32(centralAt(insufficient) + 24, 8, true);
    expect(inspectZipArchive(insufficient, inspectOptions)[0]?.size).toBe(8);
    await expectReadReason(insufficient, "sample.txt", "integrity-mismatch", { maxOutputBytes: 8 });
  });

  it("propagates a native broken raw-DEFLATE failure without format-error wrapping", async () => {
    const source = deflatedZip({ "sample.txt": "content" });
    const payload = 30 + fieldsOf(source).getUint16(26, true);
    source[payload] = 0x07;
    expect(inspectZipArchive(source, inspectOptions)).toHaveLength(1);
    const reading = readZipEntry(source, "sample.txt", readOptions);
    await expect(reading).rejects.not.toBeInstanceOf(ZipArchiveError);
    await expect(reading).rejects.not.toHaveProperty("code", "PARSE_FAILED");
  });

  it.each(invalidLimits)(
    "rejects invalid maxOutputBytes=%s before inspection",
    async (maxOutputBytes) => {
      await expect(
        readZipEntry(new Uint8Array(0), "sample.txt", { ...readOptions, maxOutputBytes }),
      ).rejects.toBeInstanceOf(TypeError);
    },
  );

  it("keeps invalid configuration ahead of cancellation and archive parsing", async () => {
    const controller = new AbortController();
    controller.abort({ kind: "caller-stop" });
    const options = { budget: { ...strictBudget, maxSourceBytes: 0 }, signal: controller.signal };
    expect(inspectionError(new Uint8Array(0), options)).toBeInstanceOf(TypeError);
    await expect(
      readZipEntry(new Uint8Array(0), "sample.txt", { ...options, maxOutputBytes: 1 }),
    ).rejects.toBeInstanceOf(TypeError);
    await expect(
      readZipEntry(new Uint8Array(0), "sample.txt", {
        ...readOptions,
        signal: controller.signal,
        maxOutputBytes: 0,
      }),
    ).rejects.toBeInstanceOf(TypeError);
  });
});

describe("strict ZIP cancellation and preview policy isolation", () => {
  it.each([
    { name: "object", reason: { kind: "caller-stop" } },
    { name: "null", reason: null },
    { name: "zero", reason: 0 },
  ])("preserves pre-aborted $name reasons synchronously and asynchronously", async ({ reason }) => {
    const controller = new AbortController();
    controller.abort(reason);
    const source = storedZip({ "sample.txt": "content" });
    expect(inspectionError(source, { ...inspectOptions, signal: controller.signal })).toBe(reason);
    await expect(
      readZipEntry(source, "sample.txt", { ...readOptions, signal: controller.signal }),
    ).rejects.toBe(reason);
  });

  it.each([
    { name: "object", reason: { kind: "reading-stop" } },
    { name: "null", reason: null },
    { name: "zero", reason: 0 },
  ])("preserves $name cancellation during a real DEFLATE read", async ({ reason }) => {
    const controller = new AbortController();
    const reading = readZipEntry(deflatedZip({ "sample.txt": "content" }), "sample.txt", {
      ...readOptions,
      signal: controller.signal,
    });
    const rejected = expect(reading).rejects.toBe(reason);
    controller.abort(reason);
    await rejected;
  });

  it("keeps zero-CRC tolerance in the old preview while strict reads require the real CRC", async () => {
    const source = changedZip((_bytes, fields, central) => {
      fields.setUint32(14, 0, true);
      fields.setUint32(central + 16, 0, true);
    });
    expect(
      new TextDecoder().decode(
        await new ZipArchive(source, defaultResourceBudget).read("sample.txt"),
      ),
    ).toBe("content");
    expect(inspectZipArchive(source, inspectOptions)[0]?.crc).toBe(0);
    await expectReadReason(source, "sample.txt", "integrity-mismatch");
  });

  it("keeps the old preview's legacy name decoding separate from strict UTF-8", async () => {
    const source = changedZip(
      (bytes, _fields, central) => {
        bytes[30] = 0xe9;
        bytes[central + 46] = 0xe9;
      },
      { "a.txt": "content" },
    );
    expect(
      new TextDecoder().decode(await new ZipArchive(source, defaultResourceBudget).read("é.txt")),
    ).toBe("content");
    const error = inspectionError(source);
    expect(error).toBeInstanceOf(TypeError);
    expect(error).not.toBeInstanceOf(ZipArchiveError);
  });
});
