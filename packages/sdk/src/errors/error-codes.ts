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
 * Maps every SDK-owned error code to its sole presentation message key.
 *
 * @public
 */
export const miaixzSdkErrorMessageKeys = Object.freeze({
  SDK_ERROR: "sdk.error.unknown",
  SDK_DESTROYED: "sdk.error.destroyed",
  ABORTED: "sdk.error.aborted",
  NETWORK_ERROR: "sdk.error.network",
  TIMEOUT: "sdk.error.timeout",
  FETCH_UNAVAILABLE: "sdk.error.api.fetchUnavailable",
  API_BASE_URL_INVALID: "sdk.error.api.baseUrlInvalid",
  API_REQUEST_ORIGIN_INVALID: "sdk.error.api.requestOriginInvalid",
  API_RESPONSE_INVALID: "sdk.error.api.responseInvalid",
  API_TIMEOUT_INVALID: "sdk.error.api.timeoutInvalid",
  API_RETRY_INVALID: "sdk.error.api.retryInvalid",
  API_CRYPTO_UNAVAILABLE: "sdk.error.api.cryptoUnavailable",
  CSRF_TOKEN_MISSING: "sdk.error.api.csrfTokenMissing",
  SESSION_PERSISTENCE_ACKNOWLEDGEMENT_REQUIRED:
    "sdk.error.session.persistenceAcknowledgementRequired",
  SESSION_REFRESH_FAILED: "sdk.error.session.refreshFailed",
  SESSION_INVALID: "sdk.error.session.invalid",
  CONFIG_INVALID: "sdk.error.config.invalid",
  CONFIG_FETCH_UNAVAILABLE: "sdk.error.config.fetchUnavailable",
  CONFIG_FETCH_FAILED: "sdk.error.config.fetchFailed",
  SERVICE_ENDPOINT_MISSING: "sdk.error.config.serviceMissing",
  GRANTS_INVALID: "sdk.error.grants.invalid",
  FILE_DOWNLOAD_FAILED: "sdk.error.file.downloadFailed",
  MODULE_MANIFEST_INVALID: "sdk.error.module.manifestInvalid",
  MODULE_HOST_INCOMPATIBLE: "sdk.error.module.hostIncompatible",
  BRIDGE_CAPABILITY_UNAVAILABLE: "sdk.error.bridge.capabilityUnavailable",
  BRIDGE_NAVIGATION_STATE_INVALID: "sdk.error.bridge.navigationStateInvalid",
  BRIDGE_ORIGIN_INVALID: "sdk.error.bridge.originInvalid",
  BRIDGE_MESSAGE_INVALID: "sdk.error.bridge.messageInvalid",
  BRIDGE_RESOURCE_LIMIT_EXCEEDED: "sdk.error.bridge.resourceLimitExceeded",
  BRIDGE_NOT_READY: "sdk.error.bridge.notReady",
  BRIDGE_TIMEOUT: "sdk.error.bridge.timeout",
  BRIDGE_DISPOSED: "sdk.error.bridge.disposed",
  BRIDGE_CRYPTO_UNAVAILABLE: "sdk.error.bridge.cryptoUnavailable",
  EVENT_CHANNEL_INVALID: "sdk.error.event.channelInvalid",
  EVENT_VALIDATOR_MISSING: "sdk.error.event.validatorMissing",
  EVENT_PAYLOAD_NOT_CLONEABLE: "sdk.error.event.payloadNotCloneable",
  EVENT_CRYPTO_UNAVAILABLE: "sdk.error.event.cryptoUnavailable",
  APPEARANCE_INVALID: "sdk.error.appearance.invalid",
  APPEARANCE_PERSIST_FAILED: "sdk.error.appearance.persistFailed",
  APPEARANCE_SCOPE_INVALID: "sdk.error.appearance.scopeInvalid",
  APPEARANCE_COLOR_INVALID: "sdk.error.appearance.colorInvalid",
  APPEARANCE_CONTRAST_INVALID: "sdk.error.appearance.contrastInvalid",
  STORAGE_SCOPE_INVALID: "sdk.error.storage.scopeInvalid",
  STORAGE_MIGRATION_CHAIN_INVALID: "sdk.error.storage.migrationChainInvalid",
  I18N_LOCALE_INVALID: "sdk.error.i18n.localeInvalid",
  I18N_NAMESPACE_INVALID: "sdk.error.i18n.namespaceInvalid",
  I18N_MESSAGES_INVALID: "sdk.error.i18n.messagesInvalid",
  I18N_LOCALE_DEFINITION_INVALID: "sdk.error.i18n.localeDefinitionInvalid",
  I18N_LOCALE_DUPLICATE: "sdk.error.i18n.localeDuplicate",
  I18N_LOAD_FAILED: "sdk.error.i18n.loadFailed",
} as const);

/**
 * SDK-owned error codes with statically registered message keys.
 *
 * @public
 */
export type MiaixzSdkErrorCode = keyof typeof miaixzSdkErrorMessageKeys;

/**
 * Resolves SDK-owned and server-provided codes without accepting a caller-owned message key.
 *
 * @param code - Machine-readable SDK or backend error code.
 * @returns The sole presentation message key for the supplied code.
 * @public
 */
export function getMiaixzSdkErrorMessageKey(code: string): string {
  if (Object.hasOwn(miaixzSdkErrorMessageKeys, code)) {
    return miaixzSdkErrorMessageKeys[code as MiaixzSdkErrorCode];
  }
  if (/^HTTP_[1-5][0-9]{2}$/.test(code)) return "sdk.error.http";
  return "sdk.error.api.business";
}
