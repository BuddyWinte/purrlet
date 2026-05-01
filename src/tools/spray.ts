/**
 * @module purrlet/tools/spray
 *
 * Spray-can / airbrush tool that scatters random dots around the cursor.
 *
 * On each pointer event (down and move) the tool sprays a configurable
 * number of 1×1 pixel dots randomly distributed within a circle of the
 * given radius, centred on the cursor.
 *
 * **Random scatter algorithm:**
 * For each dot the tool picks:
 * - A random **angle** θ uniformly in `[0, 2π)`.
 * - A random **distance** r uniformly in `[0, radius)`.
 *
 * This produces a uniform-density distribution within the spray circle
 * (points near the centre are *not* more dense than points near the edge).
 * The Cartesian displacement is computed as `(r·cos(θ), r·sin(θ))` and
 * added to the cursor position.  Each dot is stamped as a 1×1 `fillRect`
 * call for maximum performance.
 *
 * @tool spray
 * @added v0.2.0
 * @config { color?: string, size?: number, density?: number }
 */

import type { Tool, ToolInstance } from "./types";

/**
 * Configuration options accepted by {@link sprayTool.create}.
 *
 * @property color   - Dot color as any valid CSS color string. Default: `"#000"`.
 * @property size    - Spray radius in CSS pixels. Default: `20`.
 * @property density - Number of dots to spray per pointer event. Default: `30`.
 *                     Higher values produce a denser, more opaque spray pattern.
 */
type SprayConfig = {
  color?: string;
  size?: number;
  density?: number;
};

/**
 * Spray tool singleton.
 *
 * Creates a {@link ToolInstance} that sprays random dots on every pointer
 * event while the button is held down.
 */
export const sprayTool: Tool = {
  name: "spray",

  create(config: SprayConfig = {}): ToolInstance {
    const color = config.color ?? "#000";
    const radius = config.size ?? 20;
    const density = config.density ?? 30;

    /**
     * Sprays `density` random dots within a circle of `radius` pixels
     * centred on `(cx, cy)`.
     *
     * Each dot is placed by picking a uniform random angle in `[0, 2π)`
     * and a uniform random distance in `[0, radius)`, then converting
     * to Cartesian coordinates.  The dot is drawn as a 1×1 `fillRect`
     * for minimal overhead.
     *
     * @param ctx - The canvas 2D rendering context.
     * @param cx  - Horizontal centre of the spray in CSS pixels.
     * @param cy  - Vertical centre of the spray in CSS pixels.
     */
    function spray(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
      ctx.fillStyle = color;
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * radius;
        const dx = cx + r * Math.cos(angle);
        const dy = cy + r * Math.sin(angle);
        ctx.fillRect(dx, dy, 1, 1);
      }
    }

    return {
      onDown(p, { ctx }) {
        ctx.save();
        spray(ctx, p.x, p.y);
      },

      onMove(p, { ctx }) {
        if (!p.isDown) return;
        spray(ctx, p.x, p.y);
      },

      onUp(_p, { ctx }) {
        ctx.restore();
      },
    };
  },
};
