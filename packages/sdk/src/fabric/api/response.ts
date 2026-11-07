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
 * Defines parsed HTTP responses and caller-provided error details.
 * Describes a successful HTTP response returned by the Miaixz API client.
 *
 * @typeParam T - Type of the normalized response payload.
 * @public
 */
export interface MiaixzHttpResponse<T> {
  /**
   * Parsed response payload after response interception and validation.
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
 * Describes optional application-provided details for an unsuccessful HTTP response.
 * The transport retains ownership of status, retry policy, and authentication.
 * @public
 */
export interface MiaixzHttpErrorDetails {
  /**
   * Optional machine-readable error code.
   */
  readonly code?: string;
  /**
   * Optional request identifier supplied by the caller's response protocol.
   */
  readonly requestId?: string;
  /**
   * Optional untrusted server message sanitized by the HTTP error class.
   */
  readonly serverMessage?: string;
}

/**
 * Supplies synchronous error details without changing HTTP transport decisions.
 * A valid object replaces the default details; undefined declines the mapping.
 *
 * @param body - Parsed unsuccessful response body.
 * @param response - Immutable HTTP status without headers or request credentials.
 * @returns Replacement error details, or undefined to use generic problem details.
 * @public
 */
export type MiaixzHttpErrorMapper = (
  body: unknown,
  response: Readonly<{ status: number }>,
) => MiaixzHttpErrorDetails | undefined;
