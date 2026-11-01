"use client";

import {
  MiaixzMemoryStorage,
  createMiaixzSdk,
  normalizeMiaixzError,
  type MiaixzRuntimeContext,
} from "@miaixz/sdk";
import { useEffect, useState } from "react";

import { CodeBlock, GuideHeader, GuideSection, Stat } from "../../shared/guide/guide-parts";
import styles from "./sdk-guide.module.css";

/**
 * Payload returned by the SDK guide's deterministic local Fetch adapter.
 */
interface DemoResponse {
  readonly id: string;
  readonly path: string;
  readonly tenant: string;
}

const initialContext: MiaixzRuntimeContext = {
  userId: "user-guide",
  tenantId: "tenant-north",
  spaceId: "space-product",
  locale: "zh-CN",
  timezone: "Asia/Shanghai",
};

/**
 * Returns deterministic local success or failure envelopes without contacting a backend.
 *
 * @param input - Requested URL or Request input.
 * @param init - Request options whose context headers are displayed by the guide.
 * @returns Promise resolving to a local JSON Response.
 */
const mockFetch: typeof fetch = async (input, init) => {
  const path = new URL(String(input)).pathname;
  if (path === "/fail") {
    return Response.json(
      { code: "DEMO_FAILURE", desc: "The local mock rejected this request.", data: null },
      { status: 503 },
    );
  }
  return Response.json({
    code: "0",
    desc: "ok",
    data: {
      id: "local-response",
      path,
      tenant: new Headers(init?.headers).get("X-Miaixz-Tenant-Id") ?? "not-set",
    },
  });
};

/**
 * Creates an isolated guide SDK using memory storage and the local Fetch adapter.
 *
 * @returns Cookie-mode SDK instance configured for the guide.
 */
function createGuideSdk() {
  return createMiaixzSdk({
    appId: "sdk-example",
    config: {
      apiBaseUrl: "https://api.example.test",
      environment: "development",
      requestTimeoutMs: 2_000,
    },
    initialContext,
    locale: "zh-CN",
    fallbackLocale: "en-US",
    eventChannel: false,
    fetch: mockFetch,
    storage: new MiaixzMemoryStorage(),
    grants: {
      allowed: ["project:read", "project:write", "release:*"],
      denied: ["release:delete"],
      roles: ["maintainer"],
    },
  });
}

/**
 * SDK instance type inferred from the guide's cookie-mode factory.
 */
type GuideSdk = ReturnType<typeof createGuideSdk>;

/**
 * Runs an isolated SDK instance against a deterministic local Fetch adapter.
 */
export function SdkGuide() {
  const [sdk, setSdk] = useState<GuideSdk | null>(null);
  const [context, setContext] = useState<Readonly<MiaixzRuntimeContext>>(initialContext);
  const [logs, setLogs] = useState<string[]>(["等待 SDK 初始化"]);
  const [response, setResponse] = useState("尚未发起请求");

  useEffect(() => {
    const instance = createGuideSdk();
    const unsubscribe = instance.events.on("context:changed", (nextContext) => {
      setLogs((current) => [`typed event stream: context:changed`, ...current].slice(0, 6));
      setContext(nextContext);
    });
    setSdk(instance);
    setContext(instance.context.getSnapshot());
    void instance.ready.then(() => {
      setLogs((current) =>
        current.includes("sdk.ready 已完成")
          ? current
          : ["sdk.ready 已完成", ...current].slice(0, 6),
      );
    });
    return () => {
      unsubscribe();
      instance.destroy();
    };
  }, []);

  /**
   * Switches the example workspace and starts a new trace identifier.
   *
   * @returns No return value; does nothing before the SDK is ready.
   */
  const patchContext = () => {
    if (!sdk) return;
    sdk.context.patch({
      spaceId: context.spaceId === "space-product" ? "space-platform" : "space-product",
      traceId: `guide-${Date.now().toString(36)}`,
    });
  };

  /**
   * Executes a local demo request and records its normalized result or error.
   *
   * @param path - Demo endpoint selecting a success or failure response.
   * @returns Promise resolving after the displayed response and request log are updated.
   */
  const runRequest = async (path: "/projects" | "/fail") => {
    if (!sdk) return;
    try {
      const result = await sdk.api.get<DemoResponse>(path);
      setResponse(JSON.stringify(result.data, null, 2));
      setLogs((current) => [`GET ${path} -> ${result.status}`, ...current].slice(0, 6));
    } catch (cause) {
      const error = normalizeMiaixzError(cause);
      setResponse(JSON.stringify({ code: error.code, message: error.message }, null, 2));
      setLogs((current) => [`GET ${path} -> ${error.code}`, ...current].slice(0, 6));
    }
  };

  /**
   * Switches the guide between Chinese and English and synchronizes context locale.
   *
   * @returns Promise resolving after locale loading and context updates.
   */
  const switchLocale = async () => {
    if (!sdk) return;
    const nextLocale = sdk.i18n.getSnapshot().locale === "zh-CN" ? "en-US" : "zh-CN";
    await sdk.i18n.changeLocale(nextLocale);
    sdk.context.patch({ locale: nextLocale });
  };

  /**
   * Cycles light, dark, and system appearance modes and records the change.
   *
   * @returns No return value; does nothing before the SDK is ready.
   */
  const switchColorMode = () => {
    if (!sdk) return;
    const current = sdk.appearance.getSnapshot().colorMode;
    const next = current === "light" ? "dark" : current === "dark" ? "system" : "light";
    sdk.appearance.setColorMode(next);
    setLogs((items) => [`appearance: ${current} -> ${next}`, ...items].slice(0, 6));
  };

  const canWrite = sdk?.grants.can("project:write") ?? false;
  const canDelete = sdk?.grants.can("release:delete") ?? false;

  return (
    <div>
      <GuideHeader
        packageName="@miaixz/sdk"
        title="用真实 API 表面，跑一套本地沙盒。"
        description="示例 SDK 使用内存存储和确定性 Fetch 适配器，不发送外部请求，却完整经过上下文、权限、错误与事件链路。"
      />

      <GuideSection
        title="运行时状态"
        description="所有状态来自同一个 createMiaixzSdk 实例。切换路由时实例会被释放。"
      >
        <div className={styles.stats}>
          <Stat label="初始化" value={sdk ? "ready" : "loading"} detail="sdk.ready" />
          <Stat label="认证模式" value={sdk?.authMode ?? "cookie"} detail="Cookie/BFF" />
          <Stat label="角色" value="maintainer" detail="前端权限快照" />
        </div>
      </GuideSection>

      <GuideSection
        title="上下文与权限"
        description="修改空间会触发类型化事件，显式拒绝规则始终优先于通配允许。"
      >
        <div className={styles.runtimeGrid}>
          <div className={styles.consolePanel}>
            <div className={styles.panelHeading}>
              <span>sdk.context.getSnapshot()</span>
              <button disabled={!sdk} onClick={patchContext} type="button">
                切换空间
              </button>
            </div>
            <pre>{JSON.stringify(context, null, 2)}</pre>
          </div>
          <div className={styles.permissionPanel}>
            <div>
              <span>project:write</span>
              <strong data-allowed={canWrite}>{canWrite ? "允许" : "拒绝"}</strong>
            </div>
            <div>
              <span>release:delete</span>
              <strong data-allowed={canDelete}>{canDelete ? "允许" : "拒绝"}</strong>
            </div>
            <code>sdk.grants.can(permission)</code>
          </div>
        </div>
      </GuideSection>

      <GuideSection
        title="请求与错误归一化"
        description="成功与失败都通过 sdk.api.get，并展示 normalizeMiaixzError 后的稳定结构。"
      >
        <div className={styles.requestWorkbench}>
          <div className={styles.actions}>
            <button disabled={!sdk} onClick={() => void runRequest("/projects")} type="button">
              请求成功响应
            </button>
            <button disabled={!sdk} onClick={() => void runRequest("/fail")} type="button">
              请求失败响应
            </button>
          </div>
          <pre aria-live="polite">{response}</pre>
        </div>
        <CodeBlock>{`const response = await sdk.api.get<Project[]>("/projects");

try {
  await sdk.api.get("/fail");
} catch (cause) {
  const error = normalizeMiaixzError(cause);
}`}</CodeBlock>
      </GuideSection>

      <GuideSection
        title="外观、语言与事件"
        description="SDK 外观实例与指南应用外观相互隔离，便于看清服务边界。"
      >
        <div className={styles.eventGrid}>
          <div className={styles.actions}>
            <button disabled={!sdk} onClick={switchColorMode} type="button">
              sdk.appearance.setColorMode
            </button>
            <button disabled={!sdk} onClick={() => void switchLocale()} type="button">
              sdk.i18n.changeLocale
            </button>
          </div>
          <div className={styles.log} aria-live="polite">
            {logs.map((log, index) => (
              <code key={`${log}-${String(index)}`}>{log}</code>
            ))}
          </div>
        </div>
        <CodeBlock label="上下文更新">{`sdk.context.patch({ spaceId: "space-platform" });

const unsubscribe = sdk.events.on("context:changed", (context) => {
  console.info(context.spaceId);
});`}</CodeBlock>
      </GuideSection>
    </div>
  );
}
