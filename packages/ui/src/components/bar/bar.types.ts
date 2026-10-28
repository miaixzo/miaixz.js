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
 * Defines the bar public type contracts.
 */

import type { HTMLAttributes } from "react";

/**
 * Native root attributes that cannot override progress semantics owned by Bar.
 */
type BarNativeProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  | "aria-hidden"
  | "aria-label"
  | "aria-labelledby"
  | "aria-valuemax"
  | "aria-valuemin"
  | "aria-valuenow"
  | "aria-valuetext"
  | "children"
  | "role"
>;

/**
 * Requires an accessible name for informative bars and forbids it for decorative bars.
 */
type BarAccessibleName =
  | {
      /**
       * Marks the bar as decorative and hidden from assistive technology.
       */
      readonly decorative: true;
      /**
       * Prevents decorative bars from exposing a conflicting accessible label.
       */
      readonly label?: never;
    }
  | {
      /**
       * Keeps the bar informative when omitted or false.
       */
      readonly decorative?: false;
      /**
       * Supplies the accessible name required by an informative bar.
       */
      readonly label: string;
    };

/**
 * Couples a determinate progress value with its maximum or omits both values.
 */
type BarProgress =
  | {
      /**
       * Omits determinate progress from an indeterminate bar.
       */
      readonly value?: never;
      /**
       * Omits a maximum when no determinate progress value exists.
       */
      readonly max?: never;
    }
  | {
      /**
       * Current determinate progress value.
       */
      readonly value: number;
      /**
       * Maximum determinate progress value.
       */
      readonly max: number;
    };

/**
 * Configures a visible active bar with its accessibility and progress state.
 */
type ActiveBarProps = BarNativeProps &
  BarAccessibleName &
  BarProgress & {
    /**
     * Shows the fixed page-level loading bar.
     */
    readonly active: true;
  };

/**
 * Configures an inactive bar and forbids inaccessible hidden state values.
 */
type InactiveBarProps = BarNativeProps & {
  /**
   * Finishes a previously active bar with an exit animation; an initially inactive bar stays hidden.
   */
  readonly active: false;
  /**
   * Prevents decorative state from being supplied while inactive.
   */
  readonly decorative?: never;
  /**
   * Prevents an inaccessible unused label while inactive.
   */
  readonly label?: never;
  /**
   * Prevents an unused progress value while inactive.
   */
  readonly value?: never;
  /**
   * Prevents an unused progress maximum while inactive.
   */
  readonly max?: never;
};

/**
 * Configures fixed page-level loading progress. @public
 */
export type BarProps = ActiveBarProps | InactiveBarProps;
