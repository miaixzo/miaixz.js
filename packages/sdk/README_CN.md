# @miaixz/sdk

[English](./README.md) | [简体中文](./README_CN.md)

`@miaixz/sdk` 是 Miaixz 官方浏览器 SDK，为独立部署的前端服务提供统一的 API 协议、会话、运行时上下文、配置、权限、事件、文件、外观和国际化能力。

本包仅提供 ESM，不提供 CommonJS `require` 入口；没有第三方运行时依赖，可独立构建和发布。Host Bridge 协议版本来自仓库根目录的 `VERSION`。

## 安装

```bash
npm install @miaixz/sdk
```

## 公共入口

下表与 `package.json` 的 exports 映射保持一致：

| 入口           | 类型       |
| -------------- | ---------- |
| `.`            | JavaScript |
| `./api`        | JavaScript |
| `./session`    | JavaScript |
| `./context`    | JavaScript |
| `./config`     | JavaScript |
| `./grants`     | JavaScript |
| `./runtime`    | JavaScript |
| `./events`     | JavaScript |
| `./storage`    | JavaScript |
| `./appearance` | JavaScript |
| `./files`      | JavaScript |
| `./i18n`       | JavaScript |
| `./consts`     | JavaScript |
| `./contracts`  | JavaScript |
| `./errors`     | JavaScript |
| `./formatters` | JavaScript |
| `./types`      | JavaScript |

请只使用这些公开入口，不要导入 `src`、`dist` 或包内私有路径。

## 初始化

```ts
import { createMiaixzSdk } from "@miaixz/sdk";

const sdk = createMiaixzSdk({
  appId: "portal",
  config: {
    apiBaseUrl: "https://api.miaixz.example",
    environment: "production",
    services: { space: "https://space-api.miaixz.example" },
  },
  csrfTokenProvider: () =>
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content,
  locale: "zh-CN",
});

await sdk.ready;
sdk.context.set({ tenantId: "tenant-1", spaceId: "space-1", locale: "zh-CN" });
```

租户是数据与安全隔离边界。SDK 会通过 `X-Miaixz-Tenant-Id` 发送 `tenantId`；当前空间等运行时上下文也通过请求头传递，不要求把空间 ID 写入 URL。`context.set()` 会替换完整上下文，局部更新应使用 `context.patch()`。`organizationId` 不能替代 `tenantId`。

## 身份验证

默认使用 Cookie/BFF 模式：请求携带 `credentials: "include"`，SDK 不读取 HttpOnly Cookie、不创建 Token 会话，也不自动附加 `Authorization`。`POST`、`PUT`、`PATCH` 和 `DELETE` 请求必须从 `csrfTokenProvider` 获得非空 Token，并写入 `X-CSRF-Token`。

Bearer 模式必须显式开启。默认会话仅保存在当前 SDK 实例内，页面刷新后不会保留：

```ts
const sdk = createMiaixzSdk({ appId: "portal", authMode: "bearer", config });

sdk.session.setSession({
  accessToken: "token",
  tokenType: "DP-Token",
});
```

只有在明确接受脚本可读取 Web Storage 的风险时，才使用 `createMiaixzPersistentSessionStorage()` 启用持久化会话。优先使用默认内存模式或 HttpOnly Cookie/BFF 模式。

## API 响应

JSON API 默认使用统一响应结构：

```json
{
  "errcode": "0",
  "errmsg": "success",
  "data": {}
}
```

- `errcode === "0"`：请求成功，SDK 自动返回内部 `data`。
- `errcode !== "0"`：即使 HTTP 状态为 `200`，也会抛出 `MiaixzApiError`。
- JSON 缺少 `errcode`、`errmsg` 或 `data`：抛出代码为 `API_ENVELOPE_INVALID` 的错误。
- 文本、Blob、ArrayBuffer 和空响应不要求使用此结构。

```ts
interface Space {
  id: string;
  name: string;
}

const response = await sdk.api.get<Space>("/space/current");
console.log(response.data.name);
```

少量特殊接口可以使用 `envelope: "optional"`；使用 `envelope: "none"` 可保留原始 JSON。普通业务接口应继续使用默认的 `required` 模式。

## 服务客户端与地址限制

```ts
const spaceApi = sdk.createServiceClient("space");
const spaces = await spaceApi.get<readonly Space[]>("/spaces");
```

主服务和子服务地址必须是绝对 URL。生产及预发布环境只允许 HTTPS；开发和测试环境还允许 `localhost`、`127.0.0.1` 和 `[::1]` 的 HTTP 地址。单次请求只能使用相对路径或以 `/` 开头的同源路径；跨服务请求必须使用对应的服务客户端。

## 国际化

SDK 内置 `zh-CN`、`en-US` 和基础错误消息。业务文案应由应用自己的语言目录提供：

```ts
import { createMiaixzMessageLoader, createMiaixzSdk } from "@miaixz/sdk";

const loadMessages = createMiaixzMessageLoader({
  portal: {
    "zh-CN": () => import("./locales/zh-CN.js"),
    "en-US": () => import("./locales/en-US.js"),
  },
});

const sdk = createMiaixzSdk({
  appId: "portal",
  config,
  locale: "zh-CN",
  fallbackLocale: "en-US",
  loadMessages,
});

await sdk.ready;
console.log(sdk.i18n.t("portal.title"));
```

项目消息优先于 SDK 内置消息。缺失消息先回退到 `fallbackLocale`，仍不存在时返回消息键。业务错误可以使用 `api.error.<errcode>` 作为翻译键。

## 外观、主题和密度

SDK 是跨服务外观状态的唯一数据源，负责持久化主题 ID、明暗模式、密度及颜色覆盖；`@miaixz/ui` 的 `Theme` 负责校验并应用到 DOM。

```tsx
import { createMiaixzSdk } from "@miaixz/sdk";
import { Theme } from "@miaixz/ui/theme";

const sdk = createMiaixzSdk({ appId: "portal", config });

export function Root() {
  return (
    <Theme appearance={sdk.appearance}>
      <App />
    </Theme>
  );
}
```

明暗模式支持 `light`、`dark` 和 `system`；密度支持 `compact`、`standard` 和 `comfortable`。可视化代码应通过 `useTheme()` 修改外观，由 UI 运行时完成校验、应用和持久化事务。

## 错误处理

SDK 不会抛出裸字符串。请求错误具有稳定类型、机器可读代码和安全诊断字段：

```ts
import {
  isMiaixzApiError,
  MiaixzAbortError,
  MiaixzNetworkError,
  MiaixzTimeoutError,
} from "@miaixz/sdk/errors";

try {
  await sdk.api.get("/spaces");
} catch (error) {
  if (error instanceof MiaixzAbortError) return;
  if (error instanceof MiaixzTimeoutError || error instanceof MiaixzNetworkError) {
    showRetryMessage(error.message);
    return;
  }
  if (isMiaixzApiError(error)) {
    showApiMessage({ code: error.code, message: error.message, retryable: error.retryable });
    return;
  }
  throw error;
}
```

日志与遥测中不得记录 Token、Cookie、Authorization/CSRF 请求头、个人信息、请求正文或文件内容。前端权限与错误处理只负责交互，服务端仍必须执行鉴权和输入校验。

## 权限

```ts
sdk.setGrants({
  allowed: ["space:*", "organization:read"],
  denied: ["space:delete"],
  roles: ["member"],
});

sdk.grants.can("space:read");
sdk.grants.canAll(["space:read", "organization:read"]);
```

前端权限只控制展示和交互，不能替代服务端授权。

## 本地与跨标签页事件

事件默认只在当前实例内同步分发，不会创建 `BroadcastChannel`。启用同源跨标签页同步时，组合入口会根据 `appId` 生成唯一的版本化频道名：

```ts
const sdk = createMiaixzSdk({ appId: "portal", config, eventChannel: true });

const stop = sdk.events.on("locale:changed", ({ locale }) => {
  console.log(locale);
});

stop();
```

自定义事件必须提供运行时校验器后才能跨标签页传递。认证事件只包含 `authenticated` 或 `anonymous` 状态，不会暴露会话、Token、Cookie 或认证请求头。

## 微前端协议

独立部署的模块使用 `@miaixz/sdk/contracts` 声明并校验纯 JSON Manifest。同一运行时内使用 `createMiaixzDirectHostBridge()`；跨源 iframe 必须在 Host 和 Child 两端配置精确来源，禁止使用 `"*"`。

模块不得通过共享全局变量或直接访问宿主 DOM 获取上下文。Host Bridge 默认限制请求、订阅、载荷、目录和适配器响应；超过限制会返回 `BRIDGE_RESOURCE_LIMIT_EXCEEDED`。

## 本地开发

```bash
npm ci --package-lock=true --ignore-scripts --legacy-peer-deps
npm run check
```

从仓库根目录运行 `npm run check:package` 校验打包产物。版本由仓库发布流程统一管理；稳定版使用 `latest` dist-tag，预发布版使用 `next`。

## 安全与许可证

- 漏洞报告与受支持版本见仓库[安全策略](../../SECURITY.md)。
- 许可证：Apache-2.0。
