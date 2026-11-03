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
 * Measures action widths and partitions primary actions from the overflow menu.
 */

import { createRef, useMemo, useRef, type HTMLAttributes } from "react";

import {
  assertUniqueActionIds,
  partitionActions,
  useActionCapacity,
} from "../../shared/responsive/action-capacity.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { useMergedSlotProps } from "../../shared/slots.js";
import { Button, ButtonLink } from "../button/button.js";
import { Icon } from "@miaixz/icons";
import { ActionText } from "./action-text.js";
import type { ActionBarOwnerState, ActionBarProps, ActionDescriptor } from "./action.types.js";
import { MoreActions } from "./more-actions.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Internal attributes used to reserve measured space for auxiliary footer actions.
 */
type ActionBarRootAttributes = HTMLAttributes<HTMLDivElement> & {
  readonly "data-has-actions"?: "true" | "false";
};

/**
 * Properties accepted by the Primary Action renderer.
 */
interface PrimaryActionProps {
  /**
   * Supplies the resolved primary action.
   */
  readonly action: ActionDescriptor;
}

/**
 * Properties accepted by the Action Measurement renderer.
 */
interface ActionMeasurementProps {
  /**
   * Supplies the action whose intrinsic width is measured.
   */
  readonly action: ActionDescriptor;
}

/**
 * Renders an inert action measurement using the visible text-action recipe.
 *
 * @param properties - Action measurement properties.
 * @returns The inert action recipe.
 */
function ActionMeasurement(properties: ActionMeasurementProps) {
  const { action } = properties;
  return (
    <span className="miaixz-action-text">
      {action.icon !== undefined && (
        <span className="miaixz-button-icon">
          <Icon name={action.icon} size="control" />
        </span>
      )}
      <span className="miaixz-button-label">{action.label}</span>
    </span>
  );
}

/**
 * Renders the primary action using the locked solid mapping.
 *
 * @param properties - Primary action properties.
 * @returns The primary command or navigation control.
 */
function PrimaryAction(properties: PrimaryActionProps) {
  const { action } = properties;
  const icon = action.icon === undefined ? undefined : <Icon name={action.icon} size="control" />;
  const common = {
    size: action.size ?? "medium",
    tone: action.tone ?? "brand",
    variant: "solid" as const,
    ...(icon === undefined ? {} : { startIcon: icon }),
  };
  if (action.kind === "navigation") {
    return (
      <ButtonLink {...action.anchorProps} {...common} href={action.href}>
        {action.label}
      </ButtonLink>
    );
  }
  return (
    <Button
      {...action.buttonProps}
      {...common}
      {...(action.disabled === undefined ? {} : { disabled: action.disabled })}
      {...(action.loading === undefined ? {} : { loading: action.loading })}
      onClick={action.onAction}
    >
      {action.label}
    </Button>
  );
}

/**
 * Organizes one primary action and ordinary actions using measured available width.
 *
 * @param properties - Action bar properties.
 * @returns The responsive action bar.
 * @public
 */
function ActionBar(properties: ActionBarProps) {
  const { primary, actions, slotProps } = properties;
  const { t } = useMiaixzLocale();
  assertUniqueActionIds(primary === undefined ? actions : [...actions, primary]);
  const rootRef = useRef<HTMLDivElement>(null);
  const overflowMeasureRef = useRef<HTMLSpanElement>(null);
  const primaryMeasureRef = useRef<HTMLSpanElement>(null);
  const actionMeasureRefs = useMemo(
    () => actions.map(() => createRef<HTMLSpanElement>()),
    [actions],
  );
  const capacity = useActionCapacity({
    rootRef,
    actionMeasureRefs,
    primaryMeasureRef: primary === undefined ? undefined : primaryMeasureRef,
    overflowMeasureRef,
  });
  const partition = partitionActions(actions, capacity);
  const ownerState: ActionBarOwnerState = {
    hasPrimary: primary !== undefined,
    overflow: partition.overflow.length > 0,
  };
  const rootProps = useMergedSlotProps<
    ActionBarOwnerState,
    ActionBarRootAttributes,
    HTMLDivElement
  >({
    ownerState,
    defaultProps: { className: "miaixz-action-bar" },
    internalProps: { "data-has-actions": actions.length > 0 ? "true" : "false" },
    slotProps: slotProps?.root,
    internalRef: (element) => {
      rootRef.current = element;
    },
  });

  return (
    <div {...rootProps}>
      <span className="miaixz-action-measurements" aria-hidden="true" inert>
        {actions.map((action, index) => (
          <span key={action.id} ref={actionMeasureRefs[index]}>
            <ActionMeasurement action={action} />
          </span>
        ))}
        <span ref={overflowMeasureRef}>
          <ActionMeasurement
            action={{
              id: "more-actions-measurement",
              kind: "command",
              label: t("ui.action.more"),
              icon: "more-horizontal",
              onAction: () => undefined,
            }}
          />
        </span>
        {primary !== undefined && (
          <span
            ref={primaryMeasureRef}
            className="miaixz-button miaixz-control-medium"
            data-tone={primary.tone ?? "brand"}
            data-variant="solid"
          >
            <ActionMeasurement action={primary} />
          </span>
        )}
      </span>
      {partition.visible.map((action) => (
        <ActionText key={action.id} action={action} />
      ))}
      <MoreActions actions={partition.overflow} />
      {primary !== undefined && <PrimaryAction action={primary} />}
    </div>
  );
}

const ThemedActionBar = withMiaixzThemeComponent("ActionBar", ActionBar);
export { ThemedActionBar as ActionBar };
