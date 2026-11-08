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
 * Defines module mount resources and lifecycle cleanup responsibilities.
 */

import type { MiaixzHostBridge } from "./host-context.js";
import type { MiaixzModuleManifest } from "./module-manifest.js";

/**
 * Provides the host-owned resources required to mount an integrated module.
 *
 * @typeParam Context - Caller-defined context exposed through the supplied bridge.
 * @public
 */
export interface MiaixzModuleMountContext<Context = unknown> {
  /**
   * DOM container owned by the host application.
   */
  readonly container: HTMLElement;

  /**
   * Capability-limited bridge supplied by the host.
   */
  readonly bridge: MiaixzHostBridge<Context>;

  /**
   * Validated immutable manifest associated with the module.
   */
  readonly manifest: Readonly<MiaixzModuleManifest>;
}

/**
 * Represents the resources returned by a mounted integrated module.
 *
 * @public
 */
export interface MiaixzModuleHandle {
  /**
   * Releases every resource created by the mounted module.
   *
   * @returns Nothing, or a promise resolved after asynchronous cleanup.
   */
  unmount(): void | Promise<void>;
}

/**
 * Defines the only lifecycle entry exposed by an integrated module.
 *
 * @typeParam Context - Context validated by the host bridge provided at mount.
 * @public
 */
export interface MiaixzIntegratedModule<Context = unknown> {
  /**
   * Mounts the module into its host-owned container.
   *
   * @param context - Validated host resources supplied to the module.
   * @returns Handle used by the host to unmount the module.
   */
  mount(
    context: MiaixzModuleMountContext<Context>,
  ): MiaixzModuleHandle | Promise<MiaixzModuleHandle>;
}
