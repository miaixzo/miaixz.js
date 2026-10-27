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
 * Verifies view foundations behavior in the UI package.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  EditorLayout,
  EditorSection,
  EditorSummary,
} from "../../../src/components/editor/index.js";
import { View } from "../../../src/components/view/index.js";
import { Panel } from "../../../src/components/panel/index.js";

afterEach(cleanup);

describe("view foundations", () => {
  it("renders the content View branch without leaking branch inputs", () => {
    render(
      <View aria-label="空间视图" title="客户增长空间">
        <p>模块业务内容</p>
      </View>,
    );
    const view = screen.getByRole("region", { name: "空间视图" });
    expect(view).toHaveAttribute("data-mode", "content");
    expect(view).not.toHaveAttribute("navigation");
    expect(screen.getByText("模块业务内容")).toBeVisible();
  });

  it("renders the tabs View branch through the shared Tabs contract", () => {
    render(
      <View
        aria-label="编辑视图"
        mode="tabs"
        navigationLabel="编辑视图"
        defaultValue="form"
        items={[
          { value: "form", label: "表单", content: <p>表单内容</p> },
          { value: "source", label: "源码", content: <p>源码内容</p> },
        ]}
        title="编辑"
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "源码" }));
    expect(screen.getByRole("tabpanel", { name: "源码" })).toHaveTextContent("源码内容");
  });

  it("renders navigation and controlled tabs with one resolved slot map", () => {
    const onValueChange = vi.fn();
    const { unmount } = render(
      <View
        actions="Actions"
        aria-label="Navigation view"
        density="comfortable"
        description="Description"
        headingLevel={2}
        items={[
          { id: "overview", href: "#overview", label: "Overview", textValue: "Overview" },
          { id: "settings", href: "#settings", label: "Settings", textValue: "Settings" },
        ]}
        mode="navigation"
        navigationLabel="Sections"
        slotProps={{
          root: { className: "view-root-slot" },
          header: ({ mode }) => ({ className: `header-${mode}` }),
          actions: { className: "view-actions-slot" },
          navigation: { className: "view-navigation-slot" },
          content: { className: "view-content-slot" },
        }}
        surface="framed"
        title="Navigation"
      >
        Navigation content
      </View>,
    );
    const view = screen.getByRole("region", { name: "Navigation view" });
    expect(view).toHaveClass("view-root-slot");
    expect(view).toHaveAttribute("data-density", "comfortable");
    expect(view).toHaveAttribute("data-surface", "framed");
    expect(screen.getByRole("navigation", { name: "Sections" })).toBeInTheDocument();
    expect(screen.getByText("Navigation content")).toHaveClass("view-content-slot");
    expect(screen.getByText("Actions")).toHaveClass("view-actions-slot");
    unmount();

    render(
      <View
        aria-label="Controlled tabs view"
        items={[
          { value: "first", label: "First", content: "First content" },
          { value: "second", label: "Second", content: "Second content" },
        ]}
        mode="tabs"
        navigationLabel="Views"
        onValueChange={onValueChange}
        slotProps={{ content: { className: "view-tab-panel" } }}
        title="Tabs"
        value="first"
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Second" }));
    expect(onValueChange).toHaveBeenCalledWith("second");
    expect(screen.getByRole("tabpanel", { name: "First" })).toHaveClass("view-tab-panel");
  });

  it("preserves the frame across destination unmounts and updates current actions", () => {
    const firstAction = vi.fn();
    const secondAction = vi.fn();
    const items = [
      { id: "first", label: "First", href: "/first", textValue: "First" },
      { id: "second", label: "Second", href: "/second", textValue: "Second" },
    ];
    const renderDestination = (key: string, action: () => void) => (
      <View
        aria-label="Host"
        preserveFrame
        currentHref={key === "First" ? "/first" : "/second"}
        title={null}
      >
        <View
          key={key}
          inheritFrame
          aria-label="Module"
          mode="navigation"
          navigationLabel="Sections"
          items={items}
          title={key}
          actions={<button onClick={action}>Create</button>}
        >
          <p>{key} content</p>
        </View>
      </View>
    );
    const view = render(renderDestination("First", firstAction));
    const heading = screen.getByRole("heading", { name: "First" });
    const navigation = screen.getByRole("navigation", { name: "Sections" });
    const frame = screen.getByRole("region", { name: "Module" });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    view.rerender(
      <View aria-label="Host" preserveFrame currentHref="/second" title={null}>
        <p>Loading</p>
      </View>,
    );
    expect(heading).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create" })).not.toBeInTheDocument();
    expect(navigation).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Second" })).toHaveAttribute("aria-current", "page");
    view.rerender(renderDestination("Second", secondAction));
    expect(screen.getByRole("heading", { name: "Second" })).toBe(heading);
    expect(screen.getByRole("navigation", { name: "Sections" })).toBe(navigation);
    expect(screen.getByRole("region", { name: "Module" })).toBe(frame);
    expect(screen.queryByText("First content")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(firstAction).toHaveBeenCalledTimes(1);
    expect(secondAction).toHaveBeenCalledTimes(1);
    expect(frame.querySelector(".miaixz-view")).toBeNull();
  });

  it("keeps the registered selection when the current URL is a canonical route alias", () => {
    render(
      <View preserveFrame currentHref="/legacy" aria-label="Host" title={null}>
        <View
          inheritFrame
          aria-label="Module"
          title="Module"
          mode="navigation"
          navigationLabel="Sections"
          items={[
            {
              id: "canonical",
              href: "/canonical",
              label: "Canonical",
              textValue: "Canonical",
              current: "page",
            },
            { id: "other", href: "/other", label: "Other", textValue: "Other" },
          ]}
        >
          Content
        </View>
      </View>,
    );
    expect(screen.getByRole("link", { name: "Canonical" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Other" })).not.toHaveAttribute("aria-current");
  });

  it("does not let an outgoing registration clear a newer frame's actions", () => {
    const renderRoutes = (outgoing: boolean) => (
      <View aria-label="Host" preserveFrame title={null}>
        {outgoing ? (
          <View
            key="outgoing"
            inheritFrame
            aria-label="Module"
            title="Old"
            actions={<button>Old action</button>}
          >
            Old
          </View>
        ) : null}
        <View
          key="incoming"
          inheritFrame
          aria-label="Module"
          title="New"
          actions={<button>New action</button>}
        >
          New
        </View>
      </View>
    );
    const view = render(renderRoutes(true));
    const heading = screen.getByRole("heading", { name: "New" });
    view.rerender(renderRoutes(false));
    expect(screen.getByRole("heading", { name: "New" })).toBe(heading);
    expect(screen.getByRole("button", { name: "New action" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Old action" })).not.toBeInTheDocument();
  });

  it("updates inherited frame actions after local content state changes", () => {
    /**
     * Supplies a destination action tied to its current state.
     * @returns Inherited view.
     */
    function Destination() {
      const [count, setCount] = useState(0);
      return (
        <View
          inheritFrame
          aria-label="Module"
          title="Module"
          actions={<button onClick={() => setCount(count + 1)}>Count {count}</button>}
        >
          Content {count}
        </View>
      );
    }
    render(
      <View aria-label="Host" preserveFrame title={null}>
        <Destination />
      </View>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Count 0" }));
    fireEvent.click(screen.getByRole("button", { name: "Count 1" }));
    expect(screen.getByText("Content 2")).toBeVisible();
  });

  it("keeps inherited views usable without a persistent parent", () => {
    render(
      <View inheritFrame aria-label="Standalone" title="Standalone">
        Content
      </View>,
    );
    expect(screen.getByRole("heading", { name: "Standalone" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Standalone" })).not.toHaveAttribute("inheritFrame");
  });

  it("keeps Editor summary data and content in distinct layout owners", () => {
    render(
      <EditorLayout
        divided
        layout="split"
        summary={
          <EditorSummary
            avatar={<span>A</span>}
            items={[{ id: "role", label: "角色", value: "管理员" }]}
            subtitle="账号"
            surface="plain"
            title="Alice"
          />
        }
      >
        <EditorSection title="资料" surface="card">
          表单
        </EditorSection>
      </EditorLayout>,
    );
    expect(screen.getByText("Alice").closest("aside")).toHaveAttribute("data-surface", "plain");
    expect(screen.getByText("管理员")).toBeVisible();
    expect(screen.getByText("资料").closest("section")).toHaveAttribute("data-surface", "card");
  });

  it("composes a named semantic Panel without alternate body contracts", () => {
    render(
      <Panel aria-label="审计面板" as="aside" frame="elevated" title="审计">
        记录
      </Panel>,
    );
    const panel = screen.getByRole("complementary", { name: "审计面板" });
    expect(panel).toHaveAttribute("data-frame", "elevated");
    expect(panel.querySelector(".miaixz-panel-body")).toHaveTextContent("记录");
  });
});
