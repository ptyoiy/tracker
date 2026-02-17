import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const alias = {
  "@": path.resolve(dirname, "./src"),
};

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      // 유닛 테스트
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          globals: true,
          include: ["src/**/*.{test,spec}.{ts,tsx}"],
          exclude: [
            "**/node_modules/**",
            "**/.next/**",
            "src/**/*.api.test.ts",
          ],
        },
      },
      // 유닛 테스트 (실제 api 호출)
      {
        resolve: { alias },
        test: {
          name: "unit-api",
          environment: "node",
          globals: true,
          include: ["src/**/*.api.test.ts"],
          exclude: ["**/node_modules/**", "**/.next/**"],
        },
      },
      // 스토리북 테스트(통합, E2E)
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
});
