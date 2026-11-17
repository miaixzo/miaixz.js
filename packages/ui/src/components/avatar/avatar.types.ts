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
 * Defines the avatar public type contracts.
 */

import type { HTMLAttributes, ImgHTMLAttributes, ReactNode, RefAttributes } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzComponentSize } from "../shared.types.js";

/**
 * Named Avatar parts available for slot and style customization.
 */
export type AvatarSlot = "root" | "image" | "fallback" | "indicator";
/**
 * Avatar visual variants permitted by the component contract.
 */
export type AvatarVariant = "circular" | "rounded" | "square";
/**
 * Avatar sizes, including the larger profile presentation.
 */
export type AvatarSize = MiaixzComponentSize | "profile";
/**
 * Resolved Avatar state exposed to theme and slot overrides.
 */
export interface AvatarOwnerState {
  readonly size: AvatarSize;
  readonly state: "image" | "fallback";
  readonly decorative: boolean;
  readonly hasIndicator: boolean;
  readonly variant: AvatarVariant;
}
/**
 * Attributes accepted by the Avatar Root slot.
 */
export type AvatarRootAttributes = HTMLAttributes<HTMLSpanElement> &
  RefAttributes<HTMLSpanElement> & {
    readonly "data-size"?: AvatarSize;
    readonly "data-state"?: "image" | "fallback";
    readonly "data-variant"?: AvatarVariant;
  };
/**
 * Per-slot attributes and state-dependent override callbacks for Avatar.
 */
export interface AvatarSlotProps {
  readonly root?: MiaixzSlotProps<AvatarOwnerState, AvatarRootAttributes>;
  readonly image?: MiaixzSlotProps<AvatarOwnerState, ImgHTMLAttributes<HTMLImageElement>>;
  readonly fallback?: MiaixzSlotProps<AvatarOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly indicator?: MiaixzSlotProps<AvatarOwnerState, HTMLAttributes<HTMLSpanElement>>;
}

/**
 * Defines properties owned by the Miaixz Avatar contract.
 *
 * @public
 */
export interface MiaixzAvatarOwnProps {
  /**
   * Supplies the optional profile image source.
   */
  readonly src?: string;

  /**
   * Supplies responsive profile image candidates.
   */
  readonly srcSet?: string;

  /**
   * Supplies the responsive image slot sizes hint.
   */
  readonly sizes?: string;

  /**
   * Supplies the required accessible name for either image or fallback content.
   */
  readonly alt?: string;

  /**
   * Supplies the name used to derive fallback graphemes.
   */
  readonly name?: string;

  /**
   * Supplies explicit text or icon fallback content.
   */
  readonly children?: ReactNode;

  /**
   * Supplies optional status, count, or custom overlay content.
   */
  readonly indicator?: ReactNode;

  /**
   * Supplies an accessible name for meaningful indicator content.
   */
  readonly indicatorLabel?: string;

  /**
   * Selects the semantic avatar size.
   *
   * @defaultValue `"medium"`
   */
  readonly size?: AvatarSize;

  /**
   * Selects the avatar shape.
   *
   * @defaultValue `"circular"`
   */
  readonly variant?: AvatarVariant;

  /**
   * Configures the fixed Avatar nodes.
   */
  readonly slotProps?: AvatarSlotProps;
}

/**
 * Configures an accessible profile image with a deterministic name fallback.
 *
 * @public
 */
export interface AvatarProps
  extends
    Omit<
      HTMLAttributes<HTMLSpanElement>,
      keyof MiaixzAvatarOwnProps | "aria-hidden" | "aria-label" | "aria-labelledby" | "role"
    >,
    MiaixzAvatarOwnProps {}

/**
 * Avatar Group spacing tokens permitted by the component contract.
 */
export type AvatarGroupSpacing = "medium" | "small" | number;
/**
 * Named Avatar Group parts available for slot and style customization.
 */
export type AvatarGroupSlot = "root" | "surplus";

/**
 * Resolved Avatar Group state exposed to theme and slot overrides.
 */
export interface AvatarGroupOwnerState {
  readonly spacing: AvatarGroupSpacing;
  readonly surplus: number;
  readonly variant: AvatarVariant;
}

/**
 * Attributes accepted by the Avatar Group Root slot.
 */
export type AvatarGroupRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & {
    readonly "data-spacing"?: "medium" | "small" | "custom";
    readonly "data-variant"?: AvatarVariant;
  };

/**
 * Per-slot attributes and state-dependent override callbacks for Avatar Group.
 */
export interface AvatarGroupSlotProps {
  readonly root?: MiaixzSlotProps<AvatarGroupOwnerState, AvatarGroupRootAttributes>;
  readonly surplus?: MiaixzSlotProps<AvatarGroupOwnerState, HTMLAttributes<HTMLSpanElement>>;
}

/**
 * Configures a stacked collection of avatars with an optional surplus indicator.
 *
 * @public
 */
export interface AvatarGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  readonly children?: ReactNode;
  readonly max?: number;
  readonly renderSurplus?: (surplus: number) => ReactNode;
  readonly slotProps?: AvatarGroupSlotProps;
  readonly spacing?: AvatarGroupSpacing;
  readonly total?: number;
  readonly variant?: AvatarVariant;
}
