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
 * Verifies independent navigation and compatibility of disabled step states.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Steps } from "../../../src/components/steps/index.js";
afterEach(cleanup);
it("retains current status while navigation is globally disabled", () => {
 const select = vi.fn();
 render(<Steps label="Progress" items={[{ id: "a", label: "Basics", status: "current", description: "Enter a name" }]} disabled onStepChange={select} />);
 const button=screen.getByRole("button",{name:"Basics"});
 expect(button).toHaveAccessibleDescription("Enter a name");
 expect(button).toBeDisabled();
 expect(button.closest("li")).toHaveAttribute("aria-current","step");
 fireEvent.click(button);expect(select).not.toHaveBeenCalled();
});
it("separates item availability from progress and preserves legacy disabled status", () => {
 const select=vi.fn();
 render(<Steps label="Progress" items={[{id:"a",label:"Basics",status:"complete",disabled:true},{id:"b",label:"Connection",status:"disabled"},{id:"c",label:"Review"}]} onStepChange={select}/>);
 expect(screen.getByRole("button",{name:"Basics"})).toBeDisabled();
 expect(screen.getByRole("button",{name:"Connection"})).toBeDisabled();
 fireEvent.click(screen.getByRole("button",{name:"Review"}));
 expect(select).toHaveBeenCalledWith(expect.objectContaining({id:"c"}),2);
});
it("keeps noninteractive progress as an ordered list", () => {
 render(<Steps label="Progress" items={[{id:"a",label:"Basics",status:"current"}]} />);
 expect(screen.getByRole("list",{name:"Progress"})).toBeInTheDocument();
 expect(screen.queryByRole("button")).toBeNull();
});
