import { defineTool } from "./defineTool";
import { parseCssColor } from "./color";
import type { ToolInstance } from "./types";

type FillToolConfig = {
  color?: string;
  tolerance?: number;
};

export const fillTool = defineTool({
  name: "fill",

  create(config: FillToolConfig = {}): ToolInstance {
    return {
      onDown(p, { ctx }) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const x = clamp(Math.floor(p.x), 0, width - 1);
        const y = clamp(Math.floor(p.y), 0, height - 1);
        const image = ctx.getImageData(0, 0, width, height);
        const { data } = image;
        const startIndex = getIndex(x, y, width);
        const target = readColor(data, startIndex);
        const next = parseCssColor(config.color ?? "#000");
        const tolerance = Math.max(0, config.tolerance ?? 0);

        if (colorsMatch(target, next, tolerance)) return;

        const stack: Array<[number, number]> = [[x, y]];

        while (stack.length > 0) {
          const point = stack.pop();
          if (!point) continue;

          const [cx, cy] = point;

          if (cx < 0 || cy < 0 || cx >= width || cy >= height) {
            continue;
          }

          const index = getIndex(cx, cy, width);

          if (!colorsMatch(readColor(data, index), target, tolerance)) {
            continue;
          }

          writeColor(data, index, next);

          stack.push([cx + 1, cy]);
          stack.push([cx - 1, cy]);
          stack.push([cx, cy + 1]);
          stack.push([cx, cy - 1]);
        }

        ctx.putImageData(image, 0, 0);
      },

      onMove() {},

      onUp() {},
    };
  },
});

function getIndex(x: number, y: number, width: number) {
  return (y * width + x) * 4;
}

function readColor(data: Uint8ClampedArray, index: number) {
  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
    a: data[index + 3],
  };
}

function writeColor(
  data: Uint8ClampedArray,
  index: number,
  color: { r: number; g: number; b: number; a: number }
) {
  data[index] = color.r;
  data[index + 1] = color.g;
  data[index + 2] = color.b;
  data[index + 3] = color.a;
}

function colorsMatch(
  a: { r: number; g: number; b: number; a: number },
  b: { r: number; g: number; b: number; a: number },
  tolerance: number
) {
  return (
    Math.abs(a.r - b.r) <= tolerance &&
    Math.abs(a.g - b.g) <= tolerance &&
    Math.abs(a.b - b.b) <= tolerance &&
    Math.abs(a.a - b.a) <= tolerance
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
