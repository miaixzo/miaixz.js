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
 * Freezes the SDK module inside the unified examples application.
 */

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const testRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(testRoot, "../../..");
const inventoryTools = await import(
  pathToFileURL(resolve(repositoryRoot, ".github/scripts/miaixz.mjs")).href
);
const exampleProject = inventoryTools
  .loadRepositoryInventory(repositoryRoot)
  .standaloneProjects.find(({ name }: { readonly name: string }) => name === "@miaixz/examples");
if (exampleProject === undefined) throw new Error("The examples project is required.");
const exampleRoot = resolve(exampleProject.rootPath, "src/module/sdk");

describe("SDK example module", () => {
  it("exercises independent configuration, session, HTTP, grants, appearance, i18n, and events", async () => {
    const source = await readFile(resolve(exampleRoot, "sdk-guide.tsx"), "utf8");
    for (const token of [
      "MiaixzConfigStore",
      "createMiaixzSessionManager",
      "createApiClient",
      "createMiaixzGrantSet",
      "createMiaixzAppearanceManager",
      "createMiaixzI18n",
      "createMiaixzEventBus",
      "config.set",
      "session.setSession",
      "grants.can",
      "api.get",
      "appearance.setColorMode",
      "i18n.changeLocale",
      "normalizeMiaixzError",
      "typed event: config:changed",
      "typed event: session:changed",
      "typed event: appearance:changed",
    ]) {
      expect(source.toLowerCase()).toContain(token.toLowerCase());
    }
  });

  it("owns language initialization and cleanup without the retired project runtime", async () => {
    const source = await readFile(resolve(exampleRoot, "sdk-guide.tsx"), "utf8");
    for (const token of [
      'instance.i18n.initialize(["demo"])',
      "onLoadError",
      "instance.config.subscribe",
      "instance.i18n.subscribe",
      "instance.events.on",
      "for (const stop of unsubscribe) stop()",
      "instance.config.destroy()",
      "instance.session.destroy()",
      "instance.appearance.destroy()",
      "instance.events.close()",
      "fetch: localFetch",
      "result.data",
    ]) {
      expect(source).toContain(token);
    }
    for (const token of [
      "createMiaixzSdk",
      "context.patch",
      "MiaixzRuntimeContext",
      "RestGatewayClient",
      "RestSigner",
      "unwrapMiaixzData",
      "isMiaixzApiEnvelope",
      "envelopeMode",
    ]) {
      expect(source).not.toContain(token);
    }
  });
});
