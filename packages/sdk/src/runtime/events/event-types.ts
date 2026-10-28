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
 * Defines SDK event payloads and cross-context validation contracts.
 */

import { VERSION } from "../../version.js";

import type { MiaixzLocale } from "../../i18n/i18n.js";
import type { MiaixzAppearancePayload } from "../../display/appearance.types.js";
import type { MiaixzRuntimeContext } from "../../access/context/context.types.js";
import type { MiaixzSdkConfig } from "../config/config.types.js";

export type {
  MiaixzEventBusPort,
  MiaixzEventEmitOptions,
  MiaixzEventListener,
  MiaixzEventName,
} from "./event-port.js";

/**
 * Validates an untrusted event payload before it crosses a browser-context boundary.
 */
export type MiaixzEventValidator = (payload: unknown) => boolean;

/**
 * Describes the only session state that may cross an SDK event channel.
 */
export interface MiaixzSessionStatusEvent {
  /**
   * Reports whether credentials exist without exposing a session or token.
   */
  readonly status: "authenticated" | "anonymous";
}

/**
 * Describes a locale change shared between same-origin application instances.
 */
export interface MiaixzLocaleChangedEvent {
  /**
   * Contains the canonical or otherwise valid BCP 47 locale to activate.
   */
  readonly locale: MiaixzLocale;
}

/**
 * Maps built-in SDK event names to their payload types.
 */
export interface MiaixzSdkEventMap {
  /**
   * Invalidates local permission views without broadcasting grants or credentials.
   */
  readonly "grants:changed": Readonly<{ revision: number }>;
  /**
   * Contains a non-sensitive session invalidation signal.
   */
  readonly "session:changed": Readonly<MiaixzSessionStatusEvent>;
  /**
   * Contains the runtime-context snapshot after it changes.
   */
  readonly "context:changed": Readonly<MiaixzRuntimeContext>;
  /**
   * Contains the versioned appearance snapshot after it changes.
   */
  readonly "appearance:changed": Readonly<MiaixzAppearancePayload>;
  /**
   * Contains the active locale after it changes.
   */
  readonly "locale:changed": Readonly<MiaixzLocaleChangedEvent>;
  /**
   * Contains the SDK configuration snapshot after it changes.
   */
  readonly "config:changed": Readonly<MiaixzSdkConfig>;
}

/**
 * Configures local and optional same-origin cross-tab event delivery.
 */
export interface MiaixzEventBusOptions {
  /**
   * Selects a validated BroadcastChannel name, or disables cross-tab delivery.
   */
  readonly channelName?: string | false;
  /**
   * Supplies runtime validators for application-defined event names.
   */
  readonly validators?: Readonly<Record<string, MiaixzEventValidator>>;
  /**
   * Creates a BroadcastChannel for tests or compatible custom browser runtimes.
   */
  readonly broadcastChannelFactory?: (name: string) => BroadcastChannel;
}

/**
 * Defines the only envelope accepted over a Miaixz BroadcastChannel.
 */
export interface MiaixzEventEnvelope {
  /**
   * Identifies the frozen event-envelope schema.
   */
  readonly version: typeof VERSION;
  /**
   * Uniquely identifies one broadcast operation for deduplication.
   */
  readonly eventId: string;
  /**
   * Identifies the event-bus instance that originated the message.
   */
  readonly sourceId: string;
  /**
   * Names the typed event represented by the payload.
   */
  readonly type: string;
  /**
   * Contains untrusted data that must pass the registered runtime validator.
   */
  readonly payload: unknown;
}
