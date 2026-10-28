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
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Select } from "../../../src/components/select/select.js";
import {
  joinIds,
  validateAndFlattenSelectEntries,
} from "../../../src/components/select/select-model.js";
import { getSelectTriggerProps } from "../../../src/components/select/select-view.js";
import type { SelectEntry } from "../../../src/components/select/select.types.js";
import { renderWithLocale } from "../../test-utils.helper.js";

afterEach(cleanup);

const items: readonly SelectEntry[] = [
  { kind: "option", id: "alpha", value: "alpha", label: "Alpha", textValue: "Alpha" },
  {
    kind: "group",
    id: "greek",
    label: "Greek",
    options: [
      { kind: "option", id: "beta", value: "beta", label: "Beta", textValue: "Beta" },
      {
        kind: "option",
        id: "gamma",
        value: "gamma",
        label: "Gamma",
        textValue: "Gamma",
        disabled: true,
      },
    ],
  },
];

describe("Select closed contract", () => {
  it("renders groups and slots, ignores disabled choices, and commits one value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = renderWithLocale(
      <Select
        aria-label="Environment"
        aria-describedby="external-help"
        className="select-custom"
        defaultValue="alpha"
        form="settings-form"
        invalid
        items={items}
        name="environment"
        onValueChange={onValueChange}
        required
        size="large"
        style={{ color: "red" }}
        widthPreset="compact"
        slotProps={{
          root: ({ filled }) => ({ className: filled ? "root-filled" : undefined }),
          trigger: { className: "trigger-slot" },
          value: { className: "value-slot" },
          icon: { className: "icon-slot" },
          listbox: { className: "listbox-slot" },
          group: { className: "group-slot" },
          groupLabel: { className: "group-label-slot" },
          option: ({ open }) => ({ className: open ? "option-open" : undefined }),
          hiddenInput: { className: "hidden-slot" },
          validationMessage: { className: "validation-slot" },
        }}
      />,
    );
    const trigger = screen.getByRole("combobox", { name: "Environment" });
    const root = trigger.closest(".miaixz-select")!;
    expect(root).toHaveClass("select-custom", "root-filled", "miaixz-select-width-compact");
    expect(root).toHaveAttribute("data-size", "large");
    expect(root).toHaveAttribute("data-invalid", "true");
    expect(trigger).toHaveClass("trigger-slot");
    expect(trigger).toHaveAttribute("aria-required", "true");
    expect(trigger).toHaveAttribute("aria-describedby", "external-help");
    expect(container.querySelector<HTMLInputElement>("input.hidden-slot")).toMatchObject({
      name: "environment",
      value: "alpha",
    });

    await user.click(trigger);
    const listbox = screen.getByRole("listbox", { name: "Environment" });
    expect(listbox).toHaveClass("listbox-slot");
    expect(listbox).toHaveAttribute("data-invalid", "true");
    expect(screen.getByRole("group", { name: "Greek" })).toHaveClass("group-slot");
    expect(screen.getByText("Greek")).toHaveClass("group-label-slot");
    const gamma = screen.getByRole("option", { name: "Gamma" });
    expect(gamma).toHaveAttribute("aria-disabled", "true");
    fireEvent.pointerMove(gamma);
    await user.click(gamma);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(listbox).toBeInTheDocument();

    const beta = screen.getByRole("option", { name: "Beta" });
    fireEvent.pointerMove(beta);
    expect(beta).toHaveAttribute("data-state", "active");
    await user.click(beta);
    expect(onValueChange).toHaveBeenCalledWith("beta");
    expect(trigger).toHaveTextContent("Beta");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
  });

  it("opens and closes from every keyboard path and activates the current option", () => {
    const onValueChange = vi.fn();
    renderWithLocale(
      <>
        <Select aria-label="Keyboard select" items={items} onValueChange={onValueChange} />
        <button type="button">After</button>
      </>,
    );
    const trigger = screen.getByRole("combobox", { name: "Keyboard select" });
    fireEvent.keyDown(trigger, { key: "ArrowUp" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: "Home" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(onValueChange).toHaveBeenCalledWith("beta");
    expect(screen.queryByRole("listbox")).toBeNull();

    fireEvent.keyDown(trigger, { key: " " });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.keyDown(trigger, { key: "Tab" });
    expect(screen.queryByRole("listbox")).toBeNull();
    fireEvent.keyDown(trigger, { key: "Unidentified" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("keeps controlled, readonly, and disabled state ownership distinct", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { unmount } = renderWithLocale(
      <Select
        aria-label="Controlled select"
        items={items}
        onValueChange={onValueChange}
        readOnly
        value="alpha"
      />,
    );
    const trigger = screen.getByRole("combobox", { name: "Controlled select" });
    expect(trigger).toHaveAttribute("aria-readonly", "true");
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "Beta" }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger).toHaveTextContent("Alpha");

    unmount();
    renderWithLocale(
      <Select aria-label="Controlled select" disabled items={items} value="alpha" />,
    );
    const disabledTrigger = screen.getByRole("combobox", { name: "Controlled select" });
    expect(disabledTrigger).toBeDisabled();
    await user.click(disabledTrigger);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("resets its value and closes its surface with the owning form", async () => {
    const user = userEvent.setup();
    renderWithLocale(
      <form aria-label="Settings" id="settings">
        <Select
          aria-label="Resettable select"
          defaultValue="alpha"
          form="settings"
          items={items}
          name="resettable"
        />
        <button type="reset">Reset</button>
      </form>,
    );
    const trigger = screen.getByRole("combobox", { name: "Resettable select" });
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "Beta" }));
    expect(trigger).toHaveTextContent("Beta");
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(trigger).toHaveTextContent("Alpha");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("rejects duplicate IDs, empty values, and values outside the collection", () => {
    expect(() => validateAndFlattenSelectEntries([items[0]!, items[0]!])).toThrowError(
      expect.objectContaining({ code: "UI_COLLECTION_DUPLICATE_ID" }),
    );
    expect(() =>
      validateAndFlattenSelectEntries([
        {
          kind: "group",
          id: "same",
          label: "Same",
          options: [
            { kind: "option", id: "same", value: "same", label: "Same", textValue: "Same" },
          ],
        },
      ]),
    ).toThrowError(expect.objectContaining({ code: "UI_COLLECTION_DUPLICATE_ID" }));
    expect(() =>
      validateAndFlattenSelectEntries([
        { kind: "option", id: "empty", value: "", label: "Empty", textValue: "Empty" },
      ]),
    ).toThrowError(expect.objectContaining({ code: "UI_SELECT_EMPTY_OPTION_VALUE" }));
    expect(() =>
      renderWithLocale(<Select aria-label="Invalid" items={items} value="outside" />),
    ).toThrowError(expect.objectContaining({ code: "UI_CONTROLLED_VALUE_INVALID" }));
  });

  it("joins accessible descriptions and removes Select-only trigger properties", () => {
    expect(joinIds(undefined, "", "first", undefined, "second")).toBe("first second");
    expect(joinIds(undefined, "")).toBeUndefined();
    expect(
      getSelectTriggerProps({
        items,
        size: "small",
        invalid: true,
        readOnly: true,
        required: true,
        widthPreset: "compact",
        value: "alpha",
        onValueChange: () => undefined,
        className: "root-only",
        name: "field",
        form: "form",
        "aria-label": "Native trigger",
        title: "Title",
      }),
    ).toEqual({ "aria-label": "Native trigger", title: "Title" });
  });
});
