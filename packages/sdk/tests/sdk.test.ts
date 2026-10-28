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
 * Verifies SDK construction, authentication-mode services, configuration, and disposal.
 */

import { describe, expect, it } from "vitest";

import { createMiaixzSdk, type MiaixzSdkOptions } from "../src/sdk.js";

const initialConfig = Object.freeze({
  apiBaseUrl: "https://api.one.test",
  environment: "test" as const,
  requestTimeoutMs: 1_000,
  services: Object.freeze({
    billing: "https://billing.one.test",
    " billing ": "https://spaced.one.test",
  }),
});

/**
 * Creates a Fetch implementation that records every resolved endpoint.
 *
 * @param requests - Destination array receiving request URLs.
 * @returns Deterministic Fetch implementation.
 */
function createRecordingFetch(requests: string[]): typeof fetch {
  return async (input) => {
    const url = String(input);
    requests.push(url);
    if (url.endsWith("/file")) {
      return new Response(new Blob(["content"]), {
        headers: { "content-type": "application/octet-stream" },
      });
    }
    return Response.json({ errcode: "0", errmsg: "ok", data: { url } });
  };
}

describe("createMiaixzSdk", () => {
  it("exposes session only for the bearer branch", () => {
    const cookie = createMiaixzSdk({ appId: "cookie", config: initialConfig });
    const bearer = createMiaixzSdk({
      appId: "bearer",
      authMode: "bearer",
      config: initialConfig,
    });

    expect(cookie.authMode).toBe("cookie");
    expect("session" in cookie).toBe(false);
    expect(bearer.authMode).toBe("bearer");
    expect(bearer.session).toBeDefined();
    cookie.destroy();
    bearer.destroy();
  });

  it("keeps primary, files, and exact service façades stable across config updates", async () => {
    const requests: string[] = [];
    const sdk = createMiaixzSdk({
      appId: "stable",
      config: initialConfig,
      fetch: createRecordingFetch(requests),
    });
    const api = sdk.api;
    const files = sdk.files;
    const billing = sdk.createServiceClient("billing");
    const spaced = sdk.createServiceClient(" billing ");

    expect(sdk.createServiceClient("billing")).toBe(billing);
    expect(spaced).not.toBe(billing);
    sdk.config.set({
      apiBaseUrl: "https://api.two.test",
      environment: "staging",
      requestTimeoutMs: 2_000,
      services: {
        billing: "https://billing.two.test",
        " billing ": "https://spaced.two.test",
      },
    });

    expect(sdk.api).toBe(api);
    expect(sdk.files).toBe(files);
    expect(sdk.createServiceClient("billing")).toBe(billing);
    await api.get("/primary");
    await billing.get("/invoice");
    await spaced.get("/invoice");
    await files.download("/file");
    expect(requests).toEqual([
      "https://api.two.test/primary",
      "https://billing.two.test/invoice",
      "https://spaced.two.test/invoice",
      "https://api.two.test/file",
    ]);
    sdk.destroy();
  });

  it("does not commit a config update that cannot be validated", async () => {
    const requests: string[] = [];
    const sdk = createMiaixzSdk({
      appId: "atomic",
      config: initialConfig,
      fetch: createRecordingFetch(requests),
    });
    const previousConfig = sdk.config.getSnapshot();

    expect(() =>
      sdk.config.set({
        ...initialConfig,
        apiBaseUrl: "http://insecure.example.test",
        environment: "production",
      }),
    ).toThrowError(expect.objectContaining({ code: "CONFIG_INVALID" }));
    expect(sdk.config.getSnapshot()).toBe(previousConfig);
    await sdk.api.get("/still-active");
    expect(requests).toEqual(["https://api.one.test/still-active"]);
    sdk.destroy();
  });

  it("marks removed services missing and disables every cached façade on destroy", async () => {
    const sdk = createMiaixzSdk({
      appId: "lifecycle",
      config: initialConfig,
      fetch: createRecordingFetch([]),
    });
    const api = sdk.api;
    const files = sdk.files;
    const billing = sdk.createServiceClient("billing");
    sdk.config.set({ ...initialConfig, services: {} });

    expect(() => billing.get("/invoice")).toThrowError(
      expect.objectContaining({ code: "SERVICE_ENDPOINT_MISSING" }),
    );
    sdk.destroy();
    expect(() => api.get("/primary")).toThrowError(
      expect.objectContaining({ code: "SDK_DESTROYED" }),
    );
    await expect(files.download("/file")).rejects.toMatchObject({ code: "SDK_DESTROYED" });
    expect(() => billing.get("/invoice")).toThrowError(
      expect.objectContaining({ code: "SDK_DESTROYED" }),
    );
  });

  it("rejects runtime values that bypass the event-source union", () => {
    const invalid = {
      appId: "invalid-events",
      config: initialConfig,
      eventBus: {},
      eventChannel: true,
    } as unknown as MiaixzSdkOptions;
    expect(() => createMiaixzSdk(invalid as never)).toThrowError(
      expect.objectContaining({ code: "EVENT_CHANNEL_INVALID" }),
    );
  });
});

describe("grant snapshot invalidation", () => {
  it("notifies subscribers after replacement and never includes permission data", () => {
    const sdk = createMiaixzSdk({ appId: "grant-events", config: initialConfig });
    const seen: unknown[] = [];
    const off = sdk.events.on("grants:changed", (event) => {
      seen.push(event);
      expect(sdk.grants.can("stores.update")).toBe(event.revision === 1);
    });
    sdk.setGrants({ allowed: ["stores.update"] });
    sdk.setGrants({ allowed: [] });
    expect(seen).toEqual([{ revision: 1 }, { revision: 2 }]);
    expect(() => sdk.setGrants({ allowed: [null] } as never)).toThrow();
    expect(seen).toHaveLength(2);
    off();
    sdk.destroy();
  });
});
