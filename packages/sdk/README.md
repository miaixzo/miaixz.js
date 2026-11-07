# @miaixz/sdk

[English](./README.md) | [简体中文](./README_CN.md)

`@miaixz/sdk` is an ESM-only npm package. It does not provide a CommonJS `require` entry point, so consumers must use standard ESM `import` statements.

This is the official Miaixz browser SDK. It provides independent HTTP, session, configuration, grants, events, storage, files, appearance, internationalization, and module communication mechanisms. Applications own their business protocols, context schemas, deployment values, and runtime composition.

The SDK has no third-party runtime dependencies and can be built and published independently with npm.

The Host Bridge protocol version is read from the root `VERSION`; repository checks keep this statement aligned with the exported protocol constant.

## Installation

```bash
npm install @miaixz/sdk
```

## Public entries

This table is checked directly against the package export map.

| Entry          | Kind       |
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

## Source layout

SDK source is organized into eight stable capability areas: `fabric`, `display`, `i18n`,
`access`, `runtime`, `models`, `errors`, and `shared`. The `shared` directory is package-private;
public consumers use the documented package entries above rather than source paths.

## One-time setup

Create the mechanisms required by the consumer and wire their providers explicitly:

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

`MiaixzConfigStore` validates and publishes configuration. It does not construct clients or
synchronize other mechanisms. The consumer owns subscriptions, client replacement, and cleanup.
The HTTP client's default credentials mode is `same-origin`.

### Session and authentication providers

Session storage is independent and uses memory by default. Connect a Bearer provider explicitly:

```ts
import { createApiClient, createMiaixzSessionManager } from "@miaixz/sdk";

const session = createMiaixzSessionManager();
const authenticatedApi = createApiClient({
  baseUrl: "https://api.example.test",
  tokenProvider: () => session.getAccessToken(),
});
```

The application establishes trusted identity and passes a validated session to
`session.setSession()`. The SDK does not create a login protocol or an application context.
For Cookie/BFF requests, configure credentials and authoritative CSRF handling explicitly:

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

The SDK does not read HttpOnly cookies. With required CSRF handling, `POST`, `PUT`, `PATCH`,
and `DELETE` require a non-empty provider token. Same-named consumer or interceptor values cannot
replace the provider result in `X-CSRF-Token`. `GET`, `HEAD`, and `OPTIONS` do not invoke that
provider or attach the header.

Enable persistent session storage only when explicitly accepting the Web Storage credential risk:

```ts
import { createMiaixzPersistentSessionStorage, createMiaixzSessionManager } from "@miaixz/sdk";

const persistence = createMiaixzPersistentSessionStorage(window.sessionStorage, {
  acknowledgeWebStorageRisk: true,
});
const persistentSession = createMiaixzSessionManager({ persistence });
```

Release owned subscriptions and call `session.destroy()` when its owner is disposed.

## HTTP response contract

Successful HTTP responses preserve the parsed body. JSON is selected by the explicit response
mode or Content-Type; the SDK does not interpret application success codes or unwrap a business
response. Response interceptors receive the original parsed body, followed by the caller's optional
`parse` validator. Text, Blob, ArrayBuffer, void, and empty responses retain their transport contracts.

HTTP failures remain failures regardless of the body. The default problem extractor reads optional
string `code`, `requestId`, and `message`. A synchronous `httpErrorMapper(body, { status })` may
return only optional string `code`, `requestId`, and `serverMessage` fields. A valid object, including
`{}`, replaces the whole default detail record; `undefined`, a thrown error, or an invalid return
falls back to generic extraction. Request IDs then fall back to the response header and codes to
`HTTP_<status>`. The mapper cannot change status, retries, credentials, or forwarding policy.

Applications own their response protocols and business error translations.

## Project locale catalogs

The SDK contains only foundational error messages and the built-in `zh-CN` and `en-US` locale definitions. Applications can register additional languages with the same catalog model used by themes. Definitions are validated, immutable, searchable by alias and keyword, and may provide their own namespace loader and fallback locale.

```ts
import { defineLocale } from "@miaixz/sdk/i18n";
import { VERSION } from "@miaixz/sdk";

const japanese = defineLocale({
  schemaVersion: VERSION,
  id: "ja-JP",
  label: "日本語",
  shortLabel: "日",
  aliases: ["ja"],
  keywords: ["Japanese", "日语"],
  fallback: "en-US",
  loadMessages: async (namespace) => import(`./locales/${namespace}/ja-JP.js`),
});
```

Pass locale definitions through `locales` when creating `MiaixzI18n`. The runtime exposes immutable descriptors through `i18n.locales`, resolves aliases during `changeLocale()`, and loads both locale-owned and application-owned messages before publishing the new locale.

```ts
/*
 * src/locales/en-US.ts
 */
import type { MiaixzMessages } from "@miaixz/sdk/i18n";

export default {
  "demo.itemMissing": "Item not found",
} satisfies MiaixzMessages;
```

```ts
import { createMiaixzI18n, createMiaixzMessageLoader } from "@miaixz/sdk";

const loadMessages = createMiaixzMessageLoader({
  demo: {
    "en-US": () => import("./locales/en-US.js"),
    "fr-FR": () => import("./locales/fr-FR.js"),
  },
});

const i18n = createMiaixzI18n({
  locales: [japanese],
  locale: "en-US",
  fallbackLocale: "en-US",
  loadMessages,
  onLoadError(error) {
    /*
     * Delegate reporting to the project logger or error interface.
     */
    reportError(error);
  },
});

await i18n.initialize(["demo"]);
console.log(i18n.t("demo.itemMissing"));

/*
 * The target project catalog is loaded and cached before the locale changes.
 */
await i18n.changeLocale("fr-FR");
```

Statically imported catalogs can also be passed through `messages` during initialization. Project messages take precedence over built-in SDK messages. Missing messages fall back to `fallbackLocale`; if no fallback is available, the message key is returned.

Application message keys and business error mapping belong to their consuming application. The independent translator does not inspect HTTP responses or synchronize other stores.

## Appearance, themes, and density

The independent Appearance manager owns appearance state for its configured scope. The VERSION-bound schema persists a theme ID,
Light/Dark preference, Density, and optional mode-specific color overrides. It does not import CSS or
write DOM attributes; `@miaixz/ui` owns validation against the theme catalog and atomic rendering.

```tsx
import { createMiaixzAppearanceManager } from "@miaixz/sdk";
import { Theme, useTheme } from "@miaixz/ui/theme";

const appearance = createMiaixzAppearanceManager({ appId: "portal" });

function AppearanceControls() {
  const { theme, colorMode, density, setTheme, setColorMode, setDensity, setOverrides } =
    useTheme();

  return (
    <>
      <button onClick={() => void setTheme("neutral")}>{theme}</button>
      <button onClick={() => void setColorMode("dark")}>{colorMode}</button>
      <button onClick={() => void setDensity("compact")}>{density}</button>
      <button
        onClick={() =>
          void setOverrides({
            light: { brand: "#62B52F" },
            dark: { brand: "#7BCB52" },
          })
        }
      >
        Apply color overrides
      </button>
    </>
  );
}

export function Root() {
  return (
    <Theme appearance={appearance}>
      <AppearanceControls />
    </Theme>
  );
}
```

Supported color preferences are `light`, `dark`, and `system`. Supported Density values are
`compact`, `standard`, and `comfortable`. The SDK uses browser persistence by default and scopes the
record by `appId` and optional tenant ID. For `appId="portal"` without a tenant, the physical key is
`miaixz:global:portal:appearance`. New envelopes use `schemaVersion: VERSION`. The reader migrates
legacy numeric envelopes and their former storage keys without losing successfully parsed preferences.

Supported radius scales are `0`, `0.5`, `0.75`, `1`, `1.5`, and `2` (default `1`). Base font sizes
range from `12` to `18` pixels in one-pixel steps (default `14`). Both preferences use the same
validated persistence and restore flow.

Applications explicitly select scope with `appearance.setScope(tenantId)` or
`appearance.setScope()` for the global scope. No application context or automatic scope linkage
is provided. Optional event wiring is configured by the owner.

Applications should switch Appearance through `useTheme()` because the UI runtime validates and
applies the complete theme before persistence. Calling `appearance.patch()` is reserved for
non-visual integration code with access to the same validated catalog transaction.

## Service-specific APIs

Consumers may resolve service URLs from configuration and construct independent clients:

```ts
import { createApiClient, getMiaixzServiceEndpoint } from "@miaixz/sdk";

const snapshot = config.getSnapshot();
const serviceApi = createApiClient({
  baseUrl: getMiaixzServiceEndpoint(snapshot, "demo"),
  environment: snapshot.environment,
});
```

The consumer supplies actual service names, deployment addresses, and provider wiring.

Primary and service endpoints must be absolute URLs. Production and staging environments accept HTTPS only. Development and test environments additionally accept HTTP endpoints on `localhost`, `127.0.0.1`, and `[::1]`. Endpoints cannot contain user information, query parameters, or fragments.

Individual requests accept only relative paths or same-origin paths beginning with `/`. Absolute URLs and `//host` values are rejected. Cross-service calls must use a client configured for that service. Requests containing authentication, cookies, CSRF, or configured/provider context headers use `redirect: "error"`; request interceptors cannot weaken this security policy or forward requests to another origin.

```ts
import { createApiClient } from "@miaixz/sdk/api";

const publicApi = createApiClient({
  baseUrl: "https://public-api.miaixz.example",
  environment: "production",
});

await publicApi.get("/health", {
  authenticate: false,
  includeContext: false,
});
```

`contextHeaderNames` is validated and copied when creating a client. After request interceptors, those names and actual provider header names retain redirect protection, including with `includeContext: false`. The SDK does not define application header names. Updating a ConfigStore does not automatically rebuild existing clients; that lifecycle belongs to the consumer.

## Error handling

The SDK never throws bare strings. Request failures preserve a stable type, machine-readable code, and safe diagnostic fields. Consumers should handle recoverable branches first and then pass message keys to the internationalization runtime:

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

Never record tokens, cookies, authorization headers, CSRF values, personal information, request bodies, or file contents in logs or telemetry. Frontend errors support interaction only; the server must still perform authorization and input validation.

Request telemetry never exposes body content. Use `event.bodySummary.type` and
`event.bodySummary.bytes` for coarse operational metrics. Record any additional non-sensitive
business metric at its owning call site.

## Grants

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

The evaluator is independent; its owner replaces snapshots and publishes any change signals.
Frontend grants control presentation and interaction only. They do not replace server-side authorization.

## Local and cross-tab events

Events dispatch synchronously within an independent bus. Without `channelName`, or with `false`,
no BroadcastChannel is created:

```ts
import { createMiaixzEventBus } from "@miaixz/sdk/events";

const events = createMiaixzEventBus({ channelName: false });
const stop = events.on("grants:changed", ({ revision }) => {
  console.log(revision);
});
stop();
events.close();
```

Built-in session, grants, appearance, locale, and configuration events have mandatory runtime
validators. Session events expose only the authenticated/anonymous status. Consumers explicitly
wire managers and subscriptions; no application context event or automatic runtime composition
is provided. The independent I18n runtime reports through its own subscriptions.

Application-defined events can also be used within the current instance. A matching runtime validator is required before an event can cross tabs. When creating an event bus directly, use a channel name in the form `miaixz:<appId>:events`:

```ts
import { createMiaixzEventBus } from "@miaixz/sdk/events";

interface PortalEvents {
  "portal:ready": Readonly<{ ready: boolean }>;
}

const events = createMiaixzEventBus<PortalEvents>({
  channelName: "miaixz:portal:events",
  validators: {
    "portal:ready": (payload) =>
      typeof payload === "object" &&
      payload !== null &&
      "ready" in payload &&
      typeof payload.ready === "boolean",
  },
});
```

## Stable subpaths

```ts
import { createApiClient } from "@miaixz/sdk/api";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import type { MiaixzPage } from "@miaixz/sdk/types";
import { formatMiaixzBytes } from "@miaixz/sdk/formatters";
```

The **Public entries** table above is the authoritative list of published subpaths and is checked
directly against `package.json`; no second hand-maintained subpath list is kept here.

## Data helpers

Neutral collection, JSON snapshot, and CSV helpers are available from the root entry:

```ts
import {
  cloneMiaixzJsonValue,
  freezeMiaixzJsonValue,
  mergeMiaixzJsonValue,
  resolveCollectionValue,
  serializeMiaixzCsv,
} from "@miaixz/sdk";

const mode = resolveCollectionValue([{ value: "light" }, { value: "dark" }] as const, "dark");
const snapshot = freezeMiaixzJsonValue(cloneMiaixzJsonValue({ ready: true }));
const merged = mergeMiaixzJsonValue(snapshot, { ready: false });
const csv = serializeMiaixzCsv(
  [
    ["Name", "Count"],
    ["Demo", 1],
  ],
  "\r\n",
);
```

JSON clone/merge accept null and finite plain acyclic JSON, reject explicit undefined, and replace
arrays. Only two plain objects merge recursively; otherwise the patch replaces the base, without
validating the discarded base. `onInvalid(path, expectation)` supplies only error construction; merge returns unknown.
Freeze operates in place on an already validated snapshot, returns the same reference, and
short-circuits already frozen nodes. CSV only quotes and joins cells with the explicit LF or CRLF;
labels, BOM, MIME, filenames, and downloads remain with the consumer.

## Microfrontend module manifests

Independently deployed modules need only `@miaixz/sdk` to declare and validate pure JSON manifests:

```ts
import {
  MIAIXZ_MODULE_PROTOCOL_VERSION,
  parseMiaixzModuleManifest,
  type MiaixzIntegratedModule,
  type MiaixzModuleManifest,
} from "@miaixz/sdk/contracts";
import { VERSION } from "@miaixz/sdk";

const manifest = {
  protocolVersion: MIAIXZ_MODULE_PROTOCOL_VERSION,
  id: "demo",
  version: VERSION,
  hostVersion: `^${VERSION}`,
  kind: "integrated",
  basePath: "/demo",
  entry: "demo-module",
  routes: [
    {
      id: "demo-home",
      path: "/",
      titleKey: "demo.route.home",
      requiredPermissions: ["demo:items:read"],
    },
  ],
  navigation: [
    {
      id: "demo-navigation",
      routeId: "demo-home",
      labelKey: "demo.navigation.home",
      order: 10,
    },
  ],
  requiredPermissions: ["demo:items:read"],
  requiredCapabilities: ["context", "permissions"],
} satisfies MiaixzModuleManifest;

const verifiedManifest = parseMiaixzModuleManifest(manifest, {
  environment: "production",
  hostVersion: VERSION,
});

export const module: MiaixzIntegratedModule = {
  mount({ container }) {
    container.textContent = verifiedManifest.id;
    return {
      unmount() {
        container.replaceChildren();
      },
    };
  },
};
```

Modules in the same runtime use `createMiaixzDirectHostBridge()`. Cross-origin iframes must use exact origins on both sides and create separate host and child bridges. Never use `"*"`:

```ts
import { isRecord } from "@miaixz/sdk";
import { createMiaixzDirectHostBridge } from "@miaixz/sdk/runtime";

interface DemoContext {
  readonly mode: "compact" | "standard";
}

function parseContext(value: unknown): Readonly<DemoContext> {
  if (
    !isRecord(value) ||
    (value.mode !== "compact" && value.mode !== "standard") ||
    Object.keys(value).some((key) => key !== "mode")
  )
    throw new TypeError("Invalid demo context.");
  return Object.freeze({ mode: value.mode });
}

const bridge = createMiaixzDirectHostBridge<DemoContext>({
  moduleId: "demo",
  parseContext,
  adapter: {
    getContext: async () => ({ mode: "compact" }),
    hasPermissions: async (permissions) => grants.canAll(permissions),
  },
});

const context = await bridge.getContext();
bridge.dispose();
```

Modules must not obtain context through shared globals or direct access to the host DOM. See the [repository examples](https://github.com/miaixzo/miaixz.js/tree/main/packages/sdk/tests/examples) for complete compilable examples.

PostMessage Hosts apply request, subscription, payload, catalog, and adapter-response limits by
default. Direct and PostMessage context capabilities require a caller-supplied `parseContext`;
a missing parser makes that capability unavailable. Host and Child each validate independently,
and their parsers own the allowed-field projection and defensive copy. A Host with a measured need for a
larger catalog or event payload may pass `limits`, but values remain capped by SDK hard limits;
exceeding a limit returns `BRIDGE_RESOURCE_LIMIT_EXCEEDED`.

## Local development

```bash
npm ci --package-lock=true --ignore-scripts --legacy-peer-deps
npm run check
```

Run `npm run check:package` from the repository root to validate all packed public packages.

Publishing is coordinated by the repository release workflow. All public npm packages must share the exact version and are published together from an unprefixed semantic-version tag. Stable releases use the `latest` dist-tag, while prereleases use `next`.

## Security

See the repository [security policy](../../SECURITY.md) for vulnerability reporting instructions and supported release information.

## License

Apache-2.0
