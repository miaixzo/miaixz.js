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
 * Defines neutral asynchronous presentation and retained-content loading contracts.
 */

import type { HTMLAttributes, ReactNode } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Native data attributes without application-specific field names.
 */
type StageDataAttributes = {
  readonly [name: `data-${string}`]: string | number | boolean | undefined;
};
/**
 * Native div attributes accepted by presentation slots.
 */
type StageDivAttributes = HTMLAttributes<HTMLDivElement> & StageDataAttributes;

/**
 * Resolved loading state supplied to Theme variants and slot callbacks. @public
 */
export interface StageLoadingOwnerState {
  /**
   * Whether loading feedback is active.
   */
  readonly active: boolean;
  /**
   * Whether non-null child content was supplied.
   */
  readonly hasContent: boolean;
}

/**
 * Native properties for the existing overlay nodes. @public
 */
export interface StageLoadingSlotProps {
  /**
   * Properties for the overlay root.
   */
  readonly root?: MiaixzSlotProps<StageLoadingOwnerState, StageDivAttributes>;
  /**
   * Properties for the retained content node.
   */
  readonly content?: MiaixzSlotProps<StageLoadingOwnerState, StageDivAttributes>;
  /**
   * Properties for the blocking feedback surface.
   */
  readonly surface?: MiaixzSlotProps<StageLoadingOwnerState, StageDivAttributes>;
}

/**
 * Caller-owned content, loading label, placeholder, and native attributes. @public
 */
export interface StageLoadingProps extends Omit<StageDivAttributes, "children" | "aria-busy"> {
  /**
   * Whether the content scope is loading.
   */
  readonly active: boolean;
  /**
   * Accessible feedback label resolved by the caller.
   */
  readonly label: string;
  /**
   * Content retained while feedback is active.
   */
  readonly children?: ReactNode;
  /**
   * Fallback rendered when children are null or undefined.
   */
  readonly placeholder?: ReactNode;
  /**
   * Overrides applied using this component's resolved owner state.
   */
  readonly slotProps?: StageLoadingSlotProps;
}

/**
 * Resolved state supplied to Theme variants and presentation slots. @public
 */
export interface StageOwnerState {
  /**
   * Branch currently being presented.
   */
  readonly status: "loading" | "empty" | "error" | "ready";
  /**
   * Resolved error presentation; defaults to region.
   */
  readonly presentation: "inline" | "region";
  /**
   * Local retry state, excluding the caller's retrying flag.
   */
  readonly pending: boolean;
}

/**
 * Native properties for neutral asynchronous presentation nodes. @public
 */
export interface StageSlotProps {
  /**
   * Actual presentation root, without the outer retry loading overlay.
   */
  readonly root?: MiaixzSlotProps<
    StageOwnerState,
    HTMLAttributes<HTMLElement> & StageDataAttributes
  >;
  /**
   * Outer div used only by region error presentation.
   */
  readonly region?: MiaixzSlotProps<StageOwnerState, StageDivAttributes>;
  /**
   * Exception title node; unused by inline errors.
   */
  readonly title?: MiaixzSlotProps<StageOwnerState, HTMLAttributes<HTMLHeadingElement>>;
  /**
   * Exception content node; unused by inline errors.
   */
  readonly content?: MiaixzSlotProps<StageOwnerState, StageDivAttributes>;
  /**
   * Exception illustration node; unused by inline errors.
   */
  readonly illustration?: MiaixzSlotProps<StageOwnerState, StageDivAttributes>;
}

/**
 * Native properties shared by branches that render a presentation node.
 */
type StageCommonProps = Omit<HTMLAttributes<HTMLElement>, "title" | "children" | "aria-busy"> &
  StageDataAttributes & { readonly slotProps?: StageSlotProps };

/**
 * Presentation branches with caller-resolved copy and no application scope. @public
 */
export type StageProps =
  | (StageCommonProps & {
      readonly status: "loading";
      readonly label: string;
      readonly placeholder?: ReactNode;
    })
  | (StageCommonProps & {
      readonly status: "empty";
      readonly title: ReactNode;
      readonly description?: ReactNode;
      readonly actions?: ReactNode;
    })
  | (StageCommonProps & {
      readonly status: "error";
      readonly title: ReactNode;
      readonly description: ReactNode;
      readonly loadingLabel: string;
      /**
       * Native properties for the existing retry loading overlay.
       */
      readonly loadingSlotProps?: StageLoadingSlotProps;
      readonly presentation?: "inline" | "region";
      readonly retryLabel?: string;
      readonly onRetry?: () => unknown;
      readonly retrying?: boolean;
      readonly retryDisabled?: boolean;
      readonly actions?: ReactNode;
    })
  | { readonly status: "ready"; readonly children: ReactNode };
