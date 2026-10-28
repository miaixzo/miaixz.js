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
 * Validates release metadata before package publication.
 */

import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { generateProjectVersions } from "./generate-project-version.mjs";

import {
  getWorkspacePeerRange,
  loadVersionedPackageManifests,
  loadWorkspaceRepository,
  readRepositoryVersion,
} from "../miaixz.mjs";

if (process.argv.length !== 2) {
  throw new Error("check-release-metadata.mjs accepts no version argument; it reads VERSION.");
}
const repository = loadWorkspaceRepository();
const version = readRepositoryVersion(repository.root);
generateProjectVersions(true, repository.root);

/**
 * Rejects independently maintained project version literals in runtime source and configuration.
 *
 * @param directory - Workspace source directory to inspect recursively.
 * @param packageName - Workspace package identity.
 */
function checkSourceVersions(directory, packageName) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      checkSourceVersions(path, packageName);
      continue;
    }
    if (entry.name === "version.ts" || !/\.(?:tsx?|json)$/u.test(entry.name)) continue;
    const source = readFileSync(path, "utf8");
    const repositoryPath = path.replaceAll("\\", "/");
    const removedMetadataVersion =
      (packageName === "@miaixz/ui" && repositoryPath.includes("/theme/")) ||
      (packageName === "@miaixz/sdk" && repositoryPath.endsWith("/i18n/locale-catalog.ts"));
    if (
      removedMetadataVersion &&
      (/\breadonly\s+version\s*:/u.test(source) ||
        /\bversion\s*:/u.test(source) ||
        /\b(?:child|definition|locale|record|theme)\.version\b/u.test(source))
    ) {
      throw new Error(`${path} must use schemaVersion without a duplicate version field.`);
    }
    if (entry.name.endsWith(".json")) {
      const value = JSON.parse(source);
      if (Object.keys(value).some((key) => /version/iu.test(key))) {
        throw new Error(`${path} must not maintain project versions in configuration JSON.`);
      }
    } else if (
      /\b(?:schemaVersion|layoutVersion|protocolVersion)\s*:\s*(?:\d+|["']\d)/u.test(source) ||
      /\b(?:MIAIXZ_MODULE_PROTOCOL_VERSION|WORKER_PROTOCOL_VERSION|CONTEXT_SCHEMA_VERSION|miaixzAppearanceSchemaVersion)\s*=\s*(?:\d+|["']\d)/u.test(
        source,
      ) ||
      ((path.includes("/theme/") || path.endsWith("/locale-catalog.ts")) &&
        /\bversion\s*:\s*["']\d/u.test(source))
    ) {
      throw new Error(`${path} contains an independent project version; reference VERSION.`);
    }
  }
}
for (const { name, rootPath } of repository.workspaces) {
  checkSourceVersions(resolve(rootPath, "src"), name);
}
for (const path of [
  resolve(repository.root, ".github/scripts/modules/ui/codegen/generate-theme-presets.mjs"),
  resolve(repository.root, ".github/scripts/modules/ui/codegen/vite-theme-plugin.mjs"),
]) {
  const source = readFileSync(path, "utf8");
  if (/\bversion\s*:/u.test(source) || /\b(?:record|theme)\.version\b/u.test(source)) {
    throw new Error(`${path} must not generate duplicate theme version metadata.`);
  }
}
const manifests = loadVersionedPackageManifests(repository.root);
const versionedManifestPaths = new Set(manifests.map(({ manifestPath }) => manifestPath));
const canonicalRepositoryUrl = "https://github.com/miaixzo/miaixz.js";

/**
 * Normalizes an npm repository declaration for provenance comparison.
 *
 * @param {unknown} repositoryField - package.json repository declaration.
 * @returns {string} Comparable HTTPS repository URL.
 */
function normalizeRepositoryUrl(repositoryField) {
  const url =
    typeof repositoryField === "string"
      ? repositoryField
      : typeof repositoryField?.url === "string"
        ? repositoryField.url
        : "";
  return url.replace(/^git\+/u, "").replace(/\.git$/u, "");
}

if (repository.rootManifest.name !== "miaixz.js") {
  throw new Error("The root package must be named 'miaixz.js'.");
}
for (const { manifest, path } of [
  { manifest: repository.rootManifest, path: "package.json" },
  ...repository.publicWorkspaces.map(({ directory, manifest }) => ({
    manifest,
    path: `${directory}/package.json`,
  })),
]) {
  if (normalizeRepositoryUrl(manifest.repository) !== canonicalRepositoryUrl) {
    throw new Error(`${path} repository must be '${canonicalRepositoryUrl}'.`);
  }
  if (manifest.homepage !== `${canonicalRepositoryUrl}#readme`) {
    throw new Error(`${path} homepage must use the canonical repository.`);
  }
  if (manifest.bugs?.url !== `${canonicalRepositoryUrl}/issues`) {
    throw new Error(`${path} issue tracker must use the canonical repository.`);
  }
}
for (const { manifest, relativePath } of manifests) {
  if (manifest.version !== version) {
    throw new Error(
      `${relativePath} version '${manifest.version ?? ""}' does not match '${version}'.`,
    );
  }
  if (manifest.miaixz?.version !== undefined || manifest.miaixz?.schemaVersion !== undefined) {
    throw new Error(`${relativePath} contains duplicate Miaixz contract version metadata.`);
  }
}

if (repository.rootManifest.private !== true) {
  throw new Error("The workspace root must be private.");
}

const workspaceNames = new Set(repository.workspaces.map(({ name }) => name));
const expectedPeerRange = getWorkspacePeerRange(version);
for (const { directory, manifest, manifestPath } of repository.workspaces) {
  if (!versionedManifestPaths.has(manifestPath)) {
    throw new Error(`${directory}/package.json cannot opt out of synchronized versions.`);
  }
  for (const dependencyName of Object.keys(manifest.peerDependencies ?? {})) {
    if (!workspaceNames.has(dependencyName)) continue;
    if (manifest.peerDependencies[dependencyName] !== expectedPeerRange) {
      throw new Error(
        `${directory} peer range for ${dependencyName} must be '${expectedPeerRange}'.`,
      );
    }
    if (manifest.devDependencies?.[dependencyName] !== version) {
      throw new Error(
        `${directory} development version for ${dependencyName} must be '${version}'.`,
      );
    }
  }
  for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
    for (const [dependencyName, dependencyVersion] of Object.entries(manifest[field] ?? {})) {
      if (workspaceNames.has(dependencyName) && dependencyVersion !== version) {
        throw new Error(
          `${directory} ${field} version for ${dependencyName} must be '${version}'.`,
        );
      }
    }
  }
}

for (const { directory, manifest } of repository.publicWorkspaces) {
  const path = `${directory}/package.json`;
  if (
    manifest.private === true ||
    manifest.publishConfig?.access !== "public" ||
    manifest.publishConfig?.registry !== "https://registry.npmjs.org/"
  ) {
    throw new Error(`${path} must be a public package published through the public npm registry.`);
  }
}

for (const workspace of repository.publicWorkspaces) {
  const sbomFiles = (workspace.manifest.files ?? []).filter((file) =>
    /(?:^|\/)\w[^/]*\.spdx\.json$/u.test(file),
  );
  if (sbomFiles.length > 1) {
    throw new Error(`${workspace.name} declares more than one SPDX SBOM.`);
  }
  if (sbomFiles.length === 0) continue;
  const sbom = JSON.parse(readFileSync(resolve(workspace.rootPath, sbomFiles[0]), "utf8"));
  const packageEntry = sbom.packages?.find(({ name }) => name === workspace.name);
  const packageSlug = workspace.name.split("/").at(-1);
  if (
    sbom.name !== `${workspace.name}-${version}` ||
    sbom.documentNamespace !== `https://miaixz.org/spdx/${packageSlug}/${version}` ||
    packageEntry?.versionInfo !== version
  ) {
    throw new Error(`${workspace.name} SBOM does not match VERSION.`);
  }
}

console.log(
  `Release metadata is valid for ${version} across ${manifests.length} manifests and ${repository.workspaces.length} workspaces.`,
);
