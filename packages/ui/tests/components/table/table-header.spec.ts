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
 * Verifies themed opaque Table headers in browsers.
 */

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const directory = resolve("src/theme/presets");
const themes = readdirSync(directory).filter((name) => {
  try {
    return Boolean(JSON.parse(readFileSync(resolve(directory, name, "preset.json"), "utf8")).name);
  } catch {
    return false;
  }
});

for (const theme of themes) {
  for (const colorMode of ["light", "dark"]) {
    test(`Table headers remain opaque while scrolling in ${theme} ${colorMode}`, async ({
      page,
    }) => {
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/tests/?stickyTable=1&theme=${theme}&colorMode=${colorMode}`);
        const container = page.locator("#tables");
        const table = container.locator("table");
        const head = table.locator("thead");
        await container.evaluate((node) => {
          node.style.maxHeight = "180px";
          node.style.overflow = "auto";
        });
        await container.scrollIntoViewIfNeeded();
        await expect(head).toHaveCSS("position", "sticky");
        const background = await head.evaluate((node) => getComputedStyle(node).backgroundColor);
        expect(background).not.toBe("rgba(0, 0, 0, 0)");
        for (const cell of await head.locator("th").all())
          await expect(cell).toHaveCSS("background-color", background);
        await container.evaluate((node) => {
          node.scrollTop = 180;
          node.scrollLeft = node.scrollWidth;
        });
        const headBox = await head.boundingBox();
        const containerBox = await container.boundingBox();
        expect(Math.abs(headBox!.y - containerBox!.y)).toBeLessThanOrEqual(2);
        const hitHeader = await container.evaluate((node) => {
          const box = node.getBoundingClientRect();
          return Boolean(
            document.elementFromPoint(box.x + box.width / 2, box.y + 12)?.closest("thead"),
          );
        });
        expect(hitHeader).toBe(true);
        if (width === 390)
          expect(await container.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
      }
    });
  }
}

test("TableContainer supports native keyboard entry and horizontal scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/tests/?stickyTable=1");

  const container = page.locator("#tables");
  await expect(container).toHaveAttribute("tabindex", "0");
  await expect(container.getByRole("table")).toBeVisible();
  await expect(
    container.locator("button, input, textarea, select, a[href], [tabindex]"),
  ).toHaveCount(0);
  const dimensions = await container.evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);

  const previousInput = page.getByRole("textbox", { name: "标识", exact: true });
  await expect(previousInput).toHaveCount(1);
  await previousInput.click();
  await page.keyboard.press("Tab");
  await expect(container).toBeFocused();

  const initialScrollLeft = await container.evaluate((node) => node.scrollLeft);
  for (let index = 0; index < 3; index++) await page.keyboard.press("ArrowRight", { delay: 50 });
  await expect
    .poll(() => container.evaluate((node) => node.scrollLeft))
    .toBeGreaterThan(initialScrollLeft);

  const result = await new AxeBuilder({ page })
    .include("#tables")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
