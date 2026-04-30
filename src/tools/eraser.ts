import type { Tool, ToolInstance } from "./types";

type EraserConfig = {
  size?: number;
};

export const eraserTool: Tool = {
  name: "eraser",

  create(config: EraserConfig = {}): ToolInstance {
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

      onUp(_: any, { ctx }) {
        ctx.restore();
      },
    };
  },
};