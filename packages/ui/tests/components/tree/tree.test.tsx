/**
 * Verifies tree behavior in the UI package.
 */

import { readFileSync } from "node:fs";
import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";

import { Tree, type TreeNode } from "../../../src/components/tree/index.js";
import { useTreeAsyncLoader } from "../../../src/components/tree/tree-async-loader.js";
import { MiaixzLocaleProvider, miaixzUiMessages } from "../../../src/i18n/index.js";
import { createTreeFixture } from "./tree-fixtures.js";

afterEach(cleanup);

const nodes: readonly TreeNode[] = [
  {
    id: "platform",
    label: "平台",
    textValue: "平台",
    children: [
      { id: "services", label: "服务", textValue: "服务" },
      { id: "settings", label: "设置", textValue: "设置" },
    ],
  },
  { id: "audit", label: "审计", textValue: "审计" },
];

describe("Tree", () => {
  it("keeps primary labels and trailing values on the shared body typography", () => {
    const css = readFileSync("src/styles/components/tree.css", "utf8");

    expect(css).toMatch(
      /\.miaixz-tree-label\s*\{[^}]*font-size:\s*var\(--miaixz-text-body-size\)/su,
    );
    expect(css).toMatch(
      /\.miaixz-tree-trailing\s*\{[^}]*font-size:\s*var\(--miaixz-text-body-size\)/su,
    );
    expect(css).toMatch(
      /\.miaixz-tree-trailing\s*\{[^}]*line-height:\s*var\(--miaixz-text-body-line-height\)/su,
    );
  });

  it("keeps root refs, classes, and native data attributes on role=tree", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Tree
          ref={ref}
          label="根契约"
          nodes={nodes}
          className="business-tree"
          data-business="catalog"
        />
      </MiaixzLocaleProvider>,
    );
    const tree = screen.getByRole("tree", { name: "根契约" });
    expect(ref.current).toBe(tree);
    expect(tree).toHaveClass("miaixz-tree", "business-tree");
    expect(tree).toHaveAttribute("data-business", "catalog");
    expect(tree).toHaveAttribute("data-view", "nested");
  });

  it("keeps expansion, selection and keyboard navigation semantics", () => {
    const onExpandedIdsChange = vi.fn();
    const onSelectedIdsChange = vi.fn();
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Tree
          label="平台目录"
          nodes={nodes}
          onExpandedIdsChange={onExpandedIdsChange}
          onSelectedIdsChange={onSelectedIdsChange}
        />
      </MiaixzLocaleProvider>,
    );

    const platform = screen.getByRole("treeitem", { name: "平台" });
    platform.focus();
    fireEvent.keyDown(platform, { key: "ArrowRight" });
    expect(onExpandedIdsChange).toHaveBeenLastCalledWith(["platform"]);
    expect(platform).toHaveAttribute("aria-expanded", "true");
    const services = screen.getByRole("treeitem", { name: "服务" });

    fireEvent.keyDown(platform, { key: "ArrowRight" });
    expect(services).toHaveFocus();
    fireEvent.keyDown(services, { key: " " });
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(["services"]);
    expect(services).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(services, { key: "ArrowDown" });
    expect(screen.getByRole("treeitem", { name: "设置" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "End" });
    expect(screen.getByRole("treeitem", { name: "审计" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "Home" });
    expect(platform).toHaveFocus();
    fireEvent.keyDown(platform, { key: "ArrowLeft" });
    expect(platform).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps long nested labels reachable while preserving outline hierarchy", () => {
    const longLabel = "这是一个需要在窄目录中截断显示但仍保留完整可访问名称的超长节点标签";
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Tree
          label="长标签目录"
          nodes={[
            {
              id: "root",
              label: "根节点",
              textValue: "根节点",
              children: [{ id: "long", label: longLabel, textValue: longLabel }],
            },
          ]}
          defaultExpandedIds={["root"]}
          defaultSelectedIds={["long"]}
          connectors
          surface="plain"
        />
      </MiaixzLocaleProvider>,
    );

    const root = screen.getByRole("treeitem", { name: "根节点" });
    const nested = screen.getByRole("treeitem", { name: longLabel });
    expect(root).toHaveAttribute("aria-level", "1");
    expect(root).toHaveAttribute("aria-expanded", "true");
    expect(nested).toHaveAttribute("aria-level", "2");
    expect(nested).toHaveAttribute("aria-selected", "true");
    expect(nested.querySelector(".miaixz-tree-label")).toHaveTextContent(longLabel);
  });

  it("exposes dense nested indentation without flattening hierarchy", () => {
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Tree
          label="密集层级目录"
          nodes={createTreeFixture(8)}
          view="nested"
          defaultExpansion="all"
          defaultSelectedIds={["tree-depth-08"]}
          slotProps={{
            row: (ownerState) => ({
              className: ownerState.selected ? "selected-tree-row" : undefined,
            }),
          }}
          viewOptions={{ indent: "dense" }}
        />
      </MiaixzLocaleProvider>,
    );

    expect(screen.getByRole("tree", { name: "密集层级目录" })).toHaveAttribute(
      "data-indent",
      "dense",
    );
    const deepestItem = screen.getByRole("treeitem", { name: "Tree level 8" });
    expect(deepestItem).toHaveAttribute("data-visual-level", "7");
    expect(deepestItem.querySelector(":scope > .miaixz-tree-row")).toHaveClass("selected-tree-row");
  });

  it("retains controlled multiple selection and disabled nodes", () => {
    const onSelectedIdsChange = vi.fn();
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Tree
          label="受控目录"
          nodes={[...nodes, { id: "locked", label: "锁定", textValue: "锁定", disabled: true }]}
          onSelectedIdsChange={onSelectedIdsChange}
          selectedIds={["audit"]}
          selectionMode="multiple"
        />
      </MiaixzLocaleProvider>,
    );
    expect(screen.getByRole("tree", { name: "受控目录" })).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
    expect(screen.getByRole("treeitem", { name: "审计" })).toHaveAttribute("aria-selected", "true");
    const locked = screen.getByRole("treeitem", { name: "锁定" });
    fireEvent.click(locked.firstElementChild!);
    expect(locked).toHaveAttribute("aria-disabled", "true");
    expect(onSelectedIdsChange).not.toHaveBeenCalled();
  });

  it("enables controlled create, move, rename, and delete requests by default", async () => {
    const onCreateRequest = vi.fn();
    const onMoveRequest = vi.fn();
    const onRenameRequest = vi.fn();
    const onDeleteRequest = vi.fn();
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Tree
          label="可编辑目录"
          nodes={nodes}
          onCreateRequest={onCreateRequest}
          onMoveRequest={onMoveRequest}
          onRenameRequest={onRenameRequest}
          onDeleteRequest={onDeleteRequest}
        />
      </MiaixzLocaleProvider>,
    );

    const platform = screen.getByRole("treeitem", { name: "平台" });
    fireEvent.doubleClick(platform.querySelector(".miaixz-tree-label")!);
    const rename = screen.getByRole("textbox", { name: "重命名项目" });
    fireEvent.change(rename, { target: { value: "平台服务" } });
    fireEvent.keyDown(rename, { key: "Enter" });
    await waitFor(() =>
      expect(onRenameRequest).toHaveBeenCalledWith(
        expect.objectContaining({ id: "platform", nextTextValue: "平台服务" }),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "新建子项于 平台" }));
    const create = screen.getByRole("textbox", { name: "新子项名称" });
    fireEvent.change(create, { target: { value: "监控" } });
    fireEvent.keyDown(create, { key: "Enter" });
    await waitFor(() =>
      expect(onCreateRequest).toHaveBeenCalledWith(
        expect.objectContaining({ parentId: "platform", name: "监控" }),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "删除 审计" }));
    await waitFor(() =>
      expect(onDeleteRequest).toHaveBeenCalledWith(expect.objectContaining({ id: "audit" })),
    );

    const dataTransfer = {
      dropEffect: "none",
      effectAllowed: "none",
      setData: vi.fn(),
    };
    fireEvent.dragStart(screen.getByRole("button", { name: "移动 审计" }), { dataTransfer });
    const platformRow = platform.querySelector(":scope > .miaixz-tree-row")!;
    fireEvent.dragOver(platformRow, { clientY: 0, dataTransfer });
    fireEvent.drop(platformRow, { clientY: 0, dataTransfer });
    await waitFor(() =>
      expect(onMoveRequest).toHaveBeenCalledWith(
        expect.objectContaining({ sourceId: "audit", targetId: "platform", position: "inside" }),
      ),
    );
  });

  it("supports disabling every built-in mutation affordance", () => {
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Tree
          label="只读目录"
          nodes={nodes}
          creatable={false}
          movable={false}
          renamable={false}
          deletable={false}
          onCreateRequest={() => undefined}
          onMoveRequest={() => undefined}
          onRenameRequest={() => undefined}
          onDeleteRequest={() => undefined}
        />
      </MiaixzLocaleProvider>,
    );
    expect(screen.queryByRole("button", { name: /新建子项于/u })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /移动/u })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /删除/u })).not.toBeInTheDocument();
    fireEvent.doubleClick(screen.getByText("平台"));
    expect(screen.queryByRole("textbox", { name: "重命名项目" })).not.toBeInTheDocument();
  });

  it("locks an asynchronous operation and reports callback failures", async () => {
    let rejectDelete: ((reason?: unknown) => void) | undefined;
    const onOperationError = vi.fn();
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Tree
          label="异步目录操作"
          nodes={nodes}
          onDeleteRequest={() =>
            new Promise<void>((_resolve, reject) => {
              rejectDelete = reject;
            })
          }
          onOperationError={onOperationError}
        />
      </MiaixzLocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "删除 审计" }));
    expect(screen.getByRole("treeitem", { name: "审计" })).toHaveAttribute("aria-busy", "true");
    await act(async () => rejectDelete?.(new Error("network")));
    await waitFor(() => expect(onOperationError).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("treeitem", { name: "审计" })).not.toHaveAttribute("aria-busy", "true");
  });

  it("supports keyboard mutation controls and cancels unchanged edits", async () => {
    const onCreateRequest = vi.fn();
    const onRenameRequest = vi.fn();
    const onDeleteRequest = vi.fn();
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Tree
          label="键盘编辑目录"
          nodes={nodes}
          onCreateRequest={onCreateRequest}
          onRenameRequest={onRenameRequest}
          onDeleteRequest={onDeleteRequest}
        />
      </MiaixzLocaleProvider>,
    );

    const audit = screen.getByRole("treeitem", { name: "审计" });
    fireEvent.keyDown(audit, { key: "F2" });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "重命名项目" }), { key: "Enter" });
    expect(onRenameRequest).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "重命名项目" })).not.toBeInTheDocument();

    fireEvent.keyDown(audit, { key: "F2" });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "重命名项目" }), { key: "Escape" });
    expect(screen.queryByRole("textbox", { name: "重命名项目" })).not.toBeInTheDocument();

    fireEvent.keyDown(audit, { key: "Delete" });
    await waitFor(() =>
      expect(onDeleteRequest).toHaveBeenCalledWith(expect.objectContaining({ id: "audit" })),
    );
    await waitFor(() => expect(audit).not.toHaveAttribute("aria-busy", "true"));

    fireEvent.click(screen.getByRole("button", { name: "新建子项于 平台" }));
    const create = await screen.findByRole("textbox", { name: "新子项名称" });
    fireEvent.change(create, { target: { value: "   " } });
    fireEvent.keyDown(create, { key: "Enter" });
    expect(onCreateRequest).not.toHaveBeenCalled();
    fireEvent.keyDown(create, { key: "Escape" });
    expect(screen.queryByRole("textbox", { name: "新子项名称" })).not.toBeInTheDocument();
  });

  it("resolves before and after drop positions and rejects a self drop", async () => {
    const onMoveRequest = vi.fn();
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Tree label="可移动目录" nodes={nodes} onMoveRequest={onMoveRequest} />
      </MiaixzLocaleProvider>,
    );

    const audit = screen.getByRole("treeitem", { name: "审计" });
    const platform = screen.getByRole("treeitem", { name: "平台" });
    const platformRow = platform.querySelector(":scope > .miaixz-tree-row")!;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: 0,
      bottom: 100,
      height: 100,
      left: 0,
      right: 100,
      width: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const dataTransfer = {
      dropEffect: "none",
      effectAllowed: "none",
      setData: vi.fn(),
    };
    const dispatchDrag = (target: Element, type: string, clientY: number) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperties(event, {
        clientY: { value: clientY },
        dataTransfer: { value: dataTransfer },
      });
      fireEvent(target, event);
    };
    const dragHandle = screen.getByRole("button", { name: "移动 审计" });
    fireEvent.dragStart(dragHandle, { dataTransfer });
    dispatchDrag(platformRow, "dragover", 1);
    expect(platform).toHaveAttribute("data-drop-position", "before");
    fireEvent.dragLeave(platformRow, { relatedTarget: document.body });
    expect(platform).not.toHaveAttribute("data-drop-position");

    dispatchDrag(platformRow, "dragover", 99);
    expect(platform).toHaveAttribute("data-drop-position", "after");
    dispatchDrag(platformRow, "drop", 99);
    await waitFor(() =>
      expect(onMoveRequest).toHaveBeenCalledWith(
        expect.objectContaining({ sourceId: "audit", targetId: "platform", position: "after" }),
      ),
    );

    fireEvent.dragStart(dragHandle, { dataTransfer });
    dispatchDrag(audit.querySelector(":scope > .miaixz-tree-row")!, "dragover", 50);
    expect(audit).not.toHaveAttribute("data-drop-position");
  });

  it("renders leading, description, trailing, and capped compact depth", () => {
    const deep = createTreeFixture(10).map((root) => ({ ...root, leading: "Folder" }));
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Tree
          label="压缩目录"
          nodes={deep}
          view="compact"
          defaultExpansion="all"
          viewOptions={{ compression: "balanced" }}
        />
      </MiaixzLocaleProvider>,
    );
    const levelTen = screen.getByRole("treeitem", { name: "Tree level 10" });
    expect(levelTen).toHaveAttribute("aria-level", "10");
    expect(levelTen).toHaveAttribute("data-visual-level", "5");
    expect(levelTen).toHaveAttribute("data-logical-level", "10");
    expect(levelTen).toHaveAttribute("data-semantic-level", "10");
    expect(levelTen).toHaveAttribute("data-state-expanded", "false");
    expect(levelTen).toHaveAttribute("data-disclosed", "false");
    const levelTwo = screen.getByRole("treeitem", { name: "Tree level 2" });
    const description = levelTwo.querySelector(".miaixz-tree-description");
    expect(description).toHaveAttribute("id");
    expect(levelTwo).toHaveAttribute("aria-describedby", description?.id);
    expect(screen.getByText("Folder")).toHaveClass("miaixz-tree-leading");
  });

  it("enters a focus boundary with ArrowRight and exposes private path navigation", () => {
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Tree
          label="聚焦目录"
          nodes={createTreeFixture(6)}
          view="focus"
          defaultExpansion="all"
          viewOptions={{ windowDepth: 3, navigation: "both" }}
        />
      </MiaixzLocaleProvider>,
    );
    const boundary = screen.getByRole("treeitem", { name: "Tree level 3" });
    expect(boundary).toHaveAttribute("data-boundary", "true");
    boundary.focus();
    fireEvent.keyDown(boundary, { key: "ArrowRight" });
    expect(screen.getByRole("treeitem", { name: "Tree level 3" })).toHaveAttribute(
      "aria-level",
      "1",
    );
    expect(screen.getByRole("navigation", { name: "当前树路径" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回上一级" })).toBeInTheDocument();
  });

  it("renders expansion controls outside the tree and announces one aggregate result", async () => {
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Tree label="控制目录" nodes={createTreeFixture(3)} expansionControls />
      </MiaixzLocaleProvider>,
    );
    const group = screen.getByRole("group", { name: "树形结构展开控制" });
    const tree = screen.getByRole("tree", { name: "控制目录" });
    expect(tree.contains(group)).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "展开全部" }));
    await waitFor(() => expect(screen.getAllByRole("treeitem")).toHaveLength(3));
    expect(screen.getByRole("status")).toHaveTextContent("展开完成");
  });
});

describe("Tree async loader", () => {
  const parent: TreeNode<string> = {
    id: "remote",
    label: "Remote",
    textValue: "Remote",
    value: "remote",
  };

  it("does nothing without a loader and for disabled nodes", () => {
    const withoutLoader = renderHook(() => useTreeAsyncLoader<string>(undefined));
    expect(withoutLoader.result.current.load(parent)).toBeUndefined();
    withoutLoader.unmount();

    const loader = vi.fn();
    const withLoader = renderHook(() => useTreeAsyncLoader(loader));
    expect(withLoader.result.current.load({ ...parent, disabled: true })).toBeUndefined();
    expect(loader).not.toHaveBeenCalled();
    withLoader.unmount();
  });

  it("deduplicates pending work and caches a successful child list", async () => {
    let resolveLoad: ((nodes: readonly TreeNode<string>[]) => void) | undefined;
    const loader = vi.fn(
      (_node: Readonly<TreeNode<string>>, signal: AbortSignal) =>
        new Promise<readonly TreeNode<string>[]>((resolve) => {
          expect(signal.aborted).toBe(false);
          resolveLoad = resolve;
        }),
    );
    const { result, unmount } = renderHook(() => useTreeAsyncLoader(loader));
    let first: Promise<readonly TreeNode<string>[]> | undefined;
    act(() => {
      first = result.current.load(parent);
      expect(result.current.load(parent)).toBe(first);
    });
    expect(result.current.loadingIds.has("remote")).toBe(true);
    await act(async () => {
      resolveLoad?.([{ id: "child", label: "Child", textValue: "Child", value: "child" }]);
      await first;
    });
    expect(result.current.childCache.get("remote")?.[0]?.id).toBe("child");
    expect(result.current.loadingIds.has("remote")).toBe(false);
    expect(result.current.errorIds.has("remote")).toBe(false);
    unmount();
  });

  it("records failures, clears them on retry, and aborts pending work on unmount", async () => {
    const failure = new Error("offline");
    const loader = vi
      .fn()
      .mockRejectedValueOnce(failure)
      .mockImplementationOnce(
        (_node: Readonly<TreeNode<string>>, signal: AbortSignal) =>
          new Promise<readonly TreeNode<string>[]>((_resolve) => {
            signal.addEventListener("abort", () => undefined);
          }),
      );
    const { result, unmount } = renderHook(() => useTreeAsyncLoader(loader));
    let failed: Promise<readonly TreeNode<string>[]> | undefined;
    act(() => {
      failed = result.current.load(parent);
    });
    await expect(failed).rejects.toBe(failure);
    await waitFor(() => expect(result.current.errorIds.has("remote")).toBe(true));

    let pending: Promise<readonly TreeNode<string>[]> | undefined;
    act(() => {
      pending = result.current.load(parent);
    });
    expect(pending).toBeDefined();
    expect(result.current.errorIds.has("remote")).toBe(false);
    const signal = loader.mock.calls[1]?.[1] as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
  });
});
