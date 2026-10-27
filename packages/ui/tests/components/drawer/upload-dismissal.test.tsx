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
 * Verifies file selection does not dismiss native modal containers.
 */

import "@testing-library/jest-dom/vitest";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Dialog } from "../../../src/components/dialog/index.js";
import { Drawer } from "../../../src/components/drawer/index.js";
import { Dropzone } from "../../../src/components/dropzone/index.js";
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

for (const Modal of [Drawer, Dialog])
  describe(`${Modal.displayName ?? "Native modal"} upload dismissal`, () => {
    it("ignores descendant file cancellation and close events, while preserving its own Escape request", async () => {
      const onOpenChange = vi.fn();
      const onFiles = vi.fn();
      render(
        <MiaixzLocaleProvider
          i18n={createMiaixzI18n({ locale: "en-US", messages: miaixzUiMessages })}
        >
          <Modal open title="Upload" onOpenChange={onOpenChange}>
            <Dropzone label="Choose file" onFiles={onFiles}>
              Choose a file
            </Dropzone>
          </Modal>
        </MiaixzLocaleProvider>,
      );
      const dialog = await screen.findByRole("dialog", { name: "Upload" });
      const input = dialog.querySelector('input[type="file"]')!;
      fireEvent(input, new Event("cancel", { bubbles: true, cancelable: false }));
      fireEvent(input, new Event("close", { bubbles: true }));
      expect(onOpenChange).not.toHaveBeenCalled();
      const file = new File(["hello"], "hello.txt", { type: "text/plain" });
      fireEvent.change(input, { target: { files: [file] } });
      expect(onFiles).toHaveBeenCalledWith([file]);
      expect(onOpenChange).not.toHaveBeenCalled();
      fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true }));
      if (Modal === Drawer) expect(onOpenChange).not.toHaveBeenCalled();
      else expect(onOpenChange).toHaveBeenCalledWith(false, "escape");
    });
  });
