import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";

const packageJson = require("./package.json");

export default [
  {
    input: "src/index.ts",

    output: [
      {
        file: packageJson.main,
        format: "cjs",
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: true,
      },
      {
        file: "dist/purrlet.js",
        format: "umd",
        name: "Purrlet",
        sourcemap: true,
      },
      {
        file: "dist/purrlet.min.js",
        format: "umd",
        name: "Purrlet",
        sourcemap: true,
        plugins: [terser()],
      },
    ],

    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
      }),
    ],

    external: [],
  },

  {
    input: "dist/types/index.d.ts",
    output: [
      {
        file: "dist/index.d.ts",
        format: "esm",
      },
    ],
    plugins: [dts()],
  },
];
