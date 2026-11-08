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
 * Coordinates child handshake, correlated requests, subscriptions, and disconnection.
 */

import { MIAIXZ_MODULE_PROTOCOL_VERSION } from "../contracts/module-manifest.js";
import type {
  MiaixzBridgeEnvelope,
  MiaixzPostMessageChildOptions,
} from "../contracts/post-message.js";
import type { MiaixzHostBridge, MiaixzNavigationRequest } from "../contracts/host-context.js";
import { MiaixzSdkError } from "../../errors/errors.js";
import type { MiaixzMessageCatalog } from "../../i18n/i18n.js";
import { MiaixzBridgeMessageCache } from "./message-cache.js";
import { MiaixzPendingRequestRegistry, type PendingRequest } from "./pending-requests.js";
import {
  bridgeError,
  createEnvelope,
  createMessageId,
  deserializeError,
  getRuntimeWindow,
  hasOnlyKeys,
  isPlainRecord,
  moduleIdentifierPattern,
  parseEnvelope,
  parseEventType,
  parseMessageCatalog,
  parseNavigation,
  parsePermissions,
  parseBridgeContext,
  parseTargetOrigin,
  parseTargetWindow,
  parseTimeout,
  semanticVersionPattern,
  uuidPattern,
} from "./post-message-protocol.js";

/**
 * Event name and callback registered by the child-side bridge.
 */
interface ChildEventListener {
  /**
   * Module-owned event type expected by the listener.
   */
  readonly type: string;

  /**
   * Delivers a validated subscription payload.
   */
  readonly listener: (payload: unknown) => void;
}

/**
 * Implements the Child half of a postMessage Host Bridge.
 *
 * @typeParam Context - Caller-defined context independently validated after receipt.
 */
export class PostMessageChildBridge<Context = unknown> implements MiaixzHostBridge<Context> {
  /**
   * Micro-frontend protocol version implemented by the bridge.
   */
  readonly protocolVersion = MIAIXZ_MODULE_PROTOCOL_VERSION;

  readonly #runtimeWindow: Window;
  readonly #targetWindow: Window;
  readonly #targetOrigin: string;
  readonly #moduleId: string;
  readonly #moduleVersion: string;
  readonly #timeoutMs: number;
  readonly #parseContext: ((value: unknown) => Readonly<Context>) | undefined;
  readonly #pending = new MiaixzPendingRequestRegistry();
  readonly #incoming = new MiaixzBridgeMessageCache();
  readonly #listeners = new Map<string, ChildEventListener>();
  #disposed = false;

  /**
   * Creates one Child Bridge before its handshake starts.
   *
   * @param options - Validated Child connection options.
   */
  constructor(options: MiaixzPostMessageChildOptions<Context>) {
    this.#runtimeWindow = getRuntimeWindow();
    this.#targetWindow = parseTargetWindow(options.targetWindow);
    this.#targetOrigin = parseTargetOrigin(options.targetOrigin);
    if (!moduleIdentifierPattern.test(options.moduleId))
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    if (!semanticVersionPattern.test(options.moduleVersion))
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    this.#moduleId = options.moduleId;
    this.#moduleVersion = options.moduleVersion;
    this.#timeoutMs = parseTimeout(options.timeoutMs);
    this.#parseContext = options.parseContext;
    this.#runtimeWindow.addEventListener("message", this.#onMessage);
  }

  /**
   * Performs the fixed Child-initiated handshake.
   *
   * @returns Connected Child Bridge.
   */
  async connect(): Promise<MiaixzHostBridge<Context>> {
    const payload = await this.#request("bridge.handshake", {
      moduleId: this.#moduleId,
      moduleVersion: this.#moduleVersion,
      protocolVersion: MIAIXZ_MODULE_PROTOCOL_VERSION,
    });
    if (
      !isPlainRecord(payload) ||
      !hasOnlyKeys(payload, new Set(["accepted", "protocolVersion", "capabilities"])) ||
      payload.accepted !== true ||
      payload.protocolVersion !== MIAIXZ_MODULE_PROTOCOL_VERSION ||
      !Array.isArray(payload.capabilities) ||
      !payload.capabilities.every((value) => typeof value === "string")
    ) {
      this.dispose();
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    }
    return this;
  }

  /**
   * Reads the current non-sensitive Host context.
   *
   * @returns Runtime context returned by the Host.
   */
  async getContext(): Promise<Readonly<Context>> {
    this.#assertActive();
    if (typeof this.#parseContext !== "function")
      throw bridgeError("BRIDGE_CAPABILITY_UNAVAILABLE");
    const payload = await this.#request("context.get");
    return parseBridgeContext(payload, this.#parseContext);
  }

  /**
   * Requests validated same-site Host navigation.
   *
   * @param request - Navigation request to validate and send.
   */
  async navigate(request: Readonly<MiaixzNavigationRequest>): Promise<void> {
    const payload = await this.#request("navigation.navigate", parseNavigation(request));
    if (payload !== undefined) throw bridgeError("BRIDGE_MESSAGE_INVALID");
  }

  /**
   * Checks whether all requested permissions are available.
   *
   * @param permissions - Non-wildcard permission list.
   * @returns Whether the Host allows every permission.
   */
  async hasPermissions(permissions: readonly string[]): Promise<boolean> {
    const payload = await this.#request("permissions.has", {
      permissions: parsePermissions(permissions),
    });
    if (
      !isPlainRecord(payload) ||
      !hasOnlyKeys(payload, new Set(["allowed"])) ||
      typeof payload.allowed !== "boolean"
    )
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    return payload.allowed;
  }

  /**
   * Registers one module-owned internationalization catalog.
   *
   * @param namespace - Namespace that must equal the module identifier.
   * @param catalog - Localized project messages.
   */
  async registerMessages(namespace: string, catalog: MiaixzMessageCatalog): Promise<void> {
    this.#assertActive();
    if (namespace !== this.#moduleId) throw bridgeError("BRIDGE_MESSAGE_INVALID");
    const payload = await this.#request("i18n.register", {
      namespace,
      catalog: parseMessageCatalog(namespace, catalog),
    });
    if (payload !== undefined) throw bridgeError("BRIDGE_MESSAGE_INVALID");
  }

  /**
   * Emits one module-scoped event through the Host.
   *
   * @typeParam T - Event payload type.
   * @param type - Module-owned event type.
   * @param payload - Event payload.
   */
  async emit<T = unknown>(type: string, payload: T): Promise<void> {
    const response = await this.#request("events.emit", {
      type: parseEventType(this.#moduleId, type),
      payload,
    });
    if (response !== undefined) throw bridgeError("BRIDGE_MESSAGE_INVALID");
  }

  /**
   * Subscribes to one module-scoped Host event.
   *
   * @typeParam T - Event payload type.
   * @param type - Module-owned event type.
   * @param listener - Event listener.
   * @returns Idempotent asynchronous unsubscribe function.
   */
  async subscribe<T = unknown>(
    type: string,
    listener: (payload: T) => void,
  ): Promise<() => Promise<void>> {
    this.#assertActive();
    const parsedType = parseEventType(this.#moduleId, type);
    if (typeof listener !== "function") throw bridgeError("BRIDGE_MESSAGE_INVALID");
    const payload = await this.#request("events.subscribe", { type: parsedType });
    if (
      !isPlainRecord(payload) ||
      !hasOnlyKeys(payload, new Set(["subscriptionId"])) ||
      typeof payload.subscriptionId !== "string" ||
      !uuidPattern.test(payload.subscriptionId)
    )
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    const subscriptionId = payload.subscriptionId;
    this.#listeners.set(subscriptionId, {
      type: parsedType,
      listener: (eventPayload) => listener(eventPayload as T),
    });
    let cancelled = false;
    return async () => {
      if (cancelled) return;
      cancelled = true;
      this.#listeners.delete(subscriptionId);
      if (this.#disposed) return;
      const response = await this.#request("events.unsubscribe", { subscriptionId });
      if (response !== undefined) throw bridgeError("BRIDGE_MESSAGE_INVALID");
    };
  }

  /**
   * Notifies the Host and immediately releases local requests and listeners.
   */
  dispose(): void {
    if (this.#disposed) return;
    try {
      this.#post(createEnvelope(this.#moduleId, "request", "bridge.dispose", createMessageId()));
    } catch {
      /**
       * Best-effort remote disposal cannot delay deterministic local cleanup.
       */
    }
    this.#disposed = true;
    this.#pending.disposePending(bridgeError("BRIDGE_DISPOSED"), (messageId, pending) =>
      this.#sendCancel(messageId, pending),
    );
    this.#listeners.clear();
    this.#incoming.clear();
    this.#runtimeWindow.removeEventListener("message", this.#onMessage);
  }

  /**
   * Handles one exact-source Child response or event.
   *
   * @param event - Browser message event.
   */
  readonly #onMessage = (event: MessageEvent): void => {
    if (
      this.#disposed ||
      event.source !== this.#targetWindow ||
      event.origin !== this.#targetOrigin
    )
      return;
    const envelope = parseEnvelope(event.data);
    if (envelope === undefined || envelope.moduleId !== this.#moduleId) return;
    this.#incoming.compact();
    if (envelope.kind === "event") {
      if (this.#incoming.hasAccepted(envelope.messageId)) return;
      this.#incoming.accept(envelope.messageId);
      this.#handleEvent(envelope);
      return;
    }
    if (envelope.kind !== "response") return;
    const pending = this.#pending.getPending(envelope.messageId);
    if (pending === undefined || pending.method !== envelope.method) return;
    if (this.#incoming.hasAccepted(envelope.messageId)) return;
    this.#incoming.accept(envelope.messageId);
    this.#pending.completePending(envelope.messageId, envelope.method, (current) => {
      if (envelope.error !== undefined) current.reject(deserializeError(envelope.error));
      else current.resolve(envelope.payload);
    });
  };

  /**
   * Delivers one validated Host subscription event.
   *
   * @param envelope - Event envelope to validate.
   */
  #handleEvent(envelope: MiaixzBridgeEnvelope): void {
    if (
      envelope.method !== "events.message" ||
      !isPlainRecord(envelope.payload) ||
      !hasOnlyKeys(envelope.payload, new Set(["subscriptionId", "type", "payload"])) ||
      typeof envelope.payload.subscriptionId !== "string" ||
      typeof envelope.payload.type !== "string"
    )
      return;
    const registered = this.#listeners.get(envelope.payload.subscriptionId);
    if (registered === undefined || registered.type !== envelope.payload.type) return;
    try {
      registered.listener(envelope.payload.payload);
    } catch {
      /**
       * Consumer listener failures cannot corrupt the Bridge transport state.
       */
    }
  }

  /**
   * Sends one correlated request and applies timeout cancellation.
   *
   * @param method - Allow-listed request method.
   * @param payload - Optional request payload.
   * @returns Promise resolving to the raw response payload.
   */
  #request(method: string, payload?: unknown): Promise<unknown> {
    this.#assertActive();
    const messageId = createMessageId();
    const operation = this.#pending.createPending(
      messageId,
      method,
      this.#timeoutMs,
      (pending) => this.#sendCancel(messageId, pending),
      () => bridgeError("BRIDGE_TIMEOUT"),
    );
    try {
      this.#post(createEnvelope(this.#moduleId, "request", method, messageId, payload));
    } catch {
      this.#pending.rejectPending(messageId, bridgeError("BRIDGE_MESSAGE_INVALID"));
    }
    return operation;
  }

  /**
   * Sends at most one cancellation envelope for a pending request.
   *
   * @param messageId - Request identifier to cancel.
   * @param pending - Pending request state.
   */
  #sendCancel(messageId: string, pending: PendingRequest): void {
    if (pending.cancelSent) return;
    pending.cancelSent = true;
    try {
      this.#post(createEnvelope(this.#moduleId, "cancel", pending.method, messageId));
    } catch {
      /**
       * Cancellation is best-effort after the local result is already deterministic.
       */
    }
  }

  /**
   * Posts one envelope to the single validated Host origin.
   *
   * @param envelope - Envelope to send.
   */
  #post(envelope: MiaixzBridgeEnvelope): void {
    this.#targetWindow.postMessage(envelope, this.#targetOrigin);
  }

  /**
   * Rejects calls made after the Child Bridge has been released.
   *
   * @throws MiaixzSdkError When the Bridge is disposed.
   */
  #assertActive(): void {
    if (this.#disposed) throw bridgeError("BRIDGE_DISPOSED");
  }
}
