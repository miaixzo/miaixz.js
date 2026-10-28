/**
 * Verifies brand contrast behavior in the UI package.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { miaixzBuiltInThemes } from "../../../src/theme/catalog.js";

/**
 * Calculates relative luminance for a six-digit hexadecimal color.
 *
 * @param hex - Hexadecimal color value.
 * @returns Relative luminance from zero to one.
 */
function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => {
      const value = Number.parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}

/**
 * Calculates the WCAG contrast ratio for two hexadecimal colors.
 *
 * @param foreground - Foreground color.
 * @param background - Background color.
 * @returns Contrast ratio with the lighter color first.
 */
function contrast(foreground: string, background: string) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

/**
 * Extracts one component rule from its public stylesheet.
 *
 * @param file - Component stylesheet basename.
 * @param selector - Exact selector prefix.
 * @returns Complete rule block.
 */
function rule(file: string, selector: string) {
  const css = readFileSync(resolve(process.cwd(), "src/styles/components", `${file}.css`), "utf8");
  const start = css.indexOf(selector);
  expect(start).toBeGreaterThanOrEqual(0);
  return css.slice(css.indexOf("{", start), css.indexOf("}", start) + 1);
}

describe("brand foreground semantics", () => {
  for (const theme of miaixzBuiltInThemes) {
    for (const mode of ["light", "dark"] as const) {
      it(`${theme.name} ${mode} keeps brand text readable across interactive surfaces`, () => {
        const colors = theme.modes[mode].colors;
        for (const background of ["brand", "brand-hover", "brand-active"] as const) {
          expect(contrast(colors["on-brand"], colors[background])).toBeGreaterThanOrEqual(4.5);
        }
        for (const background of [
          "background",
          "surface",
          "surface-secondary",
          "surface-chrome",
          "surface-hover",
          "surface-active",
          "surface-selected",
          "brand-soft",
          "brand-soft-hover",
        ] as const) {
          expect(contrast(colors["brand-strong"], colors[background])).toBeGreaterThanOrEqual(4.5);
        }
      });
    }
  }

  it("uses semantic foregrounds without changing branded backgrounds or indicators", () => {
    expect(rule("button", '.miaixz-button[data-variant="plain"][data-tone="brand"] {')).toContain(
      "color: var(--miaixz-color-brand-strong);",
    );
    const navigation = rule(
      "tabs",
      '.miaixz-tab:is([aria-selected="true"], [aria-current], [aria-pressed="true"]) {',
    );
    expect(navigation).toContain("color: var(--miaixz-color-brand);");
    expect(navigation).toContain("0 var(--miaixz-color-brand);");
    expect(rule("button", '.miaixz-button[data-variant="solid"][data-tone="brand"] {')).toContain(
      "color: var(--miaixz-color-text-inverse);",
    );
    expect(rule("button", '.miaixz-button[data-variant="solid"][data-tone="brand"] {')).toContain(
      "background: var(--miaixz-color-brand);",
    );
    expect(rule("appearance", ".miaixz-appearance-trigger {")).toContain(
      "color: var(--miaixz-color-text-inverse);",
    );
  });
});
