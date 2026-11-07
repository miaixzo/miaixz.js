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
 * Defines the public properties, slots, labels, and handle of FileView.
 */

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import type { ParseOutcome } from "../../shared/contracts/document.js";
import type { ViewerProgress } from "../../shared/contracts/driver.js";
import type { ResourceBudget } from "../../shared/contracts/resource-budget.js";
import type { FileResourceProvider, FileViewSource } from "../../shared/contracts/source.js";
import type { ViewerError } from "../../shared/errors/viewer-error.js";
import type { ViewerControllerState } from "../../runtime/viewer-controller.js";
import type { DriverRegistry } from "../../runtime/driver-registry.js";

/**
 * Summarizes one visible worksheet without exposing its internal cell model.
 */
export interface SpreadsheetSheetSummary {
  readonly id: string;
  readonly name: string;
  readonly index: number;
}

/**
 * Configures workbook-specific presentation and diagnostics.
 */
export interface SpreadsheetViewOptions {
  readonly initialSheet?: string | number;
  readonly spreadsheetView?: "sheet" | "page";
  readonly showGridLines?: boolean;
  readonly showSheetTabs?: boolean;
  readonly onSheetChange?: (sheet: SpreadsheetSheetSummary) => void;
  readonly onDiagnostics?: (
    diagnostics: readonly import("../../shared/contracts/document.js").ViewerWarning[],
  ) => void;
}

/**
 * Defines localized labels used by the unified viewer shell.
 */
export interface FileViewLabels {
  readonly toolbar: string;
  readonly loading: string;
  readonly error: string;
  readonly unsupported: string;
  readonly zoomIn: string;
  readonly zoomOut: string;
  readonly resetZoom: string;
}

/**
 * Defines native properties for stable shell slots.
 */
export interface FileViewSlotProps {
  readonly toolbar?: Omit<ComponentPropsWithoutRef<"div">, "children" | "role" | "aria-label">;
  readonly stage?: Omit<ComponentPropsWithoutRef<"div">, "children">;
  readonly status?: Omit<ComponentPropsWithoutRef<"div">, "children" | "role" | "aria-live">;
}

/**
 * Exposes stable viewer commands without leaking parser implementation details.
 */
export interface FileViewHandle {
  /**
   * Reads the currently mounted viewer root without exposing parser-owned elements.
   * @returns Root element, or null before mount or after unmount.
   */
  getElement(): HTMLDivElement | null;
  /**
   * Reads the document controller's current lifecycle snapshot.
   * @returns Current controller state.
   */
  getState(): ViewerControllerState;
  /**
   * Increases viewer zoom within the renderer's supported limits.
   * @returns No return value.
   */
  zoomIn(): void;
  /**
   * Decreases viewer zoom within the renderer's supported limits.
   * @returns No return value.
   */
  zoomOut(): void;
  /**
   * Restores the viewer's default zoom level.
   * @returns No return value.
   */
  resetZoom(): void;
  /**
   * Starts a new attempt to open the currently configured source.
   * @returns No return value.
   */
  retry(): void;
  /**
   * Stops the active document session and releases its resources.
   * @returns No return value.
   */
  dispose(): void;
}

/**
 * Configures a local or remote automatic file preview.
 */
interface FileViewBaseProps
  extends
    Omit<ComponentPropsWithoutRef<"div">, "children" | "onError" | "onLoad" | "onProgress">,
    SpreadsheetViewOptions {
  /**
   * Supplies a filename when the source does not carry one.
   */
  readonly name?: string;
  /**
   * Supplies a trusted MIME hint when available.
   */
  readonly mimeType?: string;
  /**
   * Supplies authorized headers for a remote source.
   */
  readonly httpHeaders?: Readonly<Record<string, string>>;
  /**
   * Selects remote request credential behavior.
   */
  readonly credentials?: RequestCredentials;
  /**
   * Tightens built-in processing limits.
   */
  readonly budget?: Partial<ResourceBudget>;
  /**
   * Replaces the default browser resource provider for authenticated stores and related files.
   */
  readonly resourceProvider?: FileResourceProvider;
  /**
   * Supplies built-in overrides or application-defined file formats.
   */
  readonly registry?: DriverRegistry;
  /**
   * Overrides built-in English labels.
   */
  readonly labels?: Partial<FileViewLabels>;
  /**
   * Adds application-owned toolbar actions.
   */
  readonly actions?: ReactNode;
  /**
   * Passes native properties to stable shell slots.
   */
  readonly slotProps?: FileViewSlotProps;
  /**
   * Receives monotonic opening and parsing progress.
   */
  readonly onProgress?: (progress: ViewerProgress) => void;
  /**
   * Receives a completed or explicitly partial parse result.
   */
  readonly onLoad?: (outcome: Exclude<ParseOutcome, { readonly status: "rejected" }>) => void;
  /**
   * Receives sanitized failures.
   */
  readonly onError?: (error: ViewerError) => void;
}

/**
 * Configures an automatic file preview with one canonical source.
 */
export interface FileViewProps extends FileViewBaseProps {
  /**
   * Supplies a File, Blob, remote descriptor, URL, ArrayBuffer, or Uint8Array.
   */
  readonly source: FileViewSource;
}
