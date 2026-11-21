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
 * Composes the independent Steps navigation with controlled workflow regions.
 */
import { forwardRef, useRef, useState } from "react";
import { MiaixzUiError } from "../../errors/ui-error.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useMiaixzLayoutEffect } from "../../shared/use-client-layout-effect.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";
import { Steps } from "../steps/steps.js";
import { WizardContext } from "./wizard-context.js";
import type { WizardOwnerState, WizardProps, WizardSlot } from "./wizard.types.js";

/**
 * Composes Steps with feedback, scrolling content and optional footer regions.
 * The caller owns validation, business effects and the controlled currentStep identity.
 * Step changes reset content scrolling and restore focus when focus left a removed panel.
 *
 * @param props - Controlled selection, step metadata, region content and native root attributes.
 * @param ref - Reference to the root container, merged with the public root slot reference.
 * @returns The themed Wizard composition, with an independently reusable Steps navigation.
 * @throws MiaixzUiError when identities are empty, duplicated or exclude currentStep.
 * @example
 * ```tsx
 * <Wizard label="Setup" items={items} currentStep={step} onStepChange={setStep}>
 *   <WizardPanel stepId="connection" keepMounted><ConnectionForm /></WizardPanel>
 * </Wizard>
 * ```
 * @public
 */
export const Wizard = withMiaixzThemeComponent(
  "Wizard",
  forwardRef<HTMLDivElement, WizardProps>(function Wizard(
    {
      label,
      items,
      currentStep,
      onStepChange,
      disabled = false,
      feedback,
      footer,
      children,
      slotProps,
      ...props
    },
    ref,
  ) {
    const root = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const previousStep = useRef(currentStep);
    const [narrow, setNarrow] = useState(false);
    const ids = new Set(items.map((item) => item.id));
    if (ids.size !== items.length || items.some((item) => !item.id.trim()) || !ids.has(currentStep))
      throw new MiaixzUiError({ code: "UI_WIZARD_STEPS_INVALID" });
    useMiaixzLayoutEffect(() => {
      const element = root.current;
      if (!element) return;
      const update = () => setNarrow(element.getBoundingClientRect().width <= 740);
      update();
      const Observer = element.ownerDocument.defaultView?.ResizeObserver;
      const observer = Observer ? new Observer(update) : undefined;
      observer?.observe(element);
      return () => observer?.disconnect();
    }, []);
    useMiaixzLayoutEffect(() => {
      if (previousStep.current === currentStep) return;
      previousStep.current = currentStep;
      const element = content.current;
      if (!element) return;
      element.scrollTop = 0;
      /**
       * Preserve navigation focus while moving focus out of a departing panel.
       */
      if (
        element.contains(element.ownerDocument.activeElement) ||
        element.ownerDocument.activeElement === element.ownerDocument.body
      )
        element.focus({ preventScroll: true });
    }, [currentStep]);
    const state: WizardOwnerState = {
      currentStep,
      disabled,
      orientation: narrow ? "horizontal" : "vertical",
    };
    const region = (slot: WizardSlot) =>
      mergeMiaixzSlotProps({
        ownerState: state,
        defaultProps: { className: `miaixz-wizard-${slot}` },
        slotProps: slotProps?.[slot],
        ...(slot === "content" ? { forwardedRef: content, internalProps: { tabIndex: -1 } } : {}),
      });
    return (
      <WizardContext.Provider value={{ currentStep, items, label }}>
        <div
          {...mergeMiaixzSlotProps({
            ownerState: state,
            defaultProps: { className: "miaixz-wizard" },
            componentProps: props,
            slotProps: slotProps?.root,
            forwardedRef: (node: HTMLDivElement | null) => {
              root.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            },
          })}
        >
          <div className="miaixz-wizard-layout">
            <div {...region("navigation")}>
              <Steps
                label={label}
                items={items.map((item) => ({
                  ...item,
                  ...(item.status === "disabled" ? { disabled: true } : {}),
                  ...(item.id === currentStep ? { status: "current" as const } : {}),
                }))}
                orientation={state.orientation}
                connector={false}
                disabled={disabled}
                {...(onStepChange ? { onStepChange: (item) => onStepChange(item.id) } : {})}
              />
            </div>
            <div className="miaixz-wizard-main">
              {feedback != null && <div {...region("feedback")}>{feedback}</div>}
              <div {...region("content")}>{children}</div>
              {footer != null && <div {...region("footer")}>{footer}</div>}
            </div>
          </div>
        </div>
      </WizardContext.Provider>
    );
  }),
);
