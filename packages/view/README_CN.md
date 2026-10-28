# @miaixz/view

[English](./README.md) | [简体中文](./README_CN.md)

`@miaixz/view` 是支持自动格式检测的自托管 React 文件预览组件。它不使用 PDF.js、ONLYOFFICE、远程转换服务、CDN 脚本或第三方运行时解析器。

## 安装

```bash
npm install @miaixz/view @miaixz/icons react react-dom
```

在应用入口加载一次图标和预览样式，然后把 `File`、`Blob`、URL、`ArrayBuffer` 或 `Uint8Array` 直接传给 `FileView`。组件带有本地样式回退，不要求安装 `@miaixz/ui` 或 `@miaixz/sdk`：

```tsx
import "@miaixz/icons/styles.css";
import "@miaixz/view/styles.css";
import { FileView } from "@miaixz/view";

export function Preview({ file }: { file: File }) {
  return <FileView source={file} />;
}
```

已经使用 `@miaixz/sdk` 和 `@miaixz/ui` 的应用，可以把预览器接入统一的语言与外观状态。这两个包属于可选集成，不是独立预览器的必需依赖：

```tsx
import "@miaixz/icons/styles.css";
import "@miaixz/ui/styles.css";
import "@miaixz/view/styles.css";
import { createMiaixzAppearanceManager } from "@miaixz/sdk/appearance";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { MiaixzLocaleProvider, Theme } from "@miaixz/ui";
import { FileView } from "@miaixz/view";

const appearance = createMiaixzAppearanceManager({ appId: "file-preview" });
const i18n = createMiaixzI18n({ locale: "zh-CN", fallbackLocale: "en-US" });

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

## 远程文件

签名 URL 可以同时提供文件名、MIME 类型和授权请求头，不需要手动选择预览器：

```tsx
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

私有存储或包含伴随资源的文件可以通过一个资源提供器统一管理主文件和关联资源请求：

```tsx
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

`FileViewHandle` 提供稳定的 `zoomIn`、`zoomOut`、`resetZoom`、`retry`、`dispose`、`getState` 和 `getElement` 命令。旧的 `src` 别名只在 0.x 迁移期保留，新代码应使用 `source`。

## 内置处理流程

- 生成的 Manifest 覆盖审计基线中的 274 个扩展名和 17 个驱动族。
- 文件名、MIME、文件签名和容器证据会共同评分，调用方不再传入 `kind`。
- 当前模块包含 PDF、DOCX、DOC、XLSX、XLS、PPTX、PPT、ODT、ODS、ODP、EPUB、XPS/OXPS、OFD、ZIP、RAR、JPEG、PNG、GIF、SVG、MP3、MP4、Draw.io、XMind、GeoJSON/TopoJSON、DXF、OBJ 和 WASM。
- 每种格式拥有自己的 `format.json`、驱动边界和生成的延迟加载入口。移除模块目录并重新生成后即可移除该格式，无需修改运行时代码。
- 不支持的子格式返回稳定的 rejected 或 partial 结果；仅输出元数据不会被标记为完整预览。

扩展名被识别不代表所有厂商特性都能完整渲染；生成的格式矩阵和 `tests/` 下的测试才是可执行的支持契约。

### Office 格式

- XLSX 解析运行在独立模块 Worker 中，支持保存的行列尺寸、合并单元格、窗格、样式、数字格式、稀疏单元格、公式缓存值、DrawingML 锚点/组/变换、图片、SmartArt 和旧 VML 绘图。没有模块 Worker 的运行时返回 `UNSUPPORTED_RUNTIME`，不会退回主线程阻塞解析。
- PPTX 按保存的演示顺序和幻灯片尺寸处理，并在固定 SVG 画布上组合母版、版式和幻灯片内容。
- DOCX 使用保存的节页面几何与 Word 锚点坐标。无法建模且会影响布局的内容会产生明确的 partial 结果。
- 旧二进制 DOC 和 PPT 只负责识别并明确拒绝；浏览器组件不会调用 LibreOffice、服务端转换器或兼容渲染路径。
- 完整结果只允许字体替换和字形抗锯齿造成平台差异。可见布局、颜色、几何、裁剪、层叠、图片、绘图或保存视图缺失时必须产生明确诊断，不能报告为 complete。

## 自定义格式

应用可以扩展默认注册表，无需修改 `@miaixz/view`。自定义格式声明标识、扩展名、MIME 类型和延迟驱动：

```tsx
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

自定义驱动使用与内置模块相同的受限资源、取消信号、进度通道和文档模型契约。

## 专用入口

需要显式组件名称的应用可以使用 `PdfView`、`OfficeView` 和 `ImageView`。`PdfView` 与 `OfficeView` 仍然复用同一个本地 `FileView` 流程，不会启用远程预览器。

```tsx
import { OfficeView, PdfView } from "@miaixz/view";

const pdfBytes = new Uint8Array();
const workbookFile = new File([], "workflow.xlsx");

<PdfView source={pdfBytes} />;
<OfficeView name="workflow.xlsx" source={workbookFile} />;
```

工作簿展示可以独立于解析结果进行配置：

```tsx
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

`initialSheet` 接受可见工作表 ID、准确名称或从零开始的可见表索引。隐藏工作表参与覆盖审计，但不会显示为标签；无效选择会回退到保存的活动表，并通过 `onDiagnostics` 发出 `XLSX_INITIAL_SHEET_NOT_FOUND`。

## 公共入口

| 入口           | 类型       |
| -------------- | ---------- |
| `.`            | JavaScript |
| `./image`      | JavaScript |
| `./pdf`        | JavaScript |
| `./office`     | JavaScript |
| `./errors`     | JavaScript |
| `./shared`     | JavaScript |
| `./runtime`    | JavaScript |
| `./styles.css` | CSS        |

本包只导出文件预览组件，不提供页面布局用途的 `View` 组件。

## 安全边界

所有解析输入均视为不可信内容：

- 远程响应体和解压输出在流式读取时计数，停滞流会被取消。
- 文档级守卫限制累计解压字节、文本、页数、绘图对象、向量记录、内存估算、嵌套深度和总任务时间。
- XML 实体与过深结构会被拒绝；ZIP 路径、目录元数据、条目大小和压缩率都会校验。
- 远程请求只使用调用方显式提供的认证信息。
- 内嵌 SVG 脚本和外部资源被阻止，宏永远不会执行。
- 对外错误不会保留源字节、凭据、本地路径或内部堆栈。

工具栏是否显示不是授权边界。应用在签发 URL 或开放下载、打印操作时仍必须执行权限检查。

## 许可证

Apache-2.0
