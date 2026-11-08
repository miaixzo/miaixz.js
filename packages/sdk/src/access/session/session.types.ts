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
 * Defines session values, persistence adapters, refresh callbacks, and manager options.
 */

import type { MiaixzUserSummary } from "../../models/user.js";
import type { MiaixzTimestamp } from "../../fabric/api/api.types.js";
import type { MiaixzEventBusPort } from "../../runtime/events/event-port.js";
import type { MiaixzKeyValueStorage } from "../../runtime/storage/storage.js";

/**
 * Describes an authenticated session managed by the Miaixz SDK.
 *
 * @public
 */
export interface MiaixzSession {
  /**
   * Access token presented to protected services.
   */
  readonly accessToken: string;

  /**
   * Optional token used to renew the session.
   */
  readonly refreshToken?: string;

  /**
   * Optional authorization scheme associated with the access token.
   */
  readonly tokenType?: string;

  /**
   * Optional token expiry as Unix time in milliseconds.
   */
  readonly expired?: MiaixzTimestamp;

  /**
   * Optional summary of the authenticated user.
   */
  readonly user?: MiaixzUserSummary;
}

/**
 * Identifies the only cross-window session states exposed by the SDK.
 *
 * @public
 */
export type MiaixzSessionStatus = "authenticated" | "anonymous";

/**
 * Refreshes an expiring session.
 *
 * @public
 */
export type MiaixzSessionRefresher = (
  session: Readonly<MiaixzSession>,
) => MiaixzSession | undefined | Promise<MiaixzSession | undefined>;

/**
 * Marks a storage adapter whose use for Bearer credentials was explicitly acknowledged.
 *
 * Persisting access or refresh tokens in Web Storage increases exposure to script injection.
 * Prefer the default in-memory mode or an HttpOnly Cookie/BFF integration whenever possible.
 *
 * @public
 */
export interface MiaixzPersistentSessionStorage extends MiaixzKeyValueStorage {
  /**
   * Discriminator proving that the adapter was created by the explicit-risk factory.
   */
  readonly kind: "miaixz-persistent-session-storage";
}

/**
 * Configures a Miaixz session manager.
 *
 * @public
 */
export interface MiaixzSessionManagerOptions {
  /**
   * Explicitly acknowledged storage used to persist Bearer credentials.
   */
  readonly persistence?: MiaixzPersistentSessionStorage;

  /**
   * Optional callback used to refresh an expiring session.
   */
  readonly refresh?: MiaixzSessionRefresher;

  /**
   * Optional safety window in seconds before token expiry.
   */
  readonly expirationLeewaySeconds?: number;

  /**
   * Optional clock returning Unix time in milliseconds.
   */
  readonly now?: () => MiaixzTimestamp;

  /**
   * Optional event bus used to synchronize service instances.
   */
  readonly eventBus?: MiaixzEventBusPort<{
    readonly "session:changed": Readonly<{ status: MiaixzSessionStatus }>;
  }>;
}
