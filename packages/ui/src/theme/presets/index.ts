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
 * Exposes the presets public module.
 */

import { MiaixzThemeError } from "../error.js";
import type { MiaixzThemeDefinition, MiaixzThemeDescriptor, MiaixzThemeLoader } from "../types.js";
import {
  presetBuiltInThemes as builtInDefinitions,
  presetThemeDescriptors as generatedDescriptors,
  presetThemeImports,
} from "./manifest.js";

/**
 * Exposes built-in definitions with the stable public theme contract.
 * @public
 */
export const presetBuiltInThemes: readonly MiaixzThemeDefinition[] = builtInDefinitions;

/**
 * Exposes generated catalog metadata with the stable public descriptor contract.
 * @public
 */
export const presetThemeDescriptors: readonly MiaixzThemeDescriptor[] = generatedDescriptors;

const lazyPresetNames = new Set(Object.keys(presetThemeImports));

/**
 * Lists every built-in and lazy preset in stable selector order.
 *
 * @public
 */
export const themePresets: readonly MiaixzThemeDescriptor[] = presetThemeDescriptors;

/**
 * Reports whether a theme can be loaded from the generated preset catalog.
 *
 * @param name - Theme identifier.
 * @returns Whether a lazy preset with the identifier exists.
 */
export function hasThemePreset(name: string): boolean {
  return lazyPresetNames.has(name);
}

/**
 * Lazily imports one generated preset module.
 *
 * @param name - Preset identifier.
 * @param context - Cancellation signal for the request.
 * @returns Theme definition exported by the preset directory.
 * @public
 */
export const loadThemePreset: MiaixzThemeLoader = async (name, { signal }) => {
  if (signal.aborted) throw new MiaixzThemeError("UI_THEME_LOAD_ABORTED", { theme: name });
  const load = presetThemeImports[name];
  if (load === undefined) throw new MiaixzThemeError("UI_THEME_NOT_FOUND", { theme: name });
  const theme = await load();
  if (signal.aborted) throw new MiaixzThemeError("UI_THEME_LOAD_ABORTED", { theme: name });
  return theme;
};

/**
 * Loads a selected set of lazy presets for server-side CSS generation.
 *
 * @param names - Preset identifiers; all lazy presets when omitted.
 * @returns Definitions in requested order.
 * @public
 */
export async function loadThemePresets(
  names: readonly string[] = [...lazyPresetNames],
): Promise<readonly Readonly<MiaixzThemeDefinition>[]> {
  const signal = new AbortController().signal;
  return Promise.all(
    names.map(async (name) => (await loadThemePreset(name, { signal })) as MiaixzThemeDefinition),
  );
}
