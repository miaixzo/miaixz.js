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
 * Implements the steps UI component.
 */

import { forwardRef, useId } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { StepsOwnerState, StepsProps } from "./steps.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Renders a workflow whose visual dimensions never change its ol/li semantics. @public
 */
export const Steps = withMiaixzThemeComponent(
  "Steps",
  forwardRef<HTMLOListElement, StepsProps>(function Steps(
    {
      label,
      disabled: allDisabled = false,
      items,
      onStepChange,
      orientation = "horizontal",
      surface = "plain",
      density = "standard",
      connector = true,
      slotProps,
      ...props
    },
    ref,
  ) {
    const prefix = useId();
    const ids = new Set<string>();
    for (const item of items) {
      if (ids.has(item.id)) {
        throw new MiaixzUiError({
          code: "UI_STEPS_DUPLICATE_ID",
          details: { id: item.id },
        });
      }
      ids.add(item.id);
    }
    const interactive = onStepChange !== undefined;
    const rootState: StepsOwnerState = {
      orientation,
      surface,
      density,
      connector,
      status: undefined,
      interactive,
      disabled: allDisabled,
    };
    return (
      <ol
        {...mergeMiaixzSlotProps({
          ownerState: rootState,
          defaultProps: { className: "miaixz-steps" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            "aria-label": label,
            "data-orientation": orientation,
            "data-surface": surface,
            "data-density": density,
            ...(connector ? { "data-connector": true } : {}),
          },
          ownedProps: [
            "aria-label",
            "data-orientation",
            "data-surface",
            "data-density",
            "data-connector",
          ],
        })}
      >
        {items.map((item, index) => {
          const status = item.status ?? "pending";
          const disabled = allDisabled || item.disabled === true || status === "disabled";
          const labelId = `${prefix}-${index}-label`;
          const descriptionId =
            item.description != null ? `${prefix}-${index}-description` : undefined;
          const ownerState: StepsOwnerState = {
            orientation,
            surface,
            density,
            connector,
            status,
            interactive,
            disabled,
          };
          const content = (
            <>
              <span
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-steps-icon" },
                  slotProps: slotProps?.icon,
                })}
              >
                {item.marker ?? index + 1}
              </span>
              <span
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-steps-label" },
                  slotProps: slotProps?.label,
                  internalProps: { id: labelId },
                  ownedProps: ["id"],
                })}
              >
                {item.label}
              </span>
              {item.description !== undefined && (
                <div
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-steps-description" },
                    slotProps: slotProps?.description,
                    internalProps: { id: descriptionId },
                    ownedProps: ["id"],
                  })}
                >
                  {item.description}
                </div>
              )}
            </>
          );
          return (
            <li
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-steps-item" },
                slotProps: slotProps?.item,
                internalProps: {
                  "data-status": status,
                  ...(status === "current" ? { "aria-current": "step" as const } : {}),
                  ...(disabled ? { "aria-disabled": true } : {}),
                },
                ownedProps: ["aria-current", "aria-disabled"],
              })}
              key={item.id}
            >
              {interactive ? (
                <button
                  className="miaixz-steps-item-content"
                  disabled={disabled}
                  aria-current={status === "current" ? "step" : undefined}
                  aria-labelledby={labelId}
                  aria-describedby={descriptionId}
                  onClick={() => onStepChange(item, index)}
                  type="button"
                >
                  {content}
                </button>
              ) : (
                <div className="miaixz-steps-item-content">{content}</div>
              )}
              {connector && index < items.length - 1 && (
                <span
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-steps-connector" },
                    slotProps: slotProps?.connector,
                    internalProps: { "aria-hidden": true },
                    ownedProps: ["aria-hidden"],
                  })}
                />
              )}
            </li>
          );
        })}
      </ol>
    );
  }),
);
