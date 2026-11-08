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

for (const variant of ["brand", "default"]) {
  for (const direction of ["ltr", "rtl"]) {
    test(`${variant} ${direction} aligns labels with an empty or configured icon`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: direction === "ltr" ? 960 : 390, height: 760 });
      const fixture = `/tests/?railGradient=1&railIcons=1&railVariant=${variant}&direction=${direction}`;
      const ordinary = page.getByRole("link", { name: "Ordinary menu" });
      const missing = page.getByRole("link", { name: "Menu without an icon" });
      const help = page.getByRole("link", { name: "Help menu" });
      const icon = ".miaixz-navigation-icon";
      const glyph = `${icon} [data-miaixz-icon-glyph]`;
      for (const configured of [false, true]) {
        await page.goto(`${fixture}&expanded=1${configured ? "&railDefaultIcon=1" : ""}`);
        await expect(missing).toBeVisible();
        const labels = await Promise.all(
          [ordinary, missing].map((item) => item.locator(".miaixz-navigation-label").boundingBox()),
        );
        const [expected, actual] = labels.map((box) => {
          if (box === null) throw new Error("Rail label was not rendered.");
          return direction === "rtl" ? box.x + box.width : box.x;
        });
        expect(actual).toBeCloseTo(expected!, 1);
        if (configured) {
          await expect(help.locator(glyph)).toHaveAttribute("data-miaixz-icon-glyph", /.+/u);
          const helpGlyph = await help.locator(glyph).getAttribute("data-miaixz-icon-glyph");
          expect(helpGlyph).not.toBeNull();
          await expect(missing.locator(glyph)).toHaveAttribute(
            "data-miaixz-icon-glyph",
            helpGlyph!,
          );
          await expect(ordinary.locator(glyph)).toHaveAttribute("data-miaixz-icon-glyph", /.+/u);
          await expect(ordinary.locator(glyph)).not.toHaveAttribute(
            "data-miaixz-icon-glyph",
            helpGlyph!,
          );
          const [ordinaryIcon, fallbackIcon] = await Promise.all(
            [ordinary, missing].map((item) => item.locator(icon).boundingBox()),
          );
          expect(fallbackIcon!.x + fallbackIcon!.width / 2).toBeCloseTo(
            ordinaryIcon!.x + ordinaryIcon!.width / 2,
            1,
          );
          await expect(missing.locator(icon)).toHaveAttribute("aria-hidden", "true");
        } else {
          await expect(missing.locator(icon)).toHaveCount(0);
        }
      }

      await page.goto(`${fixture}&expanded=0&railDefaultIcon=1`);
      await expect(missing.locator(glyph)).toBeVisible();
      await missing.focus();
      await expect(missing).toBeFocused();
    });
  }
}
