import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    glob: ["**/*.{test,spec}.{ts,tsx}"],
    environment: "node",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts", "*.ts"],
      exclude: [
        "node_modules",
        "dist",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/index.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
