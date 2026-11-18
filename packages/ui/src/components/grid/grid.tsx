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
 * Implements the grid UI component.
 */

import { forwardRef } from "react";

import { classNames } from "../../shared/class-names.js";
import type { GridProps } from "./grid.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Creates a responsive grid with configurable column sizing. @public
 */
export const Grid = withMiaixzThemeComponent(
  "Grid",
  forwardRef<HTMLDivElement, GridProps>(function Grid(
    { columns = "auto", minItemWidth = "standard", fillRow = false, className, ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        data-columns={columns}
        data-fill-row={columns === "auto" && fillRow ? true : undefined}
        className={classNames(
          "miaixz-grid",
          minItemWidth === "wide" && "miaixz-grid-wide",
          className,
        )}
      />
    );
  }),
);
