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
 * Verifies API request preparation, response parsing, retries, and telemetry behavior.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { createApiClient } from "../../../src/fabric/api/client.js";
import {
  applyCsrfPolicy,
  createRequestOriginError,
  executeMiaixzApiRequest,
} from "../../../src/fabric/api/request-execution.js";
import {
  appendMiaixzQuery,
  getRequestId,
  hasContextHeader,
  isNativeBody,
  normalizeBaseUrl,
  normalizeRetry,
  normalizeTimeout,
  resolveRedirectMode,
  resolveRequestUrl,
  serializeBody,
  serializeQueryValue,
  validatePreparedRequestUrl,
} from "../../../src/fabric/api/request-options.js";
import {
  createResponseInvalidError,
  extractProblem,
  parseBody,
  parseJsonBody,
  parseResponseData,
  sanitizeErrorUrl,
} from "../../../src/fabric/api/response-parser.js";
import {
  createAbortContext,
  normalizeAttemptError,
  retryDelay,
  wait,
} from "../../../src/fabric/api/retry.js";
import type {
  MiaixzHttpErrorDetails,
  MiaixzHttpErrorMapper,
} from "../../../src/fabric/api/response.js";
import {
  emitErrorTelemetry,
  emitRequestTelemetry,
  emitResponseTelemetry,
  invokeTelemetryHook,
  isPlainTelemetryObject,
  normalizeSensitiveFieldName,
  resolveLogicalRequestId,
  sanitizeTelemetryBody,
  sanitizeTelemetryHeaders,
  sanitizeTelemetryUrl,
  sanitizeTelemetryValue,
  summarizeTelemetryValue,
  telemetryMaximumCollectionSize,
  telemetryMaximumDepth,
  telemetryMaximumStringLength,
  truncateTelemetryString,
} from "../../../src/fabric/api/telemetry.js";
import {
  MiaixzAbortError,
  MiaixzApiError,
  MiaixzNetworkError,
  MiaixzSdkError,
  MiaixzTimeoutError,
} from "../../../src/errors/errors.js";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("API request option helpers", () => {
  it("normalizes endpoint, timeout, and retry contracts", () => {
    expect(normalizeBaseUrl("https://api.example.test///", "production")).toBe(
      "https://api.example.test",
    );
    expect(normalizeBaseUrl("http://localhost:3000/", "development")).toBe("http://localhost:3000");
    expect(() => normalizeBaseUrl("http://api.example.test", "production")).toThrowError(
      expect.objectContaining({ code: "API_BASE_URL_INVALID" }),
    );
    for (const endpoint of [
      "",
      " https://api.test ",
      "https://api.test?q=1",
      "https://api.test#fragment",
      "https://user@api.test",
      "ftp://api.test",
    ]) {
      expect(() => normalizeBaseUrl(endpoint, "production")).toThrowError(
        expect.objectContaining({ code: "API_BASE_URL_INVALID" }),
      );
    }
    expect(normalizeTimeout(1)).toBe(1);
    expect(() => normalizeTimeout(0)).toThrowError(
      expect.objectContaining({ code: "API_TIMEOUT_INVALID" }),
    );
    expect(() => normalizeTimeout(Number.NaN)).toThrowError(
      expect.objectContaining({ code: "API_TIMEOUT_INVALID" }),
    );
    expect(normalizeRetry(5)).toBe(5);
    for (const retry of [-1, 1.5, 6]) {
      expect(() => normalizeRetry(retry)).toThrowError(
        expect.objectContaining({ code: "API_RETRY_INVALID" }),
      );
    }
  });

  it("allows only same-origin relative request paths before and after interception", () => {
    const makeError = createRequestOriginError;
    expect(resolveRequestUrl("https://api.example.test/v1", "users", makeError)).toBe(
      "https://api.example.test/v1/users",
    );
    expect(resolveRequestUrl("https://api.example.test/v1", "/users", makeError)).toBe(
      "https://api.example.test/users",
    );
    expect(
      validatePreparedRequestUrl(
        "https://api.example.test/v1",
        "https://api.example.test/users",
        makeError,
      ),
    ).toBe("https://api.example.test/users");
    for (const path of [
      "https://other.test/users",
      "//other.test/users",
      "\\\\other.test/users",
      "mailto:test@example.test",
      "https://user:secret@api.example.test/users",
    ]) {
      expect(() => resolveRequestUrl("https://api.example.test", path, makeError)).toThrowError(
        expect.objectContaining({ code: "API_REQUEST_ORIGIN_INVALID" }),
      );
    }
    expect(() =>
      validatePreparedRequestUrl("https://api.example.test", "https://other.test", makeError),
    ).toThrowError(expect.objectContaining({ code: "API_REQUEST_ORIGIN_INVALID" }));
    expect(() =>
      validatePreparedRequestUrl("https://api.example.test", 1 as never, makeError),
    ).toThrowError(expect.objectContaining({ code: "API_REQUEST_ORIGIN_INVALID" }));
    expect(() => validatePreparedRequestUrl("invalid", "/users", makeError)).toThrowError(
      expect.objectContaining({ code: "API_REQUEST_ORIGIN_INVALID" }),
    );
    expect(() => resolveRequestUrl("invalid", "/users", makeError)).toThrowError(
      expect.objectContaining({ code: "API_REQUEST_ORIGIN_INVALID" }),
    );
  });

  it("serializes query and request bodies without changing native bodies", () => {
    const date = new Date("2026-01-02T03:04:05.000Z");
    expect(serializeQueryValue(date)).toBe(date.toISOString());
    expect(serializeQueryValue(false)).toBe("false");
    expect(
      appendMiaixzQuery("https://api.test/items?base=1#part", {
        q: "a b",
        page: 2,
        active: false,
        empty: null,
        list: ["one", undefined, "two"],
        at: date,
      }),
    ).toBe(
      "https://api.test/items?base=1&q=a+b&page=2&active=false&list=one&list=two&at=2026-01-02T03%3A04%3A05.000Z#part",
    );
    expect(appendMiaixzQuery("https://api.test/items", undefined)).toBe("https://api.test/items");
    expect(appendMiaixzQuery("https://api.test/items#part", { q: undefined })).toBe(
      "https://api.test/items#part",
    );

    const nativeBodies = [
      "text",
      new Blob(["blob"]),
      new FormData(),
      new URLSearchParams({ a: "1" }),
      new ArrayBuffer(2),
      new Uint8Array([1, 2]),
      new ReadableStream(),
    ];
    for (const body of nativeBodies) expect(isNativeBody(body)).toBe(true);
    const headers = new Headers();
    expect(serializeBody({ answer: 42 }, headers)).toBe('{"answer":42}');
    expect(headers.get("content-type")).toBe("application/json");
    expect(serializeBody(undefined, headers)).toBeUndefined();
    expect(serializeBody("plain", new Headers())).toBe("plain");
    const explicit = new Headers({ "content-type": "application/custom" });
    serializeBody({ value: 1 }, explicit);
    expect(explicit.get("content-type")).toBe("application/custom");
  });

  it("derives safe redirects and request identifiers from final headers", () => {
    const empty = new Headers();
    expect(hasContextHeader(empty, new Set())).toBe(false);
    expect(resolveRedirectMode(empty, "same-origin", false, new Set())).toBe("follow");
    for (const [name, value] of [
      ["Authorization", "Bearer token"],
      ["Cookie", "session=1"],
      ["Proxy-Authorization", "Basic x"],
      ["X-Api-Key", "key"],
      ["X-CSRF-Token", "csrf"],
    ] as const) {
      const headers = new Headers({ [name]: value });
      expect(resolveRedirectMode(headers, "same-origin", false, new Set())).toBe("error");
    }
    for (const name of ["X-Demo-Context", "X-Custom-Context"]) {
      const headers = new Headers({ [name]: "one" });
      expect(
        resolveRedirectMode(headers, "same-origin", false, new Set([name.toLowerCase()])),
      ).toBe("error");
      expect(resolveRedirectMode(headers, "same-origin", false, new Set())).toBe("follow");
    }
    expect(resolveRedirectMode(empty, "include", false, new Set())).toBe("error");
    expect(resolveRedirectMode(empty, "same-origin", true, new Set())).toBe("error");

    expect(getRequestId(new Headers({ "x-request-id": "canonical" }))).toBe("canonical");
    expect(getRequestId(new Headers())).toBeUndefined();
    const generated = new Headers();
    expect(resolveLogicalRequestId(generated)).toBe(generated.get("x-request-id"));
    generated.set("x-request-id", "given");
    expect(resolveLogicalRequestId(generated)).toBe("given");
  });
});

describe("API response and retry helpers", () => {
  it("selects and parses every supported response representation", async () => {
    expect(await parseBody(Response.json({ value: 1 }), "json")).toEqual({ value: 1 });
    expect(await parseBody(new Response("hello"), "text")).toBe("hello");
    expect(
      await parseBody(new Response("hello", { headers: { "content-type": "text/plain" } }), "auto"),
    ).toBe("hello");
    expect(await parseBody(Response.json({ value: 2 }), "auto")).toEqual({ value: 2 });
    expect(await parseBody(new Response(null, { status: 204 }), "auto")).toBeUndefined();
    expect(await parseBody(new Response(null), "void")).toBeUndefined();
    expect(await parseBody(new Response(null, { status: 205 }), "auto")).toBeUndefined();
    expect(await parseBody(new Response(new Uint8Array([1, 2])), "arrayBuffer")).toBeInstanceOf(
      ArrayBuffer,
    );
    expect(await parseBody(new Response("blob"), "blob")).toBeInstanceOf(Blob);
    expect(
      await parseBody(
        new Response("binary", { headers: { "content-type": "application/octet-stream" } }),
        "auto",
      ),
    ).toBeInstanceOf(Blob);
    expect(await parseJsonBody(new Response(""))).toBeUndefined();
    await expect(parseJsonBody(new Response("{"))).rejects.toBeInstanceOf(SyntaxError);
  });

  it("extracts only generic problem details and sanitizes diagnostic URLs", () => {
    const response = new Response(null, { status: 400 });
    expect(extractProblem({ code: "8", desc: "ignored" }, response)).toEqual({ code: "8" });
    expect(extractProblem({ code: "0", desc: "ignored", data: null }, response)).toEqual({
      code: "0",
    });
    expect(
      extractProblem({ code: "CUSTOM", requestId: "r1", message: "unsafe" }, response),
    ).toEqual({
      code: "CUSTOM",
      requestId: "r1",
      serverMessage: "unsafe",
    });
    expect(extractProblem("failure", response)).toEqual({});
    expect(extractProblem({ code: 1, requestId: 1, message: 1 }, response)).toEqual({});
    expect(sanitizeErrorUrl("https://user:secret@api.test/items?a=1&a=2#frag")).toBe(
      "https://api.test/items?a=[REDACTED]&a=[REDACTED]",
    );
    expect(sanitizeErrorUrl("not a url")).toBe("[INVALID_URL]");
  });

  it("wraps parser failures and preserves successful parsed values", () => {
    expect(parseResponseData({ value: 2 }, undefined, undefined)).toEqual({ value: 2 });
    expect(
      parseResponseData({ value: 2 }, (value) => (value as { value: number }).value, "r1"),
    ).toBe(2);
    expect(() =>
      parseResponseData(
        {},
        () => {
          throw new Error("invalid");
        },
        "r2",
      ),
    ).toThrowError(
      expect.objectContaining({ code: "API_RESPONSE_INVALID", details: { requestId: "r2" } }),
    );
    expect(createResponseInvalidError("invalid", undefined)).toMatchObject({
      code: "API_RESPONSE_INVALID",
      details: { type: "string" },
    });
  });

  it("supports timeout, parent abort, retry headers, and cancellable delay", async () => {
    vi.useFakeTimers();
    const timed = createAbortContext(undefined, 20);
    await vi.advanceTimersByTimeAsync(20);
    expect(timed.signal.aborted).toBe(true);
    expect(timed.timedOut()).toBe(true);
    expect(normalizeAttemptError(new Error("late"), timed, undefined, 20)).toBeInstanceOf(
      MiaixzTimeoutError,
    );
    timed.dispose();

    const parent = new AbortController();
    const child = createAbortContext(parent.signal, 100);
    parent.abort("stop");
    expect(child.signal.aborted).toBe(true);
    expect(normalizeAttemptError(new Error("stop"), child, parent.signal, 100)).toBeInstanceOf(
      MiaixzAbortError,
    );
    child.dispose();
    expect(
      normalizeAttemptError(
        new Error("offline"),
        createAbortContext(undefined, 100),
        undefined,
        100,
      ),
    ).toBeInstanceOf(MiaixzNetworkError);
    const sdkError = new MiaixzSdkError({ code: "SDK_DESTROYED" });
    expect(
      normalizeAttemptError(sdkError, createAbortContext(undefined, 100), undefined, 100),
    ).toBe(sdkError);

    expect(retryDelay(0, new Response(null, { headers: { "retry-after": "2" } }))).toBe(2_000);
    expect(retryDelay(5)).toBe(2_000);
    expect(retryDelay(0)).toBe(250);
    expect(retryDelay(0, new Response(null, { headers: { "retry-after": "-1" } }))).toBe(0);
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    expect(
      retryDelay(
        0,
        new Response(null, { headers: { "retry-after": "Thu, 01 Jan 2026 00:00:01 GMT" } }),
      ),
    ).toBe(1_000);
    expect(retryDelay(1, new Response(null, { headers: { "retry-after": "invalid" } }))).toBe(500);
    expect(await wait(0, undefined)).toBeUndefined();
    const pending = wait(25, undefined);
    await vi.advanceTimersByTimeAsync(25);
    await expect(pending).resolves.toBeUndefined();
    const stopped = new AbortController();
    stopped.abort("cancel");
    await expect(wait(25, stopped.signal)).rejects.toBeInstanceOf(MiaixzAbortError);
    const active = new AbortController();
    const interrupted = wait(25, active.signal);
    active.abort("during-delay");
    await expect(interrupted).rejects.toBeInstanceOf(MiaixzAbortError);
  });
});

describe("API telemetry", () => {
  it("sanitizes bounded strings, headers, values, and non-JSON bodies", () => {
    expect(isPlainTelemetryObject({})).toBe(true);
    expect(isPlainTelemetryObject(Object.create(null) as object)).toBe(true);
    expect(isPlainTelemetryObject(new Date())).toBe(false);
    expect(normalizeSensitiveFieldName("access_token")).toBe("accesstoken");
    expect(truncateTelemetryString("ok")).toBe("ok");
    expect(
      truncateTelemetryString("x".repeat(telemetryMaximumStringLength + 1)).endsWith("[TRUNCATED]"),
    ).toBe(true);
    expect(summarizeTelemetryValue("å")).toEqual({ type: "string", bytes: 2 });
    expect(summarizeTelemetryValue(new URLSearchParams({ a: "1" }))).toEqual({
      type: "URLSearchParams",
      bytes: 3,
    });
    expect(summarizeTelemetryValue(new Blob(["abc"]))).toEqual({ type: "Blob", bytes: 3 });
    expect(summarizeTelemetryValue(new ArrayBuffer(4))).toEqual({ type: "ArrayBuffer", bytes: 4 });
    expect(summarizeTelemetryValue(new Uint8Array(3))).toEqual({
      type: "ArrayBufferView",
      bytes: 3,
    });
    expect(summarizeTelemetryValue(new FormData())).toEqual({ type: "FormData", bytes: undefined });
    expect(summarizeTelemetryValue(new ReadableStream())).toEqual({
      type: "ReadableStream",
      bytes: undefined,
    });
    expect(summarizeTelemetryValue(new Date())).toEqual({ type: "Object", bytes: undefined });
    expect(summarizeTelemetryValue(Symbol("value"))).toEqual({
      type: "symbol",
      bytes: undefined,
    });

    const circular: Record<string, unknown> = { token: "secret", nested: { ok: true } };
    circular.self = circular;
    expect(sanitizeTelemetryValue(circular)).toEqual({
      token: "[REDACTED]",
      nested: { ok: true },
      self: "[CIRCULAR]",
    });
    expect(sanitizeTelemetryValue({ value: 1 }, telemetryMaximumDepth)).toBe("[TRUNCATED]");
    expect(sanitizeTelemetryValue(Symbol("value"))).toEqual({ type: "symbol", bytes: undefined });
    expect(sanitizeTelemetryValue(new Date(0))).toEqual({ type: "Object", bytes: undefined });
    const sparse = new Array(2);
    sparse[1] = "value";
    expect(sanitizeTelemetryValue(sparse)).toEqual(["[TRUNCATED]", "value"]);
    const getter: Record<string, unknown> = {};
    Object.defineProperty(getter, "value", { enumerable: true, get: () => "secret" });
    expect(sanitizeTelemetryValue(getter)).toEqual({ value: "[TRUNCATED]" });
    const many = Array.from({ length: telemetryMaximumCollectionSize + 1 }, (_, index) => index);
    expect(sanitizeTelemetryValue(many)).toHaveLength(telemetryMaximumCollectionSize);
    expect((sanitizeTelemetryValue(many) as unknown[]).at(-1)).toBe("[TRUNCATED]");
    expect(sanitizeTelemetryBody("secret")).toEqual({ type: "string", bytes: 6 });
    expect(sanitizeTelemetryBody(["safe"])).toEqual({ type: "JSON", bytes: undefined });
    expect(sanitizeTelemetryHeaders({ Authorization: "secret", Accept: "json" })).toEqual({
      accept: "json",
      authorization: "[REDACTED]",
    });
    expect(sanitizeTelemetryUrl("https://api.test/a?q=secret#fragment")).toBe(
      "https://api.test/a?q=[REDACTED]",
    );
  });

  it("isolates hook failures and emits immutable lifecycle events", async () => {
    const hookErrors: string[] = [];
    await invokeTelemetryHook(
      { onHookError: (_error, hook) => hookErrors.push(hook) },
      "request",
      () => {
        throw new Error("observer");
      },
      Object.freeze({}),
    );
    expect(hookErrors).toEqual(["request"]);
    await expect(
      invokeTelemetryHook(undefined, "request", undefined, Object.freeze({})),
    ).resolves.toBeUndefined();
    await expect(
      invokeTelemetryHook(
        {
          onHookError: () => {
            throw new Error("secondary");
          },
        },
        "error",
        () => {
          throw new Error("primary");
        },
        Object.freeze({}),
      ),
    ).resolves.toBeUndefined();

    vi.stubGlobal("crypto", {});
    expect(() => resolveLogicalRequestId(new Headers())).toThrowError(
      expect.objectContaining({ code: "API_CRYPTO_UNAVAILABLE" }),
    );
    vi.unstubAllGlobals();

    const events: unknown[] = [];
    const telemetry = {
      onRequest: (event: unknown) => {
        events.push(event);
      },
      onResponse: (event: unknown) => {
        events.push(event);
      },
      onError: (event: unknown) => {
        events.push(event);
      },
    };
    const prepared = {
      url: "https://api.test/items?token=secret",
      attempt: 1,
      init: { headers: { Authorization: "secret" } },
    };
    await emitRequestTelemetry(
      telemetry,
      "r1",
      "POST",
      prepared,
      { password: "secret" },
      Date.now(),
    );
    await emitResponseTelemetry(
      telemetry,
      "r1",
      "POST",
      prepared,
      new Response(null, { status: 201 }),
      Date.now(),
    );
    await emitErrorTelemetry(
      telemetry,
      "r1",
      "POST",
      prepared,
      new MiaixzSdkError({ code: "SDK_DESTROYED" }),
      Date.now(),
    );
    expect(events).toHaveLength(3);
    for (const event of events) expect(Object.isFrozen(event)).toBe(true);
    expect(events[0]).toMatchObject({
      url: "https://api.test/items?token=[REDACTED]",
      headers: { authorization: "[REDACTED]" },
      bodySummary: { type: "JSON", bytes: undefined },
    });
    expect(events[0]).not.toHaveProperty("body");
    expect(events[1]).toMatchObject({ status: 201 });
    expect(events[2]).toMatchObject({ error: { code: "SDK_DESTROYED" } });
  });
});

describe("API client execution", () => {
  it("applies authoritative CSRF policy", async () => {
    const headers = new Headers({ "x-csrf-token": "caller" });
    await applyCsrfPolicy(headers, "GET", { required: true, tokenProvider: () => "server" });
    expect(headers.has("x-csrf-token")).toBe(false);
    await applyCsrfPolicy(headers, "POST", { required: true, tokenProvider: () => " server " });
    expect(headers.get("x-csrf-token")).toBe("server");
    await expect(applyCsrfPolicy(new Headers(), "POST", { required: true })).rejects.toMatchObject({
      code: "CSRF_TOKEN_MISSING",
    });
    await expect(
      applyCsrfPolicy(new Headers(), "POST", {
        required: true,
        tokenProvider: () => {
          throw new Error("secret");
        },
      }),
    ).rejects.toMatchObject({ code: "CSRF_TOKEN_MISSING" });
    await expect(
      applyCsrfPolicy(new Headers(), "POST", { required: false }),
    ).resolves.toBeUndefined();
  });

  it("executes facades, providers, interceptors, and parsing in order", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const client = createApiClient({
      baseUrl: "https://api.test/v1",
      headers: { "x-default": "one" },
      authorizationProvider: () => "Custom token",
      tokenProvider: () => "ignored",
      contextHeadersProvider: () => ({ "x-demo-context": "zh-CN" }),
      requestInterceptors: [
        (request) => ({
          ...request,
          url: `${request.url}${request.url.includes("?") ? "&" : "?"}intercepted=1`,
          init: {
            ...request.init,
            headers: {
              ...Object.fromEntries(new Headers(request.init.headers)),
              "x-interceptor": "yes",
            },
          },
        }),
      ],
      responseInterceptors: [
        (response) => ({ ...response, data: { ...(response.data as object), intercepted: true } }),
      ],
      fetch: async (input, init) => {
        calls.push({ url: String(input), init: init ?? {} });
        return Response.json({ answer: 42 }, { headers: { "x-request-id": "response-id" } });
      },
    });
    expect(client.baseUrl).toBe("https://api.test/v1");
    const response = await client.post(
      "items",
      { name: "Ada" },
      {
        query: { page: 2 },
        parse: (value) => {
          expect(value).toEqual({ answer: 42, intercepted: true });
          return (value as { answer: number }).answer;
        },
      },
    );
    expect(response).toMatchObject({ data: 42, requestId: "response-id", status: 200 });
    expect(calls[0]?.url).toBe("https://api.test/v1/items?page=2&intercepted=1");
    const headers = new Headers(calls[0]?.init.headers);
    expect(headers.get("authorization")).toBe("Custom token");
    expect(headers.get("x-demo-context")).toBe("zh-CN");
    expect(headers.get("x-interceptor")).toBe("yes");
    expect(calls[0]?.init.redirect).toBe("error");
    expect(calls[0]?.init.body).toBe('{"name":"Ada"}');
  });

  it("supports all convenience methods and explicit response modes", async () => {
    const methods: string[] = [];
    const client = createApiClient({
      baseUrl: "https://api.test",
      fetch: async (_input, init) => {
        methods.push(String(init?.method));
        return new Response("ok", { headers: { "content-type": "text/plain" } });
      },
    });
    await client.get("/one", { responseType: "text" });
    await client.post("/two", undefined, { responseType: "text" });
    await client.put("/three", { a: 1 }, { responseType: "text" });
    await client.patch("/four", { a: 1 }, { responseType: "text" });
    await client.delete("/five", { responseType: "text" });
    await client.request("/six", { responseType: "text" });
    expect(methods).toEqual(["GET", "POST", "PUT", "PATCH", "DELETE", "GET"]);
  });

  it("uses token authentication without overwriting caller headers or context", async () => {
    const captured: Headers[] = [];
    const client = createApiClient({
      baseUrl: "https://api.test",
      tokenProvider: () => "provider-token",
      contextHeadersProvider: () => ({ "x-demo-context": "provider-locale", "x-extra": "extra" }),
      fetch: async (_input, init) => {
        captured.push(new Headers(init?.headers));
        return Response.json(true);
      },
    });
    await client.get("/one");
    await client.get("/two", {
      headers: { Authorization: "Caller token", "x-demo-context": "caller-locale" },
    });
    expect(captured[0]?.get("authorization")).toBe("Bearer provider-token");
    expect(captured[0]?.get("x-extra")).toBe("extra");
    expect(captured[1]?.get("authorization")).toBe("Caller token");
    expect(captured[1]?.get("x-demo-context")).toBe("caller-locale");
  });

  it("retries HTTP and network failures without interpreting successful payloads", async () => {
    vi.useFakeTimers();
    const httpFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json(
          { code: "BUSY", message: "again" },
          { status: 503, headers: { "retry-after": "0" } },
        ),
      )
      .mockResolvedValueOnce(Response.json("done"));
    const mapper = vi.fn<MiaixzHttpErrorMapper>(() => ({ code: "MAPPED" }));
    const onRequest = vi.fn();
    const onResponse = vi.fn();
    const onError = vi.fn();
    const pending = createApiClient({
      baseUrl: "https://api.test",
      fetch: httpFetch,
      retry: 1,
      httpErrorMapper: mapper,
      telemetry: { onRequest, onResponse, onError },
    }).get("/retry");
    const result = expect(pending).resolves.toMatchObject({ data: "done" });
    await vi.runAllTimersAsync();
    await result;
    expect(httpFetch).toHaveBeenCalledTimes(2);
    expect(mapper).toHaveBeenCalledTimes(1);
    expect(mapper.mock.calls[0]?.[1]).toEqual({ status: 503 });
    expect(onResponse.mock.calls[0]?.[0]).toMatchObject({ status: 503 });
    expect(onRequest).toHaveBeenCalledTimes(2);
    expect(onResponse).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toMatchObject({
      error: { name: "MiaixzApiError", code: "MAPPED" },
    });

    const networkFetch = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(Response.json("online"));
    const networkPending = createApiClient({
      baseUrl: "https://api.test",
      fetch: networkFetch,
      retry: 1,
    }).get("/network");
    const networkResult = expect(networkPending).resolves.toMatchObject({ data: "online" });
    await vi.runAllTimersAsync();
    await networkResult;
    expect(networkFetch).toHaveBeenCalledTimes(2);

    const successMapper = vi.fn<MiaixzHttpErrorMapper>(() => ({ code: "UNUSED" }));
    const successFetch = vi.fn<typeof fetch>(async () =>
      Response.json({ code: "NONZERO", desc: "opaque" }),
    );
    const success = createApiClient({
      baseUrl: "https://api.test",
      fetch: successFetch,
      retry: 2,
      httpErrorMapper: successMapper,
    });
    await expect(success.get("/opaque")).resolves.toMatchObject({
      data: { code: "NONZERO", desc: "opaque" },
    });
    expect(successFetch).toHaveBeenCalledTimes(1);
    expect(successMapper).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON, HTTP errors, and cross-origin interceptors", async () => {
    const invalidJson = createApiClient({
      baseUrl: "https://api.test",
      fetch: async () => new Response("{", { headers: { "content-type": "application/json" } }),
    });
    await expect(invalidJson.get("/invalid-json")).rejects.toMatchObject({
      code: "API_RESPONSE_INVALID",
    });

    const http = createApiClient({
      baseUrl: "https://api.test",
      fetch: async () => new Response("not json", { status: 404 }),
    });
    await expect(http.get("/missing")).rejects.toMatchObject({ code: "HTTP_404", status: 404 });

    const crossOrigin = createApiClient({
      baseUrl: "https://api.test",
      requestInterceptors: [(request) => ({ ...request, url: "https://evil.test/steal" })],
      fetch: async () => Response.json(null),
    });
    await expect(crossOrigin.get("/safe")).rejects.toMatchObject({
      code: "API_REQUEST_ORIGIN_INVALID",
    });
    expect(() => createApiClient({ baseUrl: "not-a-url" })).toThrowError(MiaixzApiError);
    vi.stubGlobal("fetch", undefined);
    expect(() => createApiClient({ baseUrl: "https://api.test" })).toThrowError(
      expect.objectContaining({ code: "FETCH_UNAVAILABLE" }),
    );
  });

  it("executes the lower-level request with authentication disabled", async () => {
    let captured: RequestInit | undefined;
    await executeMiaixzApiRequest(
      {
        baseUrl: "https://api.test",
        authorizationProvider: () => "Bearer secret",
        contextHeadersProvider: () => ({ "x-demo-context": "user" }),
      },
      "https://api.test",
      async (_input, init) => {
        captured = init;
        return new Response(null, { status: 204 });
      },
      "/public",
      { authenticate: false, includeContext: false, responseType: "void" },
    );
    const headers = new Headers(captured?.headers);
    expect(headers.has("authorization")).toBe(false);
    expect(headers.has("x-demo-context")).toBe(false);
    expect(captured?.redirect).toBe("follow");
  });

  it.each([
    { payload: null },
    { payload: [1, "two"] },
    { payload: "plain" },
    { payload: { value: 1 } },
    { payload: { code: "0", desc: "opaque", data: "nested" } },
    { payload: { code: "NONZERO", desc: "opaque", data: null } },
    { payload: { code: 7, desc: false, extra: true } },
  ])(
    "preserves successful JSON payloads without shape inference: $payload",
    async ({ payload }) => {
      const client = createApiClient({
        baseUrl: "https://api.test",
        fetch: async () => Response.json(payload),
      });
      const response = await client.get("/payload");
      expect(response.data).toEqual(payload);
    },
  );

  it.each([204, 205])("preserves empty HTTP %i responses", async (status) => {
    const client = createApiClient({
      baseUrl: "https://api.test",
      fetch: async () => new Response(null, { status }),
    });
    await expect(client.get("/empty")).resolves.toMatchObject({ data: undefined, status });
  });

  it("returns undefined for an empty JSON HEAD response", async () => {
    const client = createApiClient({
      baseUrl: "https://api.test",
      fetch: async () => new Response(null, { headers: { "content-type": "application/json" } }),
    });
    await expect(client.request("/empty", { method: "HEAD" })).resolves.toMatchObject({
      data: undefined,
      status: 200,
    });
  });
});

describe("API HTTP error mapping", () => {
  const body = { code: "BODY", requestId: "body-id", message: "body-message" };
  const replacementCases: ReadonlyArray<{
    readonly name: string;
    readonly mapped: MiaixzHttpErrorDetails;
    readonly code: string;
    readonly requestId: string;
    readonly serverMessage?: string;
  }> = [
    { name: "one field", mapped: { code: "MAPPED" }, code: "MAPPED", requestId: "header-id" },
    { name: "empty object", mapped: {}, code: "HTTP_400", requestId: "header-id" },
    {
      name: "correlation and message only",
      mapped: { requestId: "mapped-id", serverMessage: "mapped-message" },
      code: "HTTP_400",
      requestId: "mapped-id",
      serverMessage: "mapped-message",
    },
  ];

  it.each(replacementCases)("replaces all generic details with $name", async (testCase) => {
    const mapper = vi.fn<MiaixzHttpErrorMapper>(() => testCase.mapped);
    const client = createApiClient({
      baseUrl: "https://api.test",
      httpErrorMapper: mapper,
      fetch: async () =>
        Response.json(body, {
          status: 400,
          headers: { "x-request-id": "header-id" },
        }),
    });
    const error: unknown = await client.get("/problem").catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(MiaixzApiError);
    const apiError = error as MiaixzApiError;
    expect(apiError.code).toBe(testCase.code);
    expect(apiError.requestId).toBe(testCase.requestId);
    expect(apiError.serverMessage).toBe(testCase.serverMessage);
    expect(apiError.status).toBe(400);
    expect(apiError.retryable).toBe(false);
    expect(mapper).toHaveBeenCalledTimes(1);
    expect(mapper.mock.calls[0]?.[0]).toEqual(body);
    const status = mapper.mock.calls[0]?.[1];
    expect(status).toEqual({ status: 400 });
    expect(Object.isFrozen(status)).toBe(true);
    expect(Reflect.ownKeys(status ?? {})).toEqual(["status"]);
  });

  it("accepts null-prototype details and treats omitted known fields as a replacement", () => {
    const response = new Response(null, { status: 400 });
    const mapped: unknown = Object.assign(Object.create(null) as object, {
      code: "MAPPED",
      requestId: "mapped-id",
      serverMessage: "mapped-message",
    });
    expect(extractProblem(body, response, (() => mapped) as MiaixzHttpErrorMapper)).toEqual({
      code: "MAPPED",
      requestId: "mapped-id",
      serverMessage: "mapped-message",
    });
    const omitted = (() => ({
      code: undefined,
      requestId: undefined,
      serverMessage: undefined,
    })) as unknown as MiaixzHttpErrorMapper;
    expect(extractProblem(body, response, omitted)).toEqual({});
  });

  const fallbackCases: ReadonlyArray<{
    readonly name: string;
    readonly mapper: () => unknown;
  }> = [
    { name: "undefined", mapper: () => undefined },
    { name: "null", mapper: () => null },
    { name: "array", mapper: () => [] },
    { name: "primitive", mapper: () => "MAPPED" },
    { name: "numeric code", mapper: () => ({ code: 1 }) },
    { name: "numeric request ID", mapper: () => ({ requestId: 1 }) },
    { name: "numeric message", mapper: () => ({ serverMessage: 1 }) },
    { name: "status override", mapper: () => ({ code: "MAPPED", status: 200 }) },
    { name: "retry override", mapper: () => ({ code: "MAPPED", retryable: true }) },
    { name: "unknown field", mapper: () => ({ code: "MAPPED", extra: true }) },
    { name: "symbol field", mapper: () => ({ [Symbol("extra")]: true }) },
    { name: "promise", mapper: () => Promise.resolve({ code: "MAPPED" }) },
    { name: "thenable", mapper: () => ({ then: () => undefined }) },
    { name: "non-plain object", mapper: () => new Date(0) },
    {
      name: "reflection failure",
      mapper: () =>
        new Proxy(
          {},
          {
            getPrototypeOf: () => {
              throw new Error("private reflection failure");
            },
          },
        ),
    },
    {
      name: "mapper exception",
      mapper: () => {
        throw new Error("private mapper failure");
      },
    },
  ];

  it.each(fallbackCases)(
    "falls back safely for $name without network retries",
    async ({ mapper }) => {
      const mapError = vi.fn(mapper);
      const fetchImplementation = vi.fn<typeof fetch>(async () =>
        Response.json(body, {
          status: 400,
          headers: { "x-request-id": "header-id" },
        }),
      );
      const client = createApiClient({
        baseUrl: "https://api.test",
        httpErrorMapper: mapError as unknown as MiaixzHttpErrorMapper,
        fetch: fetchImplementation,
        retry: 2,
      });
      const error: unknown = await client.get("/problem").catch((cause: unknown) => cause);
      expect(error).toBeInstanceOf(MiaixzApiError);
      expect(error).toMatchObject({
        code: "BODY",
        status: 400,
        requestId: "body-id",
        serverMessage: "body-message",
        retryable: false,
      });
      expect((error as MiaixzApiError).cause).toBeUndefined();
      expect((error as MiaixzApiError).message).not.toContain("private");
      expect(fetchImplementation).toHaveBeenCalledTimes(1);
      expect(mapError).toHaveBeenCalledTimes(1);
    },
  );

  it("rejects accessor results without invoking their getters", () => {
    const getter = vi.fn(() => "private getter value");
    const mapped: Record<string, unknown> = {};
    Object.defineProperty(mapped, "code", { enumerable: true, get: getter });
    const mapper = (() => mapped) as unknown as MiaixzHttpErrorMapper;
    expect(extractProblem(body, new Response(null, { status: 400 }), mapper)).toEqual({
      code: "BODY",
      requestId: "body-id",
      serverMessage: "body-message",
    });
    expect(getter).not.toHaveBeenCalled();
  });

  it("preserves generic details when no mapper is installed", async () => {
    const client = createApiClient({
      baseUrl: "https://api.test",
      fetch: async () =>
        Response.json(body, {
          status: 400,
          headers: { "x-request-id": "header-id" },
        }),
    });
    await expect(client.get("/problem")).rejects.toMatchObject({
      code: "BODY",
      status: 400,
      requestId: "body-id",
      serverMessage: "body-message",
      retryable: false,
    });
  });

  it("uses HTTP status and an absent correlation ID when no details exist", async () => {
    const client = createApiClient({
      baseUrl: "https://api.test",
      httpErrorMapper: () => ({}),
      fetch: async () => Response.json(body, { status: 418 }),
    });
    const error: unknown = await client.get("/problem").catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(MiaixzApiError);
    expect(error).toMatchObject({ code: "HTTP_418", status: 418, retryable: false });
    expect((error as MiaixzApiError).requestId).toBeUndefined();
    expect((error as MiaixzApiError).serverMessage).toBeUndefined();
  });

  it.each([
    { name: "text", text: "unavailable", contentType: "text/plain", parsed: "unavailable" },
    {
      name: "HTML",
      text: "<h1>unavailable</h1>",
      contentType: "text/html",
      parsed: "<h1>unavailable</h1>",
    },
    { name: "malformed JSON", text: "{", contentType: "application/json", parsed: undefined },
  ])("keeps $name failures in the HTTP branch", async ({ text, contentType, parsed }) => {
    const mapper = vi.fn<MiaixzHttpErrorMapper>(() => undefined);
    const fetchImplementation = vi.fn<typeof fetch>(
      async () =>
        new Response(text, {
          status: 400,
          headers: { "content-type": contentType, "x-request-id": "header-id" },
        }),
    );
    const client = createApiClient({
      baseUrl: "https://api.test",
      fetch: fetchImplementation,
      httpErrorMapper: mapper,
      retry: 2,
    });
    await expect(client.get("/problem", { responseType: "void" })).rejects.toMatchObject({
      code: "HTTP_400",
      status: 400,
      requestId: "header-id",
      retryable: false,
    });
    expect(mapper).toHaveBeenCalledWith(parsed, { status: 400 });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it.each([401, 403, 404, 408, 429, 500, 502, 503, 504])(
    "keeps HTTP %i authoritative over mapped details",
    async (status) => {
      const fetchImplementation = vi.fn<typeof fetch>(async () =>
        Response.json({ code: "0", data: true }, { status }),
      );
      const client = createApiClient({
        baseUrl: "https://api.test",
        httpErrorMapper: () => ({ code: "MAPPED" }),
        fetch: fetchImplementation,
        retry: [401, 403, 404].includes(status) ? 2 : 0,
      });
      await expect(client.get("/problem")).rejects.toMatchObject({
        code: "MAPPED",
        status,
        retryable: [408, 429, 500, 502, 503, 504].includes(status),
      });
      expect(fetchImplementation).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["POST", "PATCH", "OPTIONS"] as const)(
    "does not retry %s despite a retryable HTTP status",
    async (method) => {
      const fetchImplementation = vi.fn<typeof fetch>(async () =>
        Response.json(
          {},
          {
            status: 503,
            headers: { "retry-after": "0" },
          },
        ),
      );
      const client = createApiClient({
        baseUrl: "https://api.test",
        fetch: fetchImplementation,
        httpErrorMapper: () => ({}),
        retry: 1,
      });
      await expect(client.request("/problem", { method })).rejects.toMatchObject({
        code: "HTTP_503",
        status: 503,
        retryable: true,
      });
      expect(fetchImplementation).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["GET", "HEAD", "PUT", "DELETE"] as const)(
    "retains status-based retries for %s",
    async (method) => {
      vi.useFakeTimers();
      const fetchImplementation = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(Response.json({}, { status: 503, headers: { "retry-after": "0" } }))
        .mockResolvedValueOnce(new Response(null, { status: 204 }));
      const client = createApiClient({
        baseUrl: "https://api.test",
        fetch: fetchImplementation,
        httpErrorMapper: () => ({ code: "MAPPED" }),
        retry: 1,
      });
      const result = expect(client.request("/retry", { method })).resolves.toMatchObject({
        data: undefined,
        status: 204,
      });
      await vi.runAllTimersAsync();
      await result;
      expect(fetchImplementation).toHaveBeenCalledTimes(2);
    },
  );
});

describe("API context header protection", () => {
  it.each([
    { names: null },
    { names: "x-demo-context" },
    { names: [1] },
    { names: [""] },
    { names: ["bad name"] },
    { names: ["bad:name"] },
    { names: ["bad\r\nname"] },
  ])("rejects invalid configured header names: $names", ({ names }) => {
    expect(() =>
      createApiClient({
        baseUrl: "https://api.test",
        contextHeaderNames: names as unknown as readonly string[],
        fetch: async () => Response.json(null),
      }),
    ).toThrowError(TypeError);
  });

  it("copies and normalizes configured names at construction", async () => {
    const names = ["X-Demo-Context", "x-demo-context"];
    const captured: RequestInit[] = [];
    const client = createApiClient({
      baseUrl: "https://api.test",
      credentials: "omit",
      contextHeaderNames: names,
      fetch: async (_input, init) => {
        captured.push(init ?? {});
        return Response.json(null);
      },
    });
    names.splice(0, names.length, "X-Other");
    await client.get("/protected", {
      authenticate: false,
      includeContext: false,
      headers: { "x-demo-context": "manual" },
    });
    await client.get("/unprotected", {
      authenticate: false,
      includeContext: false,
      headers: { "x-other": "later" },
    });
    await client.get("/empty", { authenticate: false, includeContext: false });
    expect(captured.map((init) => init.redirect)).toEqual(["error", "follow", "follow"]);
    expect(new Headers(captured[0]?.headers).get("x-demo-context")).toBe("manual");
    expect(new Headers(captured[1]?.headers).get("x-other")).toBe("later");
  });

  it("protects actual provider names without a configured list", async () => {
    let captured: RequestInit | undefined;
    const provider = vi.fn(() => ({ "x-provider-context": "provided" }));
    const client = createApiClient({
      baseUrl: "https://api.test",
      credentials: "omit",
      contextHeadersProvider: provider,
      fetch: async (_input, init) => {
        captured = init;
        return Response.json(null);
      },
    });
    await client.get("/provided", { authenticate: false });
    expect(provider).toHaveBeenCalledTimes(1);
    expect(new Headers(captured?.headers).get("x-provider-context")).toBe("provided");
    expect(captured?.redirect).toBe("error");
  });

  it.each([true, false])(
    "protects manual configured headers when includeContext is %s",
    async (includeContext) => {
      let captured: RequestInit | undefined;
      const provider = vi.fn(() => undefined);
      const client = createApiClient({
        baseUrl: "https://api.test",
        credentials: "omit",
        contextHeaderNames: ["x-demo-context"],
        contextHeadersProvider: provider,
        fetch: async (_input, init) => {
          captured = init;
          return Response.json(null);
        },
      });
      await client.get("/manual", {
        authenticate: false,
        includeContext,
        headers: { "x-demo-context": "manual" },
      });
      expect(provider).toHaveBeenCalledTimes(includeContext ? 1 : 0);
      expect(new Headers(captured?.headers).get("x-demo-context")).toBe("manual");
      expect(captured?.redirect).toBe("error");
    },
  );

  it("overrides a final interceptor's follow mode after it adds a protected header", async () => {
    let captured: RequestInit | undefined;
    const client = createApiClient({
      baseUrl: "https://api.test",
      credentials: "omit",
      contextHeaderNames: ["x-final-context"],
      requestInterceptors: [
        (request) => ({ ...request, init: { ...request.init, redirect: "follow" } }),
        (request) => {
          const headers = new Headers(request.init.headers);
          headers.set("x-final-context", "intercepted");
          return { ...request, init: { ...request.init, headers, redirect: "follow" } };
        },
      ],
      fetch: async (_input, init) => {
        captured = init;
        return Response.json(null);
      },
    });
    await client.get("/intercepted", { authenticate: false, includeContext: false });
    expect(new Headers(captured?.headers).get("x-final-context")).toBe("intercepted");
    expect(captured?.credentials).toBe("omit");
    expect(captured?.redirect).toBe("error");
  });

  it("follows after a later interceptor removes the last protected header", async () => {
    let captured: RequestInit | undefined;
    const client = createApiClient({
      baseUrl: "https://api.test",
      credentials: "omit",
      contextHeaderNames: ["x-final-context"],
      contextHeadersProvider: () => ({ "x-provider-context": "provided" }),
      requestInterceptors: [
        (request) => {
          const headers = new Headers(request.init.headers);
          headers.set("x-final-context", "intermediate");
          return { ...request, init: { ...request.init, headers, redirect: "error" } };
        },
        (request) => {
          const headers = new Headers(request.init.headers);
          headers.delete("x-final-context");
          headers.delete("x-provider-context");
          return { ...request, init: { ...request.init, headers, redirect: "error" } };
        },
      ],
      fetch: async (_input, init) => {
        captured = init;
        return Response.json(null);
      },
    });
    await client.get("/removed", { authenticate: false });
    const headers = new Headers(captured?.headers);
    expect(headers.has("x-final-context")).toBe(false);
    expect(headers.has("x-provider-context")).toBe(false);
    expect(captured?.credentials).toBe("omit");
    expect(captured?.redirect).toBe("follow");
  });
});
