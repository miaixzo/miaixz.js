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
 * Verifies format-neutral rendering and public shell controls.
 */

import { VERSION } from "../../src/version.js";

import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { DriverRegistry } from "../../src/runtime/driver-registry.js";
import type {
  DrawingScene,
  ParseOutcome,
  TextDocument,
  ViewerDocument,
} from "../../src/shared/contracts/document.js";
import type { ViewerDriver } from "../../src/shared/contracts/driver.js";
import type { FormatDescriptor } from "../../src/shared/contracts/format.js";
import { ViewerError } from "../../src/shared/errors/viewer-error.js";
import { DrawingView } from "../../src/shell/components/drawing-view.js";
import { ModelView } from "../../src/shell/components/model-view.js";
import { FileView } from "../../src/shell/file/file-view.js";
import type { FileViewHandle } from "../../src/shell/file/file-view.types.js";
import { ImageView } from "../../src/shell/image/image-view.js";
import { OfficeView } from "../../src/shell/office/office-view.js";
import { PdfView } from "../../src/shell/pdf/pdf-view.js";
import { classNames } from "../../src/shell/styles/class-names.js";
import { clampScale } from "../../src/shell/zoom/scale.js";

const drawing: DrawingScene = {
  schemaVersion: VERSION,
  id: "drawing:fixture",
  kind: "drawing",
  title: "Process drawing",
  width: 400,
  height: 240,
  shapes: [
    {
      id: "rect",
      kind: "rectangle",
      x: 10,
      y: 10,
      width: 100,
      height: 50,
      text: "A long process label that wraps",
      fill: "#FFFFFF",
      stroke: "#000000",
      cornerRadius: 8,
      transform: { a: 1, b: 0, c: 0, d: 1, e: 1, f: 2 },
      textStyle: {
        align: "center",
        bold: true,
        color: "#000000",
        fontFamily: "Arial",
        fontSize: 12,
        italic: true,
        underline: true,
        verticalAlign: "center",
      },
    },
    {
      id: "ellipse",
      kind: "ellipse",
      x: 130,
      y: 10,
      width: 80,
      height: 50,
      text: "End",
      textStyle: {
        align: "end",
        bold: false,
        color: "#111111",
        fontFamily: "Arial",
        fontSize: 10,
        italic: false,
        underline: false,
        verticalAlign: "bottom",
      },
    },
    {
      id: "line",
      kind: "line",
      x: 20,
      y: 80,
      width: 150,
      height: 20,
      startArrow: "arrow",
      endArrow: "arrow",
      strokeDasharray: "4 2",
    },
    {
      id: "path",
      kind: "path",
      x: 0,
      y: 0,
      width: 70,
      height: 40,
      path: "M 0 20 L 35 0 L 70 20 L 35 40 Z",
      text: "Decision",
    },
    {
      id: "image",
      kind: "image",
      x: 220,
      y: 10,
      width: 60,
      height: 60,
      source: "data:image/png;base64,AA==",
    },
    {
      id: "missing-image",
      kind: "image",
      x: 290,
      y: 10,
      width: 60,
      height: 60,
    },
    {
      id: "text",
      kind: "text",
      x: 10,
      y: 140,
      width: 100,
      height: 30,
      text: "Top",
    },
  ],
  edges: [],
};

/**
 * Creates a deterministic text model for shell lifecycle tests.
 *
 * @param content - Text displayed by the viewer.
 * @returns Format-neutral text document.
 */
function textDocument(content: string): TextDocument {
  return {
    schemaVersion: VERSION,
    id: "shell-text",
    kind: "text",
    title: "Shell text",
    content,
    lineCount: content === "" ? 0 : 1,
  };
}

/**
 * Creates a registry for a complete, partial, or rejected shell outcome.
 *
 * @param status - Driver outcome selected for the test.
 * @param extensions - Extensions owned by the test driver.
 * @returns Registry containing one shell driver.
 */
function shellRegistry(
  status: "complete" | "partial" | "rejected" = "complete",
  extensions: readonly string[] = ["shell"],
): DriverRegistry {
  const descriptor: FormatDescriptor = {
    schemaVersion: VERSION,
    id: "shell-test",
    label: "Shell test",
    category: "text",
    extensions,
    mimeTypes: ["text/x-shell-test", "application/pdf"],
    implementation: "ready",
  };
  const driver: ViewerDriver<TextDocument> = {
    id: "shell-test",
    /**
     * Returns the selected shell outcome.
     *
     * @returns Test outcome for the component state.
     */
    async open(): Promise<ParseOutcome<TextDocument>> {
      if (status === "rejected") {
        return { status, error: new ViewerError("PARSE_FAILED", "parse", true) };
      }
      const model = textDocument(status);
      if (status === "partial") {
        return {
          status,
          model,
          warnings: [{ code: "PARTIAL", messageKey: "partial" }],
          skipped: [{ code: "TEST" }],
        };
      }
      return { status, model, warnings: [] };
    },
  };
  const registry = new DriverRegistry();
  registry.registerFormat(descriptor, async () => driver);
  return registry;
}

describe("format-neutral model rendering", () => {
  it("renders every document model without reparsing source content", () => {
    const documents: readonly ViewerDocument[] = [
      {
        schemaVersion: VERSION,
        id: "image",
        kind: "media",
        title: "Image",
        mediaKind: "image",
        sourceUrl: "blob:image",
      },
      {
        schemaVersion: VERSION,
        id: "audio",
        kind: "media",
        title: "Audio",
        mediaKind: "audio",
        sourceUrl: "blob:audio",
      },
      {
        schemaVersion: VERSION,
        id: "video",
        kind: "media",
        title: "Video",
        mediaKind: "video",
        sourceUrl: "blob:video",
      },
      textDocument("plain text"),
      {
        schemaVersion: VERSION,
        id: "archive",
        kind: "archive",
        title: "Archive",
        entries: [
          { path: "folder/", directory: true },
          { path: "folder/file.txt", directory: false, uncompressedSize: 4 },
        ],
      },
      {
        schemaVersion: VERSION,
        id: "binary",
        kind: "binary",
        title: "Binary",
        byteLength: 4,
        format: "bin",
        summary: [{ label: "Size", value: "4" }],
      },
      {
        schemaVersion: VERSION,
        id: "scene",
        kind: "scene",
        title: "Scene",
        nodes: [{ id: "node", name: "Cube", meshId: "mesh", visible: true }],
        meshes: [{ id: "mesh", vertexCount: 3, triangleCount: 1 }],
        preview: drawing,
      },
      {
        schemaVersion: VERSION,
        id: "flow",
        kind: "flow",
        title: "Flow",
        sections: [
          { id: "one", title: "Heading", text: "First" },
          { id: "two", text: "Second" },
        ],
      },
      {
        schemaVersion: VERSION,
        id: "book",
        kind: "spreadsheet",
        title: "Book",
        sheets: [
          { id: "sheet-one", name: "One", cells: [{ address: "A1", value: 42 }] },
          { id: "sheet-two", name: "Two", cells: [] },
        ],
        drawings: [{ ...drawing, id: "sheet-drawing", sheetName: "One" }],
      },
      drawing,
      {
        schemaVersion: VERSION,
        id: "pages",
        kind: "paged",
        title: "Pages",
        pages: [
          { id: "page-one", width: 800, height: 600, text: "Slide text", drawing },
          { id: "page-two", width: 800, height: 600, text: "" },
        ],
      },
    ];
    for (const document of documents) {
      const rendered = render(<ModelView document={document} scale={1.25} />);
      expect(rendered.container.firstElementChild).not.toBeNull();
      rendered.unmount();
    }
  });

  it("renders every normalized drawing primitive and text alignment", () => {
    const rendered = render(<DrawingView scene={drawing} />);
    expect(rendered.getByRole("img", { name: "Process drawing" })).toBeInTheDocument();
    expect(rendered.container.querySelectorAll("[data-drawing-id]")).toHaveLength(7);
    const topText = rendered.getByText("Top");
    expect(topText).toHaveAttribute("x", "14");
    expect(topText.parentElement).toHaveAttribute("y", "156");
    expect(rendered.container.querySelectorAll("marker")).toHaveLength(2);
    expect(rendered.container.querySelectorAll("image")).toHaveLength(1);
    expect(rendered.container.querySelectorAll("tspan").length).toBeGreaterThan(3);
  });
});

describe("public view components", () => {
  it("supports image zoom, rotation, labels, actions, slots, and bounded configuration", () => {
    const rendered = render(
      <ImageView
        actions={<button type="button">Custom</button>}
        alt="Diagram"
        className="host-image"
        initialScale={1}
        labels={{ zoomIn: "Larger" }}
        slotProps={{ image: { className: "host-content" }, toolbar: { className: "host-toolbar" } }}
        src="diagram.png"
      />,
    );
    const image = rendered.getByAltText("Diagram");
    fireEvent.click(rendered.getByRole("button", { name: "Larger" }));
    expect(image).toHaveStyle({ transform: "scale(1.25) rotate(0deg)" });
    fireEvent.click(rendered.getByRole("button", { name: "Rotate right" }));
    fireEvent.click(rendered.getByRole("button", { name: "Rotate left" }));
    fireEvent.click(rendered.getByRole("button", { name: "Zoom out" }));
    expect(rendered.getByRole("toolbar").querySelectorAll(".miaixz-icon")).toHaveLength(4);
    expect(image).toHaveClass("host-content");
    expect(rendered.getByRole("toolbar")).toHaveClass("host-toolbar");
    expect(rendered.getByRole("button", { name: "Custom" })).toBeInTheDocument();
    rendered.rerender(<ImageView alt="Diagram" controls={false} src="diagram.png" />);
    expect(rendered.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("rejects invalid image scaling contracts", () => {
    expect(() => render(<ImageView alt="bad" minScale={0} src="bad.png" />)).toThrow(
      "[VIEW_IMAGE_SCALE_INVALID]",
    );
    expect(() => render(<ImageView alt="bad" maxScale={0.5} minScale={1} src="bad.png" />)).toThrow(
      "[VIEW_IMAGE_SCALE_INVALID]",
    );
  });

  it("opens content, invokes callbacks, exposes a handle, and updates zoom", async () => {
    const onLoad = vi.fn();
    const onProgress = vi.fn();
    const reference = createRef<FileViewHandle>();
    const rendered = render(
      <FileView
        actions={<button type="button">Action</button>}
        className="host-view"
        labels={{ resetZoom: "Original" }}
        name="content.shell"
        onLoad={onLoad}
        onProgress={onProgress}
        ref={reference}
        registry={shellRegistry()}
        slotProps={{ stage: { className: "host-stage" } }}
        source={new Blob(["source"])}
      />,
    );
    await waitFor(() => expect(onLoad).toHaveBeenCalledOnce());
    expect(onProgress).toHaveBeenCalled();
    expect(rendered.getByText("complete")).toBeInTheDocument();
    expect(reference.current?.getElement()).toHaveClass("host-view");
    fireEvent.click(rendered.getByRole("button", { name: "Zoom in" }));
    expect(rendered.getByRole("toolbar").querySelectorAll(".miaixz-icon")).toHaveLength(3);
    expect(rendered.getByRole("button", { name: "Original" })).toHaveTextContent("125%");
    act(() => reference.current?.resetZoom());
    await waitFor(() =>
      expect(rendered.getByRole("button", { name: "Original" })).toHaveTextContent("100%"),
    );
    await act(async () => {
      reference.current?.zoomOut();
      reference.current?.zoomIn();
      reference.current?.retry();
      await Promise.resolve();
    });
    await waitFor(() => expect(reference.current?.getState().status).toBe("ready"));
    expect(rendered.getByRole("button", { name: "Action" })).toBeInTheDocument();
    expect(rendered.container.querySelector(".host-stage")).not.toBeNull();
  });

  it("shows partial and rejected outcomes", async () => {
    const partial = render(
      <FileView name="partial.shell" registry={shellRegistry("partial")} source={new Blob()} />,
    );
    await waitFor(() => expect(partial.getByText("partial")).toBeInTheDocument());
    expect(
      partial.getByText("This file can only be inspected with the current driver"),
    ).toBeInTheDocument();
    partial.unmount();

    const onError = vi.fn();
    const rejected = render(
      <FileView
        labels={{ error: "Failed" }}
        name="rejected.shell"
        onError={onError}
        registry={shellRegistry("rejected")}
        source={new Blob()}
      />,
    );
    await waitFor(() => expect(onError).toHaveBeenCalledOnce());
    expect(rejected.getByRole("alert")).toHaveTextContent("Failed (PARSE_FAILED)");
    rejected.unmount();
  });

  it("keeps Office and PDF adapters on the unified FileView path", async () => {
    const office = render(
      <OfficeView name="office.shell" registry={shellRegistry()} source={new Blob()} />,
    );
    await waitFor(() => expect(office.getByText("complete")).toBeInTheDocument());
    office.unmount();
    const pdf = render(
      <PdfView registry={shellRegistry("complete", ["pdf"])} source={new Blob()} />,
    );
    await waitFor(() => expect(pdf.getByText("complete")).toBeInTheDocument());
    pdf.unmount();
  });

  it("joins enabled class names and clamps preview scales", () => {
    expect(classNames("one", false, undefined, "two", null)).toBe("one two");
    expect(clampScale(-1, 0, 2)).toBe(0);
    expect(clampScale(1, 0, 2)).toBe(1);
    expect(clampScale(3, 0, 2)).toBe(2);
  });
});
