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
 * Connects native constraint validation to the Miaixz Field and form protocols.
 */

import { useState, type RefObject } from "react";

import { miaixzUiMessages, useMiaixzOptionalLocale } from "../i18n/i18n.js";
import { useFieldValidationReporter } from "./field-context.js";
import {
  registerMiaixzFormValidationControl,
  resolveMiaixzFormOwner,
} from "./form-validation-registry.js";
import { useMiaixzLayoutEffect } from "./use-client-layout-effect.js";

type MiaixzNativeValidationControl = HTMLInputElement | HTMLTextAreaElement;

/**
 * Resolves one stable localized message from a native validity state.
 *
 * @param validity Native constraint-validation result.
 * @param translate Active UI message translator.
 * @returns Localized validation feedback, or null for valid input.
 */
function resolveValidationMessage(
  validity: ValidityState,
  translate: (key: string) => string,
): string | null {
  if (validity.valid) return null;
  if (validity.valueMissing) return translate("ui.validation.required");
  if (validity.typeMismatch) return translate("ui.validation.typeMismatch");
  if (validity.patternMismatch) return translate("ui.validation.patternMismatch");
  if (validity.tooShort) return translate("ui.validation.tooShort");
  if (validity.tooLong) return translate("ui.validation.tooLong");
  if (validity.rangeUnderflow || validity.rangeOverflow) return translate("ui.validation.range");
  if (validity.stepMismatch) return translate("ui.validation.stepMismatch");
  if (validity.badInput) return translate("ui.validation.badInput");
  return translate("ui.validation.invalid");
}

/**
 * Resolves the built-in English validation message outside a locale provider.
 *
 * @param key UI validation message key.
 * @returns Built-in English message.
 */
function translateDefaultValidationMessage(key: string): string {
  const message = miaixzUiMessages["en-US"]?.[key];
  return typeof message === "string" ? message : "Check this field";
}

/**
 * Registers a native input with its form and reports validation through its Field.
 *
 * @param controlRef Mounted native input or textarea.
 * @param formId Optional explicit native form owner.
 * @returns Whether component-owned native validation currently fails.
 * @internal
 */
export function useMiaixzNativeFormValidation(
  controlRef: RefObject<MiaixzNativeValidationControl | null>,
  formId?: string,
): boolean {
  const locale = useMiaixzOptionalLocale();
  const translate = locale?.t ?? translateDefaultValidationMessage;
  const { report: reportFieldValidation } = useFieldValidationReporter();
  const [invalid, setInvalid] = useState(false);

  useMiaixzLayoutEffect(() => {
    const control = controlRef.current;
    if (control === null) return undefined;
    const form = resolveMiaixzFormOwner(control, formId);
    if (form === null) return undefined;
    const clear = () => {
      setInvalid(false);
      reportFieldValidation(null);
    };
    const validate = () => {
      const message = resolveValidationMessage(control.validity, translate);
      const nextInvalid = message !== null;
      setInvalid(nextInvalid);
      reportFieldValidation(message);
      return !nextInvalid;
    };
    control.addEventListener("input", clear);
    control.addEventListener("change", clear);
    const unregister = registerMiaixzFormValidationControl(form, {
      element: control,
      validate,
      reset: clear,
      focus: () => control.focus({ preventScroll: true }),
    });
    return () => {
      control.removeEventListener("input", clear);
      control.removeEventListener("change", clear);
      unregister();
      reportFieldValidation(null);
    };
  }, [controlRef, formId, reportFieldValidation, translate]);

  return invalid;
}
