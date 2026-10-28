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
 * Creates authentication-mode-specific SDK instances and coordinates service lifecycle cleanup.
 */

import {
  createMiaixzAppearanceManager,
  type MiaixzAppearanceManager,
} from "./display/appearance.js";
import {
  createApiClient,
  type MiaixzApiClient,
  type MiaixzCsrfTokenProvider,
} from "./fabric/api/client.js";
import { type MiaixzApiTelemetryHooks } from "./fabric/api/telemetry.types.js";
import { type MiaixzHttpResponse } from "./fabric/api/response.js";
import { type MiaixzRequestBody, type MiaixzRequestOptions } from "./fabric/api/request.js";
import {
  createMiaixzSessionManager,
  type MiaixzSessionManager,
} from "./access/session/session-manager.js";
import type {
  MiaixzPersistentSessionStorage,
  MiaixzSessionRefresher,
} from "./access/session/session.types.js";
import { MiaixzConfigStore } from "./runtime/config/config.js";
import { miaixzHeaders } from "./fabric/api/constants.js";
import {
  createMiaixzContextStore,
  type MiaixzContextStore,
} from "./access/context/context-store.js";
import { MiaixzSdkError } from "./errors/errors.js";
import type { MiaixzSdkEventMap } from "./runtime/events/event-types.js";
import { createMiaixzEventBus, type MiaixzEventBus } from "./runtime/events/events.js";
import { createMiaixzFileClient, type MiaixzFileClient } from "./fabric/files/files.js";
import {
  createMiaixzI18n,
  type MiaixzI18n,
  type MiaixzI18nLoadError,
  type MiaixzLocale,
  type MiaixzLocaleDefinition,
  type MiaixzMessageCatalog,
  type MiaixzMessageLoader,
} from "./i18n/i18n.js";
import { createMiaixzGrantSet, type MiaixzGrantSet } from "./access/grants/grant-set.js";
import {
  createMiaixzStorageKey,
  getMiaixzBrowserStorage,
  type MiaixzKeyValueStorage,
} from "./runtime/storage/storage.js";
import type { MiaixzGrantSnapshot } from "./access/grants/grant.types.js";
import type { MiaixzRuntimeContext } from "./access/context/context.types.js";
import type { MiaixzSdkConfig } from "./runtime/config/config.types.js";

/**
 * Selects the SDK authentication integration.
 *
 * @public
 */
export type MiaixzAuthMode = "cookie" | "bearer";

/**
 * Selects whether Appearance persistence follows the active tenant.
 *
 * @public
 */
export type MiaixzAppearanceScope = "global" | "tenant";

/**
 * Options shared by both authentication modes.
 *
 * @public
 */
export interface MiaixzSdkCommonOptions {
  /**
   * Identifies the consuming application and persistence namespace.
   */
  readonly appId: string;
  /**
   * Supplies the validated deployment configuration.
   */
  readonly config: MiaixzSdkConfig;
  /**
   * Supplies runtime context merged over restored state.
   */
  readonly initialContext?: MiaixzRuntimeContext;
  /**
   * Selects global or tenant-scoped Appearance persistence.
   */
  readonly appearanceScope?: MiaixzAppearanceScope;
  /**
   * Supplies the initial locale.
   */
  readonly locale?: MiaixzLocale;
  /**
   * Supplies the locale used for missing messages.
   */
  readonly fallbackLocale?: MiaixzLocale;
  /**
   * Registers trusted locale definitions.
   */
  readonly locales?: readonly MiaixzLocaleDefinition[];
  /**
   * Registers initial project message catalogs.
   */
  readonly messages?: MiaixzMessageCatalog;
  /**
   * Loads project-owned language files.
   */
  readonly loadMessages?: MiaixzMessageLoader;
  /**
   * Observes project language-file failures.
   */
  readonly onI18nLoadError?: (error: MiaixzI18nLoadError) => void;
  /**
   * Supplies stateful SDK storage.
   */
  readonly storage?: MiaixzKeyValueStorage;
  /**
   * Supplies the Fetch implementation used by API clients.
   */
  readonly fetch?: typeof fetch;
  /**
   * Observes sanitized request lifecycle telemetry.
   */
  readonly telemetry?: MiaixzApiTelemetryHooks;
  /**
   * Supplies the initial frontend grant snapshot.
   */
  readonly grants?: MiaixzGrantSnapshot;
}

/**
 * Cookie/BFF authentication options.
 *
 * @public
 */
export interface MiaixzCookieSdkOptions {
  /**
   * Selects Cookie/BFF authentication; omission has the same meaning.
   */
  readonly authMode?: "cookie";
  /**
   * Supplies the authoritative CSRF token for write requests.
   */
  readonly csrfTokenProvider?: MiaixzCsrfTokenProvider;
  /**
   * Rejects Bearer-only persistence.
   */
  readonly sessionPersistence?: never;
  /**
   * Rejects Bearer-only refresh behavior.
   */
  readonly refreshSession?: never;
}

/**
 * Bearer authentication options.
 *
 * @public
 */
export interface MiaixzBearerSdkOptions {
  /**
   * Selects Bearer authentication.
   */
  readonly authMode: "bearer";
  /**
   * Supplies explicitly acknowledged Bearer persistence.
   */
  readonly sessionPersistence?: MiaixzPersistentSessionStorage;
  /**
   * Supplies the Bearer session refresher.
   */
  readonly refreshSession?: MiaixzSessionRefresher;
  /**
   * Rejects the Cookie-only CSRF provider.
   */
  readonly csrfTokenProvider?: never;
}

/**
 * Makes an external event bus and an SDK-owned channel mutually exclusive.
 *
 * @public
 */
export type MiaixzSdkEventOptions =
  | {
      /**
       * Supplies a host-owned event bus.
       */
      readonly eventBus: MiaixzEventBus<MiaixzSdkEventMap>;
      /**
       * Rejects simultaneous creation of an SDK-owned channel.
       */
      readonly eventChannel?: never;
    }
  | {
      /**
       * Rejects a host-owned bus on the internal-channel branch.
       */
      readonly eventBus?: never;
      /**
       * Enables the SDK-owned cross-tab channel.
       */
      readonly eventChannel?: boolean;
    };

/**
 * Final SDK input contract.
 *
 * @public
 */
export type MiaixzSdkOptions = MiaixzSdkCommonOptions &
  MiaixzSdkEventOptions &
  (MiaixzCookieSdkOptions | MiaixzBearerSdkOptions);

/**
 * Services present on every SDK mode.
 *
 * @public
 */
export interface MiaixzSdkBase {
  /**
   * Mutable validated configuration store.
   */
  readonly config: MiaixzConfigStore;
  /**
   * Internationalization runtime.
   */
  readonly i18n: MiaixzI18n;
  /**
   * Initial project-message loading completion.
   */
  readonly ready: Promise<void>;
  /**
   * Shared local and cross-context event bus.
   */
  readonly events: MiaixzEventBus<MiaixzSdkEventMap>;
  /**
   * Runtime-context store.
   */
  readonly context: MiaixzContextStore;
  /**
   * Theme and density manager.
   */
  readonly appearance: MiaixzAppearanceManager;
  /**
   * Stable primary API façade.
   */
  readonly api: MiaixzApiClient;
  /**
   * Stable primary file client.
   */
  readonly files: MiaixzFileClient;
  /**
   * Current immutable grant evaluator.
   */
  readonly grants: MiaixzGrantSet;
  /**
   * Replaces the grant snapshot.
   */
  setGrants(snapshot: MiaixzGrantSnapshot): void;
  /**
   * Returns a stable API façade for the exact service key.
   */
  createServiceClient(service: string): MiaixzApiClient;
  /**
   * Releases all resources owned by this SDK.
   */
  destroy(): void;
}

/**
 * Cookie/BFF SDK without a token manager.
 *
 * @public
 */
export interface MiaixzCookieSdk extends MiaixzSdkBase {
  /**
   * Cookie/BFF mode discriminator.
   */
  readonly authMode: "cookie";
}

/**
 * Bearer SDK with an explicit token manager.
 *
 * @public
 */
export interface MiaixzBearerSdk extends MiaixzSdkBase {
  /**
   * Bearer mode discriminator.
   */
  readonly authMode: "bearer";
  /**
   * Bearer session manager.
   */
  readonly session: MiaixzSessionManager;
}

/**
 * Runtime SDK union.
 *
 * @public
 */
export type MiaixzSdk = MiaixzCookieSdk | MiaixzBearerSdk;

/**
 * Controls one stable API façade.
 */
interface MiaixzApiFacadeController {
  /**
   * Stable client exposed to callers.
   */
  readonly client: MiaixzApiClient;
  /**
   * Atomically switches the active transport.
   */
  activate(client: MiaixzApiClient): void;
  /**
   * Marks a removed service endpoint.
   */
  markMissing(service: string): void;
  /**
   * Permanently disables the façade.
   */
  destroy(): void;
}

/**
 * Represents every API façade lifecycle state.
 */
type FacadeState =
  | {
      /**
       * Active transport state.
       */
      readonly kind: "active";
      /**
       * Current transport.
       */
      readonly client: MiaixzApiClient;
    }
  | {
      /**
       * Missing endpoint state.
       */
      readonly kind: "missing";
      /**
       * Exact missing service key.
       */
      readonly service: string;
    }
  | {
      /**
       * Destroyed SDK state.
       */
      readonly kind: "destroyed";
    };

/**
 * Creates an identity-stable API façade around replaceable transports.
 *
 * @param initialClient - Initial validated transport.
 * @returns Stable façade controller.
 */
function createApiFacade(initialClient: MiaixzApiClient): MiaixzApiFacadeController {
  let state: FacadeState = { kind: "active", client: initialClient };
  /**
   * Returns the active transport or throws the deterministic lifecycle error.
   *
   * @returns The current active API transport.
   */
  const active = (): MiaixzApiClient => {
    if (state.kind === "destroyed") throw new MiaixzSdkError({ code: "SDK_DESTROYED" });
    if (state.kind === "missing") {
      throw new MiaixzSdkError({
        code: "SERVICE_ENDPOINT_MISSING",
        details: { service: state.service },
      });
    }
    return state.client;
  };
  const client: MiaixzApiClient = {
    /**
     * Returns the active base URL.
     *
     * @returns Base URL of the current transport.
     */
    get baseUrl() {
      return active().baseUrl;
    },
    /**
     * Delegates one fully configured request.
     *
     * @param path - Relative request path.
     * @param options - Request-specific behavior.
     * @returns The active transport response.
     */
    request<TResponse = unknown, TBody extends MiaixzRequestBody = MiaixzRequestBody>(
      path: string,
      options?: MiaixzRequestOptions<TResponse, TBody>,
    ): Promise<MiaixzHttpResponse<TResponse>> {
      return active().request(path, options);
    },
    /**
     * Delegates a GET request.
     *
     * @param path - Relative request path.
     * @param options - Request-specific behavior.
     * @returns The active transport response.
     */
    get(path, options) {
      return active().get(path, options);
    },
    /**
     * Delegates a POST request.
     *
     * @param path - Relative request path.
     * @param body - Optional request body.
     * @param options - Request-specific behavior.
     * @returns The active transport response.
     */
    post(path, body, options) {
      return active().post(path, body, options);
    },
    /**
     * Delegates a PUT request.
     *
     * @param path - Relative request path.
     * @param body - Optional request body.
     * @param options - Request-specific behavior.
     * @returns The active transport response.
     */
    put(path, body, options) {
      return active().put(path, body, options);
    },
    /**
     * Delegates a PATCH request.
     *
     * @param path - Relative request path.
     * @param body - Optional request body.
     * @param options - Request-specific behavior.
     * @returns The active transport response.
     */
    patch(path, body, options) {
      return active().patch(path, body, options);
    },
    /**
     * Delegates a DELETE request.
     *
     * @param path - Relative request path.
     * @param options - Request-specific behavior.
     * @returns The active transport response.
     */
    delete(path, options) {
      return active().delete(path, options);
    },
  };
  return {
    client,
    /**
     * Activates a fully validated replacement transport.
     *
     * @param nextClient - Replacement transport.
     */
    activate(nextClient) {
      if (state.kind === "destroyed") throw new MiaixzSdkError({ code: "SDK_DESTROYED" });
      state = { kind: "active", client: nextClient };
    },
    /**
     * Marks a service façade whose endpoint was removed.
     *
     * @param service - Exact service cache key.
     */
    markMissing(service) {
      if (state.kind !== "destroyed") state = { kind: "missing", service };
    },
    /**
     * Permanently disables the façade.
     */
    destroy() {
      state = { kind: "destroyed" };
    },
  };
}

/**
 * Validates the Appearance persistence scope.
 *
 * @param value - Runtime scope candidate.
 * @returns Validated scope or the tenant default.
 */
function resolveAppearanceScope(value: unknown): MiaixzAppearanceScope {
  if (value === undefined) return "tenant";
  if (value === "global" || value === "tenant") return value;
  throw new MiaixzSdkError({ code: "APPEARANCE_SCOPE_INVALID" });
}

/**
 * Creates a default Cookie/BFF SDK.
 *
 * @param options - Cookie/BFF runtime options.
 * @returns A Cookie SDK without a token manager.
 * @public
 */
export function createMiaixzSdk(
  options: MiaixzSdkCommonOptions & MiaixzSdkEventOptions & MiaixzCookieSdkOptions,
): MiaixzCookieSdk;

/**
 * Creates a Bearer SDK with a session manager.
 *
 * @param options - Bearer runtime options.
 * @returns A Bearer SDK with a session manager.
 * @public
 */
export function createMiaixzSdk(
  options: MiaixzSdkCommonOptions & MiaixzSdkEventOptions & MiaixzBearerSdkOptions,
): MiaixzBearerSdk;

/**
 * Composes the complete Miaixz runtime.
 *
 * @param options - Authentication-specific runtime options.
 * @returns A Cookie or Bearer SDK selected by the discriminator.
 * @public
 */
export function createMiaixzSdk(options: MiaixzSdkOptions): MiaixzSdk {
  createMiaixzStorageKey({ appId: options.appId }, "context");
  const authMode = options.authMode ?? "cookie";
  if (options.eventBus !== undefined && options.eventChannel !== undefined) {
    throw new MiaixzSdkError({ code: "EVENT_CHANNEL_INVALID" });
  }
  if (
    authMode === "cookie" &&
    (Reflect.get(options, "sessionPersistence") !== undefined ||
      Reflect.get(options, "refreshSession") !== undefined)
  ) {
    throw new MiaixzSdkError({ code: "CONFIG_INVALID" });
  }
  if (authMode === "bearer" && Reflect.get(options, "csrfTokenProvider") !== undefined) {
    throw new MiaixzSdkError({ code: "CONFIG_INVALID" });
  }

  const i18n = createMiaixzI18n({
    ...(options.locale === undefined ? {} : { locale: options.locale }),
    ...(options.fallbackLocale === undefined ? {} : { fallbackLocale: options.fallbackLocale }),
    ...(options.locales === undefined ? {} : { locales: options.locales }),
    ...(options.messages === undefined ? {} : { messages: options.messages }),
    ...(options.loadMessages === undefined ? {} : { loadMessages: options.loadMessages }),
    ...(options.onI18nLoadError === undefined ? {} : { onLoadError: options.onI18nLoadError }),
  });
  const appearanceScope = resolveAppearanceScope(options.appearanceScope);
  const ownsEventBus = options.eventBus === undefined;
  const events =
    options.eventBus ??
    createMiaixzEventBus({
      channelName: options.eventChannel === true ? `miaixz:${options.appId}:events` : false,
    });
  const storage = options.storage ?? getMiaixzBrowserStorage();
  const ready = i18n.initialize(["sdk"]);
  const config = new MiaixzConfigStore(options.config, events);
  const session =
    authMode === "bearer"
      ? createMiaixzSessionManager({
          eventBus: events,
          ...(options.sessionPersistence === undefined
            ? {}
            : { persistence: options.sessionPersistence }),
          ...(options.refreshSession === undefined ? {} : { refresh: options.refreshSession }),
        })
      : undefined;
  const context = createMiaixzContextStore({
    appId: options.appId,
    eventBus: events,
    ...(storage === undefined ? {} : { storage }),
    ...(options.initialContext === undefined ? {} : { initialContext: options.initialContext }),
  });
  if (context.getSnapshot().locale !== i18n.locale) context.patch({ locale: i18n.locale });

  let appearanceTenantId =
    appearanceScope === "tenant" ? context.getSnapshot().tenantId : undefined;
  const appearance = createMiaixzAppearanceManager({
    appId: options.appId,
    ...(appearanceScope === "tenant" && appearanceTenantId !== undefined
      ? { tenantId: appearanceTenantId }
      : {}),
    events,
    ...(storage === undefined ? {} : { storage }),
    ...(config.getSnapshot().appearance === undefined
      ? {}
      : { initialAppearance: config.getSnapshot().appearance }),
  });
  const stopAppearanceScopeSync =
    appearanceScope === "tenant"
      ? context.subscribe((snapshot) => {
          if (snapshot.tenantId === appearanceTenantId) return;
          appearanceTenantId = snapshot.tenantId;
          appearance.setScope(appearanceTenantId);
        })
      : undefined;

  /**
   * Creates an HTTP client using the active SDK authentication, locale, and context policies.
   *
   * @param baseUrl - Validated API base URL.
   * @param environment - Execution environment governing transport restrictions.
   * @param timeoutMs - Optional request timeout in milliseconds.
   * @returns Client bound to the SDK context and authentication providers.
   */
  const createClient = (
    baseUrl: string,
    environment: MiaixzSdkConfig["environment"],
    timeoutMs: number | undefined,
  ): MiaixzApiClient =>
    createApiClient({
      baseUrl,
      environment,
      credentials: authMode === "cookie" ? "include" : "same-origin",
      ...(session === undefined ? {} : { authorizationProvider: session.authorizationProvider }),
      csrf:
        authMode === "cookie"
          ? {
              required: true,
              ...(options.csrfTokenProvider === undefined
                ? {}
                : { tokenProvider: options.csrfTokenProvider }),
            }
          : { required: false },
      contextHeadersProvider: () => {
        const headers = context.headersProvider();
        if (!headers.has(miaixzHeaders.locale)) headers.set(miaixzHeaders.locale, i18n.locale);
        return headers;
      },
      ...(options.telemetry === undefined ? {} : { telemetry: options.telemetry }),
      ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
      ...(timeoutMs === undefined ? {} : { timeoutMs }),
    });

  const initialConfig = config.getSnapshot();
  const primary = createApiFacade(
    createClient(
      initialConfig.apiBaseUrl,
      initialConfig.environment,
      initialConfig.requestTimeoutMs,
    ),
  );
  const files = createMiaixzFileClient(primary.client);
  const services = new Map<string, MiaixzApiFacadeController>();
  let grants = createMiaixzGrantSet(options.grants ?? { allowed: [] });
  let grantsRevision = 0;
  let preparedUpdate:
    | {
        /**
         * Prepared primary client.
         */
        readonly primary: MiaixzApiClient;
        /**
         * Prepared service clients keyed by the original service string.
         */
        readonly services: ReadonlyMap<string, MiaixzApiClient | undefined>;
      }
    | undefined;

  const stopClientConfigPrepare = config.prepare((nextConfig) => {
    const nextServices = new Map<string, MiaixzApiClient | undefined>();
    for (const service of services.keys()) {
      const endpoint = nextConfig.services?.[service];
      nextServices.set(
        service,
        endpoint === undefined
          ? undefined
          : createClient(endpoint, nextConfig.environment, nextConfig.requestTimeoutMs),
      );
    }
    preparedUpdate = {
      primary: createClient(
        nextConfig.apiBaseUrl,
        nextConfig.environment,
        nextConfig.requestTimeoutMs,
      ),
      services: nextServices,
    };
  });
  const stopClientConfigSync = config.subscribe(() => {
    const update = preparedUpdate;
    if (update === undefined) return;
    primary.activate(update.primary);
    for (const [service, nextClient] of update.services) {
      const controller = services.get(service);
      if (controller === undefined) continue;
      if (nextClient === undefined) controller.markMissing(service);
      else controller.activate(nextClient);
    }
    preparedUpdate = undefined;
  });

  const stopLocaleBroadcast = i18n.subscribe((snapshot) => {
    if (context.getSnapshot().locale !== snapshot.locale) {
      context.patch({ locale: snapshot.locale });
      events.emit("locale:changed", Object.freeze({ locale: snapshot.locale }));
    }
  });
  const stopLocaleSync = events.on("locale:changed", ({ locale }) => {
    if (locale !== i18n.locale) void i18n.changeLocale(locale).catch(() => undefined);
  });

  let destroyed = false;
  const common: MiaixzSdkBase = {
    config,
    i18n,
    ready,
    events,
    context,
    appearance,
    api: primary.client,
    files,
    /**
     * Returns the active grant evaluator.
     *
     * @returns The active immutable grant set.
     */
    get grants() {
      return grants;
    },
    /**
     * Replaces the active grant snapshot.
     *
     * @param snapshot - Grant snapshot to validate and activate.
     */
    setGrants(snapshot) {
      if (destroyed) throw new MiaixzSdkError({ code: "SDK_DESTROYED" });
      grants = createMiaixzGrantSet(snapshot);
      events.emit("grants:changed", Object.freeze({ revision: ++grantsRevision }));
    },
    /**
     * Returns a stable client for an exact configured service key.
     *
     * @param service - Exact service key from configuration.
     * @returns Identity-stable service API façade.
     */
    createServiceClient(service) {
      if (destroyed) throw new MiaixzSdkError({ code: "SDK_DESTROYED" });
      const existing = services.get(service);
      if (existing !== undefined) return existing.client;
      const endpoint = config.getSnapshot().services?.[service];
      if (endpoint === undefined) {
        throw new MiaixzSdkError({ code: "SERVICE_ENDPOINT_MISSING", details: { service } });
      }
      const controller = createApiFacade(
        createClient(
          endpoint,
          config.getSnapshot().environment,
          config.getSnapshot().requestTimeoutMs,
        ),
      );
      services.set(service, controller);
      return controller.client;
    },
    /**
     * Releases all resources and permanently disables request façades.
     */
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopAppearanceScopeSync?.();
      stopLocaleBroadcast();
      stopLocaleSync();
      stopClientConfigPrepare();
      stopClientConfigSync();
      session?.destroy();
      context.destroy();
      appearance.destroy();
      config.destroy();
      primary.destroy();
      for (const controller of services.values()) controller.destroy();
      services.clear();
      if (ownsEventBus) events.close();
    },
  };

  /**
   * Preserves the live grants accessor; spreading common would capture only its initial snapshot.
   */
  return Object.assign(
    common,
    authMode === "bearer"
      ? { authMode: "bearer" as const, session: session as MiaixzSessionManager }
      : { authMode: "cookie" as const },
  );
}
