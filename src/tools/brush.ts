import type { Tool, ToolInstance } from "./types";

export const brushTool: Tool = {
  name: "brush",

  create(config) {
    return {
      onDown(p, { ctx }) {
        ctx.strokeStyle = config.color ?? "#000";
        ctx.lineWidth = config.size ?? 5;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
      },

      onMove(p, { ctx }) {
        if (!p.isDown) return;

        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      },

      onUp() {},
    };
  },
};