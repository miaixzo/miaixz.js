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
 * Defines the public icon directory names and categories.
 */
import type { IconName } from "./icons.js";
/**
 * Category identifiers declared by the canonical icon manifest.
 */
export type IconCategory =
  | "actions"
  | "animals"
  | "buildings"
  | "commerce"
  | "communication"
  | "data"
  | "development"
  | "devices"
  | "editing"
  | "education"
  | "entertainment"
  | "feedback"
  | "food"
  | "health"
  | "industry"
  | "interface"
  | "lifestyle"
  | "media"
  | "nature"
  | "navigation"
  | "people"
  | "science"
  | "security"
  | "shapes"
  | "sports"
  | "symbols"
  | "time"
  | "tools"
  | "transport";
/**
 * Public catalog projection containing only an icon's canonical name and category.
 */
export interface IconCatalogEntry {
  /**
   * Canonical name accepted by the Icon component.
   */
  readonly name: IconName;
  /**
   * Manifest category used for browsing and filtering.
   */
  readonly category: IconCategory;
}
const entries: readonly IconCatalogEntry[] = [
  {
    name: "accessibility",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "activity",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "ad",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "add",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "air-vent",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "airplay",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "alarm-clock",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "alarm-clock-check",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "alarm-clock-minus",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "alarm-clock-off",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "alarm-clock-plus",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "alarm-smoke",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "album",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "align-center-horizontal",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-center-vertical",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-end-horizontal",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-end-vertical",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-horizontal-distribute-center",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-horizontal-distribute-end",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-horizontal-distribute-start",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-horizontal-justify-center",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-horizontal-justify-end",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-horizontal-justify-start",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-horizontal-space-around",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-horizontal-space-between",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-start-horizontal",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-start-vertical",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-vertical-distribute-center",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-vertical-distribute-end",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-vertical-distribute-start",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-vertical-justify-center",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-vertical-justify-end",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-vertical-justify-start",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-vertical-space-around",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "align-vertical-space-between",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "ambulance",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "ampersand",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "ampersands",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "amphora",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "anchor",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "angle",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "antenna",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "anvil",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "aperture",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "app-window",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "app-window-mac",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "apple",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "archive",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "archive-restore",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "archive-x",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "armchair",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "arrow-big-down",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-big-down-dash",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-big-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-big-left-dash",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-big-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-big-right-dash",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-big-up",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-big-up-dash",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-down",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-down-a-z",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-down-from-line",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-down-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-down-narrow-wide",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-down-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-down-to-dot",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-down-to-line",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-down-up",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-down-wide-narrow",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-down-z-a",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-left-from-line",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-left-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-left-to-line",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-right-from-line",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-right-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-right-to-line",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-up",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-up-a-z",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-up-down",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-up-from-dot",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-up-from-line",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-up-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-up-narrow-wide",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-up-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-up-to-line",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-up-wide-narrow",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrow-up-z-a",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "arrows-up-from-line",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "asterisk",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "astroid",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "at-sign",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "atom",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "audio-lines",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "audio-lines-off",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "audio-lines-x",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "audio-waveform",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "award",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "axe",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "axis-3d",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "baby",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "backpack",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "backspace",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "badge",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "badge-alert",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "badge-cent",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "badge-check",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "badge-dollar-sign",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "badge-euro",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "badge-help",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "badge-indian-rupee",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "badge-info",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "badge-japanese-yen",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "badge-minus",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "badge-percent",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "badge-plus",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "badge-pound-sterling",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "badge-russian-ruble",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "badge-swiss-franc",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "badge-turkish-lira",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "badge-x",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "baggage-claim",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "balloon",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "ban",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "banana",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "bandage",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "banknote",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "banknote-arrow-down",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "banknote-arrow-up",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "banknote-check",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "banknote-x",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "barcode",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "barrel",
    category: "industry",
  } as IconCatalogEntry,
  {
    name: "baseline",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "bath",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "battery",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "battery-charging",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "battery-full",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "battery-low",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "battery-medium",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "battery-plus",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "battery-warning",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "beaker",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "bean",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "bean-off",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "bed",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "bed-double",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "bed-single",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "beef",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "beef-off",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "beer",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "beer-off",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "bell",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "bell-check",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "bell-dot",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "bell-electric",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "bell-minus",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "bell-off",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "bell-plus",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "bell-ring",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "between-horizontal-end",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "between-horizontal-start",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "between-vertical-end",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "between-vertical-start",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "biceps-flexed",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "bike",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "binary",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "binoculars",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "biohazard",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "bird",
    category: "animals",
  } as IconCatalogEntry,
  {
    name: "birdhouse",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "bitcoin",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "blend",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "blender",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "blinds",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "blocks",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "bluetooth",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "bluetooth-connected",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "bluetooth-off",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "bluetooth-searching",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "bold",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "bolt",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "bomb",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "bone",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "bone-fracture",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "book",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-a",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-alert",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-audio",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-check",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-copy",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-dashed",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-down",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-headphones",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-heart",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-image",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-key",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-lock",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-marked",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-minus",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-open",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-open-check",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-open-text",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-plus",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-search",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-text",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-type",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-up",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-up-double",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-user",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "book-x",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "bookmark",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "bookmark-check",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "bookmark-minus",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "bookmark-off",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "bookmark-plus",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "bookmark-x",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "boom-box",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "bot",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "bot-message-square",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "bot-off",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "bottle-wine",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "bow-arrow",
    category: "sports",
  } as IconCatalogEntry,
  {
    name: "box",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "boxes",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "braces",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "brackets",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "brain",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "brain-circuit",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "brain-cog",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "brick-wall",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "brick-wall-fire",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "brick-wall-shield",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "briefcase",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "briefcase-business",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "briefcase-conveyor-belt",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "briefcase-medical",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "bring-to-front",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "broccoli",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "broom",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "broom-sparkles",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "brush",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "brush-cleaning",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "bubbles",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "bug",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "bug-off",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "bug-play",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "building",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "building-wide",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "bus",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "bus-front",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "cable",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "cable-car",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "cake",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "cake-slice",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "calculator",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "calendar",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-arrow-down",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-arrow-up",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-check",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-check-outside",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-clock",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-cog",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-date-one",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-days",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-fold",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-heart",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-minus",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-minus-outside",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-off",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-plus",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-plus-outside",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-range",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-search",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-sync",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-x",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendar-x-outside",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "calendars",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "camera",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "camera-off",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "candy",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "candy-cane",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "candy-off",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "cannabis",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "cannabis-off",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "captions",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "captions-off",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "car",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "car-battery",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "car-front",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "car-taxi-front",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "caravan",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "card-sim",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "carrot",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "case-lower",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "case-sensitive",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "case-upper",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "cassette-tape",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "cast",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "castle",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "cat",
    category: "animals",
  } as IconCatalogEntry,
  {
    name: "cctv",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "cctv-off",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "chart-area",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-bar",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-bar-big",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-bar-decreasing",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-bar-increasing",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-bar-stacked",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-candlestick",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-column",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-column-big",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-column-decreasing",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-column-increasing",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-column-stacked",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-gantt",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-line",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-network",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-no-axes-column",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-no-axes-column-decreasing",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-no-axes-column-increasing",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-no-axes-combined",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-no-axes-gantt",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-pie",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-scatter",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "chart-spline",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "check-check",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "check-line",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "chef-hat",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "cherry",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "chess-bishop",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "chess-king",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "chess-knight",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "chess-pawn",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "chess-queen",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "chess-rook",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "chevron-down",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "chevron-first",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "chevron-last",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "chevron-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "chevron-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "chevron-up",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "chevrons-down",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "chevrons-down-up",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "chevrons-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "chevrons-left-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "chevrons-left-right-ellipsis",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "chevrons-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "chevrons-right-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "chevrons-up",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "chevrons-up-down",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "church",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "cigarette",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "cigarette-off",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "circle",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "circle-alert",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "circle-arrow-down",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "circle-arrow-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "circle-arrow-out-down-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "circle-arrow-out-down-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "circle-arrow-out-up-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "circle-arrow-out-up-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "circle-arrow-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "circle-arrow-up",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "circle-check",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "circle-check-big",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "circle-chevron-down",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "circle-chevron-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "circle-chevron-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "circle-chevron-up",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "circle-dashed",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "circle-divide",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "circle-dollar-sign",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "circle-dot",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "circle-dot-dashed",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "circle-ellipsis",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "circle-equal",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "circle-euro",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "circle-fading-arrow-up",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "circle-fading-plus",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "circle-gauge",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "circle-minus",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "circle-off",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "circle-parking",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "circle-parking-off",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "circle-pause",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "circle-percent",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "circle-pile",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "circle-play",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "circle-plus",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "circle-pound-sterling",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "circle-power",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "circle-slash",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "circle-slashed",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "circle-small",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "circle-star",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "circle-stop",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "circle-user",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "circle-user-round",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "circle-x",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "circuit-board",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "citrus",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "clapperboard",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "clipboard",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "clipboard-check",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "clipboard-clock",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "clipboard-copy",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "clipboard-list",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "clipboard-minus",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "clipboard-paste",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "clipboard-pen",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "clipboard-pen-line",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "clipboard-plus",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "clipboard-type",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "clipboard-x",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "clock",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-alert",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-arrow-down",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-arrow-left",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-arrow-right",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-arrow-up",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-check",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-fading",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-hour-1",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-hour-10",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-hour-11",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-hour-12",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-hour-2",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-hour-3",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-hour-5",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-hour-6",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-hour-7",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-hour-8",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-hour-9",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "clock-plus",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "close",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "closed-caption",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "cloud",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "cloud-alert",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "cloud-backup",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "cloud-check",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "cloud-cog",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "cloud-download",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "cloud-drizzle",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "cloud-fog",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "cloud-hail",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "cloud-lightning",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "cloud-moon",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "cloud-moon-rain",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "cloud-off",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "cloud-rain",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "cloud-rain-wind",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "cloud-snow",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "cloud-sun",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "cloud-sun-rain",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "cloud-sync",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "cloud-upload",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "cloudy",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "clover",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "club",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "code",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "code-xml",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "coffee",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "cog",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "coins",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "columns",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "columns-4",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "columns-settings",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "combine",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "command",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "compass",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "component",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "computer",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "concierge-bell",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "cone",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "confirm",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "construction",
    category: "industry",
  } as IconCatalogEntry,
  {
    name: "contact",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "contact-round",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "container",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "contrast",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "cookie",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "cooking-pot",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "copy",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "copy-check",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "copy-minus",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "copy-plus",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "copy-slash",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "copy-x",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "copyleft",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "copyright",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "corner-down-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "corner-down-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "corner-left-down",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "corner-left-up",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "corner-right-down",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "corner-right-up",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "corner-up-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "corner-up-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "cpu",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "creative-commons",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "credit-card",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "croissant",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "crop",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "cross",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "crosshair",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "crown",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "cuboid",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "cup-soda",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "currency",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "cursor-arrow",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "cursor-arrow-off",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "cursor-arrow-tail",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "cylinder",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "dam",
    category: "industry",
  } as IconCatalogEntry,
  {
    name: "database",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "database-arrow-down",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "database-arrow-up",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "database-backup",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "database-check",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "database-minus",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "database-plus",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "database-search",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "database-x",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "database-zap",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "decimals-arrow-left",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "decimals-arrow-right",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "delete",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "dessert",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "diameter",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "diamond",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "diamond-minus",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "diamond-percent",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "diamond-plus",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "dice-1",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "dice-2",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "dice-3",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "dice-4",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "dice-5",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "dice-6",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "dices",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "diff",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "disc",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "disc-album",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "disc-ring",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "disc-tracks",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "divide",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "dna",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "dna-off",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "dock",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "dog",
    category: "animals",
  } as IconCatalogEntry,
  {
    name: "dollar-sign",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "donut",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "door-closed",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "door-closed-locked",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "door-open",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "dot",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "download",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "drafting-compass",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "drama",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "drill",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "drone",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "droplet",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "droplet-off",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "droplets",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "drum",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "drumstick",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "dumbbell",
    category: "sports",
  } as IconCatalogEntry,
  {
    name: "ear",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "ear-off",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "earth",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "earth-lock",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "eclipse",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "edit",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "egg",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "egg-fried",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "egg-off",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "eject",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "ellipse",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "equal",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "equal-approximately",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "equal-not",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "eraser",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "ethernet-port",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "euro",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "ev-charger",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "expand",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "external-link",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "eye",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "eye-closed",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "eye-dashed",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "eye-off",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "face-angry",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "face-expressionless",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "face-grinning",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "face-neutral",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "face-slightly-frowning",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "face-slightly-smiling",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "face-slightly-smiling-plus",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "factory",
    category: "industry",
  } as IconCatalogEntry,
  {
    name: "fan",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "fast-forward",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "feather",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "fence",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "ferris-wheel",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "file",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-archive",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-axis-3d",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-badge",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-box",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-braces",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-braces-corner",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-chart-column",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-chart-column-increasing",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-chart-line",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-chart-pie",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-check",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-check-corner",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-clock",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-code",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "file-code-corner",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "file-cog",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-diff",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-digit",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-down",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-exclamation-point",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-headphone",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-heart",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-help",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-image",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-input",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-key",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-lock",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-minus",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-minus-corner",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-music",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-output",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-pen",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-pen-line",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-play",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-plus",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-plus-corner",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-scan",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-search",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-search-corner",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-signal",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-sliders",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-spreadsheet",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-stack",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-symlink",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-terminal",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-text",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-type",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-type-corner",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-up",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-user",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-video-camera",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-volume",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-x",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "file-x-corner",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "files",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "film",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "fingerprint-pattern",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "fire-extinguisher",
    category: "industry",
  } as IconCatalogEntry,
  {
    name: "fish",
    category: "animals",
  } as IconCatalogEntry,
  {
    name: "fish-off",
    category: "animals",
  } as IconCatalogEntry,
  {
    name: "fish-symbol",
    category: "animals",
  } as IconCatalogEntry,
  {
    name: "fishing-hook",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "fishing-rod",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "flag",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "flag-off",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "flag-triangle-left",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "flag-triangle-right",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "flame",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "flame-kindling",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "flashlight",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "flashlight-off",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "flask-conical",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "flask-conical-off",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "flask-round",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "flip-horizontal-arrows",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "flip-vertical-arrows",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "flower",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "flower-stem",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "focus",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "fold-horizontal",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "fold-vertical",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "folder",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-archive",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-bookmark",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-check",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-clock",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-closed",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-code",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-cog",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-dot",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-down",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-git",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-git-branch",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-heart",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-input",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-kanban",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-key",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-lock",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-minus",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-open",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-open-dot",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-output",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-pen",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-plus",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-root",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-search",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-search-outside",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-symlink",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-sync",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-tree",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-up",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folder-x",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "folders",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "font-size-decrease",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "font-size-increase",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "footprints",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "forklift",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "form",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "forward",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "frame",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "fuel",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "fullscreen",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "funnel",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "funnel-plus",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "funnel-x",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "galaxy",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "gallery-horizontal",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "gallery-horizontal-end",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "gallery-thumbnails",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "gallery-vertical",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "gallery-vertical-end",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "gamepad",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "gamepad-directional",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "gamepad-rounded",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "gauge",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "gavel",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "gem",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "georgian-lari",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "ghost",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "gift",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "git-branch",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "git-branch-minus",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "git-branch-plus",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "git-commit-horizontal",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "git-commit-vertical",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "git-compare",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "git-compare-arrows",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "git-fork",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "git-graph",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "git-merge",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "git-merge-conflict",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "git-pull-request",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "git-pull-request-arrow",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "git-pull-request-closed",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "git-pull-request-create",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "git-pull-request-create-arrow",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "git-pull-request-draft",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "glass-water",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "glasses",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "globe",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "globe-check",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "globe-lock",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "globe-off",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "globe-x",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "goal",
    category: "sports",
  } as IconCatalogEntry,
  {
    name: "gpu",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "graduation-cap",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "grape",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "grid",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "grid-2x2",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "grid-2x2-check",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "grid-2x2-plus",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "grid-2x2-x",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "grid-3x2",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "grip",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "grip-horizontal",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "grip-vertical",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "group",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "guitar",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "ham",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "hamburger",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "hammer",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "hand",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "hand-coins",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "hand-fist",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "hand-grab",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "hand-heart",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "hand-helping",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "hand-metal",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "hand-platter",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "handbag",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "handshake",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "hard-drive",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "hard-drive-download",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "hard-drive-upload",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "hard-hat",
    category: "industry",
  } as IconCatalogEntry,
  {
    name: "hash",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "hat-glasses",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "haze",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "hd",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "hdmi-port",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "heading",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "heading-1",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "heading-2",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "heading-3",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "heading-4",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "heading-5",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "heading-6",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "headphone-off",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "headphones",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "headset",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "heart",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "heart-crack",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "heart-handshake",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "heart-minus",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "heart-off",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "heart-plus",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "heart-pulse",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "heart-x",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "heater",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "helicopter",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "help",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "hexagon",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "highlighter",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "home",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "hop",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "hop-off",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "hospital",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "hotel",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "hourglass",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "house",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "house-heart",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "house-plug",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "house-plus",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "house-wifi",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "ice-cream-bowl",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "ice-cream-cone",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "id-card",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "id-card-lanyard",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "image",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "image-down",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "image-minus",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "image-off",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "image-play",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "image-plus",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "image-up",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "image-upscale",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "images",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "import",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "inbox",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "indian-rupee",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "infinity",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "info",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "inspection-panel",
    category: "industry",
  } as IconCatalogEntry,
  {
    name: "italic",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "iteration-ccw",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "iteration-cw",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "japanese-yen",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "joystick",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "kanban",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "kayak",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "key",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "key-round",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "key-square",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "keyboard",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "keyboard-music",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "keyboard-off",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "lamp",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "lamp-ceiling",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "lamp-desk",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "lamp-floor",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "lamp-wall-down",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "lamp-wall-up",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "land-plot",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "landmark",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "languages",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "laptop",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "laptop-minimal",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "laptop-minimal-check",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "lasso",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "lasso-select",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "layer-arrow-down",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "layer-arrow-up",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "layers",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "layers-arrow-down",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "layers-arrow-up",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "layers-minus",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "layers-plus",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "layers-two",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "layout-dashboard",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "layout-freeform",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "layout-grid",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "layout-list",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "layout-panel-left",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "layout-panel-top",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "layout-template",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "leaf",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "leafy-green",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "lectern",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "lens-concave",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "lens-convex",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "letter-size",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "library",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "library-big",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "life-buoy",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "ligature",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "lightbulb",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "lightbulb-off",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "line-dot-right-horizontal",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "line-squiggle",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "line-style",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "link",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "link-horizontal",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "link-horizontal-off",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "list",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-check",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-checks",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-chevrons-down-up",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-chevrons-up-down",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-clock",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-collapse",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-end",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-filter",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-filter-plus",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-indent-decrease",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-indent-increase",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-minus",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-music",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-ordered",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-plus",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-restart",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-sort-ascending",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-sort-descending",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-start",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-todo",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-tree",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-video",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "list-x",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "loader",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "loader-pinwheel",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "loading",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "locate",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "locate-fixed",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "locate-off",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "lock",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "lock-keyhole",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "lock-keyhole-open",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "lock-open",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "log-in",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "log-out",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "logs",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "lollipop",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "luggage",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "magnet",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "mail",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "mail-badge",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "mail-check",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "mail-clock",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "mail-help",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "mail-minus",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "mail-open",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "mail-plus",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "mail-search",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "mail-warning",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "mail-x",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "mailbox",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "mails",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "map",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "map-minus",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "map-pin",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "map-pin-check",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "map-pin-check-inside",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "map-pin-house",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "map-pin-minus",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "map-pin-minus-inside",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "map-pin-off",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "map-pin-pen",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "map-pin-plus",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "map-pin-plus-inside",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "map-pin-search",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "map-pin-x",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "map-pin-x-inside",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "map-pinned",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "map-plus",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "mars",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "mars-stroke",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "martini",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "maximize",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "maximize-diagonal",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "medal",
    category: "sports",
  } as IconCatalogEntry,
  {
    name: "megaphone",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "megaphone-off",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "memory-stick",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "menu",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "merge",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "message-circle",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-circle-check",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-circle-code",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-circle-dashed",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-circle-heart",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-circle-help",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-circle-more",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-circle-off",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-circle-plus",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-circle-reply",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-circle-warning",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-circle-x",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-square",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-square-check",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-square-code",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-square-dashed",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-square-diff",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-square-dot",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-square-heart",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-square-lock",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-square-more",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-square-off",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-square-plus",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-square-quote",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-square-reply",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-square-share",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-square-text",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-square-warning",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "message-square-x",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "messages-square",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "metronome",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "mic",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "mic-audio-lines",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "mic-off",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "mic-signal",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "mic-vocal",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "microchip",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "microscope",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "microwave",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "midi-port",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "milestone",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "milk",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "milk-off",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "minimize",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "minimize-diagonal",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "mirror-rectangular",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "mirror-round",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "monitor",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "monitor-check",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "monitor-cloud",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "monitor-cog",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "monitor-dot",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "monitor-down",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "monitor-off",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "monitor-pause",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "monitor-play",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "monitor-smartphone",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "monitor-speaker",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "monitor-stop",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "monitor-up",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "monitor-x",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "moon",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "moon-star",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "mop",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "mop-sparkles",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "more-horizontal",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "more-vertical",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "mosque",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "motorbike",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "mountain",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "mountain-snow",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "mouse",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "mouse-left",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "mouse-off",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "mouse-pointer-ban",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "mouse-pointer-click",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "mouse-right",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "move",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "move-3d",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "move-diagonal-down-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "move-diagonal-up-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "move-down",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "move-down-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "move-down-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "move-horizontal",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "move-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "move-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "move-up",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "move-up-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "move-up-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "move-vertical",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "music-note",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "music-note-flag",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "music-notes",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "music-notes-staff",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "navigation-diagonal",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "navigation-off",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "navigation-up",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "navigation-up-off",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "network",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "newspaper",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "nfc",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "non-binary",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "notebook",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "notebook-pen",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "notebook-tabs",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "notebook-text",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "notepad-text",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "notepad-text-dashed",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "nut",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "nut-off",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "octagon",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "octagon-alert",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "octagon-minus",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "octagon-pause",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "octagon-x",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "omega",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "option",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "orbit",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "origami",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "package",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "package-check",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "package-minus",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "package-open",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "package-plus",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "package-sealed",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "package-search",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "package-x",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "paint-bucket",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "paint-roller",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "paintbrush",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "paintbrush-vertical",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "palette",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "panda",
    category: "animals",
  } as IconCatalogEntry,
  {
    name: "panel-bottom",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panel-bottom-close",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panel-bottom-dashed",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panel-bottom-open",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panel-left",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panel-left-close",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panel-left-dashed",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panel-left-open",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panel-left-right-dashed",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panel-right",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panel-right-close",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panel-right-dashed",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panel-right-open",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panel-top",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panel-top-bottom-dashed",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panel-top-close",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panel-top-dashed",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panel-top-open",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panels-left-bottom",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panels-left-right",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panels-right-bottom",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panels-top-bottom",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "panels-top-left",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "paper-bag",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "paperclip",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "parasol",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "parentheses",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "parking-meter",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "party-popper",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "pause",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "paw-print",
    category: "animals",
  } as IconCatalogEntry,
  {
    name: "pc-case",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "pen",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "pen-line",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "pen-off",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "pen-tool",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "pencil",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "pencil-line",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "pencil-off",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "pencil-ruler",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "pencil-sparkles",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "pentagon",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "percent",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "person-standing",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "phi",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "philippine-peso",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "phone",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "phone-call",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "phone-forwarded",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "phone-incoming",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "phone-missed",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "phone-off",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "phone-outgoing",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "pi",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "piano",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "pickaxe",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "picture-in-picture-enter",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "picture-in-picture-window",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "piggy-bank",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "pilcrow",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "pilcrow-left",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "pilcrow-right",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "pill",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "pill-bottle",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "pin",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "pin-off",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "pipette",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "pizza",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "plane",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "plane-landing",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "plane-takeoff",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "play",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "play-off",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "plug",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "plug-round",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "plug-zap",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "pocket-knife",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "podium",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "pointer",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "pointer-off",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "popcorn",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "popsicle",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "pound-sterling",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "power",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "power-off",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "presentation",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "printer",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "printer-check",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "printer-x",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "projector",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "proportions",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "puzzle",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "pyramid",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "qr-code",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "quote",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "rabbit",
    category: "animals",
  } as IconCatalogEntry,
  {
    name: "radar",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "radiation",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "radical",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "radio",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "radio-off",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "radio-receiver",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "radio-tower",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "radius",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "rainbow",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "rat",
    category: "animals",
  } as IconCatalogEntry,
  {
    name: "ratio",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "receipt",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "receipt-cent",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "receipt-euro",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "receipt-indian-rupee",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "receipt-japanese-yen",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "receipt-pound-sterling",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "receipt-russian-ruble",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "receipt-swiss-franc",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "receipt-text",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "receipt-turkish-lira",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "rectangle-circle",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "rectangle-ellipsis",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "rectangle-goggles",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "rectangle-horizontal",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "rectangle-vertical",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "recycle",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "redo-circular",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "redo-dot",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "redo-forward",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "refresh-ccw",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "refresh-ccw-dot",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "refresh-cw",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "refresh-cw-off",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "refrigerator",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "regex",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "remove",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "remove-formatting",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "repeat",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "repeat-off",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "repeat-once",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "repeat-vertical",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "replace",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "replace-all",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "reply",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "reply-all",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "rewind",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "ribbon",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "road",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "robot-arm",
    category: "industry",
  } as IconCatalogEntry,
  {
    name: "rocket",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "rocking-chair",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "roller-coaster",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "rose",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "rotate-3d",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "rotate-ccw",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "rotate-ccw-clock",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "rotate-ccw-key",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "rotate-ccw-square",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "rotate-cw",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "rotate-cw-fading-clock",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "rotate-cw-square",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "route",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "route-off",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "router",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "rows",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "rows-4",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "rss",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "ruler",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "ruler-dimension-line",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "russian-ruble",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "sailboat",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "salad",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "sandwich",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "satellite",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "satellite-dish",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "saudi-riyal",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "save",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "save-all",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "save-check",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "save-off",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "save-pen",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "save-plus",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "scale",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "scale-3d",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "scaling",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "scan",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "scan-barcode",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "scan-box",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "scan-eye",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "scan-face",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "scan-heart",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "scan-line",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "scan-qr-code",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "scan-search",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "scan-square",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "scan-text",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "school",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "scissors",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "scissors-line-dashed",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "scooter",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "screen-share",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "screen-share-off",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "scroll",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "scroll-text",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "search",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "search-alert",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "search-check",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "search-code",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "search-slash",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "search-x",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "section",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "send",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "send-horizontal",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "send-to-back",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "separator-horizontal",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "separator-vertical",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "server",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "server-cog",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "server-crash",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "server-off",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "server-plus",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "settings",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "settings-controls",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "shapes",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "share-nodes",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "share-up",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "sheet",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "shell",
    category: "animals",
  } as IconCatalogEntry,
  {
    name: "shelving-unit",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "shield",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "shield-alert",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "shield-ban",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "shield-check",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "shield-cog",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "shield-cog-corner",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "shield-ellipsis",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "shield-half",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "shield-help",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "shield-keyhole",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "shield-lock",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "shield-minus",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "shield-off",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "shield-plus",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "shield-user",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "shield-x",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "ship",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "ship-cargo",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "ship-wheel",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "shirt",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "shopping-bag",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "shopping-basket",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "shopping-cart",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "shovel",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "shower-head",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "shredder",
    category: "industry",
  } as IconCatalogEntry,
  {
    name: "shrimp",
    category: "animals",
  } as IconCatalogEntry,
  {
    name: "shrink",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "shrub",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "shuffle",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "sigma",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "signal",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "signal-high",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "signal-low",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "signal-medium",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "signal-zero",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "signature",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "signpost",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "signpost-big",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "siren",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "skip-back",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "skip-forward",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "skull",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "slash",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "slice",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "sliders-horizontal",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "sliders-vertical",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "smartphone",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "smartphone-charging",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "smartphone-nfc",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "snail",
    category: "animals",
  } as IconCatalogEntry,
  {
    name: "snowflake",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "soap-dispenser-droplet",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "sofa",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "solar-panel",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "sort-numeric-ascending-down",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "sort-numeric-ascending-up",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "sort-numeric-descending-down",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "sort-numeric-descending-up",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "soup",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "space",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "spade",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "sparkle",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "sparkles",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "speaker",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "speech",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "spell-check-confirm",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "spell-check-underline",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "spline",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "spline-pointer",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "split",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "spool",
    category: "industry",
  } as IconCatalogEntry,
  {
    name: "sport-shoe",
    category: "sports",
  } as IconCatalogEntry,
  {
    name: "spotlight",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "spray-can",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "sprout",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "square",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "square-activity",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "square-arrow-down",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-arrow-down-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-arrow-down-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-arrow-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-arrow-out-down-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-arrow-out-down-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-arrow-out-up-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-arrow-out-up-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-arrow-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-arrow-right-enter",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-arrow-right-exit",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-arrow-up",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-arrow-up-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-arrow-up-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-asterisk",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "square-bottom-dashed-scissors",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "square-centerline-dashed-horizontal",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "square-centerline-dashed-vertical",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "square-chart-gantt",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "square-check",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "square-check-big",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "square-chevron-down",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-chevron-left",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-chevron-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-chevron-up",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "square-code",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "square-dashed",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "square-dashed-bottom",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "square-dashed-bottom-code",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "square-dashed-kanban",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "square-dashed-mouse-pointer",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "square-dashed-text",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "square-dashed-top-solid",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "square-dimensions",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "square-divide",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "square-dot",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "square-equal",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "square-function",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "square-kanban",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "square-library",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "square-m",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "square-menu",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "square-minus",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "square-mouse-pointer",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "square-off",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "square-parking",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "square-parking-off",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "square-pause",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "square-percent",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "square-pi",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "square-pilcrow",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "square-play",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "square-plus",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "square-power",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "square-radical",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "square-round-corner",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "square-scissors",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "square-sigma",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "square-slash",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "square-split-horizontal",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "square-split-vertical",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "square-square",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "square-stack",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "square-star",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "square-stop",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "square-terminal",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "square-text",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "square-user",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "square-user-round",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "square-x",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "squares-exclude",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "squares-intersect",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "squares-subtract",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "squares-unite",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "squircle",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "squircle-dashed",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "squirrel",
    category: "animals",
  } as IconCatalogEntry,
  {
    name: "stamp",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "star",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "star-check",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "star-half",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "star-minus",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "star-off",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "star-plus",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "star-x",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "step-back",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "step-forward",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "stethoscope",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "sticker",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "sticky-note",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "sticky-note-check",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "sticky-note-minus",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "sticky-note-off",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "sticky-note-plus",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "sticky-note-x",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "sticky-notes",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "stone",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "store",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "stretch-horizontal",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "stretch-vertical",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "strikethrough",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "subscript",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "summary",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "sun",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "sun-dim",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "sun-medium",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "sun-moon",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "sun-snow",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "sunrise",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "sunset",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "superscript",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "swatch-book",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "swiss-franc",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "switch-camera",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "sword",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "swords",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "syringe",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "table",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "table-cells-merge",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "table-cells-split",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "table-columns-split",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "table-of-contents",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "table-properties",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "table-rows-split",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "table-split",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "tablet",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "tablet-smartphone",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "tablets",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "tag",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "tag-plus",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "tag-x",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "tags",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "tally-1",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "tally-2",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "tally-3",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "tally-4",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "tally-5",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "tangent",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "target",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "telescope",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "tent",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "tent-tree",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "terminal",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "test-tube",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "test-tube-diagonal",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "test-tubes",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "text-align-center",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "text-align-end",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "text-align-justify",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "text-align-start",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "text-cursor",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "text-cursor-input",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "text-initial",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "text-quote",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "text-search",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "text-wrap",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "theater",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "thermometer",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "thermometer-snowflake",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "thermometer-sun",
    category: "health",
  } as IconCatalogEntry,
  {
    name: "thumbs-down",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "thumbs-up",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "ticket",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "ticket-check",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "ticket-minus",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "ticket-percent",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "ticket-plus",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "ticket-slash",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "ticket-x",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "tickets",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "tickets-plane",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "timeline",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "timer",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "timer-off",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "timer-reset",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "toggle-left",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "toggle-right",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "toilet",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "tool-case",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "toolbox",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "tornado",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "torus",
    category: "science",
  } as IconCatalogEntry,
  {
    name: "touchpad",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "touchpad-off",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "towel-rack",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "tower-control",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "toy-brick",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "tractor",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "traffic-cone",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "trailer",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "train-front",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "train-front-tunnel",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "train-track",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "tram-front",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "transgender",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "trash-bin-empty",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "tree-deciduous",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "tree-palm",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "tree-pine",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "trees",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "trending-down",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "trending-up",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "trending-up-down",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "triangle",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "triangle-dashed",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "triangle-right",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "trophy",
    category: "sports",
  } as IconCatalogEntry,
  {
    name: "truck",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "truck-electric",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "turkish-lira",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "turntable",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "turtle",
    category: "animals",
  } as IconCatalogEntry,
  {
    name: "tv",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "tv-minimal",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "tv-minimal-play",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "type",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "type-outline",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "umbrella",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "umbrella-off",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "underline",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "undo-back",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "undo-circular",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "undo-dot",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "unfold-horizontal",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "unfold-vertical",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "ungroup",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "university",
    category: "education",
  } as IconCatalogEntry,
  {
    name: "unlink-broken",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "unlink-horizontal",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "unplug",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "upload",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "usb",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "usb-c-port",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "user",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-check",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-cog",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-key",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-lock",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-minus",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-pen",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-plus",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-round",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-round-arrow-left",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-round-check",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-round-cog",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-round-key",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-round-minus",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-round-pen",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-round-plus",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-round-search",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-round-x",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-search",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-shield",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-star",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "user-x",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "users",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "users-round",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "utensils",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "utensils-crossed",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "utility-pole",
    category: "industry",
  } as IconCatalogEntry,
  {
    name: "van",
    category: "transport",
  } as IconCatalogEntry,
  {
    name: "variable",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "vault",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "vector-square",
    category: "shapes",
  } as IconCatalogEntry,
  {
    name: "vegan",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "venetian-mask",
    category: "entertainment",
  } as IconCatalogEntry,
  {
    name: "venus",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "venus-and-mars",
    category: "people",
  } as IconCatalogEntry,
  {
    name: "vibrate",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "vibrate-off",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "video",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "video-off",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "videotape",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "view",
    category: "interface",
  } as IconCatalogEntry,
  {
    name: "voicemail",
    category: "communication",
  } as IconCatalogEntry,
  {
    name: "volleyball",
    category: "sports",
  } as IconCatalogEntry,
  {
    name: "volume-high",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "volume-low",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "volume-off",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "volume-x",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "volume-zero",
    category: "media",
  } as IconCatalogEntry,
  {
    name: "vote",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "wallet",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "wallet-cards",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "wallet-minimal",
    category: "commerce",
  } as IconCatalogEntry,
  {
    name: "wallpaper",
    category: "lifestyle",
  } as IconCatalogEntry,
  {
    name: "wand",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "wand-sparkles",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "warehouse",
    category: "buildings",
  } as IconCatalogEntry,
  {
    name: "warning",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "washing-machine",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "watch",
    category: "time",
  } as IconCatalogEntry,
  {
    name: "waves-arrow-down",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "waves-arrow-up",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "waves-horizontal",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "waves-ladder",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "waves-vertical",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "waypoints",
    category: "navigation",
  } as IconCatalogEntry,
  {
    name: "webcam",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "webcam-off",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "webhook",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "webhook-off",
    category: "development",
  } as IconCatalogEntry,
  {
    name: "weight",
    category: "sports",
  } as IconCatalogEntry,
  {
    name: "weight-tilde",
    category: "sports",
  } as IconCatalogEntry,
  {
    name: "wheat",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "wheat-off",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "whole-word",
    category: "editing",
  } as IconCatalogEntry,
  {
    name: "wifi",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "wifi-cog",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "wifi-high",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "wifi-low",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "wifi-off",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "wifi-pen",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "wifi-sync",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "wifi-zero",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "wind",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "wind-arrow-down",
    category: "nature",
  } as IconCatalogEntry,
  {
    name: "wine",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "wine-off",
    category: "food",
  } as IconCatalogEntry,
  {
    name: "workflow",
    category: "data",
  } as IconCatalogEntry,
  {
    name: "worm",
    category: "animals",
  } as IconCatalogEntry,
  {
    name: "wrench",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "wrench-off",
    category: "tools",
  } as IconCatalogEntry,
  {
    name: "x-line-top",
    category: "feedback",
  } as IconCatalogEntry,
  {
    name: "zap",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "zap-off",
    category: "devices",
  } as IconCatalogEntry,
  {
    name: "zodiac-aquarius",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "zodiac-aries",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "zodiac-cancer",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "zodiac-capricorn",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "zodiac-gemini",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "zodiac-leo",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "zodiac-libra",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "zodiac-ophiuchus",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "zodiac-pisces",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "zodiac-sagittarius",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "zodiac-scorpio",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "zodiac-taurus",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "zodiac-virgo",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "zoom-in",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "zoom-out",
    category: "actions",
  } as IconCatalogEntry,
  {
    name: "openid",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "saml",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "ldap",
    category: "security",
  } as IconCatalogEntry,
  {
    name: "microsoft-entra",
    category: "symbols",
  } as IconCatalogEntry,
  {
    name: "google-workspace",
    category: "symbols",
  } as IconCatalogEntry,
];
/**
 * Immutable public icon directory.
 */
export const ICON_CATALOG: readonly Readonly<IconCatalogEntry>[] = Object.freeze(
  entries.map((entry) => Object.freeze(entry)),
);
