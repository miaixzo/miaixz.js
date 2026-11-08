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
 * Exposes the primary public API of the file-viewer package.
 */

export { FileView } from "./shell/file/file-view.js";
export type {
  FileViewHandle,
  FileViewLabels,
  FileViewProps,
  FileViewSlotProps,
  SpreadsheetSheetSummary,
  SpreadsheetViewOptions,
} from "./shell/file/file-view.types.js";
export { MiaixzViewError } from "./shared/errors/view-error.js";
export type { MiaixzViewErrorCode } from "./shared/errors/view-error.js";
export { ViewerError } from "./shared/errors/viewer-error.js";
export type {
  ViewerErrorCategory,
  ViewerErrorCode,
  ViewerResourceLimit,
  ViewerErrorStage,
  ViewerRecoveryAction,
} from "./shared/errors/viewer-error.js";
export { browserBaseline, detectBrowserSupport } from "./runtime/browser-support.js";
export type { BrowserSupport } from "./runtime/browser-support.js";
export type {
  DocumentEvent,
  ViewerCapabilities,
  ViewerCommand,
} from "./shared/contracts/capability.js";
export {
  WORKER_PROTOCOL_VERSION,
  assertWorkerProtocolVersion,
} from "./workers/protocol/worker-protocol.js";
export type { WorkerRequest, WorkerResponse } from "./workers/protocol/worker-protocol.js";
export { isSpreadsheetRenderDocument } from "./shared/contracts/document.js";
export {
  defaultResourceBudget,
  hardResourceBudget,
  resolveResourceBudget,
} from "./runtime/resource-budget.js";
export type { ResourceBudget } from "./shared/contracts/resource-budget.js";
export { inspectZipArchive, readZipEntry, ZipArchiveError } from "./codecs/archive/zip-codec.js";
export type {
  ZipArchiveBudget,
  ZipArchiveEntry,
  ZipArchiveErrorReason,
  ZipArchiveInspectOptions,
  ZipEntryReadOptions,
} from "./codecs/archive/zip-codec.js";
export { ViewerController, openViewerDocument } from "./runtime/viewer-controller.js";
export type {
  OpenDocumentOptions,
  OpenedDocument,
  ViewerControllerState,
} from "./runtime/viewer-controller.js";
export {
  detectFormat,
  getFormatDescriptors,
  getFormatManifest,
  getFormatParityRecords,
} from "./runtime/detect-format.js";
export { createDefaultRegistry } from "./runtime/default-registry.js";
export { DriverRegistry } from "./runtime/driver-registry.js";
export { DefaultFileResourceProvider } from "./runtime/file-source.js";
export type {
  FormatDescriptor,
  FormatDecision,
  FormatDriverId,
  FormatEvidence,
  FormatManifestRecord,
  FormatParityRecord,
  SupportLevel,
} from "./shared/contracts/format.js";
export type {
  FileResourceProvider,
  FileViewSource,
  FileViewSourceDescriptor,
  RandomAccessResource,
  RelatedResourceRequest,
  RemoteFileSource,
} from "./shared/contracts/source.js";
export type {
  DriverContext,
  ProbeContext,
  ProbeResult,
  ViewerDriver,
  ViewerProgress,
} from "./shared/contracts/driver.js";
export type {
  ArchiveDocument,
  BinaryDocument,
  DiagramEdge,
  DiagramGraph,
  DiagramNode,
  DiagramWarning,
  DrawingScene,
  DrawingGradientFill,
  DrawingGradientStop,
  DrawingShape,
  FlowDocument,
  MediaDocument,
  OfficeCoverageEntry,
  OfficeCoverageLedger,
  PagedDocument,
  ParseOutcome,
  SkippedFeature,
  SceneDocument,
  SceneMesh,
  SceneNode,
  Rectangle,
  SpreadsheetBorderSide,
  SpreadsheetBorderStyle,
  SpreadsheetCellStyle,
  SpreadsheetColumnLayout,
  SpreadsheetCoverageEntry,
  SpreadsheetCoverageLedger,
  SpreadsheetDocument,
  SpreadsheetFeatureId,
  SpreadsheetFontStyle,
  SpreadsheetPane,
  SpreadsheetRange,
  SpreadsheetRenderCell,
  SpreadsheetRenderDocument,
  SpreadsheetRenderSheet,
  SpreadsheetRowLayout,
  SpreadsheetSheet,
  SpreadsheetSheetLayout,
  SpreadsheetStyleTable,
  TextDocument,
  ViewerDocument,
  ViewerWarning,
} from "./shared/contracts/document.js";
export { ImageView } from "./shell/image/image-view.js";
export type {
  ImageViewLabels,
  ImageViewProps,
  ImageViewSlotProps,
} from "./shell/image/image-view.types.js";
export { OfficeView } from "./shell/office/office-view.js";
export type { OfficeViewProps } from "./shell/office/office-view.types.js";
export { PdfView } from "./shell/pdf/pdf-view.js";
export type { PdfViewProps } from "./shell/pdf/pdf-view.types.js";

export { VERSION } from "./version.js";
