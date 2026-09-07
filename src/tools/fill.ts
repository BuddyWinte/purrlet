"use strict";

import type { Tool, ToolInstance } from "../types";

export interface FillConfig {
  readonly color?: string;
  readonly tolerance?: number;
}

export const fillTool: Tool<FillConfig> = {
  name: "fill",

  create(
    config: Readonly<FillConfig> = {},
  ): ToolInstance<FillConfig> {
    const color = config.color ?? "#000000";
    const tolerance = config.tolerance ?? 32;

    return {
      config,

      onPointerDown(pointer, renderer): void {
        renderer.fill(
          pointer.x,
          pointer.y,
          color,
          tolerance,
        );
      },
    };
  },
};
