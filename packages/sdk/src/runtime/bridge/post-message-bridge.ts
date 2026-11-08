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
 * Exports host and child factories for the validated iframe postMessage bridge.
 */

import type { MiaixzHostBridge } from "../contracts/host-context.js";
import type {
  MiaixzPostMessageChildOptions,
  MiaixzPostMessageHost,
  MiaixzPostMessageHostOptions,
} from "../contracts/post-message.js";
import { PostMessageChildBridge } from "./post-message-child.js";
import { PostMessageHost } from "./post-message-host.js";

/**
 * Creates the Host side of a validated iframe postMessage Bridge.
 *
 * @typeParam Context - Caller-defined context selected by the Host parser.
 * @param options - Manifest, target, origin, Adapter, and timeout configuration.
 * @returns Host lifecycle whose ready Promise tracks the handshake.
 * @throws MiaixzSdkError When construction parameters or browser capabilities are invalid.
 * @public
 */
export function createMiaixzPostMessageHost<Context = unknown>(
  options: MiaixzPostMessageHostOptions<Context>,
): MiaixzPostMessageHost {
  return new PostMessageHost<Context>(options);
}

/**
 * Creates and handshakes the Child side of an iframe postMessage Bridge.
 *
 * @typeParam Context - Caller-defined context independently validated by the Child.
 * @param options - Module identity, target, origin, and timeout configuration.
 * @returns Promise resolving to the connected Host Bridge.
 * @throws MiaixzSdkError When construction, handshake, or browser capabilities are invalid.
 * @public
 */
export function createMiaixzPostMessageChildBridge<Context = unknown>(
  options: MiaixzPostMessageChildOptions<Context>,
): Promise<MiaixzHostBridge<Context>> {
  const bridge = new PostMessageChildBridge<Context>(options);
  return bridge.connect().catch((error: unknown) => {
    bridge.dispose();
    throw error;
  });
}
