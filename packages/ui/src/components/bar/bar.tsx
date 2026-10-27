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
 * Implements the bar UI component.
 */

import { forwardRef, useState, type CSSProperties } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { classNames } from "../../shared/class-names.js";
import type { BarProps } from "./bar.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * CSS custom properties used to position or size the Bar visual.
 */
interface BarStyle extends CSSProperties {
  readonly "--miaixz-bar-progress"?: number;
}

/**
 * Renders fixed page-level determinate or indeterminate loading progress. @public
 */
export const Bar = withMiaixzThemeComponent(
  "Bar",
  forwardRef<HTMLDivElement, BarProps>(function Bar(props, ref) {
    const {
      active,
      decorative = false,
      label,
      value,
      max,
      className,
      style,
      onAnimationEnd,
      ...nativeProps
    } = props;
    const [visible, setVisible] = useState(active);
    if (active && !visible) setVisible(true);
    if (!active && !visible) return null;
    const completing = !active;
    const hidden = decorative || completing;
    const determinate = value !== undefined;
    if (determinate && (!Number.isFinite(max) || max <= 0)) {
      throw new MiaixzUiError({
        code: "UI_PROGRESS_MAX_INVALID",
        details: { max },
      });
    }
    if (determinate && (!Number.isFinite(value) || value < 0 || value > max)) {
      throw new MiaixzUiError({
        code: "UI_PROGRESS_VALUE_INVALID",
        details: { max, value },
      });
    }
    const resolvedStyle: BarStyle = {
      ...style,
      ...(determinate ? { "--miaixz-bar-progress": value / max } : {}),
    };
    return (
      <div
        {...nativeProps}
        ref={ref}
        aria-hidden={hidden || undefined}
        aria-label={hidden ? undefined : label}
        aria-valuemin={hidden || !determinate ? undefined : 0}
        aria-valuemax={hidden || !determinate ? undefined : max}
        aria-valuenow={hidden || !determinate ? undefined : value}
        className={classNames("miaixz-bar", className)}
        data-state={completing ? "complete" : determinate ? "determinate" : "indeterminate"}
        onAnimationEnd={(event) => {
          onAnimationEnd?.(event);
          if (
            completing &&
            event.target === event.currentTarget &&
            event.animationName === "miaixz-bar-complete"
          ) {
            setVisible(false);
          }
        }}
        role={hidden ? undefined : "progressbar"}
        style={resolvedStyle}
      >
        <span aria-hidden="true" className="miaixz-bar-fill" />
      </div>
    );
  }),
);
