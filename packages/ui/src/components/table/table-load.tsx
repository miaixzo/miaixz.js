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
 * Shares asynchronous table presentation across TableContainer and Datagrid.
 */

import { createContext, type ReactNode } from "react";

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { Hidden } from "../hidden/hidden.js";
import { Stage } from "../stage/stage.js";
import { StageLoading } from "../stage/stage-loading.js";
import type { TableLoadState } from "./table.types.js";

/**
 * State supplied by the surrounding asynchronous table container.
 */
export const TableLoadContext = createContext<
  { readonly state: TableLoadState; readonly emptyLabel: string } | undefined
>(undefined);

/**
 * Resolves whether the current query has a result to render.
 * @param state - Caller-owned loading state.
 * @returns The available result, if any.
 */
export function getTableResult(state: TableLoadState): "rows" | "empty" | undefined {
  if (state.status === "ready") return "rows";
  if (state.status === "empty") return "empty";
  if (state.status === "refreshing" || state.status === "error") return state.result;
  return undefined;
}

/**
 * Renders the shared error and optional retry action within the table region.
 * @param props - Failed request state and its retained result.
 * @returns Inline recovery controls.
 */
export function TableLoadError({
  state,
}: {
  readonly state: Extract<TableLoadState, { status: "error" }>;
}) {
  const { t } = useMiaixzLocale();
  return (
    <Stage
      status="error"
      presentation="inline"
      title={t(state.result ? "ui.table.refreshFailed" : "ui.table.loadFailed")}
      description={state.message}
      loadingLabel={t("ui.loading")}
      retryLabel={t("ui.action.retry")}
      {...(state.onRetry === undefined ? {} : { onRetry: state.onRetry })}
    />
  );
}

/**
 * Retains the scroll viewport during a refresh and scopes the feedback to the table.
 * @param props - Current load state and the table viewport.
 * @returns Shared loading region with the caller-owned table.
 */
export function TableLoadRegion({
  state,
  children,
}: {
  readonly state: TableLoadState;
  readonly children: ReactNode;
}) {
  const { t } = useMiaixzLocale();
  const label = "label" in state ? (state.label ?? t("ui.loading")) : t("ui.loading");
  return (
    <TableLoadContext.Provider value={{ state, emptyLabel: t("ui.table.empty") }}>
      <Hidden role="status">{state.status === "loading" ? label : ""}</Hidden>
      <StageLoading
        active={state.status === "refreshing"}
        label={label}
        className="miaixz-table-load"
        slotProps={{ surface: { className: "miaixz-table-load-surface" } }}
      >
        {state.status === "error" && state.result && <TableLoadError state={state} />}
        {children}
      </StageLoading>
    </TableLoadContext.Provider>
  );
}
