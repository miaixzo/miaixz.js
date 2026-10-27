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
 * Verifies drawer widths behavior in the UI package.
 */

import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DRAWER_WIDTHS, Drawer, type DrawerWidth } from "../../../src/components/drawer/index.js";
import { MiaixzLocaleProvider } from "../../../src/i18n/index.js";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal ??= function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function () {
    this.removeAttribute("open");
  };
});
afterEach(cleanup);

/**
 * Renders one explicit width using the sole width contract.
 * @param width - Optional width override.
 * @returns A localized drawer.
 */
function fixture(width?: DrawerWidth) {
  return (
    <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
      <Drawer open title="Width" width={width} onOpenChange={() => undefined}>
        Content
      </Drawer>
    </MiaixzLocaleProvider>
  );
}

describe("Drawer widths", () => {
  it("exports immutable numeric presets and applies named or custom widths from one property", () => {
    expect(Object.isFrozen(DRAWER_WIDTHS)).toBe(true);
    const { rerender } = render(fixture());
    for (const width of [...DRAWER_WIDTHS, 435.5]) {
      rerender(fixture(width));
      const drawer = screen.getByRole("dialog", { name: "Width" });
      expect(drawer.style.getPropertyValue("--miaixz-drawer-width")).toBe(`${width}px`);
      expect(drawer).toHaveAttribute(
        "data-spacing",
        width <= 480 ? "compact" : width <= 600 ? "standard" : width <= 800 ? "large" : "workspace",
      );
      expect(drawer).not.toHaveClass("miaixz-drawer-positioned");
      expect(drawer.style.inlineSize).toBe("");
      expect(drawer).not.toHaveAttribute("data-positioned");
    }
    rerender(fixture("large"));
    expect(screen.getByRole("dialog")).toHaveAttribute("data-width", "large");
    expect(screen.getByRole("dialog")).toHaveAttribute("data-spacing", "standard");
    expect(screen.getByRole("dialog").style.getPropertyValue("--miaixz-drawer-width")).toBe("");
    expect(screen.getByRole("dialog").style.getPropertyValue("--miaixz-drawer-width")).toBe("");
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid width %s", (width) => {
    expect(() => render(fixture(width))).toThrowError(
      expect.objectContaining({ code: "UI_DRAWER_WIDTH_INVALID" }),
    );
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid inset %s", (inset) => {
    expect(() =>
      render(
        <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
          <Drawer inset={inset} open title="Inset" onOpenChange={() => undefined}>
            Content
          </Drawer>
        </MiaixzLocaleProvider>,
      ),
    ).toThrowError(expect.objectContaining({ code: "UI_DRAWER_INSET_INVALID" }));
  });

  it("renders optional structure, slots, attributes, and close controls", () => {
    const onOpenChange = vi.fn();
    render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <Drawer
          aria-label="Native label"
          closeLabel="Dismiss"
          density="compact"
          description="Details"
          floating
          footer="Footer"
          headingLevel={3}
          id="drawer-contract"
          open
          placement="left"
          slots={{ description: "aside" }}
          slotProps={{
            content: { className: "custom-content" },
            footer: { className: "custom-footer" },
            header: { className: "custom-header" },
            paper: { className: "custom-paper" },
            title: { className: "custom-title" },
          }}
          title="Contract"
          width="wide"
          onOpenChange={onOpenChange}
        >
          Body
        </Drawer>
      </MiaixzLocaleProvider>,
    );
    const dialog = screen.getByRole("dialog", { name: "Contract" });
    expect(dialog).toHaveAttribute("id", "drawer-contract");
    expect(dialog).toHaveAttribute("data-density", "compact");
    expect(dialog).toHaveAttribute("data-floating", "true");
    expect(dialog).toHaveAttribute("data-placement", "left");
    expect(dialog).toHaveAttribute("data-spacing", "wide");
    expect(dialog).toHaveAttribute("data-width", "wide");
    expect(dialog.querySelector("h3")).toHaveClass("custom-title");
    expect(dialog.querySelector("aside")).toHaveTextContent("Details");
    expect(dialog.querySelector(".custom-content")).toHaveTextContent("Body");
    expect(dialog.querySelector(".custom-footer")).toHaveTextContent("Footer");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onOpenChange).toHaveBeenCalledWith(false, "closeButton");
  });

  it("reports escape, native close, and backdrop close reasons", () => {
    const onOpenChange = vi.fn();
    render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <Drawer open closeOnEscape closeOnBackdrop title="Reasons" onOpenChange={onOpenChange}>
          Body
        </Drawer>
      </MiaixzLocaleProvider>,
    );
    const dialog = screen.getByRole("dialog", { name: "Reasons" });
    const paper = dialog.firstElementChild as HTMLElement;
    vi.spyOn(paper, "getBoundingClientRect").mockReturnValue({
      bottom: 300,
      height: 200,
      left: 100,
      right: 300,
      top: 100,
      width: 200,
      x: 100,
      y: 100,
      toJSON: () => undefined,
    });
    fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true }));
    fireEvent(dialog, new Event("close", { bubbles: true }));
    fireEvent.click(dialog, { clientX: 10, clientY: 10 });
    expect(onOpenChange).toHaveBeenCalledWith(false, "escape");
    expect(onOpenChange).toHaveBeenCalledWith(false, "nativeClose");
    expect(onOpenChange).toHaveBeenCalledWith(false, "backdrop");
  });

  it("does not close for a paper click or when backdrop closing is disabled", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <Drawer open title="Backdrop" onOpenChange={onOpenChange}>
          Body
        </Drawer>
      </MiaixzLocaleProvider>,
    );
    fireEvent.click(screen.getByText("Body"));
    expect(onOpenChange).not.toHaveBeenCalled();
    rerender(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <Drawer closeOnBackdrop={false} open title="Backdrop" onOpenChange={onOpenChange}>
          Body
        </Drawer>
      </MiaixzLocaleProvider>,
    );
    fireEvent.click(screen.getByRole("dialog", { name: "Backdrop" }), {
      clientX: 0,
      clientY: 0,
    });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("positions left, right, and bottom drawers inside a connected boundary", async () => {
    const boundary = document.createElement("section");
    document.body.append(boundary);
    vi.spyOn(boundary, "getBoundingClientRect").mockReturnValue({
      bottom: 600,
      height: 500,
      left: 100,
      right: 900,
      top: 100,
      width: 800,
      x: 100,
      y: 100,
      toJSON: () => undefined,
    });
    /**
     * Renders the positioned drawer fixture for the requested placement and width policy.
     *
     * @param placement - Drawer edge placement used by the positioned fixture.
     * @returns Localized positioned drawer fixture element.
     */
    const renderDrawer = (placement: "bottom" | "left" | "right") => (
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <Drawer
          boundary={boundary}
          inset={{ block: 8, inline: 10 }}
          open
          placement={placement}
          title="Positioned"
          width={placement === "bottom" ? undefined : 435}
          onOpenChange={() => undefined}
        >
          Body
        </Drawer>
      </MiaixzLocaleProvider>
    );
    const { rerender } = render(renderDrawer("right"));
    const positioned = await screen.findByRole("dialog", { name: "Positioned" });
    expect(positioned).toHaveAttribute("data-positioned", "true");
    expect(positioned.style.top).toBe("108px");
    expect(positioned.style.right).not.toBe("");
    expect(positioned.style.getPropertyValue("--miaixz-drawer-width")).toBe("435px");
    expect(positioned.style.inlineSize).toBe("min(var(--miaixz-drawer-width), 780px)");
    rerender(renderDrawer("left"));
    await waitFor(() => expect(screen.getByRole("dialog").style.left).not.toBe(""));
    rerender(renderDrawer("bottom"));
    await waitFor(() => expect(screen.getByRole("dialog").style.top).toBe("auto"));
    expect(screen.getByRole("dialog").style.blockSize).toBe("auto");
    boundary.remove();
  });

  it("waits for a non-null positioned frame and supports a hidden close control", () => {
    const { container } = render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <Drawer
          boundary={null}
          open
          showClose={false}
          title="Hidden"
          onOpenChange={() => undefined}
        >
          Body
        </Drawer>
      </MiaixzLocaleProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
