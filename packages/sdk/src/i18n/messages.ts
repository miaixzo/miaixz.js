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
 * Defines flat message collections and interpolation values used by translation.
 */

import { MiaixzSdkError } from "../errors/errors.js";

/**
 * Maps named message placeholders to scalar replacement values.
 *
 * @public
 */
export type MiaixzMessageParams = Readonly<Record<string, string | number | boolean>>;

/**
 * Maps translation keys to localized strings for one locale.
 *
 * @public
 */
export type MiaixzMessages = Readonly<Record<string, string>>;

/**
 * Maps locale identifiers to flat message collections.
 *
 * @public
 */
export type MiaixzMessageCatalog = Readonly<Record<string, MiaixzMessages>>;

/**
 * Identifies whether messages originate from a package or the consuming project.
 *
 * @public
 */
export type MiaixzMessageSource = "builtin" | "project";

/**
 * Describes an ES module whose default export contains localized messages.
 *
 * @public
 */
export interface MiaixzMessageModule {
  /**
   * Contains the localized messages exported by the language module.
   */
  readonly default: MiaixzMessages;
}

/**
 * Provides the built-in SDK messages in English and Simplified Chinese.
 *
 * @public
 */
export const miaixzSdkMessages: MiaixzMessageCatalog = Object.freeze({
  "en-US": Object.freeze({
    "sdk.error.unknown": "An unknown SDK error occurred",
    "sdk.error.destroyed": "The SDK has been destroyed",
    "sdk.error.network": "The network request failed",
    "sdk.error.timeout": "The request timed out after {timeoutMs}ms",
    "sdk.error.aborted": "The request was aborted",
    "sdk.error.http": "Request failed with status {status}",
    "sdk.error.api.fetchUnavailable": "A Fetch implementation is required",
    "sdk.error.api.baseUrlInvalid": "The API base URL is invalid",
    "sdk.error.api.requestOriginInvalid": "The request origin is invalid",
    "sdk.error.api.responseInvalid": "The API response data is invalid",
    "sdk.error.api.business": "The API rejected the request",
    "sdk.error.api.timeoutInvalid": "The request timeout must be a finite number greater than zero",
    "sdk.error.api.retryInvalid": "The retry count must be an integer from zero through five",
    "sdk.error.api.cryptoUnavailable": "A secure random identifier generator is required",
    "sdk.error.api.csrfTokenMissing": "The CSRF token is missing",
    "sdk.error.session.invalid": "The session is invalid",
    "sdk.error.session.refreshFailed": "The session could not be refreshed",
    "sdk.error.session.persistenceAcknowledgementRequired":
      "Persistent session storage requires explicit Web Storage risk acknowledgement",
    "sdk.error.auth.modeMismatch":
      "The requested authentication operation is unavailable in this mode",
    "sdk.error.config.invalid": "The SDK configuration is invalid",
    "sdk.error.config.fetchUnavailable": "A Fetch implementation is required to load configuration",
    "sdk.error.config.fetchFailed": "The configuration could not be loaded",
    "sdk.error.config.serviceMissing": "Service endpoint {service} is not configured",
    "sdk.error.grants.invalid": "The grant snapshot is invalid",
    "sdk.error.file.download": "The file could not be downloaded",
    "sdk.error.file.downloadFailed": "The file could not be downloaded",
    "sdk.error.module.manifestInvalid": "The module manifest is invalid",
    "sdk.error.module.hostIncompatible": "The module is incompatible with this host",
    "sdk.error.bridge.capabilityUnavailable": "The requested host capability is unavailable",
    "sdk.error.bridge.navigationStateInvalid": "The requested navigation state is invalid",
    "sdk.error.bridge.originInvalid": "The module origin is invalid",
    "sdk.error.bridge.messageInvalid": "The module bridge message is invalid",
    "sdk.error.bridge.resourceLimitExceeded": "The module bridge resource limit was exceeded",
    "sdk.error.bridge.notReady": "The module bridge is not ready",
    "sdk.error.bridge.timeout": "The module bridge request timed out",
    "sdk.error.bridge.disposed": "The module bridge has been disposed",
    "sdk.error.bridge.cryptoUnavailable": "A secure random identifier generator is required",
    "sdk.error.event.channelInvalid": "The event channel is invalid",
    "sdk.error.event.validatorMissing": "The event payload validator is missing",
    "sdk.error.event.payloadNotCloneable": "The event payload cannot be safely cloned",
    "sdk.error.event.cryptoUnavailable": "A secure random identifier generator is required",
    "sdk.error.appearance.invalid": "The appearance settings are invalid",
    "sdk.error.appearance.persistFailed": "The appearance settings could not be persisted",
    "sdk.error.appearance.scopeInvalid": "The appearance persistence scope is invalid",
    "sdk.error.appearance.colorInvalid": "The appearance color is invalid",
    "sdk.error.appearance.contrastInvalid": "The appearance color contrast is insufficient",
    "sdk.error.storage.scopeInvalid": "The storage scope is invalid",
    "sdk.error.storage.migrationChainInvalid": "The storage migration chain is invalid",
    "sdk.error.i18n.localeInvalid": "The locale is invalid",
    "sdk.error.i18n.namespaceInvalid": "The message namespace is invalid",
    "sdk.error.i18n.messagesInvalid": "The language file is invalid",
    "sdk.error.i18n.localeDefinitionInvalid": "The locale definition is invalid",
    "sdk.error.i18n.localeDuplicate": "The locale is already registered",
    "sdk.error.i18n.loadFailed": "The {namespace} messages for {locale} could not be loaded",
  }),
  "zh-CN": Object.freeze({
    "sdk.error.unknown": "发生未知 SDK 错误",
    "sdk.error.destroyed": "SDK 已被销毁",
    "sdk.error.network": "网络请求失败",
    "sdk.error.timeout": "请求在 {timeoutMs} 毫秒后超时",
    "sdk.error.aborted": "请求已取消",
    "sdk.error.http": "请求失败，状态码为 {status}",
    "sdk.error.api.fetchUnavailable": "需要提供 Fetch 实现",
    "sdk.error.api.baseUrlInvalid": "API 基础地址无效",
    "sdk.error.api.requestOriginInvalid": "请求来源无效",
    "sdk.error.api.responseInvalid": "API 响应数据无效",
    "sdk.error.api.business": "API 拒绝了该请求",
    "sdk.error.api.timeoutInvalid": "请求超时时间必须是大于零的有限数值",
    "sdk.error.api.retryInvalid": "重试次数必须是零到五之间的整数",
    "sdk.error.api.cryptoUnavailable": "需要安全的随机标识生成器",
    "sdk.error.api.csrfTokenMissing": "缺少 CSRF 令牌",
    "sdk.error.session.invalid": "登录会话无效",
    "sdk.error.session.refreshFailed": "无法刷新登录会话",
    "sdk.error.session.persistenceAcknowledgementRequired":
      "持久化会话存储需要显式确认 Web Storage 安全风险",
    "sdk.error.auth.modeMismatch": "当前认证模式不支持该操作",
    "sdk.error.config.invalid": "SDK 配置无效",
    "sdk.error.config.fetchUnavailable": "加载配置需要提供 Fetch 实现",
    "sdk.error.config.fetchFailed": "无法加载配置",
    "sdk.error.config.serviceMissing": "未配置服务端点 {service}",
    "sdk.error.grants.invalid": "授权快照无效",
    "sdk.error.file.download": "文件下载失败",
    "sdk.error.file.downloadFailed": "文件下载失败",
    "sdk.error.module.manifestInvalid": "模块清单无效",
    "sdk.error.module.hostIncompatible": "模块与当前宿主不兼容",
    "sdk.error.bridge.capabilityUnavailable": "请求的宿主能力不可用",
    "sdk.error.bridge.navigationStateInvalid": "请求的导航状态无效",
    "sdk.error.bridge.originInvalid": "模块来源无效",
    "sdk.error.bridge.messageInvalid": "模块桥接消息无效",
    "sdk.error.bridge.resourceLimitExceeded": "模块桥接资源已超过限制",
    "sdk.error.bridge.notReady": "模块桥接尚未就绪",
    "sdk.error.bridge.timeout": "模块桥接请求超时",
    "sdk.error.bridge.disposed": "模块桥接已释放",
    "sdk.error.bridge.cryptoUnavailable": "需要安全的随机标识生成器",
    "sdk.error.event.channelInvalid": "事件通道无效",
    "sdk.error.event.validatorMissing": "缺少事件载荷校验器",
    "sdk.error.event.payloadNotCloneable": "事件载荷无法安全复制",
    "sdk.error.event.cryptoUnavailable": "需要安全的随机标识生成器",
    "sdk.error.appearance.invalid": "外观设置无效",
    "sdk.error.appearance.persistFailed": "无法持久化外观设置",
    "sdk.error.appearance.scopeInvalid": "外观持久化范围无效",
    "sdk.error.appearance.colorInvalid": "外观颜色无效",
    "sdk.error.appearance.contrastInvalid": "外观颜色对比度不足",
    "sdk.error.storage.scopeInvalid": "存储范围无效",
    "sdk.error.storage.migrationChainInvalid": "存储迁移链无效",
    "sdk.error.i18n.localeInvalid": "语言区域标识无效",
    "sdk.error.i18n.namespaceInvalid": "消息命名空间无效",
    "sdk.error.i18n.messagesInvalid": "语言文件无效",
    "sdk.error.i18n.localeDefinitionInvalid": "语言定义无效",
    "sdk.error.i18n.localeDuplicate": "语言已经注册",
    "sdk.error.i18n.loadFailed": "无法加载 {locale} 的 {namespace} 消息",
  }),
});

const namespacePattern = /^[a-z][a-z0-9-]{1,63}$/;

/**
 * Mutable internal storage grouped by namespace and locale.
 */
export type MutableCatalog = Map<string, Map<string, Record<string, string>>>;

/**
 * Resolves one built-in SDK message before a runtime is available.
 *
 * @param locale - Preferred locale.
 * @param key - Registered SDK message key.
 * @param params - Optional interpolation values.
 * @returns Localized built-in text or the key itself.
 */
function resolveBuiltinMessage(locale: string, key: string, params?: MiaixzMessageParams): string {
  let canonical: string;
  try {
    canonical = Intl.getCanonicalLocales(locale)[0] ?? "en-US";
  } catch {
    canonical = "en-US";
  }
  const language = canonical.split("-")[0]?.toLowerCase();
  const matched = Object.keys(miaixzSdkMessages)
    .sort()
    .find((candidate) => candidate.split("-")[0]?.toLowerCase() === language);
  const message =
    miaixzSdkMessages[canonical]?.[key] ??
    (matched ? miaixzSdkMessages[matched]?.[key] : undefined) ??
    miaixzSdkMessages["en-US"]?.[key] ??
    key;
  return interpolate(message, params);
}

/**
 * Creates a localized SDK error for an invalid internationalization value.
 *
 * @param code - Stable registry error code.
 * @returns Localized SDK error without the rejected value.
 */
export function createI18nContractError(
  code:
    | "I18N_LOCALE_INVALID"
    | "I18N_NAMESPACE_INVALID"
    | "I18N_MESSAGES_INVALID"
    | "I18N_LOCALE_DEFINITION_INVALID"
    | "I18N_LOCALE_DUPLICATE",
): MiaixzSdkError {
  return new MiaixzSdkError({ code });
}

/**
 * Validates and returns a message namespace.
 *
 * @param namespace - Namespace candidate to validate.
 * @returns The unchanged valid namespace.
 * @throws MiaixzSdkError When the namespace violates the frozen syntax.
 */
export function validateNamespace(namespace: string): string {
  if (!namespacePattern.test(namespace)) {
    throw createI18nContractError("I18N_NAMESPACE_INVALID");
  }
  return namespace;
}

/**
 * Determines whether a runtime value is a flat message object.
 *
 * @param value - Runtime value to inspect.
 * @returns Whether every own enumerable value is a string.
 */
export function isMessages(value: unknown): value is MiaixzMessages {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((message) => typeof message === "string")
  );
}

/**
 * Validates that messages are flat and owned by one namespace.
 *
 * @param namespace - Namespace that must own every message key.
 * @param messages - Runtime message collection to validate.
 * @returns A safe mutable copy of the validated messages.
 */
export function validateMessages(namespace: string, messages: unknown): Record<string, string> {
  if (!isMessages(messages)) {
    throw createI18nContractError("I18N_MESSAGES_INVALID");
  }
  if (Object.keys(messages).some((key) => !key.startsWith(`${namespace}.`))) {
    throw createI18nContractError("I18N_NAMESPACE_INVALID");
  }
  return { ...messages };
}

/**
 * Replaces supplied scalar placeholders and preserves missing placeholders.
 *
 * @param message - Localized message template.
 * @param params - Optional named scalar values.
 * @returns Interpolated message.
 */
export function interpolate(message: string, params?: MiaixzMessageParams): string {
  if (!params) return message;
  return message.replace(/\{([\w.-]+)\}/g, (placeholder, key: string) => {
    const value = params[key];
    return value === undefined ? placeholder : String(value);
  });
}

/**
 * Resolves exact and base-language messages from one source catalog.
 *
 * @param catalog - Source catalog to search.
 * @param namespace - Namespace that owns the requested key.
 * @param locale - Canonical locale requested by the caller.
 * @param key - Message key to resolve.
 * @returns Exact or deterministic base-language message.
 */
export function resolveSourceMessage(
  catalog: MutableCatalog,
  namespace: string,
  locale: string,
  key: string,
): string | undefined {
  const locales = catalog.get(namespace);
  const exact = locales?.get(locale)?.[key];
  if (exact !== undefined) return exact;
  const language = locale.split("-")[0]?.toLowerCase() ?? locale.toLowerCase();
  const baseLocale = [...(locales?.keys() ?? [])]
    .sort()
    .find(
      (candidate) =>
        candidate !== locale &&
        (candidate.split("-")[0]?.toLowerCase() ?? candidate.toLowerCase()) === language,
    );
  return baseLocale ? locales?.get(baseLocale)?.[key] : undefined;
}
