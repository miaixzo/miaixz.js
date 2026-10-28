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
 * Implements the dialog UI component.
 */

import { createElement, forwardRef, useId, useRef, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import { FocusScope } from "../../accessibility/focus-scope.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { useMiaixzNativeModal } from "../../shared/overlay/native-modal.js";
import { useMiaixzPortalTarget } from "../../shared/overlay/portal-target.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useMiaixzLayoutEffect } from "../../shared/use-client-layout-effect.js";
import { getMiaixzThemeSlotClassNames } from "../../theme/registry.js";
import { useMiaixzThemeComponent } from "../../theme/context.js";
import { Icon } from "@miaixz/icons";
import type {
  DialogCloseReason,
  DialogOwnerState,
  DialogProps,
  DialogRootAttributes,
  DialogSlot,
  DialogSlotProps,
} from "./dialog.types.js";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Removes component-owned fields before root native properties are merged.
 *
 * @param props - Dialog properties to separate.
 * @returns Native dialog root attributes.
 */
function getDialogNativeProps(props: Partial<DialogProps>): Partial<DialogRootAttributes> {
  const {
    open: _open,
    onOpenChange: _onOpenChange,
    title: _title,
    description: _description,
    children: _children,
    footer: _footer,
    headingLevel: _headingLevel,
    size: _size,
    scroll: _scroll,
    showClose: _showClose,
    closeOnBackdrop: _closeOnBackdrop,
    closeLabel: _closeLabel,
    initialFocusRef: _initialFocusRef,
    slots: _slots,
    slotProps: _slotProps,
    ...nativeProps
  } = props;
  return nativeProps;
}

/**
 * Returns whether an element is an eligible explicit modal focus target.
 *
 * @param element - Candidate initial-focus element.
 * @param paper - Dialog paper that must contain the candidate.
 * @returns Whether the candidate is connected, enabled, visible to focus, and inside the dialog.
 */
function isEligibleInitialFocus(element: HTMLElement, paper: HTMLElement): boolean {
  return (
    element.isConnected &&
    paper.contains(element) &&
    !element.hasAttribute("disabled") &&
    element.closest("[inert]") === null &&
    element.matches(focusableSelector)
  );
}

/**
 * Resolves Theme default slot props against the same effective owner state.
 *
 * @typeParam Key - Dialog slot key being resolved.
 * @param slotProps - Dialog slot properties or callbacks.
 * @param key - Slot key to resolve.
 * @param ownerState - Effective dialog owner state.
 * @returns Resolved non-callback slot properties when configured.
 */
function resolveThemeSlotProps<Key extends keyof DialogSlotProps>(
  slotProps: DialogSlotProps | undefined,
  key: Key,
  ownerState: DialogOwnerState,
): Exclude<DialogSlotProps[Key], Function> | undefined {
  const value = slotProps?.[key];
  return (typeof value === "function" ? value(ownerState) : value) as
    Exclude<DialogSlotProps[Key], Function> | undefined;
}

/**
 * Renders a controlled native modal dialog with a single focus and dismissal model.
 */
export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(
  function Dialog(props, forwardedRef) {
    const theme = useMiaixzThemeComponent("Dialog");
    const defaults = theme?.defaultProps;
    const open = props.open;
    const title = props.title ?? defaults?.title;
    const description = props.description ?? defaults?.description;
    const children = props.children ?? defaults?.children;
    const footer = props.footer ?? defaults?.footer;
    const headingLevel = props.headingLevel ?? defaults?.headingLevel ?? 2;
    const size = props.size ?? defaults?.size ?? "medium";
    const scroll = props.scroll ?? defaults?.scroll ?? "paper";
    const showClose = props.showClose ?? defaults?.showClose ?? true;
    const closeOnBackdrop = props.closeOnBackdrop ?? defaults?.closeOnBackdrop ?? true;
    const onOpenChange = props.onOpenChange ?? defaults?.onOpenChange;
    const { t } = useMiaixzLocale();
    const closeLabel = props.closeLabel ?? defaults?.closeLabel ?? t("ui.dialog.close");
    const initialFocusRef = props.initialFocusRef ?? defaults?.initialFocusRef;
    const slots = props.slots ?? defaults?.slots;
    const slotProps = props.slotProps;
    const themeSlotProps = defaults?.slotProps;
    const ownerState: DialogOwnerState = { size, scroll, open, showClose };
    /**
     * Resolves theme classes for one dialog slot using the current owner state.
     *
     * @param slot - Component slot whose theme classes are resolved.
     * @returns Theme class names for the requested dialog slot.
     */
    const themeClasses = (slot: DialogSlot) =>
      getMiaixzThemeSlotClassNames(theme, ownerState, slot);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const paperRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const resolvedInitialFocusRef = useRef<HTMLElement>(null);
    const titleId = useId();
    const descriptionId = useId();
    const portalTarget = useMiaixzPortalTarget();

    /**
     * Reports a dialog close request with the originating dismissal reason.
     *
     * @param reason - User action responsible for the requested state change.
     * @returns No return value.
     */
    const requestClose = (reason: DialogCloseReason): void => onOpenChange(false, reason);
    const restoreFocusRef = useMiaixzNativeModal(dialogRef, open, portalTarget);

    useMiaixzLayoutEffect(() => {
      if (!open) return;
      const paper = paperRef.current;
      if (paper === null) return;
      const requested = initialFocusRef?.current;
      if (
        requested !== null &&
        requested !== undefined &&
        isEligibleInitialFocus(requested, paper)
      ) {
        resolvedInitialFocusRef.current = requested;
        return;
      }
      const closeButton = closeButtonRef.current;
      if (closeButton !== null && isEligibleInitialFocus(closeButton, paper)) {
        resolvedInitialFocusRef.current = closeButton;
        return;
      }
      resolvedInitialFocusRef.current =
        paper.querySelector<HTMLElement>(focusableSelector) ?? paper;
    }, [initialFocusRef, open, showClose]);

    const rootProps = mergeMiaixzSlotProps<
      DialogOwnerState,
      DialogRootAttributes,
      HTMLDialogElement
    >({
      ownerState,
      defaultProps: { className: "miaixz-dialog" },
      componentProps: getDialogNativeProps(props),
      themeClassNames: themeClasses("root"),
      themeDefaultProps: {
        ...getDialogNativeProps(defaults ?? {}),
        ...resolveThemeSlotProps(themeSlotProps, "root", ownerState),
      },
      slotProps: slotProps?.root,
      internalRef: dialogRef,
      forwardedRef,
      internalProps: {
        "aria-labelledby": titleId,
        ...(description === undefined ? {} : { "aria-describedby": descriptionId }),
        "data-size": size,
        "data-scroll": scroll,
        onCancel: (event) => {
          event.preventDefault();
          requestClose("escape");
        },
        onClose: () => {
          if (props.open) requestClose("nativeClose");
        },
        onClick: (event) => {
          if (
            closeOnBackdrop &&
            event.target === event.currentTarget &&
            isBackdropPoint(event, event.currentTarget)
          ) {
            requestClose("backdrop");
          }
        },
      },
      ownedProps: ["aria-labelledby", "aria-describedby", "data-size", "data-scroll"],
    });
    const paperProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-dialog-paper" },
      themeDefaultProps: resolveThemeSlotProps(themeSlotProps, "paper", ownerState),
      themeClassNames: themeClasses("paper"),
      slotProps: slotProps?.paper,
      internalRef: paperRef,
      internalProps: { tabIndex: -1 },
      ownedProps: ["tabIndex"],
    });
    const Description = slots?.description ?? "div";

    if (portalTarget === null) return null;
    return createPortal(
      <FocusScope
        active={open}
        containerRef={dialogRef}
        initialFocusRef={resolvedInitialFocusRef}
        restoreFocusRef={restoreFocusRef}
      >
        <dialog
          {...rootProps}
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
          <div {...paperProps}>
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-dialog-header" },
                themeDefaultProps: resolveThemeSlotProps(themeSlotProps, "header", ownerState),
                themeClassNames: themeClasses("header"),
                slotProps: slotProps?.header,
              })}
            >
              <div className="miaixz-dialog-heading">
                {createElement(
                  `h${headingLevel}`,
                  mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-dialog-title" },
                    themeDefaultProps: resolveThemeSlotProps(themeSlotProps, "title", ownerState),
                    themeClassNames: themeClasses("title"),
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
                      defaultProps: { className: "miaixz-dialog-description" },
                      themeDefaultProps: resolveThemeSlotProps(
                        themeSlotProps,
                        "description",
                        ownerState,
                      ),
                      themeClassNames: themeClasses("description"),
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
                    defaultProps: { className: "miaixz-dialog-close" },
                    themeDefaultProps: resolveThemeSlotProps(
                      themeSlotProps,
                      "closeButton",
                      ownerState,
                    ),
                    themeClassNames: themeClasses("closeButton"),
                    slotProps: slotProps?.closeButton,
                    internalRef: closeButtonRef,
                    internalProps: {
                      type: "button",
                      "aria-label": closeLabel,
                      onClick: () => requestClose("closeButton"),
                    },
                    ownedProps: ["type", "aria-label"],
                  })}
                >
                  <Icon name="close" size="control" />
                </button>
              )}
            </div>
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-dialog-body" },
                themeDefaultProps: resolveThemeSlotProps(themeSlotProps, "content", ownerState),
                themeClassNames: themeClasses("content"),
                slotProps: slotProps?.content,
              })}
            >
              {children}
            </div>
            {footer !== undefined && (
              <div
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-dialog-footer" },
                  themeDefaultProps: resolveThemeSlotProps(themeSlotProps, "actions", ownerState),
                  themeClassNames: themeClasses("actions"),
                  slotProps: slotProps?.actions,
                })}
              >
                {footer}
              </div>
            )}
          </div>
        </dialog>
      </FocusScope>,
      portalTarget,
    );
  },
);

/**
 * Distinguishes the rendered paper from the native dialog backdrop hit area.
 *
 * @param event - Pointer event received by the native dialog.
 * @param dialog - Native dialog element containing the paper.
 * @returns Whether the pointer coordinates fall outside the rendered paper.
 */
function isBackdropPoint(event: MouseEvent<HTMLDialogElement>, dialog: HTMLDialogElement): boolean {
  const paper = dialog.firstElementChild?.getBoundingClientRect();
  return (
    paper === undefined ||
    event.clientX < paper.left ||
    event.clientX > paper.right ||
    event.clientY < paper.top ||
    event.clientY > paper.bottom
  );
}
