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
  normalizeEnvelopeMode,
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
  expectsJsonEnvelope,
  extractProblem,
  isMiaixzApiFailureEnvelope,
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
import {
  isMiaixzApiEnvelope,
  isMiaixzApiSuccess,
  unwrapMiaixzData,
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
  it("normalizes endpoint, timeout, retry, and envelope contracts", () => {
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
    expect(normalizeEnvelopeMode("auto", undefined)).toBe("required");
    expect(normalizeEnvelopeMode("json", "optional")).toBe("optional");
    for (const responseType of ["text", "blob", "arrayBuffer", "void"] as const) {
      expect(normalizeEnvelopeMode(responseType, undefined)).toBe("none");
      expect(() => normalizeEnvelopeMode(responseType, "required")).toThrowError(
        expect.objectContaining({ code: "API_ENVELOPE_MODE_INVALID" }),
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
      ["X-Miaixz-Locale", "zh-CN"],
      ["X-Custom-Context", "one"],
    ] as const) {
      const headers = new Headers({ [name]: value });
      expect(
        resolveRedirectMode(headers, "same-origin", false, new Set([name.toLowerCase()])),
      ).toBe("error");
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
    expect(expectsJsonEnvelope(Response.json({}), "auto")).toBe(true);
    expect(
      expectsJsonEnvelope(new Response("x", { headers: { "content-type": "text/plain" } }), "auto"),
    ).toBe(false);
    expect(expectsJsonEnvelope(new Response(null, { status: 204 }), "json")).toBe(false);
    expect(expectsJsonEnvelope(new Response("x"), "text")).toBe(false);

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

  it("recognizes envelopes and extracts stable problem details", () => {
    expect(isMiaixzApiEnvelope({ code: "0", desc: "ok", data: 1 })).toBe(true);
    expect(isMiaixzApiEnvelope({ code: "1", desc: "bad", data: null })).toBe(true);
    expect(isMiaixzApiEnvelope({ code: 0, desc: "ok", data: 1 })).toBe(false);
    expect(isMiaixzApiEnvelope({ code: 0, desc: "ok" })).toBe(false);
    expect(isMiaixzApiEnvelope(null)).toBe(false);
    expect(isMiaixzApiEnvelope({ code: true, desc: "ok", data: 1 })).toBe(false);
    expect(isMiaixzApiEnvelope({ code: 0, desc: 1, data: 1 })).toBe(false);
    expect(isMiaixzApiFailureEnvelope({ code: "E_ONE", desc: "bad" })).toBe(true);
    expect(isMiaixzApiFailureEnvelope({ code: 0, desc: "bad" })).toBe(false);

    const response = new Response(null, { status: 400 });
    expect(extractProblem({ code: "8", desc: "business" }, response)).toEqual({
      code: "8",
      serverMessage: "business",
    });
    expect(extractProblem({ code: "0", desc: "ok", data: null }, response)).toEqual({
      code: "HTTP_400",
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

  it("executes facades, providers, interceptors, envelopes, and parsing", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const client = createApiClient({
      baseUrl: "https://api.test/v1",
      headers: { "x-default": "one" },
      authorizationProvider: () => "Custom token",
      tokenProvider: () => "ignored",
      contextHeadersProvider: () => ({ "x-miaixz-locale": "zh-CN" }),
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
        return Response.json(
          { code: "0", desc: "ok", data: { answer: 42 } },
          { headers: { "x-request-id": "response-id" } },
        );
      },
    });
    expect(client.baseUrl).toBe("https://api.test/v1");
    const response = await client.post(
      "items",
      { name: "Ada" },
      {
        query: { page: 2 },
        parse: (value) => (value as { answer: number; intercepted: boolean }).answer,
      },
    );
    expect(response).toMatchObject({ data: 42, requestId: "response-id", status: 200 });
    expect(calls[0]?.url).toBe("https://api.test/v1/items?page=2&intercepted=1");
    const headers = new Headers(calls[0]?.init.headers);
    expect(headers.get("authorization")).toBe("Custom token");
    expect(headers.get("x-miaixz-locale")).toBe("zh-CN");
    expect(headers.get("x-interceptor")).toBe("yes");
    expect(calls[0]?.init.redirect).toBe("error");
    expect(calls[0]?.init.body).toBe('{"name":"Ada"}');
  });

  it("supports all convenience methods and unwrapped response modes", async () => {
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
      contextHeadersProvider: () => ({ "x-miaixz-locale": "provider-locale", "x-extra": "extra" }),
      fetch: async (_input, init) => {
        captured.push(new Headers(init?.headers));
        return Response.json({ code: "0", desc: "ok", data: true });
      },
    });
    await client.get("/one");
    await client.get("/two", {
      headers: { Authorization: "Caller token", "x-miaixz-locale": "caller-locale" },
    });
    expect(captured[0]?.get("authorization")).toBe("Bearer provider-token");
    expect(captured[0]?.get("x-extra")).toBe("extra");
    expect(captured[1]?.get("authorization")).toBe("Caller token");
    expect(captured[1]?.get("x-miaixz-locale")).toBe("caller-locale");
  });

  it("retries retryable HTTP and network failures but not business failures", async () => {
    vi.useFakeTimers();
    const httpFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json(
          { code: "BUSY", message: "again" },
          { status: 503, headers: { "retry-after": "0" } },
        ),
      )
      .mockResolvedValueOnce(Response.json({ code: "0", desc: "ok", data: "done" }));
    const pending = createApiClient({
      baseUrl: "https://api.test",
      fetch: httpFetch,
      retry: 1,
    }).get("/retry");
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toMatchObject({ data: "done" });
    expect(httpFetch).toHaveBeenCalledTimes(2);

    const networkFetch = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(Response.json({ code: "0", desc: "ok", data: "online" }));
    const networkPending = createApiClient({
      baseUrl: "https://api.test",
      fetch: networkFetch,
      retry: 1,
    }).get("/network");
    await vi.runAllTimersAsync();
    await expect(networkPending).resolves.toMatchObject({ data: "online" });

    const business = createApiClient({
      baseUrl: "https://api.test",
      fetch: async () => Response.json({ code: "DENIED", desc: "no" }),
    });
    await expect(business.get("/business")).rejects.toMatchObject({
      code: "DENIED",
      retryable: false,
      serverMessage: "no",
    });
  });

  it("rejects invalid envelopes, parser values, HTTP errors, and cross-origin interceptors", async () => {
    const invalidEnvelope = createApiClient({
      baseUrl: "https://api.test",
      fetch: async () => Response.json({ value: 1 }),
    });
    await expect(invalidEnvelope.get("/invalid")).rejects.toMatchObject({
      code: "API_ENVELOPE_INVALID",
    });

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
      fetch: async () => Response.json({ code: "0", desc: "ok", data: null }),
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
        contextHeadersProvider: () => ({ "x-miaixz-user-id": "user" }),
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
    expect(headers.has("x-miaixz-user-id")).toBe(false);
    expect(captured?.redirect).toBe("follow");
  });

  it("recognizes success codes and unwraps only valid envelopes", () => {
    expect(isMiaixzApiSuccess({ code: 0 } as never)).toBe(false);
    expect(isMiaixzApiSuccess({ code: "0" })).toBe(true);
    expect(isMiaixzApiSuccess({ code: "1" })).toBe(false);
    expect(unwrapMiaixzData({ code: "0", desc: "ok", data: "value" })).toBe("value");
    expect(unwrapMiaixzData("plain")).toBe("plain");
  });
});
