import { defineConfig } from "vitest/config";
import { ViteUrlToString } from "./excalidraw-app/vite.config.mjs";

export default defineConfig({
  plugins: [
    ViteUrlToString(),
  ],
  test: {
    setupFiles: ["./setupTests.ts"],
    globals: true,
    environment: "jsdom",
    coverage: {
      reporter: ["text", "json-summary", "json", "html", "lcovonly"],
      thresholds: {
        lines: 70,
        branches: 70,
        functions: 68,
        statements: 70,
      },
    },
  },
});
