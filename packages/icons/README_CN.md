# @miaixz/icons

[English](./README.md) | [简体中文](./README_CN.md)

Miaixz 的独立 Web 图标系统，包含原创可变字体图标、React `Icon`、语义尺寸、连续 FILL/opsz 动画和无障碍行为。发布版本统一由仓库根目录的 `VERSION` 文件定义。

## 安装

```bash
npm install @miaixz/icons react react-dom
```

在应用入口显式加载一次样式：

```tsx
import "@miaixz/icons/styles.css";
import { Icon } from "@miaixz/icons";

export function Example() {
  return <Icon label="搜索" name="search" size="navigation" />;
}
```

未提供 `label` 的图标默认为装饰性内容并设置 `aria-hidden`；表达独立含义时必须提供非空 `label`。

## 字体加载

`miaixz-icons.woff2` 是唯一字体文件，覆盖当前源中的全部 canonical 名称；CSS 字符范围从实际码点集合派生，不按分类拆分字体或增加请求。

首屏使用图标时可以预载完整字体：

```html
<link rel="preload" href="/assets/miaixz-icons.woff2" as="font" type="font/woff2" crossorigin />
```

打包器可以通过 `@miaixz/icons/font.woff2` 取得唯一稳定资源入口。跨源部署必须返回 `Access-Control-Allow-Origin`，字体建议返回 `Cache-Control: public, max-age=31536000, immutable`。

运行时预热加载完整字体，所有并发请求共享同一个 Promise：

```ts
import { preloadIconFont } from "@miaixz/icons";

await preloadIconFont();
```

## API

```tsx
import { Icon, type IconName } from "@miaixz/icons";

const name: IconName = "rocket";

<Icon fill={0.5} motion="auto" name={name} size={24} />;
```

- `variant="outline" | "filled"` 分别映射 FILL 0 与 1。
- `fill` 接受 0–1 连续值，并以 180ms 过渡。
- `size` 接受 `indicator`、`inline`、`control`、`navigation`、`feature`、`display` 或正数；数值同时驱动 12–40 的 opsz。
- `motion="none"` 与系统 `prefers-reduced-motion: reduce` 都会关闭过渡。
- 源目录标记 `rtl="mirror"` 的名称仅在实际 RTL 上下文翻转内层字形；LTR 与非镜像名称不翻转，根节点布局不变。
- `name` 只能使用当前映射中的 canonical 名称；`parseIconName` 会对未知名称抛出 `TypeError`。

根入口只提供 `Icon`、`isIconName`、`parseIconName`、`preloadIconFont`，以及 `IconProps`、`IconMotion`、`IconName`、`IconSize` 类型。普通消费直接使用受 `IconName` 约束的字符串。

完整目录通过独立入口加载，不进入轻量根入口：

```ts
import { ICON_CATALOG, type IconCatalogEntry, type IconCategory } from "@miaixz/icons/catalog";
```

目录每项只含 `name` 和 `category`，数组及条目均冻结。不要导入 `src`、`dist` 私有路径或直接书写 PUA 字符。

## 第三方图标

`@miaixz/icons` 不封装、不转发第三方图标库。需要第三方图标时，应用应直接安装并按其官方 API 使用；第三方许可证、升级节奏和包体积由应用独立管理，不会影响本包的发布与字体资产。

```bash
npm install lucide-react
```

## 故障策略与浏览器范围

字体加载失败时显示固定尺寸的安全占位，不会泄漏 PUA/tofu。完整字体使用一个全局加载 Promise，同一页面最多触发一次字体请求。

支持 React 18.3–19，以及当前锁定 Playwright 版本对应的 Chromium、Firefox 和 WebKit。SSR 不访问 Font Loading API；Hydration 保持同一个 `span` 根节点和固定尺寸占位。

## Public entries

| Entry          | Kind       |
| -------------- | ---------- |
| `.`            | JavaScript |
| `./catalog`    | JavaScript |
| `./styles.css` | CSS        |
| `./font.woff2` | Asset      |

## 源维护

业务源唯一来自 `src/assets/icons.json`、`icons/*.json`、`design.json` 和统一 Schema；字体源唯一来自 Designspace 声明的六套 UFO。`src/values/` 下的 icons/metadata/design 模块由生成器维护，不作为输入，也不保留旧 autogen 目录或转发层。

首次 npm 发布前，名称集合变更后按 ASCII 名称顺序从 U+F0000 全量重算码点，并同步六母版 Unicode/order，不承诺旧未发布映射兼容。首次发布后已有名称和码点不重排，新增名称只占用下一个合法码点；达到 U+FFFFD 后拒绝新增。

现有图标精修不重算名称和码点，不导入外部图形，不增加逐图 CSS 补偿；功能全部完成后才进行最终统一验收。

精修直接处理六母版源并逐图核实，不保留精修状态、审计和验收记录；扫描不能替代语义、风格及创作来源核实。

全部GLIF、plist和Designspace源文件在XML声明之后放置唯一完整的Miaixz/Apache 2.0版权注释，使用用户指定的波浪线格式；模板由字体读取工具统一维护。WOFF2不插入文本注释，实际name表保留版权、完整许可正文和许可URL（name ID 0/13/14）。源与成品检查均拒绝缺失或冲突声明；声明不代替图形的真实创作依据。

Outline 的 compact/standard/display 主笔画分别为 82±6、70±4、62±4 字体单位；standard 普通框圆角为 40，其他光学母版按线宽比例处理。尺寸依据安全边界、最长边与光学校核，不强制每个图标同宽同高。filled 保留正确负空间和语义特征，不套用空心笔画门槛。

实际显示对照同时设置 CSS 字号和 opsz 为 12/16/20/24/32/40，FILL 取 0/0.25/0.5/0.75/1。独立源 SVG 对照当前唯一 WOFF2，覆盖 Chromium、Firefox、WebKit 与 DPR 1/2；全部名称 LTR 加镜像名称 RTL，共 336780 对，不跨浏览器比较截图。固定黑色前景/白色采样背景，在内存中验证不透明灰度后精确还原 alpha 覆盖率；不保存截图、不降低既定阈值。

`refinement:scan` 只读扫描并输出终端结果。`icons:visual:check` 执行当前源/字体几何及完整内存显示对照；不读取基线、不保存报告、截图或差异图。单元覆盖率只输出文本，浏览器检查关闭持久化记录。任何失败必须保留真实退出码。

版本只从根目录 `VERSION` 读取；源 JSON 不保存独立版本字段。发布包必需元数据与字体内嵌版本由 VERSION 派生，并校验一致性。包内通过后才进行本地测试安装，真实业务检查通过后才完成交付。
