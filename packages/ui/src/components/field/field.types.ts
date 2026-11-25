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
 * Defines the field public type contracts.
 */

import type { HTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";

export type { FieldControlProps } from "../../shared/field-context.js";

/**
 * Lists the fixed Field slot names.
 *
 * @public
 */
export type FieldSlot = "root" | "label" | "control" | "description" | "error";

/**
 * Describes the immutable state exposed to Field slots.
 */
export interface FieldOwnerState {
  /**
   * Reports whether the control is required.
   */
  readonly required: boolean;
  readonly layout: "vertical" | "horizontal";
  /**
   * Reports whether the control is invalid.
   */
  readonly invalid: boolean;
  /**
   * Reports whether the control is disabled.
   */
  readonly disabled: boolean;
}

/**
 * Describes Field root data attributes derived from owner state.
 */
export interface FieldRootSlotProps extends HTMLAttributes<HTMLDivElement> {
  "data-layout"?: "vertical" | "horizontal";
  /**
   * Mirrors the effective invalid state.
   */
  "data-invalid"?: boolean;
  /**
   * Mirrors the effective disabled state.
   */
  "data-disabled"?: boolean;
}

/**
 * Configures native properties for each Field slot.
 */
export interface FieldSlotProps {
  /**
   * Configures the root div.
   */
  root?: MiaixzSlotProps<FieldOwnerState, FieldRootSlotProps>;
  /**
   * Configures the native label.
   */
  label?: MiaixzSlotProps<FieldOwnerState, LabelHTMLAttributes<HTMLLabelElement>>;
  /**
   * Configures the control wrapper.
   */
  control?: MiaixzSlotProps<FieldOwnerState, HTMLAttributes<HTMLDivElement>>;
  /**
   * Configures the helper description.
   */
  description?: MiaixzSlotProps<FieldOwnerState, HTMLAttributes<HTMLDivElement>>;
  /**
   * Configures the error message.
   */
  error?: MiaixzSlotProps<FieldOwnerState, HTMLAttributes<HTMLDivElement>>;
}

/**
 * Configures an accessible form-control wrapper.
 *
 * @public
 */
export interface FieldProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "aria-invalid"
> {
  /**
   * Supplies the visible control label.
   */
  label: ReactNode;
  /**
   * Field geometry; defaults to vertical.
   */
  layout?: "vertical" | "horizontal";
  /**
   * Horizontal label width in pixels.
   */
  labelWidth?: number;
  /**
   * Supplies the single form control enhanced by the wrapper.
   */
  children: ReactNode;
  /**
   * Displays supporting guidance for the control.
   */
  helperText?: ReactNode;
  /**
   * Displays and announces the current validation failure.
   */
  errorText?: ReactNode;
  /**
   * Displays a localized optional-field marker.
   */
  optionalText?: ReactNode;
  /**
   * Marks the enhanced control as required.
   *
   * @defaultValue `false`
   */
  required?: boolean;
  /**
   * Applies the invalid state. Defaults to the presence of errorText.
   */
  invalid?: boolean;
  /**
   * Disables the single main control.
   */
  disabled?: boolean;
  /**
   * Overrides the generated control identifier.
   */
  controlId?: string;
  /**
   * Supplies native properties for the Field's fixed semantic nodes.
   */
  slotProps?: FieldSlotProps;
}
