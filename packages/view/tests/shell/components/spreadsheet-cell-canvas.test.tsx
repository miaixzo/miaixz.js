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
 * Verifies merged-cell painting in the virtualized Canvas layer.
 */

import { render } from "@testing-library/react";
import { createElement } from "react";
import { resolveResourceBudget } from "../../../src/runtime/resource-budget.js";
import type {
  SpreadsheetRenderSheet,
  SpreadsheetStyleTable,
} from "../../../src/shared/contracts/document.js";
import { SpreadsheetCellCanvas } from "../../../src/shell/components/spreadsheet-cell-canvas.js";

const styles: SpreadsheetStyleTable = {
  fontCount: 1,
  fillCount: 1,
  borderCount: 1,
  cellStyles: [
    {
      font: {
        family: "sans-serif",
        size: 11,
        color: "#000000",
        bold: false,
        italic: false,
        underline: false,
        strike: false,
      },
      border: {},
      horizontal: "left",
      vertical: "bottom",
      wrapText: false,
      shrinkToFit: false,
      textRotation: 0,
      numberFormat: "General",
    },
  ],
};

const sheet: SpreadsheetRenderSheet = {
  id: "sheet-1",
  name: "Sheet 1",
  state: "visible",
  cells: [
    {
      address: "A1",
      row: 0,
      column: 0,
      value: "Merged",
      displayValue: "Merged",
      styleId: 0,
    },
  ],
  layout: {
    dimension: {
      reference: "A1:B2",
      startRow: 0,
      startColumn: 0,
      endRow: 1,
      endColumn: 1,
    },
    defaultRowHeight: 20,
    defaultColumnWidth: 20,
    rows: [],
    columns: [],
    mergedCells: [
      {
        reference: "A1:B2",
        startRow: 0,
        startColumn: 0,
        endRow: 1,
        endColumn: 1,
      },
    ],
    columnOffsets: Float64Array.from([0, 20, 40]),
    rowOffsets: Float64Array.from([0, 20, 40]),
    width: 40,
    height: 40,
    showGridLines: true,
    showRowColumnHeaders: true,
    rightToLeft: false,
    outlineSummaryBelow: true,
    outlineSummaryRight: true,
    viewMode: "normal",
    zoomScale: 100,
    zoomScaleNormal: 100,
    zoomScalePageLayout: 100,
    selections: [],
    pageMargins: {
      left: 0.7,
      right: 0.7,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3,
    },
    pageSetup: { scale: 100, orientation: "default" },
    rowBreaks: [],
    columnBreaks: [],
  },
};

describe("SpreadsheetCellCanvas", () => {
  it("paints a merged owner over the complete merged rectangle", () => {
    const fillRect = vi.fn();
    const context = {
      beginPath: vi.fn(),
      fillRect,
      lineTo: vi.fn(),
      moveTo: vi.fn(),
      restore: vi.fn(),
      save: vi.fn(),
      setLineDash: vi.fn(),
      setTransform: vi.fn(),
      stroke: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);

    render(
      createElement(SpreadsheetCellCanvas, {
        sheet,
        styles,
        viewport: { x: 0, y: 0, width: 40, height: 40 },
      }),
    );

    expect(fillRect).toHaveBeenCalledWith(0, 0, 40, 40);
  });

  it("caps the Canvas backing store at the configured spreadsheet byte budget", () => {
    const context = {
      beginPath: vi.fn(),
      fillRect: vi.fn(),
      lineTo: vi.fn(),
      moveTo: vi.fn(),
      restore: vi.fn(),
      save: vi.fn(),
      setLineDash: vi.fn(),
      setTransform: vi.fn(),
      stroke: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);

    const rendered = render(
      createElement(SpreadsheetCellCanvas, {
        maxSpreadsheetCanvasBytes: resolveResourceBudget({ maxSpreadsheetCanvasBytes: 400 })
          .maxSpreadsheetCanvasBytes,
        sheet,
        styles,
        viewport: { x: 0, y: 0, width: 40, height: 40 },
      }),
    );
    const canvas = rendered.container.querySelector("canvas");
    expect((canvas?.width ?? 0) * (canvas?.height ?? 0) * 4).toBeLessThanOrEqual(400);
  });
});
