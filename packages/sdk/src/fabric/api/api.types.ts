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
 * Identifies a Miaixz domain resource.
 *
 * @public
 */
export type MiaixzIdentifier = string;

/**
 * Represents a Unix epoch timestamp in milliseconds.
 *
 * @public
 */
export type MiaixzTimestamp = number;

/**
 * Describes the identity shared by Miaixz domain entities.
 *
 * @public
 */
export interface MiaixzEntity {
  /**
   * Unique identifier of the entity.
   */
  id: MiaixzIdentifier;
}

/**
 * Describes normalized information about an API failure.
 *
 * @public
 */
export interface MiaixzApiProblem {
  /**
   * Optional machine-readable error code.
   */
  code?: string;

  /**
   * Human-readable error message.
   */
  message: string;

  /**
   * Optional request identifier used for diagnostics.
   */
  requestId?: string;

  /**
   * Optional provider-specific error details.
   */
  details?: unknown;
}
