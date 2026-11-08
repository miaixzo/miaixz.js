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
 * Renders one active workbook sheet through synchronized cell, text, drawing, and view layers.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  parseSpreadsheetAddress,
  parseSpreadsheetRange,
} from "../../codecs/office/spreadsheet-layout-codec.js";
import type {
  DrawingScene,
  SpreadsheetRenderDocument,
  SpreadsheetRenderSheet,
  SpreadsheetStyleTable,
  ViewerWarning,
} from "../../shared/contracts/document.js";
import type { SpreadsheetViewOptions } from "../file/file-view.types.js";
import { DrawingView } from "./drawing-view.js";
import { SpreadsheetCellCanvas, type SpreadsheetViewportRect } from "./spreadsheet-cell-canvas.js";
import { SpreadsheetTabs } from "./spreadsheet-tabs.js";
import { SpreadsheetTextLayer } from "./spreadsheet-text-layer.js";

const viewportBuffer = 240;
const defaultRowHeaderWidth = 46;
const defaultColumnHeaderHeight = 22;
const emptyDiagnostics: readonly ViewerWarning[] = [];

/**
 * Resolves an initial worksheet id from visible ids, names, or indices.
 *
 * @param document - Complete spreadsheet render document.
 * @param visibleSheetIds - Workbook-ordered visible worksheet identifiers.
 * @param initialSheet - Optional id, name, or zero-based visible index.
 * @returns Resolved visible sheet identifier when the request is valid.
 */
function resolveInitialSheet(
  document: SpreadsheetRenderDocument,
  visibleSheetIds: readonly string[],
  initialSheet: string | number | undefined,
): string | undefined {
  if (initialSheet === undefined) {
    return visibleSheetIds.includes(document.activeSheetId)
      ? document.activeSheetId
      : visibleSheetIds[0];
  }
  if (typeof initialSheet === "number") return visibleSheetIds[initialSheet];
  if (visibleSheetIds.includes(initialSheet)) return initialSheet;
  return document.sheets.find((sheet) => sheet.state === "visible" && sheet.name === initialSheet)
    ?.id;
}

/**
 * Converts a zero-based column index to its Excel label.
 *
 * @param index - Zero-based column index.
 * @returns Excel column label.
 */
function columnLabel(index: number): string {
  let current = index + 1;
  let label = "";
  while (current > 0) {
    const digit = (current - 1) % 26;
    label = String.fromCharCode(65 + digit) + label;
    current = Math.floor((current - 1) / 26);
  }
  return label;
}

/**
 * Collapsible row interval and its resolved spreadsheet outline level.
 */
interface SpreadsheetOutlineGroup {
  readonly level: number;
  readonly startRow: number;
  readonly endRow: number;
}

/**
 * Expands saved row outline levels into contiguous visible group brackets.
 *
 * @param sheet - Worksheet containing row outline metadata.
 * @returns Contiguous brackets for every saved outline level.
 */
function spreadsheetRowOutlineGroups(sheet: SpreadsheetRenderSheet): SpreadsheetOutlineGroup[] {
  const levels = new Map(sheet.layout.rows.map((row) => [row.index, row.outlineLevel]));
  const maximum = Math.max(0, ...levels.values());
  const groups: SpreadsheetOutlineGroup[] = [];
  for (let level = 1; level <= maximum; level += 1) {
    let startRow: number | undefined;
    for (let row = 0; row <= sheet.layout.dimension.endRow + 1; row += 1) {
      if ((levels.get(row) ?? 0) >= level) {
        startRow ??= row;
      } else if (startRow !== undefined) {
        groups.push({ level, startRow, endRow: row - 1 });
        startRow = undefined;
      }
    }
  }
  return groups;
}

/**
 * Returns the clip used to hide content outside a saved print area.
 *
 * @param sheet - Worksheet containing optional print-area metadata.
 * @param pageBreakPreview - Whether the saved page-break view is active.
 * @returns CSS inset clip when a print area must be enforced.
 */
function printAreaClip(
  sheet: SpreadsheetRenderSheet,
  pageBreakPreview: boolean,
): string | undefined {
  const area = sheet.layout.printArea;
  if (!pageBreakPreview || area === undefined) return undefined;
  const left = sheet.layout.columnOffsets[area.startColumn] ?? 0;
  const right = sheet.layout.columnOffsets[area.endColumn + 1] ?? sheet.layout.width;
  const top = sheet.layout.rowOffsets[area.startRow] ?? 0;
  const bottom = sheet.layout.rowOffsets[area.endRow + 1] ?? sheet.layout.height;
  return `inset(${top}px ${Math.max(0, sheet.layout.width - right)}px ${Math.max(
    0,
    sheet.layout.height - bottom,
  )}px ${left}px)`;
}

/**
 * Renders saved manual and print-area page boundaries over every content layer.
 *
 * @param root0 - Active worksheet.
 * @param root0.sheet - Worksheet containing saved page boundaries.
 * @returns Page boundary and page-number overlay.
 */
function SpreadsheetPageBreakLayer({
  sheet,
}: {
  readonly sheet: SpreadsheetRenderSheet;
}): React.ReactElement {
  const area = sheet.layout.printArea ?? sheet.layout.dimension;
  const left = sheet.layout.columnOffsets[area.startColumn] ?? 0;
  const right = sheet.layout.columnOffsets[area.endColumn + 1] ?? sheet.layout.width;
  const top = sheet.layout.rowOffsets[area.startRow] ?? 0;
  const bottom = sheet.layout.rowOffsets[area.endRow + 1] ?? sheet.layout.height;
  const vertical = [
    ...new Set(
      [area.startColumn, ...sheet.layout.columnBreaks, area.endColumn + 1]
        .map((column) => sheet.layout.columnOffsets[column])
        .filter(
          (offset): offset is number => offset !== undefined && offset >= left && offset <= right,
        ),
    ),
  ];
  const horizontal = [
    ...new Set(
      [area.startRow, ...sheet.layout.rowBreaks, area.endRow + 1]
        .map((row) => sheet.layout.rowOffsets[row])
        .filter(
          (offset): offset is number => offset !== undefined && offset >= top && offset <= bottom,
        ),
    ),
  ];
  const pageColumns = Math.max(1, vertical.length - 1);
  return (
    <div aria-hidden="true" className="miaixz-preview-sheet-page-breaks">
      {vertical.map((offset, index) => (
        <span
          className="miaixz-preview-sheet-page-break miaixz-preview-sheet-page-break-vertical"
          key={`column-${offset}-${index}`}
          style={{ left: offset, top, height: bottom - top }}
        />
      ))}
      {horizontal.map((offset, index) => (
        <span
          className="miaixz-preview-sheet-page-break miaixz-preview-sheet-page-break-horizontal"
          key={`row-${offset}-${index}`}
          style={{ left, top: offset, width: right - left }}
        />
      ))}
      {horizontal.slice(0, -1).flatMap((pageTop, rowIndex) =>
        vertical.slice(0, -1).map((pageLeft, columnIndex) => {
          const pageRight = vertical[columnIndex + 1] ?? right;
          const pageBottom = horizontal[rowIndex + 1] ?? bottom;
          return (
            <span
              className="miaixz-preview-sheet-page-number"
              key={`page-${rowIndex}-${columnIndex}`}
              style={{
                left: pageLeft,
                top: pageTop,
                width: pageRight - pageLeft,
                height: pageBottom - pageTop,
              }}
            >
              Page {rowIndex * pageColumns + columnIndex + 1}
            </span>
          );
        }),
      )}
    </div>
  );
}

/**
 * Draws the active-cell border independently so drawings cannot cover it.
 *
 * @param root0 - Worksheet selection properties.
 * @param root0.sheet - Active worksheet coordinate index.
 * @param root0.address - Active cell address.
 * @param root0.range - Saved selected range.
 * @returns Selection overlay or null when the address is invalid.
 */
function SpreadsheetSelectionLayer({
  sheet,
  address,
  range,
}: {
  readonly sheet: SpreadsheetRenderSheet;
  readonly address?: string | undefined;
  readonly range?: string | undefined;
}): React.ReactElement | null {
  const position = address === undefined ? undefined : parseSpreadsheetAddress(address);
  if (position === undefined) return null;
  const selection = parseSpreadsheetRange(range?.split(/\s+/u, 1)[0] ?? address ?? "");
  const left = sheet.layout.columnOffsets[selection?.startColumn ?? position.column];
  const right = sheet.layout.columnOffsets[(selection?.endColumn ?? position.column) + 1];
  const top = sheet.layout.rowOffsets[selection?.startRow ?? position.row];
  const bottom = sheet.layout.rowOffsets[(selection?.endRow ?? position.row) + 1];
  if (left === undefined || right === undefined || top === undefined || bottom === undefined) {
    return null;
  }
  return (
    <div
      aria-hidden="true"
      className="miaixz-preview-sheet-active-cell"
      data-cell-address={address}
      data-selection-range={range ?? address}
      style={{ left, top, width: right - left, height: bottom - top }}
    />
  );
}

/**
 * Renders the synchronized workbook layers for a main or frozen pane instance.
 *
 * @param root0 - Surface model, viewport, and interaction properties.
 * @returns Synchronized Canvas, text, drawing, page, and selection layers.
 */
function SpreadsheetSurface({
  sheet,
  styles,
  drawings,
  viewport,
  selectedCellAddress,
  selectedRange,
  onSelectCell,
  maxSpreadsheetCanvasBytes,
  showGridLines,
  pageBreakPreview,
  instanceId,
}: {
  readonly sheet: SpreadsheetRenderSheet;
  readonly styles: SpreadsheetStyleTable;
  readonly drawings: readonly DrawingScene[];
  readonly viewport: SpreadsheetViewportRect;
  readonly selectedCellAddress?: string | undefined;
  readonly selectedRange?: string | undefined;
  readonly onSelectCell?: ((address: string) => void) | undefined;
  readonly maxSpreadsheetCanvasBytes?: number | undefined;
  readonly showGridLines?: boolean | undefined;
  readonly pageBreakPreview: boolean;
  readonly instanceId: string;
}): React.ReactElement {
  const clipPath = printAreaClip(sheet, pageBreakPreview);
  return (
    <>
      <SpreadsheetCellCanvas
        sheet={sheet}
        {...(maxSpreadsheetCanvasBytes === undefined ? {} : { maxSpreadsheetCanvasBytes })}
        pageBreakPreview={pageBreakPreview}
        {...(showGridLines === undefined ? {} : { showGridLines })}
        styles={styles}
        viewport={viewport}
      />
      <div className="miaixz-preview-sheet-content-clip" style={{ clipPath }}>
        <SpreadsheetTextLayer
          sheet={sheet}
          {...(onSelectCell === undefined ? {} : { onSelectCell })}
          {...(selectedCellAddress === undefined ? {} : { selectedCellAddress })}
          styles={styles}
          viewport={viewport}
        />
        <div aria-hidden="true" className="miaixz-preview-sheet-drawing-layer">
          {drawings.map((drawing) => (
            <DrawingView
              className="miaixz-preview-sheet-drawing"
              coordinateHeight={sheet.layout.height}
              coordinateWidth={sheet.layout.width}
              instanceId={instanceId}
              key={drawing.id}
              scene={drawing}
            />
          ))}
        </div>
      </div>
      {pageBreakPreview ? <SpreadsheetPageBreakLayer sheet={sheet} /> : null}
      <SpreadsheetSelectionLayer
        address={selectedCellAddress}
        range={selectedRange}
        sheet={sheet}
      />
    </>
  );
}

/**
 * Renders a layout-aware spreadsheet document.
 *
 * @param root0 - Spreadsheet document and unified shell scale.
 * @param root0.document - Complete spreadsheet render model.
 * @param root0.scale - Current shell zoom ratio.
 * @param root0.options - Workbook-specific view configuration.
 * @param root0.maxSpreadsheetCanvasBytes - Maximum visible Canvas backing-store bytes.
 * @param root0.diagnostics - Parser diagnostics already attached to the workbook outcome.
 * @returns Workbook viewer containing one active sheet.
 */
export function SpreadsheetView({
  document,
  scale,
  options = {},
  maxSpreadsheetCanvasBytes,
  diagnostics = emptyDiagnostics,
}: {
  readonly document: SpreadsheetRenderDocument;
  readonly scale: number;
  readonly options?: SpreadsheetViewOptions;
  readonly maxSpreadsheetCanvasBytes?: number;
  readonly diagnostics?: readonly ViewerWarning[];
}): React.ReactElement {
  const {
    initialSheet,
    spreadsheetView,
    showGridLines,
    showSheetTabs,
    onSheetChange,
    onDiagnostics,
  } = options;
  const visibleSheets = useMemo(
    () => document.sheets.filter((sheet) => sheet.state === "visible"),
    [document.sheets],
  );
  const visibleSheetIds = useMemo(() => visibleSheets.map((sheet) => sheet.id), [visibleSheets]);
  const resolvedInitialSheet = resolveInitialSheet(document, visibleSheetIds, initialSheet);
  const initialSheetId =
    resolvedInitialSheet ??
    (visibleSheetIds.includes(document.activeSheetId)
      ? document.activeSheetId
      : (visibleSheetIds[0] ?? ""));
  const [activeSheetId, setActiveSheetId] = useState(initialSheetId);
  const [viewport, setViewport] = useState<SpreadsheetViewportRect>({
    x: 0,
    y: 0,
    width: 1200,
    height: 800,
  });
  const [scrollOffset, setScrollOffset] = useState({ left: 0, top: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState(-1);
  const viewportReference = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef(
    new Map<string, { readonly left: number; readonly top: number }>(),
  );
  const activeSheet = visibleSheets.find((sheet) => sheet.id === activeSheetId) ?? visibleSheets[0];
  const rowHeaderWidth = activeSheet?.layout.showRowColumnHeaders ? defaultRowHeaderWidth : 0;
  const columnHeaderHeight = activeSheet?.layout.showRowColumnHeaders
    ? defaultColumnHeaderHeight
    : 0;
  const [selectedCellAddress, setSelectedCellAddress] = useState(
    activeSheet?.layout.activeSelection?.activeCell,
  );
  const requestedView =
    spreadsheetView ?? (activeSheet?.layout.viewMode === "normal" ? "sheet" : "page");
  const pageBreakPreview = requestedView === "page";
  const savedZoom =
    activeSheet?.layout.viewMode === "pageLayout"
      ? activeSheet.layout.zoomScalePageLayout
      : (activeSheet?.layout.zoomScale ?? 100);
  const safeScale = Math.max(0.25, Math.min(4, scale * (savedZoom / 100)));
  const pane = activeSheet?.layout.pane;
  const frozen = pane?.state === "frozen" || pane?.state === "frozenSplit";
  const frozenColumns = frozen ? Math.max(0, Math.floor(pane.xSplit)) : 0;
  const frozenRows = frozen ? Math.max(0, Math.floor(pane.ySplit)) : 0;
  const frozenWidth = activeSheet?.layout.columnOffsets[frozenColumns] ?? 0;
  const frozenHeight = activeSheet?.layout.rowOffsets[frozenRows] ?? 0;
  const updateViewport = useCallback(() => {
    const element = viewportReference.current;
    if (element === null || activeSheet === undefined) return;
    const rawX = element.scrollLeft / safeScale;
    const rawY = element.scrollTop / safeScale;
    const width = Math.max(1, (element.clientWidth - rowHeaderWidth || 1200) / safeScale);
    const height = Math.max(1, (element.clientHeight - columnHeaderHeight || 800) / safeScale);
    setScrollOffset({ left: element.scrollLeft, top: element.scrollTop });
    setViewport({
      x: Math.max(0, rawX - viewportBuffer),
      y: Math.max(0, rawY - viewportBuffer),
      width: Math.min(activeSheet.layout.width, width + viewportBuffer * 2),
      height: Math.min(activeSheet.layout.height, height + viewportBuffer * 2),
    });
  }, [activeSheet, columnHeaderHeight, rowHeaderWidth, safeScale]);
  useEffect(() => {
    const currentDiagnostics = [...diagnostics];
    if (initialSheet !== undefined && resolvedInitialSheet === undefined) {
      currentDiagnostics.push({
        code: "XLSX_INITIAL_SHEET_NOT_FOUND",
        messageKey: "xlsx.initialSheetNotFound",
      });
    }
    if (currentDiagnostics.length > 0) onDiagnostics?.(currentDiagnostics);
  }, [diagnostics, initialSheet, onDiagnostics, resolvedInitialSheet]);
  useEffect(() => {
    const element = viewportReference.current;
    if (element === null) return undefined;
    updateViewport();
    element.addEventListener("scroll", updateViewport, { passive: true });
    const observer =
      typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(updateViewport);
    observer?.observe(element);
    return () => {
      element.removeEventListener("scroll", updateViewport);
      observer?.disconnect();
    };
  }, [updateViewport]);
  if (activeSheet === undefined) {
    return <p className="miaixz-preview-warning">This workbook has no visible worksheets.</p>;
  }
  const drawings = document.drawings.filter(
    (drawing) => drawing.sheetId === activeSheet.id || drawing.sheetName === activeSheet.name,
  );
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase();
  const searchMatches =
    normalizedSearchQuery === ""
      ? []
      : activeSheet.cells.filter((cell) =>
          cell.displayValue.toLocaleLowerCase().includes(normalizedSearchQuery),
        );
  /**
   * Selects the next search match and scrolls it into the unfrozen viewport.
   *
   * @returns No return value; an empty search clears the active match.
   */
  const findNext = (): void => {
    if (searchQuery.trim() === "" || searchMatches.length === 0) {
      setSearchIndex(-1);
      setSelectedCellAddress(undefined);
      return;
    }
    const nextIndex = (searchIndex + 1) % searchMatches.length;
    const cell = searchMatches[nextIndex];
    if (cell === undefined) return;
    setSearchIndex(nextIndex);
    setSelectedCellAddress(cell.address);
    const target = viewportReference.current;
    if (target !== null) {
      target.scrollLeft =
        Math.max(0, (activeSheet.layout.columnOffsets[cell.column] ?? 0) - frozenWidth) * safeScale;
      target.scrollTop =
        Math.max(0, (activeSheet.layout.rowOffsets[cell.row] ?? 0) - frozenHeight) * safeScale;
      updateViewport();
    }
  };
  /**
   * Restores saved sheet scroll offsets or derives them from pane and zoom settings.
   *
   * @param sheet - Sheet becoming active.
   * @returns No return value; updates the viewport after restoring offsets.
   */
  const restoreSheetState = (sheet: SpreadsheetRenderSheet): void => {
    const target = viewportReference.current;
    const saved = scrollPositions.current.get(sheet.id);
    const topLeft = parseSpreadsheetAddress(sheet.layout.pane?.topLeftCell ?? "A1");
    const targetSavedZoom =
      sheet.layout.viewMode === "pageLayout"
        ? sheet.layout.zoomScalePageLayout
        : sheet.layout.zoomScale;
    const targetScale = Math.max(0.25, Math.min(4, scale * (targetSavedZoom / 100)));
    if (target !== null) {
      target.scrollLeft =
        saved?.left ??
        Math.max(
          0,
          (sheet.layout.columnOffsets[topLeft?.column ?? 0] ?? 0) -
            (sheet.layout.columnOffsets[Math.floor(sheet.layout.pane?.xSplit ?? 0)] ?? 0),
        ) * targetScale;
      target.scrollTop =
        saved?.top ??
        Math.max(
          0,
          (sheet.layout.rowOffsets[topLeft?.row ?? 0] ?? 0) -
            (sheet.layout.rowOffsets[Math.floor(sheet.layout.pane?.ySplit ?? 0)] ?? 0),
        ) * targetScale;
      updateViewport();
    }
  };
  /**
   * Saves the current sheet position and restores the selected sheet state.
   *
   * @param sheetId - Stable identifier of the target sheet.
   * @returns No return value; reports the sheet change and schedules scroll restoration.
   */
  const changeSheet = (sheetId: string): void => {
    const element = viewportReference.current;
    if (element !== null) {
      scrollPositions.current.set(activeSheet.id, {
        left: element.scrollLeft,
        top: element.scrollTop,
      });
    }
    setActiveSheetId(sheetId);
    setSearchIndex(-1);
    const selected = document.sheets.find((sheet) => sheet.id === sheetId);
    setSelectedCellAddress(selected?.layout.activeSelection?.activeCell);
    if (selected !== undefined) {
      onSheetChange?.({
        id: selected.id,
        name: selected.name,
        index: visibleSheets.indexOf(selected),
      });
      /**
       * Restores the selected sheet viewport after its render has been scheduled.
       *
       * @returns No return value; delegates to the sheet-state restoration routine.
       */
      const restoreScroll = (): void => restoreSheetState(selected);
      if (globalThis.requestAnimationFrame === undefined) globalThis.setTimeout(restoreScroll, 0);
      else globalThis.requestAnimationFrame(restoreScroll);
    }
  };
  const frozenRowViewport: SpreadsheetViewportRect = {
    x: viewport.x,
    y: 0,
    width: viewport.width,
    height: frozenHeight,
  };
  const frozenColumnViewport: SpreadsheetViewportRect = {
    x: 0,
    y: viewport.y,
    width: frozenWidth,
    height: viewport.height,
  };
  const frozenCornerViewport: SpreadsheetViewportRect = {
    x: 0,
    y: 0,
    width: frozenWidth,
    height: frozenHeight,
  };
  const savedSelection = activeSheet.layout.activeSelection;
  const selectedRange =
    savedSelection !== undefined && savedSelection.activeCell === selectedCellAddress
      ? savedSelection.range
      : selectedCellAddress;
  const rowOutlineGroups = spreadsheetRowOutlineGroups(activeSheet);
  const maximumRowOutlineLevel = Math.max(0, ...rowOutlineGroups.map((group) => group.level));
  const surfaceProperties = {
    sheet: activeSheet,
    styles: document.styles,
    drawings,
    selectedCellAddress,
    selectedRange,
    onSelectCell: setSelectedCellAddress,
    maxSpreadsheetCanvasBytes,
    showGridLines,
    pageBreakPreview,
  };
  return (
    <section className={`miaixz-preview-workbook miaixz-preview-workbook-${requestedView}`}>
      <div className="miaixz-preview-sheet-heading">
        <strong>{activeSheet.name}</strong>
        <form
          className="miaixz-preview-sheet-search"
          onSubmit={(event) => {
            event.preventDefault();
            findNext();
          }}
          role="search"
        >
          <input
            aria-label="Search current sheet"
            onChange={(event) => {
              setSearchQuery(event.currentTarget.value);
              setSearchIndex(-1);
            }}
            type="search"
            value={searchQuery}
          />
          <button type="submit">Find</button>
          {searchQuery.trim() === "" ? null : (
            <output aria-live="polite">
              {searchMatches.length === 0 ? 0 : Math.max(1, searchIndex + 1)}/{searchMatches.length}
            </output>
          )}
        </form>
        <span>
          {activeSheet.layout.dimension.reference} · {activeSheet.cells.length} cells ·{" "}
          {Math.round(safeScale * 100)}%
        </span>
      </div>
      <div className="miaixz-preview-sheet-viewport" ref={viewportReference}>
        <div
          className="miaixz-preview-sheet-scaled-surface"
          style={{
            width: rowHeaderWidth + activeSheet.layout.width * safeScale,
            height: columnHeaderHeight + activeSheet.layout.height * safeScale,
          }}
        >
          <div
            aria-label={activeSheet.name}
            className="miaixz-preview-sheet-surface"
            id={`miaixz-sheet-${activeSheet.id}`}
            role="tabpanel"
            style={{
              left: rowHeaderWidth,
              top: columnHeaderHeight,
              width: activeSheet.layout.width,
              height: activeSheet.layout.height,
              transform: `scale(${safeScale})`,
            }}
          >
            <SpreadsheetSurface {...surfaceProperties} instanceId="main" viewport={viewport} />
          </div>
          {frozenRows > 0 ? (
            <div
              className="miaixz-preview-sheet-frozen-pane miaixz-preview-sheet-frozen-rows"
              style={{
                left: rowHeaderWidth,
                top: scrollOffset.top + columnHeaderHeight,
                width: activeSheet.layout.width * safeScale,
                height: frozenHeight * safeScale,
              }}
            >
              <div
                className="miaixz-preview-sheet-surface"
                style={{
                  width: activeSheet.layout.width,
                  height: activeSheet.layout.height,
                  transform: `scale(${safeScale})`,
                }}
              >
                <SpreadsheetSurface
                  {...surfaceProperties}
                  instanceId="frozen-rows"
                  viewport={frozenRowViewport}
                />
              </div>
            </div>
          ) : null}
          {frozenColumns > 0 ? (
            <div
              className="miaixz-preview-sheet-frozen-pane miaixz-preview-sheet-frozen-columns"
              style={{
                left: scrollOffset.left + rowHeaderWidth,
                top: columnHeaderHeight,
                width: frozenWidth * safeScale,
                height: activeSheet.layout.height * safeScale,
              }}
            >
              <div
                className="miaixz-preview-sheet-surface"
                style={{
                  width: activeSheet.layout.width,
                  height: activeSheet.layout.height,
                  transform: `scale(${safeScale})`,
                }}
              >
                <SpreadsheetSurface
                  {...surfaceProperties}
                  instanceId="frozen-columns"
                  viewport={frozenColumnViewport}
                />
              </div>
            </div>
          ) : null}
          {frozenRows > 0 && frozenColumns > 0 ? (
            <div
              className="miaixz-preview-sheet-frozen-pane miaixz-preview-sheet-frozen-corner"
              style={{
                left: scrollOffset.left + rowHeaderWidth,
                top: scrollOffset.top + columnHeaderHeight,
                width: frozenWidth * safeScale,
                height: frozenHeight * safeScale,
              }}
            >
              <div
                className="miaixz-preview-sheet-surface"
                style={{
                  width: activeSheet.layout.width,
                  height: activeSheet.layout.height,
                  transform: `scale(${safeScale})`,
                }}
              >
                <SpreadsheetSurface
                  {...surfaceProperties}
                  instanceId="frozen-corner"
                  viewport={frozenCornerViewport}
                />
              </div>
            </div>
          ) : null}
          {activeSheet.layout.showRowColumnHeaders && maximumRowOutlineLevel > 0 ? (
            <>
              <div
                aria-hidden="true"
                className="miaixz-preview-sheet-outline-levels"
                style={{
                  left: scrollOffset.left,
                  top: scrollOffset.top,
                  width: rowHeaderWidth,
                  height: columnHeaderHeight,
                }}
              >
                {Array.from({ length: maximumRowOutlineLevel + 1 }, (_, index) => (
                  <span key={index}>{index + 1}</span>
                ))}
              </div>
              <div
                aria-hidden="true"
                className="miaixz-preview-sheet-outline-groups"
                style={{
                  left: scrollOffset.left,
                  top: scrollOffset.top + columnHeaderHeight,
                  width: rowHeaderWidth,
                  height: frozenHeight * safeScale,
                }}
              >
                {rowOutlineGroups.map((group) => {
                  const top = activeSheet.layout.rowOffsets[group.startRow] ?? 0;
                  const bottom = activeSheet.layout.rowOffsets[group.endRow + 1] ?? top;
                  return (
                    <span
                      data-outline-level={group.level}
                      key={`${group.level}-${group.startRow}-${group.endRow}`}
                      style={{
                        left: (group.level - 1) * 8 + 5,
                        top: top * safeScale,
                        height: (bottom - top) * safeScale,
                      }}
                    />
                  );
                })}
              </div>
            </>
          ) : null}
          <div
            aria-hidden="true"
            className="miaixz-preview-sheet-column-headers"
            style={{
              left: rowHeaderWidth,
              top: scrollOffset.top,
              height: columnHeaderHeight,
              clipPath: frozenColumns > 0 ? `inset(0 0 0 ${frozenWidth * safeScale}px)` : undefined,
            }}
          >
            {Array.from(activeSheet.layout.columnOffsets.slice(0, -1)).map((left, column) => {
              const right = activeSheet.layout.columnOffsets[column + 1] ?? left;
              return (
                <span
                  key={column}
                  style={{ left: left * safeScale, width: (right - left) * safeScale }}
                >
                  {columnLabel(column)}
                </span>
              );
            })}
          </div>
          <div
            aria-hidden="true"
            className={`miaixz-preview-sheet-row-headers${
              maximumRowOutlineLevel > 0 ? " miaixz-preview-sheet-row-headers-has-outline" : ""
            }`}
            style={{
              left: scrollOffset.left,
              top: columnHeaderHeight,
              width: rowHeaderWidth,
              clipPath: frozenRows > 0 ? `inset(${frozenHeight * safeScale}px 0 0)` : undefined,
            }}
          >
            {Array.from(activeSheet.layout.rowOffsets.slice(0, -1)).map((top, row) => {
              const bottom = activeSheet.layout.rowOffsets[row + 1] ?? top;
              return (
                <span
                  key={row}
                  style={{ top: top * safeScale, height: (bottom - top) * safeScale }}
                >
                  {row + 1}
                </span>
              );
            })}
          </div>
          {frozenRows > 0 ? (
            <div
              aria-hidden="true"
              className={`miaixz-preview-sheet-row-headers miaixz-preview-sheet-frozen-row-headers${
                maximumRowOutlineLevel > 0 ? " miaixz-preview-sheet-row-headers-has-outline" : ""
              }`}
              style={{
                left: scrollOffset.left,
                top: scrollOffset.top + columnHeaderHeight,
                width: rowHeaderWidth,
                height: frozenHeight * safeScale,
              }}
            >
              {Array.from(activeSheet.layout.rowOffsets.slice(0, frozenRows)).map((top, row) => {
                const bottom = activeSheet.layout.rowOffsets[row + 1] ?? top;
                return (
                  <span
                    key={row}
                    style={{ top: top * safeScale, height: (bottom - top) * safeScale }}
                  >
                    {row + 1}
                  </span>
                );
              })}
            </div>
          ) : null}
          {frozenColumns > 0 ? (
            <div
              aria-hidden="true"
              className="miaixz-preview-sheet-column-headers miaixz-preview-sheet-frozen-column-headers"
              style={{
                left: scrollOffset.left + rowHeaderWidth,
                top: scrollOffset.top,
                width: frozenWidth * safeScale,
                height: columnHeaderHeight,
              }}
            >
              {Array.from(activeSheet.layout.columnOffsets.slice(0, frozenColumns)).map(
                (left, column) => {
                  const right = activeSheet.layout.columnOffsets[column + 1] ?? left;
                  return (
                    <span
                      key={column}
                      style={{ left: left * safeScale, width: (right - left) * safeScale }}
                    >
                      {columnLabel(column)}
                    </span>
                  );
                },
              )}
            </div>
          ) : null}
          <div
            aria-hidden="true"
            className="miaixz-preview-sheet-header-corner"
            style={{
              left: scrollOffset.left,
              top: scrollOffset.top,
              width: rowHeaderWidth,
              height: columnHeaderHeight,
            }}
          />
        </div>
      </div>
      {showSheetTabs === false ? null : (
        <SpreadsheetTabs
          activeSheetId={activeSheet.id}
          onChange={changeSheet}
          sheets={visibleSheets}
        />
      )}
    </section>
  );
}
