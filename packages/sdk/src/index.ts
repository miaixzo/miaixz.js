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
 * Exports public SDK mechanisms, shared types, and runtime integration contracts.
 */

export { appendMiaixzQuery, createApiClient } from "./fabric/api/index.js";
export type {
  MiaixzApiClient,
  MiaixzApiClientOptions,
  MiaixzApiTelemetryHooks,
  MiaixzAuthorizationProvider,
  MiaixzContextHeadersProvider,
  MiaixzCsrfOptions,
  MiaixzCsrfTokenProvider,
  MiaixzErrorEvent,
  MiaixzHttpErrorDetails,
  MiaixzHttpErrorMapper,
  MiaixzHttpMethod,
  MiaixzHttpResponse,
  MiaixzPreparedRequest,
  MiaixzQuery,
  MiaixzQueryPrimitive,
  MiaixzQueryValue,
  MiaixzRequestBody,
  MiaixzRequestBodySummary,
  MiaixzRequestEvent,
  MiaixzRequestInterceptor,
  MiaixzRequestOptions,
  MiaixzResponseEvent,
  MiaixzResponseInterceptor,
  MiaixzResponseParser,
  MiaixzResponseType,
  MiaixzTokenProvider,
} from "./fabric/api/index.js";
export {
  createMiaixzAppearanceManager,
  isMiaixzAppearanceSettings,
  isMiaixzColorMode,
  isMiaixzDensity,
  isMiaixzThemeId,
  MiaixzAppearanceManager,
  miaixzAppearanceMigration,
  miaixzAppearanceSchemaVersion,
  miaixzColorModes,
  miaixzDefaultAppearance,
  miaixzDensities,
  miaixzThemeColorTokens,
  migrateMiaixzAppearanceV1,
  parseMiaixzAppearanceSettings,
} from "./display/index.js";
export type {
  MiaixzAppearanceManagerOptions,
  MiaixzAppearancePayload,
  MiaixzAppearanceSettings,
  MiaixzColorMode,
  MiaixzDensity,
  MiaixzResolvedColorMode,
  MiaixzThemeColorOverrides,
  MiaixzThemeColors,
  MiaixzThemeColorToken,
  MiaixzThemeOverrides,
} from "./display/index.js";
export {
  createMiaixzPersistentSessionStorage,
  createMiaixzSessionManager,
  isMiaixzSession,
  isMiaixzSessionExpired,
  MiaixzSessionManager,
} from "./access/session/index.js";
export type {
  MiaixzPersistentSessionStorage,
  MiaixzSession,
  MiaixzSessionManagerOptions,
  MiaixzSessionRefresher,
  MiaixzSessionStatus,
} from "./access/session/index.js";
export {
  defineMiaixzConfig,
  getMiaixzFeature,
  getMiaixzServiceEndpoint,
  isMiaixzSdkConfig,
  loadMiaixzConfig,
  MiaixzConfigStore,
} from "./runtime/config/index.js";
export type { MiaixzLoadConfigOptions } from "./runtime/config/index.js";
export { miaixzDefaultRequestTimeoutMs, miaixzHeaders, miaixzStorageKeys } from "./constants.js";
export {
  isMiaixzHostVersionCompatible,
  MIAIXZ_MODULE_PROTOCOL_VERSION,
  parseMiaixzModuleManifest,
} from "./runtime/contracts/index.js";
export type {
  MiaixzBridgeEnvelope,
  MiaixzDirectHostBridgeOptions,
  MiaixzHostAdapter,
  MiaixzHostBridge,
  MiaixzHostCapability,
  MiaixzIntegratedModule,
  MiaixzModuleHandle,
  MiaixzModuleKind,
  MiaixzModuleManifest,
  MiaixzModuleManifestParseOptions,
  MiaixzModuleMountContext,
  MiaixzModuleNavigationItem,
  MiaixzModuleRoute,
  MiaixzNavigationRequest,
  MiaixzPostMessageChildOptions,
  MiaixzPostMessageHost,
  MiaixzPostMessageHostLimits,
  MiaixzPostMessageHostOptions,
} from "./runtime/contracts/index.js";
export { createMiaixzEventBus, MiaixzEventBus } from "./runtime/events/index.js";
export type {
  MiaixzEventBusOptions,
  MiaixzEventEmitOptions,
  MiaixzEventEnvelope,
  MiaixzEventListener,
  MiaixzEventName,
  MiaixzEventValidator,
  MiaixzLocaleChangedEvent,
  MiaixzSdkEventMap,
  MiaixzSessionStatusEvent,
} from "./runtime/events/index.js";
export {
  getMiaixzSdkErrorMessageKey,
  isMiaixzApiError,
  isMiaixzSdkError,
  MiaixzAbortError,
  MiaixzApiError,
  MiaixzNetworkError,
  MiaixzSdkError,
  miaixzSdkErrorMessageKeys,
  MiaixzTimeoutError,
  normalizeMiaixzError,
} from "./errors/index.js";
export type {
  MiaixzApiErrorOptions,
  MiaixzSdkErrorCode,
  MiaixzSdkErrorOptions,
} from "./errors/index.js";
export {
  createMiaixzFileClient,
  getMiaixzDownloadFilename,
  MiaixzFileClient,
  saveMiaixzBlob,
  serializeMiaixzCsv,
} from "./fabric/files/index.js";
export type {
  MiaixzDownloadedFile,
  MiaixzDownloadOptions,
  MiaixzUploadOptions,
} from "./fabric/files/index.js";
export {
  formatMiaixzBytes,
  formatMiaixzDate,
  formatMiaixzNumber,
} from "./i18n/formatters/index.js";
export type { MiaixzFormatOptions } from "./i18n/formatters/index.js";
export {
  createMiaixzI18n,
  createMiaixzMessageLoader,
  defineLocale,
  getMiaixzBrowserLocale,
  miaixzBuiltInLocales,
  MiaixzI18n,
  MiaixzI18nLoadError,
  MiaixzLocaleCatalog,
  miaixzSdkMessages,
} from "./i18n/index.js";
export type {
  MiaixzI18nOptions,
  MiaixzI18nSnapshot,
  MiaixzLocale,
  MiaixzLocaleDefinition,
  MiaixzLocaleDescriptor,
  MiaixzLocaleDirection,
  MiaixzMessageCatalog,
  MiaixzMessageLoader,
  MiaixzMessageLoaderMap,
  MiaixzMessageLoaderResult,
  MiaixzMessageModule,
  MiaixzMessageParams,
  MiaixzMessages,
  MiaixzMessageSource,
  MiaixzTranslator,
} from "./i18n/index.js";
export {
  createMiaixzGrantSet,
  isMiaixzGrantSnapshot,
  MiaixzGrantSet,
} from "./access/grants/index.js";
export {
  createMiaixzDirectHostBridge,
  createMiaixzPostMessageChildBridge,
  createMiaixzPostMessageHost,
} from "./runtime/index.js";
export {
  createMiaixzStorageKey,
  getMiaixzBrowserStorage,
  MiaixzMemoryStorage,
  MiaixzNamespacedStorage,
  readMiaixzJson,
  readMiaixzVersionedValue,
  writeMiaixzJson,
  writeMiaixzVersionedValue,
} from "./runtime/storage/index.js";
export type {
  MiaixzKeyValueStorage,
  MiaixzStorageMigration,
  MiaixzStorageScope,
  MiaixzVersionedStorageOptions,
  MiaixzVersionedValue,
} from "./runtime/storage/index.js";
export { getMiaixzPageCount } from "./types.js";
export type {
  MiaixzApiProblem,
  MiaixzEntity,
  MiaixzEnvironment,
  MiaixzFeatureValue,
  MiaixzFileDescriptor,
  MiaixzGrantSnapshot,
  MiaixzIdentifier,
  MiaixzPage,
  MiaixzPagination,
  MiaixzPermissionCode,
  MiaixzSdkConfig,
  MiaixzTimestamp,
  MiaixzUploadResult,
  MiaixzUserSummary,
} from "./types.js";
export {
  clamp,
  cloneMiaixzJsonValue,
  freezeMiaixzJsonValue,
  isNonEmptyString,
  isRecord,
  isValidDate,
  mergeMiaixzJsonValue,
  resolveCollectionValue,
} from "./shared/index.js";
export type { MiaixzDeepReadonly, MiaixzJsonOptions } from "./shared/index.js";

export { VERSION } from "./version.js";
