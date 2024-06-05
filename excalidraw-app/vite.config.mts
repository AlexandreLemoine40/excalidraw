import { PluginOption, defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgrPlugin from "vite-plugin-svgr";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import { VitePWA } from "vite-plugin-pwa";
import checker from "vite-plugin-checker";
import { createHtmlPlugin } from "vite-plugin-html";

// To load .env.local variables
const envVars = loadEnv("", `../`);
// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: Number(envVars.VITE_APP_PORT || 3000),
    // open the browser
    open: true,
  },
  // We need to specify the envDir since now there are no
  //more located in parallel with the vite.config.ts file but in parent dir
  envDir: "../",
  build: {
    outDir: "build",
    rollupOptions: {
      output: {
        assetFileNames(chunkInfo) {
          if (chunkInfo?.name?.endsWith(".woff2")) {
            return 'assets/fonts/[name]-[hash][extname]';
          }

          return 'assets/[name]-[hash][extname]';
        },
        // Creating separate chunk for locales except for en and percentages.json so they
        // can be cached at runtime and not merged with
        // app precache. en.json and percentages.json are needed for first load
        // or fallback hence not clubbing with locales so first load followed by offline mode works fine. This is how CRA used to work too.
        manualChunks(id) {
          if (
            id.includes("packages/excalidraw/locales") &&
            id.match(/en.json|percentages.json/) === null
          ) {
            const index = id.indexOf("locales/");
            // Taking the substring after "locales/"
            return `locales/${id.substring(index + 8)}`;
          }
        }
      },
    },
    sourcemap: true,
  },
  plugins: [
    ViteUrlToString(),
    react(),
    checker({
      typescript: true,
      eslint:
        envVars.VITE_APP_ENABLE_ESLINT === "false"
          ? undefined
          : { lintCommand: 'eslint "./**/*.{js,ts,tsx}"' },
      overlay: {
        initialIsOpen: envVars.VITE_APP_COLLAPSE_OVERLAY === "false",
        badgeStyle: "margin-bottom: 4rem; margin-left: 1rem",
      },
    }),
    svgrPlugin(),
    ViteEjsPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        /* set this flag to true to enable in Development mode */
        enabled: false,
      },

      workbox: {
        // Don't push fonts and locales to app precache
        globIgnores: ["**/locales/**", "service-worker.js"],
        runtimeCaching: [
          {
            urlPattern: /.+\.woff2/,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 90, // <== 90 days
              },
            },
          },
          {
            urlPattern: new RegExp("locales/[^/]+.js"),
            handler: "CacheFirst",
            options: {
              cacheName: "locales",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // <== 30 days
              },
            },
          },
        ],
      },
      manifest: {
        short_name: "Excalidraw",
        name: "Excalidraw",
        description:
          "Excalidraw is a whiteboard tool that lets you easily sketch diagrams that have a hand-drawn feel to them.",
        icons: [
          {
            src: "android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "apple-touch-icon.png",
            type: "image/png",
            sizes: "180x180",
          },
          {
            src: "favicon-32x32.png",
            sizes: "32x32",
            type: "image/png",
          },
          {
            src: "favicon-16x16.png",
            sizes: "16x16",
            type: "image/png",
          },
        ],
        start_url: "/",
        display: "standalone",
        theme_color: "#121212",
        background_color: "#ffffff",
        file_handlers: [
          {
            action: "/",
            accept: {
              "application/vnd.excalidraw+json": [".excalidraw"],
            },
          },
        ],
        share_target: {
          action: "/web-share-target",
          method: "POST",
          enctype: "multipart/form-data",
          params: {
            files: [
              {
                name: "file",
                accept: [
                  "application/vnd.excalidraw+json",
                  "application/json",
                  ".excalidraw",
                ],
              },
            ],
          },
        },
        screenshots: [
          {
            src: "/screenshots/virtual-whiteboard.png",
            type: "image/png",
            sizes: "462x945",
          },
          {
            src: "/screenshots/wireframe.png",
            type: "image/png",
            sizes: "462x945",
          },
          {
            src: "/screenshots/illustration.png",
            type: "image/png",
            sizes: "462x945",
          },
          {
            src: "/screenshots/shapes.png",
            type: "image/png",
            sizes: "462x945",
          },
          {
            src: "/screenshots/collaboration.png",
            type: "image/png",
            sizes: "462x945",
          },
          {
            src: "/screenshots/export.png",
            type: "image/png",
            sizes: "462x945",
          },
        ],
      },
    }),
    createHtmlPlugin({
      minify: true,
    }),
  ],
  publicDir: "../public",
});

/**
 * Extending Vite to resolve url's to fonts imported as esm modules, similar to what esbuild does with "file" loader.
 */
export function ViteUrlToString(): PluginOption {
  // for now limited to woff2 only, might be extended to any assets in the future
  const regex = /^https:\/\/.+?\.woff2$/;
  let isDev: boolean;

  return {
    name: "url-import-to-string",
    enforce: "pre" as const,
    config(_, { command }) {
      isDev = command === "serve";
    },
    resolveId(source) {
      if (!regex.test(source)) {
        return null;
      };
        
      // getting the url to the dependency tree
      return source;
    },
    load(id) {
      if (!regex.test(id)) {
        return null;
      };

      // loading the url as string
      return `export default "${id}"`;
    },
    // necessary for dev as vite / rollup does skips https imports in serve (~dev) mode
    // aka dev mode equivalent of "export default x" above (resolveId + load)
    transform(code, id) {
      // treat https woff2 imports as a text
      if (isDev && id.endsWith("/excalidraw/fonts.ts")) {
        return code.replaceAll(/import\s+(\w+)\s+from\s+(["']https:\/\/.+?\.woff2["'])/g, `const $1 = $2`);
      }
    }
  }
}