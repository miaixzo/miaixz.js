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

import { expect, test, type Locator } from "@playwright/test";
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

/**
 * Resolves a semantic theme color in the actual browser scope.
 * @param target The themed element.
 * @param token The semantic color token.
 * @returns The computed browser color.
 */
async function color(target: Locator, token: string) {
  return target.evaluate((element, name) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${name})`;
    element.append(probe);
    const result = getComputedStyle(probe).color;
    probe.remove();
    return result;
  }, token);
}

for (const theme of themes)
  for (const mode of ["light", "dark"]) {
    test(`Select ${theme} ${mode}: themed borders, hover, selection and error`, async ({
      page,
    }) => {
      await page.goto(`/tests/?controlStates=1&theme=${theme}&colorMode=${mode}`);
      const field = page.getByTestId("state-Select");
      const frame = field.locator(".miaixz-select");
      const trigger = field.getByRole("combobox");
      await expect(frame).toHaveCSS(
        "border-top-color",
        await color(frame, "--miaixz-surface-role-control-border"),
      );
      await trigger.hover();
      await expect(frame).toHaveCSS(
        "border-top-color",
        await color(frame, "--miaixz-surface-role-selected-border"),
      );
      await trigger.click();
      const surface = page.getByRole("listbox");
      await expect(surface).toBeVisible();
      const brand = await color(frame, "--miaixz-surface-role-selected-border");
      for (const edge of ["left", "right", "bottom"]) {
        await expect(surface).toHaveCSS(`border-${edge}-color`, brand);
      }
      const selected = surface.getByRole("option", { name: "Alpha" });
      const other = surface.getByRole("option", { name: "Beta" });
      await other.hover();
      await expect(other).toHaveCSS(
        "background-color",
        await color(frame, "--miaixz-color-surface-secondary"),
      );
      await expect(selected).toHaveCSS(
        "background-color",
        await color(frame, "--miaixz-surface-role-selected-background"),
      );
      await expect(selected).toHaveCSS("color", await color(frame, "--miaixz-color-brand-strong"));
      await selected.hover();
      await expect(selected).toHaveCSS(
        "background-color",
        await color(frame, "--miaixz-surface-role-selected-background"),
      );
      await trigger.press("Escape");
      await page.getByRole("button", { name: "错误", exact: true }).click();
      await trigger.click();
      const danger = await color(frame, "--miaixz-color-danger");
      await expect(frame).toHaveCSS("border-top-color", danger);
      await expect(surface).toHaveAttribute("data-invalid", "true");
      await expect(surface).toHaveCSS("border-bottom-color", danger);
      await trigger.press("Escape");
      await expect(frame).toHaveCSS("border-top-color", danger);
    });
  }
