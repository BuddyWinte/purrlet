/**
 * @module purrlet/tools/eraser
 *
 * Eraser tool that removes pixels by painting with `destination-out`.
 *
 * Instead of drawing a white stroke, the eraser uses `globalCompositeOperation
 * = "destination-out"` to punch through existing pixels, leaving transparency.
 * This works correctly on any background colour or layered composition.
 *
 * @tool eraser
 * @changed v0.2.0 — documentation pass; no behavioural changes
 */

import type { Tool, ToolInstance } from "./types";

/**
 * Configuration options accepted by {@link eraserTool.create}.
 *
 * @property size - Eraser radius in CSS pixels. Default: `20`.
 */
type EraserConfig = {
  size?: number;
};

/**
 * Eraser tool singleton.
 *
 * Produces a {@link ToolInstance} that erases pixels under the pointer.
 * The stroke is rendered with `destination-out` compositing so that the
 * erased area becomes transparent rather than painted white.
 */
export const eraserTool: Tool = {
  name: "eraser",

  create(config: EraserConfig = {}): ToolInstance {
    const size = config.size ?? 20;

    return {
      onDown(p, { ctx }) {
        ctx.save();

        ctx.globalCompositeOperation = "destination-out";
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
