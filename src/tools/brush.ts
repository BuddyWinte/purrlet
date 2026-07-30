/**
 * Purrlet v2.0.0
 *
 * Please read the CONTRIBUTING.md file for our standards on code style and contribution.
 *
 * @author BuddyWinte (@buddywinte)
 * @contributors
 * - BuddyWinte (@buddywinte) - Initial implementation
 *
 * @since v0.9.0
 */
"use strict";

import type { Tool, ToolInstance, PurrletPointer } from "../types";
import type { Renderer } from "../core/renderer";

type BrushConfig = {
  color?: string;
  size?: number;
  smoothing?: number;
  pressureEnabled?: boolean;
  pressureMinSizeFactor?: number;
};

export const brushTool: Tool<BrushConfig> = {
  name: "brush",

  create(config: BrushConfig = {}): ToolInstance {
    let drawing = false;

    const color = config.color ?? "#000";
    const baseSize = config.size ?? 5;
    const pressureEnabled = config.pressureEnabled ?? true;
    const minFactor = config.pressureMinSizeFactor ?? 0.2;

    const sizeFor = (p: PurrletPointer) => {
      if (!pressureEnabled || p.pointerType !== "pen") return baseSize;
      const pressure = Math.max(0.05, p.pressure);
      return baseSize * (minFactor + pressure * (1 - minFactor));
    };

    return {
      onPointerDown(p, r: Renderer) {
        drawing = true;
        const size = sizeFor(p);
        r.beginStroke(color, size, p.x, p.y);
      },

      onPointerMove(p, r: Renderer) {
        if (!drawing || !p.isDown) return;
        r.addPoint(p.x, p.y, sizeFor(p));
      },

      onPointerUp(_, r: Renderer) {
        drawing = false;
        r.endStroke();
      },
    };
  },
};
