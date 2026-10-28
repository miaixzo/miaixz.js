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
 * Defines the closed component theme registry and validates its matching contracts.
 */

import type {
  ActionBarOwnerState,
  ActionBarProps,
  ActionDescriptor,
  ActionTextProps,
  FormActionsOwnerState,
  FormActionsProps,
  IconButtonOwnerState,
  IconButtonProps,
  MoreActionsProps,
  RowActionsOwnerState,
  RowActionsProps,
} from "../components/action/action.types.js";
import type { AlertOwnerState, AlertProps } from "../components/alert/alert.types.js";
import type {
  AvatarGroupOwnerState,
  AvatarGroupProps,
  AvatarOwnerState,
  AvatarProps,
} from "../components/avatar/avatar.types.js";
import type { BadgeOwnerState, BadgeProps } from "../components/badge/badge.types.js";
import type { TagOwnerState, TagProps } from "../components/tag/tag.types.js";
import type { BarProps } from "../components/bar/bar.types.js";
import type { BrandOwnerState, BrandProps } from "../components/brand/brand.types.js";
import type {
  BreadcrumbOwnerState,
  BreadcrumbProps,
} from "../components/breadcrumb/breadcrumb.types.js";
import type {
  ButtonLinkProps,
  ButtonOwnerState,
  ButtonProps,
} from "../components/button/button.types.js";
import type {
  ButtonGroupOwnerState,
  ButtonGroupProps,
} from "../components/button/button-group.types.js";
import type { CheckboxOwnerState, CheckboxProps } from "../components/checkbox/checkbox.types.js";
import type { ClusterProps } from "../components/cluster/cluster.types.js";
import type { ColumnsOwnerState, ColumnsProps } from "../components/columns/columns.types.js";
import type { ComboboxOwnerState, ComboboxProps } from "../components/combobox/combobox.types.js";
import type { ConfirmOwnerState, ConfirmProps } from "../components/confirm/confirm.types.js";
import type { DatagridProps } from "../components/datagrid/datagrid.types.js";
import type { CalendarOwnerState, CalendarProps } from "../components/date/calendar.types.js";
import type {
  DatePickerOwnerState,
  DatePickerProps,
} from "../components/date/date-picker.types.js";
import type {
  TimePickerOwnerState,
  TimePickerProps,
} from "../components/date/time-picker.types.js";
import type {
  DescriptionsOwnerState,
  DescriptionsProps,
} from "../components/descriptions/descriptions.types.js";
import type { GraphOwnerState, GraphProps } from "../components/diagram/graph/graph.types.js";
import type { DialogOwnerState, DialogProps } from "../components/dialog/dialog.types.js";
import type {
  DisclosureOwnerState,
  DisclosureProps,
} from "../components/disclosure/disclosure.types.js";
import type { DividerProps } from "../components/divider/divider.types.js";
import type { DonutOwnerState, DonutProps } from "../components/donut/donut.types.js";
import type { DrawerOwnerState, DrawerProps } from "../components/drawer/drawer.types.js";
import type { DropdownPresentation, DropdownProps } from "../components/dropdown/dropdown.types.js";
import type { DropzoneOwnerState, DropzoneProps } from "../components/dropzone/dropzone.types.js";
import type {
  EditorActionsProps,
  EditorBoxProps,
  EditorFieldsetProps,
  EditorFieldsProps,
  EditorFormProps,
  EditorGroupOwnerState,
  EditorGroupProps,
  EditorLayoutOwnerState,
  EditorLayoutProps,
  EditorOverviewOwnerState,
  EditorOverviewProps,
  EditorPickerProps,
  EditorSectionOwnerState,
  EditorSectionProps,
  EditorStatusProps,
  EditorSummaryOwnerState,
  EditorSummaryProps,
} from "../components/editor/editor.types.js";
import type { EmptyOwnerState, EmptyProps } from "../components/empty/empty.types.js";
import type {
  ExceptionOwnerState,
  ExceptionProps,
} from "../components/exception/exception.types.js";
import type { EntryOwnerState, EntryProps } from "../components/entry/entry.types.js";
import type { FieldOwnerState, FieldProps } from "../components/field/field.types.js";
import type { GridProps } from "../components/grid/grid.types.js";
import type { HeaderOwnerState, HeaderProps } from "../components/header/header.types.js";
import type {
  HeatmapLegendOwnerState,
  HeatmapLegendProps,
  HeatmapOwnerState,
  HeatmapProps,
} from "../components/heatmap/heatmap.types.js";
import type { HiddenProps } from "../components/hidden/hidden.types.js";
import type { InputOwnerState, InputProps } from "../components/input/input.types.js";
import type {
  NumberInputOwnerState,
  NumberInputProps,
} from "../components/input/number-input.types.js";
import type { LinkOwnerState, LinkProps } from "../components/link/link.types.js";
import type {
  ListCounterProps,
  ListItemOwnerState,
  ListItemProps,
  ListMarkerProps,
  ListOwnerState,
  ListProps,
} from "../components/list/list.types.js";
import type { LocaleOwnerState, LocaleProps } from "../components/locale/locale.types.js";
import type { MetricOwnerState, MetricProps } from "../components/metrics/metric.types.js";
import type { MasonryOwnerState, MasonryProps } from "../components/masonry/masonry.types.js";
import type { MetricsProps } from "../components/metrics/metrics.types.js";
import type {
  NavigationRailGroupOwnerState,
  NavigationRailGroupProps,
} from "../components/navigation/navigation-rail-group.types.js";
import type {
  NavigationRailOwnerState,
  NavigationRailProps,
} from "../components/navigation/navigation-rail.types.js";
import type {
  NavigationOwnerState,
  NavigationProps,
} from "../components/navigation/navigation.types.js";
import type { NoticeOwnerState, NoticeProps } from "../components/notice/notice.types.js";
import type { OverlayOwnerState, OverlayProps } from "../components/overlay/overlay.types.js";
import type { PageProps } from "../components/page/page.types.js";
import type {
  PaginationOwnerState,
  PaginationProps,
} from "../components/pagination/pagination.types.js";
import type {
  PanelFooterOwnerState,
  PanelFooterProps,
  PanelHeaderOwnerState,
  PanelHeaderProps,
  PanelOwnerState,
  PanelProps,
  PanelRowOwnerState,
  PanelRowProps,
} from "../components/panel/panel.types.js";
import type { PickerProps } from "../components/picker/picker.types.js";
import type { PopoverOwnerState, PopoverProps } from "../components/popover/popover.types.js";
import type { PressableProps } from "../components/pressable/pressable.types.js";
import type { ProgressOwnerState, ProgressProps } from "../components/progress/progress.types.js";
import type {
  RadioGroupOwnerState,
  RadioGroupProps,
} from "../components/radio/radio-group.types.js";
import type { RadioOwnerState, RadioProps } from "../components/radio/radio.types.js";
import type { RatingOwnerState, RatingProps } from "../components/rating/rating.types.js";
import type { SliderOwnerState, SliderProps } from "../components/slider/slider.types.js";
import type { ScrollProps } from "../components/scroll/scroll.types.js";
import type { SearchOwnerState, SearchProps } from "../components/search/search.types.js";
import type {
  SegmentedOwnerState,
  SegmentedProps,
} from "../components/segmented/segmented.types.js";
import type { SectionsOwnerState, SectionsProps } from "../components/sections/sections.types.js";
import type { SelectOwnerState, SelectProps } from "../components/select/select.types.js";
import type { ShellOwnerState, ShellProps } from "../components/shell/shell.types.js";
import type { SidebarOwnerState, SidebarProps } from "../components/sidebar/sidebar.types.js";
import type { SkeletonOwnerState, SkeletonProps } from "../components/skeleton/skeleton.types.js";
import type {
  SparklineOwnerState,
  SparklineProps,
} from "../components/sparkline/sparkline.types.js";
import type { SpinnerOwnerState, SpinnerProps } from "../components/spinner/spinner.types.js";
import type { SplitProps } from "../components/split/split.types.js";
import type { StackProps } from "../components/stack/stack.types.js";
import type { StatusOwnerState, StatusProps } from "../components/status/status.types.js";
import type { StepsOwnerState, StepsProps } from "../components/steps/steps.types.js";
import type { SwitchOwnerState, SwitchProps } from "../components/switch/switch.types.js";
import type {
  TableBodyProps,
  TableCaptionProps,
  TableCellProps,
  TableContainerProps,
  TableFooterProps,
  TableHeaderOwnerState,
  TableHeaderProps,
  TableHeadProps,
  TableGutter,
  TableOwnerState,
  TableProps,
  TableRowProps,
} from "../components/table/table.types.js";
import type { TabsOwnerState, TabsProps } from "../components/tabs/tabs.types.js";
import type { TextareaOwnerState, TextareaProps } from "../components/textarea/textarea.types.js";
import type { TimelineOwnerState, TimelineProps } from "../components/timeline/timeline.types.js";
import type { ToastOwnerState, ToastProps } from "../components/toast/toast.types.js";
import type { ToasterOwnerState, ToasterProps } from "../components/toaster/toaster.types.js";
import type { ToolbarProps } from "../components/toolbar/toolbar.types.js";
import type { TransferOwnerState, TransferProps } from "../components/transfer/transfer.types.js";
import type { TooltipOwnerState, TooltipProps } from "../components/tooltip/tooltip.types.js";
import type { TreeOwnerState, TreeProps, TreeViewMode } from "../components/tree/tree.types.js";
import type { UploadOwnerState, UploadProps } from "../components/upload/upload.types.js";
import type { ViewOwnerState, ViewProps } from "../components/view/view.types.js";
import type { AppearanceOwnerState, AppearanceProps } from "../appearance/appearance.types.js";
import { classNames } from "../shared/class-names.js";

/**
 * Scalar values eligible for theme-variant state matching.
 */
type MiaixzPrimitive = string | number | boolean | null | undefined;
/**
 * Selects state keys whose values can participate in scalar theme-variant matching.
 */
type MiaixzPrimitiveKeys<State> = {
  [Key in keyof State]-?: State[Key] extends MiaixzPrimitive ? Key : never;
}[keyof State];
/**
 * Owner-state projection containing only scalar variant-matchable fields.
 */
type MiaixzThemeVariantState<State> = Pick<State, MiaixzPrimitiveKeys<State>>;
/**
 * Slot names inferred from component slotProps, falling back to root when no slots are declared.
 */
type MiaixzThemeSlots<Props> = Props extends { readonly slotProps?: infer SlotProps }
  ? Extract<keyof NonNullable<SlotProps>, string>
  : "root";
/**
 * Registry association between a component's props, owner state, and available slot names.
 */
type MiaixzThemeEntry<Props, OwnerState> = {
  readonly props: Props;
  readonly ownerState: OwnerState;
  readonly slot: MiaixzThemeSlots<Props>;
};
/**
 * Empty owner-state contract for components without theme-variant state.
 */
type MiaixzEmptyOwnerState = Readonly<Record<never, never>>;

/**
 * Registers the closed set of public DOM component theme contracts. @internal
 */
export interface MiaixzThemeComponentRegistry {
  readonly Pressable: MiaixzThemeEntry<PressableProps, { readonly disabled: boolean }>;
  readonly Button: MiaixzThemeEntry<ButtonProps, ButtonOwnerState>;
  readonly ButtonGroup: MiaixzThemeEntry<ButtonGroupProps, ButtonGroupOwnerState>;
  readonly ButtonLink: MiaixzThemeEntry<ButtonLinkProps, ButtonOwnerState>;
  readonly Link: MiaixzThemeEntry<LinkProps, LinkOwnerState>;
  readonly Tag: MiaixzThemeEntry<TagProps, TagOwnerState>;
  readonly ActionText: MiaixzThemeEntry<
    ActionTextProps,
    {
      readonly kind: ActionDescriptor["kind"];
      readonly tone: NonNullable<ActionDescriptor["tone"]>;
      readonly size: NonNullable<ActionDescriptor["size"]>;
      readonly disabled: boolean;
      readonly loading: boolean;
    }
  >;
  readonly IconButton: MiaixzThemeEntry<IconButtonProps, IconButtonOwnerState>;
  readonly ActionBar: MiaixzThemeEntry<ActionBarProps, ActionBarOwnerState>;
  readonly MoreActions: MiaixzThemeEntry<MoreActionsProps, { readonly hasActions: boolean }>;
  readonly RowActions: MiaixzThemeEntry<RowActionsProps, RowActionsOwnerState>;
  readonly FormActions: MiaixzThemeEntry<FormActionsProps, FormActionsOwnerState>;
  readonly Field: MiaixzThemeEntry<FieldProps, FieldOwnerState>;
  readonly Input: MiaixzThemeEntry<InputProps, InputOwnerState>;
  readonly Calendar: MiaixzThemeEntry<CalendarProps, CalendarOwnerState>;
  readonly DatePicker: MiaixzThemeEntry<DatePickerProps, DatePickerOwnerState>;
  readonly TimePicker: MiaixzThemeEntry<TimePickerProps, TimePickerOwnerState>;
  readonly NumberInput: MiaixzThemeEntry<NumberInputProps, NumberInputOwnerState>;
  readonly Textarea: MiaixzThemeEntry<TextareaProps, TextareaOwnerState>;
  readonly Search: MiaixzThemeEntry<SearchProps, SearchOwnerState>;
  readonly Segmented: MiaixzThemeEntry<SegmentedProps, SegmentedOwnerState>;
  readonly Checkbox: MiaixzThemeEntry<CheckboxProps, CheckboxOwnerState>;
  readonly Radio: MiaixzThemeEntry<RadioProps, RadioOwnerState>;
  readonly Rating: MiaixzThemeEntry<RatingProps, RatingOwnerState>;
  readonly Masonry: MiaixzThemeEntry<MasonryProps, MasonryOwnerState>;
  readonly RadioGroup: MiaixzThemeEntry<RadioGroupProps, RadioGroupOwnerState>;
  readonly Switch: MiaixzThemeEntry<SwitchProps, SwitchOwnerState>;
  readonly Slider: MiaixzThemeEntry<SliderProps, SliderOwnerState>;
  readonly Select: MiaixzThemeEntry<SelectProps, SelectOwnerState>;
  readonly Combobox: MiaixzThemeEntry<ComboboxProps, ComboboxOwnerState>;
  readonly Picker: MiaixzThemeEntry<PickerProps, ComboboxOwnerState>;
  readonly Alert: MiaixzThemeEntry<AlertProps, AlertOwnerState>;
  readonly Notice: MiaixzThemeEntry<NoticeProps, NoticeOwnerState>;
  readonly Overlay: MiaixzThemeEntry<OverlayProps, OverlayOwnerState>;
  readonly Toast: MiaixzThemeEntry<ToastProps, ToastOwnerState>;
  readonly Toaster: MiaixzThemeEntry<ToasterProps, ToasterOwnerState>;
  readonly Tooltip: MiaixzThemeEntry<TooltipProps, TooltipOwnerState>;
  readonly Popover: MiaixzThemeEntry<PopoverProps, PopoverOwnerState>;
  readonly Dropdown: MiaixzThemeEntry<
    DropdownProps,
    DropdownPresentation & { readonly open: boolean }
  >;
  readonly Dialog: MiaixzThemeEntry<DialogProps, DialogOwnerState>;
  readonly Disclosure: MiaixzThemeEntry<DisclosureProps, DisclosureOwnerState>;
  readonly Confirm: MiaixzThemeEntry<ConfirmProps, ConfirmOwnerState>;
  readonly Drawer: MiaixzThemeEntry<DrawerProps, DrawerOwnerState>;
  readonly Toolbar: MiaixzThemeEntry<
    ToolbarProps,
    {
      readonly behavior: "group" | "toolbar";
      readonly surface: "plain" | "filled";
      readonly density: "compact" | "standard" | "comfortable";
      readonly orientation: "horizontal" | "vertical";
      readonly wrap: boolean;
    }
  >;
  readonly Transfer: MiaixzThemeEntry<TransferProps, TransferOwnerState>;
  readonly Tabs: MiaixzThemeEntry<TabsProps, TabsOwnerState>;
  readonly View: MiaixzThemeEntry<ViewProps, ViewOwnerState>;
  readonly Panel: MiaixzThemeEntry<PanelProps, PanelOwnerState>;
  readonly PanelHeader: MiaixzThemeEntry<PanelHeaderProps, PanelHeaderOwnerState>;
  readonly PanelFooter: MiaixzThemeEntry<PanelFooterProps, PanelFooterOwnerState>;
  readonly PanelRow: MiaixzThemeEntry<PanelRowProps, PanelRowOwnerState>;
  readonly List: MiaixzThemeEntry<ListProps, ListOwnerState>;
  readonly ListItem: MiaixzThemeEntry<ListItemProps, ListItemOwnerState>;
  readonly ListCounter: MiaixzThemeEntry<ListCounterProps, MiaixzEmptyOwnerState>;
  readonly ListMarker: MiaixzThemeEntry<ListMarkerProps, MiaixzEmptyOwnerState>;
  readonly Metric: MiaixzThemeEntry<MetricProps, MetricOwnerState>;
  readonly Metrics: MiaixzThemeEntry<
    MetricsProps,
    {
      readonly layout: "strip" | "grid";
      readonly columns: 3 | 4 | 5;
      readonly responsive: "default" | "mobile" | "none";
      readonly surface: "filled" | "plain";
      readonly density: "compact" | "standard" | "comfortable";
      readonly spacingAfter: "none" | "compact";
    }
  >;
  readonly Graph: MiaixzThemeEntry<GraphProps, GraphOwnerState>;
  readonly Avatar: MiaixzThemeEntry<AvatarProps, AvatarOwnerState>;
  readonly AvatarGroup: MiaixzThemeEntry<AvatarGroupProps, AvatarGroupOwnerState>;
  readonly Divider: MiaixzThemeEntry<DividerProps, MiaixzEmptyOwnerState>;
  readonly Spinner: MiaixzThemeEntry<SpinnerProps, SpinnerOwnerState>;
  readonly Hidden: MiaixzThemeEntry<HiddenProps, MiaixzEmptyOwnerState>;
  readonly Cluster: MiaixzThemeEntry<
    ClusterProps,
    {
      readonly justify: NonNullable<ClusterProps["justify"]>;
      readonly gap: NonNullable<ClusterProps["gap"]>;
    }
  >;
  readonly Grid: MiaixzThemeEntry<
    GridProps,
    { readonly minItemWidth: NonNullable<GridProps["minItemWidth"]> }
  >;
  readonly Split: MiaixzThemeEntry<
    SplitProps,
    { readonly ratio: NonNullable<SplitProps["ratio"]> }
  >;
  readonly Stack: MiaixzThemeEntry<StackProps, { readonly gap: NonNullable<StackProps["gap"]> }>;
  readonly Dropzone: MiaixzThemeEntry<DropzoneProps, DropzoneOwnerState>;
  readonly Upload: MiaixzThemeEntry<UploadProps, UploadOwnerState>;
  readonly Locale: MiaixzThemeEntry<LocaleProps, LocaleOwnerState>;
  readonly Appearance: MiaixzThemeEntry<AppearanceProps, AppearanceOwnerState>;
  readonly Badge: MiaixzThemeEntry<BadgeProps, BadgeOwnerState>;
  readonly Status: MiaixzThemeEntry<StatusProps, StatusOwnerState>;
  readonly Progress: MiaixzThemeEntry<ProgressProps, ProgressOwnerState>;
  readonly Skeleton: MiaixzThemeEntry<SkeletonProps, SkeletonOwnerState>;
  readonly Empty: MiaixzThemeEntry<EmptyProps, EmptyOwnerState>;
  readonly Exception: MiaixzThemeEntry<ExceptionProps, ExceptionOwnerState>;
  readonly Bar: MiaixzThemeEntry<
    BarProps,
    { readonly active: boolean; readonly decorative: boolean }
  >;
  readonly Brand: MiaixzThemeEntry<BrandProps, BrandOwnerState>;
  readonly Scroll: MiaixzThemeEntry<
    ScrollProps,
    { readonly focusable: "auto" | "always" | "never" }
  >;
  readonly Entry: MiaixzThemeEntry<EntryProps, EntryOwnerState>;
  readonly Page: MiaixzThemeEntry<
    PageProps,
    { readonly component: "div" | "section"; readonly fullWidth: boolean }
  >;
  readonly Header: MiaixzThemeEntry<HeaderProps, HeaderOwnerState>;
  readonly Shell: MiaixzThemeEntry<ShellProps, ShellOwnerState>;
  readonly Sidebar: MiaixzThemeEntry<SidebarProps, SidebarOwnerState>;
  readonly Breadcrumb: MiaixzThemeEntry<BreadcrumbProps, BreadcrumbOwnerState>;
  readonly Navigation: MiaixzThemeEntry<NavigationProps, NavigationOwnerState>;
  readonly NavigationRail: MiaixzThemeEntry<NavigationRailProps, NavigationRailOwnerState>;
  readonly NavigationRailGroup: MiaixzThemeEntry<
    NavigationRailGroupProps,
    NavigationRailGroupOwnerState
  >;
  readonly Pagination: MiaixzThemeEntry<PaginationProps, PaginationOwnerState>;
  readonly Sections: MiaixzThemeEntry<SectionsProps, SectionsOwnerState>;
  readonly Table: MiaixzThemeEntry<TableProps, TableOwnerState>;
  readonly TableHeader: MiaixzThemeEntry<TableHeaderProps, TableHeaderOwnerState>;
  readonly TableBody: MiaixzThemeEntry<TableBodyProps, MiaixzEmptyOwnerState>;
  readonly TableRow: MiaixzThemeEntry<
    TableRowProps,
    { readonly selected: boolean; readonly rowHeight: TableRowProps["rowHeight"] }
  >;
  readonly TableHead: MiaixzThemeEntry<
    TableHeadProps,
    { readonly numeric: boolean; readonly actions: boolean }
  >;
  readonly TableCell: MiaixzThemeEntry<
    TableCellProps,
    { readonly numeric: boolean; readonly actions: boolean; readonly empty: boolean }
  >;
  readonly TableContainer: MiaixzThemeEntry<
    TableContainerProps,
    {
      readonly frame: "default" | "plain";
      readonly gutter: TableGutter;
      readonly surface: "default" | "transparent";
    }
  >;
  readonly TableFooter: MiaixzThemeEntry<TableFooterProps, MiaixzEmptyOwnerState>;
  readonly TableCaption: MiaixzThemeEntry<TableCaptionProps, MiaixzEmptyOwnerState>;
  readonly Datagrid: MiaixzThemeEntry<
    DatagridProps<unknown>,
    {
      readonly state: "loading" | "error" | "empty" | "ready";
      readonly gutter: TableGutter;
      readonly rowHeight: TableProps["rowHeight"];
      readonly layout: "auto" | "fixed";
      readonly bodyLayout: "content" | "fill";
      readonly selectionMode: "none" | "single" | "multiple";
    }
  >;
  readonly Descriptions: MiaixzThemeEntry<DescriptionsProps, DescriptionsOwnerState>;
  readonly Tree: MiaixzThemeEntry<TreeProps<unknown, TreeViewMode>, TreeOwnerState>;
  readonly Steps: MiaixzThemeEntry<StepsProps, StepsOwnerState>;
  readonly Timeline: MiaixzThemeEntry<TimelineProps, TimelineOwnerState>;
  readonly EditorLayout: MiaixzThemeEntry<EditorLayoutProps, EditorLayoutOwnerState>;
  readonly EditorForm: MiaixzThemeEntry<
    EditorFormProps,
    { readonly presentation: NonNullable<EditorFormProps["presentation"]> }
  >;
  readonly EditorSummary: MiaixzThemeEntry<EditorSummaryProps, EditorSummaryOwnerState>;
  readonly EditorSection: MiaixzThemeEntry<EditorSectionProps, EditorSectionOwnerState>;
  readonly EditorFieldset: MiaixzThemeEntry<
    EditorFieldsetProps,
    { readonly emphasis: "default" | "strong" }
  >;
  readonly EditorFields: MiaixzThemeEntry<
    EditorFieldsProps,
    { readonly minItemWidth: NonNullable<EditorFieldsProps["minItemWidth"]> }
  >;
  readonly EditorActions: MiaixzThemeEntry<EditorActionsProps, MiaixzEmptyOwnerState>;
  readonly EditorBox: MiaixzThemeEntry<EditorBoxProps, MiaixzEmptyOwnerState>;
  readonly EditorGroup: MiaixzThemeEntry<EditorGroupProps, EditorGroupOwnerState>;
  readonly EditorOverview: MiaixzThemeEntry<EditorOverviewProps, EditorOverviewOwnerState>;
  readonly EditorPicker: MiaixzThemeEntry<EditorPickerProps, MiaixzEmptyOwnerState>;
  readonly EditorStatus: MiaixzThemeEntry<
    EditorStatusProps,
    { readonly tone: EditorStatusProps["tone"] }
  >;
  readonly Sparkline: MiaixzThemeEntry<SparklineProps, SparklineOwnerState>;
  readonly Donut: MiaixzThemeEntry<DonutProps, DonutOwnerState>;
  readonly Columns: MiaixzThemeEntry<ColumnsProps, ColumnsOwnerState>;
  readonly Heatmap: MiaixzThemeEntry<HeatmapProps, HeatmapOwnerState>;
  readonly HeatmapLegend: MiaixzThemeEntry<HeatmapLegendProps, HeatmapLegendOwnerState>;
}

/**
 * Configures defaults and class-only variants for one themed component. @public
 */
export interface ComponentTheme<Props, OwnerState, Slot extends string> {
  readonly defaultProps?: Partial<Props>;
  readonly slotClassNames?: Partial<Record<Slot, string>>;
  readonly variants?: readonly {
    readonly props: Readonly<Partial<MiaixzThemeVariantState<OwnerState>>>;
    readonly slotClassNames: Partial<Record<Slot, string>>;
  }[];
}

/**
 * Defines component-level runtime configuration supported by Theme. @public
 */
export type ThemeComponents = {
  readonly [Name in keyof MiaixzThemeComponentRegistry]?: ComponentTheme<
    MiaixzThemeComponentRegistry[Name]["props"],
    MiaixzThemeComponentRegistry[Name]["ownerState"],
    MiaixzThemeComponentRegistry[Name]["slot"]
  >;
};

/**
 * Resolves one concrete component theme from the registry. @internal
 */
export type MiaixzThemeComponent<Name extends keyof MiaixzThemeComponentRegistry> = NonNullable<
  ThemeComponents[Name]
>;

/**
 * Merges parent and child runtime components without component-specific branches. @internal
 *
 * @param parent - Inherited component theme registry.
 * @param child - Locally supplied component theme registry.
 * @returns Frozen merged registry with child values taking precedence.
 */
export function mergeMiaixzThemeComponents(
  parent: Readonly<ThemeComponents>,
  child: Readonly<ThemeComponents> | undefined,
): Readonly<ThemeComponents> {
  if (child === undefined) return parent;
  const result: Record<string, unknown> = {};
  const names = new Set([...Object.keys(parent), ...Object.keys(child)]);
  for (const name of names) {
    const merged = mergeComponentTheme(
      Reflect.get(parent, name) as UntypedComponentTheme | undefined,
      Reflect.get(child, name) as UntypedComponentTheme | undefined,
    );
    if (merged !== undefined) result[name] = merged;
  }
  return Object.freeze(result) as Readonly<ThemeComponents>;
}

/**
 * Returns base and matching variant classes for one slot in declaration order. @internal
 *
 * @typeParam Props - Component public property contract.
 * @typeParam OwnerState - Effective component owner-state contract.
 * @typeParam Slot - Component slot name union.
 * @param theme - Component theme containing base and variant class names.
 * @param ownerState - Effective owner state used to match variants.
 * @param slot - Slot whose class names are requested.
 * @returns Base class followed by matching variant classes in declaration order.
 */
export function getMiaixzThemeSlotClassNames<Props, OwnerState extends object, Slot extends string>(
  theme: ComponentTheme<Props, OwnerState, Slot>,
  ownerState: Readonly<OwnerState>,
  slot: Slot,
): readonly (string | undefined)[] {
  const classes: (string | undefined)[] = [theme.slotClassNames?.[slot]];
  for (const variant of theme.variants ?? []) {
    const matches = Object.entries(variant.props).every(([key, expected]) =>
      Object.is(Reflect.get(ownerState, key), expected),
    );
    if (matches) classes.push(variant.slotClassNames[slot]);
  }
  return classes;
}

/**
 * Type-erased component theme used while resolving registry-defined defaults and styles.
 */
interface UntypedComponentTheme {
  readonly defaultProps?: Readonly<Record<string, unknown>>;
  readonly slotClassNames?: Readonly<Record<string, string>>;
  readonly variants?: readonly {
    readonly props: Readonly<Record<string, MiaixzPrimitive>>;
    readonly slotClassNames: Readonly<Record<string, string>>;
  }[];
}

/**
 * Merges two untyped component theme definitions at the registry boundary.
 *
 * @param parent - Inherited component theme definition.
 * @param child - Locally supplied component theme definition.
 * @returns Merged definition, or the single defined input.
 */
function mergeComponentTheme(
  parent: UntypedComponentTheme | undefined,
  child: UntypedComponentTheme | undefined,
): UntypedComponentTheme | undefined {
  if (parent === undefined) return child;
  if (child === undefined) return parent;
  const slots = new Set([
    ...Object.keys(parent.slotClassNames ?? {}),
    ...Object.keys(child.slotClassNames ?? {}),
  ]);
  const slotClassNames: Record<string, string> = {};
  for (const slot of slots) {
    const merged = classNames(parent.slotClassNames?.[slot], child.slotClassNames?.[slot]);
    if (merged !== undefined) slotClassNames[slot] = merged;
  }
  return {
    defaultProps: { ...parent.defaultProps, ...child.defaultProps },
    slotClassNames,
    variants: [...(parent.variants ?? []), ...(child.variants ?? [])],
  };
}
