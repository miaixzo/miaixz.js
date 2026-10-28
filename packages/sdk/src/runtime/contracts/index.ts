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
 * Exports module manifests, lifecycle, routes, host capabilities, and bridge contracts.
 */

export type {
  MiaixzDirectHostBridgeOptions,
  MiaixzHostAdapter,
  MiaixzHostBridge,
  MiaixzNavigationRequest,
} from "./host-context.js";
export type {
  MiaixzIntegratedModule,
  MiaixzModuleHandle,
  MiaixzModuleMountContext,
} from "./lifecycle.js";
export {
  MIAIXZ_MODULE_PROTOCOL_VERSION,
  isMiaixzHostVersionCompatible,
  parseMiaixzModuleManifest,
} from "./module-manifest.js";
export type {
  MiaixzHostCapability,
  MiaixzModuleKind,
  MiaixzModuleManifest,
  MiaixzModuleManifestParseOptions,
} from "./module-manifest.js";
export type { MiaixzModuleNavigationItem } from "./navigation.js";
export type {
  MiaixzBridgeEnvelope,
  MiaixzPostMessageChildOptions,
  MiaixzPostMessageHost,
  MiaixzPostMessageHostLimits,
  MiaixzPostMessageHostOptions,
} from "./post-message.js";
export type { MiaixzModuleRoute } from "./route.js";
