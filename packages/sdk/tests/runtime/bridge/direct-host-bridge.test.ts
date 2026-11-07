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
 * Verifies capability-limited direct host calls and lifecycle ownership.
 */

import { describe, expect, expectTypeOf, it, vi } from "vitest";

import { createMiaixzDirectHostBridge } from "../../../src/runtime/bridge/direct-host-bridge.js";
import { isPlainRecord } from "../../../src/runtime/bridge/post-message-protocol.js";
import { VERSION } from "../../../src/version.js";

/**
 * Defines the neutral context fields selected by this fixture's caller.
 */
interface FixtureContext {
  readonly label: string;
}

/**
 * Validates, projects, and freezes the caller-owned context snapshot.
 *
 * @param value - Untrusted context returned by the fixture provider.
 * @returns An independently owned snapshot containing only the selected field.
 */
function parseFixtureContext(value: unknown): Readonly<FixtureContext> {
  if (!isPlainRecord(value) || typeof value.label !== "string") {
    throw new TypeError("Invalid fixture context.");
  }
  return Object.freeze({ label: value.label });
}

describe("Direct Host Bridge", () => {
  it("delegates every capability with defensive validation and idempotent cleanup", async () => {
    const unsubscribe = vi.fn(async () => undefined);
    const listener = vi.fn();
    const source = { label: "neutral", privateValue: "synthetic marker" };
    const parser = vi.fn(parseFixtureContext);
    const adapter = {
      getContext: vi.fn(async () => source),
      navigate: vi.fn(async (_request: { readonly state?: unknown }) => undefined),
      hasPermissions: vi.fn(async () => true),
      registerMessages: vi.fn(async () => undefined),
      emit: vi.fn(async () => undefined),
      subscribe: vi.fn(async <T>(_type: string, callback: (payload: T) => void) => {
        callback({ ready: true } as T);
        return unsubscribe;
      }),
    };
    const bridge = createMiaixzDirectHostBridge<FixtureContext>({
      moduleId: "module-one",
      adapter,
      parseContext: parser,
    });

    expect(bridge.protocolVersion).toBe(VERSION);
    expectTypeOf(bridge.getContext).returns.toEqualTypeOf<Promise<Readonly<FixtureContext>>>();
    const context = await bridge.getContext();
    expect(context).toEqual({ label: "neutral" });
    expect(context).not.toBe(source);
    expect(context).toBe(parser.mock.results[0]?.value);
    expect(Object.isFrozen(context)).toBe(true);
    expect(parser).toHaveBeenCalledExactlyOnceWith(source);
    const state = { page: 1 };
    await bridge.navigate({ path: "/settings", replace: true, state });
    expect(adapter.navigate).toHaveBeenCalledWith({ path: "/settings", replace: true, state });
    expect(adapter.navigate.mock.calls[0]?.[0].state).not.toBe(state);
    await bridge.navigate({ path: "/" });
    expect(adapter.navigate).toHaveBeenLastCalledWith({ path: "/" });
    await expect(bridge.hasPermissions(["module:document:read"])).resolves.toBe(true);
    await bridge.registerMessages("module-one", { "en-US": { "module-one.title": "Title" } });
    await bridge.emit("module-one:event-one", { value: 1 });
    const cancel = await bridge.subscribe("module-one:event-one", listener);
    expect(listener).toHaveBeenCalledWith({ ready: true });
    await cancel();
    await cancel();
    expect(unsubscribe).toHaveBeenCalledOnce();

    const secondCancel = await bridge.subscribe("module-one:event-one", listener);
    bridge.dispose();
    bridge.dispose();
    await vi.waitFor(() => expect(unsubscribe).toHaveBeenCalledTimes(2));
    await secondCancel();
    await expect(bridge.getContext()).rejects.toMatchObject({ code: "BRIDGE_DISPOSED" });
    expect(adapter.getContext).toHaveBeenCalledOnce();
    expect(parser).toHaveBeenCalledOnce();
  });

  it("does not call the context provider when the parser is missing", async () => {
    const provider = vi.fn(async () => ({ label: "neutral" }));
    const bridge = createMiaixzDirectHostBridge<FixtureContext>({
      moduleId: "module-one",
      adapter: { getContext: provider },
    });

    await expect(bridge.getContext()).rejects.toMatchObject({
      code: "BRIDGE_CAPABILITY_UNAVAILABLE",
    });
    expect(provider).not.toHaveBeenCalled();
    bridge.dispose();
  });

  it("does not call the context parser when the provider is missing", async () => {
    const parser = vi.fn(parseFixtureContext);
    const bridge = createMiaixzDirectHostBridge<FixtureContext>({
      moduleId: "module-one",
      adapter: {},
      parseContext: parser,
    });

    await expect(bridge.getContext()).rejects.toMatchObject({
      code: "BRIDGE_CAPABILITY_UNAVAILABLE",
    });
    expect(parser).not.toHaveBeenCalled();
    bridge.dispose();
  });

  it.each([null, {}, { label: 1 }])(
    "rejects context rejected by the caller parser: %j",
    async (value) => {
      const provider = vi.fn(async () => value);
      const parser = vi.fn(parseFixtureContext);
      const bridge = createMiaixzDirectHostBridge<
        FixtureContext | null | { readonly label?: number }
      >({
        moduleId: "module-one",
        adapter: { getContext: provider },
        parseContext: parser,
      });

      await expect(bridge.getContext()).rejects.toMatchObject({ code: "BRIDGE_MESSAGE_INVALID" });
      expect(provider).toHaveBeenCalledOnce();
      expect(parser).toHaveBeenCalledExactlyOnceWith(value);
      bridge.dispose();
    },
  );

  it("rejects invalid identifiers, payloads, missing capabilities, and invalid subscriptions", async () => {
    expect(() => createMiaixzDirectHostBridge({ moduleId: "Bad", adapter: {} })).toThrowError(
      expect.objectContaining({ code: "BRIDGE_MESSAGE_INVALID" }),
    );
    const bridge = createMiaixzDirectHostBridge({ moduleId: "module-one", adapter: {} });
    await expect(bridge.getContext()).rejects.toMatchObject({
      code: "BRIDGE_CAPABILITY_UNAVAILABLE",
    });
    for (const request of [
      { path: "relative" },
      { path: "//host" },
      { path: "/bad\\path" },
      { path: "/", replace: "yes" },
      { path: "/", extra: true },
    ]) {
      await expect(bridge.navigate(request as never)).rejects.toMatchObject({
        code: "BRIDGE_MESSAGE_INVALID",
      });
    }
    await expect(bridge.navigate({ path: "/", state: () => undefined })).rejects.toMatchObject({
      code: "BRIDGE_NAVIGATION_STATE_INVALID",
    });
    await expect(bridge.hasPermissions(["bad"])).rejects.toMatchObject({
      code: "BRIDGE_MESSAGE_INVALID",
    });
    await expect(bridge.registerMessages("other", {})).rejects.toMatchObject({
      code: "BRIDGE_MESSAGE_INVALID",
    });
    for (const type of ["event", "other:event", "module-one:event:extra", "module-one:Bad"]) {
      await expect(bridge.emit(type, undefined)).rejects.toMatchObject({
        code: "BRIDGE_MESSAGE_INVALID",
      });
    }

    const badSubscribe = createMiaixzDirectHostBridge({
      moduleId: "module-one",
      adapter: { subscribe: vi.fn(async () => undefined as never) },
    });
    await expect(badSubscribe.subscribe("module-one:event-one", vi.fn())).rejects.toMatchObject({
      code: "BRIDGE_MESSAGE_INVALID",
    });
    await expect(
      badSubscribe.subscribe("module-one:event-one", undefined as never),
    ).rejects.toMatchObject({ code: "BRIDGE_MESSAGE_INVALID" });
  });

  it("turns disposal during an asynchronous subscribe into a disposed result", async () => {
    let resolveSubscription!: (value: () => Promise<void>) => void;
    const cleanup = vi.fn(async () => {
      throw new Error("ignored cleanup");
    });
    const bridge = createMiaixzDirectHostBridge({
      moduleId: "module-one",
      adapter: {
        subscribe: () =>
          new Promise((resolve) => {
            resolveSubscription = resolve;
          }),
      },
    });
    const subscription = bridge.subscribe("module-one:event-one", vi.fn());
    const result = expect(subscription).rejects.toMatchObject({ code: "BRIDGE_DISPOSED" });
    await vi.waitFor(() => expect(resolveSubscription).toBeTypeOf("function"));
    bridge.dispose();
    resolveSubscription(cleanup);
    await result;
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
