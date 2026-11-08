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
 * Re-exports shared API, appearance, configuration, file, permission, and summary contracts.
 */

export type {
  MiaixzApiProblem,
  MiaixzEntity,
  MiaixzIdentifier,
  MiaixzTimestamp,
} from "./fabric/api/api.types.js";
export {
  miaixzBaseFontSizes,
  miaixzColorModes,
  miaixzDensities,
  miaixzRadiusScales,
  miaixzShellLayouts,
  miaixzThemeColorTokens,
} from "./display/appearance.types.js";
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
} from "./display/appearance.types.js";
export type {
  MiaixzEnvironment,
  MiaixzFeatureValue,
  MiaixzSdkConfig,
} from "./runtime/config/config.types.js";
export type { MiaixzFileDescriptor, MiaixzUploadResult } from "./fabric/files/file.types.js";
export { getMiaixzPageCount } from "./models/pagination.js";
export type { MiaixzPage, MiaixzPagination } from "./models/pagination.js";
export type { MiaixzGrantSnapshot, MiaixzPermissionCode } from "./access/grants/grant.types.js";
export type { MiaixzUserSummary } from "./models/user.js";
