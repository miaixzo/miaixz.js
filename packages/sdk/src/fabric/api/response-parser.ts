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
 * Parses HTTP bodies using explicit response modes or their declared content type.
 */

import { MiaixzSdkError } from "../../errors/errors.js";
import { isRecord } from "../../shared/object.js";
import type { MiaixzResponseParser, MiaixzResponseType } from "./request.js";
import { isMiaixzApiEnvelope } from "./response.js";

/**
 * Determines whether the selected response mode represents a JSON API response.
 *
 * @param response - HTTP response to inspect.
 * @param responseType - Configured response parsing mode.
 * @returns Whether the response is expected to contain a JSON envelope.
 */
export function expectsJsonEnvelope(response: Response, responseType: MiaixzResponseType): boolean {
  if (response.status === 204 || response.status === 205 || responseType === "void") return false;
  if (responseType === "json") return true;
  if (responseType !== "auto") return false;
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  return contentType.includes("json") || contentType.includes("+json");
}

/**
 * Parses a response using the explicit mode or its Content-Type header.
 *
 * @param response - HTTP response whose body should be parsed.
 * @param responseType - Configured response parsing mode.
 * @returns Parsed response body.
 */
export async function parseBody(
  response: Response,
  responseType: MiaixzResponseType,
): Promise<unknown> {
  if (responseType === "void" || response.status === 204 || response.status === 205)
    return undefined;
  if (responseType === "blob") return response.blob();
  if (responseType === "arrayBuffer") return response.arrayBuffer();
  if (responseType === "text") return response.text();
  if (responseType === "json") return parseJsonBody(response);
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("json") || contentType.includes("+json")) return parseJsonBody(response);
  if (contentType.startsWith("text/")) return response.text();
  return response.blob();
}

/**
 * Parses JSON while distinguishing an empty body from malformed non-empty JSON.
 *
 * @param response - JSON response to parse.
 * @returns Parsed JSON, or undefined when the body is empty.
 */
export async function parseJsonBody(response: Response): Promise<unknown> {
  const fallback = response.clone();
  try {
    return await response.json();
  } catch (cause) {
    const text = await fallback.text().catch(() => undefined);
    if (text === "") return undefined;
    throw cause;
  }
}

/**
 * Stable details extracted from an unsuccessful response.
 */
export interface MiaixzProblemDetails {
  /**
   * Optional machine-readable failure code.
   */
  code?: string;

  /**
   * Optional request identifier used for diagnostics.
   */
  requestId?: string;

  /**
   * Optional untrusted backend text retained only after MiaixzApiError sanitizes it.
   */
  serverMessage?: string;
}

/**
 * Describes a non-zero business response that may omit the success-only `data` field.
 */
export interface MiaixzApiFailureEnvelope {
  /**
   * Machine-readable business failure code.
   */
  readonly code: string;

  /**
   * Human-readable business failure message.
   */
  readonly desc: string;
}

/**
 * Recognizes a non-zero Miaixz business response even when an older service omits `data`.
 *
 * Successful envelopes still require `data`; accepting an incomplete success response would
 * otherwise let callers observe an undefined payload as a valid result.
 *
 * @param value - Parsed response body.
 * @returns Whether the body carries a valid business failure code and message.
 */
export function isMiaixzApiFailureEnvelope(
  value: unknown,
): value is Readonly<MiaixzApiFailureEnvelope> {
  return (
    isRecord(value) &&
    typeof value.code === "string" &&
    value.code !== "0" &&
    typeof value.desc === "string"
  );
}

/**
 * Normalizes an unsuccessful HTTP body into stable problem details.
 *
 * @param body - Parsed unsuccessful response body.
 * @param response - Original HTTP response.
 * @returns Stable problem details extracted from the response.
 */
export function extractProblem(body: unknown, response: Response): MiaixzProblemDetails {
  if (isMiaixzApiFailureEnvelope(body)) {
    return {
      code: body.code,
      serverMessage: body.desc,
    };
  }
  if (isMiaixzApiEnvelope(body)) return { code: `HTTP_${response.status}` };
  if (!isRecord(body)) return {};
  const result: MiaixzProblemDetails = {};
  if (typeof body.code === "string") result.code = body.code;
  if (typeof body.requestId === "string") result.requestId = body.requestId;
  if (typeof body.message === "string") result.serverMessage = body.message;
  return result;
}

/**
 * Removes URL credentials, fragments, and query values before an error exposes the URL.
 *
 * @param value - Absolute request URL to sanitize.
 * @returns URL containing only origin, path, and redacted query keys.
 */
export function sanitizeErrorUrl(value: string): string {
  try {
    const url = new URL(value);
    const query = [...url.searchParams.keys()].map(
      (key) => `${encodeURIComponent(key)}=[REDACTED]`,
    );
    return `${url.origin}${url.pathname}${query.length > 0 ? `?${query.join("&")}` : ""}`;
  } catch {
    return "[INVALID_URL]";
  }
}

/**
 * Wraps response parsing or runtime validation failures in the frozen SDK error contract.
 *
 * @param cause - Parser failure to preserve when it is an Error instance.
 * @param requestId - Optional server request identifier.
 * @returns Structured response-validation error.
 */
export function createResponseInvalidError(
  cause: unknown,
  requestId: string | undefined,
): MiaixzSdkError {
  const details = {
    ...(requestId === undefined ? {} : { requestId }),
    ...(cause instanceof Error ? {} : { type: typeof cause }),
  };
  return new MiaixzSdkError({
    code: "API_RESPONSE_INVALID",
    cause,
    ...(Object.keys(details).length === 0 ? {} : { details: Object.freeze(details) }),
  });
}

/**
 * Applies an optional runtime response parser after all response interceptors.
 *
 * @typeParam T - Verified response value returned to the caller.
 * @param value - Untrusted response value after interception.
 * @param parser - Optional application runtime parser.
 * @param requestId - Optional server request identifier.
 * @returns Parsed response data, or the compatibility generic value when no parser exists.
 */
export function parseResponseData<T>(
  value: unknown,
  parser: MiaixzResponseParser<T> | undefined,
  requestId: string | undefined,
): T {
  if (!parser) return value as T;
  try {
    return parser(value);
  } catch (cause) {
    throw createResponseInvalidError(cause, requestId);
  }
}
