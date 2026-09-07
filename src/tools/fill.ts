/**
 * Purrlet
 * A modern, easy-to-use, lightweight, headless canvas drawing engine for the web.
 *
 * Please read the CONTRIBUTING.md file before you contrbute.
 */
"use strict";

import type { Tool } from "../types";

export type FillConfig = {
  color?: string;
  tolerance?: number;
};

export const fillTool: Tool<FillConfig> = {
  name: "fill",

  create(config = {}) {
    const color = config.color ?? "#000000";
    const tolerance = config.tolerance ?? 32;

    return {
      onPointerDown(p, renderer) {
        renderer.fill(
          p.x,
          p.y,
          color,
          tolerance,
        );
      },
    };
  },
};
