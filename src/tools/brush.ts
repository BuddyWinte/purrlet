import { defineTool } from "./defineTool";
import type { ToolInstance } from "./types";

type BrushToolConfig = {
  color?: string;
  size?: number;
};

export const brushTool = defineTool({
  name: "brush",

  create(config: BrushToolConfig = {}): ToolInstance {
    return {
      onDown(p, { ctx }) {
        ctx.strokeStyle = config.color ?? "#000";
        ctx.lineWidth = config.size ?? 5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

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
});
