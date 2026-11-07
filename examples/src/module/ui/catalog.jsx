"use client";

import { useState } from "react";
import { Stage, Button, StageLoading, MiaixzErrorBoundary, useStageSettled } from "@miaixz/ui";

import styles from "./ui-workbench.module.css";

export const UI_COMPONENT_NAMES = Object.freeze([
  "ActionBar",
  "ActionText",
  "Alert",
  "Appearance",
  "Stage",
  "Avatar",
  "AvatarGroup",
  "AvatarPicker",
  "Badge",
  "Bar",
  "Brand",
  "Breadcrumb",
  "Button",
  "ButtonGroup",
  "ButtonLink",
  "Calendar",
  "Checkbox",
  "Cluster",
  "Columns",
  "Combobox",
  "Confirm",
  "StageLoading",
  "Datagrid",
  "DatePicker",
  "Descriptions",
  "Dialog",
  "Disclosure",
  "Divider",
  "Donut",
  "Drawer",
  "Dropdown",
  "Dropzone",
  "EditorFieldset",
  "EditorForm",
  "EditorLayout",
  "EditorSection",
  "EditorSummary",
  "Empty",
  "Entry",
  "Exception",
  "Field",
  "File",
  "FormActions",
  "Graph",
  "Grid",
  "Header",
  "Heatmap",
  "HeatmapLegend",
  "Hidden",
  "IconButton",
  "Input",
  "Link",
  "List",
  "ListCounter",
  "ListItem",
  "ListMarker",
  "Locale",
  "Masonry",
  "Metric",
  "Metrics",
  "MiaixzDocumentLocale",
  "MiaixzErrorBoundary",
  "MiaixzLinkProvider",
  "MiaixzLocaleProvider",
  "MoreActions",
  "Navigation",
  "NavigationRail",
  "NavigationRailGroup",
  "Notice",
  "NumberInput",
  "Overlay",
  "Page",
  "Pagination",
  "Panel",
  "PanelFooter",
  "PanelHeader",
  "Picker",
  "Popover",
  "Pressable",
  "Progress",
  "Radio",
  "RadioGroup",
  "Rating",
  "RowActions",
  "Scroll",
  "Search",
  "Sections",
  "Segmented",
  "Select",
  "Shell",
  "Sidebar",
  "Skeleton",
  "Slider",
  "Sparkline",
  "Spinner",
  "Split",
  "Stack",
  "Status",
  "Steps",
  "Switch",
  "TabTrigger",
  "Table",
  "TableBody",
  "TableCaption",
  "TableCell",
  "TableContainer",
  "TableFooter",
  "TableHead",
  "TableHeader",
  "TableRow",
  "Tabs",
  "Tag",
  "Textarea",
  "Theme",
  "TimePicker",
  "Timeline",
  "Toast",
  "Toaster",
  "Toolbar",
  "Tooltip",
  "Transfer",
  "Tree",
  "Upload",
  "View",
]);

/**
 * Lists every public React component and provider exported by @miaixz/ui.
 */
export function CompleteCatalog() {
  return (
    <>
      <div className={styles.catalog}>
        {UI_COMPONENT_NAMES.map((name) => (
          <code key={name}>{name}</code>
        ))}
      </div>
      <StageExamples />
    </>
  );
}

/** Demonstrates caller-owned content, state selection, and recovery without an application runtime. */
function StageExamples() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("empty");
  const [failed, setFailed] = useState(false);
  const settled = useStageSettled(!loading);
  return (
    <section className={styles.feedbackDemo} aria-label="Content presentation examples">
      <h3>Retained content</h3>
      <Button onClick={() => setLoading((value) => !value)}>
        {loading ? "Finish loading" : "Start loading"}
      </Button>
      <StageLoading active={loading} label="Loading preview" placeholder={<p>Placeholder</p>}>
        {settled ? <p>The existing preview stays mounted during loading.</p> : undefined}
      </StageLoading>
      <h3>Asynchronous states</h3>
      <div className={styles.actionRow}>
        {["loading", "empty", "error", "ready"].map((value) => (
          <Button key={value} onClick={() => setStatus(value)}>
            {value}
          </Button>
        ))}
      </div>
      {status === "loading" ? (
        <Stage status="loading" label="Loading preview" placeholder={<p>Preview placeholder</p>} />
      ) : status === "empty" ? (
        <Stage status="empty" title="No items" description="Choose another presentation state." />
      ) : status === "error" ? (
        <Stage
          status="error"
          title="Preview unavailable"
          description="Retry this local preview."
          loadingLabel="Retrying preview"
          retryLabel="Retry preview"
          onRetry={() => setStatus("ready")}
        />
      ) : (
        <Stage status="ready">
          <p>The preview is ready.</p>
        </Stage>
      )}
      <h3>Error boundary</h3>
      <Button onClick={() => setFailed(true)}>Show the recovery fallback</Button>
      <MiaixzErrorBoundary
        fallback={(retry) => (
          <Button
            onClick={() => {
              setFailed(false);
              retry();
            }}
          >
            Restore preview
          </Button>
        )}
      >
        <BoundaryPreview failed={failed} />
      </MiaixzErrorBoundary>
    </section>
  );
}

/** Throws only an explicitly selected neutral demonstration error. */
function BoundaryPreview({ failed }) {
  if (failed) throw new Error("Neutral preview failure");
  return <p>The preview is rendered inside the public error boundary.</p>;
}
