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
 * Defines immutable resource limits used across parsing layers.
 *
 * Sets bounded limits for untrusted input processing.
 */
export interface ResourceBudget {
  readonly maxSourceBytes: number;
  readonly maxProbeBytes: number;
  readonly maxTextCharacters: number;
  readonly maxExpandedBytes: number;
  readonly maxArchiveEntryBytes: number;
  readonly maxCompressionRatio: number;
  readonly maxArchiveEntries: number;
  readonly maxArchiveDepth: number;
  readonly maxXmlNodes: number;
  readonly maxXmlDepth: number;
  readonly maxRecursionDepth: number;
  readonly maxImagePixels: number;
  readonly maxPages: number;
  readonly maxNoProgressMilliseconds: number;
  readonly maxTaskMilliseconds: number;
  readonly maxEstimatedMemoryBytes: number;
  readonly maxSpreadsheetSheets: number;
  readonly maxSpreadsheetRows: number;
  readonly maxSpreadsheetColumns: number;
  readonly maxSpreadsheetCells: number;
  readonly maxSpreadsheetStyles: number;
  readonly maxDrawingObjects: number;
  readonly maxVectorRecords: number;
  /**
   * Maximum backing-store bytes for the visible spreadsheet canvas.
   */
  readonly maxSpreadsheetCanvasBytes: number;
}
