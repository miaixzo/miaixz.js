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
 * Draws the visible worksheet tile containing fills, borders, and grid lines.
 */

import { useEffect, useRef } from "react";
import type {
  SpreadsheetBorderSide,
  SpreadsheetRange,
  SpreadsheetRenderCell,
  SpreadsheetRenderSheet,
  SpreadsheetStyleTable,
} from "../../shared/contracts/document.js";
import { defaultResourceBudget } from "../../runtime/resource-budget.js";

/**
 * Identifies one visible unscaled worksheet rectangle.
 */
export interface SpreadsheetViewportRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Locates the offset interval containing one coordinate.
 *
 * @param offsets - Monotonic row or column offsets.
 * @param value - Coordinate to locate.
 * @returns Zero-based interval index.
 */
function interval(offsets: ArrayLike<number>, value: number): number {
  let low = 0;
  let high = Math.max(0, offsets.length - 2);
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const start = offsets[middle] ?? 0;
    const end = offsets[middle + 1] ?? start;
    if (value < start) high = middle - 1;
    else if (value >= end) low = middle + 1;
    else return middle;
  }
  return Math.max(0, Math.min(offsets.length - 2, low));
}

/**
 * Returns the merged range containing one cell.
 *
 * @param cell - Candidate worksheet cell.
 * @param ranges - Saved merged-cell ranges.
 * @returns Containing merged range when present.
 */
function containingMerge(
  cell: SpreadsheetRenderCell,
  ranges: readonly SpreadsheetRange[],
): SpreadsheetRange | undefined {
  return ranges.find(
    (range) =>
      cell.row >= range.startRow &&
      cell.row <= range.endRow &&
      cell.column >= range.startColumn &&
      cell.column <= range.endColumn,
  );
}

/**
 * Applies one border side to the current canvas path.
 *
 * @param context - Active canvas context.
 * @param side - Resolved border side.
 * @param startX - Start horizontal coordinate.
 * @param startY - Start vertical coordinate.
 * @param endX - End horizontal coordinate.
 * @param endY - End vertical coordinate.
 */
function strokeSide(
  context: CanvasRenderingContext2D,
  side: SpreadsheetBorderSide | undefined,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): void {
  if (side === undefined) return;
  context.save();
  context.strokeStyle = side.color;
  context.lineWidth = side.width;
  context.setLineDash(/dash/iu.test(side.style) ? [6, 3] : /dot/iu.test(side.style) ? [1, 2] : []);
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();
  context.restore();
}

/**
 * Renders the visible worksheet canvas tile.
 *
 * @param root0 - Sheet, styles, and viewport rectangle.
 * @param root0.sheet - Active worksheet.
 * @param root0.styles - Resolved workbook styles.
 * @param root0.viewport - Visible unscaled worksheet rectangle.
 * @param root0.showGridLines - Optional host override for saved grid visibility.
 * @param root0.maxSpreadsheetCanvasBytes - Maximum backing-store bytes for the visible tile.
 * @returns Positioned canvas element.
 */
export function SpreadsheetCellCanvas({
  sheet,
  styles,
  viewport,
  showGridLines,
  pageBreakPreview = false,
  maxSpreadsheetCanvasBytes = defaultResourceBudget.maxSpreadsheetCanvasBytes,
}: {
  readonly sheet: SpreadsheetRenderSheet;
  readonly styles: SpreadsheetStyleTable;
  readonly viewport: SpreadsheetViewportRect;
  readonly showGridLines?: boolean;
  readonly pageBreakPreview?: boolean;
  readonly maxSpreadsheetCanvasBytes?: number;
}): React.ReactElement {
  const reference = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = reference.current;
    if (canvas === null) return;
    const width = Math.max(1, Math.ceil(viewport.width));
    const height = Math.max(1, Math.ceil(viewport.height));
    const desiredRatio = Math.max(1, globalThis.devicePixelRatio || 1);
    const budgetRatio = Math.sqrt(maxSpreadsheetCanvasBytes / Math.max(1, width * height * 4));
    const ratio = Math.max(0.01, Math.min(desiredRatio, budgetRatio));
    canvas.width = Math.ceil(width * ratio);
    canvas.height = Math.ceil(height * ratio);
    let context: CanvasRenderingContext2D | null;
    try {
      context = canvas.getContext("2d");
    } catch {
      return;
    }
    if (context === null) return;
    context.setTransform(ratio, 0, 0, ratio, -viewport.x * ratio, -viewport.y * ratio);
    const { columnOffsets, rowOffsets, mergedCells, printArea } = sheet.layout;
    const printLeft = printArea === undefined ? 0 : (columnOffsets[printArea.startColumn] ?? 0);
    const printRight =
      printArea === undefined
        ? sheet.layout.width
        : (columnOffsets[printArea.endColumn + 1] ?? sheet.layout.width);
    const printTop = printArea === undefined ? 0 : (rowOffsets[printArea.startRow] ?? 0);
    const printBottom =
      printArea === undefined
        ? sheet.layout.height
        : (rowOffsets[printArea.endRow + 1] ?? sheet.layout.height);
    context.fillStyle = pageBreakPreview ? "#A6A6A6" : "#FFFFFF";
    context.fillRect(viewport.x, viewport.y, width, height);
    if (pageBreakPreview) {
      context.fillStyle = "#FFFFFF";
      context.fillRect(printLeft, printTop, printRight - printLeft, printBottom - printTop);
      context.save();
      context.beginPath();
      context.rect(printLeft, printTop, printRight - printLeft, printBottom - printTop);
      context.clip();
    }
    const firstColumn = interval(columnOffsets, viewport.x);
    const lastColumn = interval(columnOffsets, viewport.x + viewport.width);
    const firstRow = interval(rowOffsets, viewport.y);
    const lastRow = interval(rowOffsets, viewport.y + viewport.height);
    if (showGridLines ?? sheet.layout.showGridLines) {
      context.save();
      context.strokeStyle = "#D9D9D9";
      context.lineWidth = 1;
      context.beginPath();
      for (let column = firstColumn; column <= lastColumn + 1; column += 1) {
        const x = Math.round(columnOffsets[column] ?? 0) + 0.5;
        context.moveTo(x, rowOffsets[firstRow] ?? 0);
        context.lineTo(x, rowOffsets[lastRow + 1] ?? sheet.layout.height);
      }
      for (let row = firstRow; row <= lastRow + 1; row += 1) {
        const y = Math.round(rowOffsets[row] ?? 0) + 0.5;
        context.moveTo(columnOffsets[firstColumn] ?? 0, y);
        context.lineTo(columnOffsets[lastColumn + 1] ?? sheet.layout.width, y);
      }
      context.stroke();
      context.restore();
    }
    for (const cell of sheet.cells) {
      const merge = containingMerge(cell, mergedCells);
      if (
        merge !== undefined &&
        (cell.row !== merge.startRow || cell.column !== merge.startColumn)
      ) {
        continue;
      }
      const left = columnOffsets[cell.column] ?? 0;
      const right = columnOffsets[(merge?.endColumn ?? cell.column) + 1] ?? left;
      const top = rowOffsets[cell.row] ?? 0;
      const bottom = rowOffsets[(merge?.endRow ?? cell.row) + 1] ?? top;
      if (
        right < viewport.x ||
        left > viewport.x + viewport.width ||
        bottom < viewport.y ||
        top > viewport.y + viewport.height
      ) {
        continue;
      }
      const style = styles.cellStyles[cell.styleId] ?? styles.cellStyles[0];
      if (style?.fill !== undefined || merge !== undefined) {
        context.fillStyle = style?.fill ?? "#FFFFFF";
        context.fillRect(left, top, right - left, bottom - top);
      }
      strokeSide(context, style?.border.top, left, top, right, top);
      strokeSide(context, style?.border.right, right, top, right, bottom);
      strokeSide(context, style?.border.bottom, left, bottom, right, bottom);
      strokeSide(context, style?.border.left, left, top, left, bottom);
    }
    if (pageBreakPreview) context.restore();
  }, [maxSpreadsheetCanvasBytes, pageBreakPreview, sheet, showGridLines, styles, viewport]);
  return (
    <canvas
      aria-hidden="true"
      className="miaixz-preview-sheet-canvas"
      data-sheet-canvas={sheet.id}
      ref={reference}
      style={{
        left: viewport.x,
        top: viewport.y,
        width: viewport.width,
        height: viewport.height,
      }}
    />
  );
}
