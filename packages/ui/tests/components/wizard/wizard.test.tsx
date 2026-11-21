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
 * Verifies controlled composition, lazy retention and invalid selections.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useState } from "react";
import { Wizard, WizardPanel } from "../../../src/components/wizard/index.js";
afterEach(cleanup);
const items=[{id:"basics",label:"Basics"},{id:"connection",label:"Connection"}];
it("requests a stable ID and waits for the controlled selection",()=>{
 const select=vi.fn();
 const view=render(<Wizard label="Configuration" items={items} currentStep="basics" onStepChange={select}><WizardPanel stepId="basics">First</WizardPanel><WizardPanel stepId="connection">Second</WizardPanel></Wizard>);
 fireEvent.click(screen.getByRole("button",{name:"Connection"}));
 expect(select).toHaveBeenCalledWith("connection");
 expect(screen.queryByText("Second")).toBeNull();
 view.rerender(<Wizard label="Configuration" items={[...items].reverse()} currentStep="connection"><WizardPanel stepId="basics">First</WizardPanel><WizardPanel stepId="connection">Second</WizardPanel></Wizard>);
 expect(screen.getByText("Second")).toBeVisible();expect(screen.queryByText("First")).toBeNull();
});
it("retains visited drafts but does not eagerly mount unvisited panels",()=>{
 const mounted=vi.fn();
 function Draft(){mounted();return <input aria-label="Draft" defaultValue=""/>;}
 function Fixture(){const [step,setStep]=useState("basics");return <Wizard label="Config" items={items} currentStep={step} onStepChange={setStep}><WizardPanel stepId="basics" keepMounted><input aria-label="Name" defaultValue=""/></WizardPanel><WizardPanel stepId="connection" keepMounted><Draft/></WizardPanel></Wizard>;}
 render(<Fixture/>);expect(mounted).not.toHaveBeenCalled();
 fireEvent.change(screen.getByRole("textbox",{name:"Name"}),{target:{value:"Saved draft"}});
 fireEvent.click(screen.getByRole("button",{name:"Connection"}));
 expect(screen.getByRole("textbox",{name:"Draft"})).toBeVisible();
 const hidden=screen.getByLabelText("Name").closest('[data-step-id]');
 expect(hidden).toHaveAttribute("hidden");expect(hidden).toHaveAttribute("inert");
 fireEvent.click(screen.getByRole("button",{name:"Basics"}));
 expect(screen.getByRole("textbox",{name:"Name"})).toHaveValue("Saved draft");
});
it("rejects duplicate identities and a missing controlled selection",()=>{
 vi.spyOn(console,"error").mockImplementation(()=>undefined);
 expect(()=>render(<Wizard label="Config" items={items} currentStep="missing"/>)).toThrow();
 expect(()=>render(<Wizard label="Config" items={[items[0]!,items[0]!]} currentStep="basics"/>)).toThrow();
});
it("uses the actual container width for the independent Steps orientation",()=>{
 const rect=vi.spyOn(HTMLElement.prototype,"getBoundingClientRect").mockReturnValue({width:400} as DOMRect);
 render(<Wizard label="Config" items={items} currentStep="basics"/>);
 expect(screen.getByRole("list")).toHaveAttribute("data-orientation","horizontal");rect.mockRestore();
});

it("retains the current marker when its legacy state disables navigation", () => {
  render(<Wizard label="Config" items={[{ id: "locked", label: "Locked", status: "disabled" }]} currentStep="locked" onStepChange={() => undefined} />);
  expect(screen.getByRole("button", { name: "Locked" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Locked" })).toHaveAttribute("aria-current", "step");
});
