import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import copy from "rollup-plugin-copy";
import del from "rollup-plugin-delete";

const destDir = `../extension/debug-ui-out`;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
      },
      plugins: [
        del({
          targets: destDir,
          force: true,
        }),
        copy({
          targets: [
            { src: `dist/index.js`, dest: destDir },
            { src: `dist/index.css`, dest: destDir },
          ],
          hook: "writeBundle",
        }),
      ],
    },
  },
});
