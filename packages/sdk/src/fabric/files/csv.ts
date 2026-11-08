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
 * Serializes string and number cells without choosing application export policies.
 * Every cell is quoted; embedded quotes are doubled and row separators are explicit.
 *
 * @param rows - Ordered rows whose cells retain their original string conversion.
 * @param lineEnding - Required row separator selected by the caller.
 * @returns CSV text without a byte-order mark or a trailing row separator.
 * @throws TypeError When the caller does not select a supported row separator.
 * @public
 */
export function serializeMiaixzCsv(
  rows: readonly (readonly (string | number)[])[],
  lineEnding: "\n" | "\r\n",
): string {
  if (lineEnding !== "\n" && lineEnding !== "\r\n") {
    throw new TypeError("Invalid CSV line ending.");
  }
  return rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join(lineEnding);
}
