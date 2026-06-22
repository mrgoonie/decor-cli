import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    include: ["packages/**/*.test.ts"],
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      include: ["packages/core/src/**/*.ts"],
      exclude: ["packages/core/src/contracts/**", "packages/core/src/index.ts"],
      thresholds: {
        statements: 80,
        lines: 80,
        functions: 75,
        branches: 50
      }
    }
  },
  resolve: {
    alias: {
      "decor-cli-core": new URL("./packages/core/src/index.ts", import.meta.url).pathname,
      "decor-cli": new URL("./packages/cli/src/index.ts", import.meta.url).pathname,
      "decor-cli-mcp": new URL("./packages/mcp/src/index.ts", import.meta.url).pathname
    }
  }
});
