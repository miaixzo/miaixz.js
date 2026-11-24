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
 * Coordinates the primary and overflow actions belonging to a data row.
 */

import { type HTMLAttributes } from "react";

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { assertUniqueActionIds } from "../../shared/responsive/action-capacity.js";
import { useMiaixzCompactActions } from "../../shared/responsive/compact-actions.js";
import { useMergedSlotProps } from "../../shared/slots.js";
import { ActionText } from "./action-text.js";
import type { ActionDescriptor, RowActionsOwnerState, RowActionsProps } from "./action.types.js";
import { MoreActions, MoreActionsView } from "./more-actions.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Presents row actions with responsive, fixed-menu, or wrapping placement.
 *
 * @param properties - Row action properties.
 * @returns The responsive row action group.
 * @public
 */
function RowActions(properties: RowActionsProps) {
  const { overflow: placement, overflowLabel, maxVisible = 2, slotProps } = properties;
  const actions = properties.actions.filter(
    (action) =>
      !action.hidden &&
      (placement === undefined ||
        !(action.kind === "navigation" ? action.anchorProps?.hidden : action.buttonProps?.hidden)),
  );
  const { t } = useMiaixzLocale();
  assertUniqueActionIds(actions);
  const compact = useMiaixzCompactActions(placement === undefined);
  let visible: readonly ActionDescriptor[];
  if (placement === "wrap" || actions.length === 1) {
    visible = actions;
  } else if (placement === "menu") {
    visible = actions.slice(0, maxVisible);
  } else {
    visible = compact ? [] : actions.filter((action) => action.tone !== "danger").slice(0, 2);
  }
  const visibleIds = new Set(visible.map((action) => action.id));
  const overflow = actions.filter((action) => !visibleIds.has(action.id));
  const menuLabel = overflowLabel ?? (compact ? t("ui.action.actions") : undefined);
  const ownerState: RowActionsOwnerState = { overflow: overflow.length > 0 };
  const rootProps = useMergedSlotProps<
    RowActionsOwnerState,
    HTMLAttributes<HTMLDivElement> & { "data-overflow"?: RowActionsProps["overflow"] },
    HTMLDivElement
  >({
    ownerState,
    defaultProps: { className: "miaixz-row-actions" },
    ...(placement === undefined ? {} : { internalProps: { "data-overflow": placement } }),
    slotProps: slotProps?.root,
  });

  return (
    <div {...rootProps}>
      {visible.map((action) => (
        <ActionText key={action.id} action={action} />
      ))}
      {placement === "menu" && menuLabel === undefined ? (
        <MoreActions actions={overflow} />
      ) : (
        <MoreActionsView
          actions={overflow}
          triggerSize={placement === undefined ? "medium" : "small"}
          {...(menuLabel === undefined ? {} : { label: menuLabel })}
        />
      )}
    </div>
  );
}

const ThemedRowActions = withMiaixzThemeComponent("RowActions", RowActions);
export { ThemedRowActions as RowActions };
