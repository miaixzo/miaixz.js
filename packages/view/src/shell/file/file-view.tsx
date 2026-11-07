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
 * Implements the unified interactive file preview component.
 */

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Icon } from "@miaixz/icons";

import { ViewerController, type ViewerControllerState } from "../../runtime/viewer-controller.js";
import { resolveResourceBudget } from "../../runtime/resource-budget.js";
import { isSpreadsheetRenderDocument } from "../../shared/contracts/document.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";
import { clamp, classNames } from "../util/class-names.js";
import { useLatestRef } from "../hooks/use-latest-ref.js";
import { ModelView } from "../components/model-view.js";
import type { FileViewHandle, FileViewLabels, FileViewProps } from "./file-view.types.js";

const defaultLabels: FileViewLabels = {
  toolbar: "File preview controls",
  loading: "Opening file",
  error: "Unable to preview this file",
  unsupported: "This file can only be inspected with the current driver",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  resetZoom: "Reset zoom",
};

/**
 * Automatically detects and previews a local or remote file.
 */
export const FileView = forwardRef<FileViewHandle, FileViewProps>(function FileView(
  {
    source,
    name,
    mimeType,
    httpHeaders,
    credentials,
    budget,
    resourceProvider,
    registry,
    labels: labelOverrides,
    actions,
    slotProps,
    initialSheet,
    spreadsheetView,
    showGridLines,
    showSheetTabs,
    onSheetChange,
    onDiagnostics,
    onProgress,
    onLoad,
    onError,
    className,
    ...rootProps
  },
  ref,
) {
  const controller = useMemo(
    () =>
      new ViewerController({
        ...(budget === undefined ? {} : { budget }),
        ...(resourceProvider === undefined ? {} : { resourceProvider }),
        ...(registry === undefined ? {} : { registry }),
      }),
    [budget, registry, resourceProvider],
  );
  const [state, setState] = useState<ViewerControllerState>(controller.getState());
  const [scale, setScale] = useState(1);
  const [activeSpreadsheetSheetId, setActiveSpreadsheetSheetId] = useState<string>();
  const [retryVersion, setRetryVersion] = useState(0);
  const maxSpreadsheetCanvasBytes = useMemo(
    () => resolveResourceBudget(budget).maxSpreadsheetCanvasBytes,
    [budget],
  );
  const elementRef = useRef<HTMLDivElement>(null);
  const labels = { ...defaultLabels, ...labelOverrides };
  const onProgressRef = useLatestRef(onProgress);
  const onLoadRef = useLatestRef(onLoad);
  const onErrorRef = useLatestRef(onError);
  const spreadsheetDocument =
    state.status === "ready" &&
    state.document.kind === "spreadsheet" &&
    isSpreadsheetRenderDocument(state.document)
      ? state.document
      : undefined;
  const visibleSpreadsheetSheets =
    spreadsheetDocument?.sheets.filter((sheet) => sheet.state === "visible") ?? [];
  const requestedInitialSheet =
    typeof initialSheet === "number"
      ? visibleSpreadsheetSheets[initialSheet]
      : typeof initialSheet === "string"
        ? visibleSpreadsheetSheets.find(
            (sheet) => sheet.id === initialSheet || sheet.name === initialSheet,
          )
        : undefined;
  const activeSpreadsheetSheet =
    visibleSpreadsheetSheets.find((sheet) => sheet.id === activeSpreadsheetSheetId) ??
    requestedInitialSheet ??
    visibleSpreadsheetSheets.find((sheet) => sheet.id === spreadsheetDocument?.activeSheetId) ??
    visibleSpreadsheetSheets[0];
  const savedSpreadsheetZoom =
    activeSpreadsheetSheet?.layout.viewMode === "pageLayout"
      ? activeSpreadsheetSheet.layout.zoomScalePageLayout
      : (activeSpreadsheetSheet?.layout.zoomScale ?? 100);
  const displayedZoom = scale * (savedSpreadsheetZoom / 100);

  /**
   * Increases viewer scale by one quarter, capped at four times the default scale.
   *
   * @returns No return value.
   */
  const zoomIn = (): void => setScale((value) => clamp(value + 0.25, 0.25, 4));
  /**
   * Decreases viewer scale by one quarter, capped at one quarter of the default scale.
   *
   * @returns No return value.
   */
  const zoomOut = (): void => setScale((value) => clamp(value - 0.25, 0.25, 4));
  /**
   * Restores the default viewer scale of one.
   *
   * @returns No return value.
   */
  const resetZoom = (): void => setScale(1);

  useImperativeHandle(
    ref,
    () => ({
      getElement: () => elementRef.current,
      getState: () => controller.getState(),
      zoomIn,
      zoomOut,
      resetZoom,
      retry: () => setRetryVersion((value) => value + 1),
      dispose: () => controller.dispose(),
    }),
    [controller],
  );

  useEffect(
    () =>
      controller.subscribe((nextState) => {
        setState(nextState);
        if (nextState.status === "loading") onProgressRef.current?.(nextState.progress);
        else if (nextState.status === "ready") onLoadRef.current?.(nextState.outcome);
        else if (nextState.status === "error") onErrorRef.current?.(nextState.error);
      }),
    [controller, onErrorRef, onLoadRef, onProgressRef],
  );

  useEffect(() => {
    if (source === undefined || source === null) {
      onErrorRef.current?.(new ViewerError("INVALID_SOURCE", "source"));
      return undefined;
    }
    void controller.open({
      data: source,
      ...(name === undefined ? {} : { name }),
      ...(mimeType === undefined ? {} : { mimeType }),
      ...(httpHeaders === undefined ? {} : { headers: httpHeaders }),
      ...(credentials === undefined ? {} : { credentials }),
    });
    setActiveSpreadsheetSheetId(undefined);
    return undefined;
  }, [controller, credentials, httpHeaders, mimeType, name, onErrorRef, retryVersion, source]);

  useEffect(() => () => controller.dispose(), [controller]);

  return (
    <div
      {...rootProps}
      className={classNames("miaixz-preview", "miaixz-preview-file", className)}
      ref={elementRef}
    >
      <div
        {...slotProps?.toolbar}
        aria-label={labels.toolbar}
        className={classNames("miaixz-preview-toolbar", slotProps?.toolbar?.className)}
        role="toolbar"
      >
        <button
          aria-label={labels.zoomOut}
          className="miaixz-preview-command"
          disabled={scale <= 0.25}
          onClick={zoomOut}
          title={labels.zoomOut}
          type="button"
        >
          <Icon name="circle-minus" size="control" />
        </button>
        <button
          aria-label={labels.resetZoom}
          className="miaixz-preview-value miaixz-preview-command"
          onClick={resetZoom}
          title={labels.resetZoom}
          type="button"
        >
          <Icon name="rotate-ccw" size="control" />
          <span>{Math.round(displayedZoom * 100)}%</span>
        </button>
        <button
          aria-label={labels.zoomIn}
          className="miaixz-preview-command"
          disabled={scale >= 4}
          onClick={zoomIn}
          title={labels.zoomIn}
          type="button"
        >
          <Icon name="circle-plus" size="control" />
        </button>
        {actions}
      </div>
      <div
        {...slotProps?.stage}
        className={classNames("miaixz-preview-stage", slotProps?.stage?.className)}
      >
        {state.status === "ready" ? (
          <ModelView
            document={state.document}
            maxSpreadsheetCanvasBytes={maxSpreadsheetCanvasBytes}
            scale={scale}
            spreadsheetDiagnostics={state.outcome.warnings}
            spreadsheetOptions={{
              ...(initialSheet === undefined ? {} : { initialSheet }),
              ...(spreadsheetView === undefined ? {} : { spreadsheetView }),
              ...(showGridLines === undefined ? {} : { showGridLines }),
              ...(showSheetTabs === undefined ? {} : { showSheetTabs }),
              onSheetChange: (sheet) => {
                setActiveSpreadsheetSheetId(sheet.id);
                onSheetChange?.(sheet);
              },
              ...(onDiagnostics === undefined ? {} : { onDiagnostics }),
            }}
          />
        ) : null}
      </div>
      {state.status === "loading" || state.status === "error" ? (
        <div
          {...slotProps?.status}
          aria-live="polite"
          className={classNames("miaixz-preview-status", slotProps?.status?.className)}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.status === "error" ? `${labels.error} (${state.error.code})` : labels.loading}
        </div>
      ) : null}
      {state.status === "ready" && state.outcome.status === "partial" ? (
        <p className="miaixz-preview-warning">{labels.unsupported}</p>
      ) : null}
    </div>
  );
});
