import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

const banner = `/*!
 * Purrlet v0.2.0
 *
 * A lightweight headless drawbox-style canvas engine for indie sites and creative side projects. simple, fast, flexible.
 * meow
 *
 * Created by BuddyWinte and contributors
 * https://github.com/BuddyWinte/Purrlet
 *
 * SPDX-License-Identifier: MIT
 */`;

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/purrlet.min.js",
        format: "umd",
        name: "Purrlet",
        sourcemap: true,
        banner,
      },
      {
        file: "dist/purrlet.mjs",
        format: "es",
        sourcemap: true,
        banner,
      },
      {
        file: "dist/purrlet.cjs",
        format: "cjs",
        sourcemap: true,
        banner,
        exports: "named",
      },
    ],
    plugins: [
      resolve(),
      typescript({ tsconfig: "./tsconfig.json" }),
      terser({
        format: { comments: /^!/ },
      }),
    ],
  },
];
