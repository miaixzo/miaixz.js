# @miaixz/sdk

[English](./README.md) | [简体中文](./README_CN.md)

`@miaixz/sdk` 是 Miaixz 官方浏览器 SDK，提供独立的 HTTP、会话、配置、权限、事件、存储、文件、外观、国际化与模块通信机制。应用拥有业务协议、上下文结构、实际部署配置和运行时装配。

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

按需要独立创建机制，明确传入配置与 provider：

```ts
import { createApiClient, MiaixzConfigStore } from "@miaixz/sdk";

const config = new MiaixzConfigStore({
  apiBaseUrl: "https://api.example.test",
  environment: "production",
  services: { demo: "https://demo-api.example.test" },
});
const settings = config.getSnapshot();
const api = createApiClient({
  baseUrl: settings.apiBaseUrl,
  environment: settings.environment,
});
const response = await api.get<readonly { id: string; name: string }[]>("/items");
console.log(response.data);
```

ConfigStore 校验并发布配置，不自动创建或重建客户端，也不联动其他机制。订阅、替换客户端和清理均由调用方负责。HTTP 默认凭据模式为 `same-origin`。

## 身份验证

Session 独立管理会话，默认仅使用内存。Bearer 认证通过 provider 显式接入：

```ts
import { createApiClient, createMiaixzSessionManager } from "@miaixz/sdk";

const session = createMiaixzSessionManager();
const authenticatedApi = createApiClient({
  baseUrl: "https://api.example.test",
  tokenProvider: () => session.getAccessToken(),
});
```

应用负责建立可信身份，再向 `session.setSession()` 提供合法会话；SDK 不定义登录协议或项目上下文。Cookie/BFF 应明确配置凭据和权威 CSRF provider：

```ts
const cookieApi = createApiClient({
  baseUrl: "https://api.example.test",
  credentials: "include",
  csrf: {
    required: true,
    tokenProvider: () =>
      document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content,
  },
});
```

SDK 不读取 HttpOnly Cookie。启用必需 CSRF 后，`POST`、`PUT`、`PATCH` 和 `DELETE` 必须取得非空 provider Token；调用方或拦截器的同名头不能替代写入 `X-CSRF-Token` 的 provider 结果。`GET`、`HEAD` 和 `OPTIONS` 不调用该 provider、不附加该头。

只有明确接受 Web Storage 可被脚本读取的风险时，才启用持久化：

```ts
import { createMiaixzPersistentSessionStorage, createMiaixzSessionManager } from "@miaixz/sdk";

const persistence = createMiaixzPersistentSessionStorage(window.sessionStorage, {
  acknowledgeWebStorageRisk: true,
});
const persistentSession = createMiaixzSessionManager({ persistence });
```

使用结束时取消订阅并调用 `session.destroy()`。

## HTTP 响应

HTTP 成功返回解析后的原始正文，不解释应用成功码、不自动解业务响应。JSON 由显式响应模式或 Content-Type 确定；先经过响应拦截器，再调用可选的领域 `parse`。文本、Blob、ArrayBuffer、void 与空响应保留传输合同。

HTTP 非成功始终为失败，正文不能改变状态和重试策略。默认从普通问题明细提取可选 string `code/requestId/message`。同步 `httpErrorMapper(body, { status })` 仅可返回可选 string `code/requestId/serverMessage`；合法对象（包括 `{}`）整体替换默认明细，`undefined`、抛出或非法返回才回落。requestId 后备使用响应头，code 后备使用 `HTTP_<status>`。mapper 不能改变凭据、转发、status 或 retryable。

业务响应协议和业务错误翻译归调用方。

## 服务客户端与地址限制

```ts
import { createApiClient, getMiaixzServiceEndpoint } from "@miaixz/sdk";

const snapshot = config.getSnapshot();
const serviceApi = createApiClient({
  baseUrl: getMiaixzServiceEndpoint(snapshot, "demo"),
  environment: snapshot.environment,
});
```

实际服务名、地址和 provider 由调用方提供。

主服务和子服务地址必须是绝对 URL。生产及预发布环境只允许 HTTPS；开发和测试环境还允许 `localhost`、`127.0.0.1` 和 `[::1]` 的 HTTP 地址。单次请求只能使用相对路径或以 `/` 开头的同源路径；跨服务请求必须使用对应的服务客户端。

`contextHeaderNames` 创建客户端时校验并保存副本；拦截器执行后，与 provider 实际头名一起保持 `redirect: "error"` 保护，`includeContext: false` 不会解除手工同名头的保护。认证、Cookie、CSRF 请求也保持原重定向保护；SDK 不定义项目头名。配置变更后的客户端生命周期由调用方负责。

## 国际化

SDK 内置 `zh-CN`、`en-US` 和基础错误消息。业务文案应由应用自己的语言目录提供：

```ts
import { createMiaixzI18n, createMiaixzMessageLoader } from "@miaixz/sdk";

const loadMessages = createMiaixzMessageLoader({
  demo: {
    "zh-CN": () => import("./locales/zh-CN.js"),
    "en-US": () => import("./locales/en-US.js"),
  },
});

const i18n = createMiaixzI18n({
  locale: "zh-CN",
  fallbackLocale: "en-US",
  loadMessages,
});

await i18n.initialize(["demo"]);
console.log(i18n.t("demo.title"));
```

项目消息优先于 SDK 内置消息。每个语言文件只包含所属 namespace 的键；缺失消息先回退到 `fallbackLocale`，仍不存在时返回消息键。可通过 `locales` 注册语言目录扩展，通过 `onLoadError` 处理加载失败；`changeLocale()` 与自身订阅不自动同步 Config、Context 或事件总线。业务错误翻译由应用显式接线。

## 外观、主题和密度

独立 Appearance manager 管理所选作用域的外观，持久化主题 ID、明暗模式、密度及颜色覆盖；`@miaixz/ui` 的 `Theme` 负责校验并应用到 DOM。

```tsx
import { createMiaixzAppearanceManager } from "@miaixz/sdk";
import { Theme } from "@miaixz/ui/theme";

const appearance = createMiaixzAppearanceManager({ appId: "portal" });

export function Root() {
  return (
    <Theme appearance={appearance}>
      <App />
    </Theme>
  );
}
```

明暗模式支持 `light`、`dark` 和 `system`；密度支持 `compact`、`standard` 和 `comfortable`。可视化代码应通过 `useTheme()` 修改外观，由 UI 运行时完成校验、应用和持久化事务。

作用域由调用方通过 `appearance.setScope(tenantId)` 或全局 `appearance.setScope()` 显式选择，不提供项目 Context 自动联动；可选事件接线由所有者配置。存储和旧格式迁移仍沿用既有实现。

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
  await api.get("/items");
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
import { createMiaixzGrantSet } from "@miaixz/sdk";

const grants = createMiaixzGrantSet({
  allowed: ["demo:items:*"],
  denied: ["demo:items:delete"],
  roles: ["reader"],
});

grants.can("demo:items:read");
grants.canAll(["demo:items:read", "demo:items:write"]);
```

独立 evaluator 没有更新 setter；替换快照与发布变更信号由调用方负责。前端权限只控制展示和交互，不能替代服务端授权。

## 本地与跨标签页事件

事件在独立总线内同步分发，未配置 `channelName` 或设为 `false` 不会创建 BroadcastChannel：

```ts
import { createMiaixzEventBus } from "@miaixz/sdk/events";

const events = createMiaixzEventBus({ channelName: false });
const stop = events.on("grants:changed", ({ revision }) => {
  console.log(revision);
});
stop();
events.close();
```

跨标签页频道格式为 `miaixz:<appId>:events`，例如 `miaixz:demo:events`；自定义事件必须提供运行时校验器。内建 Session、Grants、Appearance、Locale、Config 事件保留校验，Session 事件仅包含 authenticated/anonymous 状态，不暴露会话或凭据。没有固定项目 Context 事件或自动聚合装配，manager 与订阅由调用方接线。

## 数据工具

根入口公开 `resolveCollectionValue`、`cloneMiaixzJsonValue`、`freezeMiaixzJsonValue`、`mergeMiaixzJsonValue` 和 `serializeMiaixzCsv`。集合解析保持 literal 类型，未知值拒绝；业务枚举与标签由调用方提供。

JSON clone/merge 接受 null，拒绝显式 undefined、非有限数、循环和非 plain JSON。仅双方均 plain 对象时递归合并，否则以 patch 替换且不校验已丢弃 base；数组整体替换。`onInvalid(path, expectation)` 仅注入错误构造，merge 返回 unknown。freeze 用于已校验快照，原地冻结、返回同一引用、对已冻结节点短路，不作为校验器。

CSV 显式接收 `"\n"` 或 `"\r\n"`，只负责 String 转换、引号转义和拼接；不附加 BOM、列标签、文件名、MIME 或下载策略。

## 微前端协议

独立部署的模块使用 `@miaixz/sdk/contracts` 声明并校验纯 JSON Manifest。同一运行时内使用 `createMiaixzDirectHostBridge()`；跨源 iframe 必须在 Host 和 Child 两端配置精确来源，禁止使用 `"*"`。

Bridge 的 Context 类型由调用方提供，默认 unknown。Direct 的 Context 能力需要显式 `parseContext`；PostMessage Host 与 Child 各自独立配置 parser，缺少时不提供该能力。parser 负责允许字段的投影、校验和防御性复制，不依赖对端替代本端校验。

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
