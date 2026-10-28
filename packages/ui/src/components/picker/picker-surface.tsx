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

import { useEffect, useRef, useState, useMemo, useId, type ForwardedRef } from "react";
import { Button } from "../button/button.js";
import { Drawer } from "../drawer/drawer.js";
import { Dialog } from "../dialog/dialog.js";
import { Popover } from "../popover/popover.js";
import {
  useFieldControl,
  useFieldValidationReporter,
  MiaixzFieldContext,
} from "../../shared/field-context.js";
import { validatePickerValue } from "./picker-model.js";
import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import type { MiaixzOption } from "../combobox/combobox.types.js";
import type { PickerSingleProps, PickerConfiguredMultipleProps } from "./picker.types.js";

type Configured<Value extends string> =
  PickerSingleProps<Value> | PickerConfiguredMultipleProps<Value>;

/**
 * Renders container-independent selection with staged confirmation and a shared field frame.
 * @param props - Explicit picker configuration and root reference.
 * @returns A picker field with one active selection surface.
 */
export function PickerSurface<Value extends string>({
  rootRef,
  ...props
}: Configured<Value> & { readonly rootRef: ForwardedRef<HTMLDivElement> }) {
  const { t } = useMiaixzLocale();
  const { report } = useFieldValidationReporter();
  const [validationInvalid, setValidationInvalid] = useState(false);
  const validationRef = useRef<HTMLSelectElement>(null);
  const field = useFieldControl({
    id: props.id,
    disabled: props.disabled,
    required: props.required,
    invalid: props.invalid,
    "aria-invalid": props["aria-invalid"],
    "aria-labelledby": props["aria-labelledby"],
    "aria-describedby": props["aria-describedby"],
  });
  const disabled = field.disabled ?? false;
  const readOnly = props.readOnly === true || ("value" in props && !props.onValueChange);
  const presentation = props.presentation ?? "popover";
  const commitMode = props.commitMode ?? "immediate";
  const [internalValue, setInternalValue] = useState<readonly MiaixzOption<Value>[]>(() =>
    props.selectionMode === "single"
      ? props.defaultValue
        ? [props.defaultValue]
        : []
      : (props.defaultValue ?? []),
  );
  const controlledValue = props.value;
  const controlled = "value" in props;
  const selectionMode = props.selectionMode;
  const current = useMemo<readonly MiaixzOption<Value>[]>(
    () =>
      controlled
        ? selectionMode === "single"
          ? controlledValue
            ? [controlledValue as MiaixzOption<Value>]
            : []
          : (controlledValue as readonly MiaixzOption<Value>[])
        : internalValue,
    [controlledValue, selectionMode, controlled, internalValue],
  );
  const selectionLimit = props.selectionMode === "single" ? 1 : props.selectionLimit;
  if (selectionLimit !== undefined && (!Number.isInteger(selectionLimit) || selectionLimit <= 0)) {
    throw new MiaixzUiError({ code: "UI_SELECTION_LIMIT_INVALID" });
  }
  validatePickerValue(current, selectionLimit);
  const [draft, setDraft] = useState<readonly MiaixzOption<Value>[]>(current);
  const [internalOpen, setInternalOpen] = useState(props.defaultOpen ?? false);
  const open = !disabled && (props.open ?? internalOpen);
  const active = presentation === "inline" || open;
  const [ready, setReady] = useState(false);
  const radioName = useId();
  const controlId = field.id ?? radioName;
  const previousOpen = useRef(false);
  useEffect(() => {
    if (!active) {
      queueMicrotask(() => setReady(false));
      return;
    }
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [active]);
  useEffect(() => {
    if (open && !previousOpen.current) {
      setDraft(current);
      setReady(false);
    }
    if (!open && previousOpen.current && document.activeElement === document.body) {
      document.getElementById(controlId)?.focus({ preventScroll: true });
    }
    previousOpen.current = open;
  }, [open, current, controlId]);
  const setOpen = (next: boolean) => {
    if (disabled || (next && readOnly)) return;
    if (props.open === undefined) setInternalOpen(next);
    props.onOpenChange?.(next);
    if (!next) {
      setReady(false);
    }
  };
  useEffect(() => {
    const form = validationRef.current?.form;
    if (!form) return;
    const reset = () => {
      if (controlled) return;
      const next =
        props.selectionMode === "single"
          ? props.defaultValue
            ? [props.defaultValue]
            : []
          : (props.defaultValue ?? []);
      setValidationInvalid(false);
      report(null);
      setInternalValue(next);
      setDraft(next);
      setValidationInvalid(false);
      if (props.open === undefined) setInternalOpen(false);
    };
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [controlled, props.selectionMode, props.defaultValue, props.open, report]);
  const commit = (next: readonly MiaixzOption<Value>[]) => {
    if (disabled || readOnly) return;
    setValidationInvalid(false);
    report(null);
    setInternalValue(next);
    if (props.selectionMode === "single") props.onValueChange?.(next[0] ?? null);
    else props.onValueChange?.(next);
  };
  const select = (next: readonly MiaixzOption<Value>[]) => {
    if (disabled || readOnly) return;
    if (props.selectionMode === "single" && next.length > 1) return;
    if (
      props.selectionMode === "multiple" &&
      props.selectionLimit !== undefined &&
      next.length > props.selectionLimit
    )
      return;
    if (new Set(next.map((item) => item.value)).size !== next.length) return;
    setDraft(next);
    if (commitMode === "immediate") {
      commit(next);
      if (props.selectionMode === "single" && presentation !== "inline") setOpen(false);
    }
  };
  const selected = commitMode === "confirm" ? draft : current;
  const content = !active ? null : !ready || props.loading ? (
    <p role="status">{props.loadingMessage ?? t("ui.loading")}</p>
  ) : props.errorMessage ? (
    <div role="alert">
      {props.errorMessage}
      {props.onRetry && <Button onClick={props.onRetry}>{t("ui.action.retry")}</Button>}
    </div>
  ) : props.renderContent ? (
    props.selectionMode === "single" ? (
      props.renderContent({
        value: selected[0] ?? null,
        onValueChange: (value) => select(value ? [value] : []),
        disabled,
        readOnly,
      })
    ) : (
      props.renderContent({ value: selected, onValueChange: select, disabled, readOnly })
    )
  ) : (
    <div
      className="miaixz-picker-options"
      role="group"
      aria-label={typeof props.label === "string" ? props.label : undefined}
    >
      {(props.options ?? []).map((option) => (
        <label key={option.value} className="miaixz-picker-option">
          <input
            type={props.selectionMode === "single" ? "radio" : "checkbox"}
            name={props.selectionMode === "single" ? radioName : undefined}
            form={radioName}
            disabled={disabled || readOnly || option.disabled}
            checked={selected.some((item) => item.value === option.value)}
            onChange={(event) =>
              select(
                props.selectionMode === "single"
                  ? [option]
                  : event.currentTarget.checked
                    ? [...selected, option]
                    : selected.filter((item) => item.value !== option.value),
              )
            }
          />
          {option.label}
        </label>
      ))}
    </div>
  );
  const clearAction =
    props.clearable && !field.required ? (
      <Button disabled={disabled || readOnly} onClick={() => select([])}>
        {props.clearLabel ?? t("ui.picker.clear")}
      </Button>
    ) : null;
  const confirmAction =
    commitMode === "confirm" ? (
      <Button
        tone="brand"
        disabled={
          disabled ||
          readOnly ||
          props.loading ||
          Boolean(props.errorMessage) ||
          !ready ||
          (field.required && selected.length === 0)
        }
        onClick={() => {
          commit(draft);
          if (presentation !== "inline") setOpen(false);
        }}
      >
        {props.confirmLabel ?? t("ui.picker.confirm")}
      </Button>
    ) : null;
  const cancelAction = {
    id: "picker.cancel",
    label: props.cancelLabel ?? t("ui.action.cancel"),
    onAction: () => {
      setDraft(current);
      if (presentation !== "inline") setOpen(false);
    },
  };
  const footer =
    presentation === "drawer" ? (
      <div className="miaixz-form-actions">
        <Button id={cancelAction.id} onClick={cancelAction.onAction}>
          {cancelAction.label}
        </Button>
        <div className="miaixz-form-actions-trailing">
          {clearAction}
          {confirmAction}
        </div>
      </div>
    ) : (
      <div className="miaixz-picker-surface-actions">
        {clearAction}
        {commitMode === "confirm" && (
          <Button onClick={cancelAction.onAction}>{cancelAction.label}</Button>
        )}
        {confirmAction}
      </div>
    );
  const body = <MiaixzFieldContext.Provider value={null}>{content}</MiaixzFieldContext.Provider>;
  const children = (
    <>
      {body}
      {footer}
    </>
  );
  const display =
    props.selectionMode === "single"
      ? props.renderValue?.(current[0] ?? null)
      : props.renderValue?.(current);
  const trigger = (
    <button
      type="button"
      id={controlId}
      className={`miaixz-control miaixz-control-${props.size ?? "medium"} miaixz-picker-trigger`}
      data-size={props.size ?? "medium"}
      data-invalid={field.invalid || validationInvalid || undefined}
      data-readonly={readOnly || undefined}
      data-open={open}
      disabled={disabled}
      aria-invalid={field["aria-invalid"] ?? (field.invalid || validationInvalid)}
      aria-labelledby={field["aria-labelledby"]}
      aria-describedby={field["aria-describedby"]}
      aria-label={
        field["aria-labelledby"]
          ? undefined
          : typeof props.label === "string"
            ? props.label
            : undefined
      }
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={presentation === "popover" ? undefined : () => setOpen(true)}
    >
      {display ??
        (current.length
          ? current
              .map((option) => option.label)
              .map((label, index) => <span key={current[index]!.value}>{label}</span>)
          : (props.placeholder ?? props.label))}
    </button>
  );
  return (
    <div ref={rootRef} className={props.className} style={props.style}>
      {presentation === "inline" ? (
        children
      ) : presentation === "popover" ? (
        <Popover
          trigger={trigger}
          popupRole="dialog"
          open={open}
          onOpenChange={setOpen}
          {...(props.placement === undefined ? {} : { placement: props.placement })}
        >
          <div
            className="miaixz-picker-surface"
            aria-label={typeof props.label === "string" ? props.label : undefined}
          >
            {children}
          </div>
        </Popover>
      ) : (
        <>
          {trigger}
          {presentation === "drawer" ? (
            <Drawer
              open={open}
              onOpenChange={setOpen}
              title={props.label}
              footer={footer}
              {...(props.drawerWidth === undefined ? {} : { width: props.drawerWidth })}
            >
              {body}
            </Drawer>
          ) : (
            <Dialog open={open} onOpenChange={setOpen} title={props.label} footer={footer}>
              {body}
            </Dialog>
          )}
        </>
      )}
      <select
        ref={validationRef}
        className="miaixz-picker-native"
        aria-hidden="true"
        tabIndex={-1}
        multiple
        name={props.name}
        form={props.form}
        required={field.required && !readOnly}
        disabled={disabled}
        value={current.map((option) => option.value)}
        onChange={() => undefined}
        onInvalid={(event) => {
          event.preventDefault();
          setValidationInvalid(true);
          report(t("ui.validation.required"));
          document.getElementById(controlId)?.focus();
        }}
      >
        {current.map((option) => (
          <option key={option.value} value={option.value}>
            {option.value}
          </option>
        ))}
      </select>
    </div>
  );
}
