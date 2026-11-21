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
import type { RowActionsOwnerState, RowActionsProps } from "./action.types.js";
import { MoreActionsView } from "./more-actions.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Keeps row actions readable using the shared measured-capacity algorithm.
 *
 * @param properties - Row action properties.
 * @returns The responsive row action group.
 * @public
 */
function RowActions(properties: RowActionsProps) {
  const { overflowLabel, slotProps } = properties;
  const actions = properties.actions.filter((action) => !action.hidden);
  const { t } = useMiaixzLocale();
  assertUniqueActionIds(actions);
  const compact = useMiaixzCompactActions();
  const safeActions = actions.filter((action) => action.tone !== "danger");
  const visible = actions.length === 1 ? actions : compact ? [] : safeActions.slice(0, 2);
  const visibleIds = new Set(visible.map((action) => action.id));
  const overflow = actions.filter((action) => !visibleIds.has(action.id));
  const ownerState: RowActionsOwnerState = { overflow: overflow.length > 0 };
  const rootProps = useMergedSlotProps<
    RowActionsOwnerState,
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >({
    ownerState,
    defaultProps: { className: "miaixz-row-actions" },
    slotProps: slotProps?.root,
  });

  return (
    <div {...rootProps}>
      {visible.map((action) => (
        <ActionText key={action.id} action={action} />
      ))}
      <MoreActionsView
        actions={overflow}
        triggerSize="medium"
        {...(overflowLabel === undefined
          ? compact
            ? { label: t("ui.action.actions") }
            : {}
          : { label: overflowLabel })}
      />
    </div>
  );
}

const ThemedRowActions = withMiaixzThemeComponent("RowActions", RowActions);
export { ThemedRowActions as RowActions };
