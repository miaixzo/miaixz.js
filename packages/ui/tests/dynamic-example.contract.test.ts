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
 * Freezes the official dynamic UI component workbench.
 */

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const testRoot = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(testRoot, "..");
const repositoryRoot = resolve(packageRoot, "../..");
const exampleRoot = resolve(repositoryRoot, "examples");
const release = (await readFile(resolve(repositoryRoot, "VERSION"), "utf8")).trim();

describe("UI dynamic example", () => {
  it("runs as a private Next application against local Miaixz packages", async () => {
    const manifest = JSON.parse(await readFile(resolve(exampleRoot, "package.json"), "utf8"));
    expect(manifest.private).toBe(true);
    expect(manifest.version).toBe(release);
    expect(manifest.scripts).toMatchObject({
      build: "next build",
      dev: "next dev -p 3000",
      start: "next start -p 3000",
    });
    for (const packageName of ["icons", "sdk", "ui", "view"]) {
      expect(manifest.dependencies[`@miaixz/${packageName}`]).toBe(
        `file:../packages/${packageName}`,
      );
    }
  });

  it("covers the runtime studio and every major component family", async () => {
    const [workbench, catalog] = await Promise.all([
      readFile(resolve(exampleRoot, "src/module/ui/ui-workbench.tsx"), "utf8"),
      readFile(resolve(exampleRoot, "src/module/ui/catalog.jsx"), "utf8"),
    ]);
    for (const token of [
      "Appearance",
      "MiaixzLocaleProvider",
      "Theme",
      "Stage",
      "StageLoading",
      "MiaixzErrorBoundary",
      "CompleteCatalog",
      "UI_COMPONENT_NAMES",
      "NumberInput",
      "RadioGroup",
      "Pagination",
      "Sparkline",
      "Donut",
      "Dialog",
      "Drawer",
    ]) {
      expect(`${workbench}\n${catalog}`).toContain(token);
    }
  });

  it("registers every public React component and provider", async () => {
    const [catalog, publicIndex] = await Promise.all([
      readFile(resolve(exampleRoot, "src/module/ui/catalog.jsx"), "utf8"),
      readFile(resolve(packageRoot, "src/index.ts"), "utf8"),
    ]);
    const catalogBlock = catalog.match(/UI_COMPONENT_NAMES = Object\.freeze\(\[([\s\S]*?)\]\);/u);
    const componentBlock = publicIndex.match(
      /export \{([\s\S]*?)\} from "\.\/components\/index\.js";/u,
    );
    expect(catalogBlock).not.toBeNull();
    expect(componentBlock).not.toBeNull();
    const catalogNames = [...catalogBlock![1]!.matchAll(/"([A-Z][A-Za-z]+)"/gu)].map(
      (match) => match[1],
    );
    const publicComponents = componentBlock![1]!
      .split(",")
      .map((name) => name.trim())
      .filter((name) => /^[A-Z][A-Za-z]+$/u.test(name));
    const expectedNames = [
      ...publicComponents,
      "Appearance",
      "MiaixzDocumentLocale",
      "MiaixzLinkProvider",
      "MiaixzLocaleProvider",
      "MiaixzErrorBoundary",
      "Theme",
    ].sort();
    expect(catalogNames).toHaveLength(124);
    expect([...new Set(catalogNames)].sort()).toEqual(expectedNames);
  });
});
