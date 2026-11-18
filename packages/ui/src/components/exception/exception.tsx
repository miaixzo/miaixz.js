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
 * Implements a local, composable exception presentation.
 */

import { createElement, forwardRef, useId } from "react";
import { miaixzUiMessages, useMiaixzOptionalLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";
import { ExceptionIllustration } from "./exception-illustration.js";
import type { ExceptionOwnerState, ExceptionProps } from "./exception.types.js";

/**
 * Shows one failure state without catching errors or depending on an application runtime.
 */
export const Exception = withMiaixzThemeComponent(
  "Exception",
  forwardRef<HTMLElement, ExceptionProps>(function Exception(
    {
      status,
      title,
      description,
      illustration,
      actions,
      background = "none",
      headingLevel = 1,
      showCode = true,
      slotProps,
      ...props
    },
    ref,
  ) {
    const locale = useMiaixzOptionalLocale();
    const generatedId = useId();
    const titleId = `${generatedId}-title`;
    const descriptionId = `${generatedId}-description`;
    const ownerState: ExceptionOwnerState = { status, background, headingLevel, showCode };
    const titleKey = `ui.exception.${status}.title`;
    const descriptionKey =
      status === "unavailable" ? "ui.try.later" : `ui.exception.${status}.description`;
    const resolvedTitle =
      title ?? (locale ? locale.t(titleKey) : miaixzUiMessages["en-US"]?.[titleKey]);
    const resolvedDescription =
      description ??
      (locale ? locale.t(descriptionKey) : miaixzUiMessages["en-US"]?.[descriptionKey]);
    const hasDescription =
      resolvedDescription !== undefined &&
      resolvedDescription !== null &&
      resolvedDescription !== false;
    return (
      <section
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: {
            className: "miaixz-exception",
            "aria-labelledby": titleId,
            ...(hasDescription ? { "aria-describedby": descriptionId } : {}),
          },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { "data-status": status, "data-background": background },
          ownedProps: ["data-status", "data-background"],
        })}
      >
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-exception-background" },
            slotProps: slotProps?.background,
            internalProps: { "aria-hidden": true },
            ownedProps: ["aria-hidden"],
          })}
        />
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-exception-content" },
            slotProps: slotProps?.content,
          })}
        >
          {illustration !== false && illustration !== null && (
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-exception-illustration" },
                slotProps: slotProps?.illustration,
                internalProps: { "aria-hidden": true },
                ownedProps: ["aria-hidden"],
              })}
            >
              {illustration === undefined ? (
                <ExceptionIllustration status={status} />
              ) : (
                illustration
              )}
            </div>
          )}
          {showCode && status !== "unavailable" && (
            <p
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-exception-code" },
                slotProps: slotProps?.code,
              })}
            >
              {status}
            </p>
          )}
          {createElement(
            `h${headingLevel}`,
            mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-exception-title" },
              slotProps: slotProps?.title,
              internalProps: { id: titleId },
              ownedProps: ["id"],
            }),
            resolvedTitle,
          )}
          {hasDescription && (
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-exception-description" },
                slotProps: slotProps?.description,
                internalProps: { id: descriptionId },
                ownedProps: ["id"],
              })}
            >
              {resolvedDescription}
            </div>
          )}
          {actions !== undefined && actions !== null && actions !== false && (
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-exception-actions" },
                slotProps: slotProps?.actions,
              })}
            >
              {actions}
            </div>
          )}
        </div>
      </section>
    );
  }),
);
