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
 * Implements the dropdown UI component.
 */

import {
  cloneElement,
  forwardRef,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { MiaixzUiError } from "../../errors/ui-error.js";
import { Anchor } from "../../shared/anchor.js";
import { classNames } from "../../shared/class-names.js";
import { validateMiaixzCollectionItems } from "../../shared/collection/controller.js";
import { Icon } from "@miaixz/icons";
import { Popover } from "../popover/popover.js";
import { useMiaixzPopoverContext } from "../popover/context.js";
import type {
  DropdownEntry,
  DropdownPresentation,
  DropdownProps,
  DropdownSubmenuEntry,
  DropdownSubmenuItem,
} from "./dropdown.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Renders one stable data-driven menu with a single permitted submenu depth.
 */
export const Dropdown = withMiaixzThemeComponent(
  "Dropdown",
  forwardRef<HTMLButtonElement, DropdownProps>(function Dropdown(
    {
      label,
      items: suppliedItems,
      trigger,
      surface = "framed",
      density = "standard",
      presentation = "default",
      closing = false,
      slotProps,
      ...props
    },
    ref,
  ) {
    const items = visibleDropdownEntries(suppliedItems);
    validateDropdownEntries(items);
    const initialFocusRef = useRef<"first" | "last">("first");
    const originalKeyDown = trigger.props.onKeyDown;
    const originalClick = trigger.props.onClick;
    const preparedTrigger = cloneElement(trigger, {
      "data-dropdown-presentation": presentation,
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        originalClick?.(event);
        if (!event.defaultPrevented) initialFocusRef.current = "first";
      },
      onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
        originalKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          initialFocusRef.current = event.key === "ArrowUp" ? "last" : "first";
          event.currentTarget.click();
        }
      },
    });
    const contentSlot = slotProps?.content;
    return (
      <Popover
        {...props}
        ref={ref}
        trigger={preparedTrigger}
        popupRole="menu"
        slotProps={{
          ...slotProps,
          content: (ownerState) => {
            const supplied =
              typeof contentSlot === "function" ? contentSlot(ownerState) : contentSlot;
            return {
              ...supplied,
              className: classNames(
                "miaixz-dropdown-content",
                `miaixz-dropdown-surface-${surface}`,
                `miaixz-dropdown-density-${density}`,
                supplied?.className,
              ),
              "data-presentation": presentation,
              ...(closing ? { "data-closing": true } : {}),
              ...(label === undefined ? {} : { "aria-label": label }),
            };
          },
        }}
      >
        <DropdownMenuBehavior initialFocusRef={initialFocusRef}>
          {items.map((entry) => (
            <DropdownEntryView key={entry.id} entry={entry} />
          ))}
        </DropdownMenuBehavior>
      </Popover>
    );
  }),
);

/**
 * Properties accepted by the Dropdown Menu Behavior renderer.
 */
interface DropdownMenuBehaviorProps {
  readonly initialFocusRef: RefObject<"first" | "last">;
  readonly children: ReactNode;
}

/**
 * Installs menu focus, keyboard navigation, and typeahead behavior inside a popover.
 *
 * @param props - Initial focus preference and rendered menu content.
 * @returns Dropdown menu behavior wrapper.
 */
function DropdownMenuBehavior({ initialFocusRef, children }: DropdownMenuBehaviorProps) {
  const popover = useMiaixzPopoverContext();
  const typeaheadRef = useRef({ value: "", recorded: 0 });
  useEffect(() => {
    if (popover === undefined || !popover.open) return undefined;
    const menu = popover.contentRef.current;
    if (menu === null) return undefined;
    queueMicrotask(() => {
      const items = getMenuItems(menu);
      items.forEach((item) => {
        item.tabIndex = -1;
      });
      const target = initialFocusRef.current === "last" ? items.at(-1) : items[0];
      target?.focus({ preventScroll: true });
    });
    /**
     * Handles keyboard navigation only for this menu, excluding nested menu events.
     *
     * @param event - Keyboard event whose key and prevented state control navigation.
     * @returns No return value.
     */
    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.target instanceof Element && event.target.closest('[role="menu"]') !== menu) return;
      handleMenuKeyDown(event, menu, typeaheadRef, (reason) => popover.requestClose(reason));
    };
    menu.addEventListener("keydown", handleKeyDown);
    return () => menu.removeEventListener("keydown", handleKeyDown);
  }, [initialFocusRef, popover]);
  return <>{children}</>;
}

/**
 * Renders one normalized dropdown entry according to its discriminated kind.
 *
 * @param props - Dropdown entry to render.
 * @returns Menu item, group, divider, label, or submenu content.
 */
function DropdownEntryView({ entry }: { readonly entry: DropdownEntry }) {
  const popover = useMiaixzPopoverContext();
  /**
   * Requests popover dismissal after a dropdown item is selected.
   *
   * @returns No return value; does nothing when no popover context is present.
   */
  const close = (): void => popover?.requestClose("selection");
  if (entry.kind === "label") {
    return (
      <div id={entry.id} className="miaixz-dropdown-label">
        {entry.label}
      </div>
    );
  }
  if (entry.kind === "identity") {
    return (
      <div id={entry.id} className="miaixz-dropdown-identity">
        {entry.avatar}
        <span className="miaixz-dropdown-identity-copy">
          <strong className="miaixz-dropdown-identity-title">{entry.title}</strong>
          {entry.meta === undefined ? null : (
            <span className="miaixz-dropdown-identity-meta">{entry.meta}</span>
          )}
        </span>
      </div>
    );
  }
  if (entry.kind === "divider") return <hr id={entry.id} className="miaixz-dropdown-divider" />;
  if (entry.kind === "group") {
    return (
      <div id={entry.id} role="group" aria-label={entry.label} className="miaixz-dropdown-group">
        {entry.items.map((item) => (
          <DropdownEntryView key={item.id} entry={item} />
        ))}
      </div>
    );
  }
  if (entry.kind === "radioGroup") {
    return (
      <div
        id={entry.id}
        role="group"
        aria-label={typeof entry.label === "string" ? entry.label : undefined}
      >
        <div className="miaixz-dropdown-label">{entry.label}</div>
        {entry.options.map((option) => (
          <button
            key={option.id}
            id={option.id}
            role="menuitemradio"
            aria-checked={option.value === entry.value}
            className="miaixz-dropdown-item"
            disabled={option.disabled}
            data-text-value={option.textValue}
            onClick={(event) => {
              entry.onValueChange(option.value, event);
              if (!event.defaultPrevented) close();
            }}
            type="button"
          >
            <span className="miaixz-dropdown-item-copy">
              <span className="miaixz-dropdown-item-label">{option.label}</span>
            </span>
            {option.value === entry.value ? (
              <Icon
                aria-hidden="true"
                name="confirm"
                size="control"
                className="miaixz-dropdown-item-check"
              />
            ) : null}
          </button>
        ))}
      </div>
    );
  }
  if (entry.kind === "submenu") return <DropdownSubmenu entry={entry} />;
  const content = <DropdownEntryContent entry={entry} />;
  const itemClassName = classNames(
    "miaixz-dropdown-item",
    entry.tone === "danger" && "miaixz-dropdown-item-danger",
  );
  if (entry.kind === "link") {
    const originalClick = entry.anchorProps?.onClick;
    return (
      <Anchor
        {...entry.anchorProps}
        id={entry.id}
        role="menuitem"
        className={itemClassName}
        data-text-value={entry.textValue}
        href={entry.href}
        onClick={(event) => {
          originalClick?.(event);
          if (!event.defaultPrevented) close();
        }}
      >
        {content}
      </Anchor>
    );
  }
  if (entry.kind === "checkbox") {
    return (
      <button
        {...entry.buttonProps}
        id={entry.id}
        role="menuitemcheckbox"
        aria-checked={entry.checked}
        className={itemClassName}
        disabled={entry.disabled}
        data-text-value={entry.textValue}
        onClick={(event) => {
          entry.onCheckedChange(!entry.checked, event);
          if (!event.defaultPrevented) close();
        }}
        type="button"
      >
        {content}
        {entry.checked ? (
          <Icon
            aria-hidden="true"
            name="confirm"
            size="control"
            className="miaixz-dropdown-item-check"
          />
        ) : null}
      </button>
    );
  }
  return (
    <button
      {...entry.buttonProps}
      id={entry.id}
      role="menuitem"
      className={itemClassName}
      disabled={entry.disabled}
      data-text-value={entry.textValue}
      onClick={(event) => {
        entry.onAction(event);
        if (!event.defaultPrevented) close();
      }}
      type="button"
    >
      {content}
    </button>
  );
}

/**
 * Renders the shared icon, label, description, and trailing content for an entry.
 *
 * @param props - Presentational dropdown entry.
 * @returns Shared dropdown entry content.
 */
function DropdownEntryContent({ entry }: { readonly entry: DropdownPresentation }) {
  return (
    <>
      {entry.icon === undefined ? null : (
        <span className="miaixz-dropdown-item-icon">{entry.icon}</span>
      )}
      <span className="miaixz-dropdown-item-copy">
        <span className="miaixz-dropdown-item-label">{entry.label}</span>
        {entry.description === undefined ? null : (
          <span className="miaixz-dropdown-item-description">{entry.description}</span>
        )}
      </span>
    </>
  );
}

/**
 * Renders and coordinates one nested dropdown submenu.
 *
 * @param props - Submenu entry and its nested items.
 * @returns Interactive submenu trigger and nested menu.
 */
function DropdownSubmenu({ entry }: { readonly entry: DropdownSubmenuEntry }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const typeaheadRef = useRef({ value: "", recorded: 0 });
  useEffect(() => {
    if (open) {
      queueMicrotask(() => getMenuItems(menuRef.current)[0]?.focus({ preventScroll: true }));
    }
  }, [open]);
  return (
    <div className="miaixz-dropdown-submenu">
      <button
        ref={triggerRef}
        id={entry.id}
        role="menuitem"
        aria-expanded={open}
        aria-haspopup="menu"
        className="miaixz-dropdown-item"
        disabled={entry.disabled}
        data-text-value={entry.textValue}
        data-submenu-trigger="true"
        onClick={(event) => {
          event.preventDefault();
          setOpen((value) => !value);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        type="button"
      >
        <DropdownEntryContent entry={entry} />
        <Icon name="chevron-right" size="control" />
      </button>
      {open ? (
        <div
          ref={menuRef}
          role="menu"
          className="miaixz-dropdown-submenu-content"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              queueMicrotask(() => triggerRef.current?.focus());
              return;
            }
            handleMenuKeyDown(
              event.nativeEvent,
              event.currentTarget,
              typeaheadRef,
              () => undefined,
            );
          }}
        >
          {entry.items.map((item) => (
            <DropdownEntryView key={item.id} entry={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Applies directional navigation, dismissal, and typeahead to a menu key event.
 *
 * @param event - Keyboard event received by the active menu.
 * @param menu - Menu element that owns the active items.
 * @param typeaheadRef - Mutable typeahead buffer and interaction record time.
 * @param close - Callback used to request menu dismissal.
 * @returns Nothing after handling or ignoring the event.
 */
function handleMenuKeyDown(
  event: globalThis.KeyboardEvent,
  menu: HTMLElement,
  typeaheadRef: RefObject<{ value: string; recorded: number }>,
  close: (reason: "escape" | "outsidePress") => void,
): void {
  const items = getMenuItems(menu);
  const current = items.indexOf(menu.ownerDocument.activeElement as HTMLElement);
  let next: number | undefined;
  if (items.length > 0) {
    if (event.key === "ArrowDown") next = (current + 1) % items.length;
    if (event.key === "ArrowUp") next = (current - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
  }
  if (next !== undefined && items[next] !== undefined) {
    event.preventDefault();
    items[next]?.focus({ preventScroll: true });
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    close("escape");
    return;
  }
  if (event.key === "Tab") {
    close("outsidePress");
    return;
  }
  if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
    const recorded = Date.now();
    const state = typeaheadRef.current;
    state.value = `${recorded - state.recorded <= 500 ? state.value : ""}${event.key.toLocaleLowerCase()}`;
    state.recorded = recorded;
    const start = Math.max(0, current + 1);
    const ordered = [...items.slice(start), ...items.slice(0, start)];
    const match = ordered.find((item) =>
      item.dataset.textValue?.trim().toLocaleLowerCase().startsWith(state.value),
    );
    if (match !== undefined) {
      event.preventDefault();
      match.focus({ preventScroll: true });
    }
  }
}

/**
 * Returns enabled menu items owned directly by the supplied menu.
 *
 * @param menu - Menu element to inspect, or null before mounting.
 * @returns Enabled direct menu items in document order.
 */
function getMenuItems(menu: HTMLElement | null): HTMLElement[] {
  if (menu === null) return [];
  return Array.from(
    menu.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
    ),
  ).filter(
    (item) =>
      item.closest('[role="menu"]') === menu &&
      !item.hasAttribute("disabled") &&
      item.getAttribute("aria-disabled") !== "true",
  );
}

/**
 * Validates top-level dropdown identifiers, values, and nested collections.
 *
 * @param entries - Dropdown entries to validate.
 * @returns Nothing after validation.
 * @throws MiaixzUiError when a collection identifier or controlled value is invalid.
 */
function validateDropdownEntries(entries: readonly DropdownEntry[]): void {
  validateMiaixzCollectionItems(
    entries.map((entry) => ({
      id: entry.id,
      textValue: "textValue" in entry ? entry.textValue : "",
      disabled:
        entry.kind === "label" ||
        entry.kind === "divider" ||
        entry.kind === "group" ||
        entry.kind === "radioGroup"
          ? true
          : entry.kind === "identity"
            ? true
            : entry.disabled,
    })),
  );
  for (const entry of entries) {
    if (entry.kind === "group") validateDropdownSubmenuItems(entry.items);
    if (entry.kind === "submenu") validateDropdownSubmenuItems(entry.items);
    if (entry.kind === "radioGroup") {
      validateMiaixzCollectionItems(
        entry.options.map((option) => ({
          id: option.id,
          value: option.value,
          textValue: option.textValue,
          disabled: option.disabled,
        })),
      );
      if (!entry.options.some((option) => option.value === entry.value)) {
        throw new MiaixzUiError({
          code: "UI_CONTROLLED_VALUE_INVALID",
        });
      }
    }
  }
}

/**
 * Validates entries belonging to a nested submenu.
 *
 * @param entries - Submenu entries to validate.
 * @returns Nothing after validation.
 */
function validateDropdownSubmenuItems(entries: readonly DropdownSubmenuItem[]): void {
  validateDropdownEntries(entries);
}

/**
 * Removes unavailable declarations before menu validation and navigation.
 *
 * @param entries - Caller-supplied menu declarations.
 * @returns Available entries and nonempty submenus in their original order.
 */
function visibleDropdownEntries(entries: readonly DropdownEntry[]): DropdownEntry[] {
  return entries.flatMap((entry): DropdownEntry[] => {
    if ("hidden" in entry && entry.hidden) return [];
    if ("items" in entry && entry.items) {
      const items = entry.items.filter((item) => !("hidden" in item && item.hidden));
      if (!items.length) return [];
      return [{ ...entry, items } as DropdownEntry];
    }
    return [entry];
  });
}
