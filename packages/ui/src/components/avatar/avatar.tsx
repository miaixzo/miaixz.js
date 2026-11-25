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
 * Implements the avatar UI component.
 */

import { forwardRef, useState } from "react";

import { Icon } from "@miaixz/icons";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { AvatarOwnerState, AvatarProps, AvatarRootAttributes } from "./avatar.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Finds the first visible grapheme, uppercasing it when the result fits in one grapheme.
 *
 * @param name - Display name or explicit initials.
 * @returns A single grapheme or an empty string.
 * @public
 */
export function avatarInitial(name?: string): string {
  const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const first = graphemes.segment(name?.trim() ?? "").containing(0)?.segment ?? "";
  const upper = first.toLocaleUpperCase();
  return graphemes.segment(upper).containing(0)?.segment === upper ? upper : first;
}

/**
 * Derives the first two visible Unicode graphemes from a display name.
 *
 * @param name - Display name used to generate the fallback.
 * @returns Uppercase graphemes or a question mark when the name is empty.
 */
function createAvatarFallback(name: string): string {
  const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const fallback = Array.from(graphemes.segment(name.trim()), ({ segment }) => segment)
    .filter((segment) => segment.trim().length > 0)
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase();

  return fallback || "?";
}

/**
 * Derives the first visible Unicode grapheme from alternative text.
 *
 * @param alt - Alternative text used by the image.
 * @returns One uppercase grapheme, or an empty string.
 */
function createAltFallback(alt: string): string {
  const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return (
    Array.from(graphemes.segment(alt.trim()), ({ segment }) => segment)
      .find((segment) => segment.trim().length > 0)
      ?.toLocaleUpperCase() ?? ""
  );
}

/**
 * Renders the package-owned generic avatar fallback without coupling peer components.
 *
 * @returns Decorative user silhouette from the configured icon provider.
 */
function createGenericAvatarFallback() {
  return <Icon className="miaixz-avatar-generic-icon" name={"user-round"} size="control" />;
}

/**
 * Renders an accessible avatar image with a Unicode-safe name fallback.
 *
 * @public
 */
export const Avatar = withMiaixzThemeComponent(
  "Avatar",
  forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
    {
      src,
      srcSet,
      sizes,
      alt = "",
      name,
      singleInitial = false,
      children,
      indicator,
      indicatorLabel,
      size = "medium",
      variant = "circular",
      slotProps,
      ...rootNativeProps
    },
    ref,
  ) {
    const [failedSource, setFailedSource] = useState<string>();
    const sourceKey = `${src ?? ""}\u0000${srcSet ?? ""}`;
    const hasImageSource = Boolean(src?.length || srcSet?.length);
    const displaysImage = hasImageSource && failedSource !== sourceKey;
    const ownerState: AvatarOwnerState = {
      size,
      state: displaysImage ? "image" : "fallback",
      decorative: alt.length === 0,
      hasIndicator: indicator !== undefined && indicator !== null,
      variant,
    };
    const rootProps = mergeMiaixzSlotProps<AvatarOwnerState, AvatarRootAttributes, HTMLSpanElement>(
      {
        ownerState,
        defaultProps: {
          className: `miaixz-avatar miaixz-avatar-${size} miaixz-avatar-${variant}`,
        },
        componentProps: rootNativeProps,
        slotProps: slotProps?.root,
        forwardedRef: ref,
        internalProps: {
          "data-ui": "avatar",
          "data-size": size,
          "data-state": ownerState.state,
          "data-variant": variant,
        },
        ownedProps: ["data-ui", "data-size", "data-state", "data-variant"],
      },
    );
    const imageProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-avatar-image" },
      slotProps: slotProps?.image,
      internalProps: {
        src,
        srcSet,
        sizes,
        alt,
        onError: () => setFailedSource(sourceKey),
      },
      ownedProps: ["src", "srcSet", "sizes", "alt"],
    });
    let fallbackContent = children;
    if (singleInitial && typeof children === "string") {
      fallbackContent = avatarInitial(children);
    } else if (children == null) {
      const fallbackText = singleInitial
        ? avatarInitial(name) || avatarInitial(alt)
        : name !== undefined && name.trim().length > 0
          ? createAvatarFallback(name)
          : createAltFallback(alt);
      fallbackContent = fallbackText || createGenericAvatarFallback();
    }
    const fallbackProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-avatar-fallback" },
      slotProps: slotProps?.fallback,
      internalProps: {
        children: fallbackContent,
        ...(alt.length === 0 ? { "aria-hidden": true } : { role: "img", "aria-label": alt }),
      },
      ownedProps: ["children", "role", "aria-label", "aria-hidden"],
    });
    const indicatorProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-avatar-indicator" },
      slotProps: slotProps?.indicator,
      internalProps:
        indicatorLabel === undefined || indicatorLabel.trim().length === 0
          ? { "aria-hidden": true }
          : { role: "img", "aria-label": indicatorLabel },
      ownedProps: ["role", "aria-label", "aria-hidden"],
    });

    return (
      <span {...rootProps}>
        {displaysImage ? <img {...imageProps} /> : <span {...fallbackProps} />}
        {indicator !== undefined && indicator !== null ? (
          <span {...indicatorProps}>{indicator}</span>
        ) : null}
      </span>
    );
  }),
);
