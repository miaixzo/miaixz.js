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
 * Exposes the theme public module.
 */

export { Theme } from "./provider.js";
export { resolveMiaixzColorMode } from "./mode.js";
export { useTheme } from "./context.js";
export type { ComponentTheme, ThemeComponents } from "./registry.js";
export { defineTheme } from "./define.js";
export { parseTheme } from "./parse.js";
export { createThemeScript } from "./script.js";
export { createThemeStyles } from "./styles.js";
export { MiaixzThemeError } from "./error.js";
export type { MiaixzThemeErrorCode } from "./error.js";
export { loadThemePreset, loadThemePresets, themePresets } from "./presets/index.js";
export { miaixzBreakpoints, miaixzMediaQueries } from "../design/breakpoints.js";
export type {
  ThemeContextValue,
  ThemeProps,
  MiaixzThemeDefinition,
  MiaixzThemeDescriptor,
  MiaixzThemeLoader,
  MiaixzThemeScriptOptions,
} from "./types.js";
export {
  typographySlotClasses,
  controlSlotClasses,
  paginationSlotClasses,
  iconSlotClasses,
} from "./slot-recipes.js";
