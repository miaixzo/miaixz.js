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
 * Verifies that configuration adaptation preserves native behavior and form ownership.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  adaptButton,
  adaptCommand,
  adaptFormCancel,
  adaptFormSubmit,
  adaptMenu,
  adaptNavigation,
  FormActions,
  ActionBar,
  RowActions,
} from "../../../src/components/action/index.js";
import { renderWithLocale as render } from "../../test-utils.helper.js";
afterEach(cleanup);
it("adapts arbitrary resolved labels without registering a business operation", () => {
  const handler = vi.fn();
  const display = {
    label: "Customer-defined operation",
    icon: "save" as const,
    tone: "danger" as const,
  };
  const action = adaptCommand(display, {
    id: "customer.operation",
    kind: "command",
    onAction: handler,
  });
  expect(action.label).toBe(display.label);
  expect(handler).not.toHaveBeenCalled();
  expect(adaptButton(display).tone).toBe("danger");
  expect(adaptMenu(display).textValue).toBe(display.label);
  expect(
    adaptNavigation(display, { id: "route", kind: "navigation", href: "/customer" }).href,
  ).toBe("/customer");
  expect(() => adaptButton({ label: " " })).toThrow();
});
it("submits the associated native form exactly once and keeps cancel separate", () => {
  const submit = vi.fn((e) => e.preventDefault());
  const cancel = vi.fn();
  render(
    <>
      <form id="editor" onSubmit={submit} />
      <FormActions
        submit={adaptFormSubmit(
          { label: "Persist" },
          { id: "save", buttonProps: { form: "editor" } },
        )}
        cancel={adaptFormCancel({ label: "Dismiss" }, { id: "cancel", onAction: cancel })}
      />
    </>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Persist" }));
  expect(submit).toHaveBeenCalledTimes(1);
  expect(cancel).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(submit).toHaveBeenCalledTimes(1);
});

it("omits unavailable actions before overflow and measurement", () => {
  const hidden = { id: "missing", kind: "command" as const, label: "", hidden: true, onAction: vi.fn() };
  render(<><ActionBar primary={hidden} actions={[hidden]} /><RowActions actions={[hidden]} /></>);
  expect(screen.queryByRole("button")).toBeNull();
});

it("keeps behavior identity and navigation semantics separate from presentation objects", () => {
  const display = { label: "Help", kind: "interface", id: "control", onAction: () => undefined };
  const navigation = adaptNavigation(display, { id: "help", kind: "navigation", href: "/help" });
  expect(navigation).toMatchObject({ id: "help", kind: "navigation", href: "/help", label: "Help" });
  expect(navigation).not.toHaveProperty("onAction");
});
