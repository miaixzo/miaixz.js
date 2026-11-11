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
 * Owns current-row visual location within a single Table instance.
 */
import { useEffect, useRef, type RefObject } from "react";

/**
 * Tracks pointer and keyboard location without changing business selection.
 * @param tableRef Owning table element.
 * @param enabled Whether uncontrolled row location is enabled.
 * @param onChange Optional notification for a newly located data row.
 */
export function useTableRowLocation(
  tableRef: RefObject<HTMLTableElement | null>,
  enabled: boolean,
  onChange: ((row: HTMLTableRowElement) => void) | undefined,
) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    const table = tableRef.current;
    if (!enabled || !table) return;
    let current: HTMLTableRowElement | null = null;
    /**
     * Locates a direct data row and leaves nested tables and empty rows alone.
     * @param event Captured click or focus event.
     */
    const locate = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const row = event.target.closest<HTMLTableRowElement>("tbody > tr");
      if (
        !row ||
        row.closest("table") !== table ||
        row.matches(
          '[aria-disabled="true"], [data-disabled="true"], [data-current-controlled], [data-table-state-row]',
        ) ||
        row.querySelector(':scope > [data-empty="true"], :scope > .miaixz-table-empty')
      )
        return;
      if (current === row) return;
      if (current && !current.hasAttribute("data-current-controlled"))
        current.removeAttribute("data-current-row");
      current = row;
      row.setAttribute("data-current-row", "true");
      onChangeRef.current?.(row);
    };
    table.addEventListener("click", locate, { capture: true });
    table.addEventListener("focusin", locate, { capture: true });
    return () => {
      table.removeEventListener("click", locate, { capture: true });
      table.removeEventListener("focusin", locate, { capture: true });
      if (current && !current.hasAttribute("data-current-controlled"))
        current.removeAttribute("data-current-row");
    };
  }, [tableRef, enabled]);
}
