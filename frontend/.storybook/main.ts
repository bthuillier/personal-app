import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
  ],
  // Reuses vite.config.ts (React, Tailwind and the "@" alias).
  framework: "@storybook/react-vite",
  core: { disableTelemetry: true },
};

export default config;
