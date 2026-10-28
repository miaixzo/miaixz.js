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
 * Defines the picker public type contracts.
 */

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

import type {
  ComboboxOwnerState,
  ComboboxProps,
  ComboboxSlotProps,
  MiaixzComboboxInputState,
  MiaixzOption,
  MiaixzOptionSource,
} from "../combobox/combobox.types.js";
import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Mutually exclusive controlled or uncontrolled picker value settings.
 */
export type PickerValueState<Value extends string = string> =
  | {
      readonly value: readonly MiaixzOption<Value>[];
      readonly defaultValue?: never;
      readonly onValueChange?: (value: readonly MiaixzOption<Value>[]) => void;
    }
  | {
      readonly value?: never;
      readonly defaultValue?: readonly MiaixzOption<Value>[];
      readonly onValueChange?: (value: readonly MiaixzOption<Value>[]) => void;
    };

/**
 * Removal action and disabled or read-only state passed to a selected-value renderer.
 */
export interface PickerRenderValueState<Value extends string = string> {
  readonly remove: (option: MiaixzOption<Value>) => void;
  readonly disabled: boolean;
  readonly readOnly: boolean;
}

/**
 * Per-slot attributes and state-dependent override callbacks for Picker.
 */
export interface PickerSlotProps extends ComboboxSlotProps {
  readonly values?: MiaixzSlotProps<ComboboxOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly value?: MiaixzSlotProps<ComboboxOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly valueLabel?: MiaixzSlotProps<ComboboxOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly remove?: MiaixzSlotProps<ComboboxOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly count?: MiaixzSlotProps<ComboboxOwnerState, HTMLAttributes<HTMLOutputElement>>;
}

/**
 * Component-specific Picker properties composed with the permitted native attributes.
 */
export interface MiaixzPickerOwnProps<Value extends string = string> extends Omit<
  ComboboxProps<Value>,
  "value" | "defaultValue" | "onValueChange" | "slotProps"
> {
  readonly selectionLimit?: number;
  readonly removeMessage?: string;
  readonly searchMessage?: string;
  readonly renderValue?: (
    selected: readonly MiaixzOption<Value>[],
    state: PickerRenderValueState<Value>,
  ) => ReactNode;
  readonly slotProps?: PickerSlotProps;
}

/**
 * Configures a searchable multiple-selection picker.
 */
export type LegacyPickerProps<Value extends string = string> = MiaixzOptionSource<Value> &
  PickerValueState<Value> &
  MiaixzComboboxInputState &
  Omit<
    MiaixzPickerOwnProps<Value>,
    keyof MiaixzOptionSource<Value> | keyof MiaixzComboboxInputState
  >;

/**
 * State passed to custom single-selection content.
 */
export interface PickerContentState<Value extends string = string> {
  readonly value: MiaixzOption<Value> | null;
  readonly onValueChange: (value: MiaixzOption<Value> | null) => void;
  readonly disabled: boolean;
  readonly readOnly: boolean;
}

/**
 * State passed to custom multiple-selection content.
 */
export interface PickerMultipleContentState<Value extends string = string> {
  readonly value: readonly MiaixzOption<Value>[];
  readonly onValueChange: (value: readonly MiaixzOption<Value>[]) => void;
  readonly disabled: boolean;
  readonly readOnly: boolean;
}

/**
 * Container and field configuration shared by explicitly configured pickers.
 */
export interface PickerSurfaceProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange" | "children"
> {
  readonly label: ReactNode;
  readonly placeholder?: string;
  readonly name?: string;
  readonly form?: string;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly invalid?: boolean;
  readonly required?: boolean;
  readonly size?: "small" | "medium" | "large";
  readonly presentation?: "popover" | "drawer" | "dialog" | "inline";
  readonly commitMode?: "immediate" | "confirm";
  readonly clearable?: boolean;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly drawerWidth?: import("../drawer/drawer.types.js").DrawerWidth;
  readonly placement?: import("../popover/popover.types.js").PopoverOwnerState["placement"];
  readonly loading?: boolean;
  readonly loadingMessage?: ReactNode;
  readonly errorMessage?: ReactNode;
  readonly onRetry?: () => void;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly clearLabel?: string;
}

/**
 * Single-value picker contract, independent of the selected content or container.
 */
export type PickerSingleProps<Value extends string = string> = PickerSurfaceProps & {
  readonly selectionMode: "single";
  readonly options?: readonly MiaixzOption<Value>[];
  readonly renderContent?: (state: PickerContentState<Value>) => ReactNode;
  readonly renderValue?: (value: MiaixzOption<Value> | null) => ReactNode;
} & (
    | {
        readonly value: MiaixzOption<Value> | null;
        readonly defaultValue?: never;
        readonly onValueChange?: (value: MiaixzOption<Value> | null) => void;
      }
    | {
        readonly value?: never;
        readonly defaultValue?: MiaixzOption<Value> | null;
        readonly onValueChange?: (value: MiaixzOption<Value> | null) => void;
      }
  );

/**
 * Explicit multiple-selection contract with custom content and container support.
 */
export type PickerConfiguredMultipleProps<Value extends string = string> = PickerSurfaceProps &
  PickerValueState<Value> & {
    readonly selectionMode: "multiple";
    readonly options?: readonly MiaixzOption<Value>[];
    readonly selectionLimit?: number;
    readonly renderContent?: (state: PickerMultipleContentState<Value>) => ReactNode;
    readonly renderValue?: (value: readonly MiaixzOption<Value>[]) => ReactNode;
  };

/**
 * Backward-compatible picker contracts selected by the explicit selectionMode discriminator.
 */
export type PickerProps<Value extends string = string> =
  | (LegacyPickerProps<Value> & { readonly selectionMode?: never })
  | PickerSingleProps<Value>
  | PickerConfiguredMultipleProps<Value>;
