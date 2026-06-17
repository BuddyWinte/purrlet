import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

const banner = `/*!
 * Purrlet v1.1.0
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
    plugins: [
      resolve(),
      typescript({ tsconfig: "./tsconfig.json" }),
    ],
    output: [
      {
        file: "dist/purrlet.min.js",
        format: "umd",
        name: "Purrlet",
        sourcemap: true,
        banner,
        plugins: [
          terser({
            format: {
              comments: /^!/,
            },
          }),
        ],
      },
      {
        file: "dist/purrlet.mjs",
        format: "es",
        sourcemap: true,
        banner,
        plugins: [
          terser({
            format: {
              comments: /^!/,
            },
            compress: {
              module: true,
            },
          }),
        ],
      },
    ],
  },
];
