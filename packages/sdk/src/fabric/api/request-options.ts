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
 * Normalizes request options and resolves request identifiers, context headers, and credentials.
 */

import { miaixzDefaultRequestTimeoutMs, miaixzHeaders } from "./constants.js";
import { MiaixzApiError, MiaixzSdkError } from "../../errors/errors.js";
import type { MiaixzEnvironment } from "../../runtime/config/config.types.js";
import { normalizeMiaixzApiEndpoint } from "./endpoint.js";
import type {
  MiaixzHttpMethod,
  MiaixzQuery,
  MiaixzQueryPrimitive,
  MiaixzRequestBody,
  MiaixzRequestInterceptor,
} from "./request.js";
import type { MiaixzHttpErrorMapper, MiaixzResponseInterceptor } from "./response.js";
import type { MiaixzApiTelemetryHooks } from "./telemetry.types.js";

/**
 * Supplies a bearer token to the API client on demand.
 *
 * @returns A bearer token, or `undefined` when no token is available.
 * @public
 */
export type MiaixzTokenProvider = () => string | undefined | Promise<string | undefined>;

/**
 * Supplies a complete Authorization header value on demand.
 *
 * @returns A complete Authorization value, or `undefined` when unavailable.
 * @public
 */
export type MiaixzAuthorizationProvider = () => string | undefined | Promise<string | undefined>;

/**
 * Supplies runtime-context headers to the API client on demand.
 *
 * @returns Runtime-context headers, or `undefined` when no context is active.
 * @public
 */
export type MiaixzContextHeadersProvider = () =>
  HeadersInit | undefined | Promise<HeadersInit | undefined>;

/**
 * Supplies a CSRF token to a Cookie/BFF API client on demand.
 *
 * @returns A CSRF token, or `undefined` when no token is available.
 * @public
 */
export type MiaixzCsrfTokenProvider = () => string | undefined | Promise<string | undefined>;

/**
 * Configures authoritative CSRF handling for an API client.
 *
 * @public
 */
export interface MiaixzCsrfOptions {
  /**
   * Determines whether Cookie/BFF write requests require a provider token.
   */
  readonly required: boolean;

  /**
   * Supplies the authoritative token for Cookie/BFF write requests.
   */
  readonly tokenProvider?: MiaixzCsrfTokenProvider;
}

/**
 * Configures a reusable Miaixz API client.
 *
 * @public
 */
export interface MiaixzApiClientOptions {
  /**
   * Base URL used to resolve relative request paths.
   */
  readonly baseUrl: string;

  /**
   * Environment used to validate the endpoint transport policy.
   *
   * @defaultValue "production"
   */
  readonly environment?: MiaixzEnvironment;

  /**
   * Optional Fetch implementation used to send requests.
   */
  readonly fetch?: typeof fetch;

  /**
   * Optional headers included with every request.
   */
  readonly headers?: HeadersInit;

  /**
   * Optional default Fetch credentials mode.
   *
   * @defaultValue "same-origin"
   */
  readonly credentials?: RequestCredentials;

  /**
   * Optional default request timeout in milliseconds.
   *
   * @defaultValue 30000
   */
  readonly timeoutMs?: number;

  /**
   * Optional default number of retry attempts.
   *
   * @defaultValue 0
   */
  readonly retry?: number;
  /**
   * Provides the complete Authorization header value, including its authentication scheme.
   */
  readonly authorizationProvider?: MiaixzAuthorizationProvider;
  /**
   * Provides a bearer token. Ignored when `authorizationProvider` returns a value.
   */
  readonly tokenProvider?: MiaixzTokenProvider;

  /**
   * Optional provider for active runtime-context headers.
   */
  readonly contextHeadersProvider?: MiaixzContextHeadersProvider;

  /**
   * Additional context-header names protected from Fetch redirects, even when supplied manually.
   * The client validates, normalizes, and copies the list when it is created.
   */
  readonly contextHeaderNames?: readonly string[];

  /**
   * Optional synchronous replacement for generic unsuccessful-response details.
   * HTTP status, retry policy, and authentication remain controlled by the transport.
   */
  readonly httpErrorMapper?: MiaixzHttpErrorMapper;

  /**
   * Optional request interceptors executed in registration order.
   */
  readonly requestInterceptors?: readonly MiaixzRequestInterceptor[];

  /**
   * Optional response interceptors executed in registration order.
   */
  readonly responseInterceptors?: readonly MiaixzResponseInterceptor[];

  /**
   * Optional authoritative CSRF policy for Cookie/BFF requests.
   */
  readonly csrf?: MiaixzCsrfOptions;

  /**
   * Optional observers for immutable, redacted request lifecycle events.
   */
  readonly telemetry?: MiaixzApiTelemetryHooks;
}

/**
 * HTTP statuses eligible for retry.
 */
export const retryableStatuses = new Set([408, 429, 500, 502, 503, 504]);

/**
 * HTTP methods eligible for retry.
 */
export const retryableMethods = new Set<MiaixzHttpMethod>(["GET", "HEAD", "PUT", "DELETE"]);

/**
 * HTTP methods protected by the CSRF policy.
 */
export const csrfProtectedMethods = new Set<MiaixzHttpMethod>(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Validates and normalizes an API base URL for the selected environment.
 *
 * @param value - Base URL to validate and normalize.
 * @param environment - Runtime environment controlling HTTP loopback access.
 * @returns Normalized base URL without trailing separators.
 * @throws MiaixzApiError When the endpoint violates the frozen transport policy.
 */
export function normalizeBaseUrl(value: string, environment: MiaixzEnvironment): string {
  const normalized = normalizeMiaixzApiEndpoint(value, environment);
  if (normalized === undefined) {
    throw new MiaixzApiError({
      status: 0,
      method: "CONFIG",
      url: "[INVALID_URL]",
      code: "API_BASE_URL_INVALID",
    });
  }
  return normalized;
}

/**
 * Validates a positive finite timeout value.
 *
 * @param value - Timeout value in milliseconds.
 * @returns Validated timeout value.
 */
export function normalizeTimeout(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new MiaixzSdkError({
      code: "API_TIMEOUT_INVALID",
      details: { timeoutMs: value },
    });
  }
  return value;
}

/**
 * Validates a non-negative integer retry count.
 *
 * @param value - Retry count to validate.
 * @returns Validated retry count.
 */
export function normalizeRetry(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 5) {
    throw new MiaixzSdkError({
      code: "API_RETRY_INVALID",
      details: { retry: value },
    });
  }
  return value;
}

/**
 * Resolves a caller request path while rejecting every absolute or cross-origin form.
 *
 * @param baseUrl - Validated base URL used for relative resolution.
 * @param path - Caller-supplied relative or slash-relative path.
 * @param createError - Creates the canonical origin error.
 * @returns A fully resolved URL on the configured origin.
 * @throws MiaixzSdkError When the path is absolute, protocol-relative, or cross-origin.
 */
export function resolveRequestUrl(
  baseUrl: string,
  path: string,
  createError: () => MiaixzSdkError,
): string {
  if (typeof path !== "string") throw createError();
  const trimmedStart = path.trimStart();
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmedStart) || /^[\\/]{2}/.test(trimmedStart)) {
    throw createError();
  }

  try {
    const base = new URL(baseUrl);
    const resolved = new URL(path, `${baseUrl}/`);
    if (
      resolved.origin !== base.origin ||
      resolved.protocol !== base.protocol ||
      resolved.username !== "" ||
      resolved.password !== ""
    ) {
      throw createError();
    }
    return resolved.href;
  } catch (cause) {
    if (cause instanceof MiaixzSdkError) throw cause;
    throw createError();
  }
}

/**
 * Revalidates an interceptor-produced URL against the configured base origin.
 *
 * @param baseUrl - Validated base URL defining the only permitted origin.
 * @param value - Interceptor-produced URL value.
 * @param createError - Creates the canonical origin error.
 * @returns A normalized absolute URL on the configured origin.
 * @throws MiaixzSdkError When the final URL resolves outside the configured origin.
 */
export function validatePreparedRequestUrl(
  baseUrl: string,
  value: string,
  createError: () => MiaixzSdkError,
): string {
  if (typeof value !== "string") throw createError();
  try {
    const base = new URL(baseUrl);
    const resolved = new URL(value, `${baseUrl}/`);
    if (
      resolved.origin !== base.origin ||
      resolved.protocol !== base.protocol ||
      resolved.username !== "" ||
      resolved.password !== ""
    ) {
      throw createError();
    }
    return resolved.href;
  } catch (cause) {
    if (cause instanceof MiaixzSdkError) throw cause;
    throw createError();
  }
}

/**
 * Reports whether the final request contains any runtime-context header.
 *
 * @param headers - Final request headers to inspect.
 * @param protectedNames - Configured header names and names returned by the context provider.
 * @returns Whether at least one context header remains on the request.
 */
export function hasContextHeader(headers: Headers, protectedNames: ReadonlySet<string>): boolean {
  return [...protectedNames].some((name) => headers.has(name));
}

/**
 * Computes the mandatory Fetch redirect mode from final authentication and context state.
 *
 * @param headers - Final request headers after interception.
 * @param credentials - Final Fetch credentials mode.
 * @param authenticationEnabled - Whether an authentication integration is active.
 * @param protectedContextNames - Configured and provider-supplied context-header names.
 * @returns The fixed safe redirect mode for the request.
 */
export function resolveRedirectMode(
  headers: Headers,
  credentials: RequestCredentials | undefined,
  authenticationEnabled: boolean,
  protectedContextNames: ReadonlySet<string>,
): RequestRedirect {
  return authenticationEnabled ||
    credentials === "include" ||
    headers.has(miaixzHeaders.authorization) ||
    headers.has("Cookie") ||
    headers.has("Proxy-Authorization") ||
    headers.has("X-Api-Key") ||
    headers.has(miaixzHeaders.csrfToken) ||
    hasContextHeader(headers, protectedContextNames)
    ? "error"
    : "follow";
}

/**
 * Converts query primitives to their URL representation.
 *
 * @param value - Query value to serialize.
 * @returns URL-compatible string representation.
 */
export function serializeQueryValue(
  value: Exclude<MiaixzQueryPrimitive, null | undefined>,
): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

/**
 * Appends scalar or repeated query values without disturbing an existing hash.
 * `null` and `undefined` values are omitted.
 *
 * @param url - Request URL to update.
 * @param query - Optional query parameters to append.
 * @returns URL containing the serialized query parameters.
 * @public
 */
export function appendMiaixzQuery(url: string, query?: MiaixzQuery): string {
  if (!query) return url;
  const hashIndex = url.indexOf("#");
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
  const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const parameters = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(query)) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) {
      if (value !== null && value !== undefined) parameters.append(key, serializeQueryValue(value));
    }
  }
  const serialized = parameters.toString();
  if (!serialized) return url;
  return `${base}${base.includes("?") ? "&" : "?"}${serialized}${hash}`;
}

/**
 * Detects body types that Fetch can transmit without JSON serialization.
 *
 * @param value - Request body candidate to inspect.
 * @returns Whether the value is a native Fetch body.
 */
export function isNativeBody(value: unknown): value is BodyInit {
  return (
    typeof value === "string" ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value) ||
    (typeof ReadableStream !== "undefined" && value instanceof ReadableStream)
  );
}

/**
 * Serializes plain records and arrays as JSON while preserving native bodies.
 *
 * @param body - Optional request body to serialize.
 * @param headers - Request headers updated with a JSON content type when needed.
 * @returns Native or serialized body accepted by Fetch.
 */
export function serializeBody(
  body: MiaixzRequestBody | undefined,
  headers: Headers,
): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (isNativeBody(body)) return body;
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return JSON.stringify(body);
}

/**
 * Reads the standard or legacy request identifier header.
 *
 * @param headers - Response headers to inspect.
 * @returns Request identifier when the server supplied one.
 */
export function getRequestId(headers: Headers): string | undefined {
  return headers.get(miaixzHeaders.requestId) ?? undefined;
}
