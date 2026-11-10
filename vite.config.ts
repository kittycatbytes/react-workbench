import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    // Thrown lesson errors are caught on the stage. The overlay would cover them.
    hmr: { overlay: false },
  },
});
