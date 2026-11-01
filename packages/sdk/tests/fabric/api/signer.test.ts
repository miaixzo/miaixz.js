/**
 * Verifies deterministic REST gateway canonicalization and authentication-dependent signing.
 */

import assert from "node:assert/strict";
import { test } from "vitest";

import { createApiClient, RestGatewayClient, RestSigner } from "../../../src/fabric/api/index.js";

const timestamp = "1735689600000";

test("legacy login signature matches the fixed protocol vector", async () => {
  const signer = new RestSigner();
  const signature = await signer.sign({
    httpMethod: "POST",
    parameters: {
      method: "dp.auth.login",
      v: "1.0",
      format: "json",
      timestamp,
      email: " User+测试@example.com ",
      password: "0123456789abcdef",
    },
    auth: { mode: "legacy" },
  });

  assert.equal(signature, "fLZWPF1zStL5rMEeSvxMQjm9CjS56bcCglVsbTwkytc=");
});

test("V1 token signature matches the fixed protocol vector", async () => {
  const signer = new RestSigner();
  const signature = await signer.sign({
    httpMethod: "GET",
    parameters: {
      method: "dp.user.get",
      v: "1.0",
      format: "json",
      timestamp,
      "a!": "x y",
      nested: { z: "值", a: true },
    },
    auth: {
      mode: "v1-token",
      token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature",
    },
  });

  assert.equal(signature, "FJKVvM+JVB0AMrnL07bdQYw4AHwHC92dpZY5ZFD9efo=");
});

test("V1 token and API key signatures match the published protocol vectors", async () => {
  const signer = new RestSigner();
  const parameters = {
    method: "test.sign.v1",
    timestamp: "1786464000123",
    format: "json",
    v: "1.0",
  };

  await assert.doesNotReject(async () => {
    assert.equal(
      await signer.sign({
        httpMethod: "GET",
        parameters,
        auth: {
          mode: "v1-token",
          token: "eyJhbGciOiJub25lIn0.eyJzdWIiOiJ0ZXN0In0.c2ln",
        },
      }),
      "zFZwPVeS9odIa2F7u0QOKSIKPeupjKnRPOSjr0IjW3g=",
    );
    assert.equal(
      await signer.sign({
        httpMethod: "GET",
        parameters,
        auth: { mode: "v1-apikey", apiKey: "test-api-key-2026" },
      }),
      "tTu9C8xHZOp1vk/ktXldbQdz3Fkrx2axORJ2n36LjPo=",
    );
  });
});

test("sign is excluded case-insensitively and parameter input is not mutated", async () => {
  const parameters = Object.freeze({
    method: "dp.auth.login",
    v: "1.0",
    format: "json",
    timestamp,
    Sign: "ignored",
  });
  const signer = new RestSigner();

  const withSign = await signer.sign({ httpMethod: "POST", parameters, auth: { mode: "legacy" } });
  const withoutSign = await signer.sign({
    httpMethod: "POST",
    parameters: { method: "dp.auth.login", v: "1.0", format: "json", timestamp },
    auth: { mode: "legacy" },
  });

  assert.equal(withSign, withoutSign);
  assert.equal(parameters.Sign, "ignored");
});

test("invalid credentials and unsupported values fail with stable error codes", async () => {
  const signer = new RestSigner();
  const base = { method: "dp.user.get", v: "1.0", format: "json", timestamp };

  await assert.rejects(
    signer.sign({
      httpMethod: "GET",
      parameters: base,
      auth: { mode: "v1-token", token: "not-a-jwt" },
    }),
    { code: "REST_SIGNATURE_CREDENTIAL_INVALID" },
  );
  await assert.rejects(
    signer.sign({
      httpMethod: "GET",
      parameters: { ...base, invalid: Number.NaN },
      auth: { mode: "legacy" },
    }),
    { code: "REST_SIGNATURE_PARAMETER_INVALID" },
  );
  await assert.rejects(
    signer.sign({
      httpMethod: "GET",
      parameters: { ...base, invalid: null as unknown as string },
      auth: { mode: "legacy" },
    }),
    { code: "REST_SIGNATURE_PARAMETER_INVALID" },
  );
  await assert.rejects(
    signer.sign({
      httpMethod: "GET",
      parameters: base,
      auth: { mode: "v1-token", token: "" },
    }),
    { code: "REST_SIGNATURE_CREDENTIAL_REQUIRED" },
  );
});

test("gateway adapter signs one snapshot and omits browser credentials", async () => {
  let captured: { readonly input: string; readonly init: RequestInit } | undefined;
  const api = createApiClient({
    baseUrl: "https://dev.example.com/router/rest",
    fetch: async (input, init) => {
      captured = { input: String(input), init: init ?? {} };
      return new Response(JSON.stringify({ code: "0", desc: "ok", data: { accepted: true } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  const gateway = new RestGatewayClient({ api, now: () => Number(timestamp) });
  const response = await gateway.request({
    httpMethod: "POST",
    parameters: { method: "dp.auth.login", v: "1.0", format: "json" },
    auth: { mode: "legacy" },
    parse: (value) => value,
  });

  assert.deepEqual(response.data, { accepted: true });
  assert(captured);
  assert.equal(captured.input, "https://dev.example.com/router/rest");
  assert.equal(captured.init.credentials, "omit");
  assert.equal(new Headers(captured.init.headers).get("authorization"), null);
  const serializedBody = captured.init.body;
  if (typeof serializedBody !== "string") throw new TypeError("Expected a serialized body");
  const body = JSON.parse(serializedBody);
  assert.equal(body.timestamp, timestamp);
  assert.equal(typeof body.sign, "string");
  assert.equal(body.method, "dp.auth.login");
});

test("gateway adapter reports the HTTP and business session-expiration signals", async () => {
  let calls = 0;
  const expired: boolean[] = [];
  const api = createApiClient({
    baseUrl: "https://dev.example.com/router/rest",
    fetch: async () => {
      calls += 1;
      if (calls === 1) {
        return Response.json({ code: "100160", desc: "expired" });
      }
      return Response.json({ code: "100160", desc: "unauthorized" }, { status: 401 });
    },
  });
  const gateway = new RestGatewayClient({
    api,
    now: () => Number(timestamp),
    onAuthenticationExpired: () => expired.push(true),
  });
  const request = {
    httpMethod: "GET",
    parameters: { method: "dp.user.get", v: "1.0", format: "json" },
    auth: {
      mode: "v1-token",
      token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature",
    },
  } as const;

  await assert.rejects(gateway.request(request), { code: "100160" });
  await assert.rejects(gateway.request(request), { status: 401 });
  assert.equal(expired.length, 2);
});

test("gateway adapter preserves a data-less legacy business error", async () => {
  const api = createApiClient({
    baseUrl: "https://dev.example.com/router/rest",
    fetch: async () => Response.json({ code: "100100", desc: "Invalid username or password" }),
  });
  const gateway = new RestGatewayClient({ api, now: () => Number(timestamp) });

  await assert.rejects(
    gateway.request({
      httpMethod: "POST",
      parameters: { method: "dp.auth.login", v: "1.0", format: "json" },
      auth: { mode: "legacy" },
    }),
    { status: 200, code: "100100" },
  );
});

test("gateway adapter sends V1 API keys through X-API-Key", async () => {
  let headers: Headers | undefined;
  const api = createApiClient({
    baseUrl: "https://dev.example.com/router/rest",
    fetch: async (_input, init) => {
      headers = new Headers(init?.headers);
      return Response.json({ code: "0", desc: "ok", data: true });
    },
  });
  const gateway = new RestGatewayClient({ api, now: () => Number(timestamp) });

  await gateway.request({
    httpMethod: "GET",
    parameters: { method: "test.sign.v1", v: "1.0", format: "json" },
    auth: { mode: "v1-apikey", apiKey: "test-api-key-2026" },
  });

  assert(headers);
  assert.equal(headers.get("x-api-key"), "test-api-key-2026");
  assert.equal(headers.has("authorization"), false);
});

test("signer rejects every unsafe top-level parameter representation", async () => {
  const signer = new RestSigner();
  const base = { method: "test.sign", v: "1.0", format: "json", timestamp };
  const invalid: unknown[] = [
    [],
    { ...base, timestamp: "01" },
    { ...base, timestamp: "-1" },
    { ...base, timestamp: "9999999999999999" },
    { ...base, method: "" },
    { ...base, v: undefined },
    { ...base, number: Number.POSITIVE_INFINITY },
    { ...base, date: new Date() },
    { ...base, text: "\ud800" },
  ];
  const symbolRecord = { ...base, [Symbol("secret")]: "value" };
  invalid.push(symbolRecord);
  const getterRecord = { ...base } as Record<string, unknown>;
  Object.defineProperty(getterRecord, "getter", { enumerable: true, get: () => "value" });
  invalid.push(getterRecord);
  invalid.push({ ...base, Method: "duplicate" });

  for (const parameters of invalid) {
    await assert.rejects(
      signer.sign({
        httpMethod: "GET",
        parameters: parameters as never,
        auth: { mode: "legacy" },
      }),
      { code: "REST_SIGNATURE_PARAMETER_INVALID" },
    );
  }
  await assert.rejects(
    signer.sign({ httpMethod: "TRACE" as never, parameters: base, auth: { mode: "legacy" } }),
    { code: "REST_SIGNATURE_PARAMETER_INVALID" },
  );
  await assert.doesNotReject(
    signer.sign({
      httpMethod: "get" as never,
      parameters: { ...base, empty: "", enabled: false, count: 0 },
      auth: { mode: "legacy" },
    }),
  );
});

test("signer validates nested JSON values without invoking accessors", async () => {
  const signer = new RestSigner();
  const base = { method: "test.sign", v: "1.0", format: "json", timestamp };
  const cycle: Record<string, unknown> = {};
  cycle.self = cycle;
  const hole = new Array(2);
  hole[1] = "value";
  const getter: Record<string, unknown> = {};
  Object.defineProperty(getter, "value", { enumerable: true, get: () => "secret" });
  const symbol = { [Symbol("value")]: "secret" };
  const invalidNested = [
    { value: null },
    { value: undefined },
    { value: Number.NaN },
    { value: new Date() },
    cycle,
    hole,
    getter,
    symbol,
  ];
  for (const nested of invalidNested) {
    await assert.rejects(
      signer.sign({
        httpMethod: "POST",
        parameters: { ...base, nested } as never,
        auth: { mode: "legacy" },
      }),
      { code: "REST_SIGNATURE_PARAMETER_INVALID" },
    );
  }
  await assert.doesNotReject(
    signer.sign({
      httpMethod: "OPTIONS",
      parameters: {
        ...base,
        nested: { text: "value", enabled: true, count: 1, array: ["one", false, 2] },
      },
      auth: { mode: "legacy" },
    }),
  );
});

test("signer rejects invalid credential modes and bounds", async () => {
  const signer = new RestSigner();
  const parameters = { method: "test.sign", v: "1.0", format: "json", timestamp };
  const invalidAuth = [
    { mode: "unknown" },
    { mode: "v1-token", token: " " },
    { mode: "v1-token", token: "a.b\n.c" },
    { mode: "v1-token", token: "a".repeat(8_193) },
    { mode: "v1-apikey", apiKey: "" },
    { mode: "v1-apikey", apiKey: "包含中文" },
    { mode: "v1-apikey", apiKey: "a".repeat(513) },
  ];
  for (const auth of invalidAuth) {
    await assert.rejects(signer.sign({ httpMethod: "GET", parameters, auth: auth as never }), {
      code: /REST_SIGNATURE_(?:MODE_INVALID|CREDENTIAL_REQUIRED|CREDENTIAL_INVALID)/,
    });
  }
  await assert.doesNotReject(
    signer.sign({
      httpMethod: "HEAD",
      parameters,
      auth: { mode: "v1-apikey", apiKey: " key " },
    }),
  );
});

test("gateway rejects unsafe adapter inputs before dispatch", async () => {
  const api = createApiClient({
    baseUrl: "https://api.test",
    fetch: async () => Response.json({ code: "0", desc: "ok", data: true }),
  });
  const invalidClocks = [Number.NaN, -1, 1.5];
  for (const now of invalidClocks) {
    const gateway = new RestGatewayClient({ api, now: () => now });
    await assert.rejects(
      gateway.request({
        httpMethod: "GET",
        parameters: { method: "test.sign", v: "1.0", format: "json" },
        auth: { mode: "legacy" },
      }),
      { code: "REST_SIGNATURE_PARAMETER_INVALID" },
    );
  }

  const gateway = new RestGatewayClient({ api, now: () => Number(timestamp) });
  for (const parameters of [
    [],
    { method: "test.sign", v: "1.0", format: "json", timestamp: "caller" },
    { method: "test.sign", v: "1.0", format: "json", Sign: "caller" },
    { method: "test.sign", v: "1.0", format: "json", value: null },
    { method: "test.sign", v: "1.0", format: "json", value: Number.NaN },
    { method: "test.sign", v: "1.0", format: "json", value: new Date() },
  ]) {
    await assert.rejects(
      gateway.request({
        httpMethod: "GET",
        parameters: parameters as never,
        auth: { mode: "legacy" },
      }),
      { code: "REST_SIGNATURE_PARAMETER_INVALID" },
    );
  }
});
