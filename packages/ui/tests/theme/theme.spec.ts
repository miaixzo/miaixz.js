/**
 * Verifies theme behavior in the UI package.
 */

import { VERSION } from "../../src/version.js";

import { expect, test } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { DRAWER_WIDTHS } from "../../src/components/drawer/drawer-widths.js";

import { MiaixzThemeError } from "../../src/theme/error.js";
import { parseTheme } from "../../src/theme/parse.js";
import miaixzTheme from "../../src/theme/presets/miaixz/index.js";
import { resolveThemeDefinitions } from "../../src/theme/resolve.js";
import { serializeThemeApplication } from "../../src/theme/serialize.js";

const presetDirectory = resolve("src/theme/presets");
const presets = readdirSync(presetDirectory, { recursive: true })
  .filter((entry) => entry.toString().endsWith("preset.json"))
  .map((entry) => JSON.parse(readFileSync(resolve(presetDirectory, entry.toString()), "utf8")));
const builtInThemeNames = presets
  .filter(({ builtin }) => builtin)
  .sort((left, right) => left.order - right.order)
  .map(({ name }) => String(name));

type BrandButtonColors = readonly [normal: string, hover: string, active: string];

/**
 * Approved brand colors for all shipped presets, including lazy-loaded themes.
 * Keep this baseline independent of the theme source and rendered styles.
 */
const brandButtonColors = {
  miaixz: { light: ["#62B52F", "#58A62A", "#4E9724"], dark: ["#7BCB52", "#8BD965", "#70BF48"] },
  neutral: { light: ["#4B5563", "#374151", "#1F2937"], dark: ["#D1D5DB", "#E5E7EB", "#B8BEC7"] },
  contrast: { light: ["#004F1F", "#003A17", "#00270F"], dark: ["#7CFF8A", "#A3FFAD", "#60E971"] },
  glacier: { light: ["#2563EB", "#1D4ED8", "#1E40AF"], dark: ["#79A7FF", "#91B7FF", "#6596F2"] },
  porcelain: { light: ["#1E6091", "#184F78", "#123F61"], dark: ["#78C8F0", "#8FD3F4", "#62B5DD"] },
  tidal: { light: ["#087E8B", "#066B76", "#055861"], dark: ["#65D3DC", "#7ADDE4", "#51C0C9"] },
  olive: { light: ["#65702A", "#555F23", "#454E1C"], dark: ["#C1CD74", "#CED98A", "#AFBC63"] },
  amber: { light: ["#9A5C00", "#814C00", "#693E00"], dark: ["#F3BD5D", "#F8CA76", "#DFA94A"] },
  copper: { light: ["#A3471C", "#893B17", "#703013"], dark: ["#F29A70", "#F7AC88", "#DC845D"] },
  rose: { light: ["#A33161", "#8A2851", "#712142"], dark: ["#F08DB1", "#F5A1C0", "#D8789C"] },
  ink: { light: ["#40516E", "#34425A", "#293548"], dark: ["#A8B9D8", "#B9C8E2", "#95A7C8"] },
} satisfies Record<string, Record<"light" | "dark", BrandButtonColors>>;

const compactTypography = {
  "--miaixz-text-compact-body-size": "12px",
  "--miaixz-text-compact-body-line-height": "14px",
  "--miaixz-text-compact-caption-size": "10px",
  "--miaixz-text-compact-caption-line-height": "14px",
  "--miaixz-text-compact-section-title-size": "11px",
  "--miaixz-text-compact-section-title-line-height": "15px",
  "--miaixz-text-compact-metric-size": "22px",
  "--miaixz-text-compact-metric-line-height": "26px",
} as const;

const nonColorRoles = [
  "--miaixz-opacity-navigation-selected",
  "--miaixz-radius-control",
  "--miaixz-shadow-low",
  "--miaixz-geometry-compact-control-height",
  "--miaixz-layout-page-gutter-min",
  "--miaixz-surface-role-panel-background",
] as const;

for (const theme of builtInThemeNames) {
  for (const colorMode of ["light", "dark"] as const) {
    test(`${theme} ${colorMode} exposes the complete semantic typography contract`, async ({
      page,
    }) => {
      await page.goto(`/tests/?theme=${theme}&colorMode=${colorMode}&density=standard`);
      const root = page.locator("html");
      await expect(root).toHaveAttribute("data-miaixz-theme", theme);
      await expect(root).toHaveAttribute("data-miaixz-color-mode", colorMode);
      await expect(root).toHaveAttribute("data-miaixz-density", "standard");
      await expect(page.getByRole("main", { name: "Miaixz UI 浏览器契约夹具" })).toBeVisible();
      const loadingButton = page.locator('button.miaixz-button[data-loading="true"]').last();
      await expect(loadingButton).toBeDisabled();
      await expect(loadingButton.getByRole("status")).toHaveText("正在保存");

      const values = await root.evaluate((element, properties) => {
        const styles = getComputedStyle(element);
        return Object.fromEntries(
          properties.map((property) => [property, styles.getPropertyValue(property).trim()]),
        );
      }, Object.keys(compactTypography));
      expect(values).toEqual(compactTypography);
      for (const property of nonColorRoles) {
        await expect(root).not.toHaveCSS(property, "");
      }
    });
  }
}

for (const density of ["compact", "standard", "comfortable"] as const) {
  test(`${density} density is applied without changing component ownership`, async ({ page }) => {
    await page.goto(`/tests/?theme=${miaixzTheme.name}&colorMode=light&density=${density}`);
    await expect(page.locator("html")).toHaveAttribute("data-miaixz-density", density);
    await expect(page.getByRole("group", { name: "四项指标" })).toBeVisible();
    await expect(page.getByRole("table", { name: "固定成员数据" })).toBeVisible();
  });
}

test("solid brand button color baselines cover every shipped theme preset", () => {
  expect(Object.keys(brandButtonColors).sort()).toEqual(
    presets.map(({ name }) => String(name)).sort(),
  );
});

for (const [theme, colors] of Object.entries(brandButtonColors)) {
  for (const mode of ["light", "dark"] as const) {
    test(`${theme} ${mode} solid brand buttons keep approved colors in each interaction state`, async ({
      page,
    }) => {
      await page.goto(`/tests/?theme=${miaixzTheme.name}&colorMode=${mode}&density=standard`);
      const root = page.locator("html");
      if (theme !== miaixzTheme.name) {
        await page.locator(".miaixz-appearance-trigger").click();
        const drawer = page.locator(".miaixz-appearance-drawer");
        const themeOption = drawer.locator(".miaixz-appearance-option").filter({
          has: page.locator(`input[type="radio"][value="${theme}"]`),
        });
        await themeOption.click();
        await expect(root).toHaveAttribute("data-miaixz-theme", theme);
        await page.keyboard.press("Escape");
        await expect(drawer).toBeHidden();
      }
      await expect(root).toHaveAttribute("data-miaixz-theme", theme);
      await expect(root).toHaveAttribute("data-miaixz-color-mode", mode);
      const button = page.getByRole("button", { name: "默认按钮", exact: true });
      await expect(button).toHaveAttribute("data-variant", "solid");
      await expect(button).toHaveAttribute("data-tone", "brand");

      const expectColors = (token: string, hex: string) =>
        test.step(token, async () => {
          const channels = [1, 3, 5].map((offset) =>
            Number.parseInt(hex.slice(offset, offset + 2), 16),
          );
          const expected = `rgb(${channels.join(", ")})`;
          const themeColor = await button.evaluate((element, name) => {
            const sample = document.createElement("span");
            sample.style.color = `var(--miaixz-color-${name})`;
            element.append(sample);
            const color = getComputedStyle(sample).color;
            sample.remove();
            return color;
          }, token);
          expect(themeColor, `Approved theme token ${token}`).toBe(expected);
          await expect(button).toHaveCSS("color", "rgb(255, 255, 255)");
          await expect(button).toHaveCSS("background-color", expected);
          await expect(button).toHaveCSS("border-color", expected);
        });

      const [normal, hover, active] = colors[mode];
      await button.scrollIntoViewIfNeeded();
      await page.mouse.move(1, 1);
      await expectColors("brand", normal);
      await button.hover();
      await expectColors("brand-hover", hover);
      await page.mouse.down();
      try {
        await expectColors("brand-active", active);
      } finally {
        await page.mouse.up();
      }
    });
  }
}

test("appearance settings remain geometrically stable while density changes", async ({ page }) => {
  await page.goto(`/tests/?theme=${miaixzTheme.name}&colorMode=light&density=standard`);
  await page.locator(".miaixz-appearance-trigger").click();

  const root = page.locator("html");
  const drawer = page.locator(".miaixz-appearance-drawer");
  const body = drawer.locator(".miaixz-appearance-body");
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveAttribute("data-density", "standard");

  const measure = () =>
    body.evaluate((element) => {
      const optionElement = element.querySelector<HTMLElement>(".miaixz-appearance-option")!;
      const bodyRect = element.getBoundingClientRect();
      const optionRect = optionElement.getBoundingClientRect();
      const bodyStyles = getComputedStyle(element);
      const optionStyles = getComputedStyle(optionElement);
      return {
        bodyHeight: bodyRect.height,
        bodyWidth: bodyRect.width,
        gap: bodyStyles.gap,
        optionHeight: optionRect.height,
        optionPadding: optionStyles.padding,
        optionWidth: optionRect.width,
      };
    });

  const standardGeometry = await measure();
  for (const density of ["compact", "comfortable", "standard"] as const) {
    await drawer.locator(`input[type="radio"][value="${density}"]`).check({ force: true });
    await expect(root).toHaveAttribute("data-miaixz-density", density);
    await expect(drawer).toHaveAttribute("data-density", "standard");
    await expect.poll(measure).toEqual(standardGeometry);
  }
});

test("theme delegates pointer and keyboard ripple feedback to semantic actions", async ({
  page,
}) => {
  await page.goto(`/tests/?theme=${miaixzTheme.name}&colorMode=light&density=standard`);
  const button = page.getByRole("button", { name: "默认按钮" });

  const pointerFeedback = await button.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: rect.left + rect.width / 4,
        clientY: rect.top + rect.height / 2,
      }),
    );
    const layer = element.querySelector<HTMLElement>(".miaixz-interaction-ripple-layer");
    return {
      interactive: element.classList.contains("miaixz-interactive"),
      origin: layer?.dataset.origin,
      ripple: layer?.querySelector(".miaixz-interaction-ripple") !== null,
    };
  });
  expect(pointerFeedback).toEqual({ interactive: true, origin: "pointer", ripple: true });

  const keyboardFeedback = await button.evaluate((element) => {
    element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    return Array.from(
      element.querySelectorAll<HTMLElement>(".miaixz-interaction-ripple-layer"),
    ).some((layer) => layer.dataset.origin === "keyboard");
  });
  expect(keyboardFeedback).toBe(true);
});

test("a versioned custom theme inherits newly added compact typography defaults", async ({
  page,
}) => {
  await page.goto("/tests/?theme=legacy-custom&colorMode=dark&density=compact");
  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-miaixz-theme", "legacy-custom");
  await expect(root).toHaveAttribute("data-miaixz-color-mode", "dark");
  await expect(root).toHaveCSS("font-size", "15px");
  await expect(root).toHaveCSS("--miaixz-text-compact-body-size", "12px");
  await expect(page.getByRole("button", { name: "打开长内容抽屉" })).toBeVisible();
});

test("versioned non-color roles parse, resolve and serialize through one contract", () => {
  const definition = parseTheme({
    schemaVersion: VERSION,
    name: "legacy-non-color",
    label: "Legacy non-color",
    extends: miaixzTheme.name,
    tokens: {
      opacity: { navigationSelected: 0.42 },
      typography: { bodySize: 15 },
      geometry: { standard: { controlHeight: 42 } },
    },
    modes: { light: {}, dark: {} },
  });
  const resolved = resolveThemeDefinitions(
    new Map([
      [miaixzTheme.name, miaixzTheme],
      [definition.name, definition],
    ]),
  ).get(definition.name)!;
  const application = serializeThemeApplication(
    resolved,
    "light",
    "light",
    "standard",
    undefined,
    "theme_spec",
  );

  expect(resolved.tokens.typography.compactBodySize).toBe(12);
  expect(application.cssText).toContain("--miaixz-opacity-navigation-selected: 0.42;");
  expect(application.cssText).toContain("--miaixz-text-body-size: 15px;");
  expect(application.cssText).toContain("--miaixz-geometry-standard-control-height: 42px;");
  expect(application.cssText).toContain(
    "--miaixz-density-control-height: var(--miaixz-geometry-standard-control-height);",
  );

  const transformed = serializeThemeApplication(
    resolved,
    "light",
    "light",
    "standard",
    undefined,
    "theme_transformed",
    { shellLayout: "horizontal", radiusScale: 0.5, baseFontSize: 18 },
  );
  expect(transformed.shellLayout).toBe("horizontal");
  expect(transformed.radiusScale).toBe(0.5);
  expect(transformed.baseFontSize).toBe(18);
  expect(transformed.cssText).toContain("--miaixz-text-body-size: 18px;");
  expect(transformed.cssText).toContain("--miaixz-radius-control: 2px;");

  expect(() =>
    parseTheme({
      ...definition,
      tokens: { opacity: { navigationSelected: 2 } },
    }),
  ).toThrow(MiaixzThemeError);
});

for (const viewportWidth of [1440, 390]) {
  test(`drawer width presets and custom widths clamp at ${viewportWidth}px`, async ({ page }) => {
    await page.setViewportSize({ width: viewportWidth, height: 900 });
    await page.goto("/tests/?drawerWidth=350");
    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-miaixz-theme-instance", /.+/u);
    await expect(root).toHaveAttribute("data-miaixz-theme", miaixzTheme.name);
    await expect(root).toHaveAttribute("data-miaixz-color-mode", "light");
    await expect(root).toHaveAttribute("data-miaixz-density", "standard");
    await page.getByRole("button", { name: "打开长内容抽屉" }).click();
    const drawer = page.getByRole("dialog", { name: "外层抽屉" });
    const expectedPadding = (width: number): string => {
      if (viewportWidth <= 640) return "16px";
      if (width <= 480) return "24px 20px";
      if (width <= 600) return "24px";
      return "24px 32px";
    };
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveCSS("font-size", "14px");
    await expect(drawer.locator(".miaixz-drawer-body")).toHaveCSS("padding", expectedPadding(350));
    const footer = drawer.locator(".miaixz-drawer-footer");
    for (const width of [...DRAWER_WIDTHS, 435.5]) {
      await drawer.getByLabel("抽屉宽度").selectOption(String(width));
      const box = (await drawer.boundingBox())!;
      expect(box.width).toBeCloseTo(Math.min(width, viewportWidth), 0);
      expect(box.x + box.width).toBeCloseTo(viewportWidth, 0);
      expect(box.y).toBe(0);
      expect(box.height).toBe(900);
      await expect(drawer).toHaveCSS("font-size", "14px");
      await expect(drawer.locator(".miaixz-drawer-body")).toHaveCSS(
        "padding",
        expectedPadding(width),
      );
      const footerBox = (await footer.boundingBox())!;
      expect(footerBox.y + footerBox.height).toBeCloseTo(900, 0);
    }
    await page.setViewportSize({ width: 320, height: 700 });
    await expect.poll(async () => (await drawer.boundingBox())!.width).toBe(320);
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(page.getByRole("button", { name: "打开长内容抽屉" })).toBeFocused();
  });
}
