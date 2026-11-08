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
 * Verifies bounded postMessage Host work, payloads, catalogs, and adapter timeouts.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { VERSION } from "../../../src/version.js";
import {
  defaultPostMessageHostLimits,
  hardPostMessageHostLimits,
  resolvePostMessageHostLimits,
} from "../../../src/runtime/bridge/bridge-limits.js";
import { assertBridgePayloadWithinLimits } from "../../../src/runtime/bridge/payload-budget.js";
import { createMiaixzPostMessageHost } from "../../../src/runtime/bridge/post-message-bridge.js";
import {
  isPlainRecord,
  parseMessageCatalog,
  parsePermissions,
} from "../../../src/runtime/bridge/post-message-protocol.js";
import type { MiaixzBridgeEnvelope } from "../../../src/runtime/contracts/post-message.js";

const origin = "https://module.example";
const manifest = {
  protocolVersion: VERSION,
  id: "module-one",
  version: "1.2.3",
  hostVersion: "^1.0.0",
  kind: "iframe",
  basePath: "/module-one",
  entry: `${origin}/entry.js`,
  routes: [],
  navigation: [],
  requiredPermissions: [],
  requiredCapabilities: ["context"],
} as const;

/**
 * Defines the neutral field selected by this fixture's caller.
 */
interface FixtureContext {
  readonly label: string;
}

/**
 * Validates and copies the full label without changing its payload budget.
 *
 * @param value - Untrusted provider value.
 * @returns Caller-selected immutable context.
 */
function parseFixtureContext(value: unknown): Readonly<FixtureContext> {
  if (!isPlainRecord(value) || typeof value.label !== "string") {
    throw new TypeError("Invalid fixture context.");
  }
  return Object.freeze({ label: value.label });
}

class HostTestWindow {
  readonly listeners = new Set<(event: MessageEvent) => void>();
  readonly posted: MiaixzBridgeEnvelope[] = [];

  /**
   * Registers a synthetic window event listener.
   *
   * @param type - Event type to register.
   * @param listener - Listener receiving synthetic events.
   */
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (type === "message") this.listeners.add(listener as (event: MessageEvent) => void);
  }

  /**
   * Removes a synthetic window event listener.
   *
   * @param type - Event type to remove.
   * @param listener - Previously registered listener.
   */
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (type === "message") this.listeners.delete(listener as (event: MessageEvent) => void);
  }

  /**
   * Records an envelope posted by the Host bridge.
   *
   * @param data - Envelope emitted by the bridge.
   */
  postMessage = (data: MiaixzBridgeEnvelope): void => {
    this.posted.push(data);
  };

  /**
   * Delivers a synthetic message event to every registered listener.
   *
   * @param data - Envelope delivered to the bridge.
   */
  dispatch(data: MiaixzBridgeEnvelope): void {
    const event = {
      data,
      origin,
      source: this as unknown as Window,
    } as MessageEvent;
    for (const listener of [...this.listeners]) listener(event);
  }
}

/**
 * Creates one valid Child-to-Host request envelope.
 *
 * @param messageId - Correlation identifier.
 * @param method - Requested bridge method.
 * @param payload - Optional request payload.
 * @returns Versioned request envelope.
 */
function request(messageId: string, method: string, payload?: unknown): MiaixzBridgeEnvelope {
  return {
    channel: "miaixz.bridge",
    protocolVersion: VERSION,
    messageId,
    moduleId: "module-one",
    kind: "request",
    method,
    ...(payload === undefined ? {} : { payload }),
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("postMessage Host security limits", () => {
  it("resolves safe defaults and rejects invalid or excessive overrides", () => {
    expect(resolvePostMessageHostLimits()).toEqual(defaultPostMessageHostLimits);
    expect(resolvePostMessageHostLimits({ maxInFlightRequests: 1 }).maxInFlightRequests).toBe(1);
    for (const maxInFlightRequests of [0, 1.5, hardPostMessageHostLimits.maxInFlightRequests + 1]) {
      expect(() => resolvePostMessageHostLimits({ maxInFlightRequests })).toThrowError(
        expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }),
      );
    }
  });

  it("bounds arbitrary structured-clone graphs without invoking getters", () => {
    const limits = resolvePostMessageHostLimits({
      maxPayloadBytes: 32,
      maxPayloadDepth: 2,
      maxPayloadNodes: 8,
    });
    expect(() =>
      assertBridgePayloadWithinLimits(new Map([["a", new Date(0)]]), limits),
    ).not.toThrow();
    expect(() => assertBridgePayloadWithinLimits("x".repeat(33), limits)).toThrowError(
      expect.objectContaining({ code: "BRIDGE_RESOURCE_LIMIT_EXCEEDED" }),
    );
    expect(() => assertBridgePayloadWithinLimits({ a: { b: { c: 1 } } }, limits)).toThrowError(
      expect.objectContaining({ code: "BRIDGE_RESOURCE_LIMIT_EXCEEDED" }),
    );
    expect(() =>
      assertBridgePayloadWithinLimits(
        new Map(Array.from({ length: 5 }, (_, index) => [index, index])),
        limits,
      ),
    ).toThrowError(expect.objectContaining({ code: "BRIDGE_RESOURCE_LIMIT_EXCEEDED" }));
    const getter = {};
    Object.defineProperty(getter, "secret", { enumerable: true, get: () => "private" });
    expect(() => assertBridgePayloadWithinLimits(getter, limits)).toThrowError(
      expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }),
    );

    const cyclic = Object.create(null) as Record<string, unknown>;
    cyclic.self = cyclic;
    for (const value of [
      new ArrayBuffer(4),
      new Uint8Array(4),
      new Blob(["data"]),
      new Date(0),
      /module/u,
      new Set(["a"]),
      cyclic,
    ]) {
      expect(() => assertBridgePayloadWithinLimits(value, limits)).not.toThrow();
    }
    expect(() => assertBridgePayloadWithinLimits(new URL(origin), limits)).toThrowError(
      expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }),
    );
    const inaccessible = new Proxy(
      {},
      {
        /**
         * Simulates a value whose own properties cannot be inspected.
         *
         * @returns This trap never returns.
         */
        ownKeys(): never {
          throw new Error("inaccessible");
        },
      },
    );
    expect(() => assertBridgePayloadWithinLimits(inaccessible, limits)).toThrowError(
      expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }),
    );
  });

  it("limits catalogs while copying and validating them in one pass", () => {
    const limits = resolvePostMessageHostLimits({
      maxCatalogLocales: 1,
      maxCatalogMessagesPerLocale: 1,
      maxCatalogStringLength: 24,
    });
    expect(parseMessageCatalog("module-one", { "en-US": { "module-one.a": "A" } }, limits)).toEqual(
      { "en-US": { "module-one.a": "A" } },
    );
    expect(() =>
      parseMessageCatalog(
        "module-one",
        { "en-US": { "module-one.a": "A", "module-one.b": "B" } },
        limits,
      ),
    ).toThrowError(expect.objectContaining({ code: "BRIDGE_RESOURCE_LIMIT_EXCEEDED" }));

    expect(() =>
      parseMessageCatalog(
        "module-one",
        { "en-US": { "module-one.a": "A" }, fr: { "module-one.a": "A" } },
        limits,
      ),
    ).toThrowError(expect.objectContaining({ code: "BRIDGE_RESOURCE_LIMIT_EXCEEDED" }));
    expect(() => parseMessageCatalog("module-one", { en_us: {} }, limits)).toThrowError(
      expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }),
    );
    expect(() => parseMessageCatalog("module-one", { "en-US": [] }, limits)).toThrowError(
      expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }),
    );
    expect(() =>
      parseMessageCatalog("module-one", { "en-US": { "other.a": "A" } }, limits),
    ).toThrowError(expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }));
    expect(() =>
      parseMessageCatalog("module-one", { "en-US": { "module-one.a": "A".repeat(25) } }, limits),
    ).toThrowError(expect.objectContaining({ code: "BRIDGE_RESOURCE_LIMIT_EXCEEDED" }));

    const catalogWithGetter = {};
    Object.defineProperty(catalogWithGetter, "en-US", {
      enumerable: true,
      get: () => ({ "module-one.a": "A" }),
    });
    expect(() => parseMessageCatalog("module-one", catalogWithGetter, limits)).toThrowError(
      expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }),
    );
    const messagesWithGetter = {};
    Object.defineProperty(messagesWithGetter, "module-one.a", {
      enumerable: true,
      get: () => "A",
    });
    expect(() =>
      parseMessageCatalog("module-one", { "en-US": messagesWithGetter }, limits),
    ).toThrowError(expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }));

    const byteLimited = resolvePostMessageHostLimits({ maxPayloadBytes: 1 });
    expect(() => parsePermissions(["module:document:read"], byteLimited)).toThrowError(
      expect.objectContaining({ code: "BRIDGE_RESOURCE_LIMIT_EXCEEDED" }),
    );
    expect(() =>
      parseMessageCatalog("module-one", { "en-US": { "module-one.a": "A" } }, byteLimited),
    ).toThrowError(expect.objectContaining({ code: "BRIDGE_RESOURCE_LIMIT_EXCEEDED" }));
  });

  it("keeps timed-out adapter work in its slot until the task actually settles", async () => {
    vi.useFakeTimers();
    const runtime = new HostTestWindow();
    vi.stubGlobal("window", runtime);
    let resolveContext!: (value: FixtureContext) => void;
    const context = new Promise<FixtureContext>((resolve) => {
      resolveContext = resolve;
    });
    const host = createMiaixzPostMessageHost<FixtureContext>({
      manifest,
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      adapter: { getContext: () => context },
      parseContext: parseFixtureContext,
      timeoutMs: 1_000,
      limits: { maxInFlightRequests: 1, requestTimeoutMilliseconds: 25 },
    });
    runtime.dispatch(
      request("11111111-1111-4111-8111-111111111111", "bridge.handshake", {
        moduleId: "module-one",
        moduleVersion: "1.2.3",
        protocolVersion: VERSION,
      }),
    );
    await host.ready;

    runtime.dispatch(request("22222222-2222-4222-8222-222222222222", "context.get"));
    runtime.dispatch(request("33333333-3333-4333-8333-333333333333", "context.get"));
    expect(runtime.posted.at(-1)?.error?.code).toBe("BRIDGE_RESOURCE_LIMIT_EXCEEDED");
    await vi.advanceTimersByTimeAsync(25);
    expect(
      runtime.posted.filter(
        (entry) =>
          entry.messageId === "22222222-2222-4222-8222-222222222222" &&
          entry.error?.code === "BRIDGE_TIMEOUT",
      ),
    ).toHaveLength(1);
    runtime.dispatch(request("44444444-4444-4444-8444-444444444444", "context.get"));
    expect(runtime.posted.at(-1)?.error?.code).toBe("BRIDGE_RESOURCE_LIMIT_EXCEEDED");

    resolveContext({ label: "neutral" });
    await vi.advanceTimersByTimeAsync(0);
    expect(
      runtime.posted.filter((entry) => entry.messageId === "22222222-2222-4222-8222-222222222222"),
    ).toEqual([
      expect.objectContaining({ error: expect.objectContaining({ code: "BRIDGE_TIMEOUT" }) }),
    ]);
    runtime.dispatch(request("55555555-5555-4555-8555-555555555555", "context.get"));
    await vi.advanceTimersByTimeAsync(0);
    expect(runtime.posted.at(-1)).toMatchObject({
      messageId: "55555555-5555-4555-8555-555555555555",
      payload: { label: "neutral" },
    });
    host.dispose();
  });

  it("rejects an oversized adapter response before posting it", async () => {
    const runtime = new HostTestWindow();
    vi.stubGlobal("window", runtime);
    const host = createMiaixzPostMessageHost<FixtureContext>({
      manifest,
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      adapter: { getContext: async () => ({ label: "x".repeat(100) }) },
      parseContext: parseFixtureContext,
      timeoutMs: 1_000,
      limits: { maxPayloadBytes: 64 },
    });
    runtime.dispatch(
      request("11111111-1111-4111-8111-111111111111", "bridge.handshake", {
        moduleId: "module-one",
        moduleVersion: "1.2.3",
        protocolVersion: VERSION,
      }),
    );
    await host.ready;

    runtime.dispatch(request("22222222-2222-4222-8222-222222222222", "context.get"));
    await vi.waitFor(() => {
      expect(runtime.posted.at(-1)).toMatchObject({
        messageId: "22222222-2222-4222-8222-222222222222",
        error: { code: "BRIDGE_RESOURCE_LIMIT_EXCEEDED" },
      });
    });
    host.dispose();
  });
  it("retains a cancelled adapter slot until settlement and never posts its late result", async () => {
    vi.useFakeTimers();
    const runtime = new HostTestWindow();
    vi.stubGlobal("window", runtime);
    let resolveContext!: (value: FixtureContext) => void;
    const context = new Promise<FixtureContext>((resolve) => {
      resolveContext = resolve;
    });
    const provider = vi.fn(() => context);
    const host = createMiaixzPostMessageHost<FixtureContext>({
      manifest,
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      adapter: { getContext: provider },
      parseContext: parseFixtureContext,
      timeoutMs: 1_000,
      limits: { maxInFlightRequests: 1, requestTimeoutMilliseconds: 25 },
    });
    runtime.dispatch(
      request("11111111-1111-4111-8111-111111111111", "bridge.handshake", {
        moduleId: "module-one",
        moduleVersion: "1.2.3",
        protocolVersion: VERSION,
      }),
    );
    await host.ready;

    const pending = request("22222222-2222-4222-8222-222222222222", "context.get");
    runtime.dispatch(pending);
    expect(provider).toHaveBeenCalledOnce();
    runtime.dispatch({ ...pending, kind: "cancel" });
    runtime.dispatch({ ...pending, kind: "cancel" });
    runtime.dispatch(request("33333333-3333-4333-8333-333333333333", "context.get"));
    expect(runtime.posted.at(-1)).toMatchObject({
      messageId: "33333333-3333-4333-8333-333333333333",
      error: { code: "BRIDGE_RESOURCE_LIMIT_EXCEEDED" },
    });
    expect(provider).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(25);
    expect(runtime.posted.filter((entry) => entry.messageId === pending.messageId)).toEqual([]);
    runtime.dispatch(request("55555555-5555-4555-8555-555555555555", "context.get"));
    expect(runtime.posted.at(-1)).toMatchObject({
      messageId: "55555555-5555-4555-8555-555555555555",
      error: { code: "BRIDGE_RESOURCE_LIMIT_EXCEEDED" },
    });
    expect(provider).toHaveBeenCalledOnce();

    resolveContext({ label: "neutral" });
    await vi.advanceTimersByTimeAsync(0);
    expect(runtime.posted.filter((entry) => entry.messageId === pending.messageId)).toEqual([]);
    runtime.dispatch(request("44444444-4444-4444-8444-444444444444", "context.get"));
    await vi.advanceTimersByTimeAsync(0);
    expect(provider).toHaveBeenCalledTimes(2);
    expect(runtime.posted.at(-1)).toMatchObject({
      messageId: "44444444-4444-4444-8444-444444444444",
      payload: { label: "neutral" },
    });
    host.dispose();
    expect(runtime.listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
