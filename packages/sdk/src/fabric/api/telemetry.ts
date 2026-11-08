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
 * Builds immutable API lifecycle observations with bounded credential redaction.
 */

import { miaixzHeaders } from "./constants.js";
import { MiaixzSdkError } from "../../errors/errors.js";
import type { MiaixzHttpMethod, MiaixzPreparedRequest } from "./request.js";
import { sanitizeErrorUrl } from "./response-parser.js";
import type {
  MiaixzApiTelemetryHooks,
  MiaixzErrorEvent,
  MiaixzRequestBodySummary,
  MiaixzRequestEvent,
  MiaixzResponseEvent,
} from "./telemetry.types.js";

/**
 * Case-insensitive headers whose values must never reach telemetry.
 */
export const sensitiveHeaderNames = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-csrf-token",
  "proxy-authorization",
]);

/**
 * Normalized object fields whose values must never reach telemetry.
 */
export const sensitiveFieldNames = new Set([
  "token",
  "accesstoken",
  "refreshtoken",
  "password",
  "secret",
  "apikey",
  "key",
]);

/**
 * Maximum telemetry traversal depth.
 */
export const telemetryMaximumDepth = 8;

/**
 * Maximum telemetry collection size.
 */
export const telemetryMaximumCollectionSize = 100;

/**
 * Maximum telemetry string length.
 */
export const telemetryMaximumStringLength = 1_024;

/**
 * Stable redaction placeholder.
 */
export const redactedValue = "[REDACTED]";

/**
 * Stable truncation placeholder.
 */
export const truncatedValue = "[TRUNCATED]";

/**
 * Stable circular-reference placeholder.
 */
export const circularValue = "[CIRCULAR]";

/**
 * Describes a non-JSON value without retaining its content.
 */
export type MiaixzTelemetryValueSummary = MiaixzRequestBodySummary;

/**
 * Reports whether an object can be traversed without invoking custom collection behavior.
 *
 * @param value - Object candidate to inspect.
 * @returns Whether the value is an object literal or null-prototype record.
 */
export function isPlainTelemetryObject(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Normalizes a field name before comparing it with the sensitive-name registry.
 *
 * @param value - Field name to normalize.
 * @returns Lowercase field name without separators.
 */
export function normalizeSensitiveFieldName(value: string): string {
  return value.replace(/[-_]/g, "").toLowerCase();
}

/**
 * Truncates a string by Unicode code points rather than UTF-16 code units.
 *
 * @param value - String value to limit.
 * @returns Original or safely truncated string.
 */
export function truncateTelemetryString(value: string): string {
  const characters = [...value];
  if (characters.length <= telemetryMaximumStringLength) return value;
  return `${characters.slice(0, telemetryMaximumStringLength).join("")}${truncatedValue}`;
}

/**
 * Creates a fixed safe summary for a non-JSON request-body value.
 *
 * @param value - Value whose content must not be recorded.
 * @returns Frozen type and byte-size summary.
 */
export function summarizeTelemetryValue(value: unknown): Readonly<MiaixzTelemetryValueSummary> {
  let type: string = typeof value;
  let bytes: number | undefined;
  if (typeof value === "string") {
    type = "string";
    bytes = new TextEncoder().encode(value).byteLength;
  } else if (value instanceof URLSearchParams) {
    type = "URLSearchParams";
    bytes = new TextEncoder().encode(value.toString()).byteLength;
  } else if (value instanceof Blob) {
    type = "Blob";
    bytes = value.size;
  } else if (value instanceof ArrayBuffer) {
    type = "ArrayBuffer";
    bytes = value.byteLength;
  } else if (ArrayBuffer.isView(value)) {
    type = value instanceof DataView ? "DataView" : "ArrayBufferView";
    bytes = value.byteLength;
  } else if (value instanceof FormData) {
    type = "FormData";
  } else if (typeof ReadableStream !== "undefined" && value instanceof ReadableStream) {
    type = "ReadableStream";
  } else if (value !== null && typeof value === "object") {
    type = "Object";
  }
  return Object.freeze({ type, bytes });
}

/**
 * Recursively creates a bounded, getter-safe telemetry snapshot.
 *
 * @param value - Runtime value to sanitize.
 * @param depth - Current recursion depth.
 * @param ancestors - Objects in the active traversal path.
 * @returns Frozen safe telemetry value.
 */
export function sanitizeTelemetryValue(
  value: unknown,
  depth = 0,
  ancestors: ReadonlySet<object> = new Set(),
): unknown {
  if (typeof value === "string") return truncateTelemetryString(value);
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "undefined"
  ) {
    return value;
  }
  if (typeof value !== "object") return summarizeTelemetryValue(value);
  if (ancestors.has(value)) return circularValue;
  if (depth >= telemetryMaximumDepth) return truncatedValue;
  if (!Array.isArray(value) && !isPlainTelemetryObject(value)) {
    return summarizeTelemetryValue(value);
  }
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);
  if (Array.isArray(value)) {
    const limit = Math.min(value.length, telemetryMaximumCollectionSize);
    const result: unknown[] = [];
    for (let index = 0; index < limit; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      result.push(
        descriptor && "value" in descriptor
          ? sanitizeTelemetryValue(descriptor.value, depth + 1, nextAncestors)
          : truncatedValue,
      );
    }
    if (value.length > telemetryMaximumCollectionSize) {
      result[telemetryMaximumCollectionSize - 1] = truncatedValue;
    }
    return Object.freeze(result);
  }
  const result: Record<string, unknown> = {};
  const keys = Object.keys(value);
  const limit = Math.min(keys.length, telemetryMaximumCollectionSize);
  for (let index = 0; index < limit; index += 1) {
    const key = keys[index] as string;
    if (sensitiveFieldNames.has(normalizeSensitiveFieldName(key))) {
      result[key] = redactedValue;
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    result[key] =
      descriptor && "value" in descriptor
        ? sanitizeTelemetryValue(descriptor.value, depth + 1, nextAncestors)
        : truncatedValue;
  }
  if (keys.length > telemetryMaximumCollectionSize) {
    result[keys[telemetryMaximumCollectionSize - 1] as string] = truncatedValue;
  }
  return Object.freeze(result);
}

/**
 * Summarizes a request body without retaining or recursively traversing its content.
 *
 * @param body - Original or interceptor-produced request body.
 * @returns Frozen metadata-only body summary.
 */
export function summarizeTelemetryBody(body: unknown): Readonly<MiaixzRequestBodySummary> {
  try {
    if (
      body !== null &&
      typeof body === "object" &&
      (Array.isArray(body) || isPlainTelemetryObject(body))
    ) {
      return Object.freeze({ type: "JSON", bytes: undefined });
    }
    return summarizeTelemetryValue(body);
  } catch {
    return Object.freeze({ type: "unknown", bytes: undefined });
  }
}

/**
 * Creates a frozen case-insensitive redacted header snapshot.
 *
 * @param headers - Headers to copy without exposing credentials.
 * @returns Frozen safe header record.
 */
export function sanitizeTelemetryHeaders(
  headers: HeadersInit | undefined,
): Readonly<Record<string, string>> {
  const result: Record<string, string> = {};
  new Headers(headers).forEach((value, key) => {
    result[key] = sensitiveHeaderNames.has(key.toLowerCase()) ? redactedValue : value;
  });
  return Object.freeze(result);
}

/**
 * Removes URL credentials, fragments, and query values for telemetry events.
 *
 * @param value - Absolute request URL to sanitize.
 * @returns Safe URL containing only origin, path, and redacted query keys.
 */
export function sanitizeTelemetryUrl(value: string): string {
  return sanitizeErrorUrl(value);
}

/**
 * Resolves or securely creates the logical request identifier.
 *
 * @param headers - Request headers that receive a generated identifier.
 * @returns Caller-supplied or newly generated request identifier.
 * @throws MiaixzSdkError When secure random UUID generation is unavailable.
 */
export function resolveLogicalRequestId(headers: Headers): string {
  const inherited = headers.get(miaixzHeaders.requestId);
  if (inherited) return inherited;
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new MiaixzSdkError({
      code: "API_CRYPTO_UNAVAILABLE",
    });
  }
  const requestId = globalThis.crypto.randomUUID();
  headers.set(miaixzHeaders.requestId, requestId);
  return requestId;
}

/**
 * Invokes one primary telemetry hook without allowing it to affect request behavior.
 *
 * @typeParam T - Immutable telemetry event type.
 * @param telemetry - Optional host-provided telemetry hooks.
 * @param hookName - Primary hook identifier used for error reporting.
 * @param hook - Primary hook to invoke.
 * @param event - Frozen event delivered to the hook.
 * @returns Promise settled after the hook and any hook-error observer finish.
 */
export async function invokeTelemetryHook<T>(
  telemetry: MiaixzApiTelemetryHooks | undefined,
  hookName: "request" | "response" | "error",
  hook: ((event: Readonly<T>) => void | Promise<void>) | undefined,
  event: Readonly<T>,
): Promise<void> {
  if (!hook) return;
  try {
    await hook(event);
  } catch (error) {
    try {
      telemetry?.onHookError?.(error, hookName);
    } catch {
      /**
       * Telemetry is observational; a secondary hook failure is intentionally ignored.
       */
    }
  }
}

/**
 * Creates and delivers a frozen request telemetry event.
 *
 * @param telemetry - Optional host-provided telemetry hooks.
 * @param requestId - Logical request identifier.
 * @param method - Request method.
 * @param prepared - Final request produced by interceptors.
 * @param body - Original or interceptor-produced request body.
 * @param started - Attempt start timestamp.
 * @returns Promise settled after telemetry observation completes.
 */
export async function emitRequestTelemetry(
  telemetry: MiaixzApiTelemetryHooks | undefined,
  requestId: string,
  method: MiaixzHttpMethod,
  prepared: MiaixzPreparedRequest,
  body: unknown,
  started: number,
): Promise<void> {
  const event: MiaixzRequestEvent = Object.freeze({
    requestId,
    method,
    url: sanitizeTelemetryUrl(prepared.url),
    attempt: prepared.attempt,
    headers: sanitizeTelemetryHeaders(prepared.init.headers),
    ...(body === undefined ? {} : { bodySummary: summarizeTelemetryBody(body) }),
    started,
  });
  await invokeTelemetryHook(telemetry, "request", telemetry?.onRequest, event);
}

/**
 * Creates and delivers a frozen response telemetry event.
 *
 * @param telemetry - Optional host-provided telemetry hooks.
 * @param requestId - Logical request identifier.
 * @param method - Request method.
 * @param prepared - Final request produced by interceptors.
 * @param response - Raw Fetch response.
 * @param started - Attempt start timestamp.
 * @returns Promise settled after telemetry observation completes.
 */
export async function emitResponseTelemetry(
  telemetry: MiaixzApiTelemetryHooks | undefined,
  requestId: string,
  method: MiaixzHttpMethod,
  prepared: MiaixzPreparedRequest,
  response: Response,
  started: number,
): Promise<void> {
  const event: MiaixzResponseEvent = Object.freeze({
    requestId,
    method,
    url: sanitizeTelemetryUrl(prepared.url),
    attempt: prepared.attempt,
    status: response.status,
    durationMs: Math.max(0, Date.now() - started),
    headers: sanitizeTelemetryHeaders(response.headers),
  });
  await invokeTelemetryHook(telemetry, "response", telemetry?.onResponse, event);
}

/**
 * Creates and delivers a frozen failure telemetry event.
 *
 * @param telemetry - Optional host-provided telemetry hooks.
 * @param requestId - Logical request identifier.
 * @param method - Request method.
 * @param prepared - Final request produced by interceptors.
 * @param error - Normalized SDK error.
 * @param started - Attempt start timestamp.
 * @returns Promise settled after telemetry observation completes.
 */
export async function emitErrorTelemetry(
  telemetry: MiaixzApiTelemetryHooks | undefined,
  requestId: string,
  method: MiaixzHttpMethod,
  prepared: MiaixzPreparedRequest,
  error: MiaixzSdkError,
  started: number,
): Promise<void> {
  const summary = Object.freeze({ name: error.name, code: error.code, message: error.message });
  const event: MiaixzErrorEvent = Object.freeze({
    requestId,
    method,
    url: sanitizeTelemetryUrl(prepared.url),
    attempt: prepared.attempt,
    durationMs: Math.max(0, Date.now() - started),
    error: summary,
  });
  await invokeTelemetryHook(telemetry, "error", telemetry?.onError, event);
}
