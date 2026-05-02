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
        if (width <= 0 || height <= 0) return;

        const startX = Math.max(0, Math.min(width - 1, Math.floor(p.x)));
        const startY = Math.max(0, Math.min(height - 1, Math.floor(p.y)));

        const image = ctx.getImageData(0, 0, width, height);
        const data = image.data;

        const fill = parseCssColor(config.color ?? "#000");
        const tolerance = Math.max(0, config.tolerance ?? 96);

        const seedIdx = startY * width + startX;
        const seedOffset = seedIdx * 4;
        const tr = data[seedOffset];
        const tg = data[seedOffset + 1];
        const tb = data[seedOffset + 2];
        const ta = data[seedOffset + 3];

        if (tr === fill.r && tg === fill.g && tb === fill.b && ta === fill.a) {
          return;
        }

        const total = width * height;
        const weights = new Uint8Array(total);
        const seen = new Uint8Array(total);
        const stack: number[] = [seedIdx];
        seen[seedIdx] = 1;

        while (stack.length) {
          const idx = stack.pop()!;
          const offset = idx * 4;

          const dist = Math.max(
            Math.abs(data[offset] - tr),
            Math.abs(data[offset + 1] - tg),
            Math.abs(data[offset + 2] - tb),
            Math.abs(data[offset + 3] - ta)
          );

          if (tolerance === 0 ? dist > 0 : dist > tolerance) continue;

          weights[idx] =
            tolerance === 0 ? 255 : Math.ceil((1 - dist / tolerance) * 255);

          const x = idx % width;
          if (x > 0 && !seen[idx - 1]) {
            seen[idx - 1] = 1;
            stack.push(idx - 1);
          }
          if (x < width - 1 && !seen[idx + 1]) {
            seen[idx + 1] = 1;
            stack.push(idx + 1);
          }
          if (idx >= width && !seen[idx - width]) {
            seen[idx - width] = 1;
            stack.push(idx - width);
          }
          if (idx < total - width && !seen[idx + width]) {
            seen[idx + width] = 1;
            stack.push(idx + width);
          }
        }

        for (let i = 0; i < total; i++) {
          const weight = weights[i];
          if (!weight) continue;
          const offset = i * 4;
          const t = weight / 255;
          const inv = 1 - t;
          data[offset] = data[offset] * inv + fill.r * t;
          data[offset + 1] = data[offset + 1] * inv + fill.g * t;
          data[offset + 2] = data[offset + 2] * inv + fill.b * t;
          data[offset + 3] = data[offset + 3] * inv + fill.a * t;
        }

        ctx.putImageData(image, 0, 0);
      },

      onMove() {},

      onUp() {},
    };
  },
});