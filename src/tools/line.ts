import { defineTool } from "./defineTool";
import type { ToolInstance } from "./types";

type LineToolConfig = {
  color?: string;
  size?: number;
};

export const lineTool = defineTool({
  name: "line",

  create(config: LineToolConfig = {}): ToolInstance {
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
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

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
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        active = false;
        snapshot = null;
      },
    };
  },
});
