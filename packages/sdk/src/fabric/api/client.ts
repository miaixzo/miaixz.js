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
 * Creates typed HTTP clients backed by the shared request execution pipeline.
 */

import { MiaixzSdkError } from "../../errors/errors.js";
import type { MiaixzRequestBody, MiaixzRequestOptions } from "./request.js";
import type { MiaixzHttpResponse } from "./response.js";
import { executeMiaixzApiRequest } from "./request-execution.js";
import { normalizeBaseUrl, type MiaixzApiClientOptions } from "./request-options.js";

export { appendMiaixzQuery } from "./request-options.js";
export type {
  MiaixzApiClientOptions,
  MiaixzAuthorizationProvider,
  MiaixzContextHeadersProvider,
  MiaixzCsrfOptions,
  MiaixzCsrfTokenProvider,
  MiaixzTokenProvider,
} from "./request-options.js";

/**
 * Sends typed requests to Miaixz services.
 *
 * @public
 */
export interface MiaixzApiClient {
  /**
   * Normalized base URL used by the client.
   */
  readonly baseUrl: string;
  /**
   * Sends a request with full method and body control.
   *
   * @typeParam TResponse - Final response-data type.
   * @typeParam TBody - Request-body type.
   * @param path - Relative or slash-relative same-origin request path.
   * @param options - Optional request behavior and response parser.
   * @returns The final parsed HTTP response.
   * @throws MiaixzSdkError When request validation, transport, or response handling fails.
   */
  request<TResponse = unknown, TBody extends MiaixzRequestBody = MiaixzRequestBody>(
    path: string,
    options?: MiaixzRequestOptions<TResponse, TBody>,
  ): Promise<MiaixzHttpResponse<TResponse>>;
  /**
   * Sends a GET request.
   *
   * @typeParam TResponse - Final response-data type.
   * @param path - Relative or slash-relative same-origin request path.
   * @param options - Optional GET behavior and response parser.
   * @returns The final parsed HTTP response.
   * @throws MiaixzSdkError When request validation, transport, or response handling fails.
   */
  get<TResponse = unknown>(
    path: string,
    options?: Omit<MiaixzRequestOptions<TResponse>, "method" | "body">,
  ): Promise<MiaixzHttpResponse<TResponse>>;
  /**
   * Sends a POST request.
   *
   * @typeParam TResponse - Final response-data type.
   * @typeParam TBody - Request-body type.
   * @param path - Relative or slash-relative same-origin request path.
   * @param body - Optional request body.
   * @param options - Optional POST behavior and response parser.
   * @returns The final parsed HTTP response.
   * @throws MiaixzSdkError When request validation, CSRF, transport, or response handling fails.
   */
  post<TResponse = unknown, TBody extends MiaixzRequestBody = MiaixzRequestBody>(
    path: string,
    body?: TBody,
    options?: Omit<MiaixzRequestOptions<TResponse, TBody>, "method" | "body">,
  ): Promise<MiaixzHttpResponse<TResponse>>;
  /**
   * Sends a PUT request.
   *
   * @typeParam TResponse - Final response-data type.
   * @typeParam TBody - Request-body type.
   * @param path - Relative or slash-relative same-origin request path.
   * @param body - Optional request body.
   * @param options - Optional PUT behavior and response parser.
   * @returns The final parsed HTTP response.
   * @throws MiaixzSdkError When request validation, CSRF, transport, or response handling fails.
   */
  put<TResponse = unknown, TBody extends MiaixzRequestBody = MiaixzRequestBody>(
    path: string,
    body?: TBody,
    options?: Omit<MiaixzRequestOptions<TResponse, TBody>, "method" | "body">,
  ): Promise<MiaixzHttpResponse<TResponse>>;
  /**
   * Sends a PATCH request.
   *
   * @typeParam TResponse - Final response-data type.
   * @typeParam TBody - Request-body type.
   * @param path - Relative or slash-relative same-origin request path.
   * @param body - Optional request body.
   * @param options - Optional PATCH behavior and response parser.
   * @returns The final parsed HTTP response.
   * @throws MiaixzSdkError When request validation, CSRF, transport, or response handling fails.
   */
  patch<TResponse = unknown, TBody extends MiaixzRequestBody = MiaixzRequestBody>(
    path: string,
    body?: TBody,
    options?: Omit<MiaixzRequestOptions<TResponse, TBody>, "method" | "body">,
  ): Promise<MiaixzHttpResponse<TResponse>>;
  /**
   * Sends a DELETE request.
   *
   * @typeParam TResponse - Final response-data type.
   * @param path - Relative or slash-relative same-origin request path.
   * @param options - Optional DELETE behavior and response parser.
   * @returns The final parsed HTTP response.
   * @throws MiaixzSdkError When request validation, CSRF, transport, or response handling fails.
   */
  delete<TResponse = unknown>(
    path: string,
    options?: Omit<MiaixzRequestOptions<TResponse>, "method">,
  ): Promise<MiaixzHttpResponse<TResponse>>;
}

/**
 * Creates a stable Fetch-based API client façade.
 *
 * @param options - Endpoint and runtime adapters shared by all requests.
 * @returns Reusable typed API client.
 * @public
 */
export function createApiClient(options: MiaixzApiClientOptions): MiaixzApiClient {
  const baseUrl = normalizeBaseUrl(options.baseUrl, options.environment ?? "production");
  const fetchImplementation = options.fetch ?? globalThis.fetch;
  if (!fetchImplementation) throw new MiaixzSdkError({ code: "FETCH_UNAVAILABLE" });
  const clientOptions: MiaixzApiClientOptions = {
    ...options,
    contextHeaderNames: normalizeContextHeaderNames(options.contextHeaderNames),
  };
  /**
   * Executes a typed API request through the shared client pipeline.
   *
   * @param path - Path resolved against the configured API base URL.
   * @param requestOptions - Per-request method, body, response, timeout, and authentication options.
   * @returns Promise resolving to the normalized typed API response.
   */
  const request = <TResponse, TBody extends MiaixzRequestBody = MiaixzRequestBody>(
    path: string,
    requestOptions: MiaixzRequestOptions<TResponse, TBody> = {},
  ) => executeMiaixzApiRequest(clientOptions, baseUrl, fetchImplementation, path, requestOptions);
  return {
    baseUrl,
    request,
    get: (path, requestOptions) => request(path, { ...requestOptions, method: "GET" }),
    post: (path, body, requestOptions) =>
      request(path, { ...requestOptions, method: "POST", ...(body === undefined ? {} : { body }) }),
    put: (path, body, requestOptions) =>
      request(path, { ...requestOptions, method: "PUT", ...(body === undefined ? {} : { body }) }),
    patch: (path, body, requestOptions) =>
      request(path, {
        ...requestOptions,
        method: "PATCH",
        ...(body === undefined ? {} : { body }),
      }),
    delete: (path, requestOptions) => request(path, { ...requestOptions, method: "DELETE" }),
  };
}

/**
 * Validates header names without retaining caller-owned arrays or invalid input values.
 *
 * @param value - Optional caller-defined context-header names.
 * @returns An immutable, lowercase, deduplicated copy of the configured names.
 * @throws TypeError When the list or a header name is invalid.
 */
function normalizeContextHeaderNames(value: readonly string[] | undefined): readonly string[] {
  if (value === undefined) return Object.freeze([]);
  if (!Array.isArray(value)) throw new TypeError("Invalid context header names.");
  const names = new Set<string>();
  for (const name of value) {
    if (typeof name !== "string") throw new TypeError("Invalid context header name.");
    try {
      new Headers([[name, ""]]);
    } catch {
      throw new TypeError("Invalid context header name.");
    }
    names.add(name.toLowerCase());
  }
  return Object.freeze([...names]);
}
