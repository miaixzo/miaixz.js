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
 * Defines business-intent descriptors used to select consistent UI presentation.
 */

import type { IconName } from "@miaixz/icons";
import type { Intent } from "./types.js";

/**
 * Defines the presentation metadata for one product intent.
 */
export interface IntentDefinition {
  /**
   * Localized message key.
   */
  readonly labelKey: `ui.action.${Exclude<Intent, "add-member" | "reset-password"> | "enroll" | "recover"}`;
  /**
   * Framework icon name.
   */
  readonly icon: IconName;
  /**
   * Semantic visual tone.
   */
  readonly tone: "neutral" | "brand" | "danger";
}

/**
 * Freezes labels, icons, and tones for product intents.
 *
 * @public
 */
export const intentDefinitions: Readonly<Record<Intent, IntentDefinition>> = Object.freeze({
  create: {
    labelKey: "ui.action.create",
    icon: "add",
    tone: "brand",
  },
  edit: {
    labelKey: "ui.action.edit",
    icon: "pencil",
    tone: "neutral",
  },
  view: {
    labelKey: "ui.action.view",
    icon: "eye",
    tone: "neutral",
  },
  import: {
    labelKey: "ui.action.import",
    icon: "upload",
    tone: "neutral",
  },
  export: {
    labelKey: "ui.action.export",
    icon: "download",
    tone: "neutral",
  },
  copy: {
    labelKey: "ui.action.copy",
    icon: "copy",
    tone: "neutral",
  },
  refresh: {
    labelKey: "ui.action.refresh",
    icon: "refresh-cw",
    tone: "neutral",
  },
  validate: {
    labelKey: "ui.action.validate",
    icon: "shield-check",
    tone: "neutral",
  },
  configure: {
    labelKey: "ui.action.configure",
    icon: "settings",
    tone: "neutral",
  },
  invite: {
    labelKey: "ui.action.invite",
    icon: "user-plus",
    tone: "neutral",
  },
  "add-member": {
    labelKey: "ui.action.enroll",
    icon: "user-plus",
    tone: "neutral",
  },
  "reset-password": {
    labelKey: "ui.action.recover",
    icon: "key-round",
    tone: "neutral",
  },
  "enter-tenant": {
    labelKey: "ui.action.enter-tenant",
    icon: "log-in",
    tone: "neutral",
  },
  enable: {
    labelKey: "ui.action.enable",
    icon: "circle-check",
    tone: "neutral",
  },
  disable: {
    labelKey: "ui.action.disable",
    icon: "ban",
    tone: "danger",
  },
  freeze: {
    labelKey: "ui.action.freeze",
    icon: "snowflake",
    tone: "danger",
  },
  archive: {
    labelKey: "ui.action.archive",
    icon: "archive",
    tone: "danger",
  },
  revoke: {
    labelKey: "ui.action.revoke",
    icon: "shield-x",
    tone: "danger",
  },
  delete: {
    labelKey: "ui.action.delete",
    icon: "delete",
    tone: "danger",
  },
  save: {
    labelKey: "ui.action.save",
    icon: "save",
    tone: "brand",
  },
  submit: {
    labelKey: "ui.action.submit",
    icon: "send",
    tone: "brand",
  },
  publish: {
    labelKey: "ui.action.publish",
    icon: "rocket",
    tone: "brand",
  },
  cancel: {
    labelKey: "ui.action.cancel",
    icon: "circle-x",
    tone: "neutral",
  },
  close: {
    labelKey: "ui.action.close",
    icon: "close",
    tone: "neutral",
  },
  back: {
    labelKey: "ui.action.back",
    icon: "arrow-left",
    tone: "neutral",
  },
  favorite: {
    labelKey: "ui.action.favorite",
    icon: "star",
    tone: "neutral",
  },
  more: {
    labelKey: "ui.action.more",
    icon: "more-horizontal",
    tone: "neutral",
  },
});

/**
 * Reads one immutable intent definition.
 *
 * @param intent - Shared product intent.
 * @returns The matching intent definition.
 * @public
 */
export function getIntentDefinition(intent: Intent): IntentDefinition {
  return intentDefinitions[intent];
}
