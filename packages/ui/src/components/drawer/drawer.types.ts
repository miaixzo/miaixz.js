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
 * Defines the drawer public type contracts.
 */

import type {
  ButtonHTMLAttributes,
  DialogHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  RefAttributes,
} from "react";

import type { MiaixzSlotComponent, MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Drawer width tokens permitted by the component contract.
 */
export type DrawerWidth = "small" | "medium" | "large" | "xlarge" | "wide" | "content" | number;
/**
 * Drawer spacing densities permitted by the component contract.
 */
export type DrawerDensity = "compact" | "standard" | "comfortable";
/**
 * Drawer edge placements permitted by the component contract.
 */
export type DrawerPlacement = "left" | "right" | "bottom";
/**
 * Drawer dismissal reasons permitted by the component contract.
 */
export type DrawerCloseReason = "escape" | "backdrop" | "closeButton" | "nativeClose";
/**
 * Named Drawer parts available for slot and style customization.
 */
export type DrawerSlot =
  "root" | "paper" | "header" | "title" | "description" | "content" | "footer" | "closeButton";

/**
 * Viewport-edge insets applied when resolving drawer geometry.
 */
export interface DrawerInset {
  readonly block?: number;
  readonly inline?: number;
}

/**
 * Resolved Drawer state exposed to theme and slot overrides.
 */
export interface DrawerOwnerState {
  readonly open: boolean;
  readonly placement: DrawerPlacement;
  readonly width: DrawerWidth | undefined;
  readonly density: DrawerDensity;
  readonly floating: boolean;
  readonly positioned: boolean;
  readonly showClose: boolean;
}

/**
 * Replaceable slot components accepted by Drawer.
 */
export interface DrawerSlots {
  readonly description?: MiaixzSlotComponent<HTMLAttributes<HTMLDivElement>>;
}

/**
 * Attributes accepted by the Drawer Root slot.
 */
export type DrawerRootAttributes = DialogHTMLAttributes<HTMLDialogElement> &
  RefAttributes<HTMLDialogElement> & {
    readonly "data-placement"?: DrawerPlacement;
    readonly "data-width"?: Exclude<DrawerWidth, number>;
    readonly "data-spacing"?: "compact" | "standard" | "large" | "workspace" | "content" | "wide";
    readonly "data-density"?: DrawerDensity;
    readonly "data-floating"?: boolean;
    readonly "data-positioned"?: boolean;
  };

/**
 * Per-slot attributes and state-dependent override callbacks for Drawer.
 */
export interface DrawerSlotProps {
  readonly root?: MiaixzSlotProps<DrawerOwnerState, DrawerRootAttributes>;
  readonly paper?: MiaixzSlotProps<DrawerOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly header?: MiaixzSlotProps<DrawerOwnerState, HTMLAttributes<HTMLElement>>;
  readonly title?: MiaixzSlotProps<DrawerOwnerState, HTMLAttributes<HTMLHeadingElement>>;
  readonly description?: MiaixzSlotProps<DrawerOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly content?: MiaixzSlotProps<DrawerOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly footer?: MiaixzSlotProps<DrawerOwnerState, HTMLAttributes<HTMLElement>>;
  readonly closeButton?: MiaixzSlotProps<DrawerOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
}

/**
 * Component-specific Drawer properties composed with the permitted native attributes.
 */
interface DrawerSharedProps {
  readonly boundary?: HTMLElement | null;
  readonly inset?: number | DrawerInset;
  readonly floating?: boolean;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean, reason: DrawerCloseReason) => void;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly density?: DrawerDensity;
  readonly headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  readonly closeLabel?: string;
  readonly showClose?: boolean;
  /**
   * Allows backdrop dismissal when explicitly enabled. Defaults to false.
   */
  readonly closeOnBackdrop?: boolean;
  /**
   * Allows Escape dismissal when explicitly enabled. Defaults to false.
   */
  readonly closeOnEscape?: boolean;
  /**
   * Disables user close requests while an operation is pending.
   */
  readonly closeDisabled?: boolean;
  readonly slots?: DrawerSlots;
  readonly slotProps?: DrawerSlotProps;
}

/**
 * Geometry settings permitted for a drawer anchored to a side edge.
 */
type DrawerSideGeometry = {
  readonly placement?: "left" | "right";
  readonly width?: DrawerWidth;
};

/**
 * Geometry settings permitted for a bottom-anchored drawer.
 */
type DrawerBottomGeometry = {
  readonly placement: "bottom";
  readonly width?: never;
};

/**
 * Properties accepted by the Drawer renderer.
 */
export type DrawerProps = DrawerSharedProps &
  (DrawerSideGeometry | DrawerBottomGeometry) &
  Omit<
    DialogHTMLAttributes<HTMLDialogElement>,
    keyof DrawerSharedProps | "children" | "open" | "role" | "title" | "width"
  >;
