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
 * Implements the drawer UI component.
 */

import {
  createElement,
  forwardRef,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";

import { FocusScope } from "../../accessibility/focus-scope.js";
import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { useMiaixzNativeModal } from "../../shared/overlay/native-modal.js";
import { useMiaixzPortalTarget } from "../../shared/overlay/portal-target.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useMiaixzLayoutEffect } from "../../shared/use-client-layout-effect.js";
import { Icon } from "@miaixz/icons";
import type {
  DrawerCloseReason,
  DrawerOwnerState,
  DrawerProps,
  DrawerRootAttributes,
  DrawerWidth,
} from "./drawer.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Component-owned responsive spacing tiers inferred from the sole width input.
 */
type DrawerSpacing = "compact" | "standard" | "large" | "workspace" | "content" | "wide";

/**
 * Resolved drawer bounds used by the positioning renderer.
 */
interface DrawerFrame {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
}

/**
 * Rejects invalid public drawer geometry without normalizing it.
 *
 * @param value - Optional drawer dimension to validate.
 * @param positive - Whether zero must also be rejected.
 * @param code - Public error code used for the invalid dimension.
 * @returns Nothing after validation.
 * @throws MiaixzUiError when the dimension is non-finite or outside its allowed range.
 */
function validateDrawerDimension(
  value: number | undefined,
  positive: boolean,
  code: "UI_DRAWER_WIDTH_INVALID" | "UI_DRAWER_INSET_INVALID",
): void {
  if (value === undefined || (Number.isFinite(value) && (positive ? value > 0 : value >= 0)))
    return;
  throw new MiaixzUiError({ code, details: { value } });
}

/**
 * Classifies legacy and custom widths into the semantic spacing tier owned by Drawer.
 *
 * @param width - Resolved side-drawer width contract.
 * @returns Semantic tier used for responsive spacing.
 */
function resolveDrawerSpacing(width: DrawerWidth | undefined): DrawerSpacing {
  if (typeof width === "number") {
    if (width <= 480) return "compact";
    if (width <= 600) return "standard";
    if (width <= 800) return "large";
    return "workspace";
  }
  switch (width) {
    case "small":
    case "medium":
      return "compact";
    case "large":
      return "standard";
    case "xlarge":
      return "workspace";
    case "content":
      return "content";
    case "wide":
      return "wide";
    default:
      return "standard";
  }
}

/**
 * Removes component-owned properties before the native root merge.
 *
 * @param props - Drawer properties to separate.
 * @returns Native dialog root attributes.
 */
function getDrawerNativeProps(props: DrawerProps): Partial<DrawerRootAttributes> {
  const {
    boundary: _boundary,
    inset: _inset,
    floating: _floating,
    open: _open,
    onOpenChange: _onOpenChange,
    title: _title,
    description: _description,
    children: _children,
    footer: _footer,
    density: _density,
    headingLevel: _headingLevel,
    closeLabel: _closeLabel,
    showClose: _showClose,
    closeOnBackdrop: _closeOnBackdrop,
    closeOnEscape: _closeOnEscape,
    closeDisabled: _closeDisabled,
    slots: _slots,
    slotProps: _slotProps,
    placement: _placement,
    width: _width,
    ...nativeProps
  } = props;
  return nativeProps;
}

/**
 * Compares immutable geometry snapshots without triggering redundant renders.
 *
 * @param previous - Previously observed drawer frame.
 * @param next - Newly measured drawer frame.
 * @returns Whether every frame coordinate and viewport dimension is unchanged.
 */
function drawerFramesEqual(previous: DrawerFrame, next: DrawerFrame): boolean {
  return (Object.keys(next) as (keyof DrawerFrame)[]).every((key) => previous[key] === next[key]);
}

/**
 * Renders the sole modal drawer contract.
 */
export const Drawer = withMiaixzThemeComponent(
  "Drawer",
  forwardRef<HTMLDialogElement, DrawerProps>(function Drawer(props, forwardedRef) {
    const {
      open,
      onOpenChange,
      title,
      description,
      children,
      footer,
      density = "standard",
      boundary,
      inset,
      floating = false,
      placement = "right",
      width = placement === "bottom" ? undefined : "medium",
      headingLevel = 2,
      closeLabel,
      showClose = true,
      closeOnBackdrop = false,
      closeOnEscape = false,
      closeDisabled = false,
      slots,
      slotProps,
    } = props;
    const spacing = placement === "bottom" ? "standard" : resolveDrawerSpacing(width);
    const blockInset = typeof inset === "number" ? inset : (inset?.block ?? 0);
    const inlineInset = typeof inset === "number" ? inset : (inset?.inline ?? 0);
    validateDrawerDimension(
      typeof width === "number" ? width : undefined,
      true,
      "UI_DRAWER_WIDTH_INVALID",
    );
    validateDrawerDimension(blockInset, false, "UI_DRAWER_INSET_INVALID");
    validateDrawerDimension(inlineInset, false, "UI_DRAWER_INSET_INVALID");
    const positioned = boundary !== undefined || inset !== undefined;
    const [frame, setFrame] = useState<DrawerFrame | null>(null);

    useMiaixzLayoutEffect(() => {
      if (!open || !positioned || boundary === null) {
        setFrame(null);
        return undefined;
      }
      const ownerDocument = boundary?.ownerDocument ?? document;
      const view = ownerDocument.defaultView;
      if (view === null) return undefined;
      let animationFrame = 0;
      /**
       * Intersects the connected drawer boundary with the visual viewport and updates changed frame bounds.
       *
       * @returns No return value.
       */
      const update = (): void => {
        animationFrame = 0;
        if (boundary !== undefined && !boundary.isConnected) {
          setFrame(null);
          return;
        }
        const visual = view.visualViewport;
        const viewportWidth = view.innerWidth;
        const viewportHeight = view.innerHeight;
        const left = visual?.offsetLeft ?? 0;
        const top = visual?.offsetTop ?? 0;
        const right = left + (visual?.width ?? viewportWidth);
        const bottom = top + (visual?.height ?? viewportHeight);
        const rect = boundary?.getBoundingClientRect();
        const next: DrawerFrame = {
          left: Math.min(right, Math.max(left, rect?.left ?? left)),
          top: Math.min(bottom, Math.max(top, rect?.top ?? top)),
          right: Math.max(left, Math.min(right, rect?.right ?? right)),
          bottom: Math.max(top, Math.min(bottom, rect?.bottom ?? bottom)),
          viewportWidth,
          viewportHeight,
        };
        setFrame((previous) =>
          previous !== null && drawerFramesEqual(previous, next) ? previous : next,
        );
      };
      const requestFrame =
        view.requestAnimationFrame?.bind(view) ?? ((callback) => view.setTimeout(callback, 0));
      const cancelFrame = view.cancelAnimationFrame?.bind(view) ?? view.clearTimeout.bind(view);
      /**
       * Coalesces drawer frame measurements into one pending animation-frame callback.
       *
       * @returns No return value.
       */
      const scheduleUpdate = (): void => {
        if (animationFrame === 0) animationFrame = requestFrame(update);
      };
      update();
      const resizeObserver =
        typeof ResizeObserver === "function" ? new ResizeObserver(scheduleUpdate) : undefined;
      resizeObserver?.observe(boundary ?? ownerDocument.documentElement);
      view.addEventListener("resize", scheduleUpdate);
      ownerDocument.addEventListener("scroll", scheduleUpdate, true);
      view.visualViewport?.addEventListener("resize", scheduleUpdate);
      view.visualViewport?.addEventListener("scroll", scheduleUpdate);
      return () => {
        if (animationFrame !== 0) cancelFrame(animationFrame);
        resizeObserver?.disconnect();
        view.removeEventListener("resize", scheduleUpdate);
        ownerDocument.removeEventListener("scroll", scheduleUpdate, true);
        view.visualViewport?.removeEventListener("resize", scheduleUpdate);
        view.visualViewport?.removeEventListener("scroll", scheduleUpdate);
      };
    }, [boundary, open, positioned]);

    const active = open && (!positioned || (boundary !== null && frame !== null));
    const { t } = useMiaixzLocale();
    const resolvedCloseLabel = closeLabel ?? t("ui.drawer.close");
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const descriptionId = useId();
    const portalTarget = useMiaixzPortalTarget();
    const restoreFocusRef = useMiaixzNativeModal(dialogRef, active, portalTarget);
    const ownerState: DrawerOwnerState = {
      open,
      placement,
      width,
      density,
      floating,
      positioned,
      showClose,
    };

    /**
     * Reports a drawer close request with the originating dismissal reason.
     *
     * @param reason - User action responsible for the requested state change.
     * @returns No return value.
     */
    const requestClose = (reason: DrawerCloseReason): void => {
      if (!closeDisabled) onOpenChange(false, reason);
    };
    const geometry: CSSProperties & Record<`--${string}`, string | number> = {};
    if (typeof width === "number") geometry["--miaixz-drawer-width"] = `${width}px`;
    if (positioned && frame !== null) {
      const availableWidth = Math.max(0, frame.right - frame.left - inlineInset * 2);
      const availableHeight = Math.max(0, frame.bottom - frame.top - blockInset * 2);
      Object.assign(geometry, {
        top: placement === "bottom" ? "auto" : frame.top + blockInset,
        bottom: frame.viewportHeight - frame.bottom + blockInset,
        left: placement === "right" ? "auto" : frame.left + inlineInset,
        right: placement === "left" ? "auto" : frame.viewportWidth - frame.right + inlineInset,
        inlineSize:
          placement === "bottom"
            ? availableWidth
            : `min(var(--miaixz-drawer-width), ${availableWidth}px)`,
        blockSize: placement === "bottom" ? "auto" : availableHeight,
        maxBlockSize: availableHeight,
        "--miaixz-drawer-backdrop-top": `${frame.top}px`,
        "--miaixz-drawer-backdrop-right": `${Math.max(0, frame.viewportWidth - frame.right)}px`,
        "--miaixz-drawer-backdrop-bottom": `${Math.max(0, frame.viewportHeight - frame.bottom)}px`,
        "--miaixz-drawer-backdrop-left": `${frame.left}px`,
      });
    }

    const rootProps = mergeMiaixzSlotProps<
      DrawerOwnerState,
      DrawerRootAttributes,
      HTMLDialogElement
    >({
      ownerState,
      defaultProps: { className: "miaixz-drawer" },
      componentProps: getDrawerNativeProps(props),
      slotProps: slotProps?.root,
      internalRef: dialogRef,
      forwardedRef,
      internalProps: {
        "aria-labelledby": titleId,
        ...(description === undefined ? {} : { "aria-describedby": descriptionId }),
        "data-placement": placement,
        ...(typeof width === "string" ? { "data-width": width } : {}),
        "data-spacing": spacing,
        "data-density": density,
        ...(floating ? { "data-floating": true } : {}),
        ...(positioned ? { "data-positioned": true } : {}),
        onCancel: (event) => {
          event.preventDefault();
          if (closeOnEscape) requestClose("escape");
        },
        onClose: () => {
          if (props.open) requestClose("nativeClose");
        },
        onClick: (event) => {
          if (
            closeOnBackdrop &&
            event.target === event.currentTarget &&
            isDrawerBackdropPoint(event, event.currentTarget)
          ) {
            requestClose("backdrop");
          }
        },
      },
      ownedProps: [
        "aria-labelledby",
        "aria-describedby",
        "data-placement",
        "data-width",
        "data-spacing",
        "data-density",
        "data-floating",
        "data-positioned",
      ],
    });
    const Description = slots?.description ?? "div";

    if (portalTarget === null || (positioned && frame === null)) return null;
    return createPortal(
      <FocusScope active={active} containerRef={dialogRef} restoreFocusRef={restoreFocusRef}>
        <dialog
          {...rootProps}
          style={{ ...rootProps.style, ...geometry }}
          onCancel={(event) => {
            if (event.target !== event.currentTarget) return;
            rootProps.onCancel?.(event);
            event.stopPropagation();
          }}
          onClose={(event) => {
            if (event.target !== event.currentTarget) return;
            rootProps.onClose?.(event);
            event.stopPropagation();
          }}
        >
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-drawer-paper" },
              slotProps: slotProps?.paper,
            })}
          >
            <header
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-drawer-header" },
                slotProps: slotProps?.header,
              })}
            >
              <div className="miaixz-drawer-heading">
                {createElement(
                  `h${headingLevel}`,
                  mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-drawer-title" },
                    slotProps: slotProps?.title,
                    internalProps: { id: titleId },
                    ownedProps: ["id"],
                  }),
                  title,
                )}
                {description !== undefined && (
                  <Description
                    {...mergeMiaixzSlotProps({
                      ownerState,
                      defaultProps: { className: "miaixz-drawer-description" },
                      slotProps: slotProps?.description,
                      internalProps: { id: descriptionId },
                      ownedProps: ["id"],
                    })}
                  >
                    {description}
                  </Description>
                )}
              </div>
              {showClose && (
                <button
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-drawer-close" },
                    slotProps: slotProps?.closeButton,
                    internalProps: {
                      type: "button",
                      "aria-label": resolvedCloseLabel,
                      disabled: closeDisabled,
                      onClick: () => requestClose("closeButton"),
                    },
                    ownedProps: ["type", "aria-label", "disabled"],
                  })}
                >
                  <Icon name="close" size="control" />
                </button>
              )}
            </header>
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-drawer-body" },
                slotProps: slotProps?.content,
              })}
            >
              {children}
            </div>
            {footer !== null && (
              <footer
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-drawer-footer" },
                  slotProps: slotProps?.footer,
                })}
              >
                {footer ?? (
                  <div className="miaixz-form-actions" data-submit-only="true">
                    <div className="miaixz-form-actions-trailing">
                      <button
                        className="miaixz-interactive miaixz-control miaixz-button miaixz-control-medium"
                        data-miaixz-ripple="true"
                        data-size="medium"
                        data-tone="neutral"
                        data-variant="outlined"
                        disabled={closeDisabled}
                        onClick={() => requestClose("closeButton")}
                        type="button"
                      >
                        <span className="miaixz-button-content">
                          <span className="miaixz-button-icon miaixz-button-start-icon">
                            <Icon name="close" size="control" />
                          </span>
                          <span className="miaixz-button-label">{resolvedCloseLabel}</span>
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </footer>
            )}
          </div>
        </dialog>
      </FocusScope>,
      portalTarget,
    );
  }),
);

/**
 * Distinguishes the drawer paper from its native backdrop hit area.
 *
 * @param event - Pointer event received by the native dialog.
 * @param dialog - Native dialog element containing the drawer paper.
 * @returns Whether the pointer coordinates fall outside the rendered paper.
 */
function isDrawerBackdropPoint(
  event: MouseEvent<HTMLDialogElement>,
  dialog: HTMLDialogElement,
): boolean {
  const paper = dialog.firstElementChild?.getBoundingClientRect();
  return (
    paper === undefined ||
    event.clientX < paper.left ||
    event.clientX > paper.right ||
    event.clientY < paper.top ||
    event.clientY > paper.bottom
  );
}
