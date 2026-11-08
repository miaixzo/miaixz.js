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
 * Verifies caller-owned fallback, local retry, and keyed scope replacement without added DOM.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MiaixzErrorBoundary } from "../../src/index.js";

/**
 * Renders neutral child content or a synthetic rendering failure selected by its owner.
 *
 * @param props - Caller-selected failure predicate and child label.
 * @returns One child element when rendering succeeds.
 */
function Fixture({ fails, label }: { readonly fails: () => boolean; readonly label: string }) {
  if (fails()) throw new Error("Synthetic render failure.");
  return <span>{label}</span>;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("public nonvisual error boundary", () => {
  it("returns normal children without wrapping DOM or calling the fallback", () => {
    const fallback = vi.fn(() => <span>Fallback</span>);
    const { container } = render(
      <MiaixzErrorBoundary fallback={fallback}>
        <button type="button">Child</button>
      </MiaixzErrorBoundary>,
    );
    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild).toBe(screen.getByRole("button", { name: "Child" }));
    expect(fallback).not.toHaveBeenCalled();
  });

  it("passes only local retry to the fallback and preserves content outside its boundary", () => {
    let failed = true;
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fallback = vi.fn((retry: () => void) => (
      <button
        type="button"
        onClick={() => {
          failed = false;
          retry();
        }}
      >
        Retry
      </button>
    ));
    const { container } = render(
      <>
        <MiaixzErrorBoundary fallback={fallback}>
          <Fixture fails={() => failed} label="Recovered" />
        </MiaixzErrorBoundary>
        <input aria-label="Preserved input" defaultValue="initial" />
      </>,
      { onCaughtError: () => undefined },
    );
    expect(container.childElementCount).toBe(2);
    expect(container.firstElementChild).toBe(screen.getByRole("button", { name: "Retry" }));
    expect(screen.queryByText("Recovered")).not.toBeInTheDocument();
    expect(fallback).toHaveBeenLastCalledWith(expect.any(Function));
    const input = screen.getByRole("textbox", { name: "Preserved input" });
    fireEvent.change(input, { target: { value: "edited" } });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.getByText("Recovered")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Preserved input" })).toBe(input);
    expect(input).toHaveValue("edited");
    expect(log).not.toHaveBeenCalled();
  });

  it("retains failure across ordinary props changes and lets an external key replace the scope", () => {
    const fallback = vi.fn(() => <span>Fallback</span>);
    const { container, rerender } = render(
      <MiaixzErrorBoundary key="first" fallback={fallback}>
        <Fixture fails={() => true} label="Initial" />
      </MiaixzErrorBoundary>,
      { onCaughtError: () => undefined },
    );
    expect(screen.getByText("Fallback")).toBeInTheDocument();
    rerender(
      <MiaixzErrorBoundary key="first" fallback={fallback}>
        <Fixture fails={() => false} label="Next" />
      </MiaixzErrorBoundary>,
    );
    expect(screen.getByText("Fallback")).toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
    rerender(
      <MiaixzErrorBoundary key="second" fallback={fallback}>
        <Fixture fails={() => false} label="Next" />
      </MiaixzErrorBoundary>,
    );
    expect(screen.queryByText("Fallback")).not.toBeInTheDocument();
    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild).toBe(screen.getByText("Next"));
  });
});
