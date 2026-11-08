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
 * Verifies bridge envelope validation, origin restrictions, and remote-error contracts.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { MiaixzSdkError } from "../../../src/errors/errors.js";
import {
  bridgeError,
  createEnvelope,
  createMessageId,
  deserializeError,
  getCapabilities,
  getRuntimeWindow,
  hasOnlyKeys,
  isPlainRecord,
  parseEnvelope,
  parseEventType,
  parseMessageCatalog,
  parseNavigation,
  parsePermissions,
  parseBridgeContext,
  parseTargetOrigin,
  parseTargetWindow,
  parseTimeout,
  serializeError,
} from "../../../src/runtime/bridge/post-message-protocol.js";

const messageId = "123e4567-e89b-42d3-a456-426614174000";

/**
 * Defines one neutral caller-owned context used only by these protocol fixtures.
 */
interface FixtureContext {
  readonly label: string;
}

/**
 * Projects and freezes the only field selected by this fixture's caller.
 *
 * @param value - Untrusted caller context.
 * @returns Independently owned neutral context snapshot.
 */
function parseFixtureContext(value: unknown): Readonly<FixtureContext> {
  if (!isPlainRecord(value) || typeof value.label !== "string") {
    throw new TypeError("Invalid fixture context.");
  }
  return Object.freeze({ label: value.label });
}

afterEach(() => vi.unstubAllGlobals());

describe("postMessage protocol primitives", () => {
  it("delegates context validation, projection, and ownership to the caller parser", () => {
    const source = { label: "neutral", privateValue: "synthetic marker" };
    const parser = vi.fn(parseFixtureContext);
    const snapshot = parseBridgeContext(source, parser);
    expect(snapshot).toEqual({ label: "neutral" });
    expect(snapshot).not.toBe(source);
    expect(snapshot).toBe(parser.mock.results[0]?.value);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(parser).toHaveBeenCalledExactlyOnceWith(source);
    for (const value of [null, {}, { label: 1 }]) {
      expect(() => parseBridgeContext(value, parseFixtureContext)).toThrowError(
        expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }),
      );
    }
  });

  it("does not expose context capability without an injected parser", () => {
    expect(() => parseBridgeContext({ label: "neutral" }, undefined)).toThrowError(
      expect.objectContaining({ code: "BRIDGE_CAPABILITY_UNAVAILABLE" }),
    );
  });

  it("normalizes parser exceptions without retaining their private details", () => {
    const parser = () => {
      throw new Error("synthetic private parser failure");
    };
    let failure: unknown;
    try {
      parseBridgeContext({}, parser);
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(MiaixzSdkError);
    expect(failure).toMatchObject({ code: "BRIDGE_MESSAGE_INVALID" });
    expect((failure as MiaixzSdkError).cause).toBeUndefined();
    expect((failure as MiaixzSdkError).details).toBeUndefined();
    expect((failure as MiaixzSdkError).message).not.toContain("synthetic private");
  });

  it("rejects asynchronous parser results instead of awaiting them", async () => {
    for (const result of [
      Promise.resolve({ label: "neutral" }),
      Promise.reject(new Error("synthetic private async failure")),
      { then: (resolve: (value: FixtureContext) => void) => resolve({ label: "neutral" }) },
    ]) {
      const parser = (() => result) as unknown as (value: unknown) => Readonly<FixtureContext>;
      expect(() => parseBridgeContext({}, parser)).toThrowError(
        expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }),
      );
    }
    await Promise.resolve();
  });

  it("accepts only plain records and exact registered fields", () => {
    expect(isPlainRecord({ value: 1 })).toBe(true);
    expect(isPlainRecord(Object.create(null))).toBe(true);
    for (const value of [null, [], new Date(), "record"]) expect(isPlainRecord(value)).toBe(false);
    expect(hasOnlyKeys({ a: 1 }, new Set(["a", "b"]))).toBe(true);
    expect(hasOnlyKeys({ c: 1 }, new Set(["a", "b"]))).toBe(false);
  });

  it("validates runtime windows, exact origins, timeouts, and UUID capability", () => {
    const target = { postMessage: vi.fn() } as unknown as Window;
    expect(parseTargetWindow(target)).toBe(target);
    expect(() => parseTargetWindow(null as unknown as Window)).toThrowError(
      expect.objectContaining({ code: "BRIDGE_CAPABILITY_UNAVAILABLE" }),
    );
    expect(parseTargetOrigin("https://host.example")).toBe("https://host.example");
    for (const origin of [
      "*",
      "null",
      "ftp://host.example",
      "https://user:pass@host.example",
      "https://host.example/path",
      "https://host.example?query=1",
      "https://host.example#hash",
      "not a url",
    ]) {
      expect(() => parseTargetOrigin(origin)).toThrowError(
        expect.objectContaining({ code: "BRIDGE_ORIGIN_INVALID" }),
      );
    }
    expect(parseTimeout(undefined)).toBe(10_000);
    expect(parseTimeout(1_000)).toBe(1_000);
    expect(parseTimeout(60_000)).toBe(60_000);
    for (const timeout of [999, 60_001, 1_000.5, Number.NaN]) {
      expect(() => parseTimeout(timeout)).toThrowError(
        expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }),
      );
    }

    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    expect(getRuntimeWindow()).toBe(globalThis.window);
    vi.stubGlobal("window", undefined);
    expect(() => getRuntimeWindow()).toThrowError(
      expect.objectContaining({ code: "BRIDGE_CAPABILITY_UNAVAILABLE" }),
    );
    expect(createMessageId()).toMatch(/^[0-9a-f-]{36}$/iu);
    vi.stubGlobal("crypto", {});
    expect(() => createMessageId()).toThrowError(
      expect.objectContaining({ code: "BRIDGE_CRYPTO_UNAVAILABLE" }),
    );
  });

  it("creates, validates, freezes, and rejects complete envelopes", () => {
    const envelope = createEnvelope("module-one", "request", "context.get", messageId, {});
    expect(parseEnvelope(envelope)).toEqual(envelope);
    expect(Object.isFrozen(parseEnvelope(envelope))).toBe(true);
    const base = { ...envelope };
    const invalid = [
      null,
      { ...base, extra: true },
      { ...base, channel: "other" },
      { ...base, protocolVersion: "2.0.0" },
      { ...base, messageId: "bad" },
      { ...base, moduleId: "Bad" },
      { ...base, kind: "unknown" },
      { ...base, method: "unknown" },
      { ...base, kind: "request", error: { code: "SDK_ERROR", messageKey: "sdk.error.sdk" } },
      { ...base, kind: "response", error: "bad" },
      { ...base, kind: "response", error: { code: 1, messageKey: "sdk.error.sdk" } },
      { ...base, kind: "response", error: { code: "SDK_ERROR", messageKey: 1 } },
      {
        ...base,
        kind: "response",
        payload: {},
        error: { code: "SDK_ERROR", messageKey: "sdk.error.sdk" },
      },
      {
        ...base,
        kind: "response",
        error: { code: "SDK_ERROR", messageKey: "sdk.error.sdk", details: {} },
      },
    ];
    for (const value of invalid) expect(parseEnvelope(value)).toBeUndefined();
  });

  it("serializes only registered errors and validates the remote key", () => {
    expect(serializeError(new MiaixzSdkError({ code: "BRIDGE_TIMEOUT" }))).toEqual({
      code: "BRIDGE_TIMEOUT",
      messageKey: "sdk.error.bridge.timeout",
    });
    expect(serializeError(new Error("private"))).toEqual({
      code: "BRIDGE_MESSAGE_INVALID",
      messageKey: "sdk.error.bridge.messageInvalid",
    });
    expect(
      deserializeError({ code: "BRIDGE_TIMEOUT", messageKey: "sdk.error.bridge.timeout" }),
    ).toMatchObject({
      code: "BRIDGE_TIMEOUT",
    });
    for (const error of [
      { code: "UNKNOWN", messageKey: "sdk.error.bridge.timeout" },
      { code: "BRIDGE_TIMEOUT", messageKey: "wrong" },
    ]) {
      expect(deserializeError(error)).toMatchObject({ code: "BRIDGE_MESSAGE_INVALID" });
    }
    expect(bridgeError("BRIDGE_DISPOSED")).toMatchObject({ code: "BRIDGE_DISPOSED" });
  });

  it("validates navigation, permissions, catalogs, events, and capabilities", () => {
    const state = { nested: [1] };
    const navigation = parseNavigation({ path: "/settings", replace: true, state });
    expect(navigation).toEqual({ path: "/settings", replace: true, state });
    expect(navigation.state).not.toBe(state);
    expect(parseNavigation({ path: "/home" })).toEqual({ path: "/home" });
    for (const value of [
      null,
      {},
      { path: "relative" },
      { path: "//host" },
      { path: "/bad\\path" },
      { path: "/", replace: "yes" },
      { path: "/", extra: true },
    ]) {
      expect(() => parseNavigation(value)).toThrowError(
        expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }),
      );
    }
    expect(() => parseNavigation({ path: "/", state: () => undefined })).toThrowError(
      expect.objectContaining({ code: "BRIDGE_NAVIGATION_STATE_INVALID" }),
    );
    expect(parsePermissions(["module:document:read"])).toEqual(["module:document:read"]);
    for (const value of ["module:document:read", ["*"], [1]]) {
      expect(() => parsePermissions(value)).toThrowError(
        expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }),
      );
    }
    const catalog = parseMessageCatalog("project", {
      "en-US": { "project.title": "Title" },
    });
    expect(catalog).toEqual({ "en-US": { "project.title": "Title" } });
    expect(Object.isFrozen(catalog["en-US"])).toBe(true);
    for (const value of [
      null,
      { "en-us": {} },
      { "en-US": [] },
      { "en-US": { "other.title": "x" } },
      { "en-US": { "project.title": 1 } },
    ]) {
      expect(() => parseMessageCatalog("project", value)).toThrowError(
        expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }),
      );
    }
    expect(parseEventType("module-one", "module-one:event-one")).toBe("module-one:event-one");
    for (const value of [1, "event", "module-one:event:extra", "other:event", "module-one:Bad"]) {
      expect(() => parseEventType("module-one", value)).toThrowError(
        expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }),
      );
    }
    const adapter = {
      getContext: vi.fn(),
      emit: vi.fn(),
      subscribe: vi.fn(),
      registerMessages: vi.fn(),
      navigate: vi.fn(),
      hasPermissions: vi.fn(),
    };
    const parser = vi.fn(parseFixtureContext);
    expect(getCapabilities(adapter)).toEqual(["events", "i18n", "navigation", "permissions"]);
    expect(getCapabilities(adapter, parser)).toEqual([
      "context",
      "events",
      "i18n",
      "navigation",
      "permissions",
    ]);
    expect(getCapabilities({}, parser)).toEqual([]);
    expect(getCapabilities({ emit: vi.fn() }, parser)).toEqual([]);
    expect(adapter.getContext).not.toHaveBeenCalled();
    expect(parser).not.toHaveBeenCalled();
  });
});
