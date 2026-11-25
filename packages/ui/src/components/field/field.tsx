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
 * Implements the field UI component.
 */

import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { classNames } from "../../shared/class-names.js";
import { MiaixzFieldContext } from "../../shared/field-context.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useStableId } from "../../shared/use-stable-id.js";
import type { FieldOwnerState, FieldProps, FieldRootSlotProps } from "./field.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Connects one nested main control to a label, description, required state, and error.
 *
 * @param props - Field configuration and native root properties.
 * @returns The connected Field structure.
 * @public
 */
function Field({
  label,
  layout = "vertical",
  labelWidth,
  children,
  helperText,
  errorText,
  optionalText,
  required = false,
  invalid,
  disabled = false,
  controlId,
  slotProps,
  className,
  style,
  ...rootProps
}: FieldProps) {
  if (controlId !== undefined && controlId.trim().length === 0) {
    throw new MiaixzUiError({
      code: "UI_FIELD_CONTROL_ID_INVALID",
    });
  }
  const [validationError, setValidationError] = useState<string | null>(null);
  const suppliedErrorExists = errorText !== undefined && errorText !== null;
  if (suppliedErrorExists && invalid === false) {
    throw new MiaixzUiError({
      code: "UI_FIELD_INVALID_CONFLICT",
    });
  }
  const resolvedError = errorText ?? (invalid === false ? null : validationError);
  const errorExists = resolvedError !== undefined && resolvedError !== null;

  const id = useStableId(controlId, "miaixz-field");
  const labelId = `${id}-label`;
  const descriptionId =
    helperText === undefined || helperText === null ? undefined : `${id}-description`;
  const errorId = errorExists ? `${id}-error` : undefined;
  const effectiveInvalid = invalid ?? errorExists;
  const ownerState: FieldOwnerState = { required, invalid: effectiveInvalid, disabled, layout };
  const registeredControlRef = useRef<symbol | null>(null);
  const registerControl = useCallback((token: symbol) => {
    const registered = registeredControlRef.current;
    if (registered !== null && registered !== token) {
      throw new MiaixzUiError({
        code: "UI_FIELD_MULTIPLE_CONTROLS",
      });
    }
    registeredControlRef.current = token;
  }, []);
  const unregisterControl = useCallback((token: symbol) => {
    if (registeredControlRef.current === token) registeredControlRef.current = null;
  }, []);
  const context = useMemo(
    () => ({
      controlId: id,
      labelId,
      descriptionId,
      errorId,
      required,
      invalid: effectiveInvalid,
      disabled,
      reportValidation: setValidationError,
      registerControl,
      unregisterControl,
    }),
    [
      descriptionId,
      disabled,
      effectiveInvalid,
      errorId,
      id,
      labelId,
      registerControl,
      required,
      setValidationError,
      unregisterControl,
    ],
  );

  const mergedRootProps = mergeMiaixzSlotProps<FieldOwnerState, FieldRootSlotProps, HTMLDivElement>(
    {
      ownerState,
      componentProps: {
        ...rootProps,
        className,
        style: {
          ...(labelWidth === undefined ? {} : { "--miaixz-field-label-width": `${labelWidth}px` }),
          ...style,
        } as CSSProperties,
      },
      slotProps: slotProps?.root,
      defaultProps: {
        className: classNames("miaixz-field", effectiveInvalid && "miaixz-field-invalid"),
      },
      internalProps: {
        "data-layout": layout,
        ...(effectiveInvalid ? { "data-invalid": true } : {}),
        ...(disabled ? { "data-disabled": true } : {}),
      },
    },
  );
  const mergedLabelProps = mergeMiaixzSlotProps({
    ownerState,
    slotProps: slotProps?.label,
    defaultProps: { className: "miaixz-field-label" },
    internalProps: { id: labelId, htmlFor: id },
    ownedProps: ["id", "htmlFor"],
  });
  const mergedControlProps = mergeMiaixzSlotProps({
    ownerState,
    slotProps: slotProps?.control,
    defaultProps: { className: "miaixz-field-control" },
  });
  const mergedDescriptionProps = mergeMiaixzSlotProps({
    ownerState,
    slotProps: slotProps?.description,
    defaultProps: { className: "miaixz-field-helper" },
    internalProps: { id: descriptionId },
    ownedProps: ["id"],
  });
  const mergedErrorProps = mergeMiaixzSlotProps({
    ownerState,
    slotProps: slotProps?.error,
    defaultProps: { className: "miaixz-field-error" },
    internalProps: { id: errorId, role: "alert" },
    ownedProps: ["id", "role"],
  });

  return (
    <div {...mergedRootProps}>
      <div className="miaixz-field-label-row">
        <label {...mergedLabelProps}>
          {label}
          {required && (
            <span className="miaixz-field-required" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {!required && optionalText !== undefined && optionalText !== null && (
          <span className="miaixz-field-optional">{optionalText}</span>
        )}
      </div>
      <MiaixzFieldContext.Provider value={context}>
        <div {...mergedControlProps}>{children}</div>
      </MiaixzFieldContext.Provider>
      {descriptionId && <div {...mergedDescriptionProps}>{helperText}</div>}
      {errorId && <div {...mergedErrorProps}>{resolvedError}</div>}
    </div>
  );
}
const ThemedField = withMiaixzThemeComponent("Field", Field);
export { ThemedField as Field };
