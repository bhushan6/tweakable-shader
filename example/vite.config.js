import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  let alias = {};

  if (mode === "development") {
    alias = {
      "tweakable-shader": path.resolve(__dirname, "../package/src/index.js"),
    };
  }

  return {
    resolve: {
      alias: alias,
    },
    plugins: [],
  };
});
