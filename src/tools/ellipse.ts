/**
 * @module purrlet/tools/ellipse
 *
 * Ellipse / circle drawing tool with live preview and optional fill.
 *
 * Draws an axis-aligned ellipse inscribed in the bounding box defined by
 * the pointer-down and current pointer positions.  The ellipse is centred
 * at the midpoint of that box, with `radiusX` and `radiusY` equal to half
 * the box's width and height respectively.
 *
 * **`ctx.ellipse()` parameters explained:**
 * - `centerX`, `centerY` — midpoint of the drag bounding box.
 * - `radiusX` — half the horizontal distance between the two corners.
 * - `radiusY` — half the vertical distance.
 * - `rotation` — always `0` (axis-aligned; no tilt support).
 * - `startAngle` — `0` (begin at the 3-o'clock position).
 * - `endAngle` — `2π` (full 360° arc).
 *
 * **Shift-key constraint:** Holding `Shift` forces `radiusX === radiusY`,
 * producing a perfect circle whose radius is the larger of the two radii.
 *
 * @tool ellipse
 * @added v0.2.0
 * @config { color?: string, size?: number, fill?: boolean }
 */

import type { Tool, ToolInstance } from "./types";

/**
 * Configuration options accepted by {@link ellipseTool.create}.
 *
 * @property color - Stroke/fill color as any valid CSS color string. Default: `"#000"`.
 * @property size  - Stroke width in CSS pixels (ignored when `fill` is `true`). Default: `2`.
 * @property fill  - When `true`, the ellipse is filled instead of stroked. Default: `false`.
 */
type EllipseConfig = {
  color?: string;
  size?: number;
  fill?: boolean;
};

/**
 * Ellipse tool singleton.
 *
 * Creates a {@link ToolInstance} that draws axis-aligned ellipses (or circles
 * when Shift is held) using `CanvasRenderingContext2D.ellipse()`.
 */
export const ellipseTool: Tool = {
  name: "ellipse",

  create(config: EllipseConfig = {}): ToolInstance {
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

        // Compute the bounding-box midpoint and radii from the two drag corners.
        const centerX = (startX + p.x) / 2;
        const centerY = (startY + p.y) / 2;
        let radiusX = Math.abs(p.x - startX) / 2;
        let radiusY = Math.abs(p.y - startY) / 2;

        // Shift-key constraint: force equal radii for a perfect circle.
        // Uses the larger radius so the circle always fits within the
        // original bounding box.
        if (p.raw.shiftKey) {
          const r = Math.max(radiusX, radiusY);
          radiusX = r;
          radiusY = r;
        }

        // Guard: don't draw a degenerate ellipse when the user barely moved.
        if (radiusX < 0.5 && radiusY < 0.5) return;

        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = size;

        // Draw the ellipse path:
        //   ctx.ellipse(cx, cy, rx, ry, rotation, startAngle, endAngle)
        // rotation = 0 → axis-aligned; 0 to 2π → full closed arc.
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        if (fill) {
          ctx.fill();
        } else {
          ctx.stroke();
        }
        ctx.restore();
      },

      onUp(p, { ctx }) {
        if (!active || !snapshot) return;
        ctx.putImageData(snapshot, 0, 0);

        const centerX = (startX + p.x) / 2;
        const centerY = (startY + p.y) / 2;
        let radiusX = Math.abs(p.x - startX) / 2;
        let radiusY = Math.abs(p.y - startY) / 2;

        if (p.raw.shiftKey) {
          const r = Math.max(radiusX, radiusY);
          radiusX = r;
          radiusY = r;
        }

        if (radiusX < 0.5 && radiusY < 0.5) {
          active = false;
          snapshot = null;
          return;
        }

        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = size;

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        if (fill) {
          ctx.fill();
        } else {
          ctx.stroke();
        }
        ctx.restore();

        active = false;
        snapshot = null;
      },
    };
  },
};
