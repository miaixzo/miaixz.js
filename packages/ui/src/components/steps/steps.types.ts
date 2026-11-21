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
 * Defines the steps public type contracts.
 */

import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Step identity, display content, and completion or current-step presentation.
 */
export interface StepsItem {
  readonly id: string;
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly marker?: ReactNode;
  readonly disabled?: boolean;
  readonly status?: "pending" | "current" | "complete" | "error" | "disabled";
}
/**
 * Steps layout orientations permitted by the component contract.
 */
export type StepsOrientation = "horizontal" | "vertical";
/**
 * Steps surface treatments permitted by the component contract.
 */
export type StepsSurface = "plain" | "cards";
/**
 * Steps spacing densities permitted by the component contract.
 */
export type StepsDensity = "compact" | "standard" | "comfortable";
/**
 * Named Steps parts available for slot and style customization.
 */
export type StepsSlot = "root" | "item" | "connector" | "icon" | "label" | "description";
/**
 * Resolved Steps state exposed to theme and slot overrides.
 */
export interface StepsOwnerState {
  readonly orientation: StepsOrientation;
  readonly surface: StepsSurface;
  readonly density: StepsDensity;
  readonly connector: boolean;
  readonly status: NonNullable<StepsItem["status"]> | undefined;
  readonly interactive: boolean;
  readonly disabled: boolean;
}
/**
 * Attributes accepted by the Steps Root slot.
 */
export type StepsRootAttributes = HTMLAttributes<HTMLOListElement> &
  RefAttributes<HTMLOListElement> & {
    readonly "data-orientation"?: StepsOrientation;
    readonly "data-surface"?: StepsSurface;
    readonly "data-density"?: StepsDensity;
    readonly "data-connector"?: boolean;
  };
/**
 * Attributes accepted by the Steps Item slot.
 */
export type StepsItemAttributes = HTMLAttributes<HTMLLIElement> & {
  readonly "data-status"?: NonNullable<StepsItem["status"]>;
};
/**
 * Per-slot attributes and state-dependent override callbacks for Steps.
 */
export interface StepsSlotProps {
  readonly root?: MiaixzSlotProps<StepsOwnerState, StepsRootAttributes>;
  readonly item?: MiaixzSlotProps<StepsOwnerState, StepsItemAttributes>;
  readonly connector?: MiaixzSlotProps<StepsOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly icon?: MiaixzSlotProps<StepsOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly label?: MiaixzSlotProps<StepsOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly description?: MiaixzSlotProps<StepsOwnerState, HTMLAttributes<HTMLDivElement>>;
}
/**
 * Component-specific Steps properties composed with the permitted native attributes.
 */
export interface MiaixzStepsOwnProps {
  readonly disabled?: boolean;
  readonly label: string;
  readonly items: readonly StepsItem[];
  readonly onStepChange?: (item: StepsItem, index: number) => void;
  readonly orientation?: StepsOrientation;
  readonly surface?: StepsSurface;
  readonly density?: StepsDensity;
  readonly connector?: boolean;
  readonly slotProps?: StepsSlotProps;
}
/**
 * Configures a labeled workflow. @public
 */
export type StepsProps = MiaixzStepsOwnProps &
  Omit<HTMLAttributes<HTMLOListElement>, keyof MiaixzStepsOwnProps | "children">;
