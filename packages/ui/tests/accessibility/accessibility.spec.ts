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
 * Verifies accessibility behavior in the UI package.
 */

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const name of [
  "alert",
  "avatar",
  "dialog",
  "drawer",
  "select",
  "combobox",
  "dropdown",
  "tabs",
  "tree",
  "datagrid",
  "upload",
  "timeline",
  "sparkline",
  "donut",
  "graph",
  "tag",
  "segmented",
  "disclosure",
  "slider",
  "date-picker",
  "rating",
  "masonry",
] as const) {
  test(`${name} has no automatically detectable accessibility violations`, async ({ page }) => {
    await page.goto(`/tests/?a11y=${name}`);
    const selector = `[data-testid="a11y-${name}"]`;
    await expect(page.locator(selector)).toBeVisible();
    const builder = new AxeBuilder({ page }).include(selector).withTags(wcagTags);
    if (name === "tabs") {
      builder.exclude('.miaixz-tab[aria-selected="true"] > span');
    }
    const result = await builder.analyze();
    expect(result.violations).toEqual([]);
  });
}

test("Tree view semantics remain independent from compact visual depth", async ({ page }) => {
  await page.goto(
    "/tests/?treeFixture=1&treeView=compact&treeDepth=10&treeWidth=320&treeCompression=balanced",
  );
  const tree = page.getByTestId("tree-contract");
  const levelSix = tree.getByRole("treeitem", { name: "Tree level 6", exact: true });
  const levelTen = tree.getByRole("treeitem", { name: "Tree level 10", exact: true });
  await expect(levelSix).toHaveAttribute("aria-level", "6");
  await expect(levelSix).toHaveAttribute("data-visual-level", "5");
  await expect(levelTen).toHaveAttribute("aria-level", "10");
  await expect(levelTen).toHaveAttribute("data-visual-level", "5");
  await expect(levelSix).toHaveAttribute("aria-describedby", /-description$/);
  await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1);
  await expect(page.getByRole("group", { name: "Tree expansion controls" })).toBeVisible();
  const result = await new AxeBuilder({ page })
    .include('[data-testid="tree-contract-container"]')
    .withTags(wcagTags)
    .analyze();
  expect(result.violations).toEqual([]);
});
