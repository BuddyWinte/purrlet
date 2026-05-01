/**
 * @module purrlet/tools/line
 *
 * Straight-line drawing tool with live preview.
 *
 * On each pointer move the tool restores a pre-captured canvas snapshot
 * and redraws the line from the start position to the current cursor,
 * giving the user real-time visual feedback before committing.
 *
 * @tool line
 * @changed v0.2.0 — documentation pass; no behavioural changes
 */

import type { Tool, ToolInstance } from "./types";

/**
 * Configuration options accepted by {@link lineTool.create}.
 *
 * @property color - Stroke color as any valid CSS color string. Default: `"#000"`.
 * @property size  - Line width in CSS pixels. Default: `3`.
 */
type LineConfig = {
  color?: string;
  size?: number;
};

/**
 * Line tool singleton.
 *
 * Uses a snapshot-restore technique: the full canvas `ImageData` is captured
 * on `onDown`.  During `onMove` the snapshot is restored and the preview
 * line is drawn on top.  On `onUp` the final line is committed.
 */
export const lineTool: Tool = {
  name: "line",

  create(config: LineConfig = {}): ToolInstance {
    const color = config.color ?? "#000";
    const size = config.size ?? 3;
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

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.restore();
      },

      onUp(p, { ctx }) {
        if (!active || !snapshot) return;
        ctx.putImageData(snapshot, 0, 0);

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.restore();

        active = false;
        snapshot = null;
      },
    };
  },
};
