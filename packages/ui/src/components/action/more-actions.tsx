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
 * Renders action descriptors inside an accessible overflow dropdown.
 */

import { useId } from "react";

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { Dropdown } from "../dropdown/dropdown.js";
import { type DropdownEntry } from "../dropdown/dropdown.types.js";
import { Icon } from "@miaixz/icons";
import { IconButton } from "./icon-button.js";
import type { ActionDescriptor, IconButtonProps, MoreActionsProps } from "./action.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Properties accepted by the More Actions View renderer.
 */
interface MoreActionsViewProps extends MoreActionsProps {
  /**
   * Overrides the overflow trigger's accessible name.
   */
  readonly label?: string;
  /**
   * Matches the overflow trigger to the controls that surround it.
   */
  readonly triggerSize?: IconButtonProps["size"];
}

/**
 * Converts one action descriptor to a semantic dropdown entry.
 *
 * @param action - Resolved action contract.
 * @returns One navigation or command menu item.
 */
function createMenuEntry(action: ActionDescriptor): DropdownEntry {
  const presentation = {
    id: action.id,
    label: action.label,
    textValue: action.label,
    tone: action.tone === "danger" ? ("danger" as const) : ("neutral" as const),
    ...(action.description === undefined ? {} : { description: action.description }),
    ...(action.icon === undefined ? {} : { icon: <Icon name={action.icon} size="control" /> }),
  };
  if (action.kind === "navigation") {
    return {
      ...presentation,
      kind: "link",
      href: action.href,
      ...(action.anchorProps === undefined ? {} : { anchorProps: action.anchorProps }),
    };
  }
  return {
    ...presentation,
    kind: "action",
    disabled: action.disabled === true || action.loading === true,
    onAction: action.onAction,
    ...(action.buttonProps === undefined && action.loading !== true
      ? {}
      : {
          buttonProps: {
            ...action.buttonProps,
            ...(action.loading ? { "aria-busy": true } : {}),
          },
        }),
  };
}

/**
 * Renders low-frequency actions in one stable overflow menu.
 *
 * @param properties - Overflow actions and optional accessible label.
 * @returns The overflow menu, or nothing when no actions exist.
 * @internal
 */
export function MoreActionsView(properties: MoreActionsViewProps) {
  const { label: labelOverride, triggerSize = "small" } = properties;
  const actions = properties.actions.filter((action) => !action.hidden);
  const { t } = useMiaixzLocale();
  const dividerId = useId();
  if (actions.length === 0) return null;
  const regular = actions.filter((action) => action.tone !== "danger");
  const danger = actions.filter((action) => action.tone === "danger");
  const items: DropdownEntry[] = regular.map(createMenuEntry);
  if (regular.length > 0 && danger.length > 0) {
    items.push({ id: `${dividerId}-danger`, kind: "divider" });
  }
  items.push(...danger.map(createMenuEntry));
  const label = labelOverride ?? t("ui.action.more");

  return (
    <Dropdown
      density="compact"
      items={items}
      label={label}
      placement="bottom-end"
      presentation="action-menu"
      surface="plain"
      trigger={
        <IconButton
          appearance="glyph"
          icon="more-horizontal"
          label={label}
          size={triggerSize}
          tone="neutral"
          tooltip={false}
        />
      }
    />
  );
}

/**
 * Renders low-frequency actions using the localized default trigger name.
 *
 * @param properties - Ordered actions placed in the menu.
 * @returns The overflow menu, or nothing when no actions exist.
 * @public
 */
function MoreActions(properties: MoreActionsProps) {
  return <MoreActionsView {...properties} />;
}

const ThemedMoreActions = withMiaixzThemeComponent("MoreActions", MoreActions);
export { ThemedMoreActions as MoreActions };
