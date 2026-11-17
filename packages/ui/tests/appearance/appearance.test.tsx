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
 * Verifies the Appearance surface that consumes the independent icon package.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ChangeEventHandler, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  setColorMode: vi.fn(async () => undefined),
  setDensity: vi.fn(async () => undefined),
  setShellLayout: vi.fn(async () => undefined),
  setRadiusScale: vi.fn(async () => undefined),
  setBaseFontSize: vi.fn(async () => undefined),
  setLocale: vi.fn(async () => undefined),
  setTheme: vi.fn(async () => undefined),
  theme: {
    colorMode: "light",
    density: "standard",
    shellLayout: "vertical",
    radiusScale: 1,
    baseFontSize: 16,
    error: null as Error | null,
    resolvedColorMode: "light",
    status: "ready",
    theme: "default",
    themes: [
      {
        name: "default",
        label: "Default",
        preview: {
          light: { brand: "#000", surface: "#fff", textPrimary: "#111" },
          dark: { brand: "#fff", surface: "#000", textPrimary: "#eee" },
        },
      },
      {
        name: "forest",
        label: "Forest",
        preview: {
          light: { brand: "#060", surface: "#efe", textPrimary: "#020" },
          dark: { brand: "#afa", surface: "#020", textPrimary: "#efe" },
        },
      },
    ],
  },
  locale: {
    loadError: null as Error | null,
    loadStatus: "ready",
    locale: "en-US",
    locales: [
      { id: "en-US", label: "English", shortLabel: "EN" },
      { id: "zh-CN", label: "简体中文", shortLabel: "中" },
    ],
  },
}));

vi.mock("../../src/theme/context.js", () => ({ useTheme: () => fixture.theme }));
vi.mock("../../src/i18n/i18n.js", () => ({
  useMiaixzLocale: () => ({
    ...fixture.locale,
    setLocale: fixture.setLocale,
    t: (key: string) => key,
  }),
}));
vi.mock("../../src/theme/binding.js", () => ({
  withMiaixzThemeComponent: (_name: string, component: unknown) => component,
}));
vi.mock("../../src/appearance/use-appearance-position.js", async () => {
  const React = await import("react");
  return {
    useAppearancePosition: ({ onActivate }: { readonly onActivate: () => void }) => ({
      canMove: true,
      dragging: false,
      positionStyle: { insetBlockStart: "12px" },
      rootRef: React.createRef<HTMLDivElement>(),
      triggerHandlers: { onClick: onActivate },
    }),
  };
});
vi.mock("../../src/components/drawer/drawer.js", () => ({
  Drawer: ({
    children,
    density,
    description,
    onOpenChange,
    open,
    title,
  }: {
    readonly children: ReactNode;
    readonly density?: string;
    readonly description?: ReactNode;
    readonly onOpenChange: (open: boolean) => void;
    readonly open: boolean;
    readonly title: ReactNode;
  }) =>
    open ? (
      <div aria-label={String(title)} data-density={density} role="dialog">
        <p>{description}</p>
        {children}
        <button onClick={() => onOpenChange(false)} type="button">
          mock-close
        </button>
      </div>
    ) : null,
}));
vi.mock("../../src/components/radio/radio.js", () => ({
  Radio: ({
    checked,
    disabled,
    label,
    onChange,
    value,
  }: {
    readonly checked: boolean;
    readonly disabled?: boolean;
    readonly label: ReactNode;
    readonly onChange: ChangeEventHandler<HTMLInputElement>;
    readonly value: string;
  }) => (
    <label>
      <input checked={checked} disabled={disabled} onChange={onChange} type="radio" value={value} />
      {label}
    </label>
  ),
}));
vi.mock("../../src/components/locale/locale.js", () => ({
  Locale: ({
    disabled,
    onLocaleChange,
  }: {
    readonly disabled?: boolean;
    readonly onLocaleChange: (locale: string) => void;
  }) => (
    <button disabled={disabled} onClick={() => onLocaleChange("zh-CN")} type="button">
      choose-locale
    </button>
  ),
}));
vi.mock("../../src/components/action/action-text.js", () => ({
  ActionText: ({
    action,
  }: {
    readonly action: { readonly label: ReactNode; onAction: () => void };
  }) => (
    <button onClick={action.onAction} type="button">
      {action.label}
    </button>
  ),
}));
vi.mock("@miaixz/icons", () => ({
  Icon: ({ name }: { readonly name: string }) => <span className="miaixz-icon" data-icon={name} />,
}));

import { Appearance } from "../../src/appearance/appearance.js";

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(fixture.theme, {
    colorMode: "light",
    density: "standard",
    error: null,
    baseFontSize: 16,
    resolvedColorMode: "light",
    status: "ready",
    theme: "default",
    setColorMode: fixture.setColorMode,
    setDensity: fixture.setDensity,
    setShellLayout: fixture.setShellLayout,
    setRadiusScale: fixture.setRadiusScale,
    setBaseFontSize: fixture.setBaseFontSize,
    setTheme: fixture.setTheme,
  });
  Object.assign(fixture.locale, {
    loadError: null,
    loadStatus: "ready",
    locale: "en-US",
  });
});

describe("Appearance", () => {
  it("renders the palette icon through the stable icon host used by motion styles", () => {
    render(<Appearance scope="public" />);
    const trigger = screen.getByRole("button", { name: "ui.appearance.open" });
    expect(trigger.querySelector(":scope > .miaixz-icon[data-icon='palette']")).not.toBeNull();
    expect(trigger.querySelector(":scope > svg")).toBeNull();
  });

  it("rejects a non-finite controlled position", () => {
    expect(() => render(<Appearance positionBlockPx={Number.NaN} scope="public" />)).toThrow(
      expect.objectContaining({ code: "UI_APPEARANCE_POSITION_INVALID" }),
    );
  });

  it("renders the public settings and resets its nested view when closed", async () => {
    render(<Appearance scope="public" />);
    fireEvent.click(screen.getByRole("button", { name: "ui.appearance.open" }));
    expect(screen.getByRole("dialog", { name: "ui.appearance.title" })).toBeInTheDocument();
    expect(screen.queryByText("ui.appearance.theme")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ui.appearance.language.open" }));
    expect(screen.getByRole("dialog", { name: "ui.label.language" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "choose-locale" }));
    await waitFor(() => expect(fixture.setLocale).toHaveBeenCalledWith("zh-CN"));
    expect(screen.getByRole("dialog", { name: "ui.appearance.title" })).toBeInTheDocument();
    fireEvent.click(screen.getByText("mock-close"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("updates authenticated theme, mode, density, and header choices", () => {
    const onHeaderBehaviorChange = vi.fn();
    render(
      <Appearance
        headerBehavior="fixed"
        onHeaderBehaviorChange={onHeaderBehaviorChange}
        scope="authenticated"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "ui.appearance.open" }));
    expect(screen.getByRole("dialog", { name: "ui.appearance.title" })).toHaveAttribute(
      "data-density",
      "standard",
    );
    /**
     * Finds the appearance radio fixture with the requested value.
     *
     * @param value - Appearance radio value to locate.
     * @returns Radio fixture element with the requested value.
     */
    const choice = (value: string) =>
      screen.getAllByRole("radio").find((input) => input.getAttribute("value") === value)!;
    fireEvent.click(choice("forest"));
    fireEvent.click(choice("dark"));
    fireEvent.click(choice("comfortable"));
    fireEvent.click(choice("scroll"));
    expect(fixture.setTheme).toHaveBeenCalledWith("forest");
    expect(fixture.setColorMode).toHaveBeenCalledWith("dark");
    expect(fixture.setDensity).toHaveBeenCalledWith("comfortable");
    expect(onHeaderBehaviorChange).toHaveBeenCalledWith("scroll");
  });

  it("updates layout, corner radius, and base font size choices", () => {
    render(<Appearance headerBehavior="fixed" scope="authenticated" />);
    fireEvent.click(screen.getByRole("button", { name: "ui.appearance.open" }));
    const choice = (value: string) =>
      screen.getAllByRole("radio").find((input) => input.getAttribute("value") === value)!;

    fireEvent.click(choice("hybrid-dual"));
    fireEvent.click(choice("0.5"));
    fireEvent.click(choice("0.75"));
    fireEvent.click(screen.getByRole("button", { name: "ui.appearance.fontSize.increase" }));

    expect(fixture.setShellLayout).toHaveBeenCalledWith("hybrid-dual");
    expect(fixture.setRadiusScale).toHaveBeenCalledWith(0.5);
    expect(fixture.setRadiusScale).toHaveBeenCalledWith(0.75);
    expect(fixture.setBaseFontSize).toHaveBeenCalledWith(17);
  });

  it("steps down from 14px to 12px and stops at the supported minimum", () => {
    fixture.theme.baseFontSize = 14;
    const { rerender } = render(<Appearance scope="authenticated" />);
    fireEvent.click(screen.getByRole("button", { name: "ui.appearance.open" }));
    const decrease = () => screen.getByRole("button", { name: "ui.appearance.fontSize.decrease" });
    fireEvent.click(decrease());
    expect(fixture.setBaseFontSize).toHaveBeenLastCalledWith(13);

    fixture.theme.baseFontSize = 13;
    rerender(<Appearance scope="authenticated" />);
    fireEvent.click(decrease());
    expect(fixture.setBaseFontSize).toHaveBeenLastCalledWith(12);

    fixture.theme.baseFontSize = 12;
    rerender(<Appearance scope="authenticated" />);
    expect(decrease()).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "ui.appearance.fontSize.increase" }));
    expect(fixture.setBaseFontSize).toHaveBeenLastCalledWith(13);
  });

  it("exposes loading, read-only, fallback locale, and error states", () => {
    Object.assign(fixture.theme, { status: "loading", error: new Error("theme failure") });
    Object.assign(fixture.locale, {
      loadStatus: "loading",
      loadError: new Error("locale failure"),
      locale: "xx-YY",
      locales: [],
    });
    render(<Appearance scope="authenticated" />);
    fireEvent.click(screen.getByRole("button", { name: "ui.appearance.open" }));
    expect(screen.getByText("XX")).toBeInTheDocument();
    expect(screen.getByText("ui.appearance.readOnly")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("theme failure");
    expect(screen.getAllByRole("radio").every((input) => input.hasAttribute("disabled"))).toBe(
      true,
    );
    fireEvent.click(screen.getByRole("button", { name: "ui.appearance.language.open" }));
    expect(screen.getByRole("alert")).toHaveTextContent("locale failure");
    expect(screen.getByRole("button", { name: "choose-locale" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "ui.appearance.language.back" }));
    expect(screen.getByRole("dialog", { name: "ui.appearance.title" })).toBeInTheDocument();
  });
});
