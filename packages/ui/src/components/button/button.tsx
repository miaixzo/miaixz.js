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
 * Implements the button UI component.
 */

import { forwardRef, useId } from "react";

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { Anchor } from "../../shared/anchor.js";
import { classNames } from "../../shared/class-names.js";
import { MiaixzButtonContent } from "./button-content.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useMiaixzThemeComponent } from "../../theme/context.js";
import { getMiaixzThemeSlotClassNames } from "../../theme/registry.js";
import type {
  ButtonLinkProps,
  ButtonLinkRootAttributes,
  ButtonOwnerState,
  ButtonProps,
  ButtonRootAttributes,
  ButtonSlot,
} from "./button.types.js";
import { useButtonGroup } from "./button-group-context.js";

/**
 * Removes component-only Button props from a native root property set.
 *
 * @param props - Button properties that may contain component-only fields.
 * @returns Native button root properties.
 */
function getButtonNativeProps(props: Partial<ButtonProps>): Partial<ButtonRootAttributes> {
  const {
    children: _children,
    variant: _variant,
    tone: _tone,
    size: _size,
    block: _block,
    loading: _loading,
    loadingLabel: _loadingLabel,
    startIcon: _startIcon,
    endIcon: _endIcon,
    slotProps: _slotProps,
    ...nativeProps
  } = props;
  return nativeProps;
}

/**
 * Removes component-only ButtonLink props from a native anchor property set.
 *
 * @param props - ButtonLink properties that may contain component-only fields.
 * @returns Native anchor properties.
 */
function getButtonLinkNativeProps(
  props: Partial<ButtonLinkProps>,
): Partial<ButtonLinkRootAttributes> {
  const {
    children: _children,
    href: _href,
    variant: _variant,
    tone: _tone,
    size: _size,
    block: _block,
    startIcon: _startIcon,
    endIcon: _endIcon,
    renderAnchor: _renderAnchor,
    slotProps: _slotProps,
    onClick: _onClick,
    ...nativeProps
  } = props;
  return nativeProps;
}

/**
 * Renders a semantic command Button.
 *
 * @public
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const { t } = useMiaixzLocale();
  const labelId = useId();
  const theme = useMiaixzThemeComponent("Button");
  const themeDefaults = theme?.defaultProps;
  const group = useButtonGroup();
  const variant = props.variant ?? group?.variant ?? themeDefaults?.variant ?? "outlined";
  const tone = props.tone ?? group?.tone ?? themeDefaults?.tone ?? "neutral";
  const size = props.size ?? group?.size ?? themeDefaults?.size ?? "medium";
  const block = props.block ?? group?.fullWidth ?? themeDefaults?.block ?? false;
  const loading = props.loading ?? themeDefaults?.loading ?? false;
  const disabled =
    (props.disabled ?? group?.disabled ?? themeDefaults?.disabled) === true || loading;
  const type = props.type ?? themeDefaults?.type ?? "button";
  const ownerState: ButtonOwnerState = { variant, tone, size, block, loading, disabled };
  /**
   * Resolves theme classes for one button slot using the current owner state.
   *
   * @param slot - Component slot whose theme classes are resolved.
   * @returns Theme class names for the requested button slot.
   */
  const slotThemeClasses = (slot: ButtonSlot) =>
    getMiaixzThemeSlotClassNames(theme, ownerState, slot);
  const rootProps = mergeMiaixzSlotProps<ButtonOwnerState, ButtonRootAttributes, HTMLButtonElement>(
    {
      ownerState,
      defaultProps: {
        className: classNames(
          "miaixz-interactive",
          "miaixz-control",
          "miaixz-button",
          `miaixz-control-${size}`,
        ),
      },
      themeDefaultProps: getButtonNativeProps(themeDefaults ?? {}),
      componentProps: getButtonNativeProps(props),
      themeClassNames: slotThemeClasses("root"),
      slotProps: props.slotProps?.root,
      forwardedRef: ref,
      internalProps: {
        type,
        disabled,
        ...(loading ? { "aria-busy": true, "data-loading": true } : {}),
        "aria-labelledby": labelId,
        "data-miaixz-ripple": "true",
        "data-variant": variant,
        "data-tone": tone,
        "data-size": size,
        ...(block ? { "data-block": "true" } : {}),
      },
      ownedProps: [
        "type",
        "disabled",
        "aria-busy",
        "aria-labelledby",
        "data-loading",
        "data-miaixz-ripple",
        "data-variant",
        "data-tone",
        "data-size",
        "data-block",
      ],
    },
  );
  const slotProps = props.slotProps;
  return (
    <button
      {...rootProps}
      aria-labelledby={rootProps["aria-label"] === undefined ? labelId : undefined}
    >
      <MiaixzButtonContent
        ownerState={ownerState}
        labelId={labelId}
        startIcon={props.startIcon ?? themeDefaults?.startIcon}
        endIcon={props.endIcon ?? themeDefaults?.endIcon}
        loadingLabel={props.loadingLabel ?? themeDefaults?.loadingLabel ?? t("ui.loading")}
        slotProps={slotProps}
        themeClassNames={{
          label: slotThemeClasses("label"),
          startIcon: slotThemeClasses("startIcon"),
          endIcon: slotThemeClasses("endIcon"),
          loadingIndicator: slotThemeClasses("loadingIndicator"),
        }}
      >
        {props.children}
      </MiaixzButtonContent>
    </button>
  );
});

/**
 * Renders a Button-presented final native navigation anchor.
 *
 * @public
 */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  function ButtonLink(props, forwardedRef) {
    const group = useButtonGroup();
    const theme = useMiaixzThemeComponent("ButtonLink");
    const themeDefaults = theme?.defaultProps;
    const { href, children, renderAnchor, slotProps, onClick } = props;
    const variant = props.variant ?? group?.variant ?? themeDefaults?.variant ?? "outlined";
    const tone = props.tone ?? group?.tone ?? themeDefaults?.tone ?? "neutral";
    const size = props.size ?? group?.size ?? themeDefaults?.size ?? "medium";
    const block = props.block ?? group?.fullWidth ?? themeDefaults?.block ?? false;
    const disabled = group?.disabled ?? false;
    const ownerState: ButtonOwnerState = {
      variant,
      tone,
      size,
      block,
      loading: false,
      disabled,
    };
    /**
     * Resolves theme classes for one button slot using the current owner state.
     *
     * @param slot - Component slot whose theme classes are resolved.
     * @returns Theme class names for the requested button slot.
     */
    const slotThemeClasses = (slot: ButtonSlot) =>
      getMiaixzThemeSlotClassNames(theme, ownerState, slot);
    const rootProps = mergeMiaixzSlotProps<
      ButtonOwnerState,
      ButtonLinkRootAttributes,
      HTMLAnchorElement
    >({
      ownerState,
      defaultProps: {
        className: classNames(
          "miaixz-interactive",
          "miaixz-control",
          "miaixz-button",
          `miaixz-control-${size}`,
        ),
      },
      componentProps: getButtonLinkNativeProps(props),
      themeDefaultProps: getButtonLinkNativeProps(themeDefaults ?? {}),
      themeClassNames: slotThemeClasses("root"),
      slotProps: slotProps?.root,
      forwardedRef,
      internalProps: {
        href,
        ...(disabled ? { "aria-disabled": true, tabIndex: -1 } : {}),
        onClick: (event) => {
          if (disabled) event.preventDefault();
          else onClick?.(event);
        },
        "data-miaixz-ripple": "true",
        "data-variant": variant,
        "data-tone": tone,
        "data-size": size,
        ...(block ? { "data-block": "true" } : {}),
      },
      ownedProps: [
        "href",
        "aria-disabled",
        "tabIndex",
        "onClick",
        "data-miaixz-ripple",
        "data-variant",
        "data-tone",
        "data-size",
        "data-block",
      ],
    });
    return (
      <Anchor {...rootProps} href={href} renderAnchor={renderAnchor}>
        <MiaixzButtonContent
          ownerState={ownerState}
          startIcon={props.startIcon ?? themeDefaults?.startIcon}
          endIcon={props.endIcon ?? themeDefaults?.endIcon}
          slotProps={slotProps}
          themeClassNames={{
            label: slotThemeClasses("label"),
            startIcon: slotThemeClasses("startIcon"),
            endIcon: slotThemeClasses("endIcon"),
            loadingIndicator: slotThemeClasses("loadingIndicator"),
          }}
        >
          {children}
        </MiaixzButtonContent>
      </Anchor>
    );
  },
);
