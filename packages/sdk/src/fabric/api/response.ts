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
 * Defines normalized HTTP success envelopes and response-error handling.
 */

import type { MiaixzApiEnvelope } from "./api.types.js";

/**
 * Describes a successful HTTP response returned by the Miaixz API client.
 *
 * @typeParam T - Type of the normalized response payload.
 * @public
 */
export interface MiaixzHttpResponse<T> {
  /**
   * Normalized response payload.
   */
  readonly data: T;

  /**
   * HTTP status code.
   */
  readonly status: number;

  /**
   * HTTP status text.
   */
  readonly statusText: string;

  /**
   * Response headers returned by the server.
   */
  readonly headers: Headers;

  /**
   * Optional request identifier returned by the server.
   */
  readonly requestId?: string;

  /**
   * Final response URL after redirects.
   */
  readonly url: string;
}

/**
 * Transforms a normalized response before it reaches the caller.
 *
 * @public
 */
export type MiaixzResponseInterceptor = (
  response: MiaixzHttpResponse<unknown>,
) => MiaixzHttpResponse<unknown> | Promise<MiaixzHttpResponse<unknown>>;

/**
 * Validates the standard `{ code, desc, data }` response shape.
 *
 * @param value - Parsed response body.
 * @returns Whether the body is a Miaixz API envelope.
 * @public
 */
export function isMiaixzApiEnvelope<T = unknown>(value: unknown): value is MiaixzApiEnvelope<T> {
  const record = value as Record<string, unknown>;
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof record.code === "string" &&
    "desc" in value &&
    typeof record.desc === "string" &&
    "data" in value
  );
}

/**
 * Determines whether an API result code represents success.
 *
 * @param value - API result code to inspect.
 * @returns Whether an API envelope has the success code `0`.
 * @public
 */
export function isMiaixzApiSuccess(value: {
  /**
   * Business result code returned by the API.
   */
  code: string;
}): boolean {
  return value.code === "0";
}
/**
 * Returns an envelope's `data` value and leaves non-envelope values unchanged.
 *
 * @param value - Envelope or already-unwrapped value.
 * @returns Unwrapped envelope data or the original non-envelope value.
 * @public
 */
export function unwrapMiaixzData<T>(value: T | MiaixzApiEnvelope<T>): T {
  if (isMiaixzApiEnvelope<T>(value)) {
    return value.data;
  }
  return value;
}
