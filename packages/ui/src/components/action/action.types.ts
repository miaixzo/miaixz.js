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
 * Defines the action public type contracts.
 */

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  MouseEvent,
  RefAttributes,
  ReactNode,
} from "react";

import type { IconName } from "@miaixz/icons";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { ButtonLinkSlotProps, ButtonSlotProps, ButtonTone } from "../button/button.types.js";

/**
 * Identity, display label, icon, and presentation shared by command and navigation actions.
 */
export interface ActionBase {
  readonly id: string;
  readonly label: string;
  readonly icon?: IconName;
  readonly tone?: "neutral" | "brand" | "danger";
  readonly size?: "small" | "medium" | "large";
  readonly description?: string;
}

/**
 * Button action invoking a callback; navigation-only href configuration is forbidden.
 */
export interface CommandAction extends ActionBase {
  readonly kind: "command";
  readonly onAction: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly buttonProps?: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "aria-busy" | "children" | "disabled" | "onClick" | "type"
  >;
  readonly href?: never;
}

/**
 * Anchor action targeting an href; command callbacks, loading, and disabled state are forbidden.
 */
export interface NavigationAction extends ActionBase {
  readonly kind: "navigation";
  readonly href: string;
  readonly anchorProps?: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href">;
  readonly onAction?: never;
  readonly disabled?: never;
  readonly loading?: never;
}

/**
 * Discriminated command or navigation action accepted by action renderers.
 */
export type ActionDescriptor = CommandAction | NavigationAction;

/**
 * Per-slot attributes and state-dependent override callbacks for Action Text.
 */
export interface ActionTextSlotProps {
  readonly root?: ButtonSlotProps["root"] | ButtonLinkSlotProps["root"];
  readonly label?: ButtonSlotProps["label"];
  readonly startIcon?: ButtonSlotProps["startIcon"];
}

/**
 * Properties accepted by the Action Text renderer.
 */
export interface ActionTextProps {
  readonly action: ActionDescriptor;
  readonly labelVisibility?: "always" | "responsive" | "hidden";
  readonly priority?: "default" | "primary";
  readonly slotProps?: ActionTextSlotProps;
}

/**
 * Resolved Icon Button state exposed to theme and slot overrides.
 */
export interface IconButtonOwnerState {
  readonly tone: ButtonTone;
  readonly size: "small" | "medium" | "large";
  readonly appearance: "control" | "glyph" | "favorite";
  readonly loading: boolean;
  readonly disabled: boolean;
  readonly pressed?: boolean;
}

/**
 * Per-slot attributes and state-dependent override callbacks for Icon Button.
 */
export interface IconButtonSlotProps {
  readonly root?: MiaixzSlotProps<IconButtonOwnerState, IconButtonRootAttributes>;
  readonly icon?: MiaixzSlotProps<IconButtonOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly loadingIndicator?: MiaixzSlotProps<
    IconButtonOwnerState,
    HTMLAttributes<HTMLSpanElement>
  >;
}

/**
 * Attributes accepted by the Icon Button Root slot.
 */
export interface IconButtonRootAttributes
  extends ButtonHTMLAttributes<HTMLButtonElement>, RefAttributes<HTMLButtonElement> {
  readonly "data-loading"?: boolean;
  readonly "data-miaixz-ripple"?: string;
  readonly "data-size"?: "small" | "medium" | "large";
  readonly "data-tone"?: "neutral" | "brand" | "danger";
  readonly "data-variant"?: "plain";
  readonly "data-appearance"?: "control" | "glyph" | "favorite";
}

/**
 * Properties accepted by the Icon Button renderer.
 */
export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children"
> {
  readonly label: string;
  readonly icon: IconName;
  readonly tone?: "neutral" | "brand" | "danger";
  readonly size?: "small" | "medium" | "large";
  readonly appearance?: "control" | "glyph" | "favorite";
  readonly loading?: boolean;
  readonly tooltip?: boolean;
  readonly pressed?: boolean;
  readonly slotProps?: IconButtonSlotProps;
}

/**
 * Properties accepted by the More Actions renderer.
 */
export interface MoreActionsProps {
  readonly actions: readonly ActionDescriptor[];
}

/**
 * Resolved Row Actions state exposed to theme and slot overrides.
 */
export interface RowActionsOwnerState {
  readonly overflow: boolean;
}

/**
 * Per-slot attributes and state-dependent override callbacks for Row Actions.
 */
export interface RowActionsSlotProps {
  readonly root?: MiaixzSlotProps<RowActionsOwnerState, HTMLAttributes<HTMLDivElement>>;
}

/**
 * Properties accepted by the Row Actions renderer.
 */
export interface RowActionsProps {
  readonly actions: readonly ActionDescriptor[];
  readonly overflowLabel?: string;
  readonly slotProps?: RowActionsSlotProps;
}

/**
 * Resolved Action Bar state exposed to theme and slot overrides.
 */
export interface ActionBarOwnerState {
  readonly hasPrimary: boolean;
  readonly overflow: boolean;
}

/**
 * Per-slot attributes and state-dependent override callbacks for Action Bar.
 */
export interface ActionBarSlotProps {
  readonly root?: MiaixzSlotProps<ActionBarOwnerState, HTMLAttributes<HTMLDivElement>>;
}

/**
 * Properties accepted by the Action Bar renderer.
 */
export interface ActionBarProps {
  readonly primary?: ActionDescriptor;
  readonly actions: readonly ActionDescriptor[];
  readonly slotProps?: ActionBarSlotProps;
}

/**
 * Cancel action configuration used alongside a form submission control.
 */
export interface FormCancelAction {
  readonly id: string;
  readonly label: string;
  readonly icon?: IconName;
  readonly disabled?: boolean;
  readonly onAction: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly buttonProps?: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "disabled" | "onClick" | "type"
  >;
}

/**
 * Submission label and presentation bound to the native form submit action.
 */
export interface FormSubmitAction {
  readonly id: string;
  readonly label: string;
  readonly icon?: IconName;
  readonly tone?: "brand" | "danger";
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly buttonProps?: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "aria-busy" | "children" | "disabled" | "onClick" | "type"
  >;
}

/**
 * Resolved Form Actions state exposed to theme and slot overrides.
 */
export interface FormActionsOwnerState {
  readonly fixed: boolean;
  readonly loading: boolean;
}

/**
 * Per-slot attributes and state-dependent override callbacks for Form Actions.
 */
export interface FormActionsSlotProps {
  readonly root?: MiaixzSlotProps<FormActionsOwnerState, FormActionsRootAttributes>;
  readonly cancel?: ButtonSlotProps;
  readonly submit?: ButtonSlotProps;
}

/**
 * Attributes accepted by the Form Actions Root slot.
 */
export interface FormActionsRootAttributes extends HTMLAttributes<HTMLDivElement> {
  readonly "data-fixed"?: string;
  readonly "data-submit-only"?: string;
}

/**
 * Properties accepted by the Form Actions renderer.
 */
export interface FormActionsProps {
  readonly cancel?: FormCancelAction;
  readonly submit?: FormSubmitAction | undefined;
  /**
   * Existing auxiliary command controls rendered before the native submit control.
   */
  readonly actions?: ReactNode;
  readonly fixed?: boolean;
  readonly slotProps?: FormActionsSlotProps;
}
