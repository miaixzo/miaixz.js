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
 * Verifies the restored brand navigation gradient across presentation states.
 */
import { expect, test } from "@playwright/test";

for (const theme of ["miaixz", "olive", "contrast"]) {
  for (const colorMode of ["light", "dark"]) {
    for (const direction of ["ltr", "rtl"]) {
      test(`${theme} ${colorMode} ${direction} preserves selected menu gradients`, async ({
        page,
      }) => {
        for (const expanded of ["0", "1"]) {
          await page.goto(
            `/tests/?railGradient=1&theme=${theme}&colorMode=${colorMode}&direction=${direction}&expanded=${expanded}`,
          );
          const item = page.locator('.miaixz-navigation-item[aria-current="page"]');
          await expect(item).toBeVisible();
          const gradient = await item.evaluate((node) => getComputedStyle(node).backgroundImage);
          expect(gradient).toContain(`linear-gradient(${direction === "rtl" ? 90 : 270}deg`);
          expect(gradient).toContain("rgba(0, 0, 0, 0)");
          await item.hover();
          await expect(item).toHaveCSS("background-image", gradient);
          await item.focus();
          await expect(item).toHaveCSS("background-image", gradient);
          await page.mouse.down();
          await expect(item).toHaveCSS("background-image", gradient);
          await page.mouse.up();
        }
      });
    }
  }
}
