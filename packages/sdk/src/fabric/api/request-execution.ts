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
 * Coordinates request preparation, authentication, retries, response parsing, and telemetry.
 */

import { miaixzDefaultRequestTimeoutMs, miaixzHeaders } from "./constants.js";
import { MiaixzAbortError, MiaixzApiError, MiaixzSdkError } from "../../errors/errors.js";
import type { MiaixzHttpResponse } from "./response.js";
import type {
  MiaixzHttpMethod,
  MiaixzPreparedRequest,
  MiaixzRequestBody,
  MiaixzRequestOptions,
} from "./request.js";
import {
  appendMiaixzQuery,
  csrfProtectedMethods,
  getRequestId,
  normalizeRetry,
  normalizeTimeout,
  resolveRedirectMode,
  resolveRequestUrl,
  retryableMethods,
  retryableStatuses,
  serializeBody,
  validatePreparedRequestUrl,
  type MiaixzApiClientOptions,
  type MiaixzCsrfOptions,
} from "./request-options.js";
import {
  createResponseInvalidError,
  extractProblem,
  parseBody,
  parseResponseData,
  sanitizeErrorUrl,
} from "./response-parser.js";
import { createAbortContext, normalizeAttemptError, retryDelay, wait } from "./retry.js";
import {
  emitErrorTelemetry,
  emitRequestTelemetry,
  emitResponseTelemetry,
  resolveLogicalRequestId,
} from "./telemetry.js";

/**
 * Creates a stable request-origin validation error without exposing the rejected value.
 *
 * @returns A safe request-origin error.
 */
export function createRequestOriginError(): MiaixzSdkError {
  return new MiaixzSdkError({
    code: "API_REQUEST_ORIGIN_INVALID",
  });
}

/**
 * Creates a CSRF failure without retaining provider output or exceptions.
 *
 * @returns A safe missing-token error.
 */
export function createCsrfTokenMissingError(): MiaixzSdkError {
  return new MiaixzSdkError({
    code: "CSRF_TOKEN_MISSING",
  });
}

/**
 * Applies the authoritative Cookie/BFF CSRF policy to final request headers.
 *
 * @param headers - Final request headers to update.
 * @param method - Final HTTP method used by Fetch.
 * @param csrf - Optional CSRF policy configured on the client.
 * @returns Promise settled after the final header policy is applied.
 * @throws MiaixzSdkError When a protected request has no non-empty provider token.
 */
export async function applyCsrfPolicy(
  headers: Headers,
  method: MiaixzHttpMethod,
  csrf: MiaixzCsrfOptions | undefined,
): Promise<void> {
  if (csrf?.required !== true) return;
  headers.delete(miaixzHeaders.csrfToken);
  if (!csrfProtectedMethods.has(method)) return;

  let token: string | undefined;
  try {
    token = await csrf.tokenProvider?.();
  } catch {
    throw createCsrfTokenMissingError();
  }
  if (typeof token !== "string" || token.trim().length === 0) {
    throw createCsrfTokenMissingError();
  }
  headers.set(miaixzHeaders.csrfToken, token.trim());
}

/**
 * Executes one logical API request through preparation, retries, parsing, and telemetry.
 *
 * @typeParam TResponse - Final response data type.
 * @typeParam TBody - Request body type.
 * @param options - Stable client configuration.
 * @param baseUrl - Normalized client base URL.
 * @param fetchImplementation - Fetch implementation selected by the façade.
 * @param path - Relative request path.
 * @param requestOptions - Per-request behavior.
 * @returns Final immutable HTTP response.
 */
export async function executeMiaixzApiRequest<
  TResponse,
  TBody extends MiaixzRequestBody = MiaixzRequestBody,
>(
  options: MiaixzApiClientOptions,
  baseUrl: string,
  fetchImplementation: typeof fetch,
  path: string,
  requestOptions: MiaixzRequestOptions<TResponse, TBody> = {},
): Promise<MiaixzHttpResponse<TResponse>> {
  const method = requestOptions.method ?? "GET";
  const url = appendMiaixzQuery(
    resolveRequestUrl(baseUrl, path, createRequestOriginError),
    requestOptions.query,
  );
  const timeoutMs = normalizeTimeout(
    requestOptions.timeoutMs ?? options.timeoutMs ?? miaixzDefaultRequestTimeoutMs,
  );
  const maximumRetries = normalizeRetry(requestOptions.retry ?? options.retry ?? 0);
  const responseType = requestOptions.responseType ?? "auto";
  const headers = new Headers(options.headers);
  const protectedContextHeaderNames = new Set(options.contextHeaderNames);
  new Headers(requestOptions.headers).forEach((value, key) => headers.set(key, value));
  const authenticationEnabled =
    requestOptions.authenticate !== false &&
    (options.authorizationProvider !== undefined ||
      options.tokenProvider !== undefined ||
      options.csrf?.required === true);
  if (requestOptions.authenticate !== false) {
    const authorization = await options.authorizationProvider?.();
    const token = authorization ? undefined : await options.tokenProvider?.();
    if (!headers.has(miaixzHeaders.authorization)) {
      if (authorization) headers.set(miaixzHeaders.authorization, authorization);
      else if (token) headers.set(miaixzHeaders.authorization, `Bearer ${token}`);
    }
  }
  if (requestOptions.includeContext !== false) {
    const contextHeaders = await options.contextHeadersProvider?.();
    new Headers(contextHeaders).forEach((value, key) => {
      protectedContextHeaderNames.add(key.toLowerCase());
      if (!headers.has(key)) headers.set(key, value);
    });
  }
  const logicalRequestId = resolveLogicalRequestId(headers);
  const body = serializeBody(requestOptions.body, headers);
  let attempt = 0;

  while (true) {
    const started = Date.now();
    const abortContext = createAbortContext(requestOptions.signal, timeoutMs);
    let prepared: MiaixzPreparedRequest = {
      url,
      attempt,
      init: {
        method,
        headers,
        credentials: requestOptions.credentials ?? options.credentials ?? "same-origin",
        signal: abortContext.signal,
        ...(body === undefined ? {} : { body }),
      },
    };
    try {
      for (const interceptor of options.requestInterceptors ?? [])
        prepared = await interceptor(prepared);
      const preparedUrl = validatePreparedRequestUrl(
        baseUrl,
        prepared.url,
        createRequestOriginError,
      );
      const preparedHeaders = new Headers(prepared.init.headers);
      const preparedMethod = String(
        prepared.init.method ?? method,
      ).toUpperCase() as MiaixzHttpMethod;
      await applyCsrfPolicy(preparedHeaders, preparedMethod, options.csrf);
      preparedHeaders.set(miaixzHeaders.requestId, logicalRequestId);
      const redirect = resolveRedirectMode(
        preparedHeaders,
        prepared.init.credentials,
        authenticationEnabled,
        protectedContextHeaderNames,
      );
      prepared = {
        ...prepared,
        url: preparedUrl,
        attempt,
        init: { ...prepared.init, headers: preparedHeaders, redirect },
      };
      await emitRequestTelemetry(
        options.telemetry,
        logicalRequestId,
        method,
        prepared,
        prepared.init.body === body ? requestOptions.body : prepared.init.body,
        started,
      );
      const rawResponse = await fetchImplementation(prepared.url, prepared.init);
      await emitResponseTelemetry(
        options.telemetry,
        logicalRequestId,
        method,
        prepared,
        rawResponse,
        started,
      );
      let parsedBody: unknown;
      try {
        parsedBody = await parseBody(rawResponse, rawResponse.ok ? responseType : "auto");
      } catch (cause) {
        if (rawResponse.ok) {
          throw createResponseInvalidError(cause, getRequestId(rawResponse.headers));
        }
        parsedBody = undefined;
      }
      if (!rawResponse.ok) {
        const problem = extractProblem(parsedBody, rawResponse, options.httpErrorMapper);
        const responseRequestId = problem.requestId ?? getRequestId(rawResponse.headers);
        const httpError = new MiaixzApiError({
          status: rawResponse.status,
          method,
          url: sanitizeErrorUrl(prepared.url),
          code: problem.code ?? `HTTP_${rawResponse.status}`,
          ...(responseRequestId === undefined ? {} : { requestId: responseRequestId }),
          retryable: retryableStatuses.has(rawResponse.status),
          ...(problem.serverMessage === undefined ? {} : { serverMessage: problem.serverMessage }),
        });
        const shouldRetry =
          attempt < maximumRetries &&
          retryableMethods.has(method) &&
          retryableStatuses.has(rawResponse.status);
        if (shouldRetry) {
          await emitErrorTelemetry(
            options.telemetry,
            logicalRequestId,
            method,
            prepared,
            httpError,
            started,
          );
          await wait(retryDelay(attempt, rawResponse), requestOptions.signal);
          attempt += 1;
          continue;
        }
        throw httpError;
      }
      const requestId = getRequestId(rawResponse.headers);
      let result: MiaixzHttpResponse<unknown> = {
        data: parsedBody,
        status: rawResponse.status,
        statusText: rawResponse.statusText,
        headers: rawResponse.headers,
        url: rawResponse.url || prepared.url,
        ...(requestId === undefined ? {} : { requestId }),
      };
      for (const interceptor of options.responseInterceptors ?? [])
        result = await interceptor(result);
      const data = parseResponseData(result.data, requestOptions.parse, result.requestId);
      return Object.freeze({ ...result, data });
    } catch (error) {
      const normalizedError = normalizeAttemptError(
        error,
        abortContext,
        requestOptions.signal,
        timeoutMs,
      );
      await emitErrorTelemetry(
        options.telemetry,
        logicalRequestId,
        method,
        prepared,
        normalizedError,
        started,
      );
      const shouldRetryNetwork =
        !(error instanceof MiaixzSdkError) &&
        !abortContext.timedOut() &&
        !requestOptions.signal?.aborted &&
        attempt < maximumRetries &&
        retryableMethods.has(method);
      if (shouldRetryNetwork) {
        try {
          await wait(retryDelay(attempt), requestOptions.signal);
        } catch (delayError) {
          const normalizedDelayError =
            delayError instanceof MiaixzSdkError
              ? delayError
              : new MiaixzAbortError({ cause: delayError });
          await emitErrorTelemetry(
            options.telemetry,
            logicalRequestId,
            method,
            prepared,
            normalizedDelayError,
            started,
          );
          throw normalizedDelayError;
        }
        attempt += 1;
        continue;
      }
      throw normalizedError;
    } finally {
      abortContext.dispose();
    }
  }
}
