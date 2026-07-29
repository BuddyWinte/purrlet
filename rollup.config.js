import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

export default [
  {
    input: "src/index.ts",

    output: {
      file: "dist/purrlet.mjs",
      format: "es",
      sourcemap: true,
    },

    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
      }),
    ],
  },

  {
    input: "dist/types/index.d.ts",

    output: {
      file: "dist/index.d.ts",
      format: "es",
    },

    plugins: [
      dts(),
    ],
  },
];
