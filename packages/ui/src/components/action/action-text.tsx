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
 * Renders labeled actions with shared icon, priority, and visibility presentation.
 */

import { forwardRef } from "react";

import { Icon } from "@miaixz/icons";
import { ActionTarget } from "./action-target.js";
import type { ActionTextProps } from "./action.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";
import { MiaixzUiError } from "../../errors/ui-error.js";

/**
 * Renders an always-labeled low-emphasis command or navigation action.
 *
 * @public
 */
export const ActionText = withMiaixzThemeComponent(
  "ActionText",
  forwardRef<HTMLButtonElement | HTMLAnchorElement, ActionTextProps>(function ActionText(
    { action, labelVisibility = "always", priority = "default", slotProps },
    ref,
  ) {
    if (action.hidden) return null;
    if (labelVisibility !== "always" && action.icon === undefined) {
      throw new MiaixzUiError({
        code: "UI_ACTION_LABEL_VISIBILITY_REQUIRES_ICON",
        details: { id: action.id, labelVisibility },
      });
    }
    const startIcon = action.icon === undefined ? undefined : <Icon name={action.icon} size={12} />;
    return (
      <ActionTarget
        ref={ref}
        action={action}
        className="miaixz-action-text"
        rootAttributes={{
          "data-label-visibility": labelVisibility,
          "data-priority": priority,
        }}
        variant={priority === "primary" ? "solid" : "plain"}
        {...(slotProps === undefined ? {} : { slotProps })}
        {...(startIcon === undefined ? {} : { startIcon })}
      >
        {action.label}
      </ActionTarget>
    );
  }),
);
