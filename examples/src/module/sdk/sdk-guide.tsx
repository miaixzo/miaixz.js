"use client";

import {
  MiaixzConfigStore,
  MiaixzMemoryStorage,
  createApiClient,
  createMiaixzAppearanceManager,
  createMiaixzEventBus,
  createMiaixzGrantSet,
  createMiaixzI18n,
  createMiaixzSessionManager,
  defineMiaixzConfig,
  normalizeMiaixzError,
  type MiaixzI18nLoadError,
  type MiaixzSdkConfig,
} from "@miaixz/sdk";
import { useEffect, useRef, useState } from "react";

import { CodeBlock, GuideHeader, GuideSection, Stat } from "../../shared/guide/guide-parts";
import styles from "./sdk-guide.module.css";

/**
 * Describes the raw payload returned by the deterministic local Fetch adapter.
 */
interface DemoResponse {
  readonly id: string;
  readonly path: string;
  readonly hasAuthorization: boolean;
}

const initialConfig = defineMiaixzConfig({
  apiBaseUrl: "https://sdk-guide.example.test",
  environment: "development",
  requestTimeoutMs: 2_000,
  features: { compact: false },
});

/**
 * Returns raw JSON or an ordinary HTTP problem without contacting a backend.
 *
 * @param input - Requested URL supplied by the HTTP client.
 * @param init - Request options used only to report whether authorization is present.
 * @returns Local success or HTTP failure response.
 */
const localFetch: typeof fetch = async (input, init) => {
  const path = new URL(String(input)).pathname;
  if (path === "/fail") {
    return Response.json(
      {
        code: "DEMO_UNAVAILABLE",
        message: "The local demonstration is unavailable.",
        requestId: "local-failure",
      },
      { status: 503 },
    );
  }
  return Response.json({
    id: "local-response",
    path,
    hasAuthorization: new Headers(init?.headers).has("Authorization"),
  });
};

/**
 * Creates private, independent service instances owned only by this guide.
 *
 * @param onLoadError - Observer for local language-resource failures.
 * @returns Service instances whose subscriptions and resources the component owns.
 */
function createGuideServices(onLoadError: (error: MiaixzI18nLoadError) => void) {
  const events = createMiaixzEventBus({ channelName: false });
  const config = new MiaixzConfigStore(initialConfig, events);
  const session = createMiaixzSessionManager({ eventBus: events });
  const settings = config.getSnapshot();
  const api = createApiClient({
    baseUrl: settings.apiBaseUrl,
    environment: settings.environment,
    timeoutMs: settings.requestTimeoutMs ?? 2_000,
    credentials: "omit",
    tokenProvider: () => session.getAccessToken(),
    fetch: localFetch,
  });
  const appearance = createMiaixzAppearanceManager({
    appId: "sdk-guide",
    storage: new MiaixzMemoryStorage(),
    events,
  });
  const i18n = createMiaixzI18n({
    locale: "zh-CN",
    fallbackLocale: "en-US",
    messages: {
      "zh-CN": { "demo.message": "本地语言资源已就绪" },
      "en-US": { "demo.message": "Local language resources are ready" },
    },
    onLoadError,
  });
  const grants = createMiaixzGrantSet({
    allowed: ["demo:read", "demo:*"],
    denied: ["demo:delete"],
    roles: ["demo-reader"],
  });
  return { api, config, session, events, appearance, i18n, grants };
}

/**
 * Describes private service references used by this page, without a public runtime facade.
 */
type GuideServices = ReturnType<typeof createGuideServices>;

/**
 * Demonstrates independent public mechanisms using only local data and Fetch responses.
 */
export function SdkGuide() {
  const [services, setServices] = useState<GuideServices | null>(null);
  const [configuration, setConfiguration] = useState<Readonly<MiaixzSdkConfig>>(initialConfig);
  const [initialized, setInitialized] = useState(false);
  const [logs, setLogs] = useState<string[]>(["等待独立机制初始化"]);
  const [response, setResponse] = useState("尚未发起请求");
  const activeServices = useRef<GuideServices | null>(null);

  useEffect(() => {
    let active = true;
    /**
     * Appends a non-sensitive observation while this guide instance remains mounted.
     *
     * @param message - Observation displayed by the local example.
     */
    const appendLog = (message: string) => {
      if (active) setLogs((current) => [message, ...current].slice(0, 6));
    };
    const instance = createGuideServices((error) => appendLog(`i18n load: ${error.code}`));
    activeServices.current = instance;
    const unsubscribe = [
      instance.config.subscribe((nextConfig) => {
        if (active) setConfiguration(nextConfig);
      }),
      instance.events.on("config:changed", () => appendLog("typed event: config:changed")),
      instance.events.on("session:changed", ({ status }) =>
        appendLog(`typed event: session:changed (${status})`),
      ),
      instance.events.on("appearance:changed", ({ value }) =>
        appendLog(`typed event: appearance:changed (${value.colorMode})`),
      ),
      instance.i18n.subscribe(({ locale }) =>
        appendLog(`i18n: ${locale} · ${instance.i18n.t("demo.message")}`),
      ),
    ];
    instance.session.setSession({ accessToken: "local-demo-token", tokenType: "Bearer" });
    setServices(instance);
    setConfiguration(instance.config.getSnapshot());
    setInitialized(false);
    void instance.i18n.initialize(["demo"]).then(
      () => {
        if (!active) return;
        setInitialized(true);
        appendLog('i18n.initialize(["demo"]) 已完成');
      },
      (cause: unknown) => appendLog(`initialize: ${normalizeMiaixzError(cause).code}`),
    );
    return () => {
      active = false;
      activeServices.current = null;
      for (const stop of unsubscribe) stop();
      instance.config.destroy();
      instance.session.destroy();
      instance.appearance.destroy();
      instance.events.close();
    };
  }, []);

  /**
   * Updates one neutral configuration flag without rebuilding or rewiring any service.
   */
  const updateConfig = () => {
    if (!services) return;
    const current = services.config.getSnapshot();
    services.config.set({
      ...current,
      features: { ...current.features, compact: current.features?.compact !== true },
    });
  };

  /**
   * Displays a raw local HTTP result or a normalized ordinary HTTP error.
   *
   * @param path - Local endpoint selecting a success or failure response.
   * @returns Promise resolved after the current guide updates its response display.
   */
  const runRequest = async (path: "/items" | "/fail") => {
    if (!services) return;
    try {
      const result = await services.api.get<DemoResponse>(path);
      if (activeServices.current !== services) return;
      setResponse(JSON.stringify(result.data, null, 2));
      setLogs((current) => [`GET ${path} -> ${result.status}`, ...current].slice(0, 6));
    } catch (cause) {
      if (activeServices.current !== services) return;
      const error = normalizeMiaixzError(cause);
      setResponse(JSON.stringify({ code: error.code, message: error.message }, null, 2));
      setLogs((current) => [`GET ${path} -> ${error.code}`, ...current].slice(0, 6));
    }
  };

  /**
   * Changes only this guide's locale using its independent language runtime.
   *
   * @returns Promise resolved after locale loading or local error reporting.
   */
  const switchLocale = async () => {
    if (!services) return;
    const nextLocale = services.i18n.locale === "zh-CN" ? "en-US" : "zh-CN";
    try {
      await services.i18n.changeLocale(nextLocale);
    } catch (cause) {
      if (activeServices.current !== services) return;
      setLogs((current) => [`i18n: ${normalizeMiaixzError(cause).code}`, ...current].slice(0, 6));
    }
  };

  /**
   * Cycles the independent appearance preference without changing the guide application's theme.
   */
  const switchColorMode = () => {
    if (!services) return;
    const current = services.appearance.getSnapshot().colorMode;
    const next = current === "light" ? "dark" : current === "dark" ? "system" : "light";
    services.appearance.setColorMode(next);
  };

  const canWrite = services?.grants.can("demo:write") ?? false;
  const canDelete = services?.grants.can("demo:delete") ?? false;
  const disabled = !services || !initialized;

  return (
    <div>
      <GuideHeader
        packageName="@miaixz/sdk"
        title="用独立公共机制，运行本地示例。"
        description="HTTP、Config、Session、Events、Grants、Appearance 与 I18n 各自创建；示例数据和 Fetch 响应均在本地，不发送外部请求。"
      />

      <GuideSection
        title="运行时状态"
        description="页面显式创建各机制并负责清理，语言资源通过 i18n.initialize 加载；这里没有公共聚合运行时。"
      >
        <div className={styles.stats}>
          <Stat
            label="语言初始化"
            value={initialized ? "ready" : "loading"}
            detail="i18n.initialize"
          />
          <Stat
            label="会话"
            value={services?.session.getSession() ? "authenticated" : "anonymous"}
            detail="仅内存 · 合成凭据"
          />
          <Stat
            label="角色"
            value={services ? [...services.grants.roles].join(", ") : "—"}
            detail="独立 Grants 快照"
          />
        </div>
      </GuideSection>

      <GuideSection
        title="配置与权限"
        description="配置开关通过 ConfigStore 发布类型化事件；Grants 独立求值，显式拒绝规则优先于通配允许。"
      >
        <div className={styles.runtimeGrid}>
          <div className={styles.consolePanel}>
            <div className={styles.panelHeading}>
              <span>config.getSnapshot()</span>
              <button disabled={disabled} onClick={updateConfig} type="button">
                切换示例开关
              </button>
            </div>
            <pre>{JSON.stringify(configuration, null, 2)}</pre>
          </div>
          <div className={styles.permissionPanel}>
            <div>
              <span>demo:write</span>
              <strong data-allowed={canWrite}>{canWrite ? "允许" : "拒绝"}</strong>
            </div>
            <div>
              <span>demo:delete</span>
              <strong data-allowed={canDelete}>{canDelete ? "允许" : "拒绝"}</strong>
            </div>
            <code>grants.can(permission)</code>
          </div>
        </div>
      </GuideSection>

      <GuideSection
        title="请求与错误归一化"
        description="HTTP 成功直接返回原始 JSON；失败使用 HTTP 503 和普通问题明细，配置、会话和认证 provider 均显式传入。"
      >
        <div className={styles.requestWorkbench}>
          <div className={styles.actions}>
            <button disabled={disabled} onClick={() => void runRequest("/items")} type="button">
              请求成功响应
            </button>
            <button disabled={disabled} onClick={() => void runRequest("/fail")} type="button">
              请求失败响应
            </button>
          </div>
          <pre aria-live="polite">{response}</pre>
        </div>
        <CodeBlock>{`const api = createApiClient({
  baseUrl: config.getSnapshot().apiBaseUrl,
  credentials: "omit",
  tokenProvider: () => session.getAccessToken(),
  fetch: localFetch,
});
const response = await api.get<DemoResponse>("/items");

try {
  await api.get("/fail");
} catch (cause) {
  const error = normalizeMiaixzError(cause);
}`}</CodeBlock>
      </GuideSection>

      <GuideSection
        title="外观、语言与事件"
        description="外观使用独立内存存储；I18n 通过自身订阅报告语言变化，不自动同步其他状态。页面离开时取消订阅并关闭本地事件总线。"
      >
        <div className={styles.eventGrid}>
          <div className={styles.actions}>
            <button disabled={disabled} onClick={switchColorMode} type="button">
              appearance.setColorMode
            </button>
            <button disabled={disabled} onClick={() => void switchLocale()} type="button">
              i18n.changeLocale
            </button>
          </div>
          <div className={styles.log} aria-live="polite">
            {logs.map((log, index) => (
              <code key={`${log}-${String(index)}`}>{log}</code>
            ))}
          </div>
        </div>
        <CodeBlock label="显式事件订阅">{`const events = createMiaixzEventBus({ channelName: false });
const config = new MiaixzConfigStore(initialConfig, events);
const unsubscribe = events.on("config:changed", (snapshot) => {
  console.info(snapshot.features);
});

config.set({ ...config.getSnapshot(), features: { compact: true } });
unsubscribe();
config.destroy();
events.close();`}</CodeBlock>
      </GuideSection>
    </div>
  );
}
