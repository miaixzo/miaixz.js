/**
 * Verifies appearance normalization, persistence, migration, and change events.
 */

import assert from "node:assert/strict";
import { test } from "vitest";

import {
  createMiaixzAppearanceManager,
  isMiaixzAppearanceSettings,
  miaixzDefaultAppearance,
  migrateMiaixzAppearanceV1,
  parseMiaixzAppearanceSettings,
} from "../../src/display/index.js";

/**
 * Creates an isolated in-memory storage implementation for appearance tests.
 *
 * @returns Storage adapter together with its observable backing map.
 */
function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    storage: {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    },
  };
}

test("default appearance is a frozen schema v2 snapshot", () => {
  assert.deepEqual(miaixzDefaultAppearance, {
    theme: "miaixz",
    colorMode: "system",
    density: "standard",
  });
  assert.equal(Object.isFrozen(miaixzDefaultAppearance), true);
});

test("appearance parsing validates and normalizes theme overrides", () => {
  const appearance = parseMiaixzAppearanceSettings({
    theme: "neutral",
    colorMode: "dark",
    density: "comfortable",
    shellLayout: "hybrid-dual",
    radiusScale: 1.5,
    baseFontSize: 16,
    overrides: { dark: { brand: "#abcdef" } },
  });

  assert.equal(appearance.overrides?.dark?.brand, "#ABCDEF");
  assert.equal(appearance.shellLayout, "hybrid-dual");
  assert.equal(appearance.radiusScale, 1.5);
  assert.equal(appearance.baseFontSize, 16);
  assert.equal(Object.isFrozen(appearance), true);
  assert.equal(Object.isFrozen(appearance.overrides?.dark), true);
  assert.equal(isMiaixzAppearanceSettings(appearance), true);
  assert.equal(
    isMiaixzAppearanceSettings({
      theme: "Neutral",
      colorMode: "dark",
      density: "comfortable",
    }),
    false,
  );
  assert.equal(
    isMiaixzAppearanceSettings({
      theme: "neutral",
      colorMode: "dark",
      density: "comfortable",
      shellLayout: "diagonal",
    }),
    false,
  );
});

test("appearance manager persists and clears shell, radius, and typography preferences", () => {
  const { storage } = createMemoryStorage();
  const appearance = createMiaixzAppearanceManager({ appId: "portal", storage });

  appearance.setShellLayout("horizontal");
  appearance.setRadiusScale(0.75);
  appearance.setBaseFontSize(12);
  appearance.setOverrides({ light: { brand: "#123456" } });
  appearance.setOverrides(undefined);

  assert.deepEqual(appearance.getSnapshot(), {
    theme: "miaixz",
    colorMode: "system",
    density: "standard",
    shellLayout: "horizontal",
    radiusScale: 0.75,
    baseFontSize: 12,
  });

  const restored = createMiaixzAppearanceManager({ appId: "portal", storage });
  assert.equal(restored.getSnapshot().radiusScale, 0.75);
  assert.equal(restored.getSnapshot().baseFontSize, 12);
  restored.destroy();

  appearance.setShellLayout(undefined);
  appearance.setRadiusScale(undefined);
  appearance.setBaseFontSize(undefined);
  assert.deepEqual(appearance.getSnapshot(), miaixzDefaultAppearance);
  appearance.destroy();
});

test("appearance v1 migration preserves mode, density, and colors", () => {
  const appearance = migrateMiaixzAppearanceV1({
    colorMode: "system",
    density: "compact",
    colors: { brand: "#123456" },
  });

  assert.deepEqual(appearance, {
    theme: "miaixz",
    colorMode: "system",
    density: "compact",
    overrides: {
      light: { brand: "#123456" },
      dark: { brand: "#123456" },
    },
  });
  assert.equal(Object.isFrozen(appearance.overrides?.light), true);
  assert.equal(Object.isFrozen(appearance.overrides?.dark), true);
});

test("global Appearance persists across an explicit global scope reload", () => {
  const { storage, values } = createMemoryStorage();
  const appearance = createMiaixzAppearanceManager({ appId: "portal", storage });

  appearance.set({
    theme: "neutral",
    colorMode: "dark",
    density: "comfortable",
  });
  appearance.setScope(undefined);
  assert.deepEqual(appearance.getSnapshot(), {
    theme: "neutral",
    colorMode: "dark",
    density: "comfortable",
  });
  assert.deepEqual(
    [...values.keys()].filter((key) => key.endsWith(":appearance")),
    ["miaixz:global:portal:appearance"],
  );
  appearance.destroy();
});

test("tenant Appearance changes only when its owner explicitly selects a scope", () => {
  const { storage, values } = createMemoryStorage();
  const appearance = createMiaixzAppearanceManager({
    appId: "portal",
    tenantId: "tenant-a",
    storage,
  });

  appearance.setTheme("neutral");
  appearance.setScope("tenant-b");
  assert.deepEqual(appearance.getSnapshot(), miaixzDefaultAppearance);
  assert.deepEqual(
    [...values.keys()].filter((key) => key.endsWith(":appearance")),
    ["miaixz:tenant-a:portal:appearance"],
  );
  appearance.setScope("tenant-a");
  assert.equal(appearance.getSnapshot().theme, "neutral");
  appearance.destroy();
});

test("invalid storage scope leaves Appearance and persisted keys unchanged", () => {
  const { storage, values } = createMemoryStorage();
  const appearance = createMiaixzAppearanceManager({ appId: "portal", storage });
  appearance.setTheme("neutral");
  const snapshot = appearance.getSnapshot();
  const persisted = [...values.entries()];

  assert.throws(
    () => appearance.setScope("../invalid"),
    (error: unknown) =>
      (error as { readonly code?: string } | undefined)?.code === "STORAGE_SCOPE_INVALID",
  );
  assert.equal(appearance.getSnapshot(), snapshot);
  assert.deepEqual([...values.entries()], persisted);
  appearance.destroy();
});
