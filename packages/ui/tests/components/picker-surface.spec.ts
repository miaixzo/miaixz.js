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
 * Verifies select contract behavior in the UI package.
 */

import { expect, test } from "@playwright/test";

for (const presentation of ["popover", "drawer", "dialog", "inline"]) {
  test(`Picker ${presentation} stages and confirms with one mounted content`, async ({ page }) => {
    await page.goto(`/tests/?controlStates=1&pickerSurface=${presentation}`);
    const trigger = page.getByRole("button", { name: "Choose resource", exact: true });
    if (presentation !== "inline") {
      await expect(page.getByTestId("picker-custom-content")).toHaveCount(0);
      await trigger.focus();
      await page.keyboard.press("Enter");
    }
    await expect(page.getByTestId("picker-custom-content")).toHaveCount(1);
    await page.getByRole("button", { name: "Pick Alpha" }).click();
    await expect(page.getByTestId("committed-value")).toHaveText("empty");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page.getByTestId("committed-value")).toHaveText("empty");
    if (presentation !== "inline") {
      await expect(trigger).toBeFocused();
      await trigger.click();
    }
    await page.getByRole("button", { name: "Pick Alpha" }).click();
    await page.getByRole("button", { name: "Confirm", exact: true }).click();
    await expect(page.getByTestId("committed-value")).toHaveText("alpha");
    if (presentation !== "inline") {
      await expect(page.getByTestId("picker-custom-content")).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
  });
}

for (const size of ["small", "medium", "large"]) {
  test(`Picker ${size} matches Input height`, async ({ page }) => {
    await page.goto(`/tests/?controlStates=1&pickerSurface=drawer&pickerSize=${size}`);
    const trigger = page.getByRole("button", { name: "Choose resource", exact: true });
    const input = page.getByRole("textbox", { name: "Reference input" });
    const inputBox = await input.locator("..").boundingBox();
    const triggerBox = await trigger.boundingBox();
    expect(inputBox).not.toBeNull();
    expect(triggerBox).not.toBeNull();
    expect(triggerBox!.height).toBe(inputBox!.height);
  });
}
