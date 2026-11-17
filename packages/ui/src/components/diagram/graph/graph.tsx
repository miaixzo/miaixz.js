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
 * Implements the graph UI component.
 */

import { forwardRef, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { IconButton } from "../../action/icon-button.js";
import { useMiaixzLocale } from "../../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../../shared/slots.js";
import type { GraphEdge, GraphNode, GraphOwnerState, GraphProps } from "./graph.types.js";
import { findDirectionalNode, type DirectionKey } from "./graph-keyboard.js";
import {
  maximumZoom,
  minimumZoom,
  nodeRadius,
  panStep,
  validateGraph,
  type ViewState,
  zoomStep,
} from "./graph-model.js";
import { withMiaixzThemeComponent } from "../../../theme/binding.js";

/**
 * Renders the accessible interactive graph under the diagram namespace.
 *
 * @public
 */
export const Graph = withMiaixzThemeComponent(
  "Graph",
  forwardRef<HTMLElement, GraphProps>(function Graph(
    {
      "aria-label": ariaLabel,
      nodes,
      edges,
      selectedNodeId,
      onSelectedNodeIdChange,
      disabled = false,
      tableCaption,
      nodeFormatter,
      edgeFormatter,
      slotProps,
      ...props
    },
    ref,
  ) {
    validateGraph(nodes, edges);
    const { t } = useMiaixzLocale();
    const markerId = `miaixz-graph-arrow-${useId().replaceAll(":", "")}`;
    const [view, setView] = useState<ViewState>({ zoom: 1, x: 0, y: 0 });
    const [activeNodeId, setActiveNodeId] = useState<string | undefined>(
      nodes.some((node) => node.id === selectedNodeId) ? selectedNodeId : nodes[0]?.id,
    );
    const nodeRefs = useRef(new Map<string, SVGGElement>());
    const nodesById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
    /**
     * Uses the custom node label or a localized label including its optional description.
     *
     * @param node - Graph node being described, revealed, or focused.
     * @returns Accessible node description from the formatter or localized fallback.
     */
    const formatNode = (node: GraphNode): string =>
      nodeFormatter?.(node) ??
      (node.description === undefined
        ? node.label
        : t("ui.diagram.graph.nodeDescription", {
            label: node.label,
            description: node.description,
          }));
    /**
     * Uses a custom edge description, explicit edge label, or localized relationship fallback.
     *
     * @param edge - Graph edge whose relationship is described.
     * @param source - Source node of the described graph edge.
     * @param target - Target node of the described graph edge.
     * @returns Accessible edge relationship description.
     */
    const formatEdge = (edge: GraphEdge, source: GraphNode, target: GraphNode): string =>
      edgeFormatter?.(edge, source, target) ??
      edge.label ??
      t(edge.directed ? "ui.diagram.graph.pointsTo" : "ui.diagram.graph.relatedTo");
    const ownerState: GraphOwnerState = {
      disabled,
      zoom: view.zoom,
      selectedNodeId,
      activeNodeId,
    };

    useEffect(() => {
      if (activeNodeId !== undefined && nodesById.has(activeNodeId)) return;
      setActiveNodeId(nodes[0]?.id);
    }, [activeNodeId, nodes, nodesById]);

    /**
     * Pans only as far as needed to keep the complete node inside the current zoomed viewport.
     *
     * @param node - Graph node being described, revealed, or focused.
     * @returns No return value.
     */
    const ensureNodeVisible = (node: GraphNode): void => {
      setView((current) => {
        const size = 100 / current.zoom;
        const left = (100 - size) / 2 + current.x;
        const top = (100 - size) / 2 + current.y;
        let x = current.x;
        let y = current.y;
        if (node.x - nodeRadius < left) x -= left - (node.x - nodeRadius);
        else if (node.x + nodeRadius > left + size) x += node.x + nodeRadius - (left + size);
        if (node.y - nodeRadius < top) y -= top - (node.y - nodeRadius);
        else if (node.y + nodeRadius > top + size) y += node.y + nodeRadius - (top + size);
        return x === current.x && y === current.y ? current : { ...current, x, y };
      });
    };

    /**
     * Sets the active node, focuses it without page scrolling, and reveals it in the graph viewport.
     *
     * @param node - Graph node being described, revealed, or focused.
     * @returns No return value.
     */
    const focusNode = (node: GraphNode): void => {
      setActiveNodeId(node.id);
      nodeRefs.current.get(node.id)?.focus({ preventScroll: true });
      ensureNodeVisible(node);
    };

    /**
     * Handles node selection, zoom, shift-arrow panning, and directional node navigation.
     *
     * @param event - Keyboard event whose key and prevented state control navigation.
     * @param node - Graph node being described, revealed, or focused.
     * @returns No return value.
     */
    const handleNodeKeyDown = (event: KeyboardEvent<SVGGElement>, node: GraphNode): void => {
      if (disabled) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelectedNodeIdChange?.(node.id);
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setView((current) => ({
          ...current,
          zoom: Math.min(maximumZoom, current.zoom + zoomStep),
        }));
        return;
      }
      if (event.key === "-") {
        event.preventDefault();
        setView((current) => ({
          ...current,
          zoom: Math.max(minimumZoom, current.zoom - zoomStep),
        }));
        return;
      }
      if (event.key === "0") {
        event.preventDefault();
        setView({ zoom: 1, x: 0, y: 0 });
        return;
      }
      if (event.key.startsWith("Arrow") && event.shiftKey) {
        event.preventDefault();
        setView((current) => {
          const amount = (100 / current.zoom) * panStep;
          return {
            ...current,
            x:
              current.x +
              (event.key === "ArrowRight" ? amount : event.key === "ArrowLeft" ? -amount : 0),
            y:
              current.y +
              (event.key === "ArrowDown" ? amount : event.key === "ArrowUp" ? -amount : 0),
          };
        });
        return;
      }
      let target: GraphNode | undefined;
      if (event.key === "Home") target = nodes[0];
      else if (event.key === "End") target = nodes.at(-1);
      else if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(event.key)) {
        target = findDirectionalNode(
          nodes,
          nodes.findIndex((item) => item.id === node.id),
          event.key as DirectionKey,
        );
      }
      if (target !== undefined) {
        event.preventDefault();
        focusNode(target);
      }
    };

    const viewSize = 100 / view.zoom;
    const viewBox = `${(100 - viewSize) / 2 + view.x} ${(100 - viewSize) / 2 + view.y} ${viewSize} ${viewSize}`;
    const zoomPercentage = Math.round(view.zoom * 100);
    return (
      <section
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-graph" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { ...(disabled ? { "aria-disabled": true } : {}) },
          ownedProps: ["aria-disabled"],
        })}
      >
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-graph-toolbar" },
            slotProps: slotProps?.toolbar,
            internalProps: { "aria-label": t("ui.diagram.graph.controls", { label: ariaLabel }) },
            ownedProps: ["aria-label"],
          })}
        >
          <IconButton
            disabled={disabled || view.zoom <= minimumZoom}
            icon="zoom-out"
            label={t("ui.diagram.graph.zoomOut")}
            onClick={() =>
              setView((current) => ({
                ...current,
                zoom: Math.max(minimumZoom, current.zoom - zoomStep),
              }))
            }
          />
          <output aria-live="polite" className="miaixz-graph-zoom">
            {t("ui.diagram.graph.zoomValue", { value: zoomPercentage })}
          </output>
          <IconButton
            disabled={disabled || view.zoom >= maximumZoom}
            icon="zoom-in"
            label={t("ui.diagram.graph.zoomIn")}
            onClick={() =>
              setView((current) => ({
                ...current,
                zoom: Math.min(maximumZoom, current.zoom + zoomStep),
              }))
            }
          />
          <IconButton
            disabled={disabled}
            icon="rotate-ccw"
            label={t("ui.diagram.graph.resetView")}
            onClick={() => setView({ zoom: 1, x: 0, y: 0 })}
          />
        </div>
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-graph-viewport" },
            slotProps: slotProps?.viewport,
          })}
        >
          <svg
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-graph-canvas" },
              slotProps: slotProps?.canvas,
              internalProps: { viewBox, role: "group", "aria-label": ariaLabel },
              ownedProps: ["viewBox", "role", "aria-label"],
            })}
          >
            <defs>
              <marker
                id={markerId}
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6 Z" className="miaixz-graph-arrow" />
              </marker>
            </defs>
            {edges.map((edge) => {
              const source = nodesById.get(edge.sourceId)!;
              const target = nodesById.get(edge.targetId)!;
              return (
                <g
                  key={edge.id}
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-graph-edge" },
                    slotProps: slotProps?.edge,
                  })}
                >
                  <title>{formatEdge(edge, source, target)}</title>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    markerEnd={edge.directed ? `url(#${markerId})` : undefined}
                  />
                  {edge.label !== undefined && (
                    <text x={(source.x + target.x) / 2} y={(source.y + target.y) / 2 - 1}>
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
            {nodes.map((node) => (
              <g
                key={node.id}
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-graph-node" },
                  slotProps: slotProps?.node,
                  internalRef: (element: SVGGElement | null) => {
                    if (element === null) nodeRefs.current.delete(node.id);
                    else nodeRefs.current.set(node.id, element);
                  },
                  internalProps: {
                    role: "button",
                    "aria-label": formatNode(node),
                    "aria-pressed": selectedNodeId === node.id,
                    ...(disabled ? { "aria-disabled": true } : {}),
                    tabIndex: !disabled && activeNodeId === node.id ? 0 : -1,
                    "data-tone": node.tone,
                    transform: `translate(${node.x} ${node.y})`,
                    onFocus: () => setActiveNodeId(node.id),
                    onClick: () => {
                      if (!disabled) onSelectedNodeIdChange?.(node.id);
                    },
                    onKeyDown: (event) => handleNodeKeyDown(event, node),
                  },
                  ownedProps: [
                    "role",
                    "aria-label",
                    "aria-pressed",
                    "aria-disabled",
                    "tabIndex",
                    "data-tone",
                    "transform",
                  ],
                })}
              >
                <circle r={nodeRadius} />
                <text textAnchor="middle" dominantBaseline="central">
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <table
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-hidden" },
            slotProps: slotProps?.table,
          })}
        >
          <caption>{tableCaption}</caption>
          <thead>
            <tr>
              <th scope="col">{t("ui.label.source")}</th>
              <th scope="col">{t("ui.diagram.graph.relation")}</th>
              <th scope="col">{t("ui.diagram.graph.target")}</th>
            </tr>
          </thead>
          <tbody>
            {edges.map((edge) => {
              const source = nodesById.get(edge.sourceId)!;
              const target = nodesById.get(edge.targetId)!;
              return (
                <tr key={edge.id}>
                  <td>{formatNode(source)}</td>
                  <td>{formatEdge(edge, source, target)}</td>
                  <td>{formatNode(target)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    );
  }),
);
