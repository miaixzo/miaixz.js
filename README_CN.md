# miaixz.js

[English](./README.md) | [简体中文](./README_CN.md)

> 智慧构建，创作无界。

`miaixz.js` 是 Miaixz 维护的公共 JavaScript 与 TypeScript Monorepo，包含供 Miaixz 独立部署前端服务使用的浏览器 SDK、独立图标系统、React 设计系统和文件预览组件。

仓库采用 npm workspace 组织。所有公开包使用同一个同步版本，并由同一个 Git 标签统一发布。

## 包

| 包                                  | npm                                                | 说明                                                                    |
| ----------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------- |
| [`@miaixz/sdk`](./packages/sdk)     | [npm](https://www.npmjs.com/package/@miaixz/sdk)   | 浏览器 API 客户端、运行时上下文、配置、权限、事件、文件、外观和国际化。 |
| [`@miaixz/icons`](./packages/icons) | [npm](https://www.npmjs.com/package/@miaixz/icons) | Miaixz 可变图标字体、React Icon、语义尺寸、连续动画和无障碍能力。       |
| [`@miaixz/ui`](./packages/ui)       | [npm](https://www.npmjs.com/package/@miaixz/ui)    | React 设计系统，包含组件、设计令牌、主题、密度、样式和交互基础能力。    |
| [`@miaixz/view`](./packages/view)   | [npm](https://www.npmjs.com/package/@miaixz/view)  | 独立的图片、PDF、Office 及其他本地文件预览 React 组件。                 |

### 包依赖关系

`@miaixz/sdk` 和 `@miaixz/icons` 是相互独立的基础包。`@miaixz/ui` 直接使用这两个包；`@miaixz/view` 只使用 `@miaixz/icons`，并自带 CSS 令牌回退，因此不要求安装 UI 或 SDK。

核心包之间仅允许以下内部依赖：`ui → sdk`、`ui → icons`、`view → icons`。仓库会从 Manifest、源码导入、构建声明、CSS 和打包产物中校验这张依赖图。

## 环境要求

- Workspace 根目录使用 Node.js 20.19 或更高版本；SDK 和 UI 消费端支持 Node.js 20 或更高版本，`@miaixz/view` 要求 Node.js 20.19 或更高版本。
- npm 10 或更高版本。
- 支持 ESM 的应用和构建工具。
- 使用 `@miaixz/icons`、`@miaixz/ui` 或 `@miaixz/view` 时需要 React 与 ReactDOM。

## 安装

单独安装 SDK：

```bash
npm install @miaixz/sdk
```

安装独立图标系统：

```bash
npm install @miaixz/icons react react-dom
```

安装设计系统及其 peer dependencies：

```bash
npm install @miaixz/ui @miaixz/icons @miaixz/sdk react react-dom
```

独立安装文件预览组件：

```bash
npm install @miaixz/view @miaixz/icons react react-dom
```

所有包都只提供 ESM，不提供 CommonJS `require` 入口。

## 快速开始

创建浏览器 SDK 实例：

```ts
import { createMiaixzSdk } from "@miaixz/sdk";

const sdk = createMiaixzSdk({
  appId: "portal",
  config: {
    apiBaseUrl: "https://api.miaixz.org",
    environment: "production",
  },
  locale: "zh-CN",
});

await sdk.ready;

const response = await sdk.api.get<readonly { id: string; name: string }[]>("/spaces");
console.log(response.data);
```

使用共享 React 组件和样式：

```tsx
import "@miaixz/ui/styles.css";
import { Button, Field, Input, Theme } from "@miaixz/ui";

import { sdk } from "./sdk.js";

export function CreateSpaceForm() {
  return (
    <Theme appearance={sdk.appearance}>
      <form>
        <Field label="空间名称" required>
          <Input placeholder="请输入空间名称" />
        </Field>
        <Button type="submit">创建空间</Button>
      </form>
    </Theme>
  );
}
```

在应用根入口选择一种公共 CSS 方案：

- `@miaixz/ui/styles.css`：包含默认主题、全部基础能力和组件样式的推荐完整入口。
- `@miaixz/ui/theme.css`：包含全部内置主题。
- `@miaixz/ui/foundation.css`、`@miaixz/ui/components.css`、`@miaixz/ui/core.css` 和 `@miaixz/ui/reset.css`：用于显式分层集成。

按需加载时，先加载选定的主题或基础入口，再加载每个 DOM 模块唯一的 `@miaixz/ui/<subpath>/styles.css`。例如 Button 使用 `@miaixz/ui/button/styles.css`，Graph 使用 `@miaixz/ui/diagram/graph/styles.css`。

SDK 持久化 `theme`、`colorMode`、`density` 和分模式颜色覆盖；UI 的 `Theme` 组件负责统一校验并原子应用。应用通过公共 Page Surface 变量管理页面根背景，组件库不会直接设置 `html` 或 `body` 的背景。

`@miaixz/ui/view` 导出用于页面布局的设计系统 `View`；`@miaixz/view` 是独立文件预览包，导出 `FileView`、`ImageView`、`PdfView` 和 `OfficeView`，不导出名为 `View` 的组件。预览样式带有本地主题回退，因此可以在没有 UI 或 SDK Provider 的情况下直接使用：

```tsx
import "@miaixz/icons/styles.css";
import "@miaixz/view/styles.css";
import { FileView } from "@miaixz/view";

export function PreviewExample() {
  return <FileView source="/diagram.png" />;
}
```

认证模式、API 响应结构、服务客户端、权限、跨标签页事件、外观同步、国际化、组件契约和微前端集成等详细信息见各包文档：

- [SDK 文档](./packages/sdk/README_CN.md)
- [Icons 文档](./packages/icons/README_CN.md)
- [UI 文档](./packages/ui/README_CN.md)
- [View 文档](./packages/view/README_CN.md)

## 仓库结构

```text
.
├── .github/
│   ├── actions/        可复用 GitHub Actions
│   ├── workflows/      GitHub 工作流配置
│   └── scripts/
│       ├── modules/    按 UI、View 和 Icons 模块组织的自动化
│       ├── package/    跨模块打包验证
│       ├── quality/    跨模块仓库质量检查
│       └── release/    跨模块发布自动化
├── packages/
│   ├── sdk/            @miaixz/sdk 源码及包配置
│   ├── icons/          @miaixz/icons 字体源、运行时、React API 和测试
│   ├── ui/             @miaixz/ui 源码及包配置
│   └── view/           @miaixz/view 源码及包配置
├── examples/           Next.js 指南应用
│   ├── src/module/     UI、Icons、SDK 和 View 指南模块
│   └── miaixz.org/     独立公共网站示例
├── VERSION             唯一权威共享发布版本
└── package.json        私有 npm workspace 根配置
```

Workspace 根包是私有包，永远不会发布。上面列出的每个包都是使用同步版本的独立公共 npm 包。

根 `package.json` 的 `workspaces` 数组是仓库唯一的包注册表。构建、源码策略、版本、打包验证、产物和发布工具会动态读取该数组及每个 Workspace Manifest。新增包时只需在此注册一次；只有包特定架构规则和契约测试需要单独配置。

## 开发

发现并安装所有 npm 依赖图，同时禁止执行包生命周期脚本：

```bash
npm run install:all
```

依赖元数据变化后，使用仓库固定的 npm 版本重新生成并审查每个自动发现依赖图旁的 `package-lock.json`。

运行仓库标准检查：

```bash
npm run check
```

构建全部 Workspace：

```bash
npm run build
```

只有在诊断打包问题时，才单独运行：

```bash
npm run check:package
```

其他根命令：

| 命令                    | 用途                                      |
| ----------------------- | ----------------------------------------- |
| `npm run build`         | 按内部依赖顺序构建所有 Workspace。        |
| `npm run typecheck`     | 在不构建的情况下检查所有 Workspace 类型。 |
| `npm run lint`          | 运行 Workspace Lint。                     |
| `npm run lint:fix`      | 应用支持自动修复的 Lint 规则。            |
| `npm run format`        | 格式化 Workspace 源文件。                 |
| `npm run format:check`  | 仅检查格式，不修改文件。                  |
| `npm run check`         | 运行静态、浏览器、打包和工作区清洁检查。  |
| `npm run check:package` | 诊断打包产物和消费端 Fixture 的验证失败。 |

## 版本管理

`VERSION` 是仓库唯一权威版本。版本脚本会统一更新所有相关值：

```bash
npm run version:set -- 1.2.3
```

脚本会同步：

- `VERSION`；
- 根 Workspace 版本；
- 每个 Workspace Manifest 的版本；
- 内部开发、运行时和可选依赖的精确版本；
- 内部 peer dependency 的兼容范围及其开发依赖；
- 从根版本生成的浏览器安全 SDK、UI 和 View `VERSION` 导出；
- 通过这些导出使用的协议、Schema、主题、语言和持久化版本。

项目自有运行时版本必须引用 `VERSION`，不能另建数字或语义化版本常量。静态配置 JSON 不保存独立版本，生成的运行时描述符会注入 `VERSION`。`npm run version:check` 会拒绝过期的生成常量。旧持久化版本标识只存在于兼容读取边界；依赖版本和标准文件格式标识继续使用各自真实外部值。

所有公开包必须始终使用完全相同的发布版本。

## 发布流程

发布由不带前缀的语义化版本 Git 标签触发。例如版本 `1.2.3` 使用标签 `1.2.3`，不能使用 `v1.2.3`。

标准发布顺序：

1. 在 `dev` 完成并校验修改。
2. 使用明确的合并提交将 `dev` 合并到 `main`。
3. 在该合并提交上创建准确的版本标签。
4. 推送 `main` 和标签。
5. GitHub Actions 构建并校验所有 Workspace。
6. 工作流以同一版本发布全部公开 Workspace。
7. 工作流等待所有包版本在 npm Registry 中可见。
8. npm 发布成功后，工作流创建对应 GitHub Release，并根据上一个标签之后的提交及合并 PR 生成 Release Notes。

稳定版本使用 npm `latest` dist-tag，预发布版本使用 `next`。发布操作支持恢复：如果某个包版本已经存在，只发布缺失包，最终恢复四个公开包的版本一致性。

使用 Token 认证时，发布工作流需要 GitHub Actions Secret `NPM_TOKEN`。Token 必须具有包读写权限，并允许自动发布绕过 2FA。全部包配置 Trusted Publishing 后，可以使用它替代长期 Token。

## 安全

请按照 [SECURITY.md](./SECURITY.md) 报告漏洞。不要在公开 Issue 中包含 Token、Cookie、Authorization 请求头、CSRF 值、个人信息、请求正文或私有文件内容。

## 许可证

使用 [Apache License 2.0](./LICENSE) 授权。
