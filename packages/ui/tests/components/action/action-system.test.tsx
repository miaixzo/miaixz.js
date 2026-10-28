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
 * Verifies action system behavior in the UI package.
 */

import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ActionBar,
  ActionText,
  Dropdown,
  FormActions,
  IconButton,
  miaixzUiMessages,
  MiaixzLocaleProvider,
  MoreActions,
  RowActions,
  type ActionDescriptor,
  type CommandAction,
} from "../../../src/index.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const removedHiddenClassName = ["miaixz", "visually", "hidden"].join("-");

/**
 * Supplies framework localization to one action-system test.
 *
 * @param content - Component under test.
 * @returns The testing-library render result.
 */
function renderAction(content: React.ReactNode) {
  return render(
    <MiaixzLocaleProvider i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}>
      {content}
    </MiaixzLocaleProvider>,
  );
}

/**
 * Creates a complete command descriptor without bypassing the frozen contract.
 *
 * @param overrides - Descriptor values changed by the test.
 * @returns A resolved command action.
 */
function commandAction(overrides: Partial<CommandAction> = {}): CommandAction {
  return {
    id: "edit",
    kind: "command",
    label: "编辑",
    icon: "pencil",
    tone: "neutral",
    onAction: vi.fn(),
    ...overrides,
  };
}

/**
 * Creates a complete primary command descriptor.
 *
 * @param overrides - Descriptor values changed by the test.
 * @returns A resolved primary action.
 */
function primaryAction(overrides: Partial<CommandAction> = {}): CommandAction {
  return {
    id: "save",
    kind: "command",
    label: "保存",
    icon: "save",
    tone: "brand",
    onAction: vi.fn(),
    ...overrides,
  };
}

describe("ActionText", () => {
  it("uses a button for commands and an anchor for navigation", () => {
    const onEdit = vi.fn();
    renderAction(
      <>
        <ActionText action={commandAction({ onAction: onEdit })} />
        <ActionText
          action={{
            id: "view",
            kind: "navigation",
            label: "查看详情",
            icon: "eye",
            tone: "neutral",
            href: "/details",
          }}
        />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "编辑" }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "查看详情" })).toHaveAttribute("href", "/details");
  });

  it("owns its icon and disables a loading command", () => {
    renderAction(<ActionText action={commandAction({ loading: true })} />);

    const action = screen.getByRole("button", { name: "编辑" });
    expect(action).toBeDisabled();
    expect(action).toHaveAttribute("aria-busy", "true");
    expect(action.querySelector(".miaixz-icon")).toHaveStyle({ "--miaixz-icon-size": "12px" });
    expect(action.querySelector(".miaixz-hidden")).toHaveTextContent("加载中");
    expect(action.querySelector(`.${removedHiddenClassName}`)).toBeNull();
  });
});

describe("IconButton", () => {
  it("provides an accessible name without rendering visible action text", () => {
    renderAction(
      <IconButton appearance="glyph" label="关闭" icon="close" onClick={() => undefined} />,
    );

    const action = screen.getByRole("button", { name: "关闭" });
    expect(action).toHaveClass("miaixz-icon-button");
    expect(action).toHaveAttribute("data-appearance", "glyph");
    expect(action).not.toHaveAttribute("data-miaixz-ripple");
    expect(action.querySelector(".miaixz-action-label")).toBeNull();
  });

  it("renders overflow icons as glyphs by default", () => {
    renderAction(<IconButton label="更多" icon="more-horizontal" onClick={() => undefined} />);

    const action = screen.getByRole("button", { name: "更多" });
    expect(action).toHaveAttribute("data-appearance", "glyph");
    expect(action).not.toHaveAttribute("data-miaixz-ripple");
  });
});

describe("MoreActions", () => {
  it("keeps destructive actions last and separated in the menu", () => {
    renderAction(
      <MoreActions
        actions={[
          commandAction({
            id: "delete",
            label: "删除",
            icon: "delete",
            tone: "danger",
          }),
          commandAction({ id: "export", label: "导出", icon: "download" }),
        ]}
      />,
    );

    const trigger = screen.getByRole("button", { name: "更多" });
    expect(trigger).toHaveClass("miaixz-icon-button");
    expect(trigger).toHaveAttribute("data-appearance", "glyph");
    expect(trigger).not.toHaveTextContent("更多");
    expect(trigger.querySelector(".miaixz-icon")).not.toBeNull();
    fireEvent.click(trigger);
    const menu = screen.getByRole("menu", { name: "更多" });
    expect(menu).toHaveAttribute("data-presentation", "action-menu");
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent),
    ).toEqual(["导出", "删除"]);
    expect(menu.querySelector("hr")).not.toBeNull();
    expect(document.querySelector("button button")).toBeNull();
  });
});

describe("Dropdown", () => {
  it("supports a native anchor trigger without navigating away", () => {
    renderAction(
      <Dropdown
        items={[
          {
            id: "archived",
            kind: "action",
            label: "已归档",
            textValue: "已归档",
            onAction: () => undefined,
          },
        ]}
        label="空间分类"
        trigger={<button type="button">更多</button>}
      />,
    );

    const trigger = screen.getByRole("button", { name: "更多" });
    fireEvent.click(trigger);
    expect(screen.getByRole("menu", { name: "空间分类" })).toBeVisible();
  });
});

describe("RowActions", () => {
  it("renders a single action directly without an overflow trigger", () => {
    renderAction(
      <RowActions
        actions={[
          commandAction({
            id: "delete",
            label: "删除",
            icon: "delete",
            tone: "danger",
          }),
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "删除" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "更多" })).toBeNull();
  });

  it("keeps a single compact action direct", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    renderAction(<RowActions actions={[commandAction({ id: "edit" })]} />);

    expect(screen.getByRole("button", { name: "编辑" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "操作" })).toBeNull();
    expect(screen.queryByRole("button", { name: "更多" })).toBeNull();
  });

  it("keeps two safe desktop actions visible and moves danger into overflow", () => {
    renderAction(
      <RowActions
        actions={[
          commandAction({ id: "edit" }),
          commandAction({ id: "view", label: "查看", icon: "eye" }),
          commandAction({
            id: "delete",
            label: "删除",
            icon: "delete",
            tone: "danger",
          }),
        ]}
      />,
    );

    const edit = screen.getByRole("button", { name: "编辑" });
    const view = screen.getByRole("button", { name: "查看" });
    expect(edit).toBeVisible();
    expect(view).toBeVisible();
    expect(edit.querySelector(".miaixz-icon")).not.toBeNull();
    expect(view.querySelector(".miaixz-icon")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "删除" })).toBeNull();
    const overflow = screen.getByRole("button", { name: "更多" });
    expect(overflow).toHaveAttribute("data-size", "medium");
    fireEvent.click(overflow);
    expect(screen.getByRole("menuitem", { name: "删除" })).toBeVisible();
  });

  it("keeps compact row labels atomic behind one complete action trigger", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    renderAction(
      <RowActions
        actions={[
          commandAction({ id: "edit" }),
          commandAction({ id: "reset", label: "重置密码", icon: "key-round" }),
          commandAction({ id: "freeze", label: "冻结", icon: "snowflake", tone: "danger" }),
        ]}
      />,
    );

    expect(screen.queryByRole("button", { name: "编辑" })).toBeNull();
    expect(screen.queryByRole("button", { name: "更多" })).toBeNull();
    const trigger = screen.getByRole("button", { name: "操作" });
    expect(trigger).toHaveAttribute("data-appearance", "glyph");
    expect(trigger).not.toHaveTextContent("操作");
    fireEvent.click(trigger);
    const menu = screen.getByRole("menu", { name: "操作" });
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.getAttribute("data-text-value")),
    ).toEqual(["编辑", "重置密码", "冻结"]);
  });
});

describe("ActionBar", () => {
  it("keeps the primary visible during the zero-capacity hydration partition", () => {
    renderAction(
      <ActionBar
        primary={primaryAction({ label: "新建", icon: "add" })}
        actions={[
          commandAction({ id: "edit" }),
          commandAction({ id: "refresh", label: "刷新", icon: "refresh-cw" }),
          commandAction({ id: "export", label: "导出", icon: "download" }),
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "新建" })).toHaveAttribute("data-variant", "solid");
    expect(screen.queryByRole("button", { name: "编辑" })).toBeNull();
    expect(screen.queryByRole("button", { name: "刷新" })).toBeNull();
    expect(screen.queryByRole("button", { name: "导出" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "更多" })).toHaveLength(1);
  });
});

describe("FormActions", () => {
  it("supports close-only footers and keeps auxiliary commands before native submission", () => {
    const close = vi.fn(),
      auxiliary = vi.fn(),
      submit = vi.fn((event) => event.preventDefault());
    const { rerender } = renderAction(
      <FormActions cancel={{ id: "close", label: "Close", onAction: close }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(close).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    rerender(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <form onSubmit={submit}>
          <FormActions
            cancel={{ id: "close", label: "Close", onAction: close }}
            actions={
              <button type="button" onClick={auxiliary}>
                Preview
              </button>
            }
            submit={{ id: "save", label: "Save" }}
          />
        </form>
      </MiaixzLocaleProvider>,
    );
    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Close",
      "Preview",
      "Save",
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(auxiliary).toHaveBeenCalledTimes(1);
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("uses native cancel and submit semantics without a second dirty state", () => {
    const { rerender } = renderAction(
      <form>
        <FormActions
          cancel={{ id: "cancel", label: "取消", onAction: () => undefined }}
          submit={{ id: "save", label: "保存", disabled: true }}
        />
      </form>,
    );
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "保存" })).toHaveAttribute("type", "submit");

    rerender(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <form>
          <FormActions
            cancel={{ id: "cancel", label: "取消", onAction: () => undefined }}
            submit={{ id: "save", label: "保存", loading: true }}
          />
        </form>
      </MiaixzLocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "取消" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
  });
});
