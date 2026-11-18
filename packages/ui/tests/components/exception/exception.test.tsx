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
 * Verifies the independent, accessible Exception presentation contract.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Exception } from "../../../src/components/exception/index.js";
import { renderWithLocale } from "../../test-utils.helper.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Exception", () => {
  it.each([
    ["404", "Page not found", "document-search"],
    ["403", "Access denied", "restricted-archive"],
    ["500", "This page could not be loaded", "connection-repair"],
    ["unavailable", "Service temporarily unavailable", "service-restoration"],
  ] as const)(
    "renders %s without locale, theme, router or backend initialization",
    (status, title, scene) => {
      const fetch = vi.fn(() => {
        throw new Error("Backend disabled");
      });
      vi.stubGlobal("fetch", fetch);
      const { container } = render(<Exception status={status} />);
      const heading = screen.getByRole("heading", { name: title, level: 1 });
      expect(screen.getByRole("region", { name: title })).toContainElement(heading);
      expect(container.querySelector("svg")).toHaveAttribute("data-scene", scene);
      expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(
        container.querySelector(
          "img, image, script, foreignObject, svg text, [data-miaixz-identity]",
        ),
      ).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
      expect(screen.queryByRole("link")).toBeNull();
      if (status === "unavailable") {
        expect(screen.queryByText(/500|503/)).toBeNull();
        expect(screen.getByRole("region", { name: title })).toHaveAccessibleDescription(
          "Try again later.",
        );
      }
    },
  );

  it("uses built-in translations and permits explicit localized content", () => {
    const { rerender } = renderWithLocale(<Exception status="404" />);
    expect(screen.getByRole("heading", { name: "找不到这个页面" })).toBeVisible();
    rerender(
      <Exception status="500" title="无法读取列表" description="请重新加载。" headingLevel={2} />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "无法读取列表" })).toBeVisible();
    expect(screen.getByText("请重新加载。")).toBeVisible();
  });

  it("uses the shared recovery description for a localized unavailable state", () => {
    renderWithLocale(<Exception status="unavailable" />);
    expect(screen.getByRole("region", { name: "服务暂时不可用" })).toHaveAccessibleDescription(
      "请稍后重试。",
    );
  });

  it("delegates recovery to the caller and never chooses a destination", () => {
    const recover = vi.fn();
    render(<Exception status="500" actions={<button onClick={recover}>Reload</button>} />);
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(recover).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("supports alternative artwork and a purely textual state", () => {
    const { container, rerender } = render(
      <Exception
        status="404"
        illustration={<span>Custom drawing</span>}
        showCode={false}
        description={false}
      />,
    );
    expect(screen.getByText("Custom drawing")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.queryByText("404")).toBeNull();
    expect(screen.getByRole("region")).not.toHaveAttribute("aria-describedby");
    rerender(<Exception status="404" illustration={false} />);
    expect(container.querySelector(".miaixz-exception-illustration")).toBeNull();
  });

  it("keeps semantic state owned while composing background and content slots", () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <Exception
        ref={ref}
        status="403"
        background="subtle"
        slotProps={{
          root: { className: "custom-root" },
          background: { children: <span>Local backdrop</span> },
          content: (state) => ({ className: `content-${state.status}` }),
        }}
      />,
    );
    expect(ref.current).toBe(screen.getByRole("region"));
    expect(ref.current).toHaveClass("miaixz-exception", "custom-root");
    expect(ref.current).toHaveAttribute("data-status", "403");
    expect(ref.current).toHaveAttribute("data-background", "subtle");
    expect(container.querySelector(".miaixz-exception-content")).toHaveClass("content-403");
    expect(screen.getByText("Local backdrop").parentElement).toHaveAttribute("aria-hidden", "true");
    expect(ref.current).toHaveAccessibleDescription();
  });
});
