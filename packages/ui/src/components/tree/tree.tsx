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
 * Implements the tree module.
 */

import { forwardRef, type ReactElement, type RefAttributes } from "react";

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { classNames } from "../../shared/class-names.js";
import { useMergedRef } from "../../shared/use-merged-ref.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";
import { TreeBreadcrumb } from "./tree-breadcrumb.js";
import { TreeExpansionControlsView } from "./tree-expansion-controls.js";
import { TreeRenderer } from "./tree-renderer.js";
import { useTree } from "./use-tree.js";
import type { TreeProps, TreeViewMode, TreeViewRootProps } from "./tree.types.js";

/**
 * Renders one business-neutral WAI-ARIA tree in nested, compact, or focus mode.
 * @param props - Public Tree data, behavior, view, slot, and presentation properties.
 * @param forwardedRef - Ref forwarded to the semantic tree root.
 * @returns A themed Tree instance backed by the headless controller.
 */
function TreeImplementation<Value = unknown, View extends TreeViewMode = TreeViewMode>(
  props: TreeProps<Value, View>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const controller = useTree(props);
  const componentProps = props as TreeProps<Value> & Partial<TreeViewRootProps>;
  const {
    nodes: _nodes,
    label: _label,
    loadChildren: _loadChildren,
    asyncCacheKey: _asyncCacheKey,
    maxVisibleNodes: _maxVisibleNodes,
    selectionMode = "single",
    selectedIds: _selectedIds,
    defaultSelectedIds: _defaultSelectedIds,
    onSelectedIdsChange: _onSelectedIdsChange,
    expandedIds: _expandedIds,
    defaultExpandedIds: _defaultExpandedIds,
    defaultExpansion: _defaultExpansion,
    onExpandedIdsChange: _onExpandedIdsChange,
    view = "nested",
    viewOptions,
    viewRootId: _viewRootId,
    defaultViewRootId: _defaultViewRootId,
    onViewRootIdChange: _onViewRootIdChange,
    expansionControls,
    surface = "framed",
    connectors = false,
    dividerStyle = "none",
    density = "standard",
    showSelectionIndicator = true,
    creatable = true,
    movable = true,
    renamable = true,
    deletable = true,
    canCreate,
    canMove,
    canDrop,
    canRename,
    canDelete,
    onCreateRequest,
    onMoveRequest,
    onRenameRequest,
    onDeleteRequest,
    operationState = null,
    onOperationError,
    slotProps,
    className,
    ...rootProps
  } = componentProps;
  const { t } = useMiaixzLocale();
  const rootRef = useMergedRef(forwardedRef, null);

  const rootInteraction = controller.getRootProps();
  const effectiveView = view as TreeViewMode;
  const focusOptions = effectiveView === "focus" ? viewOptions : undefined;
  const nestedIndent =
    effectiveView === "nested"
      ? ((viewOptions as { readonly indent?: "standard" | "compact" | "dense" } | undefined)
          ?.indent ?? "standard")
      : undefined;
  const compactCompression =
    effectiveView === "compact"
      ? ((viewOptions as { readonly compression?: "balanced" | "dense" } | undefined)
          ?.compression ?? "balanced")
      : undefined;
  const navigation =
    (focusOptions as { readonly navigation?: "breadcrumb" | "back" | "both" } | undefined)
      ?.navigation ?? "both";
  const lastResult = controller.state.lastExpansionResult;
  const announcement =
    lastResult === null
      ? ""
      : lastResult.status === "read-only"
        ? t("ui.tree.expansionReadOnly")
        : lastResult.status === "aborted"
          ? t("ui.tree.expansionAborted")
          : lastResult.status === "partial"
            ? t("ui.tree.expansionPartial", {
                expanded: lastResult.expandedIds.length,
                failed: lastResult.failedIds.length,
              })
            : t("ui.tree.expansionComplete", { expanded: lastResult.expandedIds.length });

  const tree = (
    <div
      {...rootProps}
      {...rootInteraction}
      ref={rootRef}
      className={classNames("miaixz-tree", className)}
      data-surface={surface}
      data-connectors={connectors || undefined}
      data-divider-style={dividerStyle}
      data-density={density}
      data-view={effectiveView}
      data-indent={nestedIndent}
      data-compression={compactCompression}
    >
      <TreeRenderer
        controller={controller}
        selectionMode={selectionMode}
        showSelectionIndicator={showSelectionIndicator}
        surface={surface}
        connectors={connectors}
        dividerStyle={dividerStyle}
        density={density}
        slotProps={slotProps}
        errorLabel={t("ui.tree.loadError")}
        retryLabel={t("ui.action.retry")}
        createLabel={t("ui.tree.create")}
        createInputLabel={t("ui.tree.createInput")}
        moveLabel={t("ui.tree.move")}
        renameLabel={t("ui.tree.rename")}
        deleteLabel={t("ui.tree.delete")}
        creatable={creatable}
        movable={movable}
        renamable={renamable}
        deletable={deletable}
        canCreate={canCreate}
        canMove={canMove}
        canDrop={canDrop}
        canRename={canRename}
        canDelete={canDelete}
        onCreateRequest={onCreateRequest}
        onMoveRequest={onMoveRequest}
        onRenameRequest={onRenameRequest}
        onDeleteRequest={onDeleteRequest}
        operationState={operationState}
        onOperationError={onOperationError}
      />
    </div>
  );
  const hasShell = expansionControls !== undefined && expansionControls !== false;
  const hasFocusNavigation = effectiveView === "focus";
  if (!hasShell && !hasFocusNavigation) return tree;
  return (
    <div className="miaixz-tree-shell" data-view={effectiveView}>
      {expansionControls === undefined || expansionControls === false ? null : (
        <TreeExpansionControlsView
          controller={controller}
          config={expansionControls}
          view={effectiveView}
          labels={{
            defaultLabel: t("ui.tree.expansionControls"),
            expandAll: t("ui.tree.expandAll"),
            collapseAll: t("ui.tree.collapseAll"),
            expandToDepth: t("ui.tree.expandToDepth", { depth: "" }).trim(),
            depth: (depth) => t("ui.tree.expandToDepth", { depth }),
          }}
        />
      )}
      {hasFocusNavigation ? (
        <TreeBreadcrumb
          controller={controller}
          navigation={navigation}
          currentPathLabel={t("ui.tree.currentPath")}
          rootLabel={t("ui.tree.root")}
          backLabel={t("ui.tree.back")}
        />
      ) : null}
      {tree}
      <div className="miaixz-tree-live-region" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </div>
  );
}

/**
 * Renders a business-neutral WAI-ARIA tree view. @public
 */
export const Tree = withMiaixzThemeComponent(
  "Tree",
  forwardRef(TreeImplementation) as <Value = unknown, View extends TreeViewMode = TreeViewMode>(
    props: TreeProps<Value, View> & RefAttributes<HTMLDivElement>,
  ) => ReactElement,
);
