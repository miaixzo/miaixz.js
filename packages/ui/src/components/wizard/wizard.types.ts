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
 * Defines the controlled Wizard composition contract.
 */
import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { StepsItem } from "../steps/steps.types.js";

/**
 * A step whose current status is derived from the Wizard selection.
 */
export interface WizardItem extends Omit<StepsItem, "status"> {
  /**
   * Completion, error or availability state. The current state is derived from currentStep.
   */
  readonly status?: Exclude<NonNullable<StepsItem["status"]>, "current">;
}
/**
 * State exposed to Wizard theme and slot overrides.
 */
export interface WizardOwnerState {
  /**
   * Stable identity of the currently selected step.
   */
  readonly currentStep: string;
  /**
   * Whether navigation requests are disabled without changing progress state.
   */
  readonly disabled: boolean;
  /**
   * Navigation orientation derived from the actual container width.
   */
  readonly orientation: "horizontal" | "vertical";
}
/**
 * Fixed semantic regions of a Wizard.
 */
export type WizardSlot = "root" | "navigation" | "feedback" | "content" | "footer";
/**
 * Native attributes for each Wizard region.
 */
export type WizardSlotProps = {
  /**
   * Native attributes or a state-dependent override for the corresponding region.
   */
  readonly [Key in WizardSlot]?: MiaixzSlotProps<
    WizardOwnerState,
    HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>
  >;
};
/**
 * Controlled structure; validation and business actions remain with the caller.
 */
export interface WizardProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /**
   * Accessible name for the ordered step navigation.
   */
  readonly label: string;
  /**
   * Unique stable step identities and their display metadata.
   */
  readonly items: readonly WizardItem[];
  /**
   * Stable identity of the currently selected step.
   */
  readonly currentStep: string;
  /**
   * Requests a target identity. The caller validates and updates currentStep.
   * Omitting this callback renders noninteractive progress navigation.
   */
  readonly onStepChange?: ((stepId: string) => void) | undefined;
  /**
   * Disables navigation only; the caller also controls business inputs and actions.
   *
   * @defaultValue `false`
   */
  readonly disabled?: boolean;
  /**
   * Optional feedback rendered above the independently scrolling content.
   */
  readonly feedback?: ReactNode;
  /**
   * Optional actions rendered below the content. Use one footer owner per interface.
   */
  readonly footer?: ReactNode;
  /**
   * Public root, navigation, feedback, content and footer native attributes.
   */
  readonly slotProps?: WizardSlotProps;
}
/**
 * A lazily retained or unmounted panel associated with a stable step identity.
 */
export interface WizardPanelProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Identity of an item in the nearest Wizard. Unknown identities are rejected.
   */
  readonly stepId: string;
  /**
   * Retains previously visited content, hidden and inert, after leaving this panel.
   * Unvisited panels remain unmounted.
   *
   * @defaultValue `false`
   */
  readonly keepMounted?: boolean;
}
