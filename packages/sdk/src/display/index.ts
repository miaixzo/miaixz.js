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
 * Exports appearance management, validation, migration, and their public contracts.
 */

export {
  createMiaixzAppearanceManager,
  MiaixzAppearanceManager,
  miaixzAppearanceSchemaVersion,
} from "./appearance.js";
export type { MiaixzAppearanceManagerOptions } from "./appearance.js";
export { miaixzAppearanceMigration, migrateMiaixzAppearanceV1 } from "./migration.js";
export {
  isMiaixzAppearanceSettings,
  isMiaixzBaseFontSize,
  isMiaixzColorMode,
  isMiaixzDensity,
  isMiaixzRadiusScale,
  isMiaixzShellLayout,
  isMiaixzThemeId,
  miaixzDefaultAppearance,
  parseMiaixzAppearanceSettings,
} from "./validation.js";
export {
  miaixzBaseFontSizes,
  miaixzColorModes,
  miaixzDensities,
  miaixzRadiusScales,
  miaixzShellLayouts,
  miaixzThemeColorTokens,
} from "./appearance.types.js";
export type {
  MiaixzAppearancePayload,
  MiaixzAppearanceSettings,
  MiaixzBaseFontSize,
  MiaixzColorMode,
  MiaixzDensity,
  MiaixzRadiusScale,
  MiaixzResolvedColorMode,
  MiaixzShellLayout,
  MiaixzThemeColorOverrides,
  MiaixzThemeColors,
  MiaixzThemeColorToken,
  MiaixzThemeOverrides,
} from "./appearance.types.js";
