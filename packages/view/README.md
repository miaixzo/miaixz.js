# @miaixz/view

[English](./README.md) | [简体中文](./README_CN.md)

`@miaixz/view` is a self-hosted React file viewer with automatic format detection. It does not use PDF.js, ONLYOFFICE, remote conversion services, CDN scripts, or third-party runtime parsers.

## Install

```bash
npm install @miaixz/view @miaixz/icons react react-dom
```

Import the icon and viewer styles once, then pass a `File`, `Blob`, URL, `ArrayBuffer`, or `Uint8Array` directly to `FileView`. The viewer has local style fallbacks and does not require `@miaixz/ui` or `@miaixz/sdk`:

```tsx compile
import "@miaixz/icons/styles.css";
import "@miaixz/view/styles.css";
import { FileView } from "@miaixz/view";

export function Preview({ file }: { file: File }) {
  return <FileView source={file} />;
}
```

Applications that already use `@miaixz/sdk` and `@miaixz/ui` can connect the viewer to their shared locale and appearance state. Those two packages are optional integrations and are not required by the standalone viewer:

```tsx compile
import "@miaixz/icons/styles.css";
import "@miaixz/ui/styles.css";
import "@miaixz/view/styles.css";
import { createMiaixzAppearanceManager } from "@miaixz/sdk/appearance";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { MiaixzLocaleProvider, Theme } from "@miaixz/ui";
import { FileView } from "@miaixz/view";

const appearance = createMiaixzAppearanceManager({ appId: "file-preview" });
const i18n = createMiaixzI18n({ locale: "en-US", fallbackLocale: "en-US" });

export function IntegratedPreview({ file }: { file: File }) {
  return (
    <MiaixzLocaleProvider i18n={i18n}>
      <Theme appearance={appearance}>
        <FileView source={file} />
      </Theme>
    </MiaixzLocaleProvider>
  );
}
```

For signed remote URLs, metadata and authorized request options can be supplied without selecting a viewer manually:

```tsx compile
import { FileView } from "@miaixz/view";

<FileView
  source={{
    url: "/files/opaque-id",
    name: "quarterly-flow.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    headers: { Authorization: "Bearer …" },
  }}
/>;
```

Applications with private storage or companion files can provide one policy boundary for both the primary source and related-resource requests:

```tsx compile
import {
  FileView,
  type FileResourceProvider,
  type FileViewSource,
  type FileViewSourceDescriptor,
  type RandomAccessResource,
} from "@miaixz/view";

declare const fileReference: FileViewSource;
declare const myStorage: {
  open(
    source: FileViewSource | FileViewSourceDescriptor,
    signal: AbortSignal,
  ): Promise<RandomAccessResource>;
  openRelated(path: string, signal: AbortSignal): Promise<RandomAccessResource | undefined>;
};

const resourceProvider: FileResourceProvider = {
  async open(source, signal) {
    return myStorage.open(source, signal);
  },
  async resolveRelated(request, signal) {
    return myStorage.openRelated(request.path, signal);
  },
};

<FileView resourceProvider={resourceProvider} source={fileReference} />;
```

`FileViewHandle` exposes stable `zoomIn`, `zoomOut`, `resetZoom`, `retry`, `dispose`, `getState`, and `getElement` commands. The legacy `src` alias remains for the 0.x migration window; new code should use `source`.

## Current built-in pipeline

- The generated manifest covers all 274 extensions and 17 driver families in the audited reference baseline.
- Filename, MIME, signature, and container evidence are scored together; callers no longer pass `kind`.
- The current installable modules are PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, ODT, ODS, ODP, EPUB, XPS/OXPS, OFD, ZIP, RAR, JPEG, PNG, GIF, SVG, MP3, MP4, Draw.io, XMind, GeoJSON/TopoJSON, DXF, OBJ, and WASM.
- Every module owns a `format.json`, a driver boundary, and a generated lazy-loader entry. Deleting a module directory and regenerating removes that format without editing runtime code.
- XLSX parsing runs in a dedicated module Worker and includes saved row/column geometry, merged cells, panes, resolved styles and number formats, sparse cells, cached formula values, all DrawingML anchor modes, recursive groups, affine transforms, theme colors, text styles, arrowheads, bounded embedded pictures, local EMF decoding, preset/custom geometry, connector endpoints, semantic graph data, materialized SmartArt drawings, and legacy VML drawings.
- XLSX renders one active worksheet at a time with synchronized Canvas cell styling, selectable HTML text, DrawingML SVG, sheet tabs, current-sheet search, and display-value copying. A runtime without module Worker support returns `UNSUPPORTED_RUNTIME`; it never falls back to blocking main-thread parsing.
- XLSX defaults to the workbook's saved active sheet, view mode, zoom, selection, scroll origin, frozen panes, print area, page breaks, outline state, and tab color. Public sheet/view options are explicit overrides rather than replacement defaults.
- PPTX uses the saved presentation order and slide size, merges master/layout/slide artwork, and renders DrawingML shapes, groups, connectors, pictures, gradients, custom geometry, and materialized SmartArt on one fixed SVG canvas per slide.
- DOCX uses the saved section page geometry and Word anchor coordinates, keeps behind-text/foreground stacking, selects one Markup Compatibility branch, and renders DrawingML or selected VML flowchart objects on fixed page canvases. Unmodeled tables, wrapping, multi-section pagination, headers/footers, styles, numbering, fields, notes, or other layout-affecting parts force a named partial result.
- The complete ECMA-376 `flowChart*` preset family is shared by XLSX, PPTX, and DOCX, including connector arrows and group transforms. Unknown geometry, effect, pattern, diagram, or graphic-frame content is counted by the Office coverage ledger rather than replaced by an unreported rectangle.
- Font substitution and glyph antialiasing are the only accepted platform differences for a `complete` XLSX, PPTX, or DOCX result. Missing or approximate visible layout, color, geometry, clipping, stacking, image, drawing, or saved-view behavior must produce a named diagnostic and cannot be reported as complete.
- Legacy binary DOC and PPT are recognized-only formats and are rejected explicitly; the browser component does not invoke LibreOffice, a server converter, or a compatibility rendering path.
- Unsupported subformats return a stable rejected or partial result; metadata output is never presented as full preview support.

The generated format matrix and the tests under `tests/` are the executable support contract. An extension being recognized does not imply that every vendor-specific feature is rendered.

## Custom formats

Applications can extend the default registry without modifying `@miaixz/view`. A custom format declares its identity, extensions, MIME types, and lazy driver, then passes that registry to `FileView`:

```tsx compile
import { createDefaultRegistry, FileView, VERSION, type ViewerDriver } from "@miaixz/view";

const registry = createDefaultRegistry();
const file = new File([], "drawing.amap", { type: "application/vnd.acme.map" });
declare const loadAcmeMapDriver: () => Promise<ViewerDriver>;

registry.registerFormat(
  {
    schemaVersion: VERSION,
    id: "acme-map",
    label: "Acme map",
    category: "geospatial",
    extensions: ["amap"],
    mimeTypes: ["application/vnd.acme.map"],
    implementation: "ready",
  },
  loadAcmeMapDriver,
);

<FileView registry={registry} source={file} />;
```

Custom identifiers are ordinary stable strings. Extension and MIME matching join the same detector used by built-in modules; custom drivers receive the same bounded resources, cancellation signal, progress channel, and document-model contract.

## Specialized entries

`PdfView`, `OfficeView`, and `ImageView` remain available for applications that prefer explicit component names. `PdfView` and `OfficeView` are thin adapters over the same local `FileView` pipeline and never activate a remote viewer.

```tsx compile
import { OfficeView, PdfView } from "@miaixz/view";

const pdfBytes = new Uint8Array();
const workbookFile = new File([], "workflow.xlsx");

<PdfView source={pdfBytes} />;
<OfficeView name="workflow.xlsx" source={workbookFile} />;
```

Workbook presentation can be configured without changing the parsed document:

```tsx compile
import { OfficeView } from "@miaixz/view";

declare const workbookFile: File;

<OfficeView
  initialSheet="System flow"
  name="workflow.xlsx"
  onSheetChange={(sheet) => console.log(sheet.id, sheet.name)}
  showGridLines
  showSheetTabs
  source={workbookFile}
  spreadsheetView="sheet"
/>;
```

`initialSheet` accepts a visible sheet id, an exact visible sheet name, or a zero-based visible-sheet index. Hidden sheets are parsed for coverage but are not exposed as tabs. Invalid selections fall back to the saved active sheet and emit `XLSX_INITIAL_SHEET_NOT_FOUND` through `onDiagnostics`.

## Public entries

| Entry          | Kind       |
| -------------- | ---------- |
| `.`            | JavaScript |
| `./image`      | JavaScript |
| `./pdf`        | JavaScript |
| `./office`     | JavaScript |
| `./errors`     | JavaScript |
| `./shared`     | JavaScript |
| `./runtime`    | JavaScript |
| `./styles.css` | CSS        |

The package exports file-preview components only and deliberately has no page-layout `View` export.

## Security boundary

All parsing is treated as untrusted input. Remote bodies and decompression output are counted while
streaming, stalled streams are cancelled, and one document-level guard bounds cumulative expanded
bytes, text, pages, drawing objects, vector records, memory estimates, nesting, and total task time.
XML entities and excessive depth are rejected; ZIP paths, directory metadata, entry sizes, and
compression ratios are validated. Spreadsheet sheets/cells/styles and Canvas backing stores retain
their dedicated budgets. Remote requests use only caller-supplied authorization, embedded SVG
scripts and external resources are blocked, macros are never executed, and public errors do not
retain source bytes, credentials, local paths, or internal stack traces.

Toolbar visibility is not an authorization boundary. Applications must still enforce permissions when issuing URLs or enabling download and print actions.
