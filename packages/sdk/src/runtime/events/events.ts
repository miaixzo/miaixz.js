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
 * Validates, sanitizes, and dispatches SDK events across local and browser-context channels.
 */

import { VERSION } from "../../version.js";

import { MiaixzSdkError } from "../../errors/errors.js";
import { isMiaixzAppearanceSettings } from "../../display/validation.js";
import { isMiaixzSdkConfig } from "../config/config.js";
import { isMiaixzRuntimeContext } from "../../access/context/context-validation.js";
import type { MiaixzAppearancePayload } from "../../display/appearance.types.js";
import type { MiaixzRuntimeContext } from "../../access/context/context.types.js";
import type { MiaixzSdkConfig } from "../config/config.types.js";

import type {
  MiaixzSessionStatusEvent,
  MiaixzEventBusOptions,
  MiaixzEventEmitOptions,
  MiaixzEventEnvelope,
  MiaixzEventListener,
  MiaixzEventName,
  MiaixzEventValidator,
  MiaixzLocaleChangedEvent,
  MiaixzSdkEventMap,
} from "./event-types.js";

const miaixzEventChannelPattern = /^miaixz:[a-z][a-z0-9-]{1,63}:events$/;
const miaixzUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const miaixzEventEnvelopeKeys = new Set(["version", "eventId", "sourceId", "type", "payload"]);
const miaixzRuntimeContextKeys = new Set([
  "userId",
  "tenantId",
  "organizationId",
  "departmentId",
  "spaceId",
  "locale",
  "timezone",
  "traceId",
]);
const miaixzSdkConfigKeys = new Set([
  "apiBaseUrl",
  "environment",
  "release",
  "services",
  "features",
  "appearance",
  "requestTimeoutMs",
]);
const miaixzSensitiveEventKeys = new Set([
  "authorization",
  "authorizationheader",
  "cookie",
  "cookies",
  "session",
]);
const miaixzEventDeduplicationLimit = 1_000;
const miaixzEventDeduplicationTtlMs = 5 * 60 * 1_000;

/**
 * Determines whether a property name conventionally contains credential material.
 *
 * @param key - Property or map key to normalize.
 * @returns Whether the key names a token, cookie, authorization value, or full session.
 */
function isSensitiveEventKey(key: string): boolean {
  const normalizedKey = key.replace(/[-_]/g, "").toLowerCase();
  return (
    miaixzSensitiveEventKeys.has(normalizedKey) ||
    normalizedKey === "token" ||
    normalizedKey.endsWith("token")
  );
}

/**
 * Determines whether a value is a plain data object without accessors.
 *
 * @param value - Runtime value to inspect.
 * @returns Whether the value contains only enumerable own data properties.
 */
function isPlainEventObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  if (Object.getOwnPropertySymbols(value).length > 0) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  return Object.values(descriptors).every(
    (descriptor) => descriptor.enumerable === true && "value" in descriptor,
  );
}

/**
 * Determines whether a plain object contains exactly the allowed enumerable keys.
 *
 * @param value - Plain object to inspect.
 * @param allowedKeys - Complete allowed-key set.
 * @returns Whether every key is allowed and the key counts match.
 */
function hasExactEventKeys(
  value: Record<string, unknown>,
  allowedKeys: ReadonlySet<string>,
): boolean {
  const keys = Object.keys(value);
  return keys.length === allowedKeys.size && keys.every((key) => allowedKeys.has(key));
}

/**
 * Determines whether an event payload contains a credential-shaped field.
 *
 * The traversal never invokes accessors and treats unsupported object shapes as unsafe.
 *
 * @param value - Cloned payload to inspect.
 * @param visited - Objects already inspected while following recursive references.
 * @returns Whether the payload contains a token, cookie, authorization, or session field.
 */
function containsSensitiveEventData(value: unknown, visited = new WeakSet<object>()): boolean {
  if (value === null || typeof value !== "object") return false;
  if (visited.has(value)) return false;
  visited.add(value);
  if (Array.isArray(value)) {
    return value.some((entry) => containsSensitiveEventData(entry, visited));
  }
  if (value instanceof Map) {
    for (const [key, entry] of value) {
      if (typeof key === "string" && isSensitiveEventKey(key)) return true;
      if (containsSensitiveEventData(key, visited) || containsSensitiveEventData(entry, visited)) {
        return true;
      }
    }
    return false;
  }
  if (value instanceof Set) {
    for (const entry of value) {
      if (containsSensitiveEventData(entry, visited)) return true;
    }
    return false;
  }
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value) || value instanceof Date) {
    return false;
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === "string" && isSensitiveEventKey(key)) return true;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) return true;
    if (containsSensitiveEventData(descriptor.value, visited)) return true;
  }
  return false;
}

/**
 * Validates the built-in session status payload.
 *
 * @param payload - Untrusted event payload.
 * @returns Whether the payload contains exactly one supported status field.
 */
function isMiaixzSessionStatusEvent(payload: unknown): payload is MiaixzSessionStatusEvent {
  return (
    isPlainEventObject(payload) &&
    hasExactEventKeys(payload, new Set(["status"])) &&
    (payload.status === "authenticated" || payload.status === "anonymous")
  );
}

/**
 * Validates the built-in runtime-context payload.
 *
 * @param payload - Untrusted event payload.
 * @returns Whether the payload contains only supported string-valued Context fields.
 */
function isMiaixzContextEvent(payload: unknown): payload is MiaixzRuntimeContext {
  return (
    isPlainEventObject(payload) &&
    Object.keys(payload).every((key) => miaixzRuntimeContextKeys.has(key)) &&
    isMiaixzRuntimeContext(payload)
  );
}

/**
 * Validates the built-in appearance payload and its nested settings.
 *
 * @param payload - Untrusted event payload.
 * @returns Whether the payload uses VERSION and valid appearance settings.
 */
function isMiaixzAppearanceEvent(payload: unknown): payload is MiaixzAppearancePayload {
  return (
    isPlainEventObject(payload) &&
    hasExactEventKeys(payload, new Set(["schemaVersion", "value"])) &&
    payload.schemaVersion === VERSION &&
    isMiaixzAppearanceSettings(payload.value)
  );
}

/**
 * Validates the built-in locale-change payload.
 *
 * @param payload - Untrusted event payload.
 * @returns Whether the payload contains exactly one valid BCP 47 locale.
 */
function isMiaixzLocaleEvent(payload: unknown): payload is MiaixzLocaleChangedEvent {
  if (
    !isPlainEventObject(payload) ||
    !hasExactEventKeys(payload, new Set(["locale"])) ||
    typeof payload.locale !== "string"
  ) {
    return false;
  }
  try {
    return Intl.getCanonicalLocales(payload.locale).length === 1;
  } catch {
    return false;
  }
}

/**
 * Validates the built-in SDK configuration payload.
 *
 * @param payload - Untrusted event payload.
 * @returns Whether the payload contains only supported configuration fields and values.
 */
function isMiaixzConfigEvent(payload: unknown): payload is MiaixzSdkConfig {
  return (
    isPlainEventObject(payload) &&
    Object.keys(payload).every((key) => miaixzSdkConfigKeys.has(key)) &&
    isMiaixzSdkConfig(payload)
  );
}

const miaixzBuiltinEventValidators: Readonly<Record<string, MiaixzEventValidator>> = Object.freeze({
  "grants:changed": (payload) =>
    isPlainEventObject(payload) &&
    Object.keys(payload).length === 1 &&
    Number.isSafeInteger(payload.revision) &&
    Number(payload.revision) > 0,
  "session:changed": isMiaixzSessionStatusEvent,
  "context:changed": isMiaixzContextEvent,
  "appearance:changed": isMiaixzAppearanceEvent,
  "locale:changed": isMiaixzLocaleEvent,
  "config:changed": isMiaixzConfigEvent,
});

/**
 * Creates a localized event error without including rejected payload data.
 *
 * @param code - Stable event error code.
 * @returns Localized SDK event error.
 */
function createMiaixzEventError(
  code:
    | "EVENT_CHANNEL_INVALID"
    | "EVENT_VALIDATOR_MISSING"
    | "EVENT_PAYLOAD_NOT_CLONEABLE"
    | "EVENT_CRYPTO_UNAVAILABLE",
): MiaixzSdkError {
  return new MiaixzSdkError({ code });
}

/**
 * Creates a secure UUID for event sources and messages.
 *
 * @returns A cryptographically secure UUID.
 * @throws MiaixzSdkError When the runtime cannot generate secure UUIDs.
 */
function createMiaixzEventId(): string {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw createMiaixzEventError("EVENT_CRYPTO_UNAVAILABLE");
  }
  return globalThis.crypto.randomUUID();
}

/**
 * Validates an untrusted BroadcastChannel envelope without executing accessors.
 *
 * @param value - Broadcast message data to inspect.
 * @returns Whether the value is a complete current-release event envelope.
 */
function isMiaixzEventEnvelope(value: unknown): value is MiaixzEventEnvelope {
  return (
    isPlainEventObject(value) &&
    hasExactEventKeys(value, miaixzEventEnvelopeKeys) &&
    value.version === VERSION &&
    typeof value.eventId === "string" &&
    miaixzUuidPattern.test(value.eventId) &&
    typeof value.sourceId === "string" &&
    miaixzUuidPattern.test(value.sourceId) &&
    typeof value.type === "string" &&
    value.type.length > 0
  );
}

/**
 * Produces a structured-cloned event payload before external delivery.
 *
 * @param payload - Payload to clone.
 * @returns Detached payload clone safe to place in an event envelope.
 * @throws MiaixzSdkError When structured cloning is unavailable or fails.
 */
function cloneMiaixzEventPayload(payload: unknown): unknown {
  if (typeof globalThis.structuredClone !== "function") {
    throw createMiaixzEventError("EVENT_PAYLOAD_NOT_CLONEABLE");
  }
  try {
    return globalThis.structuredClone(payload);
  } catch {
    throw createMiaixzEventError("EVENT_PAYLOAD_NOT_CLONEABLE");
  }
}

/**
 * Applies a registered payload validator and the credential-exposure guard safely.
 *
 * @param validator - Event-specific runtime validator.
 * @param payload - Cloned or externally received payload.
 * @returns Whether the payload is valid and free of credential-shaped fields.
 */
function isValidMiaixzEventPayload(validator: MiaixzEventValidator, payload: unknown): boolean {
  try {
    return !containsSensitiveEventData(payload) && validator(payload);
  } catch {
    return false;
  }
}

/**
 * Typed local and optional same-origin cross-tab event bus.
 *
 * @typeParam Events - Event-name map whose values define payload types.
 * @public
 */
export class MiaixzEventBus<Events extends object = MiaixzSdkEventMap> {
  readonly #listeners = new Map<string, Set<MiaixzEventListener<unknown>>>();
  readonly #validators: Readonly<Record<string, MiaixzEventValidator>>;
  readonly #channel: BroadcastChannel | undefined;
  readonly #sourceId: string | undefined;
  readonly #receivedEventIds = new Map<string, number>();
  readonly #messageListener: ((event: MessageEvent<unknown>) => void) | undefined;
  #closed = false;

  /**
   * Creates a local-first event bus and an optional validated BroadcastChannel.
   *
   * @param options - Channel factory and application-defined runtime validators.
   * @throws MiaixzSdkError When an explicit channel name or secure UUID capability is invalid.
   */
  constructor(options: MiaixzEventBusOptions = {}) {
    this.#validators = Object.freeze({
      ...options.validators,
      ...miaixzBuiltinEventValidators,
    });
    const channelName = options.channelName ?? false;
    if (channelName === false) {
      this.#channel = undefined;
      this.#sourceId = undefined;
      this.#messageListener = undefined;
      return;
    }
    if (!miaixzEventChannelPattern.test(channelName)) {
      throw createMiaixzEventError("EVENT_CHANNEL_INVALID");
    }
    const hasChannelFactory = typeof options.broadcastChannelFactory === "function";
    const hasNativeChannel = typeof globalThis.BroadcastChannel === "function";
    if (!hasChannelFactory && !hasNativeChannel) {
      this.#channel = undefined;
      this.#sourceId = undefined;
      this.#messageListener = undefined;
      return;
    }
    const sourceId = createMiaixzEventId();
    const channel = hasChannelFactory
      ? options.broadcastChannelFactory?.(channelName)
      : new globalThis.BroadcastChannel(channelName);
    if (channel === undefined) {
      this.#channel = undefined;
      this.#sourceId = undefined;
      this.#messageListener = undefined;
      return;
    }
    this.#channel = channel;
    this.#sourceId = sourceId;
    this.#messageListener = (event: MessageEvent<unknown>): void => {
      this.#receive(event.data);
    };
    this.#channel.addEventListener("message", this.#messageListener);
  }

  /**
   * Registers a typed listener and returns its unsubscribe function.
   *
   * @param type - Event name to observe.
   * @param listener - Callback invoked with the typed event payload.
   * @returns Function that unregisters the listener, or a no-op after closure.
   */
  on<Name extends MiaixzEventName<Events>>(
    type: Name,
    listener: MiaixzEventListener<Events[Name]>,
  ): () => void {
    if (this.#closed) return (): void => undefined;
    const listeners = this.#listeners.get(type) ?? new Set<MiaixzEventListener<unknown>>();
    listeners.add(listener as MiaixzEventListener<unknown>);
    this.#listeners.set(type, listeners);
    return (): void => {
      listeners.delete(listener as MiaixzEventListener<unknown>);
      if (listeners.size === 0) this.#listeners.delete(type);
    };
  }

  /**
   * Registers a typed listener that is removed after its first event.
   *
   * @param type - Event name to observe once.
   * @param listener - Callback invoked with the typed event payload.
   * @returns Function that unregisters the listener before delivery.
   */
  once<Name extends MiaixzEventName<Events>>(
    type: Name,
    listener: MiaixzEventListener<Events[Name]>,
  ): () => void {
    if (this.#closed) return (): void => undefined;
    const unsubscribe = this.on(type, (payload) => {
      unsubscribe();
      listener(payload);
    });
    return unsubscribe;
  }

  /**
   * Publishes an event synchronously to local listeners before optional cross-tab delivery.
   *
   * @param type - Event name to publish.
   * @param payload - Typed event payload.
   * @param options - Optional cross-tab publication behavior.
   * @throws MiaixzSdkError When the bus is closed, a required validator is missing, cloning fails, or secure UUIDs are unavailable.
   */
  emit<Name extends MiaixzEventName<Events>>(
    type: Name,
    payload: Events[Name],
    options: Readonly<MiaixzEventEmitOptions> = {},
  ): void {
    if (this.#closed) {
      throw createMiaixzEventError("EVENT_CHANNEL_INVALID");
    }
    this.#dispatch(type, payload);
    if (
      options.broadcast === false ||
      this.#channel === undefined ||
      this.#sourceId === undefined
    ) {
      return;
    }
    const validator = Object.hasOwn(this.#validators, type) ? this.#validators[type] : undefined;
    if (validator === undefined) {
      if (options.broadcast === true) {
        throw createMiaixzEventError("EVENT_VALIDATOR_MISSING");
      }
      return;
    }
    const clonedPayload = cloneMiaixzEventPayload(payload);
    if (!isValidMiaixzEventPayload(validator, clonedPayload)) return;
    this.#channel.postMessage({
      version: VERSION,
      eventId: createMiaixzEventId(),
      sourceId: this.#sourceId,
      type,
      payload: clonedPayload,
    } satisfies MiaixzEventEnvelope);
  }

  /**
   * Removes listeners for one event type or all event types.
   *
   * @param type - Optional event name whose listeners should be removed.
   */
  clear(type?: MiaixzEventName<Events>): void {
    if (type === undefined) this.#listeners.clear();
    else this.#listeners.delete(type);
  }

  /**
   * Removes listeners and deduplication state, then closes the underlying channel once.
   */
  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    this.clear();
    this.#receivedEventIds.clear();
    if (this.#channel && this.#messageListener) {
      this.#channel.removeEventListener("message", this.#messageListener);
    }
    this.#channel?.close();
  }

  /**
   * Delivers one event to current local listeners in registration order.
   *
   * @param type - Event name to dispatch.
   * @param payload - Event payload to deliver.
   */
  #dispatch(type: string, payload: unknown): void {
    for (const listener of this.#listeners.get(type) ?? []) {
      try {
        listener(payload);
      } catch {
        /**
         * One event observer cannot prevent delivery to later observers.
         */
      }
    }
  }

  /**
   * Validates, deduplicates, and dispatches one untrusted channel message.
   *
   * @param value - Message data delivered by BroadcastChannel.
   */
  #receive(value: unknown): void {
    if (this.#closed || !isMiaixzEventEnvelope(value) || value.sourceId === this.#sourceId) return;
    this.#pruneReceivedEventIds(Date.now());
    if (this.#receivedEventIds.has(value.eventId)) return;
    const validator = Object.hasOwn(this.#validators, value.type)
      ? this.#validators[value.type]
      : undefined;
    if (validator === undefined) return;
    if (!isValidMiaixzEventPayload(validator, value.payload)) return;
    this.#receivedEventIds.set(value.eventId, Date.now());
    while (this.#receivedEventIds.size > miaixzEventDeduplicationLimit) {
      const oldest = this.#receivedEventIds.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      this.#receivedEventIds.delete(oldest);
    }
    this.#dispatch(value.type, value.payload);
  }

  /**
   * Removes received event identifiers whose fixed five-minute TTL has elapsed.
   *
   * @param now - Current Unix time in milliseconds.
   */
  #pruneReceivedEventIds(now: number): void {
    for (const [eventId, received] of this.#receivedEventIds) {
      if (now - received < miaixzEventDeduplicationTtlMs) continue;
      this.#receivedEventIds.delete(eventId);
    }
  }
}

/**
 * Creates a typed local-first event bus with optional same-origin cross-tab delivery.
 *
 * @typeParam Events - Event-name map whose values define payload types.
 * @param options - Optional channel and runtime-validator configuration.
 * @returns Configured typed event bus.
 * @public
 */
export function createMiaixzEventBus<Events extends object = MiaixzSdkEventMap>(
  options?: MiaixzEventBusOptions,
): MiaixzEventBus<Events> {
  return new MiaixzEventBus<Events>(options);
}
