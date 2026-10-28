/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~ http://www.apache.org/licenses/LICENSE-2.0                                ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS.         ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

/**
 * Verifies deep Tree geometry and state presentation in real browsers.
 */

import { expect, test, type Locator } from "@playwright/test";

interface RowGeometry {
  readonly paddingInlineStart: number;
  readonly usableWidth: number;
}

test("nested dense Tree reduces the gap between hierarchy controls", async ({ page }) => {
  await page.goto("/tests/?treeFixture=1&treeView=nested&treeIndent=dense&treeDepth=2");
  const tree = page.getByTestId("tree-contract");
  await expect(tree).toHaveAttribute("data-indent", "dense");
  const row = tree
    .getByRole("treeitem", { name: "Tree level 1", exact: true })
    .locator(":scope > .miaixz-tree-row");
  await expect(row).toHaveCSS("gap", "4px");
  await expect(row).toHaveCSS("height", "35px");
  await expect(
    tree
      .getByRole("treeitem", { name: "Tree level 1", exact: true })
      .locator(":scope > .miaixz-tree-row > .miaixz-tree-expander"),
  ).toHaveCSS("width", "14px");
  await expect(
    tree
      .getByRole("treeitem", { name: "Tree level 1", exact: true })
      .locator(":scope > .miaixz-tree-row > .miaixz-tree-expander"),
  ).toHaveCSS("height", "24px");
});

/**
 * Reads the geometry contract for one rendered Tree row.
 * @param item - Treeitem locator whose direct row is measured.
 * @returns Border-box available width and logical leading padding.
 */
async function readRowGeometry(item: Locator): Promise<RowGeometry> {
  return item.locator(":scope > .miaixz-tree-row").evaluate((row) => {
    const style = getComputedStyle(row);
    const paddingInlineStart = Number.parseFloat(style.paddingInlineStart);
    return {
      paddingInlineStart,
      usableWidth: row.getBoundingClientRect().width - paddingInlineStart,
    };
  });
}

for (const compression of ["balanced", "dense"] as const) {
  test(`compact ${compression} keeps deep rows usable at 320, 480, and 768 pixels`, async ({
    page,
  }, testInfo) => {
    for (const width of [320, 480, 768]) {
      await page.goto(
        `/tests/?treeFixture=1&treeView=compact&treeDepth=10&treeWidth=${width}&treeCompression=${compression}`,
      );
      const tree = page.getByTestId("tree-contract");
      await expect(tree).toHaveAttribute("data-connectors", "true");
      const deepRows: RowGeometry[] = [];
      for (const level of [6, 7, 8, 9, 10]) {
        const item = tree.getByRole("treeitem", { name: `Tree level ${level}`, exact: true });
        deepRows.push(await readRowGeometry(item));
      }
      if (width === 320) {
        expect(deepRows[0]?.usableWidth).toBeGreaterThanOrEqual(200);
        expect(deepRows[4]?.usableWidth).toBeGreaterThanOrEqual(200);
      }
      const cappedPadding = deepRows.slice(1).map((row) => row.paddingInlineStart);
      expect(Math.max(...cappedPadding) - Math.min(...cappedPadding)).toBeLessThanOrEqual(1);
      const selected = tree.getByRole("treeitem", { name: "Tree level 6", exact: true });
      await expect(selected).toHaveAttribute("aria-selected", "true");
      await expect(tree.getByRole("treeitem", { name: "Disabled item" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      await selected.focus();
      const outlineStyle = await selected
        .locator(":scope > .miaixz-tree-row")
        .evaluate((row) => getComputedStyle(row).outlineStyle);
      expect(outlineStyle).not.toBe("none");
      await testInfo.attach(`tree-${compression}-${width}.png`, {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    }
  });
}

test("compact Tree preserves capped logical indentation in RTL", async ({ page }, testInfo) => {
  await page.goto(
    "/tests/?treeFixture=1&treeView=compact&treeDepth=10&treeWidth=320&treeDirection=rtl",
  );
  const tree = page.getByTestId("tree-contract");
  await expect(tree).toHaveAttribute("dir", "rtl");
  const levelSeven = await readRowGeometry(
    tree.getByRole("treeitem", { name: "Tree level 7", exact: true }),
  );
  const levelTen = await readRowGeometry(
    tree.getByRole("treeitem", { name: "Tree level 10", exact: true }),
  );
  expect(Math.abs(levelSeven.paddingInlineStart - levelTen.paddingInlineStart)).toBeLessThanOrEqual(
    1,
  );
  await testInfo.attach("tree-compact-rtl.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("asynchronous Tree exposes loading and error states", async ({ page }, testInfo) => {
  await page.goto("/tests/?treeFixture=1&treeView=compact&treeState=loading&treeWidth=320");
  const loadingItem = page.getByRole("treeitem", { name: "Async root" });
  await loadingItem.focus();
  await page.keyboard.press("ArrowRight");
  await expect(loadingItem).toHaveAttribute("aria-busy", "true");
  await testInfo.attach("tree-async-loading.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });

  await page.goto("/tests/?treeFixture=1&treeView=compact&treeState=error&treeWidth=320");
  const errorItem = page.getByRole("treeitem", { name: "Async root" });
  await errorItem.focus();
  await page.keyboard.press("ArrowRight");
  await expect(errorItem).toHaveAttribute("data-state", "error");
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  await testInfo.attach("tree-async-error.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

for (const direction of ["ltr", "rtl"]) {
  test(`nested Tree uses one character per level in ${direction}`, async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 800 });
    await page.goto(
      `/tests/?treeFixture=1&treeView=nested&treeDepth=10&treeWidth=320&treeDirection=${direction}`,
    );
    const tree = page.getByTestId("tree-contract");
    const font = await tree.evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
    let previous: number | undefined;
    for (let level = 1; level <= 10; level++) {
      const label = tree
        .getByRole("treeitem", { name: `Tree level ${level}`, exact: true })
        .locator(":scope > .miaixz-tree-row .miaixz-tree-label");
      const box = await label.boundingBox();
      expect(box).not.toBeNull();
      const start = direction === "rtl" ? box!.x + box!.width : box!.x;
      if (previous !== undefined)
        expect(Math.abs(Math.abs(start - previous) - font)).toBeLessThan(1);
      previous = start;
    }
    const iconBox = await tree.locator(".miaixz-tree-expander .miaixz-icon").first().boundingBox();
    expect(iconBox!.width).toBeLessThan(font);
  });
}
