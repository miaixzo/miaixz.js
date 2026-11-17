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
 * Defines the grid public type contracts.
 */

import type { HTMLAttributes } from "react";

/**
 * Configures a responsive grid. @public
 */
export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Selects the column strategy. Fixed column modes collapse to one column on narrow viewports.
   */
  columns?: "auto" | "one" | "two" | "three";
  /**
   * Selects the width of automatic columns before any row expansion.
   */
  minItemWidth?: "standard" | "wide";
  /**
   * Lets items in automatic columns expand to fill each row, including the last row.
   * Defaults to false. Fixed column modes keep their specified column count.
   */
  fillRow?: boolean;
}
