/**
 * Verifies modal focus behavior in the UI package.
 */

import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Drawer } from "../../../src/components/drawer/index.js";
import { MiaixzLocaleProvider, miaixzUiMessages } from "../../../src/i18n/index.js";

/**
 * Inputs controlling the Provider test fixture.
 */
interface ProviderProps {
  /**
   * Supplies the fixture content.
   */
  readonly children: ReactNode;
}

/**
 * Inputs controlling the Example test fixture.
 */
interface ExampleProps {
  /**
   * Overrides whether the fixture closes from a backdrop click.
   */
  readonly closeOnBackdrop?: boolean;
  readonly closeOnEscape?: boolean;
}

/**
 * Supplies the UI locale required by Drawer.
 *
 * @param props - Provider fixture properties.
 * @param props.children - Fixture content.
 * @returns Localized fixture content.
 */
function Provider({ children }: ProviderProps) {
  return (
    <MiaixzLocaleProvider i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}>
      {children}
    </MiaixzLocaleProvider>
  );
}

/**
 * Renders one controlled Drawer with long, focusable content.
 *
 * @param props - Drawer fixture properties.
 * @param props.closeOnBackdrop - Whether a backdrop click closes the fixture.
 * @returns One controlled Drawer fixture.
 */
function Example({ closeOnBackdrop = false, closeOnEscape = false }: ExampleProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button">之前的鼠标目标</button>
      <button type="button" onClick={() => setOpen(true)}>
        键盘入口
      </button>
      <Drawer
        closeLabel="关闭"
        closeOnBackdrop={closeOnBackdrop}
        closeOnEscape={closeOnEscape}
        footer={<button type="button">保存</button>}
        open={open}
        title="详情"
        onOpenChange={setOpen}
      >
        <input aria-label="名称" />
        <p>{`长内容-${"可达内容".repeat(120)}`}</p>
      </Drawer>
    </>
  );
}

/**
 * Renders two independently controlled nested Drawers.
 *
 * @returns A nested Drawer fixture.
 */
function NestedExample() {
  const [outerOpen, setOuterOpen] = useState(false);
  const [innerOpen, setInnerOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOuterOpen(true)}>
        打开外层
      </button>
      <Drawer closeLabel="关闭外层" open={outerOpen} title="外层" onOpenChange={setOuterOpen}>
        <button type="button" onClick={() => setInnerOpen(true)}>
          打开内层
        </button>
        <Drawer closeLabel="关闭内层" open={innerOpen} title="内层" onOpenChange={setInnerOpen}>
          <button type="button">内层操作</button>
        </Drawer>
      </Drawer>
    </>
  );
}

beforeEach(() => {
  HTMLDialogElement.prototype.showModal ??= function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function () {
    this.removeAttribute("open");
  };
});

afterEach(cleanup);

describe("native modal focus restoration", () => {
  it("opens with long content intact and loops keyboard focus inside the Drawer", async () => {
    render(<Example />, { wrapper: Provider });
    fireEvent.click(screen.getByRole("button", { name: "键盘入口" }));

    const dialog = screen.getByRole("dialog", { name: "详情" });
    expect(dialog).toHaveAttribute("open");
    expect(within(dialog).getByText(/^长内容-/)).toHaveTextContent("可达内容");
    await waitFor(() =>
      expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "关闭" })),
    );

    const close = within(dialog).getByRole("button", { name: "关闭" });
    expect(close.tagName).toBe("BUTTON");
    expect(close).not.toHaveAttribute("title");
    expect(within(dialog).queryByRole("tooltip")).toBeNull();
    const save = within(dialog).getByRole("button", { name: "保存" });
    save.focus();
    fireEvent.keyDown(save, { key: "Tab" });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(save);
  });

  it("closes on Escape and backdrop, then restores the current trigger", async () => {
    render(<Example closeOnBackdrop closeOnEscape />, { wrapper: Provider });
    const trigger = screen.getByRole("button", { name: "键盘入口" });
    trigger.focus();
    fireEvent.click(trigger);

    let dialog = screen.getByRole("dialog", { name: "详情" });
    fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));
    await waitFor(() => expect(dialog).not.toHaveAttribute("open"));
    await waitFor(() => expect(document.activeElement).toBe(trigger));

    fireEvent.click(trigger);
    dialog = screen.getByRole("dialog", { name: "详情" });
    fireEvent.click(dialog, { clientX: 10, clientY: 10 });
    await waitFor(() => expect(dialog).not.toHaveAttribute("open"));
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("honors the backdrop opt-out", () => {
    render(<Example closeOnBackdrop={false} />, { wrapper: Provider });
    fireEvent.click(screen.getByRole("button", { name: "键盘入口" }));
    const dialog = screen.getByRole("dialog", { name: "详情" });
    fireEvent.click(dialog);
    expect(dialog).toHaveAttribute("open");
  });

  it("keeps nested Drawers stacked and restores focus one level at a time", async () => {
    render(<NestedExample />, { wrapper: Provider });
    const outerTrigger = screen.getByRole("button", { name: "打开外层" });
    outerTrigger.focus();
    fireEvent.click(outerTrigger);
    const outer = screen.getByRole("dialog", { name: "外层" });
    await waitFor(() =>
      expect(document.activeElement).toBe(
        within(outer).getAllByRole("button", { name: "关闭外层" })[0],
      ),
    );
    const innerTrigger = within(outer).getByRole("button", { name: "打开内层" });
    innerTrigger.focus();
    fireEvent.click(innerTrigger);

    const inner = screen.getByRole("dialog", { name: "内层" });
    fireEvent.click(inner.querySelector(".miaixz-drawer-close")!);
    await waitFor(() => expect(inner).not.toHaveAttribute("open"));
    expect(outer).toHaveAttribute("open");
    await waitFor(() => expect(document.activeElement).toBe(innerTrigger));

    fireEvent.click(outer.querySelector(".miaixz-drawer-close")!);
    await waitFor(() => expect(outer).not.toHaveAttribute("open"));
    await waitFor(() => expect(document.activeElement).toBe(outerTrigger));
  });

  it("does not restore a stale pointer target after keyboard activation", async () => {
    render(<Example />, { wrapper: Provider });
    fireEvent.pointerDown(screen.getByRole("button", { name: "之前的鼠标目标" }));
    const trigger = screen.getByRole("button", { name: "键盘入口" });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
