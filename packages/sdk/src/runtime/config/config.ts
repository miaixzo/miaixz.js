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
 * Loads and validates SDK configuration using the declared source precedence.
 */

import { normalizeMiaixzApiEndpoint } from "../../fabric/api/endpoint.js";
import { isMiaixzAppearanceSettings } from "../../display/validation.js";
import { isMiaixzSdkError, MiaixzSdkError } from "../../errors/errors.js";
import type { MiaixzEventBusPort } from "../events/event-port.js";
import type { MiaixzEnvironment, MiaixzFeatureValue, MiaixzSdkConfig } from "./config.types.js";
import { isRecord } from "../../shared/object.js";

/**
 * Limits configuration-store events to configuration snapshots.
 */
type ConfigEventMap = {
  readonly "config:changed": Readonly<MiaixzSdkConfig>;
};

/**
 * Configures the ordered sources used to load SDK configuration.
 *
 * @public
 */
export interface MiaixzLoadConfigOptions {
  /**
   * Optional in-memory configuration candidate with highest precedence.
   */
  config?: unknown;

  /**
   * Optional URL of a deployment-provided JSON configuration.
   */
  url?: string;

  /**
   * Optional Fetch implementation used to load remote configuration.
   */
  fetch?: typeof fetch;

  /**
   * Optional global variable name containing injected configuration.
   */
  globalKey?: string;
}

/**
 * Validates supported primitive feature-flag values.
 *
 * @param value - Feature value candidate to inspect.
 * @returns Whether the value is a supported feature-flag value.
 */
function isFeatureValue(value: unknown): value is MiaixzFeatureValue {
  return (
    typeof value === "boolean" ||
    typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

/**
 * Determines whether a value satisfies the complete SDK configuration contract.
 *
 * @param value - Configuration candidate to inspect.
 * @returns Whether `value` satisfies the complete SDK configuration contract.
 * @public
 */
export function isMiaixzSdkConfig(value: unknown): value is MiaixzSdkConfig {
  if (!isRecord(value)) return false;
  if (typeof value.environment !== "string") return false;
  const environment = value.environment as MiaixzEnvironment;
  if (normalizeMiaixzApiEndpoint(value.apiBaseUrl, environment) === undefined) return false;
  if (
    value.requestTimeoutMs !== undefined &&
    (typeof value.requestTimeoutMs !== "number" ||
      !Number.isFinite(value.requestTimeoutMs) ||
      value.requestTimeoutMs <= 0)
  )
    return false;
  if (value.release !== undefined && typeof value.release !== "string") return false;
  if (
    value.services !== undefined &&
    (!isRecord(value.services) ||
      !Object.values(value.services).every(
        (endpoint) => normalizeMiaixzApiEndpoint(endpoint, environment) !== undefined,
      ))
  )
    return false;
  if (
    value.features !== undefined &&
    (!isRecord(value.features) || !Object.values(value.features).every(isFeatureValue))
  )
    return false;
  if (value.appearance !== undefined && !isMiaixzAppearanceSettings(value.appearance)) return false;
  return true;
}

/**
 * Validates and freezes a configuration object.
 *
 * @param config - Configuration object to validate and freeze.
 * @returns Immutable SDK configuration.
 * @throws MiaixzSdkError when required values are missing or invalid.
 * @public
 */
export function defineMiaixzConfig(config: MiaixzSdkConfig): Readonly<MiaixzSdkConfig> {
  if (!isMiaixzSdkConfig(config)) {
    throw new MiaixzSdkError({ code: "CONFIG_INVALID" });
  }
  return Object.freeze({
    ...config,
    ...(config.services ? { services: Object.freeze({ ...config.services }) } : {}),
    ...(config.features ? { features: Object.freeze({ ...config.features }) } : {}),
    ...(config.appearance
      ? {
          appearance: Object.freeze({
            ...config.appearance,
            ...(config.appearance.overrides
              ? {
                  overrides: Object.freeze({
                    ...(config.appearance.overrides.light
                      ? { light: Object.freeze({ ...config.appearance.overrides.light }) }
                      : {}),
                    ...(config.appearance.overrides.dark
                      ? { dark: Object.freeze({ ...config.appearance.overrides.dark }) }
                      : {}),
                  }),
                }
              : {}),
          }),
        }
      : {}),
  });
}

/**
 * Reads an optional deployment-injected configuration object from `globalThis`.
 *
 * @param globalKey - Global property name to read.
 * @returns Injected value when the property exists.
 */
function readGlobalConfig(globalKey: string): unknown {
  return (globalThis as unknown as Record<string, unknown>)[globalKey];
}

/**
 * Loads configuration from an object, global variable, or remote JSON file.
 *
 * @param options - Ordered configuration sources and runtime adapters.
 * @returns A validated immutable SDK configuration.
 * @public
 */
export async function loadMiaixzConfig(
  options: MiaixzLoadConfigOptions = {},
): Promise<Readonly<MiaixzSdkConfig>> {
  let candidate = options.config ?? readGlobalConfig(options.globalKey ?? "__MIAIXZ_CONFIG__");

  if (candidate === undefined && options.url) {
    const fetchImplementation = options.fetch ?? globalThis.fetch;
    if (!fetchImplementation) {
      throw new MiaixzSdkError({
        code: "CONFIG_FETCH_UNAVAILABLE",
      });
    }
    try {
      const response = await fetchImplementation(options.url, { credentials: "same-origin" });
      if (!response.ok) {
        throw new MiaixzSdkError({
          code: "CONFIG_FETCH_FAILED",
          details: { status: response.status, url: options.url },
        });
      }
      candidate = await response.json();
    } catch (cause) {
      if (isMiaixzSdkError(cause)) throw cause;
      throw new MiaixzSdkError({
        code: "CONFIG_FETCH_FAILED",
        cause,
        details: { url: options.url },
      });
    }
  }

  if (!isMiaixzSdkConfig(candidate)) {
    throw new MiaixzSdkError({
      code: "CONFIG_INVALID",
      details: candidate,
    });
  }
  return defineMiaixzConfig(candidate);
}

/**
 * Resolves the base URL for an independently deployed frontend service.
 *
 * @param config - SDK configuration containing service endpoints.
 * @param service - Service name to resolve.
 * @returns Configured service base URL.
 * @throws MiaixzSdkError when the service name is not configured.
 * @public
 */
export function getMiaixzServiceEndpoint(
  config: Readonly<MiaixzSdkConfig>,
  service: string,
): string {
  const endpoint = config.services?.[service];
  if (!endpoint) {
    throw new MiaixzSdkError({
      code: "SERVICE_ENDPOINT_MISSING",
      details: { service },
    });
  }
  return endpoint;
}

/**
 * Returns a configured feature value or the caller-supplied fallback.
 *
 * @param config - SDK configuration containing feature flags.
 * @param feature - Feature name to resolve.
 * @param fallback - Value returned when the feature is not configured.
 * @returns Configured feature value or the supplied fallback.
 * @public
 */
export function getMiaixzFeature<T extends MiaixzFeatureValue>(
  config: Readonly<MiaixzSdkConfig>,
  feature: string,
  fallback: T,
): MiaixzFeatureValue | T {
  return config.features?.[feature] ?? fallback;
}

/**
 * Mutable configuration store with local subscriptions and cross-service events.
 *
 * @public
 */
export class MiaixzConfigStore {
  readonly #preparers = new Set<(config: Readonly<MiaixzSdkConfig>) => void>();
  readonly #listeners = new Set<(config: Readonly<MiaixzSdkConfig>) => void>();
  #config: Readonly<MiaixzSdkConfig>;
  readonly #events: MiaixzEventBusPort<ConfigEventMap> | undefined;
  #stopEventListener: (() => void) | undefined;

  /**
   * Creates a configuration store.
   *
   * @param config - Initial validated configuration.
   * @param events - Optional shared event bus.
   */
  constructor(config: MiaixzSdkConfig, events?: MiaixzEventBusPort<ConfigEventMap>) {
    this.#config = defineMiaixzConfig(config);
    this.#events = events;
    this.#stopEventListener = events?.on("config:changed", (nextConfig) => {
      if (isMiaixzSdkConfig(nextConfig)) this.#set(nextConfig, false);
    });
  }

  /**
   * Returns the current SDK configuration.
   *
   * @returns The current immutable configuration snapshot.
   */
  getSnapshot(): Readonly<MiaixzSdkConfig> {
    return this.#config;
  }

  /**
   * Validates, stores, publishes, and broadcasts new configuration.
   *
   * @param config - Configuration object to activate.
   */
  set(config: MiaixzSdkConfig): void {
    this.#set(config, true);
  }

  /**
   * Commits configuration and optionally broadcasts it.
   *
   * @param config - Configuration object to commit.
   * @param broadcast - Whether to publish the change through the event bus.
   */
  #set(config: MiaixzSdkConfig, broadcast: boolean): void {
    if (config === this.#config) return;
    const nextConfig = defineMiaixzConfig(config);
    for (const prepare of this.#preparers) prepare(nextConfig);
    this.#config = nextConfig;
    for (const listener of this.#listeners) listener(this.#config);
    if (broadcast) this.#events?.emit("config:changed", this.#config);
  }

  /**
   * Registers a configuration listener and returns its unsubscribe function.
   *
   * @param listener - Callback invoked with each configuration snapshot.
   * @returns Function that unregisters the listener.
   */
  subscribe(listener: (config: Readonly<MiaixzSdkConfig>) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /**
   * Registers a side-effect-free preparation step before a new snapshot commits.
   *
   * @param prepare - Callback that validates and prepares replacement runtime state.
   * @returns Function that unregisters the preparation step.
   * @internal
   */
  prepare(prepare: (config: Readonly<MiaixzSdkConfig>) => void): () => void {
    this.#preparers.add(prepare);
    return () => this.#preparers.delete(prepare);
  }

  /**
   * Releases event subscriptions and local listeners.
   */
  destroy(): void {
    this.#stopEventListener?.();
    this.#preparers.clear();
    this.#listeners.clear();
  }
}
