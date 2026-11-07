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
 * Verifies host/child handshake, request correlation, subscriptions, and disconnection.
 */

import { VERSION } from "../../../src/version.js";

import { afterEach, describe, expect, it, vi } from "vitest";

import { MiaixzSdkError } from "../../../src/errors/errors.js";
import { createEnvelope } from "../../../src/runtime/bridge/post-message-protocol.js";
import {
  createMiaixzPostMessageChildBridge,
  createMiaixzPostMessageHost,
} from "../../../src/runtime/bridge/post-message-bridge.js";
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
  requiredCapabilities: ["context", "events", "i18n", "navigation", "permissions"],
} as const;

/**
 * Caller-owned context used only by these neutral transport fixtures.
 */
interface FixtureContext {
  /**
   * Value explicitly selected by each endpoint's parser.
   */
  readonly label: string;
}

/**
 * Validates and copies the one field this fixture permits across its boundary.
 *
 * @param value - Untrusted provider or remote context.
 * @returns A new immutable context selected by the caller.
 */
function parseFixtureContext(value: unknown): Readonly<FixtureContext> {
  if (
    typeof value !== "object" ||
    value === null ||
    !("label" in value) ||
    typeof value.label !== "string"
  ) {
    throw new TypeError("Invalid fixture context.");
  }
  return Object.freeze({ label: value.label });
}

/**
 * Window-like test transport that delivers bridge messages to its connected peer.
 */
class LoopbackWindow {
  readonly listeners = new Set<(event: MessageEvent) => void>();
  readonly posted: MiaixzBridgeEnvelope[] = [];

  /**
   * Registers a message listener with the loopback window.
   *
   * @param type - Event type to register.
   * @param listener - Listener or listener object supplied by the bridge.
   * @returns Nothing after registration.
   */
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (type === "message") this.listeners.add(listener as (event: MessageEvent) => void);
  }

  /**
   * Removes a message listener from the loopback window.
   *
   * @param type - Event type to remove.
   * @param listener - Previously registered listener or listener object.
   * @returns Nothing after removal.
   */
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (type === "message") this.listeners.delete(listener as (event: MessageEvent) => void);
  }

  /**
   * Posts an envelope back to registered listeners on the next microtask.
   *
   * @param data - Bridge envelope to deliver.
   * @param targetOrigin - Origin associated with the synthetic message event.
   * @returns Nothing after scheduling delivery.
   */
  postMessage = (data: MiaixzBridgeEnvelope, targetOrigin: string): void => {
    this.posted.push(data);
    queueMicrotask(() => {
      const event = {
        data,
        origin: targetOrigin,
        source: this as unknown as Window,
      } as MessageEvent;
      for (const listener of [...this.listeners]) listener(event);
    });
  };

  /**
   * Dispatches an arbitrary synthetic message to registered listeners immediately.
   *
   * @param data - Message payload to deliver.
   * @param eventOrigin - Origin associated with the synthetic message.
   * @param source - Window reported as the message source.
   * @returns Nothing after delivery.
   */
  dispatch(data: unknown, eventOrigin = origin, source: Window = this as unknown as Window): void {
    const event = { data, origin: eventOrigin, source } as MessageEvent;
    for (const listener of [...this.listeners]) listener(event);
  }
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("postMessage Host/Child integration", () => {
  it("handshakes and executes every Host capability through one correlated transport", async () => {
    const runtime = new LoopbackWindow();
    vi.stubGlobal("window", runtime);
    const navigate = vi.fn();
    const registerMessages = vi.fn();
    const emit = vi.fn();
    const unsubscribe = vi.fn(async () => undefined);
    let publish!: (payload: unknown) => void;
    const source = { label: "ready", privateValue: "synthetic provider marker" };
    const getContext = vi.fn(async () => source);
    const hostParser = vi.fn(parseFixtureContext);
    const childParser = vi.fn(parseFixtureContext);
    const host = createMiaixzPostMessageHost<FixtureContext>({
      manifest,
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      parseContext: hostParser,
      adapter: {
        getContext,
        navigate,
        hasPermissions: async (permissions) => permissions.length === 1,
        registerMessages,
        emit,
        subscribe: async <T>(_type: string, listener: (payload: T) => void) => {
          publish = (payload) => listener(payload as T);
          return unsubscribe;
        },
      },
      timeoutMs: 1_000,
    });
    const child = await createMiaixzPostMessageChildBridge<FixtureContext>({
      moduleId: "module-one",
      moduleVersion: "1.2.3",
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      parseContext: childParser,
      timeoutMs: 1_000,
    });
    await expect(host.ready).resolves.toBeUndefined();

    const context = await child.getContext();
    const response = runtime.posted.find(
      (entry) => entry.kind === "response" && entry.method === "context.get",
    );
    expect(context).toEqual({ label: "ready" });
    expect(getContext).toHaveBeenCalledOnce();
    expect(hostParser).toHaveBeenCalledExactlyOnceWith(source);
    expect(response?.payload).toEqual({ label: "ready" });
    expect(response?.payload).toBe(hostParser.mock.results[0]?.value);
    expect(response?.payload).not.toBe(source);
    expect(Object.isFrozen(response?.payload)).toBe(true);
    expect(childParser).toHaveBeenCalledExactlyOnceWith(response?.payload);
    expect(context).toBe(childParser.mock.results[0]?.value);
    expect(context).not.toBe(response?.payload);
    expect(context).not.toBe(source);
    expect(Object.isFrozen(context)).toBe(true);
    source.label = "changed after projection";
    expect(context.label).toBe("ready");
    await child.navigate({ path: "/settings", replace: true, state: { source: "child" } });
    expect(navigate).toHaveBeenCalledWith({
      path: "/settings",
      replace: true,
      state: { source: "child" },
    });
    await expect(child.hasPermissions(["module:document:read"])).resolves.toBe(true);
    await child.registerMessages("module-one", {
      "en-US": { "module-one.title": "Title" },
    });
    expect(registerMessages).toHaveBeenCalledWith("module-one", {
      "en-US": { "module-one.title": "Title" },
    });
    await child.emit("module-one:event-one", { value: 1 });
    expect(emit).toHaveBeenCalledWith("module-one:event-one", { value: 1 });

    const listener = vi.fn(() => {
      throw new Error("consumer failures stay local");
    });
    const cancel = await child.subscribe("module-one:event-one", listener);
    publish({ sequence: 1 });
    await vi.waitFor(() => expect(listener).toHaveBeenCalledWith({ sequence: 1 }));
    await cancel();
    await cancel();
    expect(unsubscribe).toHaveBeenCalledOnce();

    child.dispose();
    child.dispose();
    await vi.waitFor(() => expect(runtime.listeners.size).toBe(0));
    await expect(child.getContext()).rejects.toMatchObject({ code: "BRIDGE_DISPOSED" });
    host.dispose();
  });

  it("rejects invalid Host setup and incompatible handshakes deterministically", async () => {
    const runtime = new LoopbackWindow();
    vi.stubGlobal("window", runtime);
    expect(() =>
      createMiaixzPostMessageHost({
        manifest: { ...manifest, kind: "integrated", entry: "package" },
        targetWindow: runtime as unknown as Window,
        targetOrigin: origin,
        adapter: {},
      }),
    ).toThrowError(expect.objectContaining({ code: "BRIDGE_ORIGIN_INVALID" }));
    expect(() =>
      createMiaixzPostMessageHost({
        manifest,
        targetWindow: runtime as unknown as Window,
        targetOrigin: "https://other.example",
        adapter: {},
      }),
    ).toThrowError(expect.objectContaining({ code: "BRIDGE_ORIGIN_INVALID" }));
    expect(() =>
      createMiaixzPostMessageHost({
        manifest,
        targetWindow: runtime as unknown as Window,
        targetOrigin: origin,
        adapter: [] as never,
      }),
    ).toThrowError(expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }));

    const missingCapability = createMiaixzPostMessageHost({
      manifest,
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      adapter: {},
    });
    await expect(missingCapability.ready).rejects.toMatchObject({
      code: "BRIDGE_CAPABILITY_UNAVAILABLE",
    });
    missingCapability.dispose();

    const host = createMiaixzPostMessageHost({
      manifest: { ...manifest, requiredCapabilities: [] },
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      adapter: {},
      timeoutMs: 1_000,
    });
    await expect(
      createMiaixzPostMessageChildBridge({
        moduleId: "module-one",
        moduleVersion: "1.2.4",
        targetWindow: runtime as unknown as Window,
        targetOrigin: origin,
        timeoutMs: 1_000,
      }),
    ).rejects.toMatchObject({ code: "BRIDGE_MESSAGE_INVALID" });
    await expect(host.ready).rejects.toMatchObject({ code: "BRIDGE_MESSAGE_INVALID" });
    host.dispose();
  });

  it("times out an idle Host and removes its listener", async () => {
    vi.useFakeTimers();
    const runtime = new LoopbackWindow();
    vi.stubGlobal("window", runtime);
    const host = createMiaixzPostMessageHost({
      manifest: { ...manifest, requiredCapabilities: [] },
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      adapter: {},
      timeoutMs: 1_000,
    });
    const ready = expect(host.ready).rejects.toMatchObject({ code: "BRIDGE_TIMEOUT" });
    await vi.advanceTimersByTimeAsync(1_000);
    await ready;
    expect(runtime.listeners.size).toBe(0);
  });

  it("rejects invalid Child identity and malformed handshake responses", async () => {
    for (const options of [
      { moduleId: "Bad", moduleVersion: "1.2.3" },
      { moduleId: "module-one", moduleVersion: "01.2.3" },
    ]) {
      const runtime = new LoopbackWindow();
      vi.stubGlobal("window", runtime);
      expect(() =>
        createMiaixzPostMessageChildBridge({
          ...options,
          targetWindow: runtime as unknown as Window,
          targetOrigin: origin,
          timeoutMs: 1_000,
        }),
      ).toThrowError(expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }));
    }

    for (const payload of [
      null,
      {},
      { accepted: false, protocolVersion: VERSION, capabilities: [] },
      { accepted: true, protocolVersion: "2.0.0", capabilities: [] },
      { accepted: true, protocolVersion: VERSION, capabilities: [1] },
      { accepted: true, protocolVersion: VERSION, capabilities: [], extra: true },
    ]) {
      const runtime = new LoopbackWindow();
      runtime.postMessage = ((data: MiaixzBridgeEnvelope, targetOrigin: string): void => {
        runtime.posted.push(data);
        if (data.kind !== "request") return;
        queueMicrotask(() => {
          runtime.dispatch(
            {
              ...data,
              kind: "response",
              payload,
            },
            targetOrigin,
          );
        });
      }) as typeof runtime.postMessage;
      vi.stubGlobal("window", runtime);
      await expect(
        createMiaixzPostMessageChildBridge({
          moduleId: "module-one",
          moduleVersion: "1.2.3",
          targetWindow: runtime as unknown as Window,
          targetOrigin: origin,
          timeoutMs: 1_000,
        }),
      ).rejects.toMatchObject({ code: "BRIDGE_MESSAGE_INVALID" });
    }
  });

  it("rejects invalid Child operations before they cross the transport", async () => {
    const runtime = new LoopbackWindow();
    vi.stubGlobal("window", runtime);
    const host = createMiaixzPostMessageHost({
      manifest: { ...manifest, requiredCapabilities: [] },
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      adapter: {},
      timeoutMs: 1_000,
    });
    const child = await createMiaixzPostMessageChildBridge({
      moduleId: "module-one",
      moduleVersion: "1.2.3",
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      timeoutMs: 1_000,
    });
    await host.ready;
    await expect(child.navigate({ path: "relative" })).rejects.toMatchObject({
      code: "BRIDGE_MESSAGE_INVALID",
    });
    await expect(child.hasPermissions(["*"])).rejects.toMatchObject({
      code: "BRIDGE_MESSAGE_INVALID",
    });
    await expect(child.registerMessages("other", {})).rejects.toMatchObject({
      code: "BRIDGE_MESSAGE_INVALID",
    });
    await expect(child.emit("wrong:event", {})).rejects.toMatchObject({
      code: "BRIDGE_MESSAGE_INVALID",
    });
    await expect(child.subscribe("module-one:event", undefined as never)).rejects.toMatchObject({
      code: "BRIDGE_MESSAGE_INVALID",
    });
    child.dispose();
    host.dispose();
  });

  it("returns registered errors for malformed Host method payloads", async () => {
    const runtime = new LoopbackWindow();
    vi.stubGlobal("window", runtime);
    const host = createMiaixzPostMessageHost({
      manifest: { ...manifest, requiredCapabilities: [] },
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      adapter: {},
      timeoutMs: 1_000,
    });
    const handshake: MiaixzBridgeEnvelope = {
      channel: "miaixz.bridge",
      protocolVersion: VERSION,
      messageId: "11111111-1111-4111-8111-111111111111",
      moduleId: "module-one",
      kind: "request",
      method: "bridge.handshake",
      payload: {
        moduleId: "module-one",
        moduleVersion: "1.2.3",
        protocolVersion: VERSION,
      },
    };
    runtime.dispatch(handshake);
    await host.ready;

    const requests: MiaixzBridgeEnvelope[] = [
      {
        ...handshake,
        messageId: "22222222-2222-4222-8222-222222222222",
        method: "context.get",
        payload: {},
      },
      {
        ...handshake,
        messageId: "33333333-3333-4333-8333-333333333333",
        method: "permissions.has",
        payload: {},
      },
      {
        ...handshake,
        messageId: "44444444-4444-4444-8444-444444444444",
        method: "i18n.register",
        payload: { namespace: "other", catalog: {} },
      },
      {
        ...handshake,
        messageId: "55555555-5555-4555-8555-555555555555",
        method: "events.emit",
        payload: {},
      },
      {
        ...handshake,
        messageId: "66666666-6666-4666-8666-666666666666",
        method: "events.subscribe",
        payload: {},
      },
      {
        ...handshake,
        messageId: "77777777-7777-4777-8777-777777777777",
        method: "events.unsubscribe",
        payload: {},
      },
      {
        ...handshake,
        messageId: "88888888-8888-4888-8888-888888888888",
        method: "bridge.dispose",
        payload: {},
      },
    ];
    for (const request of requests) runtime.dispatch(request);
    await vi.waitFor(() => {
      const failures = runtime.posted.filter(
        (entry) => entry.kind === "response" && entry.error?.code === "BRIDGE_MESSAGE_INVALID",
      );
      expect(failures.length).toBeGreaterThanOrEqual(5);
    });
    host.dispose();
  });

  it("validates every Child response shape and ignores unrelated messages", async () => {
    const runtime = new LoopbackWindow();
    const subscriptionId = "99999999-9999-4999-8999-999999999999";
    let subscribeCount = 0;
    runtime.postMessage = ((data: MiaixzBridgeEnvelope, targetOrigin: string): void => {
      runtime.posted.push(data);
      if (data.kind !== "request") return;
      const payloads: Record<string, unknown> = {
        "bridge.handshake": {
          accepted: true,
          protocolVersion: VERSION,
          capabilities: [],
        },
        "navigation.navigate": { unexpected: true },
        "permissions.has": { allowed: "yes" },
        "i18n.register": { unexpected: true },
        "events.emit": { unexpected: true },
        "events.unsubscribe": undefined,
      };
      const responsePayload =
        data.method === "events.subscribe"
          ? (subscribeCount += 1) === 1
            ? { subscriptionId: "invalid" }
            : { subscriptionId }
          : payloads[data.method];
      queueMicrotask(() => {
        runtime.dispatch({ ...data, kind: "response", payload: responsePayload }, targetOrigin);
      });
    }) as typeof runtime.postMessage;
    vi.stubGlobal("window", runtime);
    const child = await createMiaixzPostMessageChildBridge({
      moduleId: "module-one",
      moduleVersion: "1.2.3",
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      timeoutMs: 1_000,
    });
    await expect(child.navigate({ path: "/one" })).rejects.toMatchObject({
      code: "BRIDGE_MESSAGE_INVALID",
    });
    await expect(child.hasPermissions([])).rejects.toMatchObject({
      code: "BRIDGE_MESSAGE_INVALID",
    });
    await expect(child.registerMessages("module-one", {})).rejects.toMatchObject({
      code: "BRIDGE_MESSAGE_INVALID",
    });
    await expect(child.emit("module-one:event", {})).rejects.toMatchObject({
      code: "BRIDGE_MESSAGE_INVALID",
    });

    runtime.dispatch(null);
    runtime.dispatch(
      {
        channel: "miaixz.bridge",
        protocolVersion: VERSION,
        messageId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        moduleId: "other-module",
        kind: "event",
        method: "events.message",
      },
      origin,
    );
    await expect(child.subscribe("module-one:event", () => undefined)).rejects.toMatchObject({
      code: "BRIDGE_MESSAGE_INVALID",
    });
    const cancel = await child.subscribe("module-one:event", () => undefined);
    child.dispose();
    await expect(cancel()).resolves.toBeUndefined();
  });
});

describe("postMessage caller-owned Context boundaries", () => {
  it("rejects an invalid provider at the Host without sending its raw value", async () => {
    const runtime = new LoopbackWindow();
    vi.stubGlobal("window", runtime);
    const source = { label: 1, privateValue: "synthetic provider marker" };
    const getContext = vi.fn(async () => source);
    const hostParser = vi.fn(parseFixtureContext);
    const childParser = vi.fn(parseFixtureContext);
    const host = createMiaixzPostMessageHost<unknown>({
      manifest: { ...manifest, requiredCapabilities: ["context"] },
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      adapter: { getContext },
      parseContext: hostParser,
      timeoutMs: 1_000,
    });
    const child = await createMiaixzPostMessageChildBridge<FixtureContext>({
      moduleId: "module-one",
      moduleVersion: "1.2.3",
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      parseContext: childParser,
      timeoutMs: 1_000,
    });
    await host.ready;
    const failure: unknown = await child.getContext().catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(MiaixzSdkError);
    expect(failure).toMatchObject({ code: "BRIDGE_MESSAGE_INVALID" });
    expect((failure as MiaixzSdkError).cause).toBeUndefined();
    expect((failure as MiaixzSdkError).details).toBeUndefined();
    expect(getContext).toHaveBeenCalledOnce();
    expect(hostParser).toHaveBeenCalledExactlyOnceWith(source);
    expect(childParser).not.toHaveBeenCalled();
    const response = runtime.posted.find(
      (entry) => entry.kind === "response" && entry.method === "context.get",
    );
    expect(response?.error).toEqual({
      code: "BRIDGE_MESSAGE_INVALID",
      messageKey: "sdk.error.bridge.messageInvalid",
    });
    expect(response).not.toHaveProperty("payload");
    expect(JSON.stringify(response)).not.toContain("synthetic provider marker");
    child.dispose();
    host.dispose();
  });

  it.each(["parser", "provider"] as const)(
    "rejects a required Host Context capability when its %s is missing",
    async (missing) => {
      const runtime = new LoopbackWindow();
      vi.stubGlobal("window", runtime);
      const getContext = vi.fn(async () => ({ label: "ready" }));
      const hostParser = vi.fn(parseFixtureContext);
      const host = createMiaixzPostMessageHost<FixtureContext>({
        manifest: { ...manifest, requiredCapabilities: ["context"] },
        targetWindow: runtime as unknown as Window,
        targetOrigin: origin,
        adapter: missing === "provider" ? {} : { getContext },
        ...(missing === "parser" ? {} : { parseContext: hostParser }),
        timeoutMs: 1_000,
      });
      await expect(host.ready).rejects.toMatchObject({ code: "BRIDGE_CAPABILITY_UNAVAILABLE" });
      expect(getContext).not.toHaveBeenCalled();
      expect(hostParser).not.toHaveBeenCalled();
      expect(runtime.listeners.size).toBe(0);
      expect(runtime.posted).toEqual([]);
      host.dispose();
    },
  );

  it.each(["parser", "provider"] as const)(
    "omits optional Host Context capability without its %s and never calls the provider",
    async (missing) => {
      const runtime = new LoopbackWindow();
      vi.stubGlobal("window", runtime);
      const getContext = vi.fn(async () => ({ label: "ready" }));
      const hostParser = vi.fn(parseFixtureContext);
      const childParser = vi.fn(parseFixtureContext);
      const host = createMiaixzPostMessageHost<FixtureContext>({
        manifest: { ...manifest, requiredCapabilities: [] },
        targetWindow: runtime as unknown as Window,
        targetOrigin: origin,
        adapter: missing === "provider" ? {} : { getContext },
        ...(missing === "parser" ? {} : { parseContext: hostParser }),
        timeoutMs: 1_000,
      });
      const child = await createMiaixzPostMessageChildBridge<FixtureContext>({
        moduleId: "module-one",
        moduleVersion: "1.2.3",
        targetWindow: runtime as unknown as Window,
        targetOrigin: origin,
        parseContext: childParser,
        timeoutMs: 1_000,
      });
      await host.ready;
      const handshake = runtime.posted.find(
        (entry) => entry.kind === "response" && entry.method === "bridge.handshake",
      );
      expect(handshake?.payload).toEqual({
        accepted: true,
        protocolVersion: VERSION,
        capabilities: [],
      });
      await expect(child.getContext()).rejects.toMatchObject({
        code: "BRIDGE_CAPABILITY_UNAVAILABLE",
      });
      expect(
        runtime.posted.filter(
          (entry) => entry.kind === "request" && entry.method === "context.get",
        ),
      ).toHaveLength(1);
      expect(getContext).not.toHaveBeenCalled();
      expect(hostParser).not.toHaveBeenCalled();
      expect(childParser).not.toHaveBeenCalled();
      child.dispose();
      host.dispose();
    },
  );

  it("rejects a missing Child parser locally without requesting or reading Host context", async () => {
    const runtime = new LoopbackWindow();
    vi.stubGlobal("window", runtime);
    const getContext = vi.fn(async () => ({ label: "ready" }));
    const hostParser = vi.fn(parseFixtureContext);
    const host = createMiaixzPostMessageHost<FixtureContext>({
      manifest: { ...manifest, requiredCapabilities: ["context"] },
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      adapter: { getContext },
      parseContext: hostParser,
      timeoutMs: 1_000,
    });
    const child = await createMiaixzPostMessageChildBridge({
      moduleId: "module-one",
      moduleVersion: "1.2.3",
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      timeoutMs: 1_000,
    });
    await host.ready;
    const handshake = runtime.posted.find(
      (entry) => entry.kind === "response" && entry.method === "bridge.handshake",
    );
    expect(handshake?.payload).toEqual({
      accepted: true,
      protocolVersion: VERSION,
      capabilities: ["context"],
    });
    await expect(child.getContext()).rejects.toMatchObject({
      code: "BRIDGE_CAPABILITY_UNAVAILABLE",
    });
    expect(
      runtime.posted.filter((entry) => entry.kind === "request" && entry.method === "context.get"),
    ).toHaveLength(0);
    expect(getContext).not.toHaveBeenCalled();
    expect(hostParser).not.toHaveBeenCalled();
    child.dispose();
    await expect(child.getContext()).rejects.toMatchObject({ code: "BRIDGE_DISPOSED" });
    host.dispose();
  });

  it("ignores Context requests with an incorrect origin or source before reading the provider", async () => {
    const runtime = new LoopbackWindow();
    const unrelated = new LoopbackWindow();
    vi.stubGlobal("window", runtime);
    const getContext = vi.fn(async () => ({ label: "ready" }));
    const hostParser = vi.fn(parseFixtureContext);
    const host = createMiaixzPostMessageHost<FixtureContext>({
      manifest: { ...manifest, requiredCapabilities: ["context"] },
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      adapter: { getContext },
      parseContext: hostParser,
      timeoutMs: 1_000,
    });
    runtime.dispatch(
      createEnvelope(
        "module-one",
        "request",
        "bridge.handshake",
        "11111111-1111-4111-8111-111111111111",
        { moduleId: "module-one", moduleVersion: "1.2.3", protocolVersion: VERSION },
      ),
    );
    await host.ready;
    const request = createEnvelope(
      "module-one",
      "request",
      "context.get",
      "22222222-2222-4222-8222-222222222222",
    );
    runtime.dispatch(request, "https://other.example");
    runtime.dispatch(request, origin, unrelated as unknown as Window);
    expect(getContext).not.toHaveBeenCalled();
    expect(hostParser).not.toHaveBeenCalled();
    expect(
      runtime.posted.filter((entry) => entry.kind === "response" && entry.method === "context.get"),
    ).toHaveLength(0);
    runtime.dispatch(request);
    await vi.waitFor(() =>
      expect(
        runtime.posted.filter(
          (entry) => entry.kind === "response" && entry.method === "context.get",
        ),
      ).toHaveLength(1),
    );
    expect(getContext).toHaveBeenCalledOnce();
    expect(hostParser).toHaveBeenCalledExactlyOnceWith({ label: "ready" });
    expect(
      runtime.posted.find((entry) => entry.kind === "response" && entry.method === "context.get")
        ?.payload,
    ).toEqual({ label: "ready" });
    host.dispose();
  });

  it("filters Context response origin and source before independently rejecting an invalid remote value", async () => {
    const runtime = new LoopbackWindow();
    const unrelated = new LoopbackWindow();
    runtime.postMessage = (data: MiaixzBridgeEnvelope, targetOrigin: string): void => {
      runtime.posted.push(data);
      if (data.kind !== "request" || data.method !== "bridge.handshake") return;
      queueMicrotask(() =>
        runtime.dispatch(
          {
            ...data,
            kind: "response",
            payload: { accepted: true, protocolVersion: VERSION, capabilities: ["context"] },
          },
          targetOrigin,
        ),
      );
    };
    vi.stubGlobal("window", runtime);
    const childParser = vi.fn(parseFixtureContext);
    const child = await createMiaixzPostMessageChildBridge<FixtureContext>({
      moduleId: "module-one",
      moduleVersion: "1.2.3",
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      parseContext: childParser,
      timeoutMs: 1_000,
    });
    const settled = vi.fn();
    const pending = child.getContext().then(
      (value) => {
        settled(value);
        return value;
      },
      (error: unknown) => {
        settled(error);
        return error;
      },
    );
    const request = runtime.posted.find(
      (entry) => entry.kind === "request" && entry.method === "context.get",
    );
    if (request === undefined) throw new Error("Missing Context request.");
    const payload = { label: 1, privateValue: "synthetic remote marker" };
    const response = { ...request, kind: "response", payload };
    runtime.dispatch(response, "https://other.example");
    runtime.dispatch(response, origin, unrelated as unknown as Window);
    await Promise.resolve();
    expect(childParser).not.toHaveBeenCalled();
    expect(settled).not.toHaveBeenCalled();
    runtime.dispatch(response);
    const failure = await pending;
    expect(failure).toBeInstanceOf(MiaixzSdkError);
    expect(failure).toMatchObject({ code: "BRIDGE_MESSAGE_INVALID" });
    expect((failure as MiaixzSdkError).cause).toBeUndefined();
    expect((failure as MiaixzSdkError).details).toBeUndefined();
    expect((failure as MiaixzSdkError).message).not.toContain("synthetic remote marker");
    expect(childParser).toHaveBeenCalledExactlyOnceWith(payload);
    expect(settled).toHaveBeenCalledExactlyOnceWith(failure);
    child.dispose();
  });

  it("cancels a pending Context request exactly once on dispose and suppresses late success", async () => {
    const runtime = new LoopbackWindow();
    vi.stubGlobal("window", runtime);
    let resolveContext!: (value: FixtureContext) => void;
    const providerResult = new Promise<FixtureContext>((resolve) => {
      resolveContext = resolve;
    });
    const getContext = vi.fn(() => providerResult);
    const hostParser = vi.fn(parseFixtureContext);
    const childParser = vi.fn(parseFixtureContext);
    const host = createMiaixzPostMessageHost<FixtureContext>({
      manifest: { ...manifest, requiredCapabilities: ["context"] },
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      adapter: { getContext },
      parseContext: hostParser,
      timeoutMs: 1_000,
    });
    const child = await createMiaixzPostMessageChildBridge<FixtureContext>({
      moduleId: "module-one",
      moduleVersion: "1.2.3",
      targetWindow: runtime as unknown as Window,
      targetOrigin: origin,
      parseContext: childParser,
      timeoutMs: 1_000,
    });
    await host.ready;
    const pending = child.getContext();
    const rejected = expect(pending).rejects.toMatchObject({ code: "BRIDGE_DISPOSED" });
    await vi.waitFor(() => expect(getContext).toHaveBeenCalledOnce());
    const request = runtime.posted.find(
      (entry) => entry.kind === "request" && entry.method === "context.get",
    );
    if (request === undefined) throw new Error("Missing Context request.");
    child.dispose();
    child.dispose();
    await rejected;
    expect(
      runtime.posted.filter((entry) => entry.kind === "cancel" && entry.method === "context.get"),
    ).toEqual([
      expect.objectContaining({
        messageId: request.messageId,
        method: request.method,
        kind: "cancel",
      }),
    ]);
    expect(
      runtime.posted.filter(
        (entry) => entry.kind === "request" && entry.method === "bridge.dispose",
      ),
    ).toHaveLength(1);
    await vi.waitFor(() => expect(runtime.listeners.size).toBe(0));
    resolveContext({ label: "late" });
    await vi.waitFor(() => expect(hostParser).toHaveBeenCalledExactlyOnceWith({ label: "late" }));
    await Promise.resolve();
    expect(childParser).not.toHaveBeenCalled();
    expect(
      runtime.posted.filter((entry) => entry.kind === "response" && entry.method === "context.get"),
    ).toHaveLength(0);
    await expect(child.getContext()).rejects.toMatchObject({ code: "BRIDGE_DISPOSED" });
    host.dispose();
  });
});
