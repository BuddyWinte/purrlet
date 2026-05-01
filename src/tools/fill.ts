/**
 * @module purrlet/tools/fill
 *
 * Flood fill tool using a stack-based scanline algorithm.
 *
 * Fills a contiguous region of similar-colored pixels with a solid color.
 * Uses a stack-based scanline approach for performance on large areas.
 *
 * **How it works:**
 * 1. Sample the target color at the click position (in device-pixel space).
 * 2. If the target color already matches the fill color, bail out early.
 * 3. Push the clicked pixel onto the stack.
 * 4. Pop pixels one at a time; for each popped pixel, scan left and right
 *    along the same row until a non-matching pixel or visited pixel is hit.
 * 5. Fill every pixel in that horizontal span.
 * 6. For each filled pixel, check the pixel directly above and below;
 *    if it matches the target color and hasn't been visited, push it onto
 *    the stack for later processing.
 * 7. Continue until the stack is empty, then write the modified `ImageData`
 *    back to the canvas in a single `putImageData` call.
 *
 * **Why scanline?**  A naïve per-pixel flood fill (BFS/DFS) would push
 * every single pixel onto the stack, consuming huge amounts of memory on
 * large fills.  The scanline approach only pushes the *start* of each new
 * row-segment, reducing stack depth dramatically.
 *
 * @tool fill
 * @added v0.2.0
 * @config { color?: string, tolerance?: number }
 */

import type { Tool, ToolInstance } from "./types";

/**
 * Configuration options accepted by {@link fillTool.create}.
 *
 * @property color     - Fill color as a 6-digit hex string (e.g. `"#ff0000"`).
 *                       Default: `"#000000"`.
 * @property tolerance - Per-channel color distance threshold (0–255).  Pixels
 *                       whose individual R/G/B/A channels each differ by at most
 *                       this value from the target color are considered matching.
 *                       Default: `32`.
 */
type FillConfig = {
  color?: string;
  tolerance?: number;
};

/**
 * Converts a 6-digit hex color string to an RGBA tuple `[r, g, b, a]`.
 *
 * Alpha is always set to `255` (fully opaque) because the fill tool
 * stamps pixels directly into `ImageData`.
 *
 * @param hex - A `#rrggbb` color string.
 * @returns A 4-element `[r, g, b, a]` tuple with values in `[0, 255]`.
 */
function hexToRgba(hex: string): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, 255];
}

/**
 * Tests whether the pixel at byte-offset `idx` in `data` matches `target`
 * within the given per-channel `tolerance`.
 *
 * The Manhattan distance across all four channels (R, G, B, A) is compared
 * against `tolerance * 4`.  This allows each channel to differ by up to
 * `tolerance` before the pixel is considered a non-match.
 *
 * @param data      - Raw `Uint8ClampedArray` from `ImageData`.
 * @param idx       - Byte offset of the pixel's red channel.
 * @param target    - The `[r, g, b, a]` color to compare against.
 * @param tolerance - Per-channel distance threshold (0–255).
 * @returns `true` if the pixel is close enough to the target color.
 */
function colorMatch(
  data: Uint8ClampedArray,
  idx: number,
  target: number[],
  tolerance: number
): boolean {
  return (
    Math.abs(data[idx] - target[0]) +
      Math.abs(data[idx + 1] - target[1]) +
      Math.abs(data[idx + 2] - target[2]) +
      Math.abs(data[idx + 3] - target[3]) <=
    tolerance * 4
  );
}

/**
 * Fill tool singleton.
 *
 * Produces a {@link ToolInstance} that performs a flood fill on `onDown`.
 * `onMove` and `onUp` are no-ops because a fill is a single-click action.
 */
export const fillTool: Tool = {
  name: "fill",

  create(config: FillConfig = {}): ToolInstance {
    const color = config.color ?? "#000000";
    const tolerance = config.tolerance ?? 32;

    return {
      onDown(p, { canvas }) {
        const ctx = canvas.getContext("2d")!;
        const w = canvas.width;
        const h = canvas.height;
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // Scale CSS-pixel coordinates to device-pixel space (canvas is backed
        // at physical resolution for sharp rendering on HiDPI displays).
        const px = Math.round(p.x * (window.devicePixelRatio || 1));
        const py = Math.round(p.y * (window.devicePixelRatio || 1));

        if (px < 0 || px >= w || py < 0 || py >= h) return;

        const idx = (py * w + px) * 4;
        const targetColor = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
        const fillColor = hexToRgba(color);

        // Don't fill if same color
        if (colorMatch(data, idx, fillColor, 0)) return;

        // Bit-set tracking which pixels have already been visited/filled.
        // A Uint8Array is cheaper than a Set for dense 2D grids.
        const visited = new Uint8Array(w * h);
        // Stack holds seed pixels for new scanline rows to process.
        const stack: [number, number][] = [[px, py]];

        // === Scanline flood-fill main loop ===
        while (stack.length > 0) {
          const [sx, sy] = stack.pop()!;
          let vi = sy * w + sx;
          if (visited[vi]) continue;

          // Scan leftward from the seed pixel until we hit a non-matching
          // pixel, the canvas edge, or an already-visited pixel.
          let left = sx;
          while (
            left > 0 &&
            colorMatch(data, (sy * w + left - 1) * 4, targetColor, tolerance) &&
            !visited[sy * w + left - 1]
          ) {
            left--;
          }

          // Scan rightward from the seed pixel under the same conditions.
          let right = sx;
          while (
            right < w - 1 &&
            colorMatch(data, (sy * w + right + 1) * 4, targetColor, tolerance) &&
            !visited[sy * w + right + 1]
          ) {
            right++;
          }

          // Fill the entire horizontal span [left, right] and seed new rows.
          // For each filled pixel, check if the pixel directly above or below
          // also matches the target color; if so, push it as a new seed for
          // the adjacent row's scanline pass.
          for (let x = left; x <= right; x++) {
            const i = (sy * w + x) * 4;
            const vi2 = sy * w + x;
            if (!visited[vi2] && colorMatch(data, i, targetColor, tolerance)) {
              data[i] = fillColor[0];
              data[i + 1] = fillColor[1];
              data[i + 2] = fillColor[2];
              data[i + 3] = fillColor[3];
              visited[vi2] = 1;

              // Check above
              if (
                sy > 0 &&
                !visited[(sy - 1) * w + x] &&
                colorMatch(data, ((sy - 1) * w + x) * 4, targetColor, tolerance)
              ) {
                stack.push([x, sy - 1]);
              }
              // Check below
              if (
                sy < h - 1 &&
                !visited[(sy + 1) * w + x] &&
                colorMatch(data, ((sy + 1) * w + x) * 4, targetColor, tolerance)
              ) {
                stack.push([x, sy + 1]);
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
      },

      onMove() {},

      onUp() {},
    };
  },
};
