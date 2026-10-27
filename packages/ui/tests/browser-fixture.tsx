/**
 * Verifies browser fixture behavior in the UI package.
 */

import { VERSION } from "../src/version.js";

import type {} from "vite/client";

import "@miaixz/icons/styles.css";
import { createMiaixzAppearanceManager, miaixzDefaultAppearance } from "@miaixz/sdk/appearance";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { createRoot } from "react-dom/client";
import { useState } from "react";

import {
  asyncTreeFixture,
  createTreeFixture,
  type TreeFixtureDepth,
} from "./components/tree/tree-fixtures.js";

import {
  ActionBar,
  ActionText,
  Bar,
  Alert,
  Appearance,
  Avatar,
  Button,
  Cluster,
  Combobox,
  CONTROL_FRAMES,
  Datagrid,
  DatePicker,
  Descriptions,
  defineTheme,
  Dialog,
  Disclosure,
  Donut,
  Dropdown,
  Drawer,
  DRAWER_WIDTHS,
  EditorLayout,
  EditorFieldset,
  EditorSection,
  EditorSummary,
  Field,
  File,
  FormActions,
  Graph,
  Grid,
  Input,
  NumberInput,
  IconButton,
  Masonry,
  Metric,
  Metrics,
  MiaixzLocaleProvider,
  MiaixzLinkProvider,
  Navigation,
  NavigationRail,
  View,
  type LinkRefreshMode,
  Panel,
  Progress,
  Picker,
  RowActions,
  Rating,
  Segmented,
  Search,
  Select,
  Slider,
  Sparkline,
  Spinner,
  Status,
  Steps,
  Switch,
  Tabs,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Textarea,
  TimePicker,
  Theme,
  Timeline,
  Toolbar,
  Tree,
  Upload,
  type CommandAction,
  type IconName,
} from "../src/index.js";
import "../src/theme/theme.css";

const parameters = new URLSearchParams(window.location.search);
const theme = parameters.get("theme") ?? miaixzDefaultAppearance.theme;
const supplementalTheme = parameters.has("extraTheme")
  ? defineTheme(JSON.parse(parameters.get("extraTheme") ?? "{}"))
  : null;
const colorMode = parameters.get("colorMode") === "dark" ? "dark" : "light";
const densityParameter = parameters.get("density");
const density =
  densityParameter === "compact" || densityParameter === "comfortable"
    ? densityParameter
    : "standard";
const appearance = createMiaixzAppearanceManager({
  appId: "miaixz-ui-browser-fixture",
  ...(parameters.size > 0 ? { initialAppearance: { theme, colorMode, density } } : {}),
  storage: {
    getItem: (key) => window.localStorage.getItem(key),
    removeItem: (key) => window.localStorage.removeItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  },
});
const i18n = createMiaixzI18n();
const legacyTheme = defineTheme({
  schemaVersion: VERSION,
  name: "legacy-custom",
  label: "Legacy custom",
  extends: miaixzDefaultAppearance.theme,
  tokens: { typography: { bodySize: 15 } },
  modes: { light: {}, dark: {} },
});

/**
 * Returns the fixed depth requested by the Tree browser fixture.
 * @returns A supported shared-fixture depth.
 */
function getTreeFixtureDepth(): TreeFixtureDepth {
  const value = Number(parameters.get("treeDepth") ?? "10");
  return value === 2 || value === 3 || value === 6 || value === 10 ? value : 10;
}

/**
 * Renders one isolated deep Tree for keyboard, accessibility, and geometry contracts.
 * @returns A deterministic Tree view selected through URL parameters.
 */
function TreeContractFixture() {
  const viewParameter = parameters.get("treeView");
  const view = viewParameter === "compact" || viewParameter === "focus" ? viewParameter : "nested";
  const compression = parameters.get("treeCompression") === "dense" ? "dense" : "balanced";
  const indent = parameters.get("treeIndent") === "dense" ? "dense" : "standard";
  const direction = parameters.get("treeDirection") === "rtl" ? "rtl" : "ltr";
  const state = parameters.get("treeState") ?? "depth";
  const depth = getTreeFixtureDepth();
  const width = Number(parameters.get("treeWidth") ?? "480");
  const loadedIds = Array.from(
    { length: depth - 1 },
    (_, index) => `tree-depth-${String(index + 1).padStart(2, "0")}`,
  );
  const nodes =
    state === "depth"
      ? [
          ...createTreeFixture(depth),
          {
            id: "tree-disabled",
            label: "禁用节点",
            textValue: "Disabled item",
            trailing: "0 / 1",
            disabled: true,
            value: "disabled",
          },
        ]
      : asyncTreeFixture;
  const loadChildren =
    state === "depth"
      ? undefined
      : async () => {
          if (state === "error") throw new Error("Tree fixture loading failed");
          if (state === "loading") await new Promise<void>(() => undefined);
          return [
            {
              id: "tree-async-child",
              label: "异步子节点",
              textValue: "Async child",
              value: "async-child",
            },
          ];
        };
  const sharedProps = {
    "data-testid": "tree-contract",
    defaultExpandedIds: state === "depth" ? loadedIds : [],
    defaultSelectedIds: state === "depth" && depth >= 6 ? ["tree-depth-06"] : [],
    density,
    dir: direction,
    expansionControls: {
      depthOptions: [2, 3, 6],
      scope: "view" as const,
    },
    label: "深层资源目录",
    maxVisibleNodes: parameters.get("treeLimit") === "small" ? 3 : 5000,
    nodes,
    ...(loadChildren === undefined ? {} : { loadChildren }),
  };
  return (
    <main
      data-testid="tree-contract-container"
      style={{ inlineSize: `${width}px`, maxInlineSize: "100%" }}
    >
      {view === "focus" ? (
        <Tree {...sharedProps} view="focus" viewOptions={{ navigation: "both", windowDepth: 3 }} />
      ) : view === "compact" ? (
        <Tree {...sharedProps} view="compact" viewOptions={{ compression }} connectors />
      ) : (
        <Tree {...sharedProps} view="nested" viewOptions={{ indent }} connectors />
      )}
    </main>
  );
}

/**
 * Creates the final command-action shape used by browser fixtures.
 *
 * @param id - Stable action identifier.
 * @param label - Visible and accessible label.
 * @param icon - Public icon name.
 * @param options - Optional command state and presentation.
 * @returns A complete command action.
 */
function commandAction(
  id: string,
  label: string,
  icon: IconName,
  options: Pick<CommandAction, "buttonProps" | "disabled" | "loading" | "tone"> = {},
): CommandAction {
  return { id, kind: "command", label, icon, onAction: () => undefined, ...options };
}

/**
 * Renders the six frozen action-system visual baselines with real components.
 *
 * @returns The interactive action showcase.
 */
function ActionShowcase() {
  return (
    <section aria-label="操作体系基线" data-testid="action-showcase">
      <Panel
        data-testid="action-baseline-page-header"
        actions={
          <ActionBar
            primary={commandAction("showcase-create", "新建资源", "add", { tone: "brand" })}
            actions={[
              commandAction("showcase-import", "导入", "upload"),
              commandAction("showcase-refresh", "刷新", "refresh-cw"),
            ]}
          />
        }
        description="一个实体主操作和两个低权重普通操作"
        title="01 页面头部"
      >
        内容标题与摘要保持第一视觉层级。
      </Panel>

      <Panel
        data-testid="action-baseline-card-header"
        actions={
          <ActionBar
            actions={[
              commandAction("showcase-edit-card", "编辑", "pencil"),
              commandAction("showcase-configure-card", "配置", "settings"),
            ]}
          />
        }
        description="普通操作只显示图标和文字，不占据内容焦点"
        title="02 卡片头部"
      >
        卡片正文用于承载核心信息。
      </Panel>

      <Panel
        data-testid="action-baseline-table-row"
        description="危险操作固定收进更多菜单"
        title="03 表格行"
      >
        <TableContainer gutter="flush">
          <Table>
            <TableCaption>操作密度基线</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>示例资源</TableCell>
                <TableCell>正常</TableCell>
                <TableCell>
                  <RowActions
                    actions={[
                      commandAction("showcase-view-row", "查看", "eye"),
                      commandAction("showcase-edit-row", "编辑", "pencil"),
                      commandAction("showcase-export-row", "导出", "download"),
                      commandAction("showcase-delete-row", "删除", "delete", {
                        tone: "danger",
                      }),
                    ]}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Panel>

      <Panel
        data-testid="action-baseline-icon-actions"
        actions={
          <div aria-label="图标操作" className="miaixz-action-bar" role="toolbar">
            <IconButton icon="arrow-left" label="返回" onClick={() => undefined} />
            <IconButton icon="star" label="收藏" pressed onClick={() => undefined} />
            <IconButton icon="close" label="关闭" onClick={() => undefined} />
            <IconButton icon="more-horizontal" label="更多" onClick={() => undefined} />
          </div>
        }
        description="仅用于空间受限且图标含义明确的操作"
        title="04 图标操作"
      >
        聚焦或悬停 300ms 后显示说明。
      </Panel>

      <Panel
        data-testid="action-baseline-form-actions"
        description="取消在左、唯一提交操作在右"
        title="05 表单底部"
      >
        <FormActions
          cancel={{
            id: "showcase-cancel",
            label: "取消",
            icon: "circle-x",
            onAction: () => undefined,
          }}
          submit={{
            id: "showcase-save",
            label: "保存",
            icon: "save",
            tone: "brand",
          }}
        />
        <FormActions
          cancel={{
            id: "showcase-cancel-loading",
            label: "取消",
            icon: "circle-x",
            onAction: () => undefined,
          }}
          submit={{
            id: "showcase-save-loading",
            label: "保存",
            icon: "save",
            tone: "brand",
            loading: true,
          }}
        />
        <FormActions
          cancel={{
            id: "showcase-cancel-disabled",
            label: "取消",
            icon: "circle-x",
            onAction: () => undefined,
          }}
          submit={{
            id: "showcase-save-disabled",
            label: "保存",
            icon: "save",
            tone: "brand",
            disabled: true,
          }}
        />
        <FormActions
          cancel={{
            id: "showcase-cancel-danger",
            label: "取消",
            icon: "circle-x",
            onAction: () => undefined,
          }}
          submit={{
            id: "showcase-delete-confirm",
            label: "确认删除",
            icon: "delete",
            tone: "danger",
          }}
        />
      </Panel>

      <Panel
        data-testid="action-baseline-state-matrix"
        description="主题、密度及所有关键状态共用固定配方"
        title="06 状态矩阵"
      >
        <div aria-label="操作状态矩阵" className="miaixz-action-bar" role="group">
          <ActionText
            action={commandAction("showcase-default", "默认", "pencil", {
              buttonProps: { "data-testid": "action-default" },
            })}
          />
          <ActionText
            action={commandAction("showcase-brand", "品牌", "shield-check", {
              tone: "brand",
              buttonProps: { "data-testid": "action-brand" },
            })}
          />
          <ActionText
            action={commandAction("showcase-danger", "危险", "delete", {
              tone: "danger",
              buttonProps: { "data-testid": "action-danger" },
            })}
          />
          <ActionText
            action={commandAction("showcase-disabled", "禁用", "pencil", {
              disabled: true,
            })}
          />
          <ActionText
            action={commandAction("showcase-loading", "加载", "refresh-cw", {
              loading: true,
            })}
          />
          <Button tone="brand" variant="solid">
            主按钮
          </Button>
          <Button variant="outlined">次按钮</Button>
          <Button tone="danger" variant="solid">
            危险按钮
          </Button>
        </div>
      </Panel>
    </section>
  );
}

/**
 * Closed set of browser fixture identifiers exposed by the accessibility test harness.
 */
export type AccessibilityFixtureName =
  | "alert"
  | "avatar"
  | "dialog"
  | "drawer"
  | "select"
  | "combobox"
  | "dropdown"
  | "tabs"
  | "tree"
  | "datagrid"
  | "upload"
  | "timeline"
  | "sparkline"
  | "donut"
  | "graph"
  | "tag"
  | "segmented"
  | "disclosure"
  | "slider"
  | "date-picker"
  | "rating"
  | "masonry";

/**
 * Renders one isolated public component for attributed accessibility checks.
 *
 * @param props - Selected fixture name.
 * @param props.name - Public component fixture to render.
 * @returns One independently scannable component.
 */
export function AccessibilityFixture({ name }: { readonly name: AccessibilityFixtureName }) {
  const [open, setOpen] = useState(true);
  const testId = `a11y-${name}`;

  switch (name) {
    case "alert":
      return (
        <Alert data-testid={testId} title="同步完成" tone="success">
          所有记录均已保存。
        </Alert>
      );
    case "avatar":
      return <Avatar alt="用户 Kimi" data-testid={testId} name="Kimi Leaves" />;
    case "dialog":
      return (
        <Dialog
          data-testid={testId}
          description="检查当前发布配置。"
          open={open}
          title="发布确认"
          onOpenChange={setOpen}
        >
          <Button>确认发布</Button>
        </Dialog>
      );
    case "drawer":
      return (
        <Drawer
          data-testid={testId}
          description="编辑资源的基础信息。"
          open={open}
          title="资源详情"
          onOpenChange={setOpen}
        >
          <Button>保存资源</Button>
        </Drawer>
      );
    case "select":
      return (
        <Field label="运行环境">
          <Select
            defaultValue="production"
            items={[
              {
                id: "environment-production",
                kind: "option",
                label: "生产环境",
                textValue: "生产环境",
                value: "production",
              },
            ]}
            slotProps={{ root: { "data-testid": testId } }}
          />
        </Field>
      );
    case "combobox":
      return (
        <Combobox
          data-testid={testId}
          label="负责人"
          options={[{ label: "Kimi", textValue: "Kimi", value: "kimi" }]}
        />
      );
    case "dropdown":
      return (
        <div data-testid={testId}>
          <Dropdown
            items={[
              {
                id: "refresh",
                kind: "action",
                label: "刷新",
                textValue: "刷新",
                onAction: () => undefined,
              },
            ]}
            label="资源操作"
            trigger={<button type="button">更多</button>}
          />
        </div>
      );
    case "tabs":
      return (
        <Tabs
          data-testid={testId}
          defaultValue="overview"
          items={[
            { content: "概览内容", label: "概览", value: "overview" },
            { content: "审计内容", label: "审计", value: "audit" },
          ]}
          label="资源视图"
        />
      );
    case "tree":
      return (
        <Tree
          data-testid={testId}
          defaultExpandedIds={[
            "tree-depth-01",
            "tree-depth-02",
            "tree-depth-03",
            "tree-depth-04",
            "tree-depth-05",
          ]}
          defaultSelectedIds={["tree-depth-06"]}
          expansionControls={{ depthOptions: [2, 3, 6] }}
          label="资源目录"
          nodes={createTreeFixture(6)}
          view="compact"
          viewOptions={{ compression: "balanced" }}
        />
      );
    case "datagrid":
      return (
        <Datagrid
          caption="成员列表"
          columns={[{ cell: (row) => row.name, header: "姓名", id: "name" }]}
          data-testid={testId}
          getRowId={(row) => row.id}
          rows={[{ id: "kimi", name: "Kimi" }]}
        />
      );
    case "upload":
      return (
        <Upload
          browseLabel="选择文件"
          data-testid={testId}
          dropLabel="拖放文件到此处"
          label="上传附件"
          removePolicy="immediate"
          upload={async () => undefined}
          onComplete={() => undefined}
          onError={() => undefined}
        />
      );
    case "timeline":
      return (
        <Timeline
          aria-label="发布记录"
          data-testid={testId}
          items={[
            {
              id: "published",
              status: "已完成",
              title: "发布生产版本",
              tone: "positive",
            },
          ]}
        />
      );
    case "sparkline":
      return (
        <Sparkline aria-label="最近五次请求量" data-testid={testId} values={[12, 18, 15, 24, 21]} />
      );
    case "donut":
      return (
        <Donut
          aria-label="资源状态分布"
          data-testid={testId}
          segments={[
            { id: "healthy", label: "正常", tone: "data-1", value: 8 },
            { id: "warning", label: "警告", tone: "data-2", value: 2 },
          ]}
        />
      );
    case "tag":
      return (
        <Tag data-testid={testId} onAction={() => undefined} onRemove={() => undefined}>
          可操作标签
        </Tag>
      );
    case "segmented":
      return (
        <Segmented
          aria-label="展示方式"
          data-testid={testId}
          defaultValue="list"
          items={[
            { label: "列表", textValue: "列表", value: "list" },
            { label: "网格", textValue: "网格", value: "grid" },
          ]}
        />
      );
    case "disclosure":
      return (
        <Disclosure data-testid={testId} defaultExpanded summary="高级选项">
          已展开的详细内容
        </Disclosure>
      );
    case "slider":
      return <Slider aria-label="发布比例" data-testid={testId} defaultValue={40} showValue />;
    case "date-picker":
      return (
        <DatePicker
          aria-label="发布日期"
          defaultValue="2026-09-18"
          name="releaseDate"
          referenceDate="2026-09-18"
          slotProps={{ root: { "data-testid": testId } }}
        />
      );
    case "rating":
      return (
        <Rating
          aria-label="服务评分"
          defaultValue={3.5}
          name="serviceRating"
          precision={0.5}
          slotProps={{ root: { "data-testid": testId } }}
        />
      );
    case "masonry":
      return (
        <Masonry aria-label="内容卡片" data-testid={testId}>
          <article>第一项</article>
          <article>第二项包含更多内容</article>
          <article>第三项</article>
        </Masonry>
      );
    case "graph":
      return (
        <Graph
          aria-label="服务关系"
          data-testid={testId}
          edges={[{ directed: true, id: "api-db", sourceId: "api", targetId: "db" }]}
          nodes={[
            { id: "api", label: "API", tone: "brand", x: 25, y: 50 },
            { id: "db", label: "Database", tone: "data-1", x: 75, y: 50 },
          ]}
          tableCaption="服务连接"
        />
      );
  }
}

/**
 * Compares text insets and visible trailing icon edges across shared field surfaces.
 * @returns A stable browser geometry fixture with explicit sizes and RTL support.
 */
function FieldGeometryFixture() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const options = [{ value: "alpha", label: "Alpha", textValue: "Alpha" }];
  const items = [{ kind: "option" as const, id: "alpha", ...options[0]! }];
  const fields = (
    <main style={{ padding: 24 }} dir={parameters.get("direction") === "rtl" ? "rtl" : "ltr"}>
      <h1>Field inset geometry</h1>
      <Grid columns="two">
        {(["small", "medium", "large"] as const).flatMap((size) => [
          <Field
            key={`input-${size}`}
            label={`Input ${size}`}
            data-testid={`geometry-input-${size}`}
          >
            <Input size={size} defaultValue="Alpha" />
          </Field>,
          <Field
            key={`select-${size}`}
            label={`Select ${size}`}
            data-testid={`geometry-select-${size}`}
          >
            <Select size={size} items={items} defaultValue="alpha" />
          </Field>,
          <Field
            key={`search-${size}`}
            label={`Search ${size}`}
            data-testid={`geometry-search-${size}`}
          >
            <Search size={size} defaultValue="Alpha" />
          </Field>,
        ])}
        <Field label="Header search" data-testid="geometry-header-search">
          <Search variant="header" defaultValue="Alpha" />
        </Field>
        <Field label="Combobox" data-testid="geometry-combobox">
          <Combobox label={null} options={options} defaultValue={options[0]!} />
        </Field>
        <Field label="Picker" data-testid="geometry-picker">
          <Picker label={null} options={options} defaultValue={[options[0]!]} />
        </Field>
        <Field label="DatePicker" data-testid="geometry-date">
          <DatePicker defaultValue="2026-10-19" referenceDate="2026-10-19" />
        </Field>
        <Field label="TimePicker" data-testid="geometry-time">
          <TimePicker defaultValue="09:30" />
        </Field>
        <Field label="Textarea" data-testid="geometry-textarea">
          <Textarea defaultValue="Alpha" rows={2} />
        </Field>
        <Field label="NumberInput" data-testid="geometry-number">
          <NumberInput defaultValue={20} />
        </Field>
        <Field
          label="Number with unit"
          data-testid="geometry-number-unit"
          style={{ maxWidth: 158 }}
        >
          <NumberInput defaultValue={2600} endAdornment="万 Token/月" />
        </Field>
        <Field label="Narrow number" data-testid="geometry-narrow-number" style={{ maxWidth: 64 }}>
          <NumberInput defaultValue={40} />
        </Field>
        <Field label="Narrow select" data-testid="geometry-narrow-select" style={{ maxWidth: 52 }}>
          <Select items={items} defaultValue="alpha" />
        </Field>
        <Field label="Icon command" data-testid="geometry-icon-command">
          <Input defaultValue="Alpha" endAdornment={<IconButton icon="send" label="Send" />} />
        </Field>
        <Field label="Glyph command" data-testid="geometry-glyph-command">
          <Input
            defaultValue="Alpha"
            endAdornment={<IconButton appearance="glyph" icon="more-horizontal" label="More" />}
          />
        </Field>
        <Field label="Disabled command" data-testid="geometry-disabled-command">
          <Input
            defaultValue="Alpha"
            endAdornment={<IconButton icon="send" label="Disabled send" disabled />}
          />
        </Field>
        <Field label="Leading command" data-testid="geometry-leading-command">
          <Input
            defaultValue="Alpha"
            startAdornment={<IconButton icon="search" label="Search" />}
          />
        </Field>
        <Field label="Password" data-testid="geometry-password">
          <Input
            type="password"
            defaultValue="Alpha"
            endAdornment={
              <ActionText
                action={{
                  kind: "command",
                  id: "toggle-password",
                  label: "Show password",
                  icon: "eye",
                  onAction: () => undefined,
                }}
              />
            }
          />
        </Field>
        <Field label="Empty picker" data-testid="geometry-empty-picker">
          <Picker label={null} options={options} />
        </Field>
        <Field label="Wrapped picker" data-testid="geometry-wrapped-picker">
          <Picker
            label={null}
            options={Array.from({ length: 8 }, (_, i) => ({
              value: `option-${i}`,
              label: `Selected option ${i}`,
              textValue: `Selected option ${i}`,
            }))}
            defaultValue={Array.from({ length: 8 }, (_, i) => ({
              value: `option-${i}`,
              label: `Selected option ${i}`,
              textValue: `Selected option ${i}`,
            }))}
          />
        </Field>
      </Grid>
    </main>
  );
  return parameters.get("fieldDrawer") === "1" ? (
    <Drawer
      open={drawerOpen}
      onOpenChange={setDrawerOpen}
      title="Field geometry drawer"
      width={1000}
    >
      {fields}
    </Drawer>
  ) : (
    fields
  );
}

/**
 * Shows the same public controls in ordinary, readonly, disabled and invalid modes.
 * Pointer and keyboard states are exercised through the native editors.
 * @returns Interactive control state reference.
 */
function PickerEnhancementFixture() {
  const [value, setValue] = useState<
    import("../src/components/combobox/combobox.types.js").MiaixzOption | null
  >(null);
  const presentation = parameters.get("pickerSurface") as
    "popover" | "drawer" | "dialog" | "inline";
  const size = (parameters.get("pickerSize") ?? "medium") as "small" | "medium" | "large";
  return (
    <main>
      <Input aria-label="Reference input" size={size} />
      <Picker
        size={size}
        selectionMode="single"
        presentation={presentation}
        commitMode="confirm"
        label="Choose resource"
        name="resource"
        value={value}
        onValueChange={setValue}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        renderContent={(state) => (
          <div data-testid="picker-custom-content">
            <Button
              onClick={() =>
                state.onValueChange({ value: "alpha", label: "Alpha", textValue: "Alpha" })
              }
            >
              Pick Alpha
            </Button>
          </div>
        )}
      />
      <output data-testid="committed-value">{value?.value ?? "empty"}</output>
    </main>
  );
}

/**
 * Renders the existing control-state fixture.
 * @returns The control reference.
 */
function ControlStateFixture() {
  const [mode, setMode] = useState("normal");
  const [log, setLog] = useState("");
  const disabled = mode === "disabled";
  const readOnly = mode === "readonly";
  const options = [
    { value: "alpha", label: "Alpha", textValue: "Alpha" },
    { value: "beta", label: "Beta", textValue: "Beta" },
  ];
  const rows = [
    ["Input", <Input defaultValue="Miaixz" readOnly={readOnly} />],
    ["Textarea", <Textarea defaultValue="Shared field surface" rows={2} readOnly={readOnly} />],
    ["NumberInput", <NumberInput defaultValue={20} readOnly={readOnly} />],
    [
      "Select",
      <Select
        defaultValue="alpha"
        readOnly={readOnly}
        items={options.map((option) => ({
          ...option,
          kind: "option",
          id: `option-${encodeURIComponent(option.value)}`,
        }))}
      />,
    ],
    [
      "Combobox",
      <Combobox
        label="Combobox"
        options={options}
        defaultValue={options[0]!}
        readOnly={readOnly}
      />,
    ],
    [
      "Picker",
      <Picker label="Picker" options={options} defaultValue={[options[0]!]} readOnly={readOnly} />,
    ],
    [
      "DatePicker",
      <DatePicker defaultValue="2026-10-16" referenceDate="2026-10-16" readOnly={readOnly} />,
    ],
    ["TimePicker", <TimePicker defaultValue="09:30" readOnly={readOnly} />],
  ] as const;
  return (
    <main style={{ padding: 32 }}>
      <h1>Shared control states</h1>
      <Cluster>
        <Button onClick={() => setMode("normal")}>普通</Button>
        <Button onClick={() => setMode("readonly")}>只读</Button>
        <Button onClick={() => setMode("disabled")}>禁用</Button>
        <Button onClick={() => setMode("invalid")}>错误</Button>
        <ActionText
          action={{
            id: "state.action",
            kind: "command",
            label: "文字操作",
            icon: "pencil",
            disabled,
            onAction: () => setLog("action"),
          }}
        />
      </Cluster>
      <Grid columns="two">
        {rows.map(([label, control]) => (
          <Field
            key={label}
            label={label}
            disabled={disabled}
            errorText={mode === "invalid" ? `${label} error` : undefined}
            data-testid={`state-${label}`}
          >
            {control}
          </Field>
        ))}
      </Grid>
      <output>{log}</output>
      <Cluster>
        {(
          [
            "pdf",
            "word",
            "spreadsheet",
            "presentation",
            "drawing",
            "video",
            "archive",
            "image",
            "audio",
            "code",
          ] as const
        ).map((tone) => (
          <File key={tone} icon="file" label={tone} tone={tone} presentation="badge" />
        ))}
      </Cluster>
    </main>
  );
}

/**
 * Renders fixed-title fields and a scrollable editing drawer.
 *
 * @returns Form controls in deterministic interaction states.
 */
function FormLabelFixture() {
  const [invalid, setInvalid] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [open, setOpen] = useState(false);
  const options = [
    { value: "alpha", label: "Alpha", textValue: "Alpha" },
    { value: "beta", label: "Beta", textValue: "Beta" },
  ];
  return (
    <main aria-label="固定字段标题契约">
      <Button onClick={() => setInvalid((value) => !value)}>切换错误</Button>
      <Button onClick={() => setDisabled((value) => !value)}>切换禁用</Button>
      <Button onClick={() => setReadOnly((value) => !value)}>切换只读</Button>
      <Grid data-testid="three-column-grid" columns="three">
        <span>第一列</span>
        <span>第二列</span>
        <span>第三列</span>
      </Grid>
      <form aria-label="字段布局表单" onSubmit={(event) => event.preventDefault()}>
        <Grid columns="two">
          <Field
            data-testid="label-text"
            disabled={disabled}
            errorText={invalid ? "名称不能为空" : undefined}
            helperText="输入完整名称"
            label="名称"
            required
          >
            <Input name="name" placeholder="输入完整名称" readOnly={readOnly} />
          </Field>
          <Field data-testid="label-textarea" label="说明">
            <Textarea placeholder="填写用途与职责" rows={3} />
          </Field>
          <Field data-testid="label-number" label="排序">
            <NumberInput defaultValue={20} />
          </Field>
          <Field data-testid="label-select" label="状态">
            <Select
              items={options.map((option) => ({ ...option, id: option.value, kind: "option" }))}
              placeholder="选择状态"
            />
          </Field>
          <Field controlId="label-date" data-testid="label-date" label="日期">
            <DatePicker aria-labelledby="label-date-label" referenceDate="2026-10-09" />
          </Field>
          <Field controlId="label-time" data-testid="label-time" label="时间">
            <TimePicker aria-labelledby="label-time-label" />
          </Field>
          <Field data-testid="label-combobox" label="负责人">
            <Combobox label="内部负责人" options={options} placeholder="搜索负责人" />
          </Field>
          <Field data-testid="label-picker" label="成员">
            <Picker label="内部成员" options={options} placeholder="搜索成员" />
          </Field>
          <Field
            data-testid="label-long"
            label="这是一个必须完整显示并在窄屏自然换行的长字段标题用于验证布局不会遮挡输入内容"
            optionalText="选填"
          >
            <Input placeholder="填写补充信息" />
          </Field>
          {(["date", "datetime-local", "month", "time", "week"] as const).map((type) => (
            <Field data-testid={`label-native-${type}`} key={type} label={`原生 ${type}`}>
              <Input type={type} />
            </Field>
          ))}
        </Grid>
        <EditorFieldset data-testid="label-fieldset" legend="补充字段">
          <Field label="补充一">
            <Input />
          </Field>
          <Field label="补充二">
            <Input />
          </Field>
        </EditorFieldset>
        <Button type="reset">重置字段</Button>
      </form>
      <Combobox data-testid="standalone-combobox" label="独立负责人" options={options} />
      <Picker data-testid="standalone-picker" label="独立成员" options={options} />
      <Button onClick={() => setOpen(true)}>打开字段抽屉</Button>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        title="字段抽屉"
        footer={<Button onClick={() => setOpen(false)}>完成字段编辑</Button>}
      >
        <EditorSection title="基础信息" description="固定标题与滚动内容">
          {Array.from({ length: 16 }, (_, index) => (
            <Field key={index} label={`抽屉字段 ${index + 1}`}>
              <Input placeholder="输入内容" />
            </Field>
          ))}
        </EditorSection>
      </Drawer>
    </main>
  );
}

/**
 * Exercises editor and vertical tab containment at independently sized surfaces.
 * @returns A fixed identity editor used by browser layout regressions.
 */
function ResponsiveEditorFixture() {
  const width = Number(parameters.get("editorWidth") ?? "960");
  return (
    <main style={{ maxWidth: "100%", width }}>
      <EditorLayout
        summary={<EditorSummary avatar="KL" title="Editor summary" items={[]} />}
        divided
      >
        <Tabs
          variant="navigation"
          headerVariant={parameters.has("editorActions") ? "toolbar" : "default"}
          actions={
            parameters.has("editorActions") ? (
              <Cluster>
                <Button>Export editor</Button>
              </Cluster>
            ) : undefined
          }
          label="Editor navigation"
          orientation="vertical"
          items={[
            {
              value: "identity",
              label: "Identity",
              content: (
                <EditorSection title="Identity fields" layout="two-column">
                  <Field label="Identity name">
                    <Input defaultValue="Kimi Liu" />
                  </Field>
                  <Field label="Identity account">
                    <Input defaultValue="kimi" readOnly />
                  </Field>
                </EditorSection>
              ),
            },
            {
              value: "security",
              label: "Security",
              content: (
                <Field label="Security status" disabled>
                  <Input value="Enabled" />
                </Field>
              ),
            },
          ]}
        />
      </EditorLayout>
    </main>
  );
}

/**
 * Exercises both progress components with explicit test controls for actual value changes and completion.
 * @returns Shared progress motion fixture.
 */
function ProgressMotionFixture() {
  const [value, setValue] = useState<number | undefined>();
  const [active, setActive] = useState(true);
  return (
    <Panel title="进度条动效">
      {active ? (
        value === undefined ? (
          <Bar active label="顶部等待" />
        ) : (
          <Bar active label="顶部进度" value={value} max={100} />
        )
      ) : (
        <Bar active={false} />
      )}
      <Progress label="等待实际进度" value={value} showValue />
      <Progress label="实际用量" value={40} showValue />
      <Cluster>
        <Button
          onClick={() => {
            setActive(true);
            setValue(25);
          }}
        >
          推进到 25%
        </Button>
        <Button
          onClick={() => {
            setValue(100);
            setActive(false);
          }}
        >
          完成加载
        </Button>
      </Cluster>
    </Panel>
  );
}

/**
 * Renders public controls and deterministic browser contract fixtures.
 *
 * @returns Theme and locale providers with the selected fixture.
 */
export function BrowserFixture() {
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null);
  const [drawer, setDrawer] = useState<"closed" | "outer" | "nested">("closed");
  const [drawerWidth, setDrawerWidth] = useState(Number(parameters.get("drawerWidth") ?? 490));
  const [enabled, setEnabled] = useState(true);
  const [formStatus, setFormStatus] = useState("尚未提交");
  const metricItems = Array.from({ length: 5 }, (_, index) => (
    <Metric
      hint={`固定数据 ${index + 1}`}
      key={index}
      label={`指标 ${index + 1}`}
      tone={index === 1 ? "warning" : "brand"}
      value={(index + 1) * 10}
    />
  ));
  const accessibilityFixture = parameters.get("a11y") as AccessibilityFixtureName | null;

  if (
    parameters.has("railGradient") ||
    parameters.has("navigationRefresh") ||
    parameters.get("controlStates") === "1" ||
    parameters.get("fieldGeometry") === "1" ||
    parameters.get("formLabels") === "1" ||
    parameters.get("editorResponsive") === "1" ||
    parameters.get("loadingIndicators") === "1"
  ) {
    return (
      <MiaixzLocaleProvider i18n={i18n}>
        <Theme
          appearance={appearance}
          fallback={miaixzDefaultAppearance.theme}
          themes={supplementalTheme ? [supplementalTheme] : []}
          {...(parameters.get("uniformFields") === "1"
            ? {
                components: {
                  Input: { slotClassNames: { root: CONTROL_FRAMES.medium } },
                  Select: { slotClassNames: { root: CONTROL_FRAMES.medium } },
                  Combobox: { slotClassNames: { control: CONTROL_FRAMES.medium } },
                  Picker: { slotClassNames: { control: CONTROL_FRAMES.medium } },
                },
              }
            : {})}
        >
          {parameters.get("loadingIndicators") === "1" ? (
            <main aria-label="加载状态展示">
              <ProgressMotionFixture />
              <Panel title="加载状态" description="统一图形、尺寸与动画节奏">
                <Cluster>
                  <Spinner size="small" label="正在加载小尺寸" />
                  <Spinner label="正在加载" />
                  <Spinner size="large" label="正在加载大尺寸" />
                  <Button loading loadingLabel="正在保存" variant="solid" tone="brand">
                    保存
                  </Button>
                  <Button loading loadingLabel="正在查询" variant="outlined">
                    查询
                  </Button>
                  <IconButton icon="refresh-cw" label="刷新" loading />
                </Cluster>
              </Panel>
              <Datagrid
                caption="配置加载状态"
                columns={[{ id: "name", header: "配置名称", cell: () => null }]}
                rows={[]}
                getRowId={(row: { id: string }) => row.id}
                loading
                loadingLabel="正在读取配置"
              />
            </main>
          ) : parameters.has("railGradient") ? (
            <NavigationRail
              brand="Brand"
              toggle={<button type="button">Toggle</button>}
              variant="brand"
              expanded={parameters.get("expanded") === "1"}
              dir={parameters.get("direction") === "rtl" ? "rtl" : "ltr"}
              style={{ height: 600 }}
              groups={[
                {
                  id: "main",
                  label: "Main",
                  items: [
                    {
                      id: "selected",
                      label: "Selected menu",
                      textValue: "Selected menu",
                      href: "#selected",
                      current: "page",
                      icon: "blocks",
                      overflow: "never",
                    },
                    {
                      id: "ordinary",
                      label: "Ordinary menu",
                      textValue: "Ordinary menu",
                      href: "#ordinary",
                      icon: "settings",
                      overflow: "never",
                    },
                  ],
                },
              ]}
            />
          ) : parameters.has("navigationRefresh") ? (
            <NavigationRefreshFixture />
          ) : parameters.get("editorResponsive") === "1" ? (
            <ResponsiveEditorFixture />
          ) : parameters.get("fieldGeometry") === "1" ? (
            <FieldGeometryFixture />
          ) : parameters.get("controlStates") === "1" ? (
            parameters.has("pickerSurface") ? (
              <PickerEnhancementFixture />
            ) : (
              <ControlStateFixture />
            )
          ) : (
            <FormLabelFixture />
          )}
        </Theme>
      </MiaixzLocaleProvider>
    );
  }

  if (parameters.get("treeFixture") === "1") {
    return (
      <MiaixzLocaleProvider i18n={i18n}>
        <Theme
          appearance={appearance}
          fallback={miaixzDefaultAppearance.theme}
          themes={[legacyTheme]}
        >
          <TreeContractFixture />
        </Theme>
      </MiaixzLocaleProvider>
    );
  }

  return (
    <MiaixzLocaleProvider i18n={i18n}>
      <Theme
        appearance={appearance}
        fallback={miaixzDefaultAppearance.theme}
        themes={[legacyTheme]}
      >
        {accessibilityFixture === null ? (
          <Appearance scope="authenticated" />
        ) : (
          <AccessibilityFixture name={accessibilityFixture} />
        )}
        {accessibilityFixture === null && (
          <main aria-label="Miaixz UI 浏览器契约夹具">
            <ActionShowcase />
            <Panel
              actions={
                <ActionText
                  action={{
                    id: "view-table",
                    kind: "navigation",
                    label: "查看表格",
                    icon: "eye",
                    tone: "neutral",
                    href: "#tables",
                  }}
                />
              }
              description="真实公共出口和固定数据"
              headingLevel={2}
              title="组件状态"
            >
              <Button tone="brand" variant="solid">
                默认按钮
              </Button>
              <Button disabled>禁用按钮</Button>
              <Button loading loadingLabel="正在保存">
                保存
              </Button>
              <IconButton icon="refresh-cw" label="刷新" onClick={() => undefined} />
              <Button
                onClick={() =>
                  appearance.setDensity(
                    appearance.getSnapshot().density === "compact" ? "standard" : "compact",
                  )
                }
              >
                切换密度偏好
              </Button>
              <Status label="品牌状态" tone="brand" />
              <Status label="失败状态" tone="danger" />
              <Switch
                aria-label="启用同步"
                checked={enabled}
                size="small"
                onChange={() => setEnabled((value) => !value)}
              />
            </Panel>

            <Metrics aria-label="四项指标" role="group">
              {metricItems.slice(0, 4)}
            </Metrics>
            <Metrics aria-label="五项紧凑指标" columns={5} density="compact" surface="plain">
              {metricItems}
            </Metrics>

            <Masonry
              aria-label="响应式瀑布流"
              data-testid="masonry-layout"
              columns={4}
              gap="compact"
            >
              {Array.from({ length: 8 }, (_, index) => (
                <article data-testid={`masonry-item-${index + 1}`} key={index}>
                  <strong>卡片 {index + 1}</strong>
                  {Array.from({ length: (index % 3) + 1 }, (_, line) => (
                    <p key={line}>不等高内容行 {line + 1}</p>
                  ))}
                </article>
              ))}
            </Masonry>

            <Panel surface="plain" title="流程与详情">
              <Steps
                items={[
                  { id: "draft", label: "草稿", status: "complete" },
                  { id: "review", label: "审核", status: "current" },
                  { id: "publish", label: "发布" },
                ]}
                label="发布流程"
              />
              <Descriptions
                columns={3}
                density="compact"
                items={[
                  { id: "owner", label: "负责人", value: "Kimi" },
                  { id: "scope", label: "范围", value: "生产" },
                  { id: "version", label: "版本", value: "v1" },
                ]}
              />
            </Panel>

            <section aria-label="原生表单契约" data-testid="native-form-contract">
              <form
                aria-label="原生提交表单"
                onSubmit={(event) => {
                  event.preventDefault();
                  setFormStatus("已提交");
                }}
              >
                <Field label="必填名称" required>
                  <Input name="name" required />
                </Field>
                <DatePicker
                  aria-label="发布日期"
                  defaultValue="2026-09-18"
                  name="releaseDate"
                  referenceDate="2026-09-18"
                />
                <Rating
                  aria-label="服务评分"
                  defaultValue={3.5}
                  name="serviceRating"
                  precision={0.5}
                />
                <Slider aria-label="发布比例" defaultValue={40} name="releasePercent" showValue />
                <Textarea
                  aria-label="发布说明"
                  autoResize
                  defaultValue="固定说明"
                  maxLength={80}
                  name="releaseNotes"
                  showCount
                />
                <FormActions submit={{ id: "native-submit", label: "提交原生表单" }} />
                <output aria-live="polite">{formStatus}</output>
              </form>
            </section>

            <section aria-label="键盘组件契约" data-testid="keyboard-contracts">
              <Tabs
                activationMode="automatic"
                defaultValue="overview"
                items={[
                  { value: "overview", label: "概览", content: "概览内容" },
                  { value: "details", label: "详情", content: "详情内容" },
                ]}
                label="浏览器标签页"
              />
              <Segmented
                aria-label="展示方式"
                defaultValue="list"
                items={[
                  { value: "list", label: "列表", textValue: "列表" },
                  { value: "grid", label: "网格", textValue: "网格" },
                  { value: "board", label: "看板", textValue: "看板" },
                ]}
              />
              <Tag onAction={() => undefined} onRemove={() => undefined} removeLabel="移除筛选">
                当前筛选
              </Tag>
              <Disclosure summary="浏览器高级选项">高级内容</Disclosure>
              <Rating aria-label="键盘评分" defaultValue={2} name="keyboardRating" />
              <Slider aria-label="键盘比例" defaultValue={50} />
              <Toolbar aria-label="编辑工具" behavior="toolbar">
                <Button>第一个工具</Button>
                <Button>第二个工具</Button>
              </Toolbar>
              <Tree
                defaultExpandedIds={[]}
                label="浏览器目录"
                nodes={[
                  {
                    id: "platform",
                    label: "平台",
                    textValue: "平台",
                    children: [{ id: "services", label: "服务", textValue: "服务" }],
                  },
                  { id: "audit", label: "审计", textValue: "审计" },
                ]}
              />
              <Graph
                aria-label="服务关系"
                edges={[{ directed: true, id: "api-db", sourceId: "api", targetId: "db" }]}
                nodes={[
                  { id: "api", label: "API", tone: "brand", x: 25, y: 50 },
                  { id: "db", label: "Database", tone: "data-1", x: 75, y: 50 },
                ]}
                tableCaption="服务连接"
              />
            </section>

            <EditorLayout
              summary={
                <EditorSummary
                  avatar={<span>KL</span>}
                  items={[{ id: "status", label: "状态", value: "启用" }]}
                  subtitle="@kimi"
                  title="编辑摘要"
                />
              }
            >
              <EditorSection description="公共字段布局" layout="two-column" title="基础信息">
                <Field label="名称">
                  <Input defaultValue="固定名称" />
                </Field>
                <Field label="标识">
                  <Input defaultValue="fixture" />
                </Field>
              </EditorSection>
            </EditorLayout>

            <TableContainer id="tables">
              <Table stickyHeader={parameters.has("stickyTable")}>
                <TableCaption>固定成员数据</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow selected>
                    <TableCell>Kimi</TableCell>
                    <TableCell>启用</TableCell>
                  </TableRow>
                  {parameters.has("stickyTable") &&
                    Array.from({ length: 30 }, (_, index) => (
                      <TableRow key={index}>
                        <TableCell>Member {index + 1}</TableCell>
                        <TableCell>启用</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <div ref={setBoundary} data-testid="drawer-boundary">
              <Button onClick={() => setDrawer("outer")}>打开长内容抽屉</Button>
              <Drawer
                boundary={parameters.has("drawerWidth") ? undefined : boundary}
                description="边界、长内容与嵌套场景"
                footer={<Button onClick={() => setDrawer("closed")}>完成</Button>}
                onOpenChange={(open) => setDrawer(open ? "outer" : "closed")}
                open={drawer !== "closed"}
                title="外层抽屉"
                width={drawerWidth}
              >
                {parameters.has("drawerWidth") && (
                  <select
                    aria-label="抽屉宽度"
                    value={drawerWidth}
                    onChange={(event) => setDrawerWidth(Number(event.currentTarget.value))}
                  >
                    {[...DRAWER_WIDTHS, 435.5].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                )}
                <Button onClick={() => setDrawer("nested")}>打开内层抽屉</Button>
                {Array.from({ length: 24 }, (_, index) => (
                  <p key={index}>长内容行 {index + 1}：用于固定抽屉滚动和容器几何。</p>
                ))}
                <Drawer
                  onOpenChange={(open) => setDrawer(open ? "nested" : "outer")}
                  open={drawer === "nested"}
                  title="内层抽屉"
                >
                  <Button>内层操作</Button>
                </Drawer>
              </Drawer>
            </div>
          </main>
        )}
      </Theme>
    </MiaixzLocaleProvider>
  );
}

/**
 * Demonstrates persistent content navigation and native full-document refreshes.
 * @returns Router-neutral navigation example.
 */
function NavigationRefreshFixture() {
  const mode: LinkRefreshMode = parameters.get("navigationRefresh") === "page" ? "page" : "content";
  const override = parameters.get("navigationOverride") as LinkRefreshMode | null;
  const [section, setSection] = useState(
    parameters.get("section") ?? (window.location.hash.slice(1) || "first"),
  );
  const href = new URL(window.location.href);
  if (parameters.get("navigationTarget") === "fragment") href.hash = "second";
  else href.searchParams.set("section", "second");
  return (
    <MiaixzLinkProvider
      refreshMode={mode}
      renderAnchor={(props, ref) => (
        <a
          {...props}
          ref={ref}
          onClick={(event) => {
            props.onClick?.(event);
            if (
              event.defaultPrevented ||
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey ||
              event.currentTarget.target === "_blank"
            )
              return;
            event.preventDefault();
            window.history.pushState(null, "", props.href);
            setSection("second");
          }}
        />
      )}
    >
      <View aria-label="Frame" preserveFrame title={null}>
        <View
          key={parameters.has("localTabs") ? "local" : section}
          inheritFrame
          aria-label="Module"
          title="Module"
          description="Persistent frame"
        >
          {parameters.has("localTabs") ? (
            <Tabs
              label="Local tabs"
              value={section}
              onValueChange={setSection}
              {...(override ? { refreshMode: override } : {})}
              persistenceKey="local-navigation-example"
              items={[
                { value: "first", label: "First", content: <p>Destination first</p> },
                { value: "second", label: "Second", content: <p>Destination second</p> },
              ]}
            />
          ) : (
            <>
              <Navigation
                label="Refresh navigation"
                orientation="horizontal"
                {...(override ? { refreshMode: override } : {})}
                items={[{ id: "second", href: href.href, label: "Second", textValue: "Second" }]}
              />
              <p>Destination {section}</p>
            </>
          )}
        </View>
      </View>
    </MiaixzLinkProvider>
  );
}

const root = document.getElementById("root");
if (root !== null) createRoot(root).render(<BrowserFixture />);
