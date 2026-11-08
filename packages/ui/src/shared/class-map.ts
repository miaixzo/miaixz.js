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
 * Combines split CSS Modules without discarding same-name classes.
 *
 * @param modules - CSS Module maps in source order.
 * @returns A frozen class map preserving class order, duplicates, and empty strings.
 * @public
 */
export function mergeStyleModules(
  ...modules: readonly Readonly<Record<string, string>>[]
): Readonly<Record<string, string>> {
  const keys = new Set(modules.flatMap((module) => Object.keys(module)));
  return Object.freeze(
    Object.fromEntries(
      [...keys].map((key) => [
        key,
        modules
          .map((module) => module[key])
          .filter((className): className is string => className !== undefined)
          .join(" "),
      ]),
    ),
  );
}
