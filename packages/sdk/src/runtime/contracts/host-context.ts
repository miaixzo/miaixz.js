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
 * Defines the host capabilities available to integrated modules.
 */

import { VERSION } from "../../version.js";

import type { MiaixzMessageCatalog } from "../../i18n/i18n.js";

/**
 * Describes a navigation request issued by a remote module through its host bridge.
 *
 * @public
 */
export interface MiaixzNavigationRequest {
  /**
   * Same-site absolute path requested by the module.
   */
  readonly path: string;

  /**
   * Whether the host should replace the active history entry.
   */
  readonly replace?: boolean;

  /**
   * Optional structured-clone-compatible navigation state.
   */
  readonly state?: unknown;
}

/**
 * Defines the capabilities a host exposes to an integrated or iframe module.
 *
 * This task freezes the public shape only; runtime implementations are supplied by Host Bridge
 * tasks and never expose authentication credentials.
 *
 * @typeParam Context - Caller-defined context accepted by the injected parser.
 * @public
 */
export interface MiaixzHostBridge<Context = unknown> {
  /**
   * Micro-frontend protocol version implemented by the bridge.
   */
  readonly protocolVersion: typeof VERSION;

  /**
   * Reads the current non-sensitive host runtime context.
   *
   * @returns Immutable runtime context from the host.
   */
  getContext(): Promise<Readonly<Context>>;

  /**
   * Requests same-site navigation from the host.
   *
   * @param request - Validated navigation request.
   * @returns Promise resolved after the host handles navigation.
   */
  navigate(request: Readonly<MiaixzNavigationRequest>): Promise<void>;

  /**
   * Checks whether all requested permissions are available.
   *
   * @param permissions - Permission names to evaluate.
   * @returns Whether every requested permission is available.
   */
  hasPermissions(permissions: readonly string[]): Promise<boolean>;

  /**
   * Registers a module-owned internationalization catalog with the host.
   *
   * @param namespace - Module message namespace.
   * @param catalog - Localized messages owned by the module.
   * @returns Promise resolved after registration.
   */
  registerMessages(namespace: string, catalog: MiaixzMessageCatalog): Promise<void>;

  /**
   * Emits one module-scoped event through the host.
   *
   * @typeParam T - Event payload type.
   * @param type - Module-scoped event name.
   * @param payload - Structured-clone-compatible event payload.
   * @returns Promise resolved after event delivery.
   */
  emit<T = unknown>(type: string, payload: T): Promise<void>;

  /**
   * Subscribes to one module-scoped host event.
   *
   * @typeParam T - Event payload type.
   * @param type - Module-scoped event name.
   * @param listener - Callback that receives event payloads.
   * @returns Asynchronous unsubscribe function.
   */
  subscribe<T = unknown>(
    type: string,
    listener: (payload: T) => void,
  ): Promise<() => Promise<void>>;

  /**
   * Releases resources and pending work owned by the bridge.
   */
  dispose(): void;
}

/**
 * Supplies the optional capabilities exposed by one Miaixz host.
 *
 * @typeParam Context - Caller-defined context supplied by the host.
 * @public
 */
export interface MiaixzHostAdapter<Context = unknown> {
  /**
   * Reads the current non-sensitive host runtime context when available.
   */
  readonly getContext?: MiaixzHostBridge<Context>["getContext"];

  /**
   * Handles validated same-site navigation requests when available.
   */
  readonly navigate?: MiaixzHostBridge<Context>["navigate"];

  /**
   * Evaluates validated module permissions when available.
   */
  readonly hasPermissions?: MiaixzHostBridge<Context>["hasPermissions"];

  /**
   * Registers module-owned internationalization resources when available.
   */
  readonly registerMessages?: MiaixzHostBridge<Context>["registerMessages"];

  /**
   * Emits module-scoped events when available.
   */
  readonly emit?: MiaixzHostBridge<Context>["emit"];

  /**
   * Subscribes to module-scoped events when available.
   */
  readonly subscribe?: MiaixzHostBridge<Context>["subscribe"];
}

/**
 * Configures a same-runtime bridge for one identified module.
 *
 * @typeParam Context - Caller-defined context validated before it is exposed.
 * @public
 */
export interface MiaixzDirectHostBridgeOptions<Context = unknown> {
  /**
   * Identifies the module allowed to use the bridge.
   */
  readonly moduleId: string;

  /**
   * Supplies the host capabilities exposed to the module.
   */
  readonly adapter: MiaixzHostAdapter<Context>;

  /**
   * Selects and validates context fields that may be exposed to the module.
   * Context capability is unavailable when the parser is absent.
   */
  readonly parseContext?: (value: unknown) => Readonly<Context>;
}
