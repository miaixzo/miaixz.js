# @miaixz/sdk

`@miaixz/sdk` is an ESM-only npm package. It does not provide a CommonJS `require` entry point, so consumers must use standard ESM `import` statements.

This is the official Miaixz browser SDK. It gives independently deployed frontend services, such as Home, Spaces, and Settings, a shared API protocol and common session, runtime context, configuration, grants, events, files, appearance, and internationalization capabilities.

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

## Source layout

SDK source is organized into eight stable capability areas: `fabric`, `display`, `i18n`,
`access`, `runtime`, `models`, `errors`, and `shared`. The `shared` directory is package-private;
public consumers use the documented package entries above rather than source paths.

## One-time setup

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
  locale: "en-US",
});

await sdk.ready;
sdk.context.set({
  tenantId: "tenant-1",
  spaceId: "space-1",
  locale: "en-US",
});
```

A tenant is the data and security isolation boundary. The SDK sends `tenantId` in the `X-Miaixz-Tenant-Id` request header. Other runtime context, including the active space, is also sent through headers and does not require path parameters such as `/spaces/:spaceId`.

`organizationId` identifies the selected organization entity inside the current tenant. It must never replace `tenantId` as the tenant isolation boundary. Departments, positions, job titles, and related structures remain part of the organization domain.

`context.set()` replaces the entire context. Use `context.patch()` for partial updates. Even when a full replacement omits `locale`, the composed SDK writes the active internationalization locale to request headers.

Authentication uses Cookie/BFF mode by default. Requests send `credentials: "include"`; the SDK does not read HttpOnly cookies, create token sessions, or attach an `Authorization` header. `POST`, `PUT`, `PATCH`, and `DELETE` requests also require a non-empty token from `csrfTokenProvider`. The SDK ignores same-named values supplied by consumers or request interceptors and writes only the provider result to `X-CSRF-Token`. `GET`, `HEAD`, and `OPTIONS` requests do not invoke the provider or attach that header.

Bearer mode must be enabled explicitly with `authMode: "bearer"`. Authentication sessions are stored only in the current SDK instance by default and do not survive a page reload:

```ts
const sdk = createMiaixzSdk({
  appId: "portal",
  authMode: "bearer",
  config,
});

sdk.session.setSession({
  accessToken: "token",
  tokenType: "DP-Token",
});
```

Enable persistent storage through the dedicated factory only when you explicitly accept the risk that injected scripts could steal credentials from Web Storage. Prefer the default in-memory mode or HttpOnly Cookie/BFF mode:

```ts
import { createMiaixzPersistentSessionStorage, createMiaixzSdk } from "@miaixz/sdk";

const sessionPersistence = createMiaixzPersistentSessionStorage(window.sessionStorage, {
  acknowledgeWebStorageRisk: true,
});

const sdk = createMiaixzSdk({
  appId: "portal",
  authMode: "bearer",
  sessionPersistence,
  config,
});
```

## API response envelope

All JSON APIs use the following response envelope by default:

```json
{
  "errcode": "0",
  "errmsg": "success",
  "data": {}
}
```

- `errcode === "0"`: the request succeeded, and the SDK returns the inner `data` value automatically.
- `errcode !== "0"`: the SDK throws `MiaixzApiError`, even when the HTTP status is `200`.
- A JSON response without `errcode`, `errmsg`, or `data`: the SDK throws an error with code `API_ENVELOPE_INVALID`.
- Text, Blob, ArrayBuffer, and empty responses do not require this envelope.

```ts
interface Space {
  id: string;
  name: string;
}

const response = await sdk.api.get<Space>("/space/current");

/*
 * The response already contains data; response.data.data is unnecessary.
 */
console.log(response.data.name);
```

Exceptional endpoints can set `envelope: "optional"` to accept JSON with or without an envelope. Set `envelope: "none"` to preserve the raw JSON value. Business APIs should keep the default `required` mode.

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

Pass locale definitions through `locales` when creating `MiaixzI18n` or `MiaixzSdk`. The runtime exposes immutable descriptors through `i18n.locales`, resolves aliases during `changeLocale()`, and loads both locale-owned and application-owned messages before publishing the new locale.

```ts
/*
 * src/locales/en-US.ts
 */
import type { MiaixzMessages } from "@miaixz/sdk/i18n";

export default {
  "space.error.notFound": "Space not found",
  "sdk.error.network": "The network is unavailable. Try again later.",
} satisfies MiaixzMessages;
```

```ts
import { createMiaixzMessageLoader, createMiaixzSdk } from "@miaixz/sdk";

const loadMessages = createMiaixzMessageLoader({
  space: {
    "en-US": () => import("./locales/en-US.js"),
    "fr-FR": () => import("./locales/fr-FR.js"),
  },
});

const sdk = createMiaixzSdk({
  appId: "portal",
  config,
  locales: [japanese],
  locale: "en-US",
  fallbackLocale: "en-US",
  loadMessages,
  onI18nLoadError(error) {
    /*
     * Delegate reporting to the project logger or error interface.
     */
    reportError(error);
  },
});

await sdk.ready;
console.log(sdk.i18n.t("space.error.notFound"));

/*
 * The target project catalog is loaded and cached before the locale changes.
 */
await sdk.i18n.changeLocale("fr-FR");
```

Statically imported catalogs can also be passed through `messages` during initialization. Project messages take precedence over built-in SDK messages. Missing messages fall back to `fallbackLocale`; if no fallback is available, the message key is returned.

Backend business errors can use `api.error.<errcode>` as a project message key, for example `api.error.SPACE_FORBIDDEN`. The SDK uses the project translation when the key exists and otherwise falls back to the `errmsg` returned by the API.

## Appearance, themes, and density

The SDK is the source of truth for Appearance state across services. The VERSION-bound schema persists a theme ID,
Light/Dark preference, Density, and optional mode-specific color overrides. It does not import CSS or
write DOM attributes; `@miaixz/ui` owns validation against the theme catalog and atomic rendering.

```tsx
import { createMiaixzSdk } from "@miaixz/sdk";
import { Theme, useTheme } from "@miaixz/ui/theme";

const sdk = createMiaixzSdk({ appId: "portal", config });

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
    <Theme appearance={sdk.appearance}>
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

The composed SDK defaults to `appearanceScope: "tenant"` for tenant-specific preferences. Set
`appearanceScope: "global"` when theme, color mode, and density are application-wide user interface
preferences that must remain stable while `context.tenantId` changes.

Applications should switch Appearance through `useTheme()` because the UI runtime validates and
applies the complete theme before persistence. Calling `sdk.appearance.patch()` is reserved for
non-visual integration code that already has access to the same validated catalog transaction.

## Service-specific APIs

```ts
const spaceApi = sdk.createServiceClient("space");
const spaces = await spaceApi.get<readonly Space[]>("/spaces");
```

Service endpoints come from centralized configuration, so frontend services do not need to hard-code deployment addresses.

Primary and service endpoints must be absolute URLs. Production and staging environments accept HTTPS only. Development and test environments additionally accept HTTP endpoints on `localhost`, `127.0.0.1`, and `[::1]`. Endpoints cannot contain user information, query parameters, or fragments.

Individual requests accept only relative paths or same-origin paths beginning with `/`. Absolute URLs and `//host` values are rejected. Cross-service calls must use the corresponding service client. Authentication, cookies, CSRF, and runtime context requests always use `redirect: "error"`; request interceptors cannot weaken this security policy or forward requests to another origin.

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

After `sdk.config.set(nextConfig)`, the primary API client and file client switch automatically to the new address and timeout configuration. Service clients created afterward also use the latest configuration.

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

Never record tokens, cookies, authorization headers, CSRF values, personal information, request bodies, or file contents in logs or telemetry. Frontend errors support interaction only; the server must still perform authorization and input validation.

Request telemetry never exposes body content. Use `event.bodySummary.type` and
`event.bodySummary.bytes` for coarse operational metrics; the deprecated `event.body` property is
never emitted. Record any additional non-sensitive business metric explicitly at its owning call
site instead of reconstructing it from a request body.

## Grants

```ts
sdk.setGrants({
  allowed: ["space:*", "organization:read"],
  denied: ["space:delete"],
  roles: ["member"],
});

sdk.grants.can("space:read");
sdk.grants.canAll(["space:read", "organization:read"]);
```

Frontend grants control presentation and interaction only. They do not replace server-side authorization.

## Local and cross-tab events

SDK events are dispatched synchronously within the current instance by default and do not create a `BroadcastChannel`. To enable same-origin cross-tab synchronization, the composed entry point derives a unique versioned channel name from `appId`:

```ts
const sdk = createMiaixzSdk({
  appId: "portal",
  config,
  eventChannel: true,
});

const stop = sdk.events.on("locale:changed", ({ locale }) => {
  console.log(locale);
});

stop();
```

Built-in authentication, context, appearance, locale, and configuration events have mandatory runtime validators. Authentication events carry only the `authenticated` or `anonymous` state and never expose sessions, tokens, cookies, or authorization headers.

Application-defined events can also be used within the current instance. A matching runtime validator is required before an event can cross tabs. When creating an event bus directly, use a channel name in the form `miaixz:v1:<appId>:events`:

```ts
import { createMiaixzEventBus } from "@miaixz/sdk/events";

interface PortalEvents {
  "portal:ready": Readonly<{ ready: boolean }>;
}

const events = createMiaixzEventBus<PortalEvents>({
  channelName: "miaixz:v1:portal:events",
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
import type { MiaixzSpace } from "@miaixz/sdk/types";
import { formatMiaixzBytes } from "@miaixz/sdk/formatters";
```

The **Public entries** table above is the authoritative list of published subpaths and is checked
directly against `package.json`; no second hand-maintained subpath list is kept here.

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
  id: "spaces",
  version: VERSION,
  hostVersion: `^${VERSION}`,
  kind: "integrated",
  basePath: "/spaces",
  entry: "@miaixz/spaces",
  routes: [
    {
      id: "spaces-home",
      path: "/",
      titleKey: "spaces.route.home",
      requiredPermissions: ["spaces:workspace:read"],
    },
  ],
  navigation: [
    {
      id: "spaces-navigation",
      routeId: "spaces-home",
      labelKey: "spaces.navigation.home",
      order: 10,
    },
  ],
  requiredPermissions: ["spaces:workspace:read"],
  requiredCapabilities: ["context", "navigation", "permissions"],
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
import { createMiaixzDirectHostBridge } from "@miaixz/sdk/runtime";

const bridge = createMiaixzDirectHostBridge({
  moduleId: "spaces",
  adapter: {
    getContext: async () => sdk.context.getSnapshot(),
    hasPermissions: async (permissions) => sdk.grants.canAll(permissions),
  },
});

const context = await bridge.getContext();
bridge.dispose();
```

Modules must not obtain context through shared globals or direct access to the host DOM. See the [repository examples](https://github.com/miaixzo/miaixz.js/tree/main/packages/sdk/tests/examples) for complete compilable examples.

PostMessage Hosts apply request, subscription, payload, catalog, and adapter-response limits by
default. Existing initialization code does not need to change. A Host with a measured need for a
larger catalog or event payload may pass `limits`, but values remain capped by SDK hard limits;
exceeding a limit returns `BRIDGE_RESOURCE_LIMIT_EXCEEDED`.

## Local development

```bash
npm ci --package-lock=true --ignore-scripts --legacy-peer-deps
npm run check
```

Run `npm run check:package` from the repository root to validate both packed packages.

Publishing is coordinated by the repository release workflow. Both npm packages must share the exact version and are published together from an unprefixed semantic-version tag. Stable releases use the `latest` dist-tag, while prereleases use `next`.

## Security

See the repository [security policy](../SECURITY.md) for vulnerability reporting instructions and supported release information.

## License

Apache-2.0
