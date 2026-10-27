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
 * Verifies explicit drawer dismissal and pending-operation protection.
 */

import "@testing-library/jest-dom/vitest";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Drawer } from "../../../src/components/drawer/index.js";
import { MiaixzLocaleProvider, miaixzUiMessages } from "../../../src/i18n/index.js";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function () {
    this.removeAttribute("open");
  };
});
afterEach(cleanup);

describe("explicit drawer dismissal", () => {
  it("preserves the draft through Escape, backdrop, blur and pointer leave", () => {
    const onOpenChange = vi.fn();
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "en-US", messages: miaixzUiMessages })}
      >
        <Drawer open title="Edit" onOpenChange={onOpenChange}>
          <input aria-label="Draft" defaultValue="Unsaved" />
        </Drawer>
      </MiaixzLocaleProvider>,
    );
    const dialog = screen.getByRole("dialog", { name: "Edit" });
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Keep this draft" } });
    fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));
    fireEvent.click(dialog, { clientX: -10, clientY: -10 });
    fireEvent.mouseLeave(dialog);
    fireEvent.blur(dialog);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toHaveValue("Keep this draft");
    const footer = dialog.querySelector("footer")!;
    fireEvent.click(within(footer).getByRole("button"));
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false, "closeButton");
  });

  it("keeps both close buttons visible and disabled until the pending operation ends", () => {
    const onOpenChange = vi.fn();
    const content = (closeDisabled: boolean) => (
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "en-US", messages: miaixzUiMessages })}
      >
        <Drawer
          open
          title="Save"
          closeDisabled={closeDisabled}
          closeOnEscape
          closeOnBackdrop
          onOpenChange={onOpenChange}
        >
          Body
        </Drawer>
      </MiaixzLocaleProvider>
    );
    const { rerender } = render(content(true));
    const dialog = screen.getByRole("dialog", { name: "Save" });
    const buttons = within(dialog).getAllByRole("button");
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button).toBeVisible();
      expect(button).toBeDisabled();
      fireEvent.click(button);
    }
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    fireEvent.click(dialog, { clientX: -10, clientY: -10 });
    expect(onOpenChange).not.toHaveBeenCalled();
    rerender(content(false));
    expect(within(dialog).getAllByRole("button")).toEqual(buttons);
    for (const button of buttons) expect(button).toBeEnabled();
    fireEvent.click(buttons[0]!);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false, "closeButton");
  });

  it("does not add a second footer close action to a supplied footer", () => {
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "en-US", messages: miaixzUiMessages })}
      >
        <Drawer
          open
          title="Custom"
          onOpenChange={vi.fn()}
          footer={<button type="button">Cancel</button>}
        >
          Body
        </Drawer>
      </MiaixzLocaleProvider>,
    );
    const footer = screen.getByRole("dialog").querySelector("footer")!;
    expect(within(footer).getAllByRole("button")).toHaveLength(1);
    expect(within(footer).getByRole("button")).toHaveTextContent("Cancel");
  });
});
