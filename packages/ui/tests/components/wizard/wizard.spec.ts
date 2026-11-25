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
 * Verifies responsive Wizard composition in an actual browser and both color modes.
 */
import { expect, test } from "@playwright/test";

for (const mode of ["light", "dark"] as const) {
  test(`Wizard preserves scroll regions and drafts in ${mode} mode`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/tests/?wizard=1&colorMode=${mode}`);
    const frame = page.getByTestId("wizard-frame");
    const navigation = frame.getByRole("list", { name: "Setup steps" });
    await expect(navigation).toHaveAttribute("data-orientation", "vertical");
    const input = frame.getByRole("textbox", { name: "Connection name" });
    await input.fill("Retained connection");
    const content = frame.locator(".miaixz-wizard-content");
    await expect
      .poll(() => content.evaluate((node) => node.scrollHeight > node.clientHeight))
      .toBe(true);
    const bounds = await frame.boundingBox();
    const footer = await frame.getByRole("button", { name: "Continue" }).boundingBox();
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(bounds!.y + bounds!.height + 1);
    await page.getByRole("button", { name: "Resize container" }).click();
    await expect(navigation).toHaveAttribute("data-orientation", "horizontal");
    await expect(frame.getByText("Configuration guidance")).toBeVisible();
    await frame.getByRole("button", { name: "Review", exact: true }).click();
    await expect(input).toBeHidden();
    await expect(frame.getByText("Review configuration")).toBeVisible();
    await frame.getByRole("button", { name: "Back to configuration" }).click();
    await expect(input).toHaveValue("Retained connection");
  });
}
