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
 * Verifies neutral asynchronous presentation, retained content, recovery, and Theme composition.
 */

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMiaixzAppearanceManager,
  type MiaixzAppearanceManager,
} from "@miaixz/sdk/appearance";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { createRef, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Stage,
  StageLoading,
  MiaixzLocaleProvider,
  miaixzUiMessages,
  Theme,
  useStageSettled,
  type StageOwnerState,
  type StageProps,
  type StageLoadingOwnerState,
  type ThemeComponents,
} from "../../../src/index.js";

type ErrorProps = Extract<StageProps, { readonly status: "error" }>;

const frames = new Map<number, FrameRequestCallback>();
const appearances = new Set<MiaixzAppearanceManager>();
let nextFrame = 1;

/**
 * Renders with a real, stable locale wrapper which is preserved by rerender.
 *
 * @param node - Neutral component fixture.
 * @returns Testing Library render controls.
 */
function renderFixture(node: ReactNode) {
  const i18n = createMiaixzI18n({ locale: "en-US", messages: miaixzUiMessages });
  return render(node, {
    wrapper: ({ children }) => <MiaixzLocaleProvider i18n={i18n}>{children}</MiaixzLocaleProvider>,
  });
}

/**
 * Creates an independent Appearance manager for the real Theme provider.
 *
 * @returns Manager backed by isolated in-memory storage.
 */
function createAppearance() {
  const values = new Map<string, string>();
  const appearance = createMiaixzAppearanceManager({
    appId: "stage-test",
    initialAppearance: { theme: "miaixz", colorMode: "light", density: "standard" },
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  });
  appearances.add(appearance);
  return appearance;
}

/**
 * Supplies caller-owned error copy without introducing application scope or fallback text.
 *
 * @param props - Explicit recovery and presentation overrides.
 * @returns One error presentation fixture.
 */
function errorState(props: Partial<Omit<ErrorProps, "status">> = {}) {
  return (
    <Stage
      status="error"
      title="Unavailable"
      description="Please retry."
      loadingLabel="Working"
      {...props}
    />
  );
}

/**
 * Executes only callbacks queued before this frame; nested frames remain pending.
 *
 * @returns Completion of React updates and promise continuations for this frame.
 */
async function flushFrame(): Promise<void> {
  const batch = [...frames.values()];
  frames.clear();
  await act(async () => {
    for (const callback of batch) callback(0);
  });
}

/**
 * Creates caller-owned pending work with explicit settlement controls.
 *
 * @returns Promise and its resolving/rejecting functions.
 */
function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return { promise, resolve, reject };
}

/**
 * Exposes settled-state retention through a keyed mounted scope.
 *
 * @param props - Whether the caller's current state has settled.
 * @returns The public hook result as neutral text.
 */
function SettledProbe({ settled }: { readonly settled: boolean }) {
  return <output data-testid="settled">{String(useStageSettled(settled))}</output>;
}

beforeEach(() => {
  frames.clear();
  nextFrame = 1;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    const identifier = nextFrame++;
    frames.set(identifier, callback);
    return identifier;
  });
});

afterEach(() => {
  cleanup();
  for (const appearance of appearances) appearance.destroy();
  appearances.clear();
  frames.clear();
  vi.restoreAllMocks();
});

describe("asynchronous presentation", () => {
  it("renders loading and empty roots, then returns ready children without added DOM", () => {
    const root = vi.fn((state: Readonly<StageOwnerState>) => ({
      className: `state-${state.status}`,
    }));
    const view = renderFixture(
      <Stage
        status="loading"
        label="Loading preview"
        placeholder={<span>Preview placeholder</span>}
        data-testid="state"
        slotProps={{ root }}
      />,
    );
    expect(screen.getByTestId("state")).toHaveClass("miaixz-overlay", "state-loading");
    expect(screen.getByTestId("state")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Loading preview");
    expect(screen.getByText("Preview placeholder").closest("[inert]")).not.toBeNull();
    view.rerender(
      <Stage
        status="empty"
        title="No items"
        description="Choose another view."
        actions={<button type="button">Choose</button>}
        data-testid="state"
        slotProps={{ root }}
      />,
    );
    expect(screen.getByTestId("state")).toHaveClass("miaixz-empty", "state-empty");
    expect(screen.getByText("Choose another view.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose" })).toBeEnabled();
    expect(root).toHaveBeenLastCalledWith({
      status: "empty",
      presentation: "region",
      pending: false,
    });
    view.rerender(
      <Stage status="ready">
        <strong>Ready preview</strong>
      </Stage>,
    );
    expect(view.container.childElementCount).toBe(1);
    expect(view.container.firstElementChild).toBe(screen.getByText("Ready preview"));
    expect(view.container.querySelector(".miaixz-overlay")).toBeNull();
  });

  it("maps error roots and Exception slots without adding them to inline feedback", () => {
    const root = vi.fn((state: Readonly<StageOwnerState>) => ({
      className: `root-${state.presentation}`,
    }));
    const region = vi.fn(() => ({ className: "region-slot" }));
    const title = vi.fn(() => ({ className: "title-slot" }));
    const content = vi.fn(() => ({ className: "content-slot" }));
    const illustration = vi.fn(() => ({ className: "illustration-slot" }));
    const slots = { root, region, title, content, illustration };
    const view = renderFixture(errorState({ "data-testid": "state", slotProps: slots }));
    const error = screen.getByTestId("state");
    expect(error).toHaveClass("miaixz-exception", "root-region");
    expect(error).toHaveAttribute("role", "alert");
    expect(error).toHaveAttribute("aria-live", "assertive");
    expect(error.parentElement).toHaveClass("region-slot");
    expect(screen.getByRole("heading", { name: "Unavailable", level: 2 })).toHaveClass(
      "title-slot",
    );
    expect(error.querySelector(".miaixz-exception-content")).toHaveClass("content-slot");
    expect(error.querySelector(".miaixz-exception-illustration")).toHaveClass("illustration-slot");
    expect(view.container.querySelector(".miaixz-stage-loading")).not.toHaveClass("root-region");
    for (const slot of [region, title, content, illustration]) {
      expect(slot).toHaveBeenLastCalledWith({
        status: "error",
        presentation: "region",
        pending: false,
      });
      slot.mockClear();
    }
    view.rerender(errorState({ presentation: "inline", "data-testid": "state", slotProps: slots }));
    expect(screen.getByTestId("state")).toHaveClass("miaixz-alert", "root-inline");
    expect(screen.getByTestId("state")).toHaveAttribute("role", "alert");
    expect(
      view.container.querySelector(".region-slot, .title-slot, .content-slot, .illustration-slot"),
    ).toBeNull();
    for (const slot of [region, title, content, illustration]) expect(slot).not.toHaveBeenCalled();
    expect(root).toHaveBeenLastCalledWith({
      status: "error",
      presentation: "inline",
      pending: false,
    });
  });

  it.each([
    { callback: false, label: false },
    { callback: true, label: false },
    { callback: false, label: true },
    { callback: true, label: true },
  ])("pairs retry callback=$callback with label=$label only at runtime", ({ callback, label }) => {
    renderFixture(
      errorState({
        ...(callback ? { onRetry: vi.fn() } : {}),
        ...(label ? { retryLabel: "Retry" } : {}),
      }),
    );
    expect(screen.queryByRole("button", { name: "Retry" }) !== null).toBe(callback && label);
  });
});

describe("retained content and settled scopes", () => {
  it("preserves input DOM, native activation, refs, blocking attributes, and focus restoration", async () => {
    const user = userEvent.setup();
    const activate = vi.fn();
    const ref = createRef<HTMLDivElement>();
    const fixture = (active: boolean) => (
      <StageLoading active={active} label="Refreshing" ref={ref} data-testid="loading">
        <input aria-label="Filter" defaultValue="initial" />
        <button type="button" onClick={activate}>
          Action
        </button>
      </StageLoading>
    );
    const view = renderFixture(fixture(false));
    const input = screen.getByRole("textbox", { name: "Filter" });
    const button = screen.getByRole("button", { name: "Action" });
    await user.click(button);
    await user.keyboard("{Enter}");
    expect(activate).toHaveBeenCalledTimes(2);
    fireEvent.change(input, { target: { value: "edited" } });
    input.focus();
    const root = screen.getByTestId("loading");
    expect(ref.current).toBe(root);
    view.rerender(fixture(true));
    expect(screen.getByLabelText("Filter")).toBe(input);
    expect(input).toHaveValue("edited");
    expect(input.closest(".miaixz-overlay-content")).toHaveAttribute("inert");
    expect(root).toHaveAttribute("aria-busy", "true");
    const surface = root.querySelector<HTMLElement>(".miaixz-overlay-surface");
    expect(surface).toHaveAttribute("tabindex", "-1");
    expect(surface).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Refreshing");
    await user.keyboard("{Enter}");
    expect(activate).toHaveBeenCalledTimes(2);
    view.rerender(fixture(false));
    expect(screen.getByLabelText("Filter")).toBe(input);
    expect(input).toHaveFocus();
    expect(input.closest("[inert]")).toBeNull();
    expect(root).not.toHaveAttribute("aria-busy");
    expect(root.querySelector(".miaixz-overlay-surface")).toBeNull();
    expect(ref.current).toBe(root);
    view.unmount();
    expect(ref.current).toBeNull();
  });

  it.each([
    { name: "root aria-busy", slotProps: () => ({ root: { "aria-busy": false } }) },
    { name: "content inert", slotProps: () => ({ content: { inert: false } }) },
    { name: "surface tabIndex", slotProps: () => ({ surface: { tabIndex: 0 } }) },
  ])("rejects conflicting component-owned $name slot values", ({ slotProps }) => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() =>
      renderFixture(<StageLoading active label="Loading" slotProps={slotProps()} />),
    ).toThrowError(expect.objectContaining({ code: "UI_SLOT_OWNED_PROP_CONFLICT" }));
  });

  it.each([
    { name: "undefined", children: undefined, retained: false, text: "Placeholder" },
    { name: "null", children: null, retained: false, text: "Placeholder" },
    { name: "false", children: false, retained: true, text: "" },
    { name: "zero", children: 0, retained: true, text: "0" },
    { name: "empty string", children: "", retained: true, text: "" },
  ])("chooses nullish placeholders and hasContent for $name", ({ children, retained, text }) => {
    const root = vi.fn((state: Readonly<StageLoadingOwnerState>) => ({
      "data-has-content": state.hasContent,
    }));
    const { container } = renderFixture(
      <StageLoading
        active={false}
        label="Loading"
        placeholder={<span>Placeholder</span>}
        slotProps={{ root }}
      >
        {children}
      </StageLoading>,
    );
    expect(container.querySelector(".miaixz-overlay-content")?.textContent).toBe(text);
    expect(root).toHaveBeenLastCalledWith({ active: false, hasContent: retained });
    expect(container.querySelector("[data-loading-retained]")).toBeNull();
  });

  it("leaves missing content empty and resets settled memory only when the key changes", () => {
    const empty = renderFixture(<StageLoading active={false} label="Loading" />);
    expect(empty.container.querySelector(".miaixz-overlay-content")).toBeEmptyDOMElement();
    empty.unmount();
    const view = renderFixture(<SettledProbe key="first" settled={false} />);
    expect(screen.getByTestId("settled")).toHaveTextContent("false");
    view.rerender(<SettledProbe key="first" settled />);
    expect(screen.getByTestId("settled")).toHaveTextContent("true");
    view.rerender(<SettledProbe key="first" settled={false} />);
    expect(screen.getByTestId("settled")).toHaveTextContent("true");
    view.rerender(<SettledProbe key="second" settled={false} />);
    expect(screen.getByTestId("settled")).toHaveTextContent("false");
  });
});

describe("local recovery", () => {
  it("blocks repeated activation and waits two distinct frames before asynchronous recovery", async () => {
    const work = deferred();
    const retry = vi.fn(() => work.promise);
    const view = renderFixture(errorState({ retryLabel: "Retry", onRetry: retry }));
    const button = screen.getByRole("button", { name: "Retry" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(view.container.querySelector(".miaixz-stage-loading")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(button.closest("[inert]")).not.toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Working");
    expect(retry).not.toHaveBeenCalled();
    await flushFrame();
    expect(retry).not.toHaveBeenCalled();
    await flushFrame();
    expect(retry).toHaveBeenCalledOnce();
    expect(button).toBeDisabled();
    await act(async () => {
      work.resolve();
      await work.promise;
    });
    expect(button).toBeEnabled();
    expect(view.container.querySelector(".miaixz-stage-loading")).not.toHaveAttribute("aria-busy");
    expect(button.closest("[inert]")).toBeNull();
  });

  it.each(["success", "throw", "reject"] as const)(
    "settles %s recovery and permits keyboard retry",
    async (outcome) => {
      const user = userEvent.setup();
      const retry = vi.fn(() => {
        if (outcome === "throw") throw new Error("Synthetic recovery failure");
        if (outcome === "reject") return Promise.reject(new Error("Synthetic recovery failure"));
        return 42;
      });
      const { container } = renderFixture(errorState({ retryLabel: "Retry", onRetry: retry }));
      const button = screen.getByRole("button", { name: "Retry" });
      button.focus();
      await user.keyboard("{Enter}");
      await flushFrame();
      expect(retry).not.toHaveBeenCalled();
      await flushFrame();
      expect(retry).toHaveBeenCalledOnce();
      expect(button).toBeEnabled();
      expect(container.querySelector(".miaixz-stage-loading")).not.toHaveAttribute("aria-busy");
      expect(screen.queryByText("Synthetic recovery failure")).not.toBeInTheDocument();
      fireEvent.click(button);
      await flushFrame();
      await flushFrame();
      expect(retry).toHaveBeenCalledTimes(2);
    },
  );

  it.each(["retrying", "disabled"] as const)(
    "separates external %s from local pending",
    async (mode) => {
      const retry = vi.fn();
      const root = vi.fn(() => ({ className: "error-root" }));
      const { container } = renderFixture(
        errorState({
          retryLabel: "Retry",
          onRetry: retry,
          retrying: mode === "retrying",
          retryDisabled: mode === "disabled",
          slotProps: { root },
        }),
      );
      const button = screen.getByLabelText("Retry");
      expect(button).toBeDisabled();
      expect(root).toHaveBeenLastCalledWith({
        status: "error",
        presentation: "region",
        pending: false,
      });
      expect(container.querySelector(".miaixz-stage-loading")?.getAttribute("aria-busy")).toBe(
        mode === "retrying" ? "true" : null,
      );
      fireEvent.click(button);
      await flushFrame();
      await flushFrame();
      expect(retry).not.toHaveBeenCalled();
    },
  );

  it.each([0, 1])("does not invoke recovery when unmounted after %i frames", async (count) => {
    const retry = vi.fn();
    const view = renderFixture(errorState({ retryLabel: "Retry", onRetry: retry }));
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    if (count === 1) await flushFrame();
    view.unmount();
    await flushFrame();
    await flushFrame();
    expect(retry).not.toHaveBeenCalled();
    expect(view.container).toBeEmptyDOMElement();
  });

  it.each(["resolve", "reject"] as const)(
    "settles already-started work after unmount: %s",
    async (outcome) => {
      const work = deferred();
      const retry = vi.fn(() => work.promise);
      const view = renderFixture(errorState({ retryLabel: "Retry", onRetry: retry }));
      fireEvent.click(screen.getByRole("button", { name: "Retry" }));
      await flushFrame();
      await flushFrame();
      expect(retry).toHaveBeenCalledOnce();
      view.unmount();
      await act(async () => {
        if (outcome === "resolve") work.resolve();
        else work.reject(new Error("Synthetic late failure"));
        await Promise.resolve();
      });
      expect(view.container).toBeEmptyDOMElement();
    },
  );

  it("replaces the error scope on ready and starts a later failure without old pending state", async () => {
    const retry = vi.fn();
    const view = renderFixture(errorState({ retryLabel: "Retry", onRetry: retry }));
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    view.rerender(
      <Stage status="ready">
        <span>Ready</span>
      </Stage>,
    );
    await flushFrame();
    await flushFrame();
    expect(retry).not.toHaveBeenCalled();
    view.rerender(errorState({ retryLabel: "Retry", onRetry: retry }));
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await flushFrame();
    await flushFrame();
    expect(retry).toHaveBeenCalledOnce();
  });
});

describe("real Theme composition", () => {
  it("uses computed hasContent for root-only variants without consumer slots", () => {
    const appearance = createAppearance();
    const components: ThemeComponents = {
      StageLoading: {
        slotClassNames: { root: "theme-root" },
        variants: [
          {
            props: { active: true, hasContent: true },
            slotClassNames: { root: "retained-active" },
          },
        ],
      },
    };
    const fixture = (active: boolean) => (
      <Theme appearance={appearance} components={components}>
        <StageLoading active={active} label="Loading" data-testid="loading">
          Retained
        </StageLoading>
      </Theme>
    );
    const view = renderFixture(fixture(false));
    expect(screen.getByTestId("loading")).toHaveClass("theme-root");
    expect(screen.getByTestId("loading")).not.toHaveClass("retained-active");
    view.rerender(fixture(true));
    expect(screen.getByTestId("loading")).toHaveClass("retained-active");
  });

  it("uses local pending for error root-only variants and preserves Theme recovery defaults", async () => {
    const appearance = createAppearance();
    const work = deferred();
    const retry = vi.fn(() => work.promise);
    const components: ThemeComponents = {
      Stage: {
        defaultProps: { retryLabel: "Theme retry", onRetry: retry },
        slotClassNames: { root: "theme-error" },
        variants: [
          {
            props: { status: "error", presentation: "region", pending: true },
            slotClassNames: { root: "theme-pending" },
          },
        ],
      },
    };
    const { container } = renderFixture(
      <Theme appearance={appearance} components={components}>
        {errorState()}
      </Theme>,
    );
    const error = container.querySelector(".miaixz-exception");
    expect(error).toHaveClass("theme-error");
    expect(error).not.toHaveClass("theme-pending");
    fireEvent.click(screen.getByRole("button", { name: "Theme retry" }));
    expect(error).toHaveClass("theme-pending");
    for (const name of ["theme-error", "theme-pending"]) {
      expect(container.querySelector(".miaixz-stage-loading")).not.toHaveClass(name);
    }
    await flushFrame();
    await flushFrame();
    await act(async () => {
      work.resolve();
      await work.promise;
    });
    expect(error).not.toHaveClass("theme-pending");
  });

  it("merges default, native, variant, and caller slot layers against the same loading state", () => {
    const appearance = createAppearance();
    const calls: string[] = [];
    const themeRoot = vi.fn(() => ({ className: "default-slot", style: { color: "blue" } }));
    const root = vi.fn(() => ({
      className: "caller-root",
      style: { color: "purple" },
      onClick: () => calls.push("slot"),
    }));
    const content = vi.fn(() => ({ className: "caller-content" }));
    const surface = vi.fn(() => ({ className: "caller-surface" }));
    const ref = createRef<HTMLDivElement>();
    const components: ThemeComponents = {
      StageLoading: {
        defaultProps: {
          className: "default-root",
          style: { color: "red", backgroundColor: "black" },
          slotProps: {
            root: themeRoot,
            content: { className: "default-content" },
            surface: { className: "default-surface" },
          },
        },
        slotClassNames: { root: "theme-root", content: "theme-content", surface: "theme-surface" },
        variants: [
          {
            props: { active: true },
            slotClassNames: { root: "active-root", surface: "active-surface" },
          },
        ],
      },
    };
    const fixture = (active: boolean) => (
      <Theme appearance={appearance} components={components}>
        <StageLoading
          active={active}
          label="Loading"
          ref={ref}
          className="native-root"
          style={{ color: "green" }}
          data-testid="loading"
          onClick={() => calls.push("native")}
          slotProps={{ root, content, surface }}
        >
          <button type="button">Child</button>
        </StageLoading>
      </Theme>
    );
    const view = renderFixture(fixture(false));
    const loading = screen.getByTestId("loading");
    expect(loading).toHaveClass(
      "default-root",
      "default-slot",
      "native-root",
      "theme-root",
      "caller-root",
    );
    for (const name of ["default-root", "default-slot"]) {
      expect(loading.className.split(/\s+/u).filter((value) => value === name)).toHaveLength(1);
    }
    expect(loading).toHaveStyle({
      color: "rgb(128, 0, 128)",
      "background-color": "rgb(0, 0, 0)",
    });
    fireEvent.click(screen.getByRole("button", { name: "Child" }));
    expect(calls).toEqual(["native", "slot"]);
    expect(ref.current).toBe(loading);
    view.rerender(fixture(true));
    expect(loading).toHaveClass("active-root");
    expect(loading.querySelector(".miaixz-overlay-content")).toHaveClass(
      "default-content",
      "theme-content",
      "caller-content",
    );
    expect(loading.querySelector(".miaixz-overlay-surface")).toHaveClass(
      "default-surface",
      "theme-surface",
      "active-surface",
      "caller-surface",
    );
    for (const slot of [themeRoot, root, content, surface])
      expect(slot).toHaveBeenLastCalledWith({ active: true, hasContent: true });
    expect(ref.current).toBe(loading);
  });

  it("resolves Theme and caller Exception slots using the actual retry owner state", async () => {
    const appearance = createAppearance();
    const work = deferred();
    const retry = vi.fn(() => work.promise);
    const themeRoot = vi.fn(() => ({ className: "default-error-root" }));
    const themeRegion = vi.fn(() => ({ className: "default-error-region" }));
    const themeTitle = vi.fn(() => ({ className: "default-error-title" }));
    const themeContent = vi.fn(() => ({ className: "default-error-content" }));
    const themeIllustration = vi.fn(() => ({ className: "default-error-illustration" }));
    const callerRoot = vi.fn(() => ({ className: "caller-error-root" }));
    const components: ThemeComponents = {
      Stage: {
        defaultProps: {
          slotProps: {
            root: themeRoot,
            region: themeRegion,
            title: themeTitle,
            content: themeContent,
            illustration: themeIllustration,
          },
        },
        slotClassNames: {
          root: "theme-error-root",
          region: "theme-error-region",
          title: "theme-error-title",
          content: "theme-error-content",
          illustration: "theme-error-illustration",
        },
      },
    };
    const { container } = renderFixture(
      <Theme appearance={appearance} components={components}>
        {errorState({
          retryLabel: "Retry",
          onRetry: retry,
          className: "native-error-root",
          slotProps: { root: callerRoot },
        })}
      </Theme>,
    );
    const error = container.querySelector(".miaixz-exception");
    expect(error).toHaveClass(
      "default-error-root",
      "theme-error-root",
      "native-error-root",
      "caller-error-root",
    );
    expect(error?.parentElement).toHaveClass("default-error-region", "theme-error-region");
    expect(error?.querySelector(".miaixz-exception-title")).toHaveClass(
      "default-error-title",
      "theme-error-title",
    );
    expect(error?.querySelector(".miaixz-exception-content")).toHaveClass(
      "default-error-content",
      "theme-error-content",
    );
    expect(error?.querySelector(".miaixz-exception-illustration")).toHaveClass(
      "default-error-illustration",
      "theme-error-illustration",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    for (const slot of [
      themeRoot,
      themeRegion,
      themeTitle,
      themeContent,
      themeIllustration,
      callerRoot,
    ]) {
      expect(slot).toHaveBeenLastCalledWith({
        status: "error",
        presentation: "region",
        pending: true,
      });
    }
    await flushFrame();
    await flushFrame();
    await act(async () => {
      work.resolve();
      await work.promise;
    });
  });

  it.each(["omitted", "null", "undefined"] as const)(
    "preserves caller children precedence over Theme defaults: %s",
    (mode) => {
      const appearance = createAppearance();
      const components: ThemeComponents = {
        StageLoading: {
          defaultProps: {
            children: <span>Theme child</span>,
            placeholder: <span>Theme placeholder</span>,
          },
        },
      };
      const overrides = mode === "omitted" ? {} : { children: mode === "null" ? null : undefined };
      renderFixture(
        <Theme appearance={appearance} components={components}>
          <StageLoading active={false} label="Loading" {...overrides} />
        </Theme>,
      );
      expect(screen.queryByText("Theme child") !== null).toBe(mode === "omitted");
      expect(screen.queryByText("Theme placeholder") !== null).toBe(mode !== "omitted");
    },
  );

  it.each(["omitted", "null", "undefined"] as const)(
    "preserves caller placeholder precedence over Theme defaults: %s",
    (mode) => {
      const appearance = createAppearance();
      const components: ThemeComponents = {
        StageLoading: { defaultProps: { placeholder: <span>Theme placeholder</span> } },
      };
      const overrides =
        mode === "omitted" ? {} : { placeholder: mode === "null" ? null : undefined };
      renderFixture(
        <Theme appearance={appearance} components={components}>
          <StageLoading active={false} label="Loading" {...overrides} />
        </Theme>,
      );
      expect(screen.queryByText("Theme placeholder") !== null).toBe(mode === "omitted");
    },
  );

  it.each(["omitted", "null", "undefined"] as const)(
    "preserves Async loading placeholder precedence: %s",
    (mode) => {
      const appearance = createAppearance();
      const components: ThemeComponents = {
        Stage: {
          defaultProps: { status: "loading", placeholder: <span>Theme placeholder</span> },
        },
      };
      const overrides =
        mode === "omitted" ? {} : { placeholder: mode === "null" ? null : undefined };
      renderFixture(
        <Theme appearance={appearance} components={components}>
          <Stage status="loading" label="Loading" {...overrides} />
        </Theme>,
      );
      expect(screen.queryByText("Theme placeholder") !== null).toBe(mode === "omitted");
    },
  );

  it.each(["omitted", "null", "undefined"] as const)(
    "preserves Async empty description and action precedence: %s",
    (mode) => {
      const appearance = createAppearance();
      const components: ThemeComponents = {
        Stage: {
          defaultProps: {
            status: "empty",
            description: <span>Theme description</span>,
            actions: <button type="button">Theme action</button>,
          },
        },
      };
      const value = mode === "null" ? null : undefined;
      const overrides = mode === "omitted" ? {} : { description: value, actions: value };
      renderFixture(
        <Theme appearance={appearance} components={components}>
          <Stage status="empty" title="No items" {...overrides} />
        </Theme>,
      );
      expect(screen.queryByText("Theme description") !== null).toBe(mode === "omitted");
      expect(screen.queryByText("Theme action") !== null).toBe(mode === "omitted");
    },
  );

  it.each(["omitted", "null", "undefined"] as const)(
    "preserves Async error action precedence: %s",
    (mode) => {
      const appearance = createAppearance();
      const components: ThemeComponents = {
        Stage: {
          defaultProps: { status: "error", actions: <button type="button">Theme action</button> },
        },
      };
      const overrides = mode === "omitted" ? {} : { actions: mode === "null" ? null : undefined };
      renderFixture(
        <Theme appearance={appearance} components={components}>
          {errorState(overrides)}
        </Theme>,
      );
      expect(screen.queryByText("Theme action") !== null).toBe(mode === "omitted");
    },
  );
});

describe("error loading slot composition", () => {
  it.each(["inline", "region"] as const)(
    "keeps one existing %s recovery overlay and resolves its real loading state",
    async (presentation) => {
      const work = deferred();
      const retry = vi.fn(() => work.promise);
      const root = vi.fn((ownerState: Readonly<StageLoadingOwnerState>) => ({
        className: "recovery-root",
        "data-testid": "recovery-feedback",
        "data-feedback-phase": ownerState.active ? "busy" : "idle",
        "data-with-content": ownerState.hasContent,
      }));
      const content = vi.fn(() => ({ className: "recovery-content" }));
      const surface = vi.fn(() => ({
        className: "recovery-surface",
        "data-testid": "recovery-surface",
      }));
      const view = renderFixture(
        errorState({
          presentation,
          retryLabel: "Retry",
          onRetry: retry,
          slotProps: {
            root: { "data-testid": "presentation", className: "presentation-root" },
            region: { className: "presentation-region" },
          },
          loadingSlotProps: { root, content, surface },
        }),
      );
      const feedback = screen.getByTestId("recovery-feedback");
      const error = screen.getByTestId("presentation");
      expect(view.container.querySelectorAll(".miaixz-overlay")).toHaveLength(1);
      expect(view.container.querySelectorAll(".miaixz-stage-loading")).toHaveLength(1);
      expect(feedback).toHaveClass("miaixz-overlay", "miaixz-stage-loading", "recovery-root");
      expect(feedback).toHaveAttribute("data-feedback-phase", "idle");
      expect(feedback).toHaveAttribute("data-with-content", "true");
      expect(feedback).not.toHaveAttribute("aria-busy");
      expect(feedback.querySelector(":scope > .miaixz-overlay-content")).toHaveClass(
        "recovery-content",
      );
      expect(screen.queryByTestId("recovery-surface")).toBeNull();
      expect(error).toHaveClass("presentation-root");
      expect(error).not.toHaveClass("recovery-root");
      if (presentation === "region") {
        expect(error).toHaveClass("miaixz-exception");
        expect(error.parentElement).toHaveClass("presentation-region");
      } else {
        expect(error).toHaveClass("miaixz-alert");
        expect(view.container.querySelector(".presentation-region")).toBeNull();
      }
      for (const slot of [root, content, surface]) {
        expect(slot).toHaveBeenLastCalledWith({ active: false, hasContent: true });
      }

      fireEvent.click(screen.getByRole("button", { name: "Retry" }));
      expect(screen.getByTestId("recovery-feedback")).toBe(feedback);
      expect(feedback).toHaveAttribute("data-feedback-phase", "busy");
      expect(feedback).toHaveAttribute("aria-busy", "true");
      expect(feedback.querySelector(":scope > .miaixz-overlay-content")).toHaveAttribute("inert");
      expect(screen.getByTestId("recovery-surface")).toHaveClass(
        "miaixz-stage-loading-surface",
        "recovery-surface",
      );
      expect(view.container.querySelector("[loadingslotprops]")).toBeNull();
      for (const slot of [root, content, surface]) {
        expect(slot).toHaveBeenLastCalledWith({ active: true, hasContent: true });
      }
      await flushFrame();
      expect(retry).not.toHaveBeenCalled();
      await flushFrame();
      expect(retry).toHaveBeenCalledTimes(1);
      await act(async () => {
        work.resolve();
        await work.promise;
      });
      expect(screen.getByTestId("recovery-feedback")).toBe(feedback);
      expect(screen.getByTestId("presentation")).toBe(error);
      expect(feedback).toHaveAttribute("data-feedback-phase", "idle");
      expect(feedback).not.toHaveAttribute("aria-busy");
      expect(screen.queryByTestId("recovery-surface")).toBeNull();
      for (const slot of [root, content, surface]) {
        expect(slot).toHaveBeenLastCalledWith({ active: false, hasContent: true });
      }
    },
  );

  it("merges every loading Theme and caller slot without replacing error presentation", () => {
    const appearance = createAppearance();
    const calls: string[] = [];
    const themeRoot = vi.fn((ownerState: Readonly<StageLoadingOwnerState>) => ({
      className: "async-default-root",
      style: { color: "red", backgroundColor: "black" },
      "data-theme-active": ownerState.active,
      onClick: () => calls.push("async-theme"),
    }));
    const themeSurface = vi.fn(() => ({
      className: "async-default-surface",
      style: { backgroundColor: "red" },
      "data-surface-layer": "theme",
    }));
    const root = vi.fn((ownerState: Readonly<StageLoadingOwnerState>) => ({
      className: "caller-loading-root",
      style: { color: "purple" },
      "data-testid": "loading-feedback",
      "data-caller-active": ownerState.active,
      onClick: () => calls.push("caller"),
    }));
    const content = vi.fn(() => ({
      className: "caller-loading-content",
      style: { height: 9 },
    }));
    const components: ThemeComponents = {
      StageLoading: {
        defaultProps: { onClick: () => calls.push("loading-theme"), style: { opacity: 0.75 } },
        slotClassNames: {
          root: "loading-theme-root",
          content: "loading-theme-content",
          surface: "loading-theme-surface",
        },
      },
      Stage: {
        defaultProps: {
          loadingSlotProps: {
            root: themeRoot,
            content: {
              className: "async-default-content",
              style: { width: 12 },
              "data-content-layer": "theme",
            },
            surface: themeSurface,
          },
        },
      },
    };
    const fixture = (retrying: boolean) => (
      <Theme appearance={appearance} components={components}>
        {errorState({
          retrying,
          "data-testid": "error-presentation",
          loadingSlotProps: {
            root,
            content,
            surface: {
              className: "caller-loading-surface",
              style: { backgroundColor: "green" },
              "data-surface-layer": "caller",
            },
          },
        })}
      </Theme>
    );
    const view = renderFixture(fixture(false));
    const feedback = screen.getByTestId("loading-feedback");
    const error = screen.getByTestId("error-presentation");
    expect(feedback).toHaveClass("loading-theme-root", "async-default-root", "caller-loading-root");
    for (const name of ["loading-theme-root", "async-default-root", "caller-loading-root"]) {
      expect(feedback.className.split(/\s+/u).filter((value) => value === name)).toHaveLength(1);
    }
    expect(feedback).toHaveStyle({
      color: "rgb(128, 0, 128)",
      "background-color": "rgb(0, 0, 0)",
      opacity: "0.75",
    });
    const retained = feedback.querySelector(":scope > .miaixz-overlay-content");
    expect(retained).toHaveClass(
      "loading-theme-content",
      "async-default-content",
      "caller-loading-content",
    );
    expect(retained).toHaveStyle({ width: "12px", height: "9px" });
    expect(retained).toHaveAttribute("data-content-layer", "theme");
    fireEvent.click(feedback);
    expect(calls).toEqual(["loading-theme", "async-theme", "caller"]);
    expect(error).not.toHaveClass("async-default-root", "caller-loading-root");
    expect(view.container.querySelector("[loadingslotprops]")).toBeNull();

    view.rerender(fixture(true));
    expect(screen.getByTestId("loading-feedback")).toBe(feedback);
    expect(feedback).toHaveAttribute("data-theme-active", "true");
    expect(feedback).toHaveAttribute("data-caller-active", "true");
    expect(feedback).toHaveAttribute("aria-busy", "true");
    const surface = feedback.querySelector(":scope > .miaixz-overlay-surface");
    expect(surface).toHaveClass(
      "loading-theme-surface",
      "async-default-surface",
      "caller-loading-surface",
    );
    expect(surface).toHaveStyle({ "background-color": "rgb(0, 128, 0)" });
    expect(surface).toHaveAttribute("data-surface-layer", "caller");
    for (const slot of [themeRoot, themeSurface, root, content]) {
      expect(slot).toHaveBeenLastCalledWith({ active: true, hasContent: true });
    }
    expect(view.container.querySelectorAll(".miaixz-overlay")).toHaveLength(1);
  });

  it.each([
    { name: "root aria-busy", slots: () => ({ root: { "aria-busy": false } }) },
    { name: "content inert", slots: () => ({ content: { inert: false } }) },
    { name: "surface tabIndex", slots: () => ({ surface: { tabIndex: 0 } }) },
  ])("preserves the owned $name guard through retry loading slots", ({ slots }) => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() =>
      renderFixture(errorState({ retrying: true, loadingSlotProps: slots() })),
    ).toThrowError(expect.objectContaining({ code: "UI_SLOT_OWNED_PROP_CONFLICT" }));
  });
});
