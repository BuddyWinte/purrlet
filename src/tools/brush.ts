/**
 * @module purrlet/tools/brush
 *
 * Freehand brush drawing tool.
 *
 * Renders smooth, variable-width strokes by connecting successive pointer
 * positions with `lineTo` calls.  Uses `round` line-cap and line-join
 * for natural-looking strokes without sharp corners.
 *
 * @tool brush
 * @changed v0.2.0 — documentation pass; no behavioural changes
 */

import type { Tool, ToolInstance } from "./types";

/**
 * Configuration options accepted by {@link brushTool.create}.
 *
 * @property color   - Stroke color as any valid CSS color string. Default: `"#000"`
 *                   (solid black).
 * @property size    - Line width in CSS pixels. Default: `5`.
 * @property opacity - Global alpha for the stroke in `[0, 1]`. Default: `1`
 *                   (fully opaque).
 */
type BrushConfig = {
  color?: string;
  size?: number;
  opacity?: number;
};

/**
 * Brush tool singleton.
 *
 * Creates a {@link ToolInstance} that draws freehand lines on every
 * pointer-move while the button is held down.  The stroke style is
 * configured once in `onDown` and restored in `onUp` so that the
 * renderer's state stays clean.
 */
export const brushTool: Tool = {
  name: "brush",

  create(config: BrushConfig = {}): ToolInstance {
    const color = config.color ?? "#000";
    const size = config.size ?? 5;
    const opacity = config.opacity ?? 1;

    return {
      onDown(p, { ctx }) {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
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

      onUp(_p, { ctx }) {
        ctx.restore();
      },
    };
  },
};
