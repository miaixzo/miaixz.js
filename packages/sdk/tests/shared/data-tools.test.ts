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
 * Verifies public collection, JSON snapshot, and CSV mechanisms using neutral caller data.
 */

import { describe, expect, it, vi } from "vitest";

import {
  cloneMiaixzJsonValue,
  freezeMiaixzJsonValue,
  mergeMiaixzJsonValue,
  resolveCollectionValue,
  serializeMiaixzCsv,
  type MiaixzJsonOptions,
} from "../../src/index.js";

/**
 * Captures an exact thrown value without requiring it to be an Error instance.
 *
 * @param operation - Synchronous operation expected to fail.
 * @returns The original thrown value.
 */
function captureFailure(operation: () => unknown): unknown {
  try {
    operation();
  } catch (error) {
    return error;
  }
  throw new Error("Expected the fixture operation to fail.");
}

/**
 * Checks default diagnostics and caller-owned errors at the same JSON rejection point.
 *
 * @param value - Neutral invalid input.
 * @param path - Contractual path of the rejection.
 * @param expectation - Contractual description of the accepted value.
 */
function expectInvalidJson(value: unknown, path: string, expectation: string): void {
  const failure = captureFailure(() => cloneMiaixzJsonValue(value));
  expect(failure).toBeInstanceOf(TypeError);
  expect(failure).toMatchObject({
    message: `Invalid JSON data at ${path}: expected ${expectation}.`,
  });
  const sentinel = new Error("Caller-owned fixture validation error.");
  const onInvalid = vi.fn((): never => {
    throw sentinel;
  });
  expect(captureFailure(() => cloneMiaixzJsonValue(value, { onInvalid }))).toBe(sentinel);
  expect(onInvalid).toHaveBeenCalledExactlyOnceWith(path, expectation);
}

describe("public collection value resolution", () => {
  it("uses only matching literal values without changing the caller's collection", () => {
    const items = Object.freeze([
      Object.freeze({ value: "compact" }),
      Object.freeze({ value: "standard" }),
      Object.freeze({ value: "compact" }),
    ] as const);
    expect(resolveCollectionValue(items, "compact")).toBe("compact");
    expect(resolveCollectionValue(items, "standard")).toBe("standard");
    expect(items.map(({ value }) => value)).toEqual(["compact", "standard", "compact"]);
  });

  it("rejects unknown values and empty collections instead of supplying a default", () => {
    expect(() => resolveCollectionValue([{ value: "compact" }], "missing")).toThrowError(
      new TypeError('Unknown collection value "missing".'),
    );
    expect(() => resolveCollectionValue([], "")).toThrowError(
      new TypeError('Unknown collection value "".'),
    );
  });
});

describe("public JSON cloning", () => {
  it("preserves null and scalar values, including negative zero", () => {
    for (const value of [null, "", "雪", true, false, 0, -0, 1.5]) {
      expect(cloneMiaixzJsonValue(value)).toBe(value);
    }
  });

  it("copies nested arrays and shared acyclic objects without retaining aliases", () => {
    const shared = { value: 1 };
    const source = { first: shared, second: shared, rows: [{ nested: [true, null] }] };
    const copy = cloneMiaixzJsonValue(source);
    expect(copy).toEqual(source);
    expect(copy).not.toBe(source);
    expect(copy.first).not.toBe(shared);
    expect(copy.second).not.toBe(shared);
    expect(copy.first).not.toBe(copy.second);
    expect(copy.rows).not.toBe(source.rows);
    expect(copy.rows[0]?.nested).not.toBe(source.rows[0]?.nested);
    shared.value = 2;
    expect(copy.first.value).toBe(1);
    copy.second.value = 3;
    expect(shared.value).toBe(2);
    expect(copy.first.value).toBe(1);
  });

  it.each<[unknown, string]>([
    [undefined, "$"],
    [{ missing: undefined }, "$.missing"],
    [[undefined], "$[0]"],
    [{ rows: [0, undefined] }, "$.rows[1]"],
    [1n, "$"],
    [Symbol("synthetic-private-json-marker"), "$"],
    [() => undefined, "$"],
  ])("rejects non-JSON values at their original path: %#", (value, path) => {
    expectInvalidJson(value, path, "a JSON-compatible value");
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "rejects non-finite numbers at nested paths: %s",
    (value) => expectInvalidJson({ rows: [value] }, "$.rows[0]", "a finite JSON number"),
  );

  it("rejects cycles along the active ancestor path", () => {
    const source: Record<string, unknown> = {};
    source.self = source;
    expectInvalidJson(source, "$.self", "an acyclic JSON value");
  });

  it.each([new Date(0), new Map(), new Set(), Object.create({ inherited: true })])(
    "rejects non-plain objects without serializing their values: %j",
    (value) => expectInvalidJson(value, "$", "a plain JSON object"),
  );

  it("converts null-prototype records to owned ordinary records", () => {
    const source: Record<string, unknown> = Object.assign(Object.create(null), { value: [1] });
    const copy = cloneMiaixzJsonValue(source);
    expect(copy).toEqual({ value: [1] });
    expect(Object.getPrototypeOf(copy)).toBe(Object.prototype);
    expect(copy).not.toBe(source);
    expect(copy.value).not.toBe(source.value);
  });

  it("reads enumerable getters once and omits symbol and non-enumerable properties", () => {
    const read = vi.fn(() => ({ value: 1 }));
    const source = Object.defineProperty({}, "visible", { enumerable: true, get: read });
    Object.defineProperty(source, "hidden", { value: undefined, enumerable: false });
    Object.defineProperty(source, Symbol("ignored"), { value: undefined, enumerable: true });
    const copy = cloneMiaixzJsonValue(source);
    expect(copy).toEqual({ visible: { value: 1 } });
    expect(read).toHaveBeenCalledOnce();
    expect(Object.hasOwn(copy, "hidden")).toBe(false);
    expect(Object.getOwnPropertySymbols(copy)).toEqual([]);
  });

  it("propagates getter exceptions without calling the invalid-value adapter", () => {
    const sentinel = new Error("Synthetic getter failure.");
    const source = Object.defineProperty({}, "value", {
      enumerable: true,
      get: () => {
        throw sentinel;
      },
    });
    const onInvalid = vi.fn((): never => {
      throw new Error("Must not replace the getter failure.");
    });
    expect(captureFailure(() => cloneMiaixzJsonValue(source, { onInvalid }))).toBe(sentinel);
    expect(onInvalid).not.toHaveBeenCalled();
  });

  it("keeps sparse holes distinct from explicit undefined array elements", () => {
    const source = new Array<number>(3);
    source[1] = 7;
    Object.defineProperty(source, "extra", { value: "ignored", enumerable: true });
    const copy = cloneMiaixzJsonValue(source);
    expect(copy).toHaveLength(3);
    expect(0 in copy).toBe(false);
    expect(1 in copy).toBe(true);
    expect(2 in copy).toBe(false);
    expect(copy[1]).toBe(7);
    expect(Object.hasOwn(copy, "extra")).toBe(false);
    expectInvalidJson([undefined], "$[0]", "a JSON-compatible value");
  });

  it("copies special own keys without changing the result prototype", () => {
    const source = { ["__proto__"]: { label: "neutral" }, constructor: { prototype: "data" } };
    const copy = cloneMiaixzJsonValue(source);
    expect(Object.getPrototypeOf(copy)).toBe(Object.prototype);
    expect(Object.hasOwn(copy, "__proto__")).toBe(true);
    expect(copy["__proto__"]).toEqual({ label: "neutral" });
    expect(copy["__proto__"]).not.toBe(source["__proto__"]);
    expect(copy.constructor).toEqual({ prototype: "data" });
    expect(Object.hasOwn(Object.prototype, "label")).toBe(false);
  });

  it("still rejects when a JavaScript invalid-value callback returns normally", () => {
    const onInvalid = vi.fn(() => undefined);
    const options: MiaixzJsonOptions = {
      onInvalid: onInvalid as unknown as NonNullable<MiaixzJsonOptions["onInvalid"]>,
    };
    expect(captureFailure(() => cloneMiaixzJsonValue(undefined, options))).toBeInstanceOf(
      TypeError,
    );
    expect(onInvalid).toHaveBeenCalledExactlyOnceWith("$", "a JSON-compatible value");
  });
});

describe("public JSON freezing", () => {
  it("freezes validated snapshots in place and returns the same reference", () => {
    const source = { nested: { value: 1 }, rows: [{ id: "item" }] };
    const result = freezeMiaixzJsonValue(source);
    expect(result).toBe(source);
    for (const node of [source, source.nested, source.rows, source.rows[0]]) {
      expect(Object.isFrozen(node)).toBe(true);
    }
  });

  it("preserves primitive inputs without performing JSON validation", () => {
    for (const value of [undefined, null, "", true, 1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(freezeMiaixzJsonValue(value)).toBe(value);
    }
  });

  it("short-circuits already frozen roots and nested nodes", () => {
    const child = { value: 1 };
    const read = vi.fn(() => child);
    const branch = Object.freeze(
      Object.defineProperty({}, "nested", { enumerable: true, get: read }),
    );
    expect(freezeMiaixzJsonValue(branch)).toBe(branch);
    const source = { branch, ordinary: { value: 2 } };
    expect(freezeMiaixzJsonValue(source)).toBe(source);
    expect(read).not.toHaveBeenCalled();
    expect(Object.isFrozen(child)).toBe(false);
    expect(Object.isFrozen(source.ordinary)).toBe(true);
  });

  it("does not traverse symbol or non-enumerable fields", () => {
    const hidden = { value: 1 };
    const symbolValue = { value: 2 };
    const source = { visible: { value: 3 } };
    Object.defineProperty(source, "hidden", { value: hidden });
    Object.defineProperty(source, Symbol("ignored"), { value: symbolValue });
    freezeMiaixzJsonValue(source);
    expect(Object.isFrozen(source)).toBe(true);
    expect(Object.isFrozen(source.visible)).toBe(true);
    expect(Object.isFrozen(hidden)).toBe(false);
    expect(Object.isFrozen(symbolValue)).toBe(false);
  });

  it("propagates getter exceptions unchanged", () => {
    const sentinel = new Error("Synthetic freeze getter failure.");
    const source = Object.defineProperty({}, "value", {
      enumerable: true,
      get: () => {
        throw sentinel;
      },
    });
    expect(captureFailure(() => freezeMiaixzJsonValue(source))).toBe(sentinel);
  });
});

describe("public JSON merging", () => {
  it("merges plain records and replaces arrays with independent, unfrozen copies", () => {
    const base = { nested: { kept: 1, changed: 1 }, rows: [{ id: "old" }] };
    const patch = { nested: { changed: 2 }, rows: [{ id: "new" }] };
    const result = mergeMiaixzJsonValue(base, patch);
    expect(result).toEqual({ nested: { kept: 1, changed: 2 }, rows: [{ id: "new" }] });
    expect(result).not.toBe(base);
    expect(result).not.toBe(patch);
    expect(Object.isFrozen(result)).toBe(false);
    base.nested.kept = 9;
    patch.nested.changed = 8;
    patch.rows[0]!.id = "changed";
    expect(result).toEqual({ nested: { kept: 1, changed: 2 }, rows: [{ id: "new" }] });
  });

  it("validates only the patch when either side is not a plain record", () => {
    expect(mergeMiaixzJsonValue({ invalid: undefined }, null)).toBeNull();
    expect(mergeMiaixzJsonValue(new Date(0), { value: 1 })).toEqual({ value: 1 });
    expect(mergeMiaixzJsonValue(undefined, [1])).toEqual([1]);
    expect(mergeMiaixzJsonValue({ value: 1 }, false)).toBe(false);
  });

  it("validates a plain base before applying a plain patch, even over replaced fields", () => {
    const sentinel = new Error("Caller-owned merge validation error.");
    const onInvalid = vi.fn((): never => {
      throw sentinel;
    });
    expect(
      captureFailure(() => mergeMiaixzJsonValue({ bad: undefined }, { bad: 1 }, { onInvalid })),
    ).toBe(sentinel);
    expect(onInvalid).toHaveBeenCalledExactlyOnceWith("$.bad", "a JSON-compatible value");
  });

  it.each<[unknown, unknown, string]>([
    [{}, { a: { b: undefined } }, "$.b"],
    [{ a: {} }, { a: { b: undefined } }, "$"],
    [{ rows: [] }, { rows: [undefined] }, "$[0]"],
  ])("restarts each branch clone at its original root path: %j", (base, patch, path) => {
    const sentinel = new Error("Caller-owned branch error.");
    const onInvalid = vi.fn((): never => {
      throw sentinel;
    });
    expect(captureFailure(() => mergeMiaixzJsonValue(base, patch, { onInvalid }))).toBe(sentinel);
    expect(onInvalid).toHaveBeenCalledExactlyOnceWith(path, "a JSON-compatible value");
  });

  it("handles special own keys without reading inherited constructor values", () => {
    const patch = {
      ["__proto__"]: { label: "neutral" },
      constructor: { prototype: "data" },
      prototype: "field",
    };
    const result = mergeMiaixzJsonValue({}, patch);
    expect(result).toEqual(patch);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    if (typeof result !== "object" || result === null) {
      throw new Error("Expected a plain fixture merge result.");
    }
    expect(Object.hasOwn(result, "__proto__")).toBe(true);
    expect(Object.hasOwn(Object.prototype, "label")).toBe(false);
  });

  it("preserves native getter failures and invalid-patch diagnostics", () => {
    const sentinel = new Error("Synthetic merge getter failure.");
    const patch = Object.defineProperty({}, "value", {
      enumerable: true,
      get: () => {
        throw sentinel;
      },
    });
    const onInvalid = vi.fn((): never => {
      throw new Error("Must not replace the getter failure.");
    });
    expect(captureFailure(() => mergeMiaixzJsonValue({}, patch, { onInvalid }))).toBe(sentinel);
    expect(onInvalid).not.toHaveBeenCalled();
    expect(captureFailure(() => mergeMiaixzJsonValue(null, undefined))).toMatchObject({
      name: "TypeError",
      message: "Invalid JSON data at $: expected a JSON-compatible value.",
    });
  });
});

describe("public CSV serialization", () => {
  it("quotes cells and preserves Unicode, whitespace, formula-like text and embedded newlines", () => {
    const rows = [
      ["A", "B"],
      ['a"b', "雪\nΔ"],
      ["", " "],
      ["=1+1", "a,b"],
    ] as const;
    expect(serializeMiaixzCsv(rows, "\n")).toBe('"A","B"\n"a""b","雪\nΔ"\n""," "\n"=1+1","a,b"');
    expect(serializeMiaixzCsv(rows, "\r\n")).toBe(
      '"A","B"\r\n"a""b","雪\nΔ"\r\n""," "\r\n"=1+1","a,b"',
    );
    expect(rows).toEqual([
      ["A", "B"],
      ['a"b', "雪\nΔ"],
      ["", " "],
      ["=1+1", "a,b"],
    ]);
  });

  it("uses ordinary number conversion without adding JSON validation or a final separator", () => {
    expect(serializeMiaixzCsv([[0, -0, 1.5, Number.NaN, Infinity, -Infinity]], "\n")).toBe(
      '"0","0","1.5","NaN","Infinity","-Infinity"',
    );
  });

  it("keeps empty rows and an empty cell distinct", () => {
    expect(serializeMiaixzCsv([], "\n")).toBe("");
    expect(serializeMiaixzCsv([[]], "\n")).toBe("");
    expect(serializeMiaixzCsv([[], []], "\n")).toBe("\n");
    expect(serializeMiaixzCsv([[], []], "\r\n")).toBe("\r\n");
    expect(serializeMiaixzCsv([[""]], "\n")).toBe('""');
  });

  it.each([undefined, null, "", "\r", "unsupported"])(
    "rejects an absent or invalid row separator: %j",
    (lineEnding) => {
      expect(() =>
        serializeMiaixzCsv([["value"]], lineEnding as unknown as "\n" | "\r\n"),
      ).toThrowError(new TypeError("Invalid CSV line ending."));
    },
  );
});
