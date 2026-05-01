/**
 * @module purrlet/tools/rect
 *
 * Rectangle drawing tool with live preview and optional fill.
 *
 * Uses the same snapshot-restore technique as the line tool: the canvas
 * state is captured on pointer-down and restored on every move so that
 * only the current preview rectangle is visible.  On pointer-up the
 * final rectangle is committed.
 *
 * **Shift-key constraint:** Holding `Shift` while dragging forces the
 * rectangle into a perfect square.  The implementation takes the larger
 * of the absolute width and height, applies that dimension to both axes,
 * and preserves the sign (drag direction) so the rectangle can still be
 * drawn in any quadrant.
 *
 * @tool rect
 * @added v0.2.0
 * @config { color?: string, size?: number, fill?: boolean }
 */

import type { Tool, ToolInstance } from "./types";

/**
 * Configuration options accepted by {@link rectTool.create}.
 *
 * @property color - Stroke/fill color as any valid CSS color string. Default: `"#000"`.
 * @property size  - Stroke width in CSS pixels (ignored when `fill` is `true`). Default: `2`.
 * @property fill  - When `true`, the rectangle is filled instead of stroked. Default: `false`.
 */
type RectConfig = {
  color?: string;
  size?: number;
  fill?: boolean;
};

/**
 * Rectangle tool singleton.
 *
 * Creates a {@link ToolInstance} that draws axis-aligned rectangles.
 * Supports stroke or fill mode and a Shift-key square constraint.
 */
export const rectTool: Tool = {
  name: "rect",

  create(config: RectConfig = {}): ToolInstance {
    const color = config.color ?? "#000";
    const size = config.size ?? 2;
    const fill = config.fill ?? false;
    let startX = 0;
    let startY = 0;
    let snapshot: ImageData | null = null;
    let active = false;

    return {
      onDown(p, { ctx, canvas }) {
        if (active) return;
        active = true;
        startX = p.x;
        startY = p.y;
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      },

      onMove(p, { ctx }) {
        if (!active || !snapshot) return;

        ctx.putImageData(snapshot, 0, 0);

        let w = p.x - startX;
        let h = p.y - startY;

        // Shift-key constraint: force the rectangle into a perfect square.
        // `dim` is the larger of |width| and |height|; both dimensions are
        // set to ±dim while preserving the sign so the user can drag in any
        // direction (top-left → bottom-right, etc.).
        if (p.raw.shiftKey) {
          const dim = Math.max(Math.abs(w), Math.abs(h));
          w = Math.sign(w) * dim || dim;
          h = Math.sign(h) * dim || dim;
        }

        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = size;

        if (fill) {
          ctx.fillRect(startX, startY, w, h);
        } else {
          ctx.strokeRect(startX, startY, w, h);
        }
        ctx.restore();
      },

      onUp(p, { ctx }) {
        if (!active || !snapshot) return;
        ctx.putImageData(snapshot, 0, 0);

        let w = p.x - startX;
        let h = p.y - startY;

        if (p.raw.shiftKey) {
          const dim = Math.max(Math.abs(w), Math.abs(h));
          w = Math.sign(w) * dim || dim;
          h = Math.sign(h) * dim || dim;
        }

        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = size;

        if (fill) {
          ctx.fillRect(startX, startY, w, h);
        } else {
          ctx.strokeRect(startX, startY, w, h);
        }
        ctx.restore();

        active = false;
        snapshot = null;
      },
    };
  },
};
