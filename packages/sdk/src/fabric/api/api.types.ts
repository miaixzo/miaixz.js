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
 * Represents the logical data status defined by the Bus audit model.
 *
 * @public
 */
export type MiaixzLogicalStatus = -1 | 0 | 1;

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
 * Describes the logical status and audit metadata shared by Bus entities.
 *
 * @public
 */
export interface MiaixzAudit extends MiaixzEntity {
  /**
   * Logical data status: deleted, inactive, or active.
   */
  status: MiaixzLogicalStatus;

  /**
   * Identifier of the user who created the entity.
   */
  creator?: MiaixzIdentifier;

  /**
   * Entity creation time as Unix epoch milliseconds.
   */
  created: MiaixzTimestamp;

  /**
   * Identifier of the user who last modified the entity.
   */
  modifier?: MiaixzIdentifier;

  /**
   * Entity modification time as Unix epoch milliseconds.
   */
  modified: MiaixzTimestamp;
}

/**
 * Describes the standard envelope returned by Miaixz APIs.
 *
 * @typeParam T - Type of the successful response payload.
 * @public
 */
export interface MiaixzApiEnvelope<T> {
  /**
   * Result code, where zero represents a successful response.
   */
  readonly code: string;

  /**
   * Human-readable result message supplied by the API.
   */
  readonly desc: string;

  /**
   * Payload returned by the API.
   */
  readonly data: T;
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
