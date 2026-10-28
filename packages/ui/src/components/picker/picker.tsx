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
 * Implements the picker UI component.
 */

import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type RefAttributes,
} from "react";
import { createPortal } from "react-dom";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { MiaixzCollectionController } from "../../shared/collection/controller.js";
import {
  MiaixzFieldContext,
  useFieldControl,
  useFieldValidationReporter,
} from "../../shared/field-context.js";
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
import { useFormReset } from "../../shared/use-form-reset.js";
import { useComboboxController } from "../combobox/combobox-controller.js";
import { ComboboxInput } from "../combobox/combobox-input.js";
import { ComboboxListbox } from "../combobox/combobox-listbox.js";
import { ComboboxPopup } from "../combobox/combobox-popup.js";
import type {
  ComboboxOwnerState,
  ComboboxRootAttributes,
  MiaixzOption,
  MiaixzOptionSource,
} from "../combobox/combobox.types.js";
import { emptyPickerValue, validatePickerValue } from "./picker-model.js";
import { PickerSurface } from "./picker-surface.js";
import type { LegacyPickerProps, PickerProps } from "./picker.types.js";
import { renderDefaultValues } from "./picker-view.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Renders the public multiple-value Picker composition.
 *
 * @typeParam Value - Stable option value type.
 * @param props - Closed source, selection, input, and rendering configuration.
 * @param forwardedRef - Forwarded root div reference.
 * @returns A searchable multiple-selection picker.
 */
function PickerImplementation<Value extends string = string>(
  props: LegacyPickerProps<Value>,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const {
    label,
    id,
    name,
    form,
    placeholder,
    emptyMessage,
    loadingMessage,
    errorMessage,
    refineMessage,
    removeMessage,
    searchMessage,
    disabled,
    readOnly: explicitReadOnly = false,
    invalid,
    required,
    renderOption,
    renderValue,
    selectionLimit,
    slotProps,
    className,
    style,
    value,
    defaultValue,
    onValueChange,
    inputValue,
    defaultInputValue,
    onInputValueChange,
    options,
    loadOptions,
    "aria-invalid": ariaInvalid,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    ...nativeRootProps
  } = props;
  if ((options === undefined) === (loadOptions === undefined)) {
    throw new MiaixzUiError({
      code: "UI_OPTIONS_SOURCE_INVALID",
    });
  }
  if (selectionLimit !== undefined && (!Number.isInteger(selectionLimit) || selectionLimit <= 0)) {
    throw new MiaixzUiError({
      code: "UI_SELECTION_LIMIT_INVALID",
    });
  }
  const fieldContext = useContext(MiaixzFieldContext);
  const fieldProps = useFieldControl({
    ...(id === undefined ? {} : { id }),
    ...(required === undefined ? {} : { required }),
    ...(disabled === undefined ? {} : { disabled }),
    ...(invalid === undefined ? {} : { invalid }),
    ...(ariaInvalid === undefined ? {} : { "aria-invalid": ariaInvalid }),
    ...(ariaLabelledBy === undefined ? {} : { "aria-labelledby": ariaLabelledBy }),
    ...(ariaDescribedBy === undefined ? {} : { "aria-describedby": ariaDescribedBy }),
  });
  const { report: reportFieldValidation } = useFieldValidationReporter();
  const [validationInvalid, setValidationInvalid] = useState(false);
  const effectiveDisabled = fieldProps.disabled ?? false;
  const effectiveInvalid = (fieldProps.invalid ?? false) || validationInvalid;
  const valueControlled = "value" in props;
  const initialValue = defaultValue ?? emptyPickerValue;
  validatePickerValue(initialValue, selectionLimit);
  if (value !== undefined) validatePickerValue(value, selectionLimit);
  const valueState = useControlled<readonly MiaixzOption<Value>[]>({
    controlled: valueControlled,
    value,
    defaultValue: initialValue,
    hasDefaultValue: valueControlled && "defaultValue" in props,
    ...(onValueChange === undefined ? {} : { onValueChange }),
    readOnly: true,
  });
  const inputControlled = "inputValue" in props;
  const initialInputValue = defaultInputValue ?? "";
  const inputState = useControlled<string>({
    controlled: inputControlled,
    value: inputValue,
    defaultValue: initialInputValue,
    hasDefaultValue: inputControlled && "defaultInputValue" in props,
    ...(onInputValueChange === undefined ? {} : { onValueChange: onInputValueChange }),
  });
  const selectionReadOnly = explicitReadOnly || valueState.readOnly;
  const selectedValues = useMemo(
    () => new Set(valueState.value.map((option) => option.value)),
    [valueState.value],
  );
  const source: MiaixzOptionSource<Value> =
    options === undefined ? { loadOptions: loadOptions! } : { options };
  const [open, setOpen] = useState(false);
  const data = useComboboxController({ source, query: inputState.value, open });
  const isAtLimit = selectionLimit !== undefined && valueState.value.length >= selectionLimit;
  const [activeValue, setActiveValue] = useState<Value | null>(null);
  const collectionItems = useMemo(
    () =>
      data.options.map((option) => ({
        id: option.value,
        value: option.value,
        textValue: option.textValue,
        disabled:
          option.disabled === true ||
          selectionReadOnly ||
          selectedValues.has(option.value) ||
          isAtLimit,
      })),
    [data.options, isAtLimit, selectedValues, selectionReadOnly],
  );
  const collection = useMemo(
    () => new MiaixzCollectionController(collectionItems, activeValue),
    [activeValue, collectionItems],
  );
  const resolvedActiveValue = open ? (collection.activeId as Value | null) : null;
  const inputRef = useRef<HTMLInputElement>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null);
  const listboxId = useId();
  const generatedLabelId = useId();
  const optionIdPrefix = useId();
  const labelId = fieldProps["aria-labelledby"] ?? generatedLabelId;
  const portalTarget = useMiaixzPortalTarget(rootElement);
  const { t } = useMiaixzLocale();
  const ownerState: ComboboxOwnerState = {
    disabled: effectiveDisabled,
    readOnly: explicitReadOnly,
    invalid: effectiveInvalid,
    open,
    filled: valueState.value.length > 0 || inputState.value.length > 0,
    loading: data.state === "loading",
  };

  const close = useCallback(
    (restoreFocus: boolean) => {
      setOpen(false);
      setActiveValue(null);
      if (restoreFocus) queueMicrotask(() => inputRef.current?.focus({ preventScroll: true }));
    },
    [setActiveValue, setOpen],
  );
  const openListbox = useCallback(() => {
    if (effectiveDisabled) return;
    collection.setActiveId(null);
    setActiveValue(collection.activeId as Value | null);
    setOpen(true);
  }, [collection, effectiveDisabled, setActiveValue, setOpen]);
  const selectOption = useCallback(
    (option: MiaixzOption<Value>) => {
      if (
        selectionReadOnly ||
        option.disabled === true ||
        selectedValues.has(option.value) ||
        isAtLimit
      ) {
        return;
      }
      valueState.setValue([...valueState.value, option]);
      inputState.setValue("");
      setValidationInvalid(false);
      reportFieldValidation(null);
      setOpen(true);
    },
    [inputState, isAtLimit, reportFieldValidation, selectedValues, selectionReadOnly, valueState],
  );
  const removeOption = useCallback(
    (option: MiaixzOption<Value>) => {
      if (selectionReadOnly) return;
      valueState.setValue(valueState.value.filter((candidate) => candidate.value !== option.value));
      setValidationInvalid(false);
      reportFieldValidation(null);
    },
    [reportFieldValidation, selectionReadOnly, valueState],
  );
  const updateInput = useCallback(
    (nextInput: string) => {
      inputState.setValue(nextInput);
      setOpen(true);
    },
    [inputState],
  );
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
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
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          openListbox();
        }
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter"].includes(event.key)) return;
      const result = collection.handleKey(event.key, {
        orientation: "vertical",
        direction: "ltr",
        loop: true,
      });
      if (!result.handled) return;
      event.preventDefault();
      setActiveValue(result.activeId as Value | null);
      if (result.activate && result.activeId !== null) {
        const option = data.options.find((candidate) => candidate.value === result.activeId);
        if (option !== undefined) selectOption(option);
      }
    },
    [close, collection, data.options, open, openListbox, selectOption, setActiveValue],
  );
  useFormReset(inputRef, () => {
    valueState.resetValue(initialValue);
    inputState.resetValue(initialInputValue);
    setValidationInvalid(false);
    reportFieldValidation(null);
    close(false);
  });
  useEffect(() => {
    const input = inputRef.current;
    if (input === null) return undefined;
    const owner = resolveMiaixzFormOwner(input, form);
    if (owner === null) return undefined;
    return registerMiaixzFormValidationControl(owner, {
      element: input,
      validate: () => {
        const nextInvalid =
          !effectiveDisabled && fieldProps.required === true && valueState.value.length === 0;
        setValidationInvalid(nextInvalid);
        reportFieldValidation(nextInvalid ? t("ui.validation.required") : null);
        return !nextInvalid;
      },
      reset: () => {
        setValidationInvalid(false);
        reportFieldValidation(null);
      },
      focus: () => input.focus({ preventScroll: true }),
    });
  }, [effectiveDisabled, fieldProps.required, form, reportFieldValidation, t, valueState.value]);
  useMiaixzManualPopover(surfaceRef, open, portalTarget);
  const activeOptionId =
    open && resolvedActiveValue !== null ? `${optionIdPrefix}-${resolvedActiveValue}` : undefined;
  useMiaixzOptionSurface(controlRef, surfaceRef, open, portalTarget, activeOptionId);
  useMiaixzDismissibleLayer({
    active: open,
    triggerRef: controlRef,
    contentRef: surfaceRef,
    portalTarget,
    onDismiss: () => close(true),
  });

  const rootProps = mergeMiaixzSlotProps<
    ComboboxOwnerState,
    ComboboxRootAttributes,
    HTMLDivElement
  >({
    ownerState,
    defaultProps: { className: "miaixz-picker" },
    componentProps: {
      ...nativeRootProps,
      ...(className === undefined ? {} : { className }),
      ...(style === undefined ? {} : { style }),
    } as HTMLAttributes<HTMLDivElement>,
    slotProps: slotProps?.root,
    internalRef: setRootElement,
    forwardedRef,
    internalProps: {
      "data-state": open ? "open" : "closed",
      ...(effectiveDisabled ? { "data-disabled": true } : {}),
      ...(explicitReadOnly ? { "data-readonly": true } : {}),
      ...(effectiveInvalid ? { "data-invalid": true } : {}),
      ...(ownerState.filled ? { "data-filled": true } : {}),
    },
    ownedProps: ["data-state", "data-disabled", "data-readonly", "data-invalid", "data-filled"],
  });

  const labelProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-picker-label" },
    slotProps: slotProps?.label,
    internalProps: { id: generatedLabelId, htmlFor: fieldProps.id },
    ownedProps: ["id", "htmlFor"],
  });
  const countProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-picker-count" },
    slotProps: slotProps?.count,
    internalProps: { "aria-live": "polite" },
    ownedProps: ["aria-live"],
  });
  const values =
    renderValue?.(valueState.value, {
      remove: removeOption,
      disabled: effectiveDisabled,
      readOnly: selectionReadOnly,
    }) ??
    renderDefaultValues(
      valueState.value,
      ownerState,
      slotProps,
      removeMessage ?? t("ui.action.remove"),
      effectiveDisabled || selectionReadOnly,
      removeOption,
    );

  return (
    <div {...rootProps}>
      {fieldContext === null && <label {...labelProps}>{label}</label>}
      <ComboboxInput
        component="picker"
        inputRef={inputRef}
        controlRef={controlRef}
        id={fieldProps.id}
        form={form}
        required={fieldProps.required === true}
        listboxId={listboxId}
        labelId={labelId}
        describedBy={fieldProps["aria-describedby"]}
        activeOptionId={activeOptionId}
        inputValue={inputState.value}
        placeholder={placeholder ?? searchMessage ?? t("ui.picker.search")}
        ownerState={ownerState}
        inputReadOnly={explicitReadOnly}
        clearable={inputState.value.length > 0 && !explicitReadOnly}
        slotProps={slotProps}
        beforeInput={values}
        afterInput={<output {...countProps}>{valueState.value.length}</output>}
        clearLabel={t("ui.action.remove")}
        toggleLabel={typeof label === "string" ? label : t("ui.picker.search")}
        onOpen={openListbox}
        onToggle={() => {
          if (open) close(false);
          else openListbox();
          inputRef.current?.focus({ preventScroll: true });
        }}
        onClear={() => {
          inputState.setValue("");
          inputRef.current?.focus({ preventScroll: true });
        }}
        onInputValueChange={updateInput}
        onKeyDown={handleKeyDown}
      />
      {name !== undefined &&
        valueState.value.map((option) => {
          const hiddenProps = mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-picker-native" },
            slotProps: slotProps?.hiddenInput,
            internalProps: {
              type: "hidden",
              name,
              value: option.value,
              ...(form === undefined ? {} : { form }),
              disabled: effectiveDisabled,
            },
            ownedProps: ["type", "name", "value", "form", "disabled"],
          });
          return <input key={option.value} {...hiddenProps} />;
        })}
      {open &&
        portalTarget !== null &&
        createPortal(
          <ComboboxPopup
            component="picker"
            surfaceRef={surfaceRef}
            listboxId={listboxId}
            labelId={labelId}
            state={data.state}
            ownerState={ownerState}
            slotProps={slotProps}
            loadingMessage={loadingMessage ?? t("ui.loading")}
            errorMessage={errorMessage ?? t("ui.combobox.loadError")}
            emptyMessage={emptyMessage ?? t("ui.collection.empty")}
            refineMessage={refineMessage ?? t("ui.collection.refineSearch")}
            empty={data.options.length === 0}
            hasNextPage={data.hasNextPage}
            onLoadNextPage={data.loadNextPage}
          >
            <ComboboxListbox
              component="picker"
              id={listboxId}
              labelId={labelId}
              optionIdPrefix={optionIdPrefix}
              options={data.options}
              activeValue={resolvedActiveValue}
              multiple
              ownerState={ownerState}
              slotProps={slotProps}
              renderOption={renderOption}
              isSelected={(option) => selectedValues.has(option.value)}
              isDisabled={(option) =>
                selectionReadOnly ||
                option.disabled === true ||
                selectedValues.has(option.value) ||
                isAtLimit
              }
              onActivate={(option) => {
                setActiveValue(option.value);
              }}
              onSelect={selectOption}
              hasNextPage={data.hasNextPage}
              onLoadNextPage={data.loadNextPage}
            />
          </ComboboxPopup>,
          portalTarget,
        )}
    </div>
  );
}

/**
 * Dispatches legacy and explicitly configured selection contracts without changing their hooks.
 * @param props - Public picker contract.
 * @param ref - Field root reference.
 * @returns The configured picker implementation.
 */
const LegacyPicker = forwardRef(PickerImplementation) as <Value extends string = string>(
  props: LegacyPickerProps<Value> & RefAttributes<HTMLDivElement>,
) => ReactElement;

/**
 * Chooses the explicit or legacy picker implementation.
 * @param props - Public picker configuration.
 * @param ref - Forwarded field root.
 * @returns The selected implementation.
 */
function PickerDispatch<Value extends string = string>(
  props: PickerProps<Value>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  return props.selectionMode === "single" || props.selectionMode === "multiple" ? (
    <PickerSurface {...props} rootRef={ref} />
  ) : (
    <LegacyPicker {...props} ref={ref} />
  );
}

/**
 * Renders a searchable multiple-value WAI-ARIA picker.
 *
 * @public
 */
export const Picker = withMiaixzThemeComponent(
  "Picker",
  forwardRef(PickerDispatch) as <Value extends string = string>(
    props: PickerProps<Value> & RefAttributes<HTMLDivElement>,
  ) => ReactElement,
);
