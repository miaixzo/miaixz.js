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
 * Locks the neutral synthetic workbook to its saved browser rendering state.
 */

import { expect, test } from "@playwright/test";

test("matches the saved page-break and frozen-pane view", async ({ browserName, page }) => {
  const crossOriginRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol !== "blob:" && url.hostname !== "127.0.0.1") {
      crossOriginRequests.push(request.url());
    }
  });
  await page.goto("/tests/shell/office/browser-host.html");
  await expect(page.locator("html")).toHaveAttribute("data-xlsx-ready", "complete", {
    timeout: 20_000,
  });
  await expect(page.locator(".miaixz-preview-workbook-page")).toHaveCount(1);
  await expect(page.getByRole("tab", { selected: true })).toHaveText("Transform Atlas");
  await expect(page.getByRole("tab", { selected: true })).toHaveAttribute(
    "data-tab-color",
    "#FF0000",
  );
  await expect(page.locator(".miaixz-preview-sheet-heading")).toContainText("85%");
  await expect(page.getByRole("button", { name: "Reset zoom" })).toContainText("85%");
  const defaultColumn = page
    .locator(".miaixz-preview-sheet-column-headers")
    .first()
    .locator("span")
    .nth(3);
  const firstRow = page
    .locator(".miaixz-preview-sheet-row-headers:not(.miaixz-preview-sheet-frozen-row-headers)")
    .locator("span")
    .first();
  const [defaultColumnBox, firstRowBox] = await Promise.all([
    defaultColumn.boundingBox(),
    firstRow.boundingBox(),
  ]);
  expect(defaultColumnBox?.width).toBeCloseTo(17, 0);
  expect(firstRowBox?.height).toBeCloseTo(17, 0);
  await expect(page.locator("[role=tabpanel] .miaixz-preview-sheet-active-cell")).toHaveCSS(
    "border-top-color",
    "rgb(33, 115, 70)",
  );
  await expect(
    page.locator('[role=tabpanel] .miaixz-preview-sheet-active-cell[data-cell-address="C27"]'),
  ).toHaveCount(1);
  await expect(page.locator(".miaixz-preview-sheet-frozen-rows")).toHaveCount(1);
  await expect(page.locator(".miaixz-preview-sheet-outline-levels span")).toHaveCount(2);
  await expect(page.locator(".miaixz-preview-sheet-outline-groups > span")).toHaveCount(1);
  const laneLabelWidth = await page
    .locator('[role="tabpanel"] [data-cell-address="Q13"]')
    .evaluate((element) => element.getBoundingClientRect().width);
  expect(laneLabelWidth).toBeGreaterThan(80);
  await expect(
    page.locator("[role=tabpanel] .miaixz-preview-sheet-page-break-vertical"),
  ).toHaveCount(2);
  await expect(
    page.locator("[role=tabpanel] .miaixz-preview-sheet-page-break-horizontal"),
  ).toHaveCount(3);
  expect(crossOriginRequests).toEqual([]);
  if (browserName === "chromium") {
    await expect(page).toHaveScreenshot("system-flow.png", {
      animations: "disabled",
      caret: "hide",
      /**
       * Keeps rasterization variance below 0.04% of the fixed 1440×900 viewport.
       */
      maxDiffPixels: 512,
      threshold: 0.02,
    });
  }
  const referenceNote = page.locator('[role="tabpanel"] [data-drawing-id="79"]');
  const row15 = page
    .locator(".miaixz-preview-sheet-row-headers:not(.miaixz-preview-sheet-frozen-row-headers) span")
    .nth(14);
  const [noteBox, row15Box] = await Promise.all([referenceNote.boundingBox(), row15.boundingBox()]);
  expect(noteBox).not.toBeNull();
  expect(row15Box).not.toBeNull();
  expect(Math.abs((noteBox?.y ?? 0) - (row15Box?.y ?? 0))).toBeLessThan(20);

  const frozenPane = page.locator(".miaixz-preview-sheet-frozen-rows");
  const frozenHeaders = page.locator(".miaixz-preview-sheet-frozen-row-headers");
  const [paneBefore, headersBefore] = await Promise.all([
    frozenPane.boundingBox(),
    frozenHeaders.boundingBox(),
  ]);
  await page.locator(".miaixz-preview-sheet-viewport").evaluate((element) => {
    element.scrollTop = 500;
    element.dispatchEvent(new Event("scroll"));
  });
  await expect
    .poll(async () => (await frozenPane.boundingBox())?.y)
    .toBeCloseTo(paneBefore?.y ?? 0, 0);
  await expect
    .poll(async () => (await frozenHeaders.boundingBox())?.y)
    .toBeCloseTo(headersBefore?.y ?? 0, 0);

  await page.getByRole("tab", { name: "Geometry Atlas" }).click();
  await expect(page.locator('[role="tabpanel"] .miaixz-preview-sheet-active-cell')).toHaveAttribute(
    "data-selection-range",
    "BH12:CB13",
  );
  await expect(
    page.locator("[role=tabpanel] .miaixz-preview-sheet-page-break-horizontal"),
  ).toHaveCount(2);
  if (browserName === "chromium") {
    await expect(page).toHaveScreenshot("system-flow-sheet-1.png", {
      animations: "disabled",
      caret: "hide",
      maxDiffPixels: 512,
      threshold: 0.02,
    });
  }
});
