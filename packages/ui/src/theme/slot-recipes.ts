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
 * Sets type roles on public heading and description slots.
 * @public
 */
export const typographySlotClasses = Object.freeze({
  pageTitle: "miaixz-type-page-title",
  sectionTitle: "miaixz-type-section-title",
  sectionHeader: "miaixz-editor-section-heading",
  secondaryDescription: "miaixz-type-supporting",
});

/**
 * Applies the standard control target size, including coarse-pointer sizing.
 * @public
 */
export const controlSlotClasses = Object.freeze({
  controlHeight: "miaixz-control-height-standard",
  squareControl: "miaixz-control-square",
  segmentedHeight: "miaixz-segmented-frame-standard",
  segmentedItem: "miaixz-segmented-frame-item",
});

/**
 * Selects the text-and-indicator pagination presentation through its slots.
 * @public
 */
export const paginationSlotClasses = Object.freeze({
  paginationRoot: "miaixz-pagination-text",
  paginationSummary: "miaixz-pagination-text-summary",
  paginationList: "miaixz-pagination-text-list",
  paginationItem: "miaixz-pagination-text-item",
});

/**
 * Sets icon geometry on component slots while respecting indicator-size icons.
 * @public
 */
export const iconSlotClasses = Object.freeze({
  controlIcon: "miaixz-icon-slot-control",
  controlScope: "miaixz-icon-scope-control",
  actionRegion: "miaixz-icon-scope-action-measure",
  featureScope: "miaixz-icon-slot-feature",
  helpScope: "miaixz-icon-slot-command",
  metricIndicatorScope: "miaixz-icon-slot-indicator",
  navigationScope: "miaixz-icon-slot-navigation",
  emptyScope: "miaixz-icon-slot-empty",
});
