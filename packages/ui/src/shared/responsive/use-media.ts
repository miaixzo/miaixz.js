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
 * Implements the use media React hook.
 */

import { useMemo, useSyncExternalStore } from "react";

import { getMediaStore } from "./media-store.js";
import type { UseMediaOptions } from "./media-store.js";

export type { UseMediaOptions } from "./media-store.js";

/**
 * Subscribes to a media query with a deterministic server snapshot.
 *
 * @param query - Media query string.
 * @param options - Server fallback options.
 * @returns Whether the query currently matches.
 */
export function useMedia(query: string, options: UseMediaOptions = {}): boolean {
  const defaultMatches = options.defaultMatches ?? false;
  const enabled = options.enabled ?? true;
  const store = useMemo(
    () => getMediaStore(query, { defaultMatches, enabled }),
    [query, defaultMatches, enabled],
  );
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => defaultMatches);
}
