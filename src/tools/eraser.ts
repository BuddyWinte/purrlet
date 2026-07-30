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

type EraserConfig = {
  size?: number;
  smoothing?: number;
  pressureEnabled?: boolean;
  pressureMinSizeFactor?: number;
};

export const eraserTool: Tool<EraserConfig> = {
  name: "eraser",

  create(config: EraserConfig = {}): ToolInstance {
    let drawing = false;

    const baseSize = config.size ?? 20;
    const pressureEnabled = config.pressureEnabled ?? true;
    const minFactor = config.pressureMinSizeFactor ?? 0.3;

    const sizeFor = (p: PurrletPointer) => {
      if (!pressureEnabled || p.pointerType !== "pen") return baseSize;

      const pressure = Math.max(0.05, p.pressure);
      return baseSize * (minFactor + pressure * (1 - minFactor));
    };

    return {
      onActivate(r: Renderer) {
        r.setMode("erase");
      },

      onDeactivate(r: Renderer) {
        r.setMode("draw");
      },

      onPointerDown(p, r: Renderer) {
        drawing = true;

        const size = sizeFor(p);

        r.setMode("erase");
        r.beginStroke("#000", size, p.x, p.y);
      },

      onPointerMove(p, r: Renderer) {
        if (!drawing || !p.isDown) return;

        const size = sizeFor(p);

        r.setMode("erase");
        r.addPoint(p.x, p.y, size);
      },

      onPointerUp(_, r: Renderer) {
        drawing = false;
        r.endStroke();
      },
    };
  },
};
