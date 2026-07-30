import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import terser from "@rollup/plugin-terser";
import pkg from "./package.json" with { type: "json" };

const banner = `/*!
 * Purrlet v${pkg.version}
 *
 * Created by BuddyWinte and pawsome contributors
 * https://github.com/BuddyWinte/Purrlet
 *
 * License: PolyForm Noncommercial License 1.0.0
 */`;

export default [
  {
    input: {
      purrlet: "src/index.ts",
      providers: "src/providers/index.ts",
    },

    output: {
      dir: "dist",
      format: "es",
      sourcemap: true,
      banner,
      exports: "named",
      entryFileNames: "[name].mjs",
    },

    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
      }),
      terser({
        format: {
          comments: /^!/,
        },
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
