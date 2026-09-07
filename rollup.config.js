import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import terser from "@rollup/plugin-terser";
import pkg from "./package.json" with { type: "json" };
import json from "@rollup/plugin-json";

const banner = `/*!
 * ${pkg.name.charAt(0).toUpperCase() + pkg.name.slice(1)} v${pkg.version}
 * ${pkg.description}
 *
 * Maintained by BuddyWinte and pawsome contributors
 * https://github.com/BuddyWinte/purrlet
 *
 * Copyright (c) 2026 BuddyWinte
 * You may obtain a copy of the licens at
 * > http://www.apache.org/licenses/LICENSE-2.0
 *
 * SPDX-License-Identifier: Apache-2.0
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
      json(),
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
