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
 * Implements the tree renderer module.
 */

import { useState, type DragEvent, type KeyboardEvent, type MouseEvent } from "react";

import { Icon } from "@miaixz/icons";
import { Spinner } from "../spinner/spinner.js";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { TreeViewRecord } from "./tree-view.types.js";
import type { TreeController } from "./use-tree.js";
import type {
  TreeCreateRequest,
  TreeDeleteRequest,
  TreeDropPosition,
  TreeMoveRequest,
  TreeNode,
  TreeOperationContext,
  TreeOperationState,
  TreeOwnerState,
  TreeRenameRequest,
  TreeSlotProps,
} from "./tree.types.js";

/**
 * Properties accepted by the Tree view-model renderer.
 */
export interface TreeRendererProps<Value> {
  readonly controller: TreeController<Value>;
  readonly selectionMode: "none" | "single" | "multiple";
  readonly showSelectionIndicator: boolean;
  readonly surface: TreeOwnerState["surface"];
  readonly connectors: boolean;
  readonly dividerStyle: TreeOwnerState["dividerStyle"];
  readonly density: TreeOwnerState["density"];
  readonly slotProps: TreeSlotProps | undefined;
  readonly errorLabel: string;
  readonly retryLabel: string;
  readonly createLabel: string;
  readonly createInputLabel: string;
  readonly moveLabel: string;
  readonly renameLabel: string;
  readonly deleteLabel: string;
  readonly creatable: boolean;
  readonly movable: boolean;
  readonly renamable: boolean;
  readonly deletable: boolean;
  readonly canCreate: ((node: Readonly<TreeNode<Value>>) => boolean) | undefined;
  readonly canMove: ((node: Readonly<TreeNode<Value>>) => boolean) | undefined;
  readonly canDrop: ((request: TreeMoveRequest<Value>) => boolean) | undefined;
  readonly canRename: ((node: Readonly<TreeNode<Value>>) => boolean) | undefined;
  readonly canDelete: ((node: Readonly<TreeNode<Value>>) => boolean) | undefined;
  readonly onCreateRequest:
    ((request: TreeCreateRequest<Value>) => void | Promise<void>) | undefined;
  readonly onMoveRequest: ((request: TreeMoveRequest<Value>) => void | Promise<void>) | undefined;
  readonly onRenameRequest:
    ((request: TreeRenameRequest<Value>) => void | Promise<void>) | undefined;
  readonly onDeleteRequest:
    ((request: TreeDeleteRequest<Value>) => void | Promise<void>) | undefined;
  readonly operationState: TreeOperationState | null;
  readonly onOperationError:
    ((error: unknown, context: TreeOperationContext<Value>) => void) | undefined;
}

interface TreeTextEditState {
  readonly id: string;
  readonly value: string;
}

interface TreeDropState {
  readonly id: string;
  readonly position: TreeDropPosition;
}

/**
 * Renders nested semantic groups from one flat, indexed view model.
 * @param props - View model, slot configuration, styling state, and controller interactions.
 * @returns The semantic treeitem and group hierarchy for the current view model.
 */
export function TreeRenderer<Value>(props: TreeRendererProps<Value>) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropState, setDropState] = useState<TreeDropState | null>(null);
  const [createState, setCreateState] = useState<TreeTextEditState | null>(null);
  const [renameState, setRenameState] = useState<TreeTextEditState | null>(null);
  const [internalOperation, setInternalOperation] = useState<TreeOperationState | null>(null);
  const activeOperation = props.operationState ?? internalOperation;

  const isPendingFor = (id: string) =>
    activeOperation?.nodeId === id || activeOperation?.targetId === id;
  const isDescendant = (candidateId: string, ancestorId: string) => {
    let record = props.controller.collection.get(candidateId);
    while (record?.parentId !== null && record?.parentId !== undefined) {
      if (record.parentId === ancestorId) return true;
      record = props.controller.collection.get(record.parentId);
    }
    return false;
  };
  const resolveMoveRequest = (
    sourceId: string,
    targetId: string,
    position: TreeDropPosition,
  ): TreeMoveRequest<Value> | null => {
    const source = props.controller.collection.get(sourceId)?.node;
    const target = props.controller.collection.get(targetId)?.node;
    if (
      source === undefined ||
      target === undefined ||
      sourceId === targetId ||
      isDescendant(targetId, sourceId)
    ) {
      return null;
    }
    const request = { sourceId, targetId, position, source, target };
    return props.canDrop?.(request) === false ? null : request;
  };
  const getDropPosition = (event: DragEvent<HTMLDivElement>): TreeDropPosition => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = bounds.height === 0 ? 0.5 : (event.clientY - bounds.top) / bounds.height;
    return ratio < 0.25 ? "before" : ratio > 0.75 ? "after" : "inside";
  };
  const runOperation = async (
    state: TreeOperationState,
    context: TreeOperationContext<Value>,
    operation: (() => void | Promise<void>) | undefined,
  ) => {
    if (operation === undefined || activeOperation !== null) return false;
    setInternalOperation(state);
    try {
      await operation();
      return true;
    } catch (error) {
      props.onOperationError?.(error, context);
      return false;
    } finally {
      setInternalOperation(null);
    }
  };
  const commitCreate = async (parent: Readonly<TreeNode<Value>>, value: string) => {
    const name = value.trim();
    if (name.length === 0) return;
    const request = { parentId: parent.id, parent, name };
    const completed = await runOperation(
      { type: "create", nodeId: parent.id },
      { type: "create", request },
      () => props.onCreateRequest?.(request),
    );
    if (completed) setCreateState(null);
  };
  const commitRename = async (node: Readonly<TreeNode<Value>>, value: string) => {
    const nextTextValue = value.trim();
    if (nextTextValue.length === 0 || nextTextValue === node.textValue) {
      setRenameState(null);
      return;
    }
    const request = {
      id: node.id,
      node,
      previousTextValue: node.textValue,
      nextTextValue,
    };
    const completed = await runOperation(
      { type: "rename", nodeId: node.id },
      { type: "rename", request },
      () => props.onRenameRequest?.(request),
    );
    if (completed) setRenameState(null);
  };

  const renderRecord = (viewRecord: TreeViewRecord<Value>) => {
    const node = viewRecord.record.node;
    const id = viewRecord.record.id;
    const selected = props.controller.state.selectedIds.has(id);
    const loading = props.controller.state.loadingIds.has(id);
    const error = props.controller.state.errorIds.has(id);
    const expandable = viewRecord.record.expandable;
    const pending = isPendingFor(id);
    const itemCreatable =
      props.creatable &&
      props.onCreateRequest !== undefined &&
      node.disabled !== true &&
      props.canCreate?.(node) !== false;
    const itemMovable =
      props.movable &&
      props.onMoveRequest !== undefined &&
      node.disabled !== true &&
      props.canMove?.(node) !== false;
    const itemRenamable =
      props.renamable &&
      props.onRenameRequest !== undefined &&
      node.disabled !== true &&
      props.canRename?.(node) !== false;
    const itemDeletable =
      props.deletable &&
      props.onDeleteRequest !== undefined &&
      node.disabled !== true &&
      props.canDelete?.(node) !== false;
    const creating = createState?.id === id;
    const renaming = renameState?.id === id;
    const dragging = draggedId === id;
    const dropPosition = dropState?.id === id ? dropState.position : undefined;
    const state = loading
      ? "loading"
      : error
        ? "error"
        : !expandable
          ? "leaf"
          : viewRecord.disclosed
            ? "expanded"
            : "collapsed";
    const ownerState: TreeOwnerState = {
      surface: props.surface,
      connectors: props.connectors,
      dividerStyle: props.dividerStyle,
      density: props.density,
      selectionMode: props.selectionMode,
      view: props.controller.view.name,
      itemId: id,
      level: viewRecord.record.logicalLevel,
      logicalLevel: viewRecord.record.logicalLevel,
      semanticLevel: viewRecord.semanticLevel,
      visualLevel: viewRecord.visualLevel,
      stateExpanded: viewRecord.stateExpanded,
      expanded: viewRecord.stateExpanded,
      disclosed: viewRecord.disclosed,
      boundary: viewRecord.boundary,
      viewRoot: viewRecord.viewRoot,
      selected,
      disabled: node.disabled === true,
      loading,
      error,
      creatable: itemCreatable,
      movable: itemMovable,
      renamable: itemRenamable,
      deletable: itemDeletable,
      creating,
      renaming,
      dragging,
      pending,
      ...(dropPosition === undefined ? {} : { dropPosition }),
    };
    const itemInteraction = props.controller.getItemProps(id);
    const { ref: itemRef, ...itemInteractionProps } = itemInteraction;
    const expanderInteraction = props.controller.getExpanderProps(id);
    const descriptionId = itemInteraction["aria-describedby"];
    const children = viewRecord.visibleChildIds
      .map((childId) => props.controller.view.byId.get(childId))
      .filter((child): child is TreeViewRecord<Value> => child !== undefined);
    return (
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-tree-item" },
          slotProps: props.slotProps?.item,
          internalRef: itemRef,
          internalProps: {
            ...itemInteractionProps,
            "aria-busy": loading || pending || undefined,
            onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
              if (event.key === "F2" && itemRenamable && activeOperation === null) {
                event.preventDefault();
                event.stopPropagation();
                setRenameState({ id, value: node.textValue });
                return;
              }
              if (event.key === "Delete" && itemDeletable && activeOperation === null) {
                event.preventDefault();
                event.stopPropagation();
                const request = { id, node };
                void runOperation({ type: "delete", nodeId: id }, { type: "delete", request }, () =>
                  props.onDeleteRequest?.(request),
                );
                return;
              }
              itemInteractionProps.onKeyDown?.(event);
            },
            "data-state": state,
            ...(node.disabled === true ? { "data-disabled": true } : {}),
            ...(viewRecord.boundary ? { "data-boundary": true } : {}),
            ...(viewRecord.viewRoot ? { "data-view-root": true } : {}),
            "data-visual-level": viewRecord.visualLevel,
            "data-logical-level": String(viewRecord.record.logicalLevel),
            "data-semantic-level": String(viewRecord.semanticLevel),
            "data-state-expanded": String(viewRecord.stateExpanded) as "true" | "false",
            "data-disclosed": String(viewRecord.disclosed) as "true" | "false",
            ...(dragging ? { "data-dragging": true } : {}),
            ...(pending ? { "data-pending": true } : {}),
            ...(dropPosition === undefined ? {} : { "data-drop-position": dropPosition }),
          },
          ownedProps: [
            "role",
            "aria-label",
            "aria-describedby",
            "tabIndex",
            "aria-level",
            "aria-posinset",
            "aria-setsize",
            "aria-expanded",
            "aria-selected",
            "aria-disabled",
            "aria-busy",
            "data-state",
            "data-disabled",
            "data-boundary",
            "data-view-root",
            "data-visual-level",
            "data-logical-level",
            "data-semantic-level",
            "data-state-expanded",
            "data-disclosed",
            "data-dragging",
            "data-pending",
            "data-drop-position",
          ],
        })}
        key={id}
      >
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-tree-row" },
            slotProps: props.slotProps?.row,
            internalProps: {
              onClick: (event: MouseEvent<HTMLDivElement>) => {
                if (creating || renaming || pending) return;
                if (itemRenamable && event.detail > 1) {
                  event.preventDefault();
                  event.stopPropagation();
                  setRenameState({ id, value: node.textValue });
                  return;
                }
                const selectItem = () => {
                  props.controller.actions.focus(id);
                  props.controller.actions.select(id);
                };
                if (itemRenamable) window.setTimeout(selectItem, 220);
                else selectItem();
              },
              onDragOver: (event: DragEvent<HTMLDivElement>) => {
                if (draggedId === null || activeOperation !== null) return;
                const position = getDropPosition(event);
                if (resolveMoveRequest(draggedId, id, position) === null) return;
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "move";
                setDropState({ id, position });
              },
              onDragLeave: (event: DragEvent<HTMLDivElement>) => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                if (dropState?.id === id) setDropState(null);
              },
              onDrop: (event: DragEvent<HTMLDivElement>) => {
                if (draggedId === null || activeOperation !== null) return;
                const position = getDropPosition(event);
                const request = resolveMoveRequest(draggedId, id, position);
                if (request === null) return;
                event.preventDefault();
                event.stopPropagation();
                setDropState(null);
                setDraggedId(null);
                void runOperation(
                  {
                    type: "move",
                    nodeId: request.sourceId,
                    targetId: request.targetId,
                  },
                  { type: "move", request },
                  () => props.onMoveRequest?.(request),
                );
              },
            },
          })}
        >
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-tree-expander" },
              slotProps: props.slotProps?.expander ?? props.slotProps?.icon,
              internalProps: {
                ...expanderInteraction,
                "data-state": expandable
                  ? viewRecord.disclosed
                    ? "expanded"
                    : "collapsed"
                  : "leaf",
              },
              ownedProps: ["aria-hidden"],
            })}
          >
            {loading ? (
              <span
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-tree-loading-indicator" },
                  slotProps: props.slotProps?.loadingIndicator,
                })}
              >
                <Spinner label="" aria-hidden="true" size="small" />
              </span>
            ) : expandable ? (
              <Icon
                name={viewRecord.disclosed ? "chevron-down" : "chevron-right"}
                size="indicator"
              />
            ) : null}
          </span>
          {node.leading === undefined ? null : (
            <span
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-tree-leading" },
                slotProps: props.slotProps?.leading,
              })}
            >
              {node.leading}
            </span>
          )}
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-tree-copy" },
              slotProps: props.slotProps?.copy,
            })}
          >
            {renaming ? (
              <input
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-tree-rename-input" },
                  slotProps: props.slotProps?.renameInput,
                  internalProps: {
                    autoFocus: true,
                    disabled: pending,
                    value: renameState.value,
                    "aria-label": props.renameLabel,
                    onClick: (event) => event.stopPropagation(),
                    onChange: (event) => setRenameState({ id, value: event.currentTarget.value }),
                    onBlur: () => {
                      if (!pending) setRenameState(null);
                    },
                    onKeyDown: (event) => {
                      event.stopPropagation();
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void commitRename(node, event.currentTarget.value);
                      } else if (event.key === "Escape") {
                        event.preventDefault();
                        setRenameState(null);
                        props.controller.actions.focus(id);
                      }
                    },
                  },
                  ownedProps: ["autoFocus", "disabled", "value", "aria-label"],
                })}
              />
            ) : (
              <span
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-tree-label" },
                  slotProps: props.slotProps?.label,
                  internalProps: {
                    onDoubleClick: (event: MouseEvent<HTMLSpanElement>) => {
                      if (!itemRenamable || activeOperation !== null) return;
                      event.preventDefault();
                      event.stopPropagation();
                      setRenameState({ id, value: node.textValue });
                    },
                  },
                })}
              >
                {node.label}
              </span>
            )}
            {node.description === undefined ? null : (
              <span
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-tree-description" },
                  slotProps: props.slotProps?.description,
                  internalProps: { id: descriptionId },
                  ownedProps: ["id"],
                })}
              >
                {node.description}
              </span>
            )}
          </span>
          {node.trailing === undefined ? null : (
            <span
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-tree-trailing" },
                slotProps: props.slotProps?.trailing,
              })}
            >
              {node.trailing}
            </span>
          )}
          {selected && props.selectionMode !== "none" && props.showSelectionIndicator ? (
            <Icon name="confirm" size="control" className="miaixz-tree-selection" />
          ) : null}
          {pending ? (
            <Spinner
              label=""
              aria-hidden="true"
              size="small"
              className="miaixz-tree-operation-loading"
            />
          ) : null}
          {itemCreatable ? (
            <button
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-tree-create-action" },
                slotProps: props.slotProps?.createAction,
                internalProps: {
                  type: "button",
                  disabled: activeOperation !== null,
                  "aria-label": `${props.createLabel} ${node.textValue}`,
                  onMouseDown: (event: MouseEvent<HTMLButtonElement>) => event.preventDefault(),
                  onClick: (event: MouseEvent<HTMLButtonElement>) => {
                    event.stopPropagation();
                    setCreateState({ id, value: "" });
                    if (!viewRecord.disclosed && expandable) {
                      void props.controller.actions.expand(id).catch(() => undefined);
                    }
                  },
                },
                ownedProps: ["type", "disabled", "aria-label"],
              })}
            >
              <Icon name="add" size="indicator" />
            </button>
          ) : null}
          {itemMovable ? (
            <span
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-tree-drag-handle" },
                slotProps: props.slotProps?.dragHandle,
                internalProps: {
                  role: "button",
                  tabIndex: -1,
                  draggable: activeOperation === null,
                  "aria-label": `${props.moveLabel} ${node.textValue}`,
                  onClick: (event) => event.stopPropagation(),
                  onDragStart: (event: DragEvent<HTMLSpanElement>) => {
                    if (activeOperation !== null) {
                      event.preventDefault();
                      return;
                    }
                    event.stopPropagation();
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", id);
                    setDraggedId(id);
                  },
                  onDragEnd: () => {
                    setDraggedId(null);
                    setDropState(null);
                  },
                },
                ownedProps: ["role", "tabIndex", "draggable", "aria-label"],
              })}
            >
              <Icon name="grip-vertical" size="indicator" />
            </span>
          ) : null}
          {itemDeletable ? (
            <button
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-tree-delete-action" },
                slotProps: props.slotProps?.deleteAction,
                internalProps: {
                  type: "button",
                  disabled: activeOperation !== null,
                  "aria-label": `${props.deleteLabel} ${node.textValue}`,
                  onClick: (event: MouseEvent<HTMLButtonElement>) => {
                    event.stopPropagation();
                    const request = { id, node };
                    void runOperation(
                      { type: "delete", nodeId: id },
                      { type: "delete", request },
                      () => props.onDeleteRequest?.(request),
                    );
                  },
                },
                ownedProps: ["type", "disabled", "aria-label"],
              })}
            >
              <Icon name="delete" size="indicator" />
            </button>
          ) : null}
        </div>
        {error ? (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-tree-error" },
              slotProps: props.slotProps?.error,
              internalProps: { role: "alert" },
              ownedProps: ["role"],
            })}
          >
            <span>{props.errorLabel}</span>
            <button
              type="button"
              className="miaixz-tree-retry"
              onClick={(event: MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                void props.controller.actions.retry(id).catch(() => undefined);
              }}
            >
              <Icon name="rotate-ccw" size="indicator" />
              {props.retryLabel}
            </button>
          </div>
        ) : null}
        {creating ? (
          <div className="miaixz-tree-create-row">
            <Icon name="add" size="indicator" />
            <input
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-tree-create-input" },
                slotProps: props.slotProps?.createInput,
                internalProps: {
                  autoFocus: true,
                  disabled: pending,
                  value: createState.value,
                  "aria-label": props.createInputLabel,
                  onChange: (event) => setCreateState({ id, value: event.currentTarget.value }),
                  onBlur: () => {
                    if (!pending) setCreateState(null);
                  },
                  onKeyDown: (event) => {
                    event.stopPropagation();
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void commitCreate(node, event.currentTarget.value);
                    } else if (event.key === "Escape") {
                      event.preventDefault();
                      setCreateState(null);
                      props.controller.actions.focus(id);
                    }
                  },
                },
                ownedProps: ["autoFocus", "disabled", "value", "aria-label"],
              })}
            />
          </div>
        ) : null}
        {viewRecord.disclosed && children.length > 0 ? (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-tree-group" },
              slotProps: props.slotProps?.childrenGroup,
              internalProps: { role: "group" },
              ownedProps: ["role"],
            })}
          >
            {children.map(renderRecord)}
          </div>
        ) : null}
      </div>
    );
  };
  return <>{props.controller.view.roots.map(renderRecord)}</>;
}
