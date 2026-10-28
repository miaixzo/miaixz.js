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
 * Verifies select contract behavior in the UI package.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Picker } from "../../src/components/picker/picker.js";
import { renderWithLocale } from "../test-utils.helper.js";
const alpha = { value: "alpha", label: "Alpha", textValue: "Alpha" };
const beta = { value: "beta", label: "Beta", textValue: "Beta" };
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(cleanup);
describe("configured Picker", () => {
  for (const presentation of ["popover", "drawer", "dialog", "inline"] as const) {
    it(`stages, cancels and confirms in ${presentation}`, async () => {
      const user = userEvent.setup();
      const changed = vi.fn();
      renderWithLocale(
        <Picker
          label="Choose"
          selectionMode="single"
          presentation={presentation}
          commitMode="confirm"
          defaultValue={alpha}
          options={[alpha, beta]}
          onValueChange={changed}
        />,
      );
      if (presentation !== "inline")
        await user.click(screen.getByRole("button", { name: "Choose", exact: true }));
      await user.click(await screen.findByRole("radio", { name: "Beta" }));
      expect(changed).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "取消" }));
      expect(changed).not.toHaveBeenCalled();
      if (presentation !== "inline")
        await user.click(screen.getByRole("button", { name: "Choose", exact: true }));
      expect(await screen.findByRole("radio", { name: "Alpha" })).toBeChecked();
      await user.click(screen.getByRole("radio", { name: "Beta" }));
      await user.click(screen.getByRole("button", { name: "确认" }));
      expect(changed).toHaveBeenCalledExactlyOnceWith(beta);
    });
  }
  it("unmounts custom content when closed", async () => {
    const user = userEvent.setup();
    const content = vi.fn(() => <span>Custom content</span>);
    renderWithLocale(
      <Picker
        label="Custom"
        selectionMode="single"
        presentation="drawer"
        commitMode="confirm"
        renderContent={content}
      />,
    );
    expect(content).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Custom", exact: true }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(content).not.toHaveBeenCalled();
    expect(await screen.findByText("Custom content")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "取消" }));
    await waitFor(() => expect(screen.queryByText("Custom content")).not.toBeInTheDocument());
  });
  it("enforces the multiple selection limit", async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    renderWithLocale(
      <Picker
        label="Multi"
        selectionMode="multiple"
        presentation="inline"
        options={[alpha, beta]}
        selectionLimit={1}
        onValueChange={changed}
      />,
    );
    await user.click(await screen.findByRole("checkbox", { name: "Alpha" }));
    await user.click(screen.getByRole("checkbox", { name: "Beta" }));
    expect(changed).toHaveBeenCalledExactlyOnceWith([alpha]);
  });
  it("submits committed values and resets defaults", async () => {
    const user = userEvent.setup();
    const { container } = renderWithLocale(
      <form>
        <Picker
          label="Form"
          name="item"
          selectionMode="single"
          presentation="inline"
          commitMode="confirm"
          defaultValue={alpha}
          options={[alpha, beta]}
        />
      </form>,
    );
    const form = container.querySelector("form")!;
    await user.click(await screen.findByRole("radio", { name: "Beta" }));
    expect(new FormData(form).getAll("item")).toEqual(["alpha"]);
    await user.click(screen.getByRole("button", { name: "确认" }));
    expect(new FormData(form).getAll("item")).toEqual(["beta"]);
    fireEvent.reset(form);
    await waitFor(() => expect(new FormData(form).getAll("item")).toEqual(["alpha"]));
  });
  it("keeps controlled fields without callbacks readonly", async () => {
    const user = userEvent.setup();
    renderWithLocale(
      <Picker label="Locked" selectionMode="single" value={alpha} options={[alpha, beta]} />,
    );
    await user.click(screen.getByRole("button", { name: "Locked" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("reports required validity, loading and retry without committing", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const { container } = renderWithLocale(
      <form>
        <Picker
          label="Required"
          required
          name="item"
          selectionMode="single"
          presentation="inline"
          loading
          options={[alpha]}
        />
      </form>,
    );
    expect(container.querySelector("select")!.checkValidity()).toBe(false);
    expect(screen.getByRole("status")).toHaveTextContent("加载中");
    cleanup();
    renderWithLocale(
      <Picker
        label="Retry"
        selectionMode="single"
        presentation="inline"
        errorMessage="Failed"
        onRetry={retry}
      />,
    );
    await user.click(await screen.findByRole("button", { name: "重试" }));
    expect(retry).toHaveBeenCalledOnce();
  });
  it("submits read-only values while excluding disabled values", () => {
    const { container } = renderWithLocale(
      <form>
        <Picker label="Readonly" name="readonly" selectionMode="single" value={alpha} />
        <Picker label="Disabled" name="disabled" selectionMode="single" value={beta} disabled />
      </form>,
    );
    const data = new FormData(container.querySelector("form")!);
    expect(data.getAll("readonly")).toEqual(["alpha"]);
    expect(data.has("disabled")).toBe(false);
  });
});
