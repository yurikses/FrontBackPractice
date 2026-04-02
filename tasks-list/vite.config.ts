import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
// https://vite.dev/config/

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync("./localhost+2-key.pem"),
      cert: fs.readFileSync("./localhost+2.pem"),
    },
  },

  plugins: [react(), tailwindcss()],
  build: {
    manifest: true,
  },
});
