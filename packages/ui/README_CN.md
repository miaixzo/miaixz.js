# @miaixz/ui

[English](./README.md) | [简体中文](./README_CN.md)

`@miaixz/ui` 是 Miaixz 的 React 设计系统，提供组件、设计令牌、主题、密度模式、样式层和交互基础能力。组件遵循原生语义、键盘操作和可见焦点；图标能力由独立的 `@miaixz/icons` 包提供。

## 安装

```bash
npm install @miaixz/ui @miaixz/icons @miaixz/sdk react react-dom
```

`@miaixz/icons`、`@miaixz/sdk`、`react` 和 `react-dom` 是 peer dependencies，准确支持范围以已安装包的元数据为准。

## 基本用法

在应用入口加载一次完整样式，并在组件树上层提供 SDK 国际化实例：

```tsx
import "@miaixz/ui/styles.css";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { Button, Field, Input, MiaixzLocaleProvider } from "@miaixz/ui";

const i18n = createMiaixzI18n({ locale: "zh-CN", fallbackLocale: "en-US" });

export function Example() {
  return (
    <MiaixzLocaleProvider i18n={i18n}>
      <Field label="空间名称" required>
        <Input placeholder="请输入空间名称" />
      </Field>
      <Button type="button">保存</Button>
    </MiaixzLocaleProvider>
  );
}
```

组件既可以从根入口导入，也可以通过稳定子路径按需导入：

```tsx
import { Button } from "@miaixz/ui/button";
import { Graph } from "@miaixz/ui/diagram/graph";
import { Icon, type IconName } from "@miaixz/icons";
import "@miaixz/icons/styles.css";
import "@miaixz/ui/button/styles.css";
import "@miaixz/ui/diagram/graph/styles.css";

const tenantIcon: IconName = "blocks";

<Icon name={tenantIcon} size="navigation" />;
```

不要直接导入 `src`、`dist` 或其他内部路径。完整公共入口以 `package.json` 的 exports 映射和[英文文档的公共入口表](./README.md#public-entries)为准。

## 样式层

- `@miaixz/ui/foundation.css`：设计令牌，以及主题、排版、间距、圆角、阴影、动效和密度基础能力。
- `@miaixz/ui/components.css`：组件样式；与基础层选择器重叠时，以组件层为准。
- `@miaixz/ui/styles.css`：推荐的完整入口，按稳定顺序组合基础层和组件层。
- `@miaixz/ui/<subpath>/styles.css`：每个公开 DOM 模块唯一的按需样式入口；Graph 使用 `@miaixz/ui/diagram/graph/styles.css`。

业务应用不应覆盖内部组件选择器。品牌定制应使用公开 CSS 变量和运行时外观设置。

## 主题、颜色和密度

独立的 SDK Appearance manager 负责外观状态，所有者显式配置同步，`Theme` 是校验并应用这些设置到 DOM 的唯一运行时所有者：

```tsx
import { createMiaixzAppearanceManager } from "@miaixz/sdk";
import { Theme } from "@miaixz/ui";

const appearance = createMiaixzAppearanceManager({ appId: "portal" });

appearance.patch({
  colorMode: "system",
  density: "comfortable",
  overrides: { light: { brand: "#55b52d" } },
});

export function Root() {
  return (
    <Theme appearance={appearance}>
      <App />
    </Theme>
  );
}
```

明暗模式支持 `light`、`dark` 和 `system`；密度支持 `compact`、`standard` 和 `comfortable`。主题定义、类型、生成 CSS 和运行时逻辑统一位于 `src/theme/`；预设目录是私有实现，不是公共导入路径。

## 国际化

UI 包只注册通用组件消息，业务文案由项目自己的语言目录提供，并复用同一个 SDK 国际化实例：

```tsx
import { createMiaixzI18n, createMiaixzMessageLoader } from "@miaixz/sdk/i18n";
import { MiaixzLocaleProvider } from "@miaixz/ui/i18n";

const loadMessages = createMiaixzMessageLoader({
  portal: {
    "zh-CN": () => import("./locales/zh-CN.js"),
    "en-US": () => import("./locales/en-US.js"),
  },
});

const i18n = createMiaixzI18n({
  locale: "zh-CN",
  fallbackLocale: "en-US",
  loadMessages,
});

await i18n.initialize(["portal"]);

export function Root() {
  return (
    <MiaixzLocaleProvider i18n={i18n}>
      <App />
    </MiaixzLocaleProvider>
  );
}
```

项目消息优先于内置消息。缺失消息先回退到 `fallbackLocale`，仍不存在时返回消息键。`useMiaixzLocale()` 提供当前快照、翻译函数和命名空间加载能力。

## 组件范围

- 基础与表单：Button、ButtonGroup、Input、NumberInput、Search、Textarea、Select、Combobox、Picker、Field、Checkbox、Radio、Rating、Slider、Switch、Calendar、DatePicker、TimePicker、Dropzone、Upload。
- 导航与布局：Navigation、Breadcrumb、Tabs、Segmented、Toolbar、Shell、Page、View、Header、Grid、Masonry、Cluster、Split、Stack、Sidebar、Scroll、Entry。
- 数据展示：Panel、List、Table、Datagrid、Tree、Badge、Tag、Pagination、Avatar、AvatarGroup、Divider、Status。
- 反馈与浮层：Alert、Notice、Progress、Spinner、Overlay、StageLoading、Stage、Tooltip、Popover、Dropdown、Dialog、Confirm、Drawer、Disclosure、Toast、Skeleton、Empty、Exception、Hidden。

纯图标按钮必须提供无障碍名称。`Icon`、`IconName`、图标目录、字体和图标 CSS 只属于 `@miaixz/icons`；`@miaixz/ui` 不重复导出这些能力。

## 日期与时间

`Calendar` 和 `DatePicker` 使用严格的本地公历字符串 `YYYY-MM-DD`。`TimePicker` 使用 `HH:mm`，启用 `includeSeconds` 后使用 `HH:mm:ss`。这些 API 不直接交换 JavaScript `Date`；应用应在明确业务时区后再把本地值转换成时间点。

```tsx
import { DatePicker, TimePicker } from "@miaixz/ui/date";
import "@miaixz/ui/date/styles.css";

<DatePicker aria-label="生日" name="birthday" referenceDate="2026-09-18" value="2000-01-01" />;
<TimePicker aria-label="开始时间" name="startTime" value="09:30" />;
```

## Drawer

侧边 Drawer 的 `width` 支持 `small`、`medium`、`large`、`xlarge`、`wide`、`content` 或正有限数值。底部 Drawer 不接受 `width`。宽度不会改变密度、字体、间距或编辑器结构。

Drawer 默认不会因点击背景、按 Escape、失焦或指针离开而关闭；`closeOnBackdrop` 与 `closeOnEscape` 必须显式开启。提交期间可用 `closeDisabled` 禁用内置关闭控件。自定义页脚应使用 `FormActions` 管理取消、辅助操作和提交按钮。

## Picker

现有未指定 `selectionMode` 的 Picker 保持可搜索多选行为。显式 `selectionMode="single"` 使用 `MiaixzOption | null`，`selectionMode="multiple"` 使用 `readonly MiaixzOption[]`。

`presentation` 支持 `popover`、`drawer`、`dialog` 和 `inline`；`commitMode="immediate"` 为默认值，`commitMode="confirm"` 只在确认后更新公开值和原生表单值。自定义内容负责自己的搜索、分页、异步请求和键盘语义。

## 异步内容与非视觉工具

沿用上面的语言 Provider 和样式入口。`Stage` 提供 loading/empty/error/ready 呈现，ready 仅渲染 children；文案、placeholder、数据和请求恢复由调用方提供。error 默认 `presentation="region"`，也可选 `"inline"`；显式提供 loadingLabel，onRetry 与 retryLabel 同时存在才显示重试按钮。

```tsx
import type { ReactNode } from "react";
import { Stage, StageLoading, useStageSettled } from "@miaixz/ui/stage";
import { MiaixzErrorBoundary, mergeStyleModules } from "@miaixz/ui";

function RetainedContent(props: {
  active: boolean;
  settled: boolean;
  label: string;
  children?: ReactNode;
  placeholder?: ReactNode;
}) {
  const retained = useStageSettled(props.settled);
  return (
    <StageLoading active={props.active} label={props.label} placeholder={props.placeholder}>
      {retained ? props.children : undefined}
    </StageLoading>
  );
}

<Stage
  status="error"
  title="Preview unavailable"
  description="Retry this content request."
  loadingLabel="Retrying content"
  retryLabel="Retry content"
  onRetry={retryRequest}
/>;

<MiaixzErrorBoundary
  fallback={(retryRender) => <button onClick={retryRender}>Retry rendering</button>}
>
  {children}
</MiaixzErrorBoundary>;

const styleModules = mergeStyleModules(baseStyles, overrideStyles);
```

`StageLoading` 沿用 Overlay 原有节点、交互阻断及焦点恢复；按 `children ?? placeholder` 渲染，二者均可省略。`useStageSettled(boolean)` 只记当前挂载是否曾完成，业务状态映射与作用域重建归调用方。有实际根节点的分支支持 Theme/defaults/variants、原生/data 属性及 OwnerState 槽回调。StageLoading 提供 root/content/surface；Stage 提供实际 root、error 外层 region 与 Exception 的 title/content/illustration，页面及抽屉高度仍由调用方决定。

`MiaixzErrorBoundary` 只捕获渲染失败，不新增 DOM；仅接收 children 与 `fallback(retry)`，retry 重置局部边界，外部 key 重建其作用域。请求失败通过明确的内容状态呈现。`mergeStyleModules` 只按序合并 string class map，保留重复和空字符串、冻结结果；两者仅从根入口导出，不属于 Theme 组件。

| 入口                          | 类型             |
| ----------------------------- | ---------------- |
| `@miaixz/ui/stage`            | JavaScript/types |
| `@miaixz/ui/stage/styles.css` | CSS              |

完整 `@miaixz/ui/styles.css` 已聚合新样式；scoped JS 与 CSS 指向同一实现，不复制项目适配器。

## 错误处理

组件契约错误会抛出 `MiaixzUiError`，包含稳定的 `code`、可翻译的 `messageKey` 和可选的脱敏 `details`：

```ts
import { MiaixzUiError } from "@miaixz/ui/errors";

try {
  renderFeature();
} catch (error) {
  if (error instanceof MiaixzUiError) {
    reportUiFailure({ code: error.code, messageKey: error.messageKey });
  } else {
    throw error;
  }
}
```

不要把 `details` 直接展示给用户，也不得在错误消息中包含 Token、Cookie、认证请求头、个人信息或文件内容。异步请求错误使用 `@miaixz/sdk` 的结构化错误模型。

## 微前端集成

每个独立部署的服务都应安装兼容版本的 UI 和 SDK，而不是复制样式或编译后的组件资产。宿主负责校验模块 Manifest 和 Host Bridge 协议、同步非敏感上下文/语言/权限/外观，并保证同一运行时中的 React、ReactDOM 和 SDK 实例兼容。

同一运行时使用 `createMiaixzDirectHostBridge()`；跨源 iframe 使用精确来源配置的 `createMiaixzPostMessageHost()` 与 `createMiaixzPostMessageChildBridge()`。模块不得自行创建主题样式节点或直接读取、修改宿主 DOM。

## 本地开发

```bash
npm ci --package-lock=true --ignore-scripts --legacy-peer-deps
npm run check
```

从仓库根目录运行 `npm run check:package` 校验打包产物。版本由仓库发布流程统一管理；稳定版使用 `latest` dist-tag，预发布版使用 `next`。

## 安全、声明与许可证

- 漏洞报告与受支持版本见仓库[安全策略](../../SECURITY.md)。
- 包归属声明见 [NOTICE](./NOTICE)。
- 许可证：Apache-2.0。
