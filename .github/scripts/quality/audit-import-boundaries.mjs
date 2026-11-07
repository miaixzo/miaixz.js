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
 * Audits source imports against the workspace dependency boundaries.
 */

import { parse } from "@babel/parser";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadWorkspaceRepository, repositoryRoot } from "../miaixz.mjs";

const workspaceRepository = loadWorkspaceRepository(repositoryRoot);
const sourceRoots = workspaceRepository.workspaces
  .map(({ rootPath }) => path.join(rootPath, "src"))
  .filter(existsSync);
const sourceRootByPackageName = new Map(
  workspaceRepository.workspaces.map(({ name, rootPath }) => [name, path.join(rootPath, "src")]),
);
const workspaceBySourceRoot = new Map(
  workspaceRepository.workspaces.map((workspace) => [
    path.join(workspace.rootPath, "src"),
    workspace,
  ]),
);
const internalPackageNames = new Set(workspaceRepository.workspaces.map(({ name }) => name));
const sdkSourceRoot = requireSourceRoot("@miaixz/sdk");
const uiSourceRoot = requireSourceRoot("@miaixz/ui");
const viewSourceRoot = requireSourceRoot("@miaixz/view");
const violations = [];
const componentRanks = new Map(
  Object.entries({
    0: "badge bar brand breadcrumb checkbox cluster columns descriptions divider donut empty entry exception field file grid header icon input link list masonry page panel popover pressable progress radio scroll sections sidebar skeleton slider sparkline spinner split stack status steps switch table tabs textarea timeline toolbar tooltip transfer",
    1: "button combobox dialog disclosure dropdown dropzone editor heatmap metrics pagination rating segmented select tag",
    2: "action avatar date navigation overlay shell tree",
    3: "datagrid graph search toast view feedback drawer",
    4: "alert locale notice toaster picker",
    5: "stage confirm",
    6: "upload",
  }).flatMap(([rank, names]) => names.split(" ").map((name) => [name, Number(rank)])),
);

/**
 * Returns the required source root for a named workspace package.
 *
 * @param {string} packageName Workspace package name.
 * @returns {string} Absolute source directory for the package.
 * @throws {Error} If the package is unknown or its source directory is missing.
 */
function requireSourceRoot(packageName) {
  const sourceRoot = sourceRootByPackageName.get(packageName);
  if (sourceRoot === undefined || !existsSync(sourceRoot)) {
    throw new Error(`${packageName} must provide a source directory for boundary enforcement.`);
  }
  return sourceRoot;
}

/**
 * Returns every TypeScript source below a directory in stable order.
 *
 * @param {string} directory Absolute directory to traverse.
 * @returns {string[]} Absolute TypeScript source paths.
 */
function listSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return listSourceFiles(target);
      return /\.(?:ts|tsx)$/.test(entry.name) ? [target] : [];
    })
    .sort();
}

/**
 * Resolves the repository's NodeNext-style relative `.js` source imports.
 *
 * @param {string} specifier Import specifier found in source.
 * @param {string} importer Absolute path to the importing source file.
 * @returns {string | undefined} Resolved TypeScript source path when one exists.
 */
function resolveSourceImport(specifier, importer) {
  if (!specifier.startsWith(".") || !specifier.endsWith(".js")) return undefined;
  const target = path.resolve(path.dirname(importer), specifier.slice(0, -3));
  return [`${target}.ts`, `${target}.tsx`, `${target}.d.ts`].find(existsSync);
}

/**
 * Returns all static relative import and re-export edges in one source file.
 *
 * @param {string} file Absolute source path to parse.
 * @returns {Array<{ specifier: string, target: string | undefined, typeOnly: boolean }>} Static module dependency edges.
 */
function readEdges(file) {
  const program = parse(readFileSync(file, "utf8"), {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  }).program;
  const edges = [];
  for (const statement of program.body) {
    if (
      statement.type !== "ImportDeclaration" &&
      statement.type !== "ExportNamedDeclaration" &&
      statement.type !== "ExportAllDeclaration"
    ) {
      continue;
    }
    const specifier = statement.source?.value;
    if (typeof specifier !== "string") continue;
    const target = resolveSourceImport(specifier, file);
    const typeOnly =
      statement.importKind === "type" ||
      statement.exportKind === "type" ||
      (statement.type === "ImportDeclaration" &&
        statement.specifiers.length > 0 &&
        statement.specifiers.every(
          (importSpecifier) =>
            importSpecifier.type === "ImportSpecifier" && importSpecifier.importKind === "type",
        ));
    edges.push({ specifier, target, typeOnly });
  }
  return edges;
}

/**
 * Produces a stable repository-relative path for diagnostics.
 *
 * @param {string} file Absolute repository file path.
 * @returns {string} Portable repository-relative path.
 */
function relative(file) {
  return path.relative(repositoryRoot, file).replaceAll(path.sep, "/");
}

/**
 * Classifies one UI source according to the sole D0/D1/C0-C6/P0 table.
 *
 * @param {string} file Absolute UI source path.
 * @returns {{ kind: string, component?: string, rank?: number }} Layer classification.
 */
function classifyUi(file) {
  const source = path.relative(uiSourceRoot, file).replaceAll(path.sep, "/");
  if (
    source === "version.ts" ||
    source === "components/shared.types.ts" ||
    source === "shared/class-names.ts" ||
    source.startsWith("design/") ||
    source.startsWith("errors/") ||
    (source.startsWith("icons/") && source !== "icons/index.ts")
  ) {
    return { kind: "D0" };
  }
  if (
    source.startsWith("accessibility/") ||
    source.startsWith("components/hidden/") ||
    source.startsWith("i18n/") ||
    source.startsWith("theme/") ||
    source.startsWith("shared/")
  ) {
    return { kind: "D1" };
  }
  if (source.startsWith("appearance/") || source.startsWith("intents/")) {
    return { kind: "P0" };
  }
  if (source.startsWith("components/diagram/graph/")) {
    return { kind: "component", component: "graph", rank: 3 };
  }
  if (source.startsWith("components/")) {
    const component = source.split("/")[1];
    if (component === "index.ts") return { kind: "entry" };
    const rank = componentRanks.get(component);
    return rank === undefined
      ? { kind: "unclassified", component }
      : { kind: "component", component, rank };
  }
  if (source === "index.ts" || source === "design/index.ts" || source === "icons/index.ts") {
    return { kind: "entry" };
  }
  return { kind: "unclassified", component: source.split("/")[0] };
}

/**
 * Records package and UI layer violations for a single dependency edge.
 *
 * @param {string} source Absolute importing source path.
 * @param {{ specifier: string, target: string | undefined, typeOnly: boolean }} edge Dependency edge to audit.
 * @returns {void}
 */
function auditEdge(source, edge) {
  if (edge.target === undefined) {
    const sourceWorkspace = [...workspaceBySourceRoot].find(([sourceRoot]) =>
      source.startsWith(sourceRoot),
    )?.[1];
    const importedWorkspaceName = [...internalPackageNames].find(
      (name) => edge.specifier === name || edge.specifier.startsWith(`${name}/`),
    );
    if (sourceWorkspace !== undefined && importedWorkspaceName !== undefined) {
      const allowed = new Set(
        ["dependencies", "optionalDependencies", "peerDependencies"].flatMap((field) =>
          Object.keys(sourceWorkspace.manifest[field] ?? {}),
        ),
      );
      if (!allowed.has(importedWorkspaceName)) {
        violations.push(
          `${relative(source)} imports undeclared workspace dependency ${edge.specifier}`,
        );
      }
    }
    if (source.startsWith(sdkSourceRoot) && /^react(?:-dom)?(?:\/|$)/.test(edge.specifier)) {
      violations.push(`${relative(source)} imports forbidden SDK dependency ${edge.specifier}`);
    }
    return;
  }
  const themeRoot = path.join(uiSourceRoot, "theme");
  const presetRoot = path.join(themeRoot, "presets");
  const presetFacade = path.join(presetRoot, "index.ts");
  const presetFacadeImport =
    edge.target === presetFacade && source.startsWith(themeRoot) && !source.startsWith(presetRoot);
  if (
    path.basename(source) !== "index.ts" &&
    path.basename(edge.target) === "index.ts" &&
    !presetFacadeImport
  ) {
    violations.push(`${relative(source)} imports internal barrel ${relative(edge.target)}`);
  }
  if (source.startsWith(viewSourceRoot) && !edge.target.startsWith(viewSourceRoot)) {
    violations.push(
      `${relative(source)} reaches outside the preview package through a relative import`,
    );
  }
  if (!source.startsWith(uiSourceRoot) || !edge.target.startsWith(uiSourceRoot)) return;
  const from = classifyUi(source);
  const to = classifyUi(edge.target);
  if (from.kind === "unclassified") return;
  if (to.kind === "unclassified") {
    violations.push(`${relative(edge.target)} belongs to unclassified UI source ${to.component}`);
    return;
  }
  if (from.kind === "D0" && to.kind !== "D0" && to.kind !== "entry") {
    violations.push(
      `${relative(source)} (${from.kind}) cannot depend on ${relative(edge.target)} (${to.kind})`,
    );
  }
  if (from.kind === "D1" && to.kind === "component") {
    const componentTypeLeaf = /\/components\/(?:diagram\/graph|[^/]+)\/[^/]+\.types\.ts$/.test(
      edge.target.replaceAll(path.sep, "/"),
    );
    if (
      source !== path.join(uiSourceRoot, "theme/registry.ts") ||
      !edge.typeOnly ||
      !componentTypeLeaf
    ) {
      violations.push(`${relative(source)} (D1) cannot depend on ${relative(edge.target)}`);
    }
  }
  if (from.kind === "D1" && to.kind === "P0") {
    const allowed =
      source === path.join(uiSourceRoot, "theme/registry.ts") &&
      edge.target === path.join(uiSourceRoot, "appearance/appearance.types.ts") &&
      edge.typeOnly;
    if (!allowed) {
      violations.push(
        `${relative(source)} (D1) cannot depend on P0 source ${relative(edge.target)}`,
      );
    }
  }
  if (from.kind === "component" && to.kind === "P0") {
    violations.push(
      `${relative(source)} cannot depend upward on P0 source ${relative(edge.target)}`,
    );
  }
  if (
    from.kind === "component" &&
    to.kind === "component" &&
    from.component !== to.component &&
    to.rank >= from.rank
  ) {
    violations.push(
      `${relative(source)} (C${from.rank}) cannot depend on ${relative(edge.target)} (C${to.rank})`,
    );
  }
}

/**
 * Enforces the single server-safe owner for React layout effects.
 *
 * @param {string} source Absolute source path to inspect.
 * @returns {void}
 */
function auditLayoutEffectOwnership(source) {
  if (!source.startsWith(uiSourceRoot)) return;
  const sourcePath = relative(source);
  const contents = readFileSync(source, "utf8");
  const ownerSource = path.join(uiSourceRoot, "shared/use-client-layout-effect.ts");
  const ownerPath = relative(ownerSource);
  const importsReactLayoutEffect =
    /import\s*\{[^}]*\buseLayoutEffect\b[^}]*\}\s*from\s*["']react["']/su.test(contents);
  const definesParallelLayoutEffect =
    /typeof\s+document\s*===\s*["']undefined["']\s*\?\s*useEffect\s*:\s*useLayoutEffect/su.test(
      contents,
    );

  if (source === ownerSource) {
    if (!importsReactLayoutEffect || !definesParallelLayoutEffect) {
      violations.push(`${ownerPath} must own the server-safe React layout effect definition`);
    }
    return;
  }
  if (importsReactLayoutEffect) {
    violations.push(`${sourcePath} imports React useLayoutEffect outside ${ownerPath}`);
  }
  if (definesParallelLayoutEffect) {
    violations.push(`${sourcePath} defines a parallel client layout effect outside ${ownerPath}`);
  }
}

/**
 * Returns strongly connected components containing more than one file.
 *
 * @param {Map<string, Set<string>>} graph Directed source dependency graph.
 * @returns {string[][]} Stable lists of source files participating in cycles.
 */
function findCycles(graph) {
  let nextIndex = 0;
  const indices = new Map();
  const lowLinks = new Map();
  const stack = [];
  const stacked = new Set();
  const cycles = [];

  /**
   * Visits one graph node using Tarjan's strongly connected component algorithm.
   *
   * @param {string} node Absolute source path represented by the graph node.
   * @returns {void}
   */
  function visit(node) {
    indices.set(node, nextIndex);
    lowLinks.set(node, nextIndex);
    nextIndex += 1;
    stack.push(node);
    stacked.add(node);
    for (const target of graph.get(node) ?? []) {
      if (!indices.has(target)) {
        visit(target);
        lowLinks.set(node, Math.min(lowLinks.get(node), lowLinks.get(target)));
      } else if (stacked.has(target)) {
        lowLinks.set(node, Math.min(lowLinks.get(node), indices.get(target)));
      }
    }
    if (lowLinks.get(node) !== indices.get(node)) return;
    const component = [];
    let current;
    do {
      current = stack.pop();
      stacked.delete(current);
      component.push(current);
    } while (current !== node);
    if (component.length > 1) cycles.push(component.sort());
  }
  for (const node of [...graph.keys()].sort()) if (!indices.has(node)) visit(node);
  return cycles;
}

const sourceFiles = sourceRoots.flatMap(listSourceFiles);
const graph = new Map(sourceFiles.map((file) => [file, new Set()]));
for (const source of sourceFiles) {
  auditLayoutEffectOwnership(source);
  const classification = source.startsWith(uiSourceRoot) ? classifyUi(source) : undefined;
  if (classification?.kind === "unclassified") {
    violations.push(
      `${relative(source)} belongs to unclassified UI source ${classification.component}`,
    );
  }
  for (const edge of readEdges(source)) {
    auditEdge(source, edge);
    if (edge.target !== undefined && graph.has(edge.target)) graph.get(source).add(edge.target);
  }
}
for (const cycle of findCycles(graph)) {
  violations.push(`dependency cycle: ${cycle.map(relative).join(" -> ")}`);
}
if (violations.length > 0) {
  console.error(violations.map((violation) => `- ${violation}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Import boundaries verified across ${sourceFiles.length} source files.`);
}
