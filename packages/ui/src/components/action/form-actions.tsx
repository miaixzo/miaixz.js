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
 * Renders native form submission and cancellation controls with shared action styling.
 */

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Button } from "../button/button.js";
import { Icon } from "@miaixz/icons";
import type {
  FormActionsOwnerState,
  FormActionsProps,
  FormActionsRootAttributes,
} from "./action.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

/**
 * Renders the native cancel and submit controls for a form footer.
 *
 * @param properties - Form action properties.
 * @returns The standardized form footer.
 * @public
 */
function FormActions(properties: FormActionsProps) {
  const { cancel, submit, actions, fixed = false, slotProps } = properties;
  const loading = submit?.loading === true;
  const ownerState: FormActionsOwnerState = { fixed, loading };
  const rootProps = mergeMiaixzSlotProps<
    FormActionsOwnerState,
    FormActionsRootAttributes,
    HTMLDivElement
  >({
    ownerState,
    defaultProps: { className: "miaixz-form-actions" },
    slotProps: slotProps?.root,
    internalProps: {
      ...(fixed ? { "data-fixed": "true" } : {}),
      ...(cancel === undefined ? { "data-submit-only": "true" } : {}),
    },
  });
  const cancelIcon =
    cancel?.icon === undefined ? undefined : <Icon name={cancel.icon} size="control" />;
  const submitIcon =
    submit?.icon === undefined ? undefined : <Icon name={submit.icon} size="control" />;

  return (
    <div {...rootProps}>
      {cancel !== undefined && (
        <Button
          {...cancel.buttonProps}
          {...(cancel.disabled === undefined ? {} : { disabled: cancel.disabled })}
          onClick={cancel.onAction}
          {...(slotProps?.cancel === undefined ? {} : { slotProps: slotProps.cancel })}
          {...(cancelIcon === undefined ? {} : { startIcon: cancelIcon })}
          tone="neutral"
          type="button"
          variant="outlined"
        >
          {cancel.label}
        </Button>
      )}
      {(actions != null || submit !== undefined) && (
        <div className="miaixz-form-actions-trailing">
          {actions}
          {submit !== undefined && (
            <Button
              {...submit.buttonProps}
              {...(submit.disabled === undefined ? {} : { disabled: submit.disabled })}
              {...(submit.loading === undefined ? {} : { loading: submit.loading })}
              {...(slotProps?.submit === undefined ? {} : { slotProps: slotProps.submit })}
              {...(submitIcon === undefined ? {} : { startIcon: submitIcon })}
              tone={submit.tone ?? "brand"}
              type="submit"
              variant="solid"
            >
              {submit.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

const ThemedFormActions = withMiaixzThemeComponent("FormActions", FormActions);
export { ThemedFormActions as FormActions };
