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
 * Defines the dropdown public type contracts.
 */

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";

import type { PopoverChangeReason, PopoverProps } from "../popover/popover.types.js";

/**
 * Dropdown semantic color tones permitted by the component contract.
 */
export type DropdownTone = "neutral" | "danger";

/**
 * Properties accepted by the Dropdown Button renderer.
 */
export type DropdownButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-checked" | "children" | "disabled" | "id" | "onClick" | "role" | "tabIndex" | "type"
>;

/**
 * Properties accepted by the Dropdown Anchor renderer.
 */
export type DropdownAnchorProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "aria-checked" | "children" | "href" | "id" | "role" | "tabIndex"
>;

/**
 * Common visible label, icon, and descriptive content of a dropdown entry.
 */
export interface DropdownPresentation {
  /**
   * Omits an unavailable item before validation, keyboard traversal and rendering.
   *
   * @defaultValue `false`
   */
  readonly hidden?: boolean;
  readonly id: string;
  readonly label: ReactNode;
  readonly textValue: string;
  readonly icon?: ReactNode;
  readonly description?: ReactNode;
  readonly tone?: DropdownTone;
}

/**
 * Dropdown button command with its callback and disabled state.
 */
export interface DropdownActionEntry extends DropdownPresentation {
  readonly kind: "action";
  readonly onAction: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly disabled?: boolean;
  readonly buttonProps?: DropdownButtonProps;
  readonly href?: never;
  readonly checked?: never;
  readonly items?: never;
}

/**
 * Dropdown anchor entry with a required navigation target.
 */
export interface DropdownLinkEntry extends DropdownPresentation {
  readonly kind: "link";
  readonly href: string;
  readonly anchorProps?: DropdownAnchorProps;
  readonly onAction?: never;
  readonly disabled?: never;
  readonly checked?: never;
  readonly items?: never;
}

/**
 * Independently checked dropdown entry and its change callback.
 */
export interface DropdownCheckboxEntry extends DropdownPresentation {
  readonly kind: "checkbox";
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean, event: MouseEvent<HTMLButtonElement>) => void;
  readonly disabled?: boolean;
  readonly buttonProps?: DropdownButtonProps;
  readonly href?: never;
  readonly onAction?: never;
  readonly items?: never;
}

/**
 * One labeled value in a mutually exclusive dropdown radio group.
 */
export interface DropdownRadioOption {
  readonly id: string;
  readonly value: string;
  readonly label: ReactNode;
  readonly textValue: string;
  readonly disabled?: boolean;
}

/**
 * Dropdown radio options with group selection and change handling.
 */
export interface DropdownRadioGroupEntry {
  readonly kind: "radioGroup";
  readonly id: string;
  readonly label: ReactNode;
  readonly value: string;
  readonly options: readonly DropdownRadioOption[];
  readonly onValueChange: (value: string, event: MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Non-interactive text heading displayed inside a dropdown menu.
 */
export interface DropdownLabelEntry {
  readonly kind: "label";
  readonly id: string;
  readonly label: ReactNode;
}

/**
 * Non-command identity content displayed in a dropdown menu.
 */
export interface DropdownIdentityEntry {
  readonly kind: "identity";
  readonly id: string;
  readonly avatar: ReactNode;
  readonly title: ReactNode;
  readonly meta?: ReactNode;
}

/**
 * Non-interactive separator between dropdown menu sections.
 */
export interface DropdownDividerEntry {
  readonly kind: "divider";
  readonly id: string;
}

/**
 * Visually and semantically groups related dropdown commands.
 */
export interface DropdownGroupEntry {
  readonly kind: "group";
  readonly id: string;
  readonly label?: string;
  readonly items: readonly DropdownSubmenuItem[];
}

/**
 * Entry shapes accepted inside a dropdown submenu.
 */
export type DropdownSubmenuItem =
  | DropdownActionEntry
  | DropdownLinkEntry
  | DropdownCheckboxEntry
  | DropdownRadioGroupEntry
  | DropdownLabelEntry
  | DropdownIdentityEntry
  | DropdownDividerEntry;

/**
 * Nested menu entry owning its child dropdown entries.
 */
export interface DropdownSubmenuEntry extends DropdownPresentation {
  readonly kind: "submenu";
  readonly items: readonly DropdownSubmenuItem[];
  readonly disabled?: boolean;
  readonly href?: never;
  readonly onAction?: never;
  readonly checked?: never;
}

/**
 * Discriminated union of all supported dropdown item kinds.
 */
export type DropdownEntry = DropdownSubmenuItem | DropdownSubmenuEntry | DropdownGroupEntry;

/**
 * Dropdown change notification reasons permitted by the component contract.
 */
export type DropdownChangeReason = PopoverChangeReason | "selection";

/**
 * Dropdown controlled or uncontrolled open-state alternatives permitted by the component contract.
 */
export type DropdownOpenState =
  | {
      readonly open: boolean;
      readonly defaultOpen?: never;
      readonly onOpenChange: (open: boolean, reason: DropdownChangeReason) => void;
    }
  | {
      readonly open?: never;
      readonly defaultOpen?: boolean;
      readonly onOpenChange?: (open: boolean, reason: DropdownChangeReason) => void;
    };

/**
 * Configures a disclosure-based menu generated only from stable entry data.
 *
 * @public
 */
export type DropdownProps = DropdownOpenState &
  Omit<PopoverProps, "children" | "onOpenChange" | "open" | "defaultOpen" | "popupRole"> & {
    readonly items: readonly DropdownEntry[];
    readonly label?: string;
    readonly surface?: "framed" | "plain";
    readonly density?: "compact" | "standard" | "comfortable";
    /**
     * Selects the visual treatment. `account` is a compatibility alias for `user-menu`.
     */
    readonly presentation?: "default" | "user-menu" | "account" | "action-menu";
    readonly closing?: boolean;
  };
