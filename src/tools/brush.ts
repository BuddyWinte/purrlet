import type { Tool, ToolInstance, PurrletPointer } from "../types";

type BrushConfig = {
  color?: string;
  size?: number;
};

export const brushTool: Tool<BrushConfig> = {
  name: "brush",

  create(config: BrushConfig = {}): ToolInstance {
    let last: { x: number; y: number } | null = null;

    const color = config.color ?? "#000";
    const size = config.size ?? 5;

    return {
      onPointerDown(p: PurrletPointer, ctx) {
        last = { x: p.x, y: p.y };

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      },

      onPointerMove(p: PurrletPointer, ctx) {
        if (!p.isDown || !last) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        last = { x: p.x, y: p.y };
      },

      onPointerUp() {
        last = null;
      },
    };
  },
};