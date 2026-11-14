import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset URLs so the same build works on GitHub Pages and locally.
  base: "./",
  plugins: [react()],
  server: {
    // Thrown lesson errors are caught on the stage. The overlay would cover them.
    hmr: { overlay: false },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
