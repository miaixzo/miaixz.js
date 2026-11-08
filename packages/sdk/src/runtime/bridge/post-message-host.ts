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
 * Validates host-side handshake messages and dispatches granted bridge capabilities.
 */

import {
  MIAIXZ_MODULE_PROTOCOL_VERSION,
  parseMiaixzModuleManifest,
  type MiaixzModuleManifest,
} from "../contracts/module-manifest.js";
import type {
  MiaixzBridgeEnvelope,
  MiaixzPostMessageHost,
  MiaixzPostMessageHostLimits,
  MiaixzPostMessageHostOptions,
} from "../contracts/post-message.js";
import type { MiaixzHostAdapter } from "../contracts/host-context.js";
import { MiaixzSdkError } from "../../errors/errors.js";
import { MiaixzBridgeMessageCache } from "./message-cache.js";
import { MiaixzPendingRequestRegistry, type HostRequestState } from "./pending-requests.js";
import { resolvePostMessageHostLimits } from "./bridge-limits.js";
import { assertBridgePayloadWithinLimits } from "./payload-budget.js";
import {
  bridgeError,
  createEnvelope,
  createMessageId,
  getCapabilities,
  getRuntimeWindow,
  hasOnlyKeys,
  isPlainRecord,
  parseEnvelope,
  parseEventType,
  parseMessageCatalog,
  parseNavigation,
  parsePermissions,
  parseBridgeContext,
  parseTargetOrigin,
  parseTargetWindow,
  parseTimeout,
  serializeError,
  uuidPattern,
  type SubscriptionResponse,
} from "./post-message-protocol.js";

/**
 * Implements the Host half of a postMessage Bridge.
 *
 * @typeParam Context - Caller-defined context selected before crossing the transport.
 */
export class PostMessageHost<Context = unknown> implements MiaixzPostMessageHost {
  readonly ready: Promise<void>;
  readonly #runtimeWindow: Window;
  readonly #targetWindow: Window;
  readonly #targetOrigin: string;
  readonly #manifest: Readonly<MiaixzModuleManifest>;
  readonly #adapter: MiaixzHostAdapter<Context>;
  readonly #parseContext: ((value: unknown) => Readonly<Context>) | undefined;
  readonly #capabilities: readonly string[];
  readonly #limits: Readonly<MiaixzPostMessageHostLimits>;
  readonly #incoming = new MiaixzBridgeMessageCache();
  readonly #subscriptions = new Map<string, () => Promise<void>>();
  readonly #subscriptionReservations = new Set<string>();
  readonly #requests = new MiaixzPendingRequestRegistry();
  readonly #resolveReady: () => void;
  readonly #rejectReady: (error: MiaixzSdkError) => void;
  readonly #readyTimer: ReturnType<typeof setTimeout> | undefined;
  #readyState: "pending" | "resolved" | "rejected" = "pending";
  #disposed = false;

  /**
   * Creates and starts one Host-side handshake listener.
   *
   * @param options - Validated Host construction options.
   */
  constructor(options: MiaixzPostMessageHostOptions<Context>) {
    this.#runtimeWindow = getRuntimeWindow();
    this.#targetWindow = parseTargetWindow(options.targetWindow);
    this.#targetOrigin = parseTargetOrigin(options.targetOrigin);
    this.#manifest = parseMiaixzModuleManifest(options.manifest);
    if (this.#manifest.kind !== "iframe") throw bridgeError("BRIDGE_ORIGIN_INVALID");
    let entryOrigin: string;
    try {
      entryOrigin = new URL(this.#manifest.entry).origin;
    } catch {
      throw bridgeError("BRIDGE_ORIGIN_INVALID");
    }
    if (entryOrigin !== this.#targetOrigin) throw bridgeError("BRIDGE_ORIGIN_INVALID");
    if (!isPlainRecord(options.adapter)) throw bridgeError("BRIDGE_MESSAGE_INVALID");
    this.#adapter = options.adapter;
    this.#parseContext = options.parseContext;
    this.#capabilities = getCapabilities(this.#adapter, this.#parseContext);
    this.#limits = resolvePostMessageHostLimits(options.limits);
    const timeoutMs = parseTimeout(options.timeoutMs);
    let resolveReady!: () => void;
    let rejectReady!: (error: MiaixzSdkError) => void;
    this.ready = new Promise<void>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    this.#resolveReady = resolveReady;
    this.#rejectReady = rejectReady;
    if (
      this.#manifest.requiredCapabilities.some(
        (capability) => !this.#capabilities.includes(capability),
      )
    ) {
      this.#readyTimer = undefined;
      this.#rejectStartup(bridgeError("BRIDGE_CAPABILITY_UNAVAILABLE"));
      return;
    }
    this.#runtimeWindow.addEventListener("message", this.#onMessage);
    this.#readyTimer = setTimeout(() => {
      this.#rejectStartup(bridgeError("BRIDGE_TIMEOUT"));
      this.dispose();
    }, timeoutMs);
  }

  /**
   * Releases the Host connection and all tracked subscriptions.
   */
  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    if (this.#readyTimer !== undefined) clearTimeout(this.#readyTimer);
    this.#runtimeWindow.removeEventListener("message", this.#onMessage);
    if (this.#readyState === "pending") this.#rejectStartup(bridgeError("BRIDGE_DISPOSED"));
    for (const unsubscribe of this.#subscriptions.values()) {
      void unsubscribe().catch(() => undefined);
    }
    this.#subscriptions.clear();
    this.#subscriptionReservations.clear();
    this.#requests.clearHost();
    this.#incoming.clear();
  }

  /**
   * Handles one Window message after exact source and origin filtering.
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
    if (envelope === undefined || envelope.moduleId !== this.#manifest.id) return;
    this.#incoming.compact();
    if (envelope.kind === "cancel") {
      this.#requests.cancelHost(envelope.messageId);
      return;
    }
    const duplicate = this.#incoming.read(envelope.messageId);
    if (duplicate !== undefined) {
      if (envelope.kind === "request") {
        if (duplicate.response !== undefined) this.#post(duplicate.response);
        else if (duplicate.request !== undefined) duplicate.request.replayRequested = true;
      }
      return;
    }
    const activeRequest = this.#requests.getHost(envelope.messageId);
    if (activeRequest !== undefined) {
      if (activeRequest.responseSent) {
        this.#respondWithError(envelope, bridgeError("BRIDGE_TIMEOUT"));
      } else {
        activeRequest.replayRequested = true;
      }
      return;
    }
    if (envelope.kind !== "request") return;
    if (!this.#isReady() && envelope.method !== "bridge.handshake") {
      this.#respondWithError(envelope, bridgeError("BRIDGE_NOT_READY"));
      return;
    }
    if (this.#requests.hostSize >= this.#limits.maxInFlightRequests) {
      this.#respondWithError(envelope, bridgeError("BRIDGE_RESOURCE_LIMIT_EXCEEDED"));
      return;
    }
    this.#incoming.accept(envelope.messageId);
    const requestState: HostRequestState = this.#requests.createHost(
      envelope.messageId,
      this.#limits.requestTimeoutMilliseconds,
      (state) => this.#timeoutRequest(envelope, state),
    );
    this.#incoming.recordRequest(envelope.messageId, requestState);
    void this.#handleRequest(envelope).then(
      (payload) => this.#completeRequest(envelope, payload),
      (error: unknown) => this.#completeRequest(envelope, undefined, error),
    );
  };

  /**
   * Reports whether the handshake has completed successfully.
   *
   * @returns Whether the Host accepts non-handshake requests.
   */
  #isReady(): boolean {
    return this.#readyState === "resolved";
  }

  /**
   * Handles one validated request method.
   *
   * @param envelope - Valid request envelope.
   * @returns Method response payload.
   */
  async #handleRequest(envelope: MiaixzBridgeEnvelope): Promise<unknown> {
    switch (envelope.method) {
      case "bridge.handshake":
        return this.#handleHandshake(envelope.payload);
      case "context.get": {
        if (envelope.payload !== undefined) throw bridgeError("BRIDGE_MESSAGE_INVALID");
        if (
          typeof this.#parseContext !== "function" ||
          typeof this.#adapter.getContext !== "function"
        ) {
          throw bridgeError("BRIDGE_CAPABILITY_UNAVAILABLE");
        }
        const context: unknown = await this.#requireCapability("getContext")();
        return parseBridgeContext(context, this.#parseContext);
      }
      case "navigation.navigate":
        await this.#requireCapability("navigate")(parseNavigation(envelope.payload, this.#limits));
        return undefined;
      case "permissions.has": {
        if (
          !isPlainRecord(envelope.payload) ||
          !hasOnlyKeys(envelope.payload, new Set(["permissions"]))
        )
          throw bridgeError("BRIDGE_MESSAGE_INVALID");
        const allowed = await this.#requireCapability("hasPermissions")(
          parsePermissions(envelope.payload.permissions, this.#limits),
        );
        return Object.freeze({ allowed });
      }
      case "i18n.register": {
        if (
          !isPlainRecord(envelope.payload) ||
          !hasOnlyKeys(envelope.payload, new Set(["namespace", "catalog"])) ||
          envelope.payload.namespace !== this.#manifest.id
        )
          throw bridgeError("BRIDGE_MESSAGE_INVALID");
        await this.#requireCapability("registerMessages")(
          envelope.payload.namespace,
          parseMessageCatalog(envelope.payload.namespace, envelope.payload.catalog, this.#limits),
        );
        return undefined;
      }
      case "events.emit": {
        if (
          !isPlainRecord(envelope.payload) ||
          !hasOnlyKeys(envelope.payload, new Set(["type", "payload"]))
        )
          throw bridgeError("BRIDGE_MESSAGE_INVALID");
        assertBridgePayloadWithinLimits(envelope.payload.payload, this.#limits);
        await this.#requireCapability("emit")(
          parseEventType(this.#manifest.id, envelope.payload.type),
          envelope.payload.payload,
        );
        return undefined;
      }
      case "events.subscribe":
        return this.#subscribe(envelope.payload, envelope.messageId);
      case "events.unsubscribe":
        await this.#unsubscribe(envelope.payload);
        return undefined;
      case "bridge.dispose":
        if (envelope.payload !== undefined) throw bridgeError("BRIDGE_MESSAGE_INVALID");
        return undefined;
      default:
        throw bridgeError("BRIDGE_MESSAGE_INVALID");
    }
  }

  /**
   * Validates and accepts the only allowed handshake payload.
   *
   * @param payload - Handshake request payload.
   * @returns Accepted handshake response payload.
   */
  #handleHandshake(payload: unknown): Readonly<Record<string, unknown>> {
    if (
      this.#readyState !== "pending" ||
      !isPlainRecord(payload) ||
      !hasOnlyKeys(payload, new Set(["moduleId", "moduleVersion", "protocolVersion"])) ||
      payload.moduleId !== this.#manifest.id ||
      payload.moduleVersion !== this.#manifest.version ||
      payload.protocolVersion !== MIAIXZ_MODULE_PROTOCOL_VERSION
    ) {
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    }
    return Object.freeze({
      accepted: true,
      protocolVersion: MIAIXZ_MODULE_PROTOCOL_VERSION,
      capabilities: this.#capabilities,
    });
  }

  /**
   * Registers one Host event subscription and returns its secure identifier.
   *
   * @param payload - Subscribe request payload.
   * @param requestId - Request identifier used to reserve a concurrent slot.
   * @returns Subscription response payload.
   */
  async #subscribe(payload: unknown, requestId: string): Promise<Readonly<SubscriptionResponse>> {
    if (!isPlainRecord(payload) || !hasOnlyKeys(payload, new Set(["type"])))
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    const type = parseEventType(this.#manifest.id, payload.type);
    if (
      this.#subscriptions.size + this.#subscriptionReservations.size >=
      this.#limits.maxSubscriptions
    ) {
      throw bridgeError("BRIDGE_RESOURCE_LIMIT_EXCEEDED");
    }
    this.#subscriptionReservations.add(requestId);
    const subscriptionId = createMessageId();
    let cancelled = false;
    let rawUnsubscribe: (() => void | Promise<void>) | undefined;
    try {
      rawUnsubscribe = await this.#requireCapability("subscribe")(type, (eventPayload) => {
        if (cancelled || this.#disposed) return;
        try {
          assertBridgePayloadWithinLimits(eventPayload, this.#limits);
        } catch {
          return;
        }
        this.#post(
          createEnvelope(this.#manifest.id, "event", "events.message", createMessageId(), {
            subscriptionId,
            type,
            payload: eventPayload,
          }),
        );
      });
      if (typeof rawUnsubscribe !== "function") throw bridgeError("BRIDGE_MESSAGE_INVALID");
      if (this.#disposed) {
        await Promise.resolve().then(rawUnsubscribe);
        throw bridgeError("BRIDGE_DISPOSED");
      }
      const requestState = this.#requests.getHost(requestId);
      if (requestState?.cancelled === true || requestState?.responseSent === true) {
        await Promise.resolve().then(rawUnsubscribe);
        throw bridgeError(requestState.cancelled ? "BRIDGE_DISPOSED" : "BRIDGE_TIMEOUT");
      }
    } finally {
      this.#subscriptionReservations.delete(requestId);
    }
    /**
     * Releases one host subscription once and awaits the provider cleanup callback.
     *
     * @returns Promise resolving after subscription ownership and provider resources are released.
     */
    const unsubscribe = async (): Promise<void> => {
      if (cancelled) return;
      cancelled = true;
      this.#subscriptions.delete(subscriptionId);
      await Promise.resolve().then(rawUnsubscribe);
    };
    this.#subscriptions.set(subscriptionId, unsubscribe);
    return Object.freeze({ subscriptionId });
  }

  /**
   * Removes one previously registered Host event subscription.
   *
   * @param payload - Unsubscribe request payload.
   */
  async #unsubscribe(payload: unknown): Promise<void> {
    if (
      !isPlainRecord(payload) ||
      !hasOnlyKeys(payload, new Set(["subscriptionId"])) ||
      typeof payload.subscriptionId !== "string" ||
      !uuidPattern.test(payload.subscriptionId)
    )
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    await this.#subscriptions.get(payload.subscriptionId)?.();
  }

  /**
   * Completes one Host request, caches its response, and performs final disposal when requested.
   *
   * @param request - Completed request envelope.
   * @param payload - Successful response payload.
   * @param error - Optional request failure.
   */
  #completeRequest(request: MiaixzBridgeEnvelope, payload?: unknown, error?: unknown): void {
    const state = this.#requests.completeHost(request.messageId);
    if (state === undefined || state.cancelled || state.responseSent || this.#disposed) return;
    state.responseSent = true;
    let responsePayload = payload;
    let responseError = error;
    if (responseError === undefined) {
      try {
        assertBridgePayloadWithinLimits(responsePayload, this.#limits);
      } catch (value) {
        responsePayload = undefined;
        responseError = value;
      }
    }
    const response = createEnvelope(
      this.#manifest.id,
      "response",
      request.method,
      request.messageId,
      responsePayload,
      responseError === undefined ? undefined : serializeError(responseError),
    );
    this.#incoming.recordResponse(request.messageId, response);
    this.#post(response);
    if (state?.replayRequested === true) this.#post(response);
    if (request.method === "bridge.handshake") {
      if (responseError === undefined) this.#resolveStartup();
      else {
        this.#rejectStartup(
          responseError instanceof MiaixzSdkError
            ? responseError
            : bridgeError("BRIDGE_MESSAGE_INVALID"),
        );
        this.dispose();
      }
    }
    if (request.method === "bridge.dispose" && responseError === undefined) this.dispose();
  }

  /**
   * Emits one timeout while retaining the request slot until the adapter task settles.
   *
   * @param request - Timed-out request envelope.
   * @param state - Retained Host request state.
   */
  #timeoutRequest(request: MiaixzBridgeEnvelope, state: HostRequestState): void {
    if (this.#disposed || state.cancelled) return;
    const response = createEnvelope(
      this.#manifest.id,
      "response",
      request.method,
      request.messageId,
      undefined,
      serializeError(bridgeError("BRIDGE_TIMEOUT")),
    );
    this.#incoming.recordResponse(request.messageId, response);
    this.#post(response);
    if (state.replayRequested) this.#post(response);
  }

  /**
   * Sends one immediate error response for a valid request.
   *
   * @param request - Request being rejected.
   * @param error - Registered SDK error.
   */
  #respondWithError(request: MiaixzBridgeEnvelope, error: MiaixzSdkError): void {
    this.#post(
      createEnvelope(
        this.#manifest.id,
        "response",
        request.method,
        request.messageId,
        undefined,
        serializeError(error),
      ),
    );
  }

  /**
   * Posts one envelope to the single validated target.
   *
   * @param envelope - Envelope to send.
   */
  #post(envelope: MiaixzBridgeEnvelope): void {
    this.#targetWindow.postMessage(envelope, this.#targetOrigin);
  }

  /**
   * Resolves the Host startup Promise exactly once.
   */
  #resolveStartup(): void {
    if (this.#readyState !== "pending") return;
    this.#readyState = "resolved";
    if (this.#readyTimer !== undefined) clearTimeout(this.#readyTimer);
    this.#resolveReady();
  }

  /**
   * Rejects the Host startup Promise exactly once.
   *
   * @param error - Deterministic startup failure.
   */
  #rejectStartup(error: MiaixzSdkError): void {
    if (this.#readyState !== "pending") return;
    this.#readyState = "rejected";
    if (this.#readyTimer !== undefined) clearTimeout(this.#readyTimer);
    this.#rejectReady(error);
  }

  /**
   * Returns one injected Adapter capability or throws the frozen missing-capability error.
   *
   * @typeParam Name - Adapter capability name.
   * @param name - Capability to resolve.
   * @returns Injected Adapter function.
   */
  #requireCapability<Name extends keyof MiaixzHostAdapter<Context>>(
    name: Name,
  ): NonNullable<MiaixzHostAdapter<Context>[Name]> {
    const capability = this.#adapter[name];
    if (capability === undefined) throw bridgeError("BRIDGE_CAPABILITY_UNAVAILABLE");
    return capability as NonNullable<MiaixzHostAdapter<Context>[Name]>;
  }
}
