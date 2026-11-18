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
 * Verifies canonical SDK errors and credential-safe diagnostic serialization.
 */

import { describe, expect, it } from "vitest";

import {
  getMiaixzSdkErrorMessageKey,
  MiaixzApiError,
  MiaixzSdkError,
  miaixzSdkErrorMessageKeys,
} from "../../src/errors/index.js";
import { miaixzSdkMessages } from "../../src/i18n/index.js";

describe("SDK error protocol", () => {
  it("maps every code to its registered message key and preserves diagnostic identity", () => {
    for (const [code, messageKey] of Object.entries(miaixzSdkErrorMessageKeys)) {
      const error = new MiaixzSdkError({ code });
      expect(error.code).toBe(code);
      expect(error.messageKey).toBe(messageKey);
      expect(error.message).toBe(`[${code}] ${messageKey}`);
      expect(miaixzSdkMessages["en-US"]?.[messageKey]).toBeTypeOf("string");
      expect(miaixzSdkMessages["zh-CN"]?.[messageKey]).toBeTypeOf("string");
    }
  });

  it("shares only the documented crypto-unavailable presentation key", () => {
    const codesByKey = new Map<string, string[]>();
    for (const [code, messageKey] of Object.entries(miaixzSdkErrorMessageKeys)) {
      codesByKey.set(messageKey, [...(codesByKey.get(messageKey) ?? []), code]);
    }
    expect(Object.fromEntries([...codesByKey].filter(([, codes]) => codes.length > 1))).toEqual({
      "sdk.error.crypto": [
        "API_CRYPTO_UNAVAILABLE",
        "BRIDGE_CRYPTO_UNAVAILABLE",
        "EVENT_CRYPTO_UNAVAILABLE",
      ],
    });
  });

  it("uses fixed fallback keys for HTTP and backend business codes", () => {
    expect(getMiaixzSdkErrorMessageKey("HTTP_503")).toBe("sdk.error.http");
    expect(getMiaixzSdkErrorMessageKey("100160")).toBe("sdk.error.api.business");
  });

  it("redacts details and keeps causes content-free", () => {
    const error = new MiaixzSdkError({
      code: "SDK_ERROR",
      details: { authorization: "Bearer secret", nested: { email: "person@example.test" } },
      cause: new Error("private failure"),
    });
    expect(error.details).toEqual({
      authorization: "[REDACTED]",
      nested: { email: "[REDACTED]" },
    });
    expect(error.cause).toEqual({ type: "Error" });
    expect(error.message).not.toContain("secret");
    expect(error.message).not.toContain("private failure");
  });

  it("normalizes and bounds backend text without replacing diagnostic identity", () => {
    const error = new MiaixzApiError({
      code: "HTTP_400",
      status: 400,
      method: "POST",
      url: "https://api.example.test/resource",
      serverMessage: `  invalid\u0000   value ${"x".repeat(600)}  `,
    });
    expect(error.message).toBe("[HTTP_400] sdk.error.http");
    expect(error.serverMessage).toHaveLength(512);
    expect(error.serverMessage?.startsWith("invalid value ")).toBe(true);
    expect(error.details).toBeUndefined();
  });
});
