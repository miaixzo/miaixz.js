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
 * Audits the G0 Node, font-tool, browser, package, and CI activation contract.
 */

import { readdir, readFile, mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "../..");
const repositoryTools = await import(
  pathToFileURL(resolve(repositoryRoot, ".github/scripts/miaixz.mjs")).href
);
const workspaceRepository = repositoryTools.loadWorkspaceRepository(repositoryRoot);
const iconWorkspace = repositoryTools.requireWorkspace("@miaixz/icons", workspaceRepository);
const uiWorkspace = repositoryTools.requireWorkspace("@miaixz/ui", workspaceRepository);
const release = (await readFile(resolve(repositoryRoot, "VERSION"), "utf8")).trim();
const fontScriptRoot = resolve(repositoryRoot, ".github/scripts/modules/icons/fonts");

/**
 * Recursively locates repository-owned Python files.
 *
 * @param directory - Directory to inspect.
 * @returns Repository-relative Python paths.
 */
async function findPythonFiles(directory: string): Promise<string[]> {
  const results: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "coverage", "dist", "node_modules"].includes(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) results.push(...(await findPythonFiles(path)));
    else if (entry.name.endsWith(".py")) results.push(relative(repositoryRoot, path));
  }
  return results.sort();
}

describe("G0 toolchain activation", () => {
  it("allows only the complete icons/source.mjs path and rejects another source.mjs", async () => {
    const directory = await mkdtemp(resolve(tmpdir(), "miaixz-script-names-"));
    try {
      const checker = await readFile(
        resolve(repositoryRoot, ".github/scripts/quality/check-script-names.mjs"),
        "utf8",
      );
      const isolated = checker.replace(
        'import { repositoryRoot } from "../miaixz.mjs";',
        "const repositoryRoot = " + JSON.stringify(directory) + ";",
      );
      expect(isolated).not.toBe(checker);
      for (const name of ["modules/icons", "modules/other", "package", "quality", "release"])
        await mkdir(resolve(directory, ".github/scripts", name), { recursive: true });
      const script = resolve(directory, "check.mjs");
      await writeFile(script, isolated);
      await writeFile(resolve(directory, ".github/scripts/modules/icons/source.mjs"), "");
      expect(execFileSync(process.execPath, [script], { encoding: "utf8" })).toContain(
        "Automation filenames",
      );
      await writeFile(resolve(directory, ".github/scripts/modules/other/source.mjs"), "");
      expect(() =>
        execFileSync(process.execPath, [script], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        }),
      ).toThrow(/other\/source\.mjs/u);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
  it("keeps the font orchestrator Node-only and exact", async () => {
    const entries = (await readdir(fontScriptRoot))
      .filter((entry) => !entry.startsWith("."))
      .sort();
    expect(entries).toEqual([
      "build-icon-font.mjs",
      "font-geometry.mjs",
      "font-toolchain.lock.txt",
      "interpolate-icon-source.mjs",
      "read-font-source.mjs",
      "validate-icon-font.mjs",
    ]);
    expect(await findPythonFiles(repositoryRoot)).toEqual([]);
  });

  it("pins the complete third-party font environment", async () => {
    const workflow = await readFile(
      resolve(repositoryRoot, ".github/workflows/build-project.yml"),
      "utf8",
    );
    for (const declaration of [
      'PYTHON_VERSION: "3.13.18"',
      'FONTMAKE_VERSION: "3.12.1"',
      'FONTTOOLS_VERSION: "4.66.0"',
      'UFO2FT_VERSION: "3.9.0"',
      'FONTBAKERY_VERSION: "1.1.0"',
    ]) {
      expect(workflow).toContain(declaration);
    }
    const requirements = await readFile(
      resolve(repositoryRoot, ".github/scripts/modules/icons/fonts/font-toolchain.lock.txt"),
      "utf8",
    );
    for (const requirement of [
      "brotli==1.2.0",
      "fontmake==3.12.1",
      "fonttools==4.66.0",
      "ufo2ft==3.9.0",
      "fontbakery==1.1.0",
    ]) {
      expect(requirements).toContain(requirement);
    }
    expect(requirements).toMatch(/--hash=sha256:[0-9a-f]{64}/u);
  });

  it("registers one version-locked, self-owned icon workspace", async () => {
    const rootManifest = JSON.parse(
      await readFile(resolve(repositoryRoot, "package.json"), "utf8"),
    ) as { readonly workspaces: readonly string[] };
    expect(rootManifest.workspaces).toContain(iconWorkspace.directory);
    expect(rootManifest.workspaces.filter((entry) => entry.includes("icons"))).toEqual([
      iconWorkspace.directory,
    ]);
    const manifest = JSON.parse(await readFile(iconWorkspace.manifestPath, "utf8")) as {
      readonly name: string;
      readonly version: string;
    };
    expect(manifest).toMatchObject({ name: "@miaixz/icons", version: release });
  });

  it("keeps the deep visual audit manual while browser contracts remain automatic", async () => {
    const deepAuditWorkflow = await readFile(
      resolve(repositoryRoot, ".github/workflows/icon-visual.yml"),
      "utf8",
    );
    const buildWorkflow = await readFile(
      resolve(repositoryRoot, ".github/workflows/build-project.yml"),
      "utf8",
    );
    expect(deepAuditWorkflow).toMatch(/workflow_dispatch/u);
    expect(deepAuditWorkflow).not.toMatch(/(?:^|\n)\s+(?:push|pull_request):/u);
    expect(deepAuditWorkflow).not.toMatch(/contents:\s*write/u);
    expect(deepAuditWorkflow).not.toMatch(/git\s+(?:commit|push|tag)/u);
    expect(deepAuditWorkflow).not.toContain("upload-artifact");
    expect(deepAuditWorkflow).not.toContain("icons:release:evidence");
    expect(deepAuditWorkflow).not.toContain("--mode compare");
    expect(buildWorkflow).toContain("Browser Contracts (${{ matrix.browser }})");
    expect(buildWorkflow).toContain(
      'npm exec --workspace @miaixz/icons -- playwright test --project="$BROWSER"',
    );
  });

  it("does not persist unit execution results or coverage reports", async () => {
    const configuration = await readFile(
      resolve(iconWorkspace.rootPath, "vitest.config.ts"),
      "utf8",
    );
    expect(configuration).toMatch(/cache:\s*false/u);
    expect(configuration).toMatch(/fileParallelism:\s*false/u);
    expect(configuration).toMatch(/reporter:\s*\["text"\]/u);
  });

  it("keeps Playwright output outside the mirrored tests directory", async () => {
    for (const configuration of [
      resolve(iconWorkspace.rootPath, "playwright.config.ts"),
      resolve(uiWorkspace.rootPath, "playwright.config.ts"),
    ]) {
      const source = await readFile(configuration, "utf8");
      expect(source).toContain("mkdtempSync");
      expect(source).toContain("tmpdir()");
      expect(source).not.toContain("tests/.artifacts");
      expect(source).not.toMatch(/outputDir[^\n]*test-results/u);
    }
  });
});
