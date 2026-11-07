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
 * Exports HTTP clients, response contracts, error adapters, and telemetry types.
 */

export { appendMiaixzQuery, createApiClient } from "./client.js";
export type {
  MiaixzApiClient,
  MiaixzApiClientOptions,
  MiaixzAuthorizationProvider,
  MiaixzContextHeadersProvider,
  MiaixzCsrfOptions,
  MiaixzCsrfTokenProvider,
  MiaixzTokenProvider,
} from "./client.js";
export type {
  MiaixzHttpMethod,
  MiaixzPreparedRequest,
  MiaixzQuery,
  MiaixzQueryPrimitive,
  MiaixzQueryValue,
  MiaixzRequestBody,
  MiaixzRequestInterceptor,
  MiaixzRequestOptions,
  MiaixzResponseParser,
  MiaixzResponseType,
} from "./request.js";
export type {
  MiaixzHttpErrorDetails,
  MiaixzHttpErrorMapper,
  MiaixzHttpResponse,
  MiaixzResponseInterceptor,
} from "./response.js";
export type {
  MiaixzApiTelemetryHooks,
  MiaixzErrorEvent,
  MiaixzRequestBodySummary,
  MiaixzRequestEvent,
  MiaixzResponseEvent,
} from "./telemetry.types.js";
