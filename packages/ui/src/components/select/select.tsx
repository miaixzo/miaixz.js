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
 * Implements the select UI component.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { classNames } from "../../shared/class-names.js";
import { MiaixzCollectionController } from "../../shared/collection/controller.js";
import { useFieldControl, useFieldValidationReporter } from "../../shared/field-context.js";
import {
  registerMiaixzFormValidationControl,
  resolveMiaixzFormOwner,
} from "../../shared/form-validation-registry.js";
import { useMiaixzOptionSurface } from "../../shared/option-surface.js";
import { useMiaixzDismissibleLayer } from "../../shared/overlay/dismissible-layer.js";
import { useMiaixzPortalTarget } from "../../shared/overlay/portal-target.js";
import { useMiaixzManualPopover } from "../../shared/overlay/top-layer.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useControlled } from "../../shared/use-controlled.js";
import { getMiaixzThemeSlotClassNames } from "../../theme/registry.js";
import { useMiaixzThemeComponent } from "../../theme/context.js";
import { Icon } from "@miaixz/icons";
import { emptySelectItems, joinIds, validateAndFlattenSelectEntries } from "./select-model.js";
import type {
  SelectOption,
  SelectOwnerState,
  SelectProps,
  SelectRootAttributes,
  SelectSlot,
} from "./select.types.js";
import { getSelectTriggerProps, renderSelectEntries } from "./select-view.js";

/**
 * Renders the sole single-selection component model.
 *
 * @public
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(props, ref) {
  const theme = useMiaixzThemeComponent("Select");
  const defaults = theme?.defaultProps;
  const items = props.items ?? defaults?.items ?? emptySelectItems;
  const size = props.size ?? defaults?.size ?? "medium";
  const invalid = props.invalid ?? defaults?.invalid;
  const explicitReadOnly = props.readOnly ?? defaults?.readOnly ?? false;
  const required = props.required ?? defaults?.required;
  const disabled = props.disabled ?? defaults?.disabled;
  const widthPreset = props.widthPreset ?? defaults?.widthPreset ?? "fill";
  const form = props.form ?? defaults?.form;
  const name = props.name ?? defaults?.name;
  const onInvalid = props.onInvalid ?? defaults?.onInvalid;
  const controlled =
    "value" in props || (!("defaultValue" in props) && defaults?.value !== undefined);
  const defaultValue = props.defaultValue ?? defaults?.defaultValue ?? "";
  const onValueChange = props.onValueChange ?? defaults?.onValueChange;
  const valueState = useControlled<string>({
    controlled,
    value: props.value ?? defaults?.value,
    defaultValue,
    hasDefaultValue: controlled && "defaultValue" in props,
    ...(onValueChange === undefined ? {} : { onValueChange }),
    readOnly: true,
  });
  const readOnly = explicitReadOnly || valueState.readOnly;
  const { t } = useMiaixzLocale();
  const flatOptions = useMemo(() => validateAndFlattenSelectEntries(items), [items]);
  const selected = flatOptions.find(({ option }) => option.value === valueState.value)?.option;
  if (valueState.value !== "" && selected === undefined) {
    throw new MiaixzUiError({
      code: "UI_CONTROLLED_VALUE_INVALID",
    });
  }

  const fieldProps = useFieldControl({
    ...(props.id === undefined ? {} : { id: props.id }),
    ...(required === undefined ? {} : { required }),
    ...(disabled === undefined ? {} : { disabled }),
    ...(invalid === undefined ? {} : { invalid }),
    ...(props["aria-invalid"] === undefined ? {} : { "aria-invalid": props["aria-invalid"] }),
    ...(props["aria-labelledby"] === undefined
      ? {}
      : { "aria-labelledby": props["aria-labelledby"] }),
    ...(props["aria-describedby"] === undefined
      ? {}
      : { "aria-describedby": props["aria-describedby"] }),
  });
  const { owned: fieldValidationOwned, report: reportFieldValidation } =
    useFieldValidationReporter();
  const effectiveDisabled = fieldProps.disabled ?? false;
  const [validationInvalid, setValidationInvalid] = useState(false);
  const effectiveInvalid = (fieldProps.invalid ?? false) || validationInvalid;
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [rootElement, setRootElement] = useState<HTMLSpanElement | null>(null);
  const controllerRef = useRef(
    new MiaixzCollectionController(flatOptions.map(({ option }) => option)),
  );
  controllerRef.current.updateItems(flatOptions.map(({ option }) => option));
  const listboxId = useId();
  const optionIdPrefix = useId();
  const validationMessageId = useId();
  const portalTarget = useMiaixzPortalTarget(rootElement);
  const setRootRef = useCallback((element: HTMLSpanElement | null) => {
    rootRef.current = element;
    setRootElement(element);
  }, []);
  const ownerState: SelectOwnerState = {
    size,
    invalid: effectiveInvalid,
    disabled: effectiveDisabled,
    readOnly,
    open,
    filled: valueState.value !== "",
    widthPreset,
  };
  /**
   * Resolves theme classes for one select slot using the current owner state.
   *
   * @param slot - Component slot whose theme classes are resolved.
   * @returns Theme class names for the requested select slot.
   */
  const themeClasses = (slot: SelectSlot) => getMiaixzThemeSlotClassNames(theme, ownerState, slot);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    setActiveId(null);
    if (restoreFocus) queueMicrotask(() => triggerRef.current?.focus({ preventScroll: true }));
  }, []);
  const openListbox = useCallback(() => {
    if (effectiveDisabled) return;
    controllerRef.current.setActiveId(selected?.id ?? null);
    setActiveId(controllerRef.current.activeId);
    setOpen(true);
  }, [effectiveDisabled, selected?.id]);
  const choose = useCallback(
    (option: SelectOption) => {
      if (readOnly || option.disabled === true) return;
      close(true);
      valueState.setValue(option.value);
      setValidationInvalid(false);
      reportFieldValidation(null);
    },
    [close, readOnly, reportFieldValidation, valueState],
  );

  useEffect(() => {
    if (valueState.value === "") return;
    setValidationInvalid(false);
    reportFieldValidation(null);
  }, [reportFieldValidation, valueState.value]);
  useEffect(() => {
    const root = rootRef.current;
    if (root === null) return undefined;
    const owner = resolveMiaixzFormOwner(root, form);
    if (owner === null) return undefined;
    return registerMiaixzFormValidationControl(owner, {
      element: triggerRef.current ?? root,
      validate: () => {
        const nextInvalid =
          !effectiveDisabled && fieldProps.required === true && valueState.value === "";
        setValidationInvalid(nextInvalid);
        reportFieldValidation(nextInvalid ? t("ui.select.required") : null);
        if (nextInvalid) onInvalid?.("required");
        return !nextInvalid;
      },
      reset: () => {
        valueState.resetValue(defaultValue);
        setValidationInvalid(false);
        reportFieldValidation(null);
        close(false);
      },
      focus: () => triggerRef.current?.focus({ preventScroll: true }),
    });
  }, [
    close,
    defaultValue,
    effectiveDisabled,
    fieldProps.required,
    form,
    onInvalid,
    reportFieldValidation,
    t,
    valueState,
  ]);

  useMiaixzManualPopover(surfaceRef, open, portalTarget);
  const activeOptionId = open && activeId !== null ? `${optionIdPrefix}-${activeId}` : undefined;
  useMiaixzOptionSurface(rootRef, surfaceRef, open, portalTarget, activeOptionId);
  useMiaixzDismissibleLayer({
    active: open,
    triggerRef,
    contentRef: surfaceRef,
    portalTarget,
    onDismiss: () => close(true),
  });

  /**
   * Handles trigger opening, popup dismissal, listbox navigation, and active-option selection.
   *
   * @param event - Keyboard event whose key and prevented state control navigation.
   * @returns No return value.
   */
  const internalKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key === "Tab" && open) {
      close(false);
      return;
    }
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openListbox();
      }
      return;
    }
    const result = controllerRef.current.handleKey(event.key, {
      orientation: "vertical",
      direction: "ltr",
      loop: true,
    });
    if (!result.handled) return;
    event.preventDefault();
    setActiveId(result.activeId);
    if (result.activate && result.activeId !== null) {
      const option = flatOptions.find(({ option: candidate }) => candidate.id === result.activeId);
      if (option !== undefined) choose(option.option);
    }
  };

  const describedBy = joinIds(
    fieldProps["aria-describedby"],
    validationInvalid && !fieldValidationOwned ? validationMessageId : undefined,
  );
  const rootProps = mergeMiaixzSlotProps<SelectOwnerState, SelectRootAttributes, HTMLSpanElement>({
    ownerState,
    defaultProps: {
      className: classNames(
        "miaixz-control",
        "miaixz-select",
        `miaixz-control-${size}`,
        widthPreset === "compact" && "miaixz-select-width-compact",
      ),
    },
    themeDefaultProps: {
      ...(defaults?.className === undefined ? {} : { className: defaults.className }),
      ...(defaults?.style === undefined ? {} : { style: defaults.style }),
    },
    componentProps: {
      ...(props.className === undefined ? {} : { className: props.className }),
      ...(props.style === undefined ? {} : { style: props.style }),
    },
    themeClassNames: themeClasses("root"),
    slotProps: props.slotProps?.root,
    internalRef: setRootRef,
    internalProps: {
      "data-size": size,
      "data-state": open ? "open" : "closed",
      ...(effectiveInvalid ? { "data-invalid": true } : {}),
      ...(effectiveDisabled ? { "data-disabled": true } : {}),
      ...(readOnly ? { "data-readonly": true } : {}),
      ...(valueState.value !== "" ? { "data-filled": true } : {}),
    },
    ownedProps: [
      "data-size",
      "data-state",
      "data-invalid",
      "data-disabled",
      "data-readonly",
      "data-filled",
    ],
  });
  const triggerProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-select-trigger" },
    themeDefaultProps: getSelectTriggerProps(defaults ?? {}),
    componentProps: getSelectTriggerProps(props),
    themeClassNames: themeClasses("trigger"),
    slotProps: props.slotProps?.trigger,
    internalRef: triggerRef,
    forwardedRef: ref,
    internalProps: {
      id: fieldProps.id,
      type: "button" as const,
      role: "combobox",
      disabled: effectiveDisabled,
      "aria-controls": listboxId,
      "aria-expanded": open,
      "aria-haspopup": "listbox" as const,
      ...(activeOptionId === undefined ? {} : { "aria-activedescendant": activeOptionId }),
      ...(effectiveInvalid ? { "aria-invalid": true } : {}),
      ...(readOnly ? { "aria-readonly": true } : {}),
      ...(fieldProps.required ? { "aria-required": true } : {}),
      ...(fieldProps["aria-labelledby"] === undefined
        ? {}
        : { "aria-labelledby": fieldProps["aria-labelledby"] }),
      ...(describedBy === undefined ? {} : { "aria-describedby": describedBy }),
      onClick: () => (open ? close(false) : openListbox()),
      onKeyDown: internalKeyDown,
    },
    ownedProps: [
      "id",
      "type",
      "role",
      "disabled",
      "aria-controls",
      "aria-expanded",
      "aria-haspopup",
      "aria-activedescendant",
      "aria-invalid",
      "aria-readonly",
      "aria-required",
      "aria-labelledby",
      "aria-describedby",
    ],
  });
  const valueProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-select-value" },
    themeClassNames: themeClasses("value"),
    slotProps: props.slotProps?.value,
  });
  const iconProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-select-indicator" },
    themeClassNames: themeClasses("icon"),
    slotProps: props.slotProps?.icon,
  });
  const hiddenInputProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-select-native" },
    themeClassNames: themeClasses("hiddenInput"),
    slotProps: props.slotProps?.hiddenInput,
    internalProps: {
      type: "hidden",
      value: valueState.value,
      ...(name === undefined ? {} : { name }),
      ...(form === undefined ? {} : { form }),
      disabled: effectiveDisabled,
    },
    ownedProps: ["type", "value", "name", "form", "disabled"],
  });
  const validationProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-hidden" },
    themeClassNames: themeClasses("validationMessage"),
    slotProps: props.slotProps?.validationMessage,
    internalProps: { id: validationMessageId },
    ownedProps: ["id"],
  });
  const listboxProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-select-surface" },
    themeClassNames: themeClasses("listbox"),
    slotProps: props.slotProps?.listbox,
    internalRef: surfaceRef,
    internalProps: {
      id: listboxId,
      ...(effectiveInvalid ? { "data-invalid": true } : {}),
      role: "listbox",
      popover: "manual",
      ...(props["aria-label"] === undefined ? {} : { "aria-label": props["aria-label"] }),
      ...(fieldProps["aria-labelledby"] === undefined
        ? {}
        : { "aria-labelledby": fieldProps["aria-labelledby"] }),
    },
    ownedProps: ["id", "role", "popover", "aria-labelledby"],
  });

  return (
    <span {...rootProps}>
      <input {...hiddenInputProps} />
      <button {...triggerProps}>
        <span {...valueProps}>{selected?.label ?? "\u00a0"}</span>
        <span {...iconProps}>
          <Icon name="chevron-down" size="control" />
        </span>
      </button>
      {validationInvalid && !fieldValidationOwned && (
        <span {...validationProps}>{t("ui.select.required")}</span>
      )}
      {open &&
        portalTarget !== null &&
        createPortal(
          <div {...listboxProps}>
            {renderSelectEntries(
              items,
              valueState.value,
              activeId,
              optionIdPrefix,
              readOnly,
              ownerState,
              props,
              themeClasses,
              setActiveId,
              choose,
            )}
          </div>,
          portalTarget,
        )}
    </span>
  );
});
