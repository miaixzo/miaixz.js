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
 * Verifies error protocol behavior in the UI package.
 */

import { describe, expect, it, vi } from "vitest";

import { assertMiaixzAccessibleName } from "../../src/accessibility/assert-accessible-name.js";
import {
  MiaixzUiError,
  miaixzUiErrorMessageKeys,
  miaixzUiWarningMessageKeys,
  reportMiaixzUiWarning,
} from "../../src/errors/index.js";
import { miaixzUiMessages } from "../../src/i18n/index.js";

describe("UI error protocol", () => {
  it("maps every error and warning code to registered locale messages", () => {
    for (const key of [
      ...Object.values(miaixzUiErrorMessageKeys),
      ...Object.values(miaixzUiWarningMessageKeys),
    ]) {
      expect(miaixzUiMessages["en-US"]?.[key]).toBeTypeOf("string");
      expect(miaixzUiMessages["zh-CN"]?.[key]).toBeTypeOf("string");
    }
  });

  it("derives the message key from the machine code", () => {
    const error = new MiaixzUiError({ code: "UI_ACCESSIBLE_NAME_INVALID" });
    expect(error.code).toBe("UI_ACCESSIBLE_NAME_INVALID");
    expect(error.messageKey).toBe("ui.error.accessible.nameInvalid");
    expect(error.message).toBe("[UI_ACCESSIBLE_NAME_INVALID] ui.error.accessible.nameInvalid");
  });

  it("bounds and redacts every supported diagnostic value category", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const getter = {};
    Object.defineProperty(getter, "value", { enumerable: true, get: () => "secret" });
    const longArray = Array.from({ length: 105 }, (_, index) => index);
    const longObject = Object.fromEntries(
      Array.from({ length: 105 }, (_, index) => [`field${index}`, index]),
    );
    const deep = { one: { two: { three: { four: { five: { six: { seven: { eight: {} } } } } } } } };
    const cause = new Error("root cause");
    const error = new MiaixzUiError({
      code: "UI_UPLOAD_FILE_STATE_INVALID",
      cause,
      details: {
        access_token: "must disappear",
        nested: { password: "must disappear", safe: "ok" },
        long: "x".repeat(1_030),
        circular,
        getter,
        longArray,
        longObject,
        deep,
        file: new File(["secret"], "private.txt"),
        blob: new Blob(["blob"]),
        buffer: new ArrayBuffer(4),
        typed: new Uint8Array(5),
        form: new FormData(),
        query: new URLSearchParams("token=secret"),
        stream: new ReadableStream(),
        date: new Date(0),
        symbol: Symbol("private"),
        callback: () => "private",
        nil: null,
        absent: undefined,
        truthy: true,
        count: 2,
      },
    });
    const details = error.details as Record<string, unknown>;
    expect(error.cause).toBe(cause);
    expect(details.access_token).toBe("[REDACTED]");
    expect(details.circular).toEqual({ self: "[CIRCULAR]" });
    expect(details.getter).toEqual({ value: "[TRUNCATED]" });
    expect((details.long as string).endsWith("[TRUNCATED]")).toBe(true);
    expect(details.file).toEqual({ type: "File", bytes: 6 });
    expect(details.blob).toEqual({ type: "Blob", bytes: 4 });
    expect(details.buffer).toEqual({ type: "ArrayBuffer", bytes: 4 });
    expect(details.typed).toEqual({ type: "TypedArray", bytes: 5 });
    expect(details.form).toEqual({ type: "FormData" });
    expect(details.query).toEqual({ type: "URLSearchParams", bytes: 12 });
    expect(details.stream).toEqual({ type: "ReadableStream" });
    expect(details.date).toEqual({ type: "Object" });
    expect(details.symbol).toEqual({ type: "symbol" });
    expect(details.callback).toEqual({ type: "function" });
    expect(details.longArray).toHaveLength(100);
    expect((details.longArray as unknown[]).at(-1)).toBe("[TRUNCATED]");
    expect(Object.keys(details.longObject as object)).toHaveLength(100);
    expect(Object.isFrozen(error.details)).toBe(true);
  });

  it("omits non-Error causes and details when neither is usable", () => {
    const error = new MiaixzUiError({
      code: "UI_CONTROLLED_VALUE_INVALID",
      cause: "raw secret",
    });
    expect(error.cause).toBeUndefined();
    expect(error.details).toBeUndefined();
  });

  it("requires exactly one non-blank accessible-name input", () => {
    expect(() => assertMiaixzAccessibleName({ ariaLabel: "Open" })).not.toThrow();
    expect(() => assertMiaixzAccessibleName({ ariaLabelledBy: "dialog-title" })).not.toThrow();
    for (const options of [
      {},
      { ariaLabel: " " },
      { ariaLabelledBy: "\t" },
      { ariaLabel: "Open", ariaLabelledBy: "dialog-title" },
    ]) {
      expect(() => assertMiaixzAccessibleName(options)).toThrowError(
        expect.objectContaining({ code: "UI_ACCESSIBLE_NAME_INVALID" }),
      );
    }
  });

  it("reports warnings only outside production", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    reportMiaixzUiWarning("UI_CONTROLLED_MODE_CHANGED");
    expect(warning).toHaveBeenCalledWith(
      "[UI_CONTROLLED_MODE_CHANGED] ui.warning.controlled.modeChanged",
    );
    warning.mockRestore();
  });
});
