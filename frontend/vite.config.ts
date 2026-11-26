/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // The planner works in local time; run the tests in the household's time zone so daylight saving changes are covered.
    env: { TZ: "Europe/Oslo" },
    // styles/contrast.test.ts reads the palette from index.css as text.
    css: { include: [/index\.css/] },
  },
});
