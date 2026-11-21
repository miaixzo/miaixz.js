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
 * Renders an accessible panel and optionally retains its visited contents.
 */
import { forwardRef, useContext, useState } from "react";
import { MiaixzUiError } from "../../errors/ui-error.js";
import { WizardContext } from "./wizard-context.js";
import type { WizardPanelProps } from "./wizard.types.js";

/**
 * Displays one Wizard panel and optionally retains its visited child state.
 * Inactive retained content is hidden and inert; unvisited content is not mounted.
 *
 * @param props - Stable step identity, retention policy, content and native region attributes.
 * @param ref - Reference to the panel element while it is mounted.
 * @returns The panel region, or null while an unmounted panel is inactive.
 * @throws MiaixzUiError when there is no parent Wizard or stepId is unknown.
 * @public
 */
export const WizardPanel = forwardRef<HTMLDivElement, WizardPanelProps>(function WizardPanel(
  { stepId, keepMounted = false, children, ...props },
  ref,
) {
  const context = useContext(WizardContext);
  const item = context?.items.find((entry) => entry.id === stepId);
  const active = context?.currentStep === stepId;
  const [visited, setVisited] = useState(active);
  if (active && !visited) setVisited(true);
  if (!context || !item) throw new MiaixzUiError({ code: "UI_WIZARD_PANEL_INVALID" });
  if (!active && (!keepMounted || !visited)) return null;
  return (
    <div
      role="region"
      aria-label={typeof item.label === "string" ? item.label : context.label}
      {...props}
      ref={ref}
      hidden={!active}
      inert={!active}
      data-step-id={stepId}
    >
      {children}
    </div>
  );
});
