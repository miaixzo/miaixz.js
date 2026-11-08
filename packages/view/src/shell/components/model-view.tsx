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
 * Renders format-neutral document models without reparsing source bytes.
 */

import {
  isSpreadsheetRenderDocument,
  type ViewerWarning,
  type ViewerDocument,
} from "../../shared/contracts/document.js";
import { DrawingView } from "./drawing-view.js";
import { SpreadsheetView } from "./spreadsheet-view.js";
import type { SpreadsheetViewOptions } from "../file/file-view.types.js";

/**
 * Renders a framework model without reparsing source bytes.
 *
 * @param root0 - Model and zoom properties supplied by the viewer shell.
 * @param root0.document - Format-neutral document model to render.
 * @param root0.scale - Current visual scale applied by the shell.
 * @param root0.spreadsheetOptions - Workbook-specific view configuration.
 * @param root0.maxSpreadsheetCanvasBytes - Maximum spreadsheet Canvas backing-store bytes.
 * @param root0.spreadsheetDiagnostics - Parser diagnostics forwarded to the workbook host.
 * @returns Rendered React element for the document model.
 */
export function ModelView({
  document,
  scale,
  spreadsheetOptions,
  maxSpreadsheetCanvasBytes,
  spreadsheetDiagnostics,
}: {
  readonly document: ViewerDocument;
  readonly scale: number;
  readonly spreadsheetOptions?: SpreadsheetViewOptions;
  readonly maxSpreadsheetCanvasBytes?: number;
  readonly spreadsheetDiagnostics?: readonly ViewerWarning[];
}): React.ReactElement {
  const style = { transform: `scale(${scale})`, transformOrigin: "top center" };
  switch (document.kind) {
    case "media":
      if (document.mediaKind === "image") {
        return (
          <img
            alt={document.title}
            className="miaixz-preview-media"
            src={document.sourceUrl}
            style={style}
          />
        );
      }
      if (document.mediaKind === "audio") {
        return (
          <audio
            aria-label={document.title}
            className="miaixz-preview-audio"
            controls
            src={document.sourceUrl}
          />
        );
      }
      return (
        <video
          aria-label={document.title}
          className="miaixz-preview-video"
          controls
          src={document.sourceUrl}
        />
      );
    case "text":
      return (
        <pre className="miaixz-preview-text" style={style}>
          {document.content}
        </pre>
      );
    case "archive":
      return (
        <table className="miaixz-preview-table" style={style}>
          <thead>
            <tr>
              <th>Path</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            {document.entries.map((entry) => (
              <tr key={entry.path}>
                <td>{entry.path}</td>
                <td>{entry.directory ? "—" : entry.uncompressedSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    case "binary":
      return (
        <section className="miaixz-preview-binary" style={style}>
          <h2>{document.title}</h2>
          <dl>
            {document.summary.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      );
    case "scene":
      return (
        <section className="miaixz-preview-scene" style={style}>
          <h2>{document.title}</h2>
          <p>
            {document.nodes.length} objects · {document.meshes.length} meshes
          </p>
          <ul>
            {document.nodes.map((node) => (
              <li key={node.id}>{node.name}</li>
            ))}
          </ul>
          {document.preview === undefined ? null : (
            <ModelView document={document.preview} scale={1} />
          )}
        </section>
      );
    case "flow":
      return (
        <article className="miaixz-preview-flow" style={style}>
          {document.sections.map((section) => (
            <section key={section.id}>
              {section.title === undefined ? null : <h2>{section.title}</h2>}
              <p>{section.text}</p>
            </section>
          ))}
        </article>
      );
    case "spreadsheet": {
      if (isSpreadsheetRenderDocument(document)) {
        return (
          <SpreadsheetView
            document={document}
            {...(spreadsheetDiagnostics === undefined
              ? {}
              : { diagnostics: spreadsheetDiagnostics })}
            {...(spreadsheetOptions === undefined ? {} : { options: spreadsheetOptions })}
            key={`${document.id}:${String(spreadsheetOptions?.initialSheet ?? "active")}`}
            {...(maxSpreadsheetCanvasBytes === undefined ? {} : { maxSpreadsheetCanvasBytes })}
            scale={scale}
          />
        );
      }
      return (
        <section className="miaixz-preview-workbook" style={style}>
          {document.sheets.map((sheet) => {
            const drawings = document.drawings.filter(
              (drawing) => drawing.sheetId === sheet.id || drawing.sheetName === sheet.name,
            );
            return (
              <article className="miaixz-preview-sheet" key={sheet.id}>
                <h2>{sheet.name}</h2>
                {drawings.map((drawing) => (
                  <DrawingView
                    className="miaixz-preview-sheet-drawing"
                    key={drawing.id}
                    scene={drawing}
                  />
                ))}
              </article>
            );
          })}
        </section>
      );
    }
    case "drawing":
      return (
        <div className="miaixz-preview-drawing-frame" style={style}>
          <DrawingView scene={document} />
        </div>
      );
    case "paged":
      return (
        <section className="miaixz-preview-pages" style={style}>
          {document.pages.map((page) => (
            <article
              className="miaixz-preview-page"
              key={page.id}
              style={{ aspectRatio: `${page.width}/${page.height}` }}
            >
              {page.drawing === undefined ? null : (
                <DrawingView className="miaixz-preview-page-drawing" scene={page.drawing} />
              )}
              {page.drawing !== undefined || page.text === "" ? null : (
                <p className="miaixz-preview-page-text">{page.text}</p>
              )}
            </article>
          ))}
        </section>
      );
  }
}
