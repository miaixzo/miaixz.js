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
 * Defines the navigation rail public type contracts.
 */

import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { NavigationEntry } from "./navigation.types.js";

/**
 * Navigation Rail visual variants permitted by the component contract.
 */
export type NavigationRailVariant = "default" | "brand";
/**
 * Navigation Rail spacing densities permitted by the component contract.
 */
export type NavigationRailDensity = "compact" | "standard" | "comfortable";
/**
 * Navigation item contract reused by rail entries and their overflow presentation.
 */
export type NavigationRailItem = NavigationEntry & {
  readonly overflow?: "auto" | "never";
  readonly priority?: number;
};
/**
 * Labeled group of navigation-rail items identified as one overflow unit.
 */
export interface NavigationRailGroupModel {
  readonly id: string;
  readonly label: ReactNode;
  readonly labelVisible?: boolean;
  readonly items: readonly NavigationRailItem[];
  readonly placement?: "start" | "end";
}
/**
 * Named Navigation Rail parts available for slot and style customization.
 */
export type NavigationRailSlot =
  "root" | "header" | "toggle" | "brand" | "body" | "groups" | "utility" | "overflow";
/**
 * Resolved Navigation Rail state exposed to theme and slot overrides.
 */
export interface NavigationRailOwnerState {
  readonly expanded: boolean;
  readonly variant: NavigationRailVariant;
  readonly density: NavigationRailDensity;
  readonly measured: boolean;
}
/**
 * Attributes accepted by the Navigation Rail Root slot.
 */
export type NavigationRailRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & {
    readonly "data-expanded"?: boolean;
    readonly "data-variant"?: NavigationRailVariant;
    readonly "data-density"?: NavigationRailDensity;
    readonly "data-measured"?: boolean;
  };
/**
 * Attributes accepted by the Navigation Rail Overflow slot.
 */
export type NavigationRailOverflowAttributes = HTMLAttributes<HTMLDivElement> & {
  readonly "data-measuring"?: boolean;
};
/**
 * Per-slot attributes and state-dependent override callbacks for Navigation Rail.
 */
export interface NavigationRailSlotProps {
  readonly root?: MiaixzSlotProps<NavigationRailOwnerState, NavigationRailRootAttributes>;
  readonly header?: MiaixzSlotProps<NavigationRailOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly toggle?: MiaixzSlotProps<NavigationRailOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly brand?: MiaixzSlotProps<NavigationRailOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly body?: MiaixzSlotProps<NavigationRailOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly groups?: MiaixzSlotProps<NavigationRailOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly utility?: MiaixzSlotProps<NavigationRailOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly overflow?: MiaixzSlotProps<NavigationRailOwnerState, NavigationRailOverflowAttributes>;
}
/**
 * Component-specific Navigation Rail properties composed with the permitted native attributes.
 */
export interface MiaixzNavigationRailOwnProps {
  readonly brand: ReactNode;
  readonly toggle: ReactNode;
  readonly groups: readonly NavigationRailGroupModel[];
  /**
   * Supplies the caller's icon for entries without a valid icon.
   */
  readonly defaultIcon?: NonNullable<NavigationEntry["icon"]>;
  readonly overflowLabel?: string;
  readonly overflowBehavior?: "menu" | "scroll";
  readonly expanded?: boolean;
  readonly variant?: NavigationRailVariant;
  readonly density?: NavigationRailDensity;
  readonly utility?: ReactNode;
  readonly slotProps?: NavigationRailSlotProps;
}
/**
 * Configures one adaptive application navigation rail. @public
 */
export type NavigationRailProps = MiaixzNavigationRailOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzNavigationRailOwnProps | "children">;
