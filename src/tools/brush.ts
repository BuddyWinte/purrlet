import type { Tool, ToolInstance, PurrletPointer } from "../types";
import type { Renderer } from "../core/renderer";

type BrushConfig = {
  color?: string;
  size?: number;

  pressureEnabled?: boolean;
  pressureMinSizeFactor?: number;
};

export const brushTool: Tool<BrushConfig> = {
  name: "brush",

  create(config: BrushConfig = {}): ToolInstance {
    let lastSize = config.size ?? 5;

    let isDrawing = false;

    const color = config.color ?? "#000";
    const baseSize = config.size ?? 5;

    const pressureEnabled = config.pressureEnabled ?? true;
    const minFactor = config.pressureMinSizeFactor ?? 0.2;

    const getSize = (p: PurrletPointer) => {
      if (!pressureEnabled || p.pointerType !== "pen") {
        return baseSize;
      }

      const pressure = Math.max(0.05, p.pressure);
      return baseSize * (minFactor + pressure * (1 - minFactor));
    };

    return {
      onPointerDown(p, r: Renderer) {
        isDrawing = true;

        const size = getSize(p);
        lastSize = size;

        r.beginStroke(color, size, p.x, p.y);
      },

      onPointerMove(p, r: Renderer) {
        if (!p.isDown || !isDrawing) return;

        const size = getSize(p);
        lastSize = size;

        r.addPoint(p.x, p.y, size);
      },

      onPointerUp(_, r: Renderer) {
        if (!isDrawing) return;

        isDrawing = false;
        r.endStroke();
      },
    };
  },
};