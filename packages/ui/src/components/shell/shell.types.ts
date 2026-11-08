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
 * Defines the shell public type contracts.
 */

import type { HTMLAttributes, ReactNode, Ref, RefAttributes } from "react";
import type { MiaixzShellLayout } from "@miaixz/sdk/appearance";
import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Shell sidebar overflow policies permitted by the component contract.
 */
export type ShellSidebarOverflow = "auto" | "contained";
/**
 * Shell permitted main-region element names permitted by the component contract.
 */
export type ShellMainComponent = "main" | "div";
/**
 * Navigation configuration for the shell's desktop presentation.
 */
export type ShellDesktopNavigation =
  { readonly mode: "sidebar" } | { readonly mode: "rail"; readonly expanded: boolean };
/**
 * Navigation configuration for the shell's mobile presentation.
 */
export type ShellMobileNavigation =
  { readonly mode: "none" } | { readonly mode: "bottom"; readonly content: ReactNode };
/**
 * Named Shell parts available for slot and style customization.
 */
export type ShellSlot =
  | "root"
  | "brand"
  | "header"
  | "sidebar"
  | "primaryNavigation"
  | "secondaryNavigation"
  | "contextNavigation"
  | "main"
  | "mobileNavigation";
/**
 * Resolved Shell state exposed to theme and slot overrides.
 */
export interface ShellOwnerState {
  readonly desktopNavigation: ShellDesktopNavigation;
  readonly mobileNavigation: ShellMobileNavigation;
  readonly headerBehavior: "fixed" | "scroll";
  readonly sidebarOverflow: ShellSidebarOverflow;
  readonly presentation: "default" | "workspace";
  readonly layout: MiaixzShellLayout;
}
/**
 * Attributes accepted by the Shell Root slot.
 */
export type ShellRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & {
    readonly "data-desktop-navigation"?: "sidebar" | "rail";
    readonly "data-navigation-expanded"?: boolean;
    readonly "data-header-behavior"?: "fixed" | "scroll";
    readonly "data-presentation"?: "default" | "workspace";
    readonly "data-layout"?: MiaixzShellLayout;
  };
/**
 * Attributes accepted by the Shell Sidebar slot.
 */
export type ShellSidebarAttributes = HTMLAttributes<HTMLElement> & {
  readonly "data-overflow"?: ShellSidebarOverflow;
};
/**
 * Per-slot attributes and state-dependent override callbacks for Shell.
 */
export interface ShellSlotProps {
  readonly root?: MiaixzSlotProps<ShellOwnerState, ShellRootAttributes>;
  readonly brand?: MiaixzSlotProps<ShellOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly header?: MiaixzSlotProps<ShellOwnerState, HTMLAttributes<HTMLElement>>;
  readonly sidebar?: MiaixzSlotProps<ShellOwnerState, ShellSidebarAttributes>;
  readonly primaryNavigation?: MiaixzSlotProps<ShellOwnerState, ShellSidebarAttributes>;
  readonly secondaryNavigation?: MiaixzSlotProps<ShellOwnerState, HTMLAttributes<HTMLElement>>;
  readonly contextNavigation?: MiaixzSlotProps<ShellOwnerState, HTMLAttributes<HTMLElement>>;
  readonly main?: MiaixzSlotProps<ShellOwnerState, HTMLAttributes<HTMLElement>>;
  readonly mobileNavigation?: MiaixzSlotProps<ShellOwnerState, HTMLAttributes<HTMLDivElement>>;
}
/**
 * Component-specific Shell properties composed with the permitted native attributes.
 */
export interface MiaixzShellOwnProps {
  readonly mainRef?: Ref<HTMLElement>;
  readonly mainComponent?: ShellMainComponent;
  readonly header: ReactNode;
  readonly brand?: ReactNode;
  readonly primaryNavigation?: ReactNode;
  readonly secondaryNavigation?: ReactNode;
  readonly contextNavigation?: ReactNode;
  readonly children: ReactNode;
  readonly sidebarOverflow?: ShellSidebarOverflow;
  readonly headerBehavior?: "fixed" | "scroll";
  readonly desktopNavigation?: ShellDesktopNavigation;
  readonly mobileNavigation?: ShellMobileNavigation;
  readonly presentation?: "default" | "workspace";
  /**
   * Overrides the layout inherited from Theme for this shell instance.
   */
  readonly layout?: MiaixzShellLayout;
  readonly slotProps?: ShellSlotProps;
}
/**
 * Configures the root application shell. @public
 */
export type ShellProps = MiaixzShellOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzShellOwnProps>;
