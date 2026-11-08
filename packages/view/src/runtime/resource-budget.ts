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
 * Resolves viewer resource budgets against immutable security limits.
 */

import type { ResourceBudget } from "../shared/contracts/resource-budget.js";

export type { ResourceBudget } from "../shared/contracts/resource-budget.js";

/**
 * Provides conservative browser defaults which callers may only tighten.
 */
export const defaultResourceBudget: ResourceBudget = Object.freeze({
  maxSourceBytes: 100 * 1024 * 1024,
  maxProbeBytes: 64 * 1024,
  maxTextCharacters: 16 * 1024 * 1024,
  maxExpandedBytes: 512 * 1024 * 1024,
  maxArchiveEntryBytes: 128 * 1024 * 1024,
  maxCompressionRatio: 100,
  maxArchiveEntries: 20_000,
  maxArchiveDepth: 4,
  maxXmlNodes: 2_000_000,
  maxXmlDepth: 128,
  maxRecursionDepth: 128,
  maxImagePixels: 100_000_000,
  maxPages: 10_000,
  maxNoProgressMilliseconds: 30_000,
  maxTaskMilliseconds: 120_000,
  maxEstimatedMemoryBytes: 512 * 1024 * 1024,
  maxSpreadsheetSheets: 256,
  maxSpreadsheetRows: 1_048_576,
  maxSpreadsheetColumns: 16_384,
  maxSpreadsheetCells: 2_000_000,
  maxSpreadsheetStyles: 65_536,
  maxDrawingObjects: 100_000,
  maxVectorRecords: 1_000_000,
  maxSpreadsheetCanvasBytes: 128 * 1024 * 1024,
});

/**
 * Absolute limits which host configuration cannot exceed.
 */
export const hardResourceBudget: ResourceBudget = Object.freeze({
  ...defaultResourceBudget,
  maxSourceBytes: 1024 * 1024 * 1024,
  maxExpandedBytes: 2 * 1024 * 1024 * 1024,
  maxRecursionDepth: 512,
  maxNoProgressMilliseconds: 60_000,
  maxTaskMilliseconds: 300_000,
  maxSpreadsheetSheets: 1024,
  maxSpreadsheetCells: 10_000_000,
  maxDrawingObjects: 500_000,
  maxVectorRecords: 5_000_000,
  maxSpreadsheetCanvasBytes: 512 * 1024 * 1024,
});

/**
 * Applies caller limits without allowing them to exceed security hard limits.
 *
 * @param overrides - Optional caller limits that may only tighten or remain below hard limits.
 * @returns Fully resolved immutable budget values for a viewer session.
 */
export function resolveResourceBudget(overrides?: Partial<ResourceBudget>): ResourceBudget {
  /**
   * Normalizes one requested resource limit against default and hard caps.
   *
   * @param key - Resource-budget field being resolved.
   * @returns Positive integer limit capped by the repository hard budget.
   */
  const value = (key: keyof ResourceBudget): number => {
    const requested = overrides?.[key] ?? defaultResourceBudget[key];
    if (!Number.isFinite(requested) || requested <= 0) return defaultResourceBudget[key];
    return Math.min(Math.floor(requested), hardResourceBudget[key]);
  };
  return {
    maxSourceBytes: value("maxSourceBytes"),
    maxProbeBytes: value("maxProbeBytes"),
    maxTextCharacters: value("maxTextCharacters"),
    maxExpandedBytes: value("maxExpandedBytes"),
    maxArchiveEntryBytes: value("maxArchiveEntryBytes"),
    maxCompressionRatio: value("maxCompressionRatio"),
    maxArchiveEntries: value("maxArchiveEntries"),
    maxArchiveDepth: value("maxArchiveDepth"),
    maxXmlNodes: value("maxXmlNodes"),
    maxXmlDepth: value("maxXmlDepth"),
    maxRecursionDepth: value("maxRecursionDepth"),
    maxImagePixels: value("maxImagePixels"),
    maxPages: value("maxPages"),
    maxNoProgressMilliseconds: value("maxNoProgressMilliseconds"),
    maxTaskMilliseconds: value("maxTaskMilliseconds"),
    maxEstimatedMemoryBytes: value("maxEstimatedMemoryBytes"),
    maxSpreadsheetSheets: value("maxSpreadsheetSheets"),
    maxSpreadsheetRows: value("maxSpreadsheetRows"),
    maxSpreadsheetColumns: value("maxSpreadsheetColumns"),
    maxSpreadsheetCells: value("maxSpreadsheetCells"),
    maxSpreadsheetStyles: value("maxSpreadsheetStyles"),
    maxDrawingObjects: value("maxDrawingObjects"),
    maxVectorRecords: value("maxVectorRecords"),
    maxSpreadsheetCanvasBytes: value("maxSpreadsheetCanvasBytes"),
  };
}
