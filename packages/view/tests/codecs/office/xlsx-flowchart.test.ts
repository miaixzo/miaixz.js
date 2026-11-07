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
 * Verifies the reviewed synthetic workbook against the complete DrawingML path.
 */

import { VERSION } from "../../../src/version.js";

import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { ZipArchive } from "../../../src/codecs/archive/zip-codec.js";
import { decodeEmf } from "../../../src/codecs/office/emf-codec.js";
import { createOoxmlDriver } from "../../../src/codecs/office/ooxml-codec.js";
import { defaultResourceBudget } from "../../../src/runtime/resource-budget.js";
import type { DriverContext } from "../../../src/shared/contracts/driver.js";
import { isSpreadsheetRenderDocument } from "../../../src/shared/contracts/document.js";
import { ModelView } from "../../../src/shell/components/model-view.js";

const fixturePath = resolve(process.cwd(), "tests/formats/xlsx/system-flow.fixture.xlsx");
const inventoryPath = resolve(process.cwd(), "tests/formats/xlsx/system-flow.fixture.json");
const formatDriver = createOoxmlDriver("xlsx", "spreadsheet");

/**
 * Workbook drawing counts and relationship paths recorded for fixture assertions.
 */
interface FixtureInventory {
  readonly sha256: string;
  readonly expectedStatus: "complete";
  readonly packageParts: readonly string[];
  readonly workbook: {
    readonly sheetCount: number;
    readonly sheetNames: readonly string[];
    readonly dimensions: readonly string[];
    readonly savedCellCount: number;
    readonly mergedCellCount: number;
    readonly cellStyleCount: number;
    readonly fontCount: number;
    readonly fillCount: number;
    readonly borderCount: number;
  };
  readonly view: {
    readonly activeSheetIndex: number;
    readonly modes: readonly string[];
    readonly zoomScales: readonly number[];
    readonly frozenRows: readonly number[];
    readonly activeCells: readonly string[];
    readonly printAreas: readonly string[];
    readonly rowBreaks: readonly (readonly number[])[];
    readonly columnBreaks: readonly (readonly number[])[];
    readonly tabColors: readonly (string | null)[];
    readonly outlinedRowCounts: readonly number[];
  };
  readonly drawing: {
    readonly visibleObjectCount: number;
    readonly shapeCount: number;
    readonly connectorCount: number;
    readonly groupCount: number;
    readonly customGeometryCount: number;
    readonly picturePlacementCount: number;
    readonly emfPlacementCount: number;
    readonly emfRecordCounts: readonly number[];
    readonly emfRecordTypes: readonly number[];
  };
}

/**
 * Reads the reviewed acceptance inventory without mutating it.
 *
 * @returns Frozen fixture expectations.
 */
async function fixtureInventory(): Promise<FixtureInventory> {
  return JSON.parse(await readFile(inventoryPath, "utf8")) as FixtureInventory;
}

/**
 * Creates a bounded driver context over the reviewed synthetic workbook.
 *
 * @returns Driver context containing an immutable workbook copy.
 */
async function workbookContext(): Promise<DriverContext> {
  const bytes = new Uint8Array(await readFile(fixturePath));
  return {
    resource: {
      id: "xlsx-flowchart-fixture",
      name: "system-flow.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: bytes.length,
      etag: undefined,
      /**
       * Reads a bounded fixture byte range.
       *
       * @param start - Zero-based source offset.
       * @param length - Maximum bytes returned.
       * @returns Owned fixture bytes.
       */
      async read(start, length) {
        return bytes.slice(start, start + length);
      },
      /**
       * Reads an owned copy of the complete fixture.
       *
       * @returns Complete fixture bytes.
       */
      async readAll() {
        return bytes.slice();
      },
      /**
       * Returns the deterministic fixture object URL.
       *
       * @returns Fixture object URL.
       */
      async createObjectUrl() {
        return "blob:xlsx-flowchart-fixture";
      },
      /**
       * Releases fixture resources after the test.
       */
      dispose() {},
    },
    decision: {
      extension: "xlsx",
      driver: "xlsx",
      confidence: 1,
      evidence: [],
      conflicts: [],
    },
    budget: defaultResourceBudget,
    signal: new AbortController().signal,
    /**
     * Accepts parser progress without mutating test state.
     */
    reportProgress() {},
  };
}

describe("XLSX DrawingML flowcharts", () => {
  it("uses the reviewed synthetic fixture without silent replacement", async () => {
    const bytes = await readFile(fixturePath);
    const inventory = await fixtureInventory();
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(inventory.sha256);
    expect(
      new ZipArchive(new Uint8Array(bytes), defaultResourceBudget).entries
        .map((entry) => entry.path)
        .sort(),
    ).toEqual([...inventory.packageParts].sort());
  });

  it("retains every shape, connector, group, picture, and custom geometry", async () => {
    const inventory = await fixtureInventory();
    const outcome = await formatDriver.open(await workbookContext());
    expect(outcome.status).toBe(inventory.expectedStatus);
    if (outcome.status !== "complete") return;
    expect(outcome.model.kind).toBe("spreadsheet");
    if (outcome.model.kind !== "spreadsheet") return;
    expect(outcome.model.sheets).toHaveLength(inventory.workbook.sheetCount);
    expect(outcome.model.sheets.map((sheet) => sheet.name)).toEqual(inventory.workbook.sheetNames);
    expect(isSpreadsheetRenderDocument(outcome.model)).toBe(true);
    if (!isSpreadsheetRenderDocument(outcome.model)) return;
    expect(outcome.model.layoutVersion).toBe(VERSION);
    expect(outcome.model.sheets.map((sheet) => sheet.layout.dimension.reference)).toEqual(
      inventory.workbook.dimensions,
    );
    expect(outcome.model.activeSheetId).toBe(
      outcome.model.sheets[inventory.view.activeSheetIndex]?.id,
    );
    expect(outcome.model.sheets.map((sheet) => sheet.layout.viewMode)).toEqual(
      inventory.view.modes,
    );
    expect(outcome.model.sheets.map((sheet) => sheet.layout.pane)).toEqual([
      {
        state: "frozen",
        xSplit: 0,
        ySplit: 13,
        topLeftCell: "A14",
        activePane: "bottomLeft",
      },
      {
        state: "frozen",
        xSplit: 0,
        ySplit: 13,
        topLeftCell: "A14",
        activePane: "bottomLeft",
      },
    ]);
    expect(outcome.model.sheets.map((sheet) => sheet.layout.pane?.ySplit)).toEqual(
      inventory.view.frozenRows,
    );
    expect(outcome.model.sheets.map((sheet) => sheet.layout.activeSelection?.activeCell)).toEqual(
      inventory.view.activeCells,
    );
    expect(outcome.model.sheets.map((sheet) => sheet.layout.printArea?.reference)).toEqual(
      inventory.view.printAreas,
    );
    expect(outcome.model.sheets.map((sheet) => sheet.layout.rowBreaks)).toEqual(
      inventory.view.rowBreaks,
    );
    expect(outcome.model.sheets.map((sheet) => sheet.layout.columnBreaks)).toEqual(
      inventory.view.columnBreaks,
    );
    expect(outcome.model.sheets.map((sheet) => sheet.layout.zoomScale)).toEqual(
      inventory.view.zoomScales,
    );
    expect(outcome.model.sheets.map((sheet) => sheet.tabColor ?? null)).toEqual(
      inventory.view.tabColors,
    );
    expect(
      outcome.model.sheets.map(
        (sheet) => sheet.layout.rows.filter((row) => row.outlineLevel === 1).length,
      ),
    ).toEqual(inventory.view.outlinedRowCounts);
    expect(outcome.model.sheets[0]?.cells.find((cell) => cell.address === "A1")?.displayValue).toBe(
      inventory.workbook.sheetNames[0],
    );
    expect(outcome.model.sheets.reduce((count, sheet) => count + sheet.cells.length, 0)).toBe(
      inventory.workbook.savedCellCount,
    );
    expect(outcome.model.styles).toMatchObject({
      fontCount: inventory.workbook.fontCount,
      fillCount: inventory.workbook.fillCount,
      borderCount: inventory.workbook.borderCount,
    });
    expect(outcome.model.styles.cellStyles).toHaveLength(inventory.workbook.cellStyleCount);
    expect(outcome.model.styles.cellStyles[4]?.font.color).toBe("#1F2933");
    expect(outcome.model.styles.cellStyles[7]?.font.color).toBe("#008000");
    expect(outcome.model.styles.cellStyles[8]?.font.color).toBe("#315B78");
    expect(outcome.model.styles.cellStyles[2]?.fill).toBe("#D9D9D9");
    expect(outcome.model.styles.cellStyles[1]?.fill).toBe("#003366");
    expect(outcome.model.styles.cellStyles[1]?.border.left?.color).toBe("#000000");
    expect(
      outcome.model.sheets.reduce((count, sheet) => count + sheet.layout.mergedCells.length, 0),
    ).toBe(inventory.workbook.mergedCellCount);
    expect(outcome.model.coverage.entries.every((entry) => entry.skipped === 0)).toBe(true);
    expect(outcome.model.drawings).toHaveLength(2);
    expect(outcome.model.drawings.map((drawing) => drawing.features)).toEqual([
      {
        shapeCount: 85,
        connectorCount: 37,
        groupCount: 24,
        pictureCount: 3,
        customGeometryCount: 5,
        smartArtCount: 0,
        unsupportedCount: 0,
      },
      {
        shapeCount: 150,
        connectorCount: 79,
        groupCount: 32,
        pictureCount: 3,
        customGeometryCount: 9,
        smartArtCount: 0,
        unsupportedCount: 0,
      },
    ]);
    expect(
      outcome.model.drawings.reduce((count, drawing) => count + drawing.shapes.length, 0),
    ).toBe(inventory.drawing.visibleObjectCount);
    expect(outcome.model.drawings.reduce((count, drawing) => count + drawing.edges.length, 0)).toBe(
      inventory.drawing.connectorCount,
    );
    expect(
      outcome.model.drawings.reduce(
        (count, drawing) => count + (drawing.graph?.nodes.length ?? 0),
        0,
      ),
    ).toBe(inventory.drawing.shapeCount);
    expect(
      outcome.model.drawings.reduce(
        (count, drawing) => count + (drawing.features?.groupCount ?? 0),
        0,
      ),
    ).toBe(inventory.drawing.groupCount);
    expect(
      outcome.model.drawings.reduce(
        (count, drawing) => count + (drawing.features?.customGeometryCount ?? 0),
        0,
      ),
    ).toBe(inventory.drawing.customGeometryCount);
  });

  it("produces transformed paths, arrowheads, text, and embedded image resources", async () => {
    const inventory = await fixtureInventory();
    const outcome = await formatDriver.open(await workbookContext());
    if (outcome.status !== "complete" || outcome.model.kind !== "spreadsheet") {
      throw new Error("Expected a complete spreadsheet model");
    }
    const shapes = outcome.model.drawings.flatMap((drawing) => drawing.shapes);
    expect(
      shapes.filter((shape) => shape.preset === "custom" && shape.path !== undefined),
    ).toHaveLength(inventory.drawing.customGeometryCount);
    expect(
      shapes.some((shape) => shape.preset === "flowChartDecision" && shape.kind === "path"),
    ).toBe(true);
    expect(shapes.some((shape) => shape.endArrow === "arrow")).toBe(true);
    expect(shapes.some((shape) => shape.text !== undefined && shape.textStyle !== undefined)).toBe(
      true,
    );
    expect(
      shapes.filter(
        (shape) => shape.kind === "image" && shape.source?.startsWith("data:") === true,
      ),
    ).toHaveLength(inventory.drawing.picturePlacementCount);
    const vectorPictures = shapes.filter(
      (shape) =>
        shape.kind === "image" && shape.source?.startsWith("data:image/svg+xml;base64,") === true,
    );
    expect(vectorPictures).toHaveLength(inventory.drawing.emfPlacementCount);
    for (const picture of vectorPictures) {
      const payload = picture.source?.split(",", 2)[1] ?? "";
      const svg = Buffer.from(payload, "base64").toString("utf8");
      expect(svg).toMatch(/<(?:ellipse|image|path|polygon|polyline|rect|text)\b/u);
      expect(svg).not.toContain("NaN");
      expect(svg).toContain('fill="#808080"');
      expect(svg).toContain('stroke="none"');
      expect(svg).toMatch(/<path d="[^"]*C[^"]*L[^"]*Z"[^>]*fill=/u);
    }
    expect(
      shapes.filter((shape) => shape.kind === "image" && shape.imageCrop !== undefined),
    ).toHaveLength(2);
    expect(shapes.every((shape) => shape.transform !== undefined)).toBe(true);
    if (!isSpreadsheetRenderDocument(outcome.model)) {
      throw new Error("Expected a layout-aware spreadsheet model");
    }
    const firstSheet = outcome.model.sheets[0];
    const anchoredCallout = outcome.model.drawings[0]?.shapes.find((shape) => shape.id === "61");
    if (firstSheet === undefined || anchoredCallout?.transform === undefined) {
      throw new Error("Expected the reviewed two-cell anchored callout");
    }
    expect(anchoredCallout.transform.e).toBeCloseTo(
      (firstSheet.layout.columnOffsets[80] ?? 0) + 48_186 / 9525,
      5,
    );
    expect(anchoredCallout.transform.f).toBeCloseTo(
      (firstSheet.layout.rowOffsets[6] ?? 0) + 44_824 / 9525,
      5,
    );

    const fixtureBytes = new Uint8Array(await readFile(fixturePath));
    const archive = new ZipArchive(fixtureBytes, defaultResourceBudget);
    const vectorParts = archive.entries
      .map((entry) => entry.path)
      .filter((path) => path.endsWith(".emf"))
      .sort();
    const vectorBytes = await Promise.all(vectorParts.map((path) => archive.read(path)));
    const decodedVectors = vectorBytes.map((bytes) => decodeEmf(bytes, defaultResourceBudget));
    const recordTypes = new Set<number>();
    for (const bytes of vectorBytes) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      let offset = 0;
      while (offset < bytes.byteLength) {
        const size = view.getUint32(offset + 4, true);
        expect(size).toBeGreaterThanOrEqual(8);
        expect(size % 4).toBe(0);
        expect(size).toBeLessThanOrEqual(bytes.byteLength - offset);
        recordTypes.add(view.getUint32(offset, true));
        offset += size;
      }
      expect(offset).toBe(bytes.byteLength);
    }
    expect([...recordTypes].sort((first, second) => first - second)).toEqual(
      inventory.drawing.emfRecordTypes,
    );
    expect([...recordTypes]).toEqual(
      expect.arrayContaining([
        1, 6, 9, 10, 11, 12, 14, 17, 18, 19, 21, 27, 33, 34, 36, 37, 39, 40, 54, 59, 60, 61, 62, 64,
        67, 70, 76, 81, 85, 86, 88, 89, 94, 95, 98,
      ]),
    );
    expect(decodedVectors.map((vector) => vector.recordCount)).toEqual(
      inventory.drawing.emfRecordCounts,
    );
    expect(decodedVectors.every((vector) => vector.visible)).toBe(true);
    expect(decodedVectors.flatMap((vector) => vector.unsupportedRecords)).toEqual([]);
  });

  it("mounts only the active sheet and switches drawings through workbook tabs", async () => {
    const outcome = await formatDriver.open(await workbookContext());
    if (outcome.status !== "complete" || outcome.model.kind !== "spreadsheet") {
      throw new Error("Expected a complete spreadsheet model");
    }
    const onSheetChange = vi.fn();
    const rendered = render(
      createElement(ModelView, {
        document: outcome.model,
        scale: 1,
        spreadsheetOptions: { onSheetChange },
      }),
    );
    const activeSurface = rendered.container.querySelector('[role="tabpanel"]');
    expect(activeSurface?.querySelectorAll(".miaixz-preview-sheet-drawing")).toHaveLength(1);
    expect(activeSurface?.querySelectorAll("[data-drawing-id]")).toHaveLength(232);
    expect(activeSurface?.querySelectorAll("[data-sheet-canvas]")).toHaveLength(1);
    expect(rendered.container.querySelectorAll(".miaixz-preview-sheet-frozen-rows")).toHaveLength(
      1,
    );
    expect(rendered.getAllByRole("tab")).toHaveLength(2);
    expect(rendered.container.querySelectorAll("path").length).toBeGreaterThan(90);
    expect(rendered.container.textContent).not.toContain("Cell data");
    fireEvent.click(rendered.getAllByRole("tab")[0] as HTMLElement);
    await waitFor(() => {
      expect(
        rendered.container
          .querySelector('[role="tabpanel"]')
          ?.querySelectorAll("[data-drawing-id]"),
      ).toHaveLength(125);
    });
    expect(onSheetChange).toHaveBeenCalledWith({
      id: outcome.model.sheets[0]?.id,
      name: outcome.model.sheets[0]?.name,
      index: 0,
    });
    if (!isSpreadsheetRenderDocument(outcome.model)) {
      throw new Error("Expected a layout-aware spreadsheet model");
    }
    const firstSheet = outcome.model.sheets[0];
    if (firstSheet === undefined) throw new Error("Expected the first worksheet");
    const valueCounts = new Map<string, number>();
    for (const cell of firstSheet.cells) {
      if (cell.displayValue !== "") {
        valueCounts.set(cell.displayValue, (valueCounts.get(cell.displayValue) ?? 0) + 1);
      }
    }
    const searchCell = firstSheet.cells.find(
      (cell) => cell.displayValue !== "" && valueCounts.get(cell.displayValue) === 1,
    );
    if (searchCell === undefined) throw new Error("Expected a searchable unique cell");
    fireEvent.change(rendered.getByRole("searchbox", { name: "Search current sheet" }), {
      target: { value: searchCell.displayValue },
    });
    fireEvent.click(rendered.getByRole("button", { name: "Find" }));
    await waitFor(() => {
      expect(
        rendered.container.querySelector(
          `[data-cell-address="${searchCell.address}"].miaixz-preview-sheet-cell-selected`,
        ),
      ).not.toBeNull();
    });
    const selectedCell = rendered.container.querySelector(
      `[data-cell-address="${searchCell.address}"].miaixz-preview-sheet-cell-selected`,
    );
    if (selectedCell === null) throw new Error("Expected the searched cell to be selected");
    const setData = vi.fn();
    fireEvent.copy(selectedCell, { clipboardData: { setData } });
    expect(setData).toHaveBeenCalledWith("text/plain", searchCell.displayValue);
  }, 15_000);

  it("honors initial sheet and visibility options without exposing hidden DOM props", async () => {
    const outcome = await formatDriver.open(await workbookContext());
    if (outcome.status !== "complete" || outcome.model.kind !== "spreadsheet") {
      throw new Error("Expected a complete spreadsheet model");
    }
    const firstSheet = outcome.model.sheets[0];
    if (firstSheet === undefined) throw new Error("Expected a visible worksheet");
    const diagnostics = vi.fn();
    const rendered = render(
      createElement(ModelView, {
        document: outcome.model,
        scale: 1,
        spreadsheetOptions: {
          initialSheet: firstSheet.name,
          showGridLines: false,
          showSheetTabs: false,
          onDiagnostics: diagnostics,
        },
      }),
    );
    expect(
      rendered.container.querySelector('[role="tabpanel"]')?.querySelectorAll("[data-drawing-id]"),
    ).toHaveLength(125);
    expect(rendered.queryAllByRole("tab")).toHaveLength(0);
    expect(diagnostics).not.toHaveBeenCalled();
    rendered.rerender(
      createElement(ModelView, {
        document: outcome.model,
        scale: 1,
        spreadsheetOptions: { initialSheet: "missing-sheet", onDiagnostics: diagnostics },
      }),
    );
    await waitFor(() => {
      expect(diagnostics).toHaveBeenCalledWith([
        {
          code: "XLSX_INITIAL_SHEET_NOT_FOUND",
          messageKey: "xlsx.initialSheetNotFound",
        },
      ]);
    });
    diagnostics.mockClear();
    rendered.rerender(
      createElement(ModelView, {
        document: outcome.model,
        scale: 1,
        spreadsheetDiagnostics: [
          { code: "OFFICE_MACRO_IGNORED", messageKey: "office.macroIgnored" },
        ],
        spreadsheetOptions: { initialSheet: firstSheet.id, onDiagnostics: diagnostics },
      }),
    );
    await waitFor(() => {
      expect(diagnostics).toHaveBeenCalledWith([
        { code: "OFFICE_MACRO_IGNORED", messageKey: "office.macroIgnored" },
      ]);
    });
  }, 15_000);

  it.each([
    ["maxSpreadsheetSheets", 1],
    ["maxSpreadsheetRows", 100],
    ["maxSpreadsheetColumns", 50],
    ["maxSpreadsheetCells", 100],
    ["maxSpreadsheetStyles", 1],
    ["maxDrawingObjects", 100],
    ["maxEstimatedMemoryBytes", 100],
  ] as const)("rejects a workbook exceeding %s", async (field, allowed) => {
    const source = await workbookContext();
    const outcome = await formatDriver.open({
      ...source,
      budget: { ...source.budget, [field]: allowed },
    });
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.error.code).toBe("RESOURCE_LIMIT_EXCEEDED");
    expect(outcome.error.resourceLimit?.field).toBe(field);
    expect(outcome.error.resourceLimit?.allowed).toBe(allowed);
    expect(outcome.error.resourceLimit?.actual).toBeGreaterThan(allowed);
  });
});
