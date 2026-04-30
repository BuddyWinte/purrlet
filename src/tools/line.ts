import type { Tool, ToolInstance } from "./types";

type LineConfig = {
  color?: string;
  size?: number;
};

export const lineTool: Tool = {
  name: "line",
  create(config: LineConfig = {}): ToolInstance {
    let startX = 0;
    let startY = 0;
    let snapshot: ImageData | null = null;
    let active = false;
    return {
      onDown(p, { ctx }) {
        if (active) return;
        active = true;
        startX = p.x;
        startY = p.y;
        snapshot = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
      },

      onMove(p, { ctx }) {
        if (!active || !snapshot) return;

        ctx.putImageData(snapshot, 0, 0);

        ctx.strokeStyle = config.color ?? "#000";
        ctx.lineWidth = config.size ?? 3;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      },

      onUp(p, { ctx }) {
        if (!active || !snapshot) return;
        ctx.putImageData(snapshot, 0, 0);
        ctx.strokeStyle = config.color ?? "#000";
        ctx.lineWidth = config.size ?? 3;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        active = false;
        snapshot = null;
      },
    };
  },
};