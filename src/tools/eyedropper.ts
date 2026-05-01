import { defineTool } from "./defineTool";
import { toHexColor, toRgbaString } from "./color";
import type { ToolInstance } from "./types";

type EyedropperToolConfig = {
  format?: "hex" | "rgba";
  onPickColor?: (
    color: string,
    detail: {
      x: number;
      y: number;
      r: number;
      g: number;
      b: number;
      a: number;
    }
  ) => void;
};

export const eyedropperTool = defineTool({
  name: "eyedropper",
  modifiesCanvas: false,

  create(config: EyedropperToolConfig = {}): ToolInstance {
    return {
      onDown(p, { ctx }) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const x = clamp(Math.floor(p.x), 0, width - 1);
        const y = clamp(Math.floor(p.y), 0, height - 1);
        const { data } = ctx.getImageData(x, y, 1, 1);
        const detail = {
          x,
          y,
          r: data[0],
          g: data[1],
          b: data[2],
          a: data[3],
        };
        const color =
          config.format === "rgba" ? toRgbaString(detail) : toHexColor(detail);

        config.onPickColor?.(color, detail);
      },

      onMove() {},

      onUp() {},
    };
  },
});

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
