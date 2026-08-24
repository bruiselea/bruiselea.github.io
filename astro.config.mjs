import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://nuunnu.com",
  integrations: [react()],
  output: "static",
  vite: {
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
    },
  },
});
