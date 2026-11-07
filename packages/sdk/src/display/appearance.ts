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
 * Manages appearance snapshots, persistence, and appearance-change events.
 */

import { VERSION } from "../version.js";

import { MiaixzSdkError } from "../errors/errors.js";
import type { MiaixzEventBusPort } from "../runtime/events/event-port.js";
import {
  createMiaixzStorageKey,
  getMiaixzBrowserStorage,
  readMiaixzVersionedValue,
  type MiaixzKeyValueStorage,
  type MiaixzStorageMigration,
  type MiaixzStorageScope,
} from "../runtime/storage/storage.js";
import type {
  MiaixzAppearancePayload,
  MiaixzAppearanceSettings,
  MiaixzBaseFontSize,
  MiaixzColorMode,
  MiaixzDensity,
  MiaixzRadiusScale,
  MiaixzShellLayout,
  MiaixzThemeOverrides,
} from "./appearance.types.js";
import { miaixzAppearanceMigration } from "./migration.js";
import { miaixzDefaultAppearance, parseMiaixzAppearanceSettings } from "./validation.js";

/**
 * Limits appearance synchronization to versioned appearance snapshots.
 */
type AppearanceEventMap = {
  readonly "appearance:changed": Readonly<MiaixzAppearancePayload>;
};

/**
 * Identifies the current Appearance persistence and event schema.
 *
 * @public
 */
export const miaixzAppearanceSchemaVersion = VERSION;

/**
 * Configures a Miaixz Appearance manager.
 *
 * @public
 */
export interface MiaixzAppearanceManagerOptions {
  /**
   * Identifies the consuming frontend application.
   */
  readonly appId: string;

  /**
   * Identifies the optional initial tenant persistence boundary.
   */
  readonly tenantId?: string;

  /**
   * Supplies complete settings that override restored persistence at construction.
   */
  readonly initialAppearance?: MiaixzAppearanceSettings;

  /**
   * Supplies an optional versioned persistence adapter.
   */
  readonly storage?: MiaixzKeyValueStorage;

  /**
   * Supplies optional migrations that precede the built-in legacy-to-VERSION migration.
   */
  readonly migrations?: readonly MiaixzStorageMigration[];

  /**
   * Supplies an optional event bus for local or cross-context synchronization.
   */
  readonly events?: MiaixzEventBusPort<AppearanceEventMap>;
}

/**
 * Manages synchronous, versioned, tenant-scoped Appearance state without DOM access.
 *
 * @public
 */
export class MiaixzAppearanceManager {
  readonly #appId: string;
  readonly #storage: MiaixzKeyValueStorage | undefined;
  readonly #migrations: readonly MiaixzStorageMigration[];
  readonly #events: MiaixzEventBusPort<AppearanceEventMap> | undefined;
  readonly #listeners = new Set<(appearance: Readonly<MiaixzAppearanceSettings>) => void>();
  #tenantId: string | undefined;
  #appearance: MiaixzAppearanceSettings;
  #stopEventListener: (() => void) | undefined;
  #destroyed = false;
  #publishingEvent = false;

  /**
   * Creates one validated Appearance manager.
   *
   * @param options - Application identity and optional runtime adapters.
   * @throws MiaixzSdkError When scope, migrations, initial settings, or storage are invalid.
   */
  constructor(options: Readonly<MiaixzAppearanceManagerOptions>) {
    this.#appId = options.appId;
    this.#tenantId = options.tenantId;
    this.#storage = options.storage ?? getMiaixzBrowserStorage();
    this.#migrations = Object.freeze([...(options.migrations ?? []), miaixzAppearanceMigration]);
    this.#events = options.events;

    const scope = this.#createScope(this.#tenantId);
    this.#validateStorageConfiguration(scope);
    const persisted = this.#read(scope);
    this.#appearance =
      options.initialAppearance === undefined
        ? (persisted ?? miaixzDefaultAppearance)
        : parseMiaixzAppearanceSettings(options.initialAppearance);
    this.#stopEventListener = this.#events?.on("appearance:changed", (payload) => {
      if (this.#publishingEvent) return;
      try {
        const appearance = this.#parsePayload(payload);
        if (appearance !== undefined) this.#commit(appearance, false);
      } catch {
        /**
         * Invalid external events and local adapter failures never escape the event boundary.
         */
      }
    });
  }

  /**
   * Returns the current deeply frozen Appearance snapshot.
   *
   * @returns Current normalized settings.
   */
  getSnapshot(): Readonly<MiaixzAppearanceSettings> {
    return this.#appearance;
  }

  /**
   * Replaces the complete Appearance snapshot transactionally.
   *
   * @param appearance - Complete settings to commit.
   * @throws MiaixzSdkError When validation or persistence fails.
   */
  set(appearance: MiaixzAppearanceSettings): void {
    this.#commit(parseMiaixzAppearanceSettings(appearance), true);
  }

  /**
   * Shallowly merges and commits top-level Appearance fields.
   *
   * Passing `overrides` replaces the complete previous override object.
   *
   * @param appearance - Top-level settings fields to replace.
   * @throws MiaixzSdkError When validation or persistence fails.
   */
  patch(appearance: Partial<MiaixzAppearanceSettings>): void {
    const next = { ...this.#appearance, ...appearance };
    if (Object.hasOwn(appearance, "overrides") && appearance.overrides === undefined) {
      delete next.overrides;
    }
    this.set(next);
  }

  /**
   * Commits a new theme identifier.
   *
   * @param theme - Valid theme identifier.
   * @throws MiaixzSdkError When validation or persistence fails.
   */
  setTheme(theme: string): void {
    this.patch({ theme });
  }

  /**
   * Commits a light, dark, or system color-mode preference.
   *
   * @param colorMode - Color-mode preference.
   * @throws MiaixzSdkError When validation or persistence fails.
   */
  setColorMode(colorMode: MiaixzColorMode): void {
    this.patch({ colorMode });
  }

  /**
   * Commits an interface density preference.
   *
   * @param density - Density preference.
   * @throws MiaixzSdkError When validation or persistence fails.
   */
  setDensity(density: MiaixzDensity): void {
    this.patch({ density });
  }

  /**
   * Commits or clears an application-shell layout override.
   *
   * @param shellLayout - Layout override, or undefined to inherit the active theme.
   * @throws MiaixzSdkError When validation or persistence fails.
   */
  setShellLayout(shellLayout?: MiaixzShellLayout): void {
    if (shellLayout === undefined) {
      const next = { ...this.#appearance };
      delete next.shellLayout;
      this.set(next);
      return;
    }
    this.patch({ shellLayout });
  }

  /**
   * Commits or clears a semantic-radius scale override.
   *
   * @param radiusScale - Radius multiplier, or undefined to inherit the active theme.
   * @throws MiaixzSdkError When validation or persistence fails.
   */
  setRadiusScale(radiusScale?: MiaixzRadiusScale): void {
    if (radiusScale === undefined) {
      const next = { ...this.#appearance };
      delete next.radiusScale;
      this.set(next);
      return;
    }
    this.patch({ radiusScale });
  }

  /**
   * Commits or clears a base interface font-size override.
   *
   * @param baseFontSize - Font size in pixels, or undefined to inherit the active theme.
   * @throws MiaixzSdkError When validation or persistence fails.
   */
  setBaseFontSize(baseFontSize?: MiaixzBaseFontSize): void {
    if (baseFontSize === undefined) {
      const next = { ...this.#appearance };
      delete next.baseFontSize;
      this.set(next);
      return;
    }
    this.patch({ baseFontSize });
  }

  /**
   * Replaces or removes all mode-specific color overrides.
   *
   * @param overrides - Complete override object, or undefined to remove overrides.
   * @throws MiaixzSdkError When validation or persistence fails.
   */
  setOverrides(overrides?: MiaixzThemeOverrides): void {
    if (overrides === undefined) {
      const next = { ...this.#appearance };
      delete next.overrides;
      this.set(next);
      return;
    }
    this.patch({ overrides });
  }

  /**
   * Restores the default Appearance snapshot within the current scope.
   *
   * @throws MiaixzSdkError When persistence fails.
   */
  reset(): void {
    this.set(miaixzDefaultAppearance);
  }

  /**
   * Reloads Appearance state from another validated tenant scope.
   *
   * @param tenantId - Optional tenant identifier, or undefined for global scope.
   * @throws MiaixzSdkError When the scope or migration chain is invalid.
   */
  setScope(tenantId?: string): void {
    const scope = this.#createScope(tenantId);
    this.#validateStorageConfiguration(scope);
    const appearance = this.#read(scope) ?? miaixzDefaultAppearance;
    this.#tenantId = tenantId;
    this.#appearance = appearance;
    this.#notify();
  }

  /**
   * Registers a synchronous listener for committed snapshots.
   *
   * @param listener - Callback invoked after each successful commit.
   * @returns Idempotent unsubscribe function.
   */
  subscribe(listener: (appearance: Readonly<MiaixzAppearanceSettings>) => void): () => void {
    this.#listeners.add(listener);
    let subscribed = true;
    return () => {
      if (!subscribed) return;
      subscribed = false;
      this.#listeners.delete(listener);
    };
  }

  /**
   * Releases the event subscription and all local listeners.
   */
  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#stopEventListener?.();
    this.#stopEventListener = undefined;
    this.#listeners.clear();
  }

  /**
   * Creates the current versioned-storage scope.
   *
   * @param tenantId - Optional tenant identifier.
   * @returns Application and tenant storage scope.
   */
  #createScope(tenantId: string | undefined): MiaixzStorageScope {
    return tenantId === undefined ? { appId: this.#appId } : { appId: this.#appId, tenantId };
  }

  /**
   * Validates scope and the continuous migration chain before physical access.
   *
   * @param scope - Candidate persistence scope.
   * @throws MiaixzSdkError When scope or migrations are invalid.
   */
  #validateStorageConfiguration(scope: Readonly<MiaixzStorageScope>): void {
    readMiaixzVersionedValue({
      scope,
      kind: "appearance",
      schemaVersion: miaixzAppearanceSchemaVersion,
      migrations: this.#migrations,
      parse: parseMiaixzAppearanceSettings,
    });
  }

  /**
   * Reads and normalizes one scoped persisted snapshot.
   *
   * @param scope - Validated persistence scope.
   * @returns Normalized settings, or undefined when absent or unusable.
   */
  #read(scope: Readonly<MiaixzStorageScope>): MiaixzAppearanceSettings | undefined {
    return readMiaixzVersionedValue({
      ...(this.#storage === undefined ? {} : { storage: this.#storage }),
      scope,
      kind: "appearance",
      schemaVersion: miaixzAppearanceSchemaVersion,
      migrations: this.#migrations,
      parse: parseMiaixzAppearanceSettings,
    });
  }

  /**
   * Parses a complete current-release event payload without surfacing untrusted failures.
   *
   * @param value - Untrusted event payload.
   * @returns Normalized settings, or undefined for an invalid payload.
   */
  #parsePayload(value: unknown): MiaixzAppearanceSettings | undefined {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    if (
      keys.length !== 2 ||
      !Object.hasOwn(record, "schemaVersion") ||
      !Object.hasOwn(record, "value") ||
      record.schemaVersion !== miaixzAppearanceSchemaVersion
    ) {
      return undefined;
    }
    try {
      return parseMiaixzAppearanceSettings(record.value);
    } catch {
      return undefined;
    }
  }

  /**
   * Persists then commits one already-normalized snapshot.
   *
   * @param appearance - Deeply frozen settings to commit.
   * @param broadcast - Whether to publish a complete current-release event payload.
   * @throws MiaixzSdkError When persistence fails before the in-memory commit.
   */
  #commit(appearance: MiaixzAppearanceSettings, broadcast: boolean): void {
    this.#persist(appearance);
    this.#appearance = appearance;
    this.#notify();
    if (!broadcast) return;
    const payload: MiaixzAppearancePayload = Object.freeze({
      schemaVersion: miaixzAppearanceSchemaVersion,
      value: appearance,
    });
    this.#publishingEvent = true;
    try {
      this.#events?.emit("appearance:changed", payload);
    } catch {
      /**
       * The committed transaction is not rolled back by observer or transport failures.
       */
    } finally {
      this.#publishingEvent = false;
    }
  }

  /**
   * Performs the single atomic storage write before mutating manager memory.
   *
   * @param appearance - Normalized settings to serialize.
   * @throws MiaixzSdkError When serialization or the adapter write fails.
   */
  #persist(appearance: MiaixzAppearanceSettings): void {
    if (this.#storage === undefined) return;
    const key = createMiaixzStorageKey(this.#createScope(this.#tenantId), "appearance");
    try {
      const payload: MiaixzAppearancePayload = {
        schemaVersion: miaixzAppearanceSchemaVersion,
        value: appearance,
      };
      this.#storage.setItem(key, JSON.stringify(payload));
    } catch (cause) {
      throw new MiaixzSdkError({
        code: "APPEARANCE_PERSIST_FAILED",
        cause,
      });
    }
  }

  /**
   * Delivers the current snapshot while isolating every listener failure.
   */
  #notify(): void {
    for (const listener of this.#listeners) {
      try {
        listener(this.#appearance);
      } catch {
        /**
         * One consumer cannot prevent delivery to later consumers.
         */
      }
    }
  }
}

/**
 * Creates a tenant-aware Appearance manager without DOM side effects.
 *
 * @param options - Application identity and optional runtime adapters.
 * @returns Configured Appearance manager.
 * @throws MiaixzSdkError When configuration or persisted data is invalid.
 * @public
 */
export function createMiaixzAppearanceManager(
  options: Readonly<MiaixzAppearanceManagerOptions>,
): MiaixzAppearanceManager {
  return new MiaixzAppearanceManager(options);
}
