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
 * Verifies public CSS-module class-map composition without component or application policy.
 */

import { describe, expect, it } from "vitest";

import { mergeStyleModules } from "../../src/index.js";

describe("public class-map composition", () => {
  it("unions keys while preserving input order and duplicate classes", () => {
    const first = Object.freeze({ root: "base", content: "" });
    const second = Object.freeze({ root: "variant", surface: "surface" });
    const third = Object.freeze({ root: "base", content: "content" });
    const result = mergeStyleModules(first, second, third);
    expect(Object.keys(result)).toEqual(["root", "content", "surface"]);
    expect(result).toEqual({ root: "base variant base", content: " content", surface: "surface" });
    expect(mergeStyleModules(second, first).root).toBe("variant base");
    expect(first).toEqual({ root: "base", content: "" });
    expect(second).toEqual({ root: "variant", surface: "surface" });
    expect(third).toEqual({ root: "base", content: "content" });
  });

  it("retains empty strings and their separators without trimming", () => {
    expect(mergeStyleModules({ empty: "" })).toEqual({ empty: "" });
    expect(mergeStyleModules({ empty: "" }, { empty: "" })).toEqual({ empty: " " });
    expect(mergeStyleModules({ root: "" }, {}, { root: "content" }, { root: "" })).toEqual({
      root: " content ",
    });
  });

  it("returns a frozen empty map for empty inputs", () => {
    const result = mergeStyleModules();
    expect(result).toEqual({});
    expect(Object.isFrozen(result)).toBe(true);
    expect(mergeStyleModules({}, {})).toEqual({});
  });

  it("freezes only its owned result without mutating or retaining the input maps", () => {
    const first = { root: "base" };
    const second = { root: "variant", content: "content" };
    const result = mergeStyleModules(first, second);
    expect(result).not.toBe(first);
    expect(result).not.toBe(second);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(first)).toBe(false);
    expect(Object.isFrozen(second)).toBe(false);
    expect(Reflect.set(result, "root", "changed")).toBe(false);
    first.root = "changed base";
    second.content = "changed content";
    expect(result).toEqual({ root: "base variant", content: "content" });
  });
});
