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
 * Implements the content loading module.
 */

"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useMiaixzThemeComponent } from "../../theme/context.js";
import { getMiaixzThemeSlotClassNames } from "../../theme/registry.js";
import { Overlay } from "../overlay/overlay.js";
import type {
  StageLoadingOwnerState,
  StageLoadingProps,
  StageLoadingSlotProps,
} from "./stage.types.js";

/**
 * Separates native root attributes from the loading contract.
 * @param props - Public or Theme default properties.
 * @returns Attributes belonging to the existing overlay root.
 */
function getNativeProps(props: Partial<StageLoadingProps>) {
  const {
    active: _active,
    label: _label,
    children: _children,
    placeholder: _placeholder,
    slotProps: _slotProps,
    ...nativeProps
  } = props;
  return nativeProps;
}

/**
 * Resolves Theme slot defaults using this component's effective state.
 * @param slots - Theme default slots.
 * @param key - Slot being resolved.
 * @param ownerState - Current loading and retained-content state.
 * @returns Static native slot properties.
 */
function resolveThemeSlotProps<Key extends keyof StageLoadingSlotProps>(
  slots: StageLoadingSlotProps | undefined,
  key: Key,
  ownerState: StageLoadingOwnerState,
): Exclude<StageLoadingSlotProps[Key], Function> | undefined {
  const value = slots?.[key];
  return (typeof value === "function" ? value(ownerState) : value) as
    Exclude<StageLoadingSlotProps[Key], Function> | undefined;
}

/**
 * Retains content while the existing Overlay owns blocking and focus restoration.
 * @public
 */
export const StageLoading = forwardRef<HTMLDivElement, StageLoadingProps>(
  function StageLoading(props, ref) {
    const theme = useMiaixzThemeComponent("StageLoading");
    const defaults = theme.defaultProps;
    const { active, label, children, placeholder } = { ...defaults, ...props };
    const { slotProps } = props;
    const nativeProps = getNativeProps(props);
    const ownerState: StageLoadingOwnerState = { active, hasContent: children != null };
    const themeRootProps = mergeMiaixzSlotProps({
      ownerState,
      componentProps: getNativeProps(defaults ?? {}),
      slotProps: resolveThemeSlotProps(defaults?.slotProps, "root", ownerState),
    });
    const rootProps = mergeMiaixzSlotProps<
      StageLoadingOwnerState,
      HTMLAttributes<HTMLDivElement>,
      HTMLDivElement
    >({
      ownerState,
      defaultProps: { className: "miaixz-stage-loading" },
      themeDefaultProps: themeRootProps,
      componentProps: nativeProps,
      themeClassNames: getMiaixzThemeSlotClassNames(theme, ownerState, "root"),
      slotProps: slotProps?.root,
      forwardedRef: ref,
    });
    const contentProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-stage-loading-content" },
      themeDefaultProps: resolveThemeSlotProps(defaults?.slotProps, "content", ownerState),
      themeClassNames: getMiaixzThemeSlotClassNames(theme, ownerState, "content"),
      slotProps: slotProps?.content,
    });
    const surfaceProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-stage-loading-surface" },
      themeDefaultProps: resolveThemeSlotProps(defaults?.slotProps, "surface", ownerState),
      themeClassNames: getMiaixzThemeSlotClassNames(theme, ownerState, "surface"),
      slotProps: slotProps?.surface,
    });
    return (
      <Overlay
        active={active}
        label={label}
        slotProps={{ root: rootProps, content: contentProps, surface: surfaceProps }}
      >
        {children ?? placeholder}
      </Overlay>
    );
  },
);
