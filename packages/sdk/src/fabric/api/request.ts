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
 * Represents an HTTP method supported by the Miaixz API client.
 *
 * @public
 */
export type MiaixzHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

/**
 * Selects how the API client parses an HTTP response body.
 *
 * @public
 */
export type MiaixzResponseType = "auto" | "json" | "text" | "blob" | "arrayBuffer" | "void";

/**
 * Converts an untrusted API response value into a verified application value.
 *
 * @typeParam T - Verified value returned by the parser.
 * @public
 */
export type MiaixzResponseParser<T> = (value: unknown) => T;

/**
 * Represents a scalar value accepted in a URL query parameter.
 *
 * @public
 */
export type MiaixzQueryPrimitive = string | number | boolean | Date | null | undefined;

/**
 * Represents a scalar or repeated URL query parameter value.
 *
 * @public
 */
export type MiaixzQueryValue = MiaixzQueryPrimitive | readonly MiaixzQueryPrimitive[];

/**
 * Maps URL query parameter names to supported values.
 *
 * @public
 */
export type MiaixzQuery = Readonly<Record<string, MiaixzQueryValue>>;

/**
 * Represents a body accepted by the Miaixz API client.
 *
 * @public
 */
export type MiaixzRequestBody = BodyInit | Readonly<Record<string, unknown>> | readonly unknown[];

/**
 * Describes a request after URL, headers, and options are prepared.
 *
 * @public
 */
export interface MiaixzPreparedRequest {
  /**
   * Fully resolved request URL.
   */
  readonly url: string;

  /**
   * Fetch initialization options for the request.
   */
  readonly init: RequestInit;

  /**
   * Zero-based request attempt number.
   */
  readonly attempt: number;
}

/**
 * Transforms a prepared request before it is sent.
 *
 * @public
 */
export type MiaixzRequestInterceptor = (
  request: MiaixzPreparedRequest,
) => MiaixzPreparedRequest | Promise<MiaixzPreparedRequest>;

/**
 * Configures an individual request made by the Miaixz API client.
 *
 * @typeParam TBody - Type of the request body.
 * @public
 */
export interface MiaixzRequestOptions<
  TResponse = unknown,
  TBody extends MiaixzRequestBody = MiaixzRequestBody,
> {
  /**
   * Optional HTTP method used for the request.
   */
  readonly method?: MiaixzHttpMethod;

  /**
   * Optional URL query parameters appended to the request path.
   */
  readonly query?: MiaixzQuery;

  /**
   * Optional request-specific HTTP headers.
   */
  readonly headers?: HeadersInit;

  /**
   * Optional request body.
   */
  readonly body?: TBody;

  /**
   * Optional signal used to cancel the request.
   */
  readonly signal?: AbortSignal;

  /**
   * Optional request timeout in milliseconds.
   */
  readonly timeoutMs?: number;

  /**
   * Optional Fetch credentials mode.
   */
  readonly credentials?: RequestCredentials;

  /**
   * Optional response parsing mode.
   */
  readonly responseType?: MiaixzResponseType;

  /**
   * Indicates whether authentication headers should be attached.
   */
  readonly authenticate?: boolean;

  /**
   * Indicates whether active runtime-context headers should be attached.
   */
  readonly includeContext?: boolean;

  /**
   * Optional number of retry attempts for eligible requests.
   */
  readonly retry?: number;

  /**
   * Optional runtime parser applied after response interceptors.
   */
  readonly parse?: MiaixzResponseParser<TResponse>;
}
