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
 * Verifies component contracts behavior in the UI package.
 */

import type {
  AvatarGroupProps,
  AvatarProps,
  ActionDescriptor,
  BadgeProps,
  BarProps,
  BreadcrumbProps,
  ButtonLinkProps,
  ButtonProps,
  ButtonGroupProps,
  CheckboxProps,
  CalendarProps,
  ComboboxProps,
  ColumnsProps,
  DatagridProps,
  DatePickerProps,
  DescriptionsProps,
  DividerProps,
  DisclosureProps,
  DrawerProps,
  DropdownProps,
  EmptyProps,
  EntryProps,
  FormActionsProps,
  HeaderProps,
  InputProps,
  NumberInputProps,
  LocaleProps,
  ListProps,
  ListItemProps,
  MetricProps,
  MasonryProps,
  MetricsProps,
  NavigationProps,
  NavigationRailProps,
  PaginationProps,
  PickerProps,
  PanelProps,
  PressableProps,
  ProgressProps,
  RadioProps,
  RatingProps,
  SliderProps,
  SearchProps,
  SegmentedProps,
  SectionsProps,
  SelectProps,
  SkeletonProps,
  SparklineProps,
  SpinnerProps,
  StepsProps,
  SwitchProps,
  TagProps,
  TextareaProps,
  TimelineProps,
  TimePickerProps,
  ToastProps,
  DonutProps,
  TableContainerProps,
  TableGutter,
  TableProps,
  ToolbarProps,
  TreeProps,
  TreeViewMode,
  UploadProps,
  ViewProps,
} from "../../src/index.js";
import type { EditorOverviewProps, EditorSummaryProps } from "../../src/components/editor/index.js";

declare const avatar: AvatarProps;
void avatar.children;
/**
 * @ts-expect-error Avatar owns its image semantics. */
void avatar.role;
/**
 * @ts-expect-error Avatar has one accessible-name source. */
void avatar["aria-label"];
/**
 * @ts-expect-error Avatar has one accessible-name source. */
void avatar["aria-labelledby"];
/**
 * @ts-expect-error Avatar owns decorative fallback semantics. */
void avatar["aria-hidden"];

/**
 * @ts-expect-error Removed scenario sizes are not component sizes. */
const invalidAvatarSize: NonNullable<AvatarProps["size"]> = "account";
void invalidAvatarSize;

const avatarWithContent: AvatarProps = {
  alt: "Folder",
  children: "F",
  srcSet: "/folder.png 1x, /folder@2x.png 2x",
  sizes: "32px",
  variant: "rounded",
};
const avatarGroup: AvatarGroupProps = {
  max: 4,
  spacing: 12,
  total: 24,
  variant: "square",
  renderSurplus: (surplus) => `+${surplus}`,
};
void [avatarWithContent, avatarGroup];

/**
 * @ts-expect-error Avatar accepts only package-owned shape variants. */
const invalidAvatarVariant: NonNullable<AvatarProps["variant"]> = "pill";
void invalidAvatarVariant;

declare const bar: BarProps;
/**
 * @ts-expect-error Bar has no caller-owned content branch. */
void bar.children;
/**
 * @ts-expect-error Bar owns its progress semantics. */
void bar.role;
/**
 * @ts-expect-error Bar derives its name from the discriminated union. */
void bar["aria-label"];
/**
 * @ts-expect-error Removed state aliases are not public inputs. */
void bar.progress;
/**
 * @ts-expect-error Removed state aliases are not public inputs. */
void bar.complete;
/**
 * @ts-expect-error Removed state aliases are not public inputs. */
void bar.indeterminate;

declare const divider: DividerProps;
/**
 * @ts-expect-error Divider is an empty separator. */
void divider.children;
/**
 * @ts-expect-error Divider owns its separator role. */
void divider.role;
/**
 * @ts-expect-error Divider derives orientation semantics from orientation. */
void divider["aria-orientation"];
const disclosure: DisclosureProps = { summary: "Summary", children: "Content" };
void disclosure;

declare const spinner: SpinnerProps;
/**
 * @ts-expect-error Spinner has no caller-owned content branch. */
void spinner.children;
/**
 * @ts-expect-error Spinner owns its status role. */
void spinner.role;
/**
 * @ts-expect-error Spinner uses label as its sole accessible text. */
void spinner["aria-label"];
/**
 * @ts-expect-error Spinner uses label as its sole accessible text. */
void spinner["aria-labelledby"];
/**
 * @ts-expect-error Spinner owns live-region semantics. */
void spinner["aria-live"];
/**
 * @ts-expect-error Spinner owns live-region semantics. */
void spinner["aria-atomic"];

declare const input: InputProps;
const calendar: CalendarProps = { "aria-label": "Date", referenceDate: "2026-09-18" };
const datePicker: DatePickerProps = {
  "aria-label": "Date",
  name: "date",
  referenceDate: "2026-09-18",
};
const timePicker: TimePickerProps = { "aria-label": "Time", name: "time" };
void [calendar, datePicker, timePicker];
const buttonGroup: ButtonGroupProps = { "aria-label": "Actions", children: null };
void buttonGroup;
/**
 * @ts-expect-error Input is a native void element. */
void input.children;
const numberInput: NumberInputProps = { value: null, precision: 2, onValueChange: () => undefined };
void numberInput;
const actionTag: TagProps = { children: "Active", onAction: () => undefined, selected: true };
const linkedTag: TagProps = { children: "Docs", href: "/docs" };
void [actionTag, linkedTag];
/**
 * @ts-expect-error Tag action and href are mutually exclusive. */
const invalidTag: TagProps = { children: "Invalid", href: "/", onAction: () => undefined };
void invalidTag;
declare const textarea: TextareaProps;
/**
 * @ts-expect-error Textarea content is its native value, not children. */
void textarea.children;
declare const search: SearchProps;
/**
 * @ts-expect-error Search content is fixed by its control model. */
void search.children;
const segmented: SegmentedProps<"list" | "grid"> = {
  "aria-label": "View",
  items: [
    { value: "list", label: "List", textValue: "List" },
    { value: "grid", label: "Grid", textValue: "Grid" },
  ],
};
void segmented;
declare const checkbox: CheckboxProps;
/**
 * @ts-expect-error Checkbox content uses label and description. */
void checkbox.children;
declare const radio: RadioProps;
const rating: RatingProps = { "aria-label": "Rating", name: "rating" };
const masonry: MasonryProps = { columns: 3, gap: "compact" };
void [rating, masonry];
/**
 * @ts-expect-error Radio content uses label and description. */
void radio.children;
declare const switchControl: SwitchProps;
/**
 * @ts-expect-error Switch content uses label and description. */
void switchControl.children;
declare const slider: SliderProps;
/**
 * @ts-expect-error Slider is a native void control. */
void slider.children;

/**
 * @ts-expect-error Removed size values are not normalized. */
const invalidSwitchSize: NonNullable<SwitchProps["size"]> = "compact";
void invalidSwitchSize;

declare const progress: ProgressProps;
/**
 * @ts-expect-error Progress has no caller-owned content branch. */
void progress.children;
/**
 * @ts-expect-error Progress owns its progressbar role. */
void progress.role;
/**
 * @ts-expect-error Progress uses label as its sole accessible-name input. */
void progress["aria-label"];
/**
 * @ts-expect-error Progress owns numeric ARIA state. */
void progress["aria-valuenow"];

/**
 * @ts-expect-error Removed size values are not normalized. */
const invalidProgressSize: NonNullable<ProgressProps["size"]> = "thin";
void invalidProgressSize;

declare const skeleton: SkeletonProps;
/**
 * @ts-expect-error Skeleton is an empty placeholder. */
void skeleton.children;
/**
 * @ts-expect-error Skeleton owns its hidden state. */
void skeleton["aria-hidden"];

declare const empty: EmptyProps;
/**
 * @ts-expect-error Empty content comes from structured fields. */
void empty.children;

declare const toast: ToastProps;
/**
 * @ts-expect-error Toast content comes from title, message, and action. */
void toast.children;
/**
 * @ts-expect-error Toaster is the sole live-region owner. */
void toast.role;
/**
 * @ts-expect-error Toaster is the sole live-region owner. */
void toast["aria-live"];
/**
 * @ts-expect-error Toaster is the sole live-region owner. */
void toast["aria-atomic"];

declare const select: SelectProps;
/**
 * @ts-expect-error Select renders only its item model. */
void select.children;
declare const combobox: ComboboxProps;
/**
 * @ts-expect-error Combobox renders only its option source. */
void combobox.children;
declare const dropdown: DropdownProps;
/**
 * @ts-expect-error Dropdown renders only its item model. */
void dropdown.children;
declare const breadcrumb: BreadcrumbProps;
/**
 * @ts-expect-error Breadcrumb renders only its item model. */
void breadcrumb.children;
declare const navigation: NavigationProps;
/**
 * @ts-expect-error Navigation renders only its item model. */
void navigation.children;
declare const pagination: PaginationProps;
/**
 * @ts-expect-error Pagination owns its page entries. */
void pagination.children;
declare const upload: UploadProps;
/**
 * @ts-expect-error Upload owns its fixed content tree. */
void upload.children;
declare const locale: LocaleProps;
/**
 * @ts-expect-error Locale owns its fixed content tree. */
void locale.children;
declare const picker: PickerProps;
/**
 * @ts-expect-error Picker renders only its option source. */
void picker.children;
declare const navigationRail: NavigationRailProps;
/**
 * @ts-expect-error NavigationRail renders only structured groups. */
void navigationRail.children;
/**
 * @ts-expect-error Adaptive overflow is the sole behavior. */
void navigationRail.overflowMode;
declare const datagrid: DatagridProps<unknown>;
/**
 * @ts-expect-error Datagrid renders only rows and columns. */
void datagrid.children;
declare const tree: TreeProps;
/**
 * @ts-expect-error Tree renders only its node model. */
void tree.children;
declare const runtimeTreeView: TreeViewMode;
const treeNodes = [{ id: "root", label: "Root", textValue: "Root" }] as const;
const validTreeContracts: readonly TreeProps[] = [
  { label: "Default", nodes: treeNodes },
  { label: "Runtime", nodes: treeNodes, view: runtimeTreeView },
  { label: "Legacy icon", nodes: treeNodes, slotProps: { icon: { title: "Legacy" } } },
];
const compactTreeContract: TreeProps<unknown, "compact"> = {
  label: "Compact",
  nodes: treeNodes,
  view: "compact",
  viewOptions: { compression: "dense" },
};
const focusTreeContract: TreeProps<unknown, "focus"> = {
  label: "Focus",
  nodes: treeNodes,
  view: "focus",
  defaultViewRootId: null,
  viewOptions: { navigation: "both", windowDepth: 3 },
};
/**
 * @ts-expect-error Controlled and default expansion values are mutually exclusive. */
const invalidControlledTree: TreeProps = {
  expandedIds: [],
  defaultExpandedIds: [],
  label: "Invalid",
  nodes: treeNodes,
};
const invalidCompactOptions: TreeProps<unknown, "compact"> = {
  label: "Invalid compact",
  nodes: treeNodes,
  view: "compact",
  /**
   * @ts-expect-error Compact view accepts only compact options. */
  viewOptions: { windowDepth: 3 },
};
const invalidNestedRoot: TreeProps<unknown, "nested"> = {
  label: "Invalid nested",
  nodes: treeNodes,
  view: "nested",
  /**
   * @ts-expect-error Non-focus literal views cannot own a focus root. */
  viewRootId: null,
};
void [
  validTreeContracts,
  compactTreeContract,
  focusTreeContract,
  invalidControlledTree,
  invalidCompactOptions,
  invalidNestedRoot,
];
declare const steps: StepsProps;
/**
 * @ts-expect-error Steps renders only its item model. */
void steps.children;
declare const timeline: TimelineProps;
/**
 * @ts-expect-error Timeline renders only its item model. */
void timeline.children;
declare const editorSummary: EditorSummaryProps;
/**
 * @ts-expect-error EditorSummary renders only its fact items. */
void editorSummary.children;
declare const editorOverview: EditorOverviewProps;
/**
 * @ts-expect-error EditorOverview renders only its fact items. */
void editorOverview.children;
declare const list: ListProps;
/**
 * @ts-expect-error List renders only its item model. */
void list.children;
void list.variant;
declare const descriptions: DescriptionsProps;
/**
 * @ts-expect-error Descriptions renders only its fact items. */
void descriptions.children;

declare const toolbar: ToolbarProps;
void toolbar.label;
void toolbar.search;
void toolbar.filters;
void toolbar.actions;
/**
 * @ts-expect-error Toolbar has one ordered children source. */
void toolbar.leading;
/**
 * @ts-expect-error Sticky positioning belongs to an outer layout owner. */
void toolbar.sticky;
void toolbar.variant;

declare const drawer: DrawerProps;
/**
 * @ts-expect-error Drawer geometry has one width source. */
void drawer.size;

declare const button: ButtonProps;
/**
 * @ts-expect-error Button has no second start-icon input. */
void button.startAdornment;
/**
 * @ts-expect-error Button has no second end-icon input. */
void button.endAdornment;
declare const buttonLink: ButtonLinkProps;
/**
 * @ts-expect-error ButtonLink has no second start-icon input. */
void buttonLink.startAdornment;
/**
 * @ts-expect-error ButtonLink has no second end-icon input. */
void buttonLink.endAdornment;

/**
 * @ts-expect-error Button icons must be explicit React elements. */
const invalidButtonIcon: ButtonProps = { children: "创建", startIcon: "Plus" };
const invalidButtonLinkIcon: ButtonLinkProps = {
  children: "详情",
  href: "/details",
  /**
   * @ts-expect-error ButtonLink icons must be explicit React elements. */
  startIcon: "ArrowRight",
};
void [invalidButtonIcon, invalidButtonLinkIcon];

/**
 * @ts-expect-error Badge requires its sole label content. */
const badgeWithoutChildren: BadgeProps = {};
/**
 * @ts-expect-error Dropzone requires visible content independently from its accessible label. */
const dropzoneWithoutChildren: import("../../src/index.js").DropzoneProps = {
  label: "上传附件",
  onFiles: () => undefined,
};
/**
 * @ts-expect-error Toolbar requires its sole ordered control collection. */
const toolbarWithoutChildren: ToolbarProps = {};
void [badgeWithoutChildren, dropzoneWithoutChildren, toolbarWithoutChildren];

declare const action: ActionDescriptor;
/**
 * @ts-expect-error Action kind replaces the ambiguous intent field. */
void action.intent;
/**
 * @ts-expect-error Action presentation is not a placement recipe. */
void action.placement;
/**
 * @ts-expect-error Confirmation is owned by the calling workflow. */
void action.confirm;
/**
 * @ts-expect-error Selection state is not an action target field. */
void action.selected;

declare const pressable: PressableProps;
/**
 * @ts-expect-error Pressable has no product recipe variants. */
void pressable.variant;
/**
 * @ts-expect-error Pressable has no product density recipe. */
void pressable.density;
/**
 * @ts-expect-error Pressable has no separator recipe. */
void pressable.separator;

/**
 * @ts-expect-error Badge does not normalize the old outline value. */
const invalidBadgeVariant: NonNullable<BadgeProps["variant"]> = "outline";
/**
 * @ts-expect-error Empty does not normalize the old default value. */
const invalidEmptyVariant: NonNullable<EmptyProps["variant"]> = "default";
/**
 * @ts-expect-error Dropdown does not normalize the old default surface. */
const invalidDropdownSurface: NonNullable<DropdownProps["surface"]> = "default";
void [invalidBadgeVariant, invalidEmptyVariant, invalidDropdownSurface];

declare const entry: EntryProps;
/**
 * @ts-expect-error Entry uses layout as its sole structural axis. */
void entry.variant;
declare const header: HeaderProps;
/**
 * @ts-expect-error Header has no legacy visual recipe. */
void header.variant;
/**
 * @ts-expect-error Header uses the final density vocabulary. */
const invalidHeaderDensity: NonNullable<HeaderProps["density"]> = "default";
void invalidHeaderDensity;

declare const table: TableProps;
/**
 * @ts-expect-error Table has no visual variant recipe. */
void table.variant;
/**
 * @ts-expect-error Table appearance is global; density cannot be customized. */
void table.density;
/**
 * @ts-expect-error Table appearance is global; dividers cannot be customized. */
void table.dividerStyle;
/**
 * @ts-expect-error Table appearance is global; presentations cannot be customized. */
void table.presentation;

const customTableRowHeight: NonNullable<TableProps["rowHeight"]> = 51;
const insetTableGutter: TableGutter = "inset";
const flushTableContainer: TableContainerProps = { gutter: "flush" };

const customDatagridRowHeight: NonNullable<DatagridProps<unknown>["rowHeight"]> = "51px";
/**
 * @ts-expect-error Datagrid has no visual variant recipe. */
void datagrid.variant;
/**
 * @ts-expect-error Datagrid table appearance is global; density cannot be customized. */
void datagrid.density;
/**
 * @ts-expect-error Datagrid has no second row-density input. */
void datagrid.rowSize;
/**
 * @ts-expect-error Datagrid surface was replaced by the layout-specific gutter. */
void datagrid.surface;
/**
 * @ts-expect-error Datagrid gutters use the shared inset or flush vocabulary. */
const invalidDatagridGutter: NonNullable<DatagridProps<unknown>["gutter"]> = "plain";
void [
  invalidDatagridGutter,
  insetTableGutter,
  flushTableContainer,
  customTableRowHeight,
  customDatagridRowHeight,
];

declare const stepsContract: StepsProps;
/**
 * @ts-expect-error Steps uses surface as its sole visual axis. */
void stepsContract.variant;
/**
 * @ts-expect-error Steps does not normalize the old default surface. */
const invalidStepsSurface: NonNullable<StepsProps["surface"]> = "default";
/**
 * @ts-expect-error Timeline uses layout as its sole structural axis. */
void timeline.variant;
/**
 * @ts-expect-error Timeline does not normalize the old default layout. */
const invalidTimelineLayout: NonNullable<TimelineProps["layout"]> = "default";
void [invalidStepsSurface, invalidTimelineLayout];

declare const panel: PanelProps;
/**
 * @ts-expect-error Panel has no legacy variant recipe. */
void panel.variant;
/**
 * @ts-expect-error Panel elevation is represented only by frame. */
void panel.raised;
/**
 * @ts-expect-error Panel does not normalize the old transparent surface. */
const invalidPanelSurface: NonNullable<PanelProps["surface"]> = "transparent";
void invalidPanelSurface;

declare const metric: MetricProps;
/**
 * @ts-expect-error Metric does not normalize removed scenario variants. */
const invalidMetricVariant: NonNullable<MetricProps["variant"]> = "tile";
declare const metrics: MetricsProps;
/**
 * @ts-expect-error Metrics uses layout instead of a scenario variant. */
void metrics.variant;
declare const sparkline: SparklineProps;
/**
 * @ts-expect-error Sparkline does not normalize removed scenario variants. */
const invalidSparklineVariant: NonNullable<SparklineProps["variant"]> = "trend";
declare const donut: DonutProps;
/**
 * @ts-expect-error Donut does not normalize removed scenario variants. */
const invalidDonutVariant: NonNullable<DonutProps["variant"]> = "completion";
void [metric, invalidMetricVariant, sparkline, invalidSparklineVariant, donut, invalidDonutVariant];

declare const columns: ColumnsProps;
/**
 * @ts-expect-error Columns has no product scenario variant. */
void columns.variant;
const largeColumns: NonNullable<ColumnsProps["size"]> = "large";
void largeColumns;

declare const view: ViewProps;
/**
 * @ts-expect-error View uses a closed mode union. */
void view.variant;
/**
 * @ts-expect-error Disabled state belongs to mode-owned items. */
void view.disabled;
/**
 * @ts-expect-error View has no parallel header content input. */
void view.headerContent;
/**
 * @ts-expect-error View has no parallel navigation content input. */
void view.navigationContent;
/**
 * @ts-expect-error View uses slotProps rather than a masthead prop bag. */
void view.mastheadProps;
/**
 * @ts-expect-error View uses slotProps rather than a content prop bag. */
void view.contentProps;

declare const sections: SectionsProps;
/**
 * @ts-expect-error Sections renders only its section model. */
void sections.children;
/**
 * @ts-expect-error Sections has one final declarative source. */
void sections.groups;

const validPanels: readonly PanelProps[] = [
  { children: "内容" },
  { "aria-label": "状态面板", as: "section", children: "内容" },
  { as: "article", children: "内容", interaction: "lift", title: "标题" },
];
/**
 * @ts-expect-error A section Panel requires exactly one accessible name. */
const unnamedSectionPanel: PanelProps = { as: "section", children: "内容" };
/**
 * @ts-expect-error A div Panel cannot expose the landmark-only name branch. */
const namedDivPanel: PanelProps = { "aria-label": "错误名称", children: "内容" };
void [validPanels, unnamedSectionPanel, namedDivPanel];

const validListItems: readonly ListItemProps[] = [
  { content: "静态项", id: "static", kind: "static" },
  { href: "/details", id: "navigation", kind: "navigation", title: "导航项" },
  { id: "command", kind: "command", onAction: () => undefined, title: "命令项" },
];
/**
 * @ts-expect-error Navigation items cannot also expose a command callback. */
const mixedNavigationItem: ListItemProps = {
  href: "/details",
  id: "mixed-navigation",
  kind: "navigation",
  onAction: () => undefined,
  title: "错误项",
};
/**
 * @ts-expect-error Structured copy and free-form content are mutually exclusive. */
const mixedContentItem: ListItemProps = {
  content: "自由内容",
  id: "mixed-content",
  kind: "static",
  title: "结构标题",
};
void [validListItems, mixedNavigationItem, mixedContentItem];

const validViews: readonly ViewProps[] = [
  { "aria-label": "内容模块", children: "内容", mode: "content", title: "标题" },
  {
    "aria-label": "导航模块",
    children: "内容",
    items: [],
    mode: "navigation",
    navigationLabel: "模块导航",
    title: "标题",
  },
  {
    "aria-label": "标签模块",
    items: [{ content: "概览", label: "概览", value: "overview" }],
    mode: "tabs",
    navigationLabel: "模块标签",
    title: "标题",
  },
];
/**
 * @ts-expect-error Tabs mode owns content through each item and rejects outer children. */
const tabsWithChildren: ViewProps = {
  "aria-label": "错误模块",
  children: "重复内容",
  items: [],
  mode: "tabs",
  navigationLabel: "模块标签",
  title: "标题",
};
void [validViews, tabsWithChildren];

/**
 * Row shape shared by the compile-time datagrid component fixtures.
 */
type FixtureRow = { readonly id: string };
const datagridBase = {
  caption: "数据",
  columns: [{ cell: (row: Readonly<FixtureRow>) => row.id, header: "标识", id: "id" }],
  getRowId: (row: Readonly<FixtureRow>) => row.id,
  rows: [{ id: "one" }],
} as const;
const validDatagrids: readonly DatagridProps<FixtureRow>[] = [
  datagridBase,
  { ...datagridBase, selectedRowIds: ["one"], selectionMode: "single" },
  { ...datagridBase, selectedRowIds: ["one"], selectionMode: "multiple" },
];
/**
 * @ts-expect-error No-selection mode cannot carry selected ids. */
const selectionlessDatagrid: DatagridProps<FixtureRow> = {
  ...datagridBase,
  selectedRowIds: ["one"],
  selectionMode: "none",
};
void [validDatagrids, selectionlessDatagrid];

const validFormActions: FormActionsProps = { submit: { id: "save", label: "保存" } };
const submitWithCommandCallback: FormActionsProps = {
  submit: {
    id: "save",
    label: "保存",
    /**
     * Verifies that a submit action cannot expose a command callback.
     *
     * @returns No result because the invalid callback is never invoked.
     * @ts-expect-error Submit stays native and does not accept a command callback. */
    onAction: () => undefined,
  },
};
void [validFormActions, submitWithCommandCallback];
