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
 * Describes pagination metadata returned by a list operation.
 *
 * @public
 */
export interface MiaixzPagination {
  /**
   * One-based current page number.
   */
  pageNo: number;

  /**
   * Maximum number of items requested per page.
   */
  pageSize: number;

  /**
   * Total number of items available across all pages.
   */
  total: number;
}

/**
 * Describes a page of immutable result items and its pagination metadata.
 *
 * @typeParam T - Type of each result item.
 * @public
 */
export interface MiaixzPage<T> extends MiaixzPagination {
  /**
   * Immutable rows contained in the current page.
   */
  rows: readonly T[];
}

/**
 * Calculates the number of pages, returning zero when the page size is invalid.
 *
 * @param pagination - Pagination metadata used for the calculation.
 * @returns Total page count rounded up to include a partial final page.
 * @public
 */
export function getMiaixzPageCount(pagination: MiaixzPagination): number {
  if (pagination.pageSize <= 0) return 0;
  return Math.ceil(Math.max(0, pagination.total) / pagination.pageSize);
}
