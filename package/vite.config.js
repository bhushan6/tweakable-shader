/* eslint-disable no-undef */
import path from "node:path";
import { defineConfig } from "vite";
import fs from "fs";

function copyReadme() {
  fs.copyFileSync("../README.md", "./README.md");
  console.log("README.md was copied to root folder");
}

export default defineConfig((mode) => {
  copyReadme();

  return {
    plugins: [],
    build: {
      lib: {
        entry: path.resolve(__dirname, "src/index.js"),
        name: "tweakable-shader",
        formats: ["es", "umd"],
        fileName: (format) => `tweakable-shader.${format}.js`,
      },
      rollupOptions: {
        external: ["@babylonjs/core"],
      },
    },
  };
});
