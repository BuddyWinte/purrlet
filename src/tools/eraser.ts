import { defineTool } from "./defineTool";
import type { ToolInstance } from "./types";

type EraserToolConfig = {
  size?: number;
};

export const eraserTool = defineTool({
  name: "eraser",

  create(config: EraserToolConfig = {}): ToolInstance {
    return {
      onDown(p, { ctx }) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = config.size ?? 20;
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

      onUp(_, { ctx }) {
        ctx.restore();
      },
    };
  },
});
