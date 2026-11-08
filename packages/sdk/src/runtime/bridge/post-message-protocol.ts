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
 * Defines and validates bridge envelopes, origins, identifiers, and sanitized remote errors.
 */

import {
  getMiaixzSdkErrorMessageKey,
  miaixzSdkErrorMessageKeys,
} from "../../errors/error-codes.js";
import { MiaixzSdkError } from "../../errors/errors.js";
import { MIAIXZ_MODULE_PROTOCOL_VERSION } from "../contracts/module-manifest.js";
import type { MiaixzBridgeEnvelope } from "../contracts/post-message.js";
import type { MiaixzPostMessageHostLimits } from "../contracts/post-message.js";
import type { MiaixzHostAdapter, MiaixzNavigationRequest } from "../contracts/host-context.js";
import { isMiaixzModulePermission } from "../contracts/permission.js";
import type { MiaixzMessageCatalog } from "../../i18n/i18n.js";
import { defaultPostMessageHostLimits } from "./bridge-limits.js";
import { assertBridgePayloadWithinLimits } from "./payload-budget.js";

const bridgeTextEncoder = new TextEncoder();

/**
 * Identifies one protocol envelope kind.
 */
export type BridgeKind = MiaixzBridgeEnvelope["kind"];

/**
 * Enumerates errors emitted by the bridge protocol.
 */
export type BridgeErrorCode =
  | "BRIDGE_CAPABILITY_UNAVAILABLE"
  | "BRIDGE_CRYPTO_UNAVAILABLE"
  | "BRIDGE_DISPOSED"
  | "BRIDGE_MESSAGE_INVALID"
  | "BRIDGE_NAVIGATION_STATE_INVALID"
  | "BRIDGE_NOT_READY"
  | "BRIDGE_ORIGIN_INVALID"
  | "BRIDGE_RESOURCE_LIMIT_EXCEEDED"
  | "BRIDGE_TIMEOUT"
  | "MODULE_HOST_INCOMPATIBLE"
  | "MODULE_MANIFEST_INVALID";

/**
 * Safe error fields accepted from a remote bridge endpoint.
 */
export interface SafeRemoteError {
  /**
   * Stable registered SDK error code.
   */
  readonly code: string;

  /**
   * Registered internationalization key for the error.
   */
  readonly messageKey: string;
}

/**
 * Successful event-subscription response payload.
 */
export interface SubscriptionResponse {
  /**
   * Secure identifier assigned to one Host subscription.
   */
  readonly subscriptionId: string;
}

/**
 * Valid module identifier syntax.
 */
export const moduleIdentifierPattern = /^[a-z][a-z0-9-]{1,63}$/;

/**
 * Valid module semantic-version syntax.
 */
export const semanticVersionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?$/;

/**
 * Valid secure message and subscription identifier syntax.
 */
export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Exact protocol envelope property allow-list.
 */
export const envelopeKeys = new Set([
  "channel",
  "protocolVersion",
  "messageId",
  "moduleId",
  "kind",
  "method",
  "payload",
  "error",
]);

/**
 * Exact protocol envelope kind allow-list.
 */
export const bridgeKinds = new Set<BridgeKind>(["request", "response", "event", "cancel"]);

/**
 * Exact bridge method allow-list.
 */
export const allowedMethods = new Set([
  "bridge.handshake",
  "bridge.dispose",
  "context.get",
  "events.emit",
  "events.message",
  "events.subscribe",
  "events.unsubscribe",
  "i18n.register",
  "navigation.navigate",
  "permissions.has",
]);

/**
 * Creates a registered Bridge error without caller-owned diagnostic values.
 *
 * @param code - Stable registered Bridge error code.
 * @returns Localized SDK error.
 */
export function bridgeError(code: BridgeErrorCode): MiaixzSdkError {
  return new MiaixzSdkError({ code });
}

/**
 * Determines whether a value is a plain record.
 *
 * @param value - Runtime value to inspect.
 * @returns Whether the value is a record without a custom prototype.
 */
export function isPlainRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Determines whether a record contains exactly allowed field names.
 *
 * @param value - Record whose enumerable keys should be checked.
 * @param allowed - Complete allowed key set.
 * @returns Whether every key is allowed.
 */
export function hasOnlyKeys(
  value: Readonly<Record<string, unknown>>,
  allowed: ReadonlySet<string>,
): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

/**
 * Resolves the current Realm Window required by postMessage Bridge factories.
 *
 * @returns Browser Window capable of registering message listeners.
 * @throws MiaixzSdkError When the current Realm lacks required Window capabilities.
 */
export function getRuntimeWindow(): Window {
  const candidate = globalThis.window;
  if (
    candidate === undefined ||
    typeof candidate.addEventListener !== "function" ||
    typeof candidate.removeEventListener !== "function"
  ) {
    throw bridgeError("BRIDGE_CAPABILITY_UNAVAILABLE");
  }
  return candidate;
}

/**
 * Validates a Window used as the single postMessage target.
 *
 * @param targetWindow - Window candidate to validate.
 * @returns Valid target Window.
 * @throws MiaixzSdkError When postMessage is unavailable.
 */
export function parseTargetWindow(targetWindow: Window): Window {
  if (targetWindow === null || typeof targetWindow?.postMessage !== "function") {
    throw bridgeError("BRIDGE_CAPABILITY_UNAVAILABLE");
  }
  return targetWindow;
}

/**
 * Validates one exact HTTP or HTTPS origin string.
 *
 * @param value - Origin candidate.
 * @returns Canonical origin identical to the supplied value.
 * @throws MiaixzSdkError When the value is not one exact origin.
 */
export function parseTargetOrigin(value: string): string {
  if (typeof value !== "string" || value === "*" || value === "null") {
    throw bridgeError("BRIDGE_ORIGIN_INVALID");
  }
  try {
    const parsed = new URL(value);
    if (
      (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
      parsed.origin !== value ||
      parsed.username !== "" ||
      parsed.password !== "" ||
      parsed.pathname !== "/" ||
      parsed.search !== "" ||
      parsed.hash !== ""
    ) {
      throw bridgeError("BRIDGE_ORIGIN_INVALID");
    }
    return parsed.origin;
  } catch (error) {
    if (error instanceof MiaixzSdkError) throw error;
    throw bridgeError("BRIDGE_ORIGIN_INVALID");
  }
}

/**
 * Validates one Bridge request timeout.
 *
 * @param timeoutMs - Optional timeout override.
 * @returns Valid timeout, defaulting to ten seconds.
 * @throws MiaixzSdkError When the timeout is outside the frozen range.
 */
export function parseTimeout(timeoutMs: number | undefined): number {
  const value = timeoutMs ?? 10_000;
  if (!Number.isInteger(value) || value < 1_000 || value > 60_000) {
    throw bridgeError("BRIDGE_MESSAGE_INVALID");
  }
  return value;
}

/**
 * Produces one secure Bridge message or subscription identifier.
 *
 * @returns Cryptographically secure UUID.
 * @throws MiaixzSdkError When secure UUID generation is unavailable.
 */
export function createMessageId(): string {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw bridgeError("BRIDGE_CRYPTO_UNAVAILABLE");
  }
  return globalThis.crypto.randomUUID();
}

/**
 * Validates the fixed Bridge envelope without interpreting method payloads.
 *
 * @param value - Incoming message data.
 * @returns Frozen typed envelope, or undefined for invalid data.
 */
export function parseEnvelope(value: unknown): MiaixzBridgeEnvelope | undefined {
  if (
    !isPlainRecord(value) ||
    !hasOnlyKeys(value, envelopeKeys) ||
    value.channel !== "miaixz.bridge" ||
    value.protocolVersion !== MIAIXZ_MODULE_PROTOCOL_VERSION ||
    typeof value.messageId !== "string" ||
    !uuidPattern.test(value.messageId) ||
    typeof value.moduleId !== "string" ||
    !moduleIdentifierPattern.test(value.moduleId) ||
    typeof value.kind !== "string" ||
    !bridgeKinds.has(value.kind as BridgeKind) ||
    typeof value.method !== "string" ||
    !allowedMethods.has(value.method)
  ) {
    return undefined;
  }
  if (value.error !== undefined) {
    if (
      value.kind !== "response" ||
      !isPlainRecord(value.error) ||
      !hasOnlyKeys(value.error, new Set(["code", "messageKey", "details"])) ||
      typeof value.error.code !== "string" ||
      typeof value.error.messageKey !== "string"
    ) {
      return undefined;
    }
    if (value.payload !== undefined || value.error.details !== undefined) return undefined;
  }
  return Object.freeze({ ...value }) as unknown as MiaixzBridgeEnvelope;
}

/**
 * Creates one immutable outgoing Bridge envelope.
 *
 * @param moduleId - Module owning the connection.
 * @param kind - Message state-machine branch.
 * @param method - Allow-listed Bridge method.
 * @param messageId - Existing request identifier or a new event identifier.
 * @param payload - Optional method payload.
 * @param error - Optional safe remote error.
 * @returns Frozen Bridge envelope.
 */
export function createEnvelope(
  moduleId: string,
  kind: BridgeKind,
  method: string,
  messageId: string,
  payload?: unknown,
  error?: MiaixzBridgeEnvelope["error"],
): MiaixzBridgeEnvelope {
  return Object.freeze({
    channel: "miaixz.bridge",
    protocolVersion: MIAIXZ_MODULE_PROTOCOL_VERSION,
    messageId,
    moduleId,
    kind,
    method,
    ...(payload === undefined ? {} : { payload }),
    ...(error === undefined ? {} : { error }),
  });
}

/**
 * Maps an Adapter failure to the only safe cross-origin error fields.
 *
 * @param error - Local Adapter failure.
 * @returns Frozen registered error code and message key.
 */
export function serializeError(error: unknown): Readonly<SafeRemoteError> {
  const candidate = error instanceof MiaixzSdkError ? error.code : undefined;
  const code =
    candidate !== undefined && Object.hasOwn(miaixzSdkErrorMessageKeys, candidate)
      ? candidate
      : "BRIDGE_MESSAGE_INVALID";
  return Object.freeze({
    code,
    messageKey: getMiaixzSdkErrorMessageKey(code),
  });
}

/**
 * Reconstructs a safe local SDK error from one remote response.
 *
 * @param error - Remote error fields.
 * @returns Localized SDK error without remote cause or stack.
 */
export function deserializeError(
  error: NonNullable<MiaixzBridgeEnvelope["error"]>,
): MiaixzSdkError {
  const code = error.code;
  if (!Object.hasOwn(miaixzSdkErrorMessageKeys, code)) {
    return bridgeError("BRIDGE_MESSAGE_INVALID");
  }
  const messageKey = getMiaixzSdkErrorMessageKey(code);
  if (error.messageKey !== messageKey) {
    return bridgeError("BRIDGE_MESSAGE_INVALID");
  }
  return new MiaixzSdkError({ code });
}

/**
 * Validates and clones a same-site navigation request.
 *
 * @param value - Request payload to validate.
 * @param limits - Host payload limits.
 * @returns Frozen navigation request.
 * @throws MiaixzSdkError When the request or state is invalid.
 */
export function parseNavigation(
  value: unknown,
  limits: Readonly<MiaixzPostMessageHostLimits> = defaultPostMessageHostLimits,
): MiaixzNavigationRequest {
  if (
    !isPlainRecord(value) ||
    !hasOnlyKeys(value, new Set(["path", "replace", "state"])) ||
    typeof value.path !== "string" ||
    !value.path.startsWith("/") ||
    value.path.startsWith("//") ||
    value.path.includes("\\") ||
    (value.replace !== undefined && typeof value.replace !== "boolean")
  ) {
    throw bridgeError("BRIDGE_MESSAGE_INVALID");
  }
  let state: unknown;
  if (value.state !== undefined) {
    try {
      assertBridgePayloadWithinLimits(value.state, limits);
      state = structuredClone(value.state);
    } catch {
      throw bridgeError("BRIDGE_NAVIGATION_STATE_INVALID");
    }
  }
  return Object.freeze({
    path: value.path,
    ...(value.replace === undefined ? {} : { replace: value.replace }),
    ...(value.state === undefined ? {} : { state }),
  });
}

/**
 * Validates one permission list sent through the Bridge.
 *
 * @param value - Permission payload field.
 * @param limits - Host payload limits.
 * @returns Frozen permission copy.
 * @throws MiaixzSdkError When a permission is malformed.
 */
export function parsePermissions(
  value: unknown,
  limits: Readonly<MiaixzPostMessageHostLimits> = defaultPostMessageHostLimits,
): readonly string[] {
  if (!Array.isArray(value) || value.length > limits.maxPayloadNodes) {
    throw bridgeError("BRIDGE_MESSAGE_INVALID");
  }
  let bytes = 0;
  for (const permission of value) {
    if (!isMiaixzModulePermission(permission)) throw bridgeError("BRIDGE_MESSAGE_INVALID");
    bytes += bridgeTextEncoder.encode(permission).byteLength;
    if (bytes > limits.maxPayloadBytes) throw bridgeError("BRIDGE_RESOURCE_LIMIT_EXCEEDED");
  }
  return Object.freeze([...value]);
}

/**
 * Applies the caller's synchronous context projection without exposing parser failures.
 *
 * @typeParam Context - Caller-defined context accepted by the parser.
 * @param value - Context payload to validate.
 * @param parser - Caller-owned projection, validation, and immutable-copy boundary.
 * @returns The context selected and validated by the caller.
 * @throws MiaixzSdkError When the parser is absent, rejects the value, or returns a thenable.
 */
export function parseBridgeContext<Context = unknown>(
  value: unknown,
  parser: ((value: unknown) => Readonly<Context>) | undefined,
): Readonly<Context> {
  if (typeof parser !== "function") throw bridgeError("BRIDGE_CAPABILITY_UNAVAILABLE");
  try {
    const parsed = parser(value);
    if (
      ((typeof parsed === "object" && parsed !== null) || typeof parsed === "function") &&
      typeof (parsed as { readonly then?: unknown }).then === "function"
    ) {
      void Promise.resolve(parsed).catch(() => undefined);
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    }
    return parsed;
  } catch {
    throw bridgeError("BRIDGE_MESSAGE_INVALID");
  }
}

/**
 * Validates and defensively freezes a project message catalog.
 *
 * @param namespace - Module namespace that must own every message key.
 * @param value - Catalog payload to validate.
 * @param limits - Host catalog and payload limits.
 * @returns Frozen locale and message map.
 * @throws MiaixzSdkError When a locale or message collection is invalid.
 */
export function parseMessageCatalog(
  namespace: string,
  value: unknown,
  limits: Readonly<MiaixzPostMessageHostLimits> = defaultPostMessageHostLimits,
): MiaixzMessageCatalog {
  if (!isPlainRecord(value)) throw bridgeError("BRIDGE_MESSAGE_INVALID");
  const catalog: Record<string, Readonly<Record<string, string>>> = {};
  const localeDescriptors = Object.getOwnPropertyDescriptors(value);
  const locales = Object.keys(localeDescriptors);
  if (locales.length > limits.maxCatalogLocales) {
    throw bridgeError("BRIDGE_RESOURCE_LIMIT_EXCEEDED");
  }
  let bytes = 0;
  let nodes = 1;
  for (const locale of locales) {
    const localeDescriptor = localeDescriptors[locale];
    if (localeDescriptor === undefined || !("value" in localeDescriptor)) {
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    }
    const messages = localeDescriptor.value;
    try {
      if (Intl.getCanonicalLocales(locale)[0] !== locale) throw new Error("non-canonical locale");
    } catch {
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    }
    if (!isPlainRecord(messages)) throw bridgeError("BRIDGE_MESSAGE_INVALID");
    const messageDescriptors = Object.getOwnPropertyDescriptors(messages);
    const messageKeys = Object.keys(messageDescriptors);
    if (messageKeys.length > limits.maxCatalogMessagesPerLocale) {
      throw bridgeError("BRIDGE_RESOURCE_LIMIT_EXCEEDED");
    }
    const copiedMessages: Record<string, string> = {};
    bytes += bridgeTextEncoder.encode(locale).byteLength;
    nodes += 1;
    for (const key of messageKeys) {
      const descriptor = messageDescriptors[key];
      if (
        descriptor === undefined ||
        !("value" in descriptor) ||
        !key.startsWith(`${namespace}.`) ||
        typeof descriptor.value !== "string"
      ) {
        throw bridgeError("BRIDGE_MESSAGE_INVALID");
      }
      const keyBytes = bridgeTextEncoder.encode(key).byteLength;
      const valueBytes = bridgeTextEncoder.encode(descriptor.value).byteLength;
      if (keyBytes > limits.maxCatalogStringLength || valueBytes > limits.maxCatalogStringLength) {
        throw bridgeError("BRIDGE_RESOURCE_LIMIT_EXCEEDED");
      }
      bytes += keyBytes + valueBytes;
      nodes += 1;
      if (bytes > limits.maxPayloadBytes || nodes > limits.maxPayloadNodes) {
        throw bridgeError("BRIDGE_RESOURCE_LIMIT_EXCEEDED");
      }
      copiedMessages[key] = descriptor.value;
    }
    catalog[locale] = Object.freeze(copiedMessages);
  }
  return Object.freeze(catalog);
}

/**
 * Validates one module-owned Bridge event name.
 *
 * @param moduleId - Module owning the connection.
 * @param value - Event type candidate.
 * @returns Valid module event type.
 * @throws MiaixzSdkError When the event is malformed or belongs to another module.
 */
export function parseEventType(moduleId: string, value: unknown): string {
  if (typeof value !== "string") throw bridgeError("BRIDGE_MESSAGE_INVALID");
  const separator = value.indexOf(":");
  if (
    separator < 0 ||
    value.indexOf(":", separator + 1) >= 0 ||
    value.slice(0, separator) !== moduleId ||
    !moduleIdentifierPattern.test(value.slice(separator + 1))
  ) {
    throw bridgeError("BRIDGE_MESSAGE_INVALID");
  }
  return value;
}

/**
 * Determines the sorted capabilities actually present on one Host Adapter.
 *
 * @typeParam Context - Caller-defined context validated by the optional parser.
 * @param adapter - Host Adapter to inspect.
 * @param parseContext - Parser required before exposing the context capability.
 * @returns Sorted capability names.
 */
export function getCapabilities<Context = unknown>(
  adapter: MiaixzHostAdapter<Context>,
  parseContext?: (value: unknown) => Readonly<Context>,
): readonly string[] {
  const capabilities = [
    ["context", typeof parseContext === "function" && adapter.getContext],
    ["events", adapter.emit && adapter.subscribe],
    ["i18n", adapter.registerMessages],
    ["navigation", adapter.navigate],
    ["permissions", adapter.hasPermissions],
  ] as const;
  return Object.freeze(
    capabilities
      .filter((entry) => typeof entry[1] === "function")
      .map((entry) => entry[0])
      .sort(),
  );
}
