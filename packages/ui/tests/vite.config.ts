/**
 * Verifies vite behavior in the UI package.
 */

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { themePresetPlugin } from "../../../.github/scripts/modules/ui/codegen/vite-theme-plugin.mjs";

const port = Number(process.env.MIAIXZ_UI_PORT ?? "4173");
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Invalid MIAIXZ_UI_PORT");
const baseURL = process.env.MIAIXZ_UI_BASE_URL ?? `http://127.0.0.1:${port}`;
const parsedBaseURL = new URL(baseURL);
if (
  parsedBaseURL.protocol !== "http:" ||
  !new Set(["127.0.0.1", "localhost", "[::1]"]).has(parsedBaseURL.hostname) ||
  Number(parsedBaseURL.port || 80) !== port
) {
  throw new Error("MIAIXZ_UI_BASE_URL must be local HTTP and match MIAIXZ_UI_PORT");
}
const packageStage = process.env.MIAIXZ_UI_PACKAGE_STAGE ?? "source";
if (!new Set(["source", "packed"]).has(packageStage)) {
  throw new Error("Invalid MIAIXZ_UI_PACKAGE_STAGE");
}
const packedRoot = process.env.MIAIXZ_UI_PACKAGE_ROOT;
const packedSdkRoot = process.env.MIAIXZ_UI_SDK_PACKAGE_ROOT;
if (packageStage === "packed" && (!packedRoot || !packedSdkRoot)) {
  throw new Error("Packed mode requires MIAIXZ_UI_PACKAGE_ROOT and MIAIXZ_UI_SDK_PACKAGE_ROOT");
}
if (packageStage === "source" && (packedRoot || packedSdkRoot)) {
  throw new Error("Source mode must not receive packed package roots");
}
const resolvedPackedRoot = packedRoot ? resolve(packedRoot) : undefined;
const resolvedPackedSdkRoot = packedSdkRoot ? resolve(packedSdkRoot) : undefined;
const websocketOrigin = `ws://${parsedBaseURL.hostname}:${port}`;
const serverHost = parsedBaseURL.hostname === "[::1]" ? "::1" : parsedBaseURL.hostname;

const fixtureHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Miaixz UI browser fixture</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/tests/browser-fixture.tsx"></script>
  </body>
</html>`;

/**
 * Serves the package browser contract fixture without creating a product entry.
 */
export default defineConfig({
  optimizeDeps: {
    include: ["react-dom/client"],
  },
  plugins: [
    themePresetPlugin(),
    {
      name: "miaixz-packed-fixture",
      enforce: "pre",
      /**
       * Redirects fixture imports to packed component artifacts.
       *
       * @param id - Requested module identifier.
       * @returns The packed module path when the identifier is supported.
       */
      resolveId(id) {
        if (!resolvedPackedRoot || !resolvedPackedSdkRoot) return;
        if (id === "../src/index.js") return resolve(resolvedPackedRoot, "dist/index.js");
        if (id === "../src/version.js") return resolve(resolvedPackedRoot, "dist/version.js");
        if (id === "../src/theme/theme.css")
          return resolve(resolvedPackedRoot, "dist/theme/theme.css");
        if (id === "@miaixz/sdk/appearance")
          return resolve(resolvedPackedSdkRoot, "dist/display/index.js");
        if (id === "@miaixz/sdk/i18n") return resolve(resolvedPackedSdkRoot, "dist/i18n/index.js");
      },
    },
    react(),
    {
      name: "miaixz-ui-browser-fixture",
      /**
       * Registers the browser fixture HTML middleware.
       *
       * @param server - Active Vite development server.
       */
      configureServer(server) {
        server.middlewares.use(async (request, response, next) => {
          const requestUrl = request.url ?? "/";
          const pathname = new URL(requestUrl, baseURL).pathname;
          if (pathname !== "/tests/" && pathname !== "/tests/index.html") {
            next();
            return;
          }

          try {
            const html = await server.transformIndexHtml(requestUrl, fixtureHtml);
            response.statusCode = 200;
            response.setHeader("Content-Type", "text/html; charset=utf-8");
            response.setHeader(
              "Content-Security-Policy",
              [
                "default-src 'none'",
                "script-src 'self' 'unsafe-inline'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data:",
                "font-src 'self' data:",
                `connect-src 'self' ${websocketOrigin}`,
                "base-uri 'none'",
                "form-action 'none'",
              ].join("; "),
            );
            response.end(html);
          } catch (error) {
            next(error);
          }
        });
      },
    },
  ],
  server: {
    host: serverHost,
    port,
    ...(resolvedPackedRoot && resolvedPackedSdkRoot
      ? {
          fs: {
            allow: [
              process.cwd(),
              resolvedPackedRoot,
              resolvedPackedSdkRoot,
              createRequire(import.meta.url).resolve("@miaixz/icons/font.woff2"),
            ],
          },
        }
      : {}),
    strictPort: true,
  },
});
