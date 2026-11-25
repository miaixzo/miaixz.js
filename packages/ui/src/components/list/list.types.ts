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
 * Defines the list public type contracts.
 */

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
  RefAttributes,
} from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzVisualTone } from "../shared.types.js";

/**
 * Removes on-prefixed event-handler keys from a native attribute contract.
 */
type WithoutInteractionHandlers<Props> = {
  readonly [Key in keyof Props as Key extends `on${string}` ? never : Key]: Props[Key];
};
/**
 * Attributes accepted by the List Item Root slot.
 */
export type ListItemRootAttributes = Omit<
  WithoutInteractionHandlers<HTMLAttributes<HTMLLIElement>>,
  "aria-current" | "aria-disabled" | "children" | "content" | "id" | "role" | "tabIndex" | "title"
>;
/**
 * Attributes permitted on a non-interactive list-item control.
 */
export type StaticListControlAttributes = Omit<
  WithoutInteractionHandlers<HTMLAttributes<HTMLDivElement>>,
  "aria-current" | "aria-disabled" | "children" | "role" | "tabIndex"
>;
/**
 * Content alternatives shared by list item presentation modes.
 */
export type ListItemContent =
  | { readonly content: ReactNode; readonly title?: never; readonly description?: never }
  | { readonly content?: never; readonly title: ReactNode; readonly description?: ReactNode };
/**
 * Visible content and layout options shared by list item kinds.
 */
interface ListItemPresentation extends ListItemRootAttributes {
  readonly id: string;
  readonly icon?: ReactNode;
  readonly meta?: ReactNode;
  readonly actions?: ReactNode;
  readonly tone?: MiaixzVisualTone;
  readonly selected?: boolean;
}
/**
 * Non-interactive list item shape excluding command and navigation behavior.
 */
type StaticListItem = {
  readonly kind: "static";
  readonly divProps?: StaticListControlAttributes;
  readonly href?: never;
  readonly onAction?: never;
  readonly disabled?: never;
  readonly anchorProps?: never;
  readonly buttonProps?: never;
};
/**
 * List item shape whose control is an anchor with a navigation target.
 */
type NavigationListItem = {
  readonly kind: "navigation";
  readonly href: string;
  readonly anchorProps?: Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "aria-disabled" | "children" | "href"
  >;
  readonly onAction?: never;
  readonly disabled?: never;
  readonly divProps?: never;
  readonly buttonProps?: never;
};
/**
 * List item shape whose control invokes a command callback.
 */
type CommandListItem = {
  readonly kind: "command";
  readonly onAction: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly disabled?: boolean;
  readonly buttonProps?: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "aria-disabled" | "children" | "disabled" | "onClick" | "type"
  >;
  readonly href?: never;
  readonly divProps?: never;
  readonly anchorProps?: never;
};
/**
 * Discriminated static, navigation, or command list item configuration.
 */
export type ListItemProps = ListItemContent &
  ListItemPresentation &
  (StaticListItem | NavigationListItem | CommandListItem) & {
    readonly slotProps?: ListItemSlotProps;
  };

/**
 * List content arrangements permitted by the component contract.
 */
export type ListLayout = "list" | "grid";
/**
 * List visual variants permitted by the component contract.
 */
export type ListVariant = "default" | "overview" | "accent" | "transfer";
/**
 * List spacing densities permitted by the component contract.
 */
export type ListDensity = "compact" | "standard" | "comfortable";
/**
 * List surface treatments permitted by the component contract.
 */
export type ListSurface = "plain" | "panel";
/**
 * Named List parts available for slot and style customization.
 */
export type ListSlot = "root";
/**
 * Resolved List state exposed to theme and slot overrides.
 */
export interface ListOwnerState {
  readonly variant: ListVariant;
  readonly layout: ListLayout;
  readonly density: ListDensity;
  readonly surface: ListSurface;
  readonly dividers: boolean;
  readonly bordered: boolean;
  readonly fillRow: boolean;
}
/**
 * Attributes accepted by the List Root slot.
 */
export type ListRootAttributes = HTMLAttributes<HTMLUListElement> &
  RefAttributes<HTMLUListElement> & {
    readonly "data-layout"?: ListLayout;
    readonly "data-variant"?: ListVariant;
    readonly "data-density"?: ListDensity;
    readonly "data-row-padding"?: "tight";
    readonly "data-surface"?: ListSurface;
    readonly "data-dividers"?: boolean;
    readonly "data-bordered"?: boolean;
    readonly "data-fill-row"?: boolean;
  };
/**
 * Properties accepted by the List renderer.
 */
export interface ListProps extends Omit<HTMLAttributes<HTMLUListElement>, "children"> {
  readonly items: readonly ListItemProps[];
  readonly variant?: ListVariant;
  readonly layout?: ListLayout;
  /**
   * Lets items in the grid layout expand to fill each row. Defaults to false.
   */
  readonly fillRow?: boolean;
  readonly density?: ListDensity;
  /**
   * Uses a smaller block inset for rows in constrained lists.
   */
  readonly rowPadding?: "tight";
  readonly surface?: ListSurface;
  readonly dividers?: boolean;
  readonly bordered?: boolean;
  readonly slotProps?: { readonly root?: MiaixzSlotProps<ListOwnerState, ListRootAttributes> };
}

/**
 * Named List Item parts available for slot and style customization.
 */
export type ListItemSlot =
  "root" | "primary" | "icon" | "content" | "title" | "description" | "meta" | "actions";
/**
 * Resolved List Item state exposed to theme and slot overrides.
 */
export interface ListItemOwnerState {
  readonly kind: "static" | "navigation" | "command";
  readonly tone: MiaixzVisualTone;
  readonly density: ListDensity;
  readonly surface: ListSurface;
}
/**
 * Per-slot attributes and state-dependent override callbacks for List Item.
 */
export type ListItemSlotProps = {
  readonly root?: MiaixzSlotProps<ListItemOwnerState, ListItemRootAttributes>;
  readonly primary?: MiaixzSlotProps<ListItemOwnerState, HTMLAttributes<HTMLElement>>;
  readonly icon?: MiaixzSlotProps<ListItemOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly content?: MiaixzSlotProps<ListItemOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly title?: MiaixzSlotProps<ListItemOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly description?: MiaixzSlotProps<ListItemOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly meta?: MiaixzSlotProps<ListItemOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly actions?: MiaixzSlotProps<ListItemOwnerState, HTMLAttributes<HTMLSpanElement>>;
};

/**
 * Properties accepted by the List Marker renderer.
 */
export interface ListMarkerProps extends HTMLAttributes<HTMLSpanElement> {
  readonly variant?: "default" | "step" | "dot";
}
/**
 * Properties accepted by the List Counter renderer.
 */
export interface ListCounterProps extends HTMLAttributes<HTMLSpanElement> {
  readonly variant?: "default" | "alert";
}
