/**
 * @module purrlet/tools/eyedropper
 *
 * Color-picker (eyedropper) tool that samples the pixel under the cursor.
 *
 * On click the tool reads a single pixel from the canvas, converts the
 * RGBA value to a 6-digit hex string, and dispatches a `purrlet:colorpick`
 * custom event on the `<canvas>` element with `{ hex }` in its `detail`.
 * Consumer code can listen for this event to update UI color pickers,
 * active tool colors, etc.
 *
 * **DPR coordinate mapping:**
 * The renderer may scale the canvas backing-store by `devicePixelRatio` for
 * sharp rendering on HiDPI screens.  Because `getImageData` operates in
 * physical (device) pixel space, the tool must multiply the CSS-pixel
 * coordinates from the {@link Pointer} by `window.devicePixelRatio` before
 * sampling.  Without this correction the tool would sample the wrong
 * pixel on any display with DPR > 1.
 *
 * @tool eyedropper
 * @added v0.2.0
 */

import type { Tool, ToolInstance } from "./types";

/**
 * Eyedropper tool singleton.
 *
 * Creates a {@link ToolInstance} that, on pointer-down, samples the pixel
 * at the cursor position and emits a `purrlet:colorpick` event.
 */
export const eyedropperTool: Tool = {
  name: "eyedropper",

  create(): ToolInstance {
    return {
      onDown(p, { canvas, ctx }) {
        // Convert CSS-pixel coords to physical-pixel coords for getImageData.
        // getImageData reads from the actual backing-store resolution, which
        // may be scaled by devicePixelRatio (e.g. 2× on Retina displays).
        const dpr = window.devicePixelRatio || 1;
        const px = Math.round(p.x * dpr);
        const py = Math.round(p.y * dpr);
        // Read a 1×1 pixel region; .data is [R, G, B, A].
        const pixel = ctx.getImageData(px, py, 1, 1).data;
        // Convert each channel to a zero-padded 2-digit hex string.
        const hex =
          "#" +
          pixel[0].toString(16).padStart(2, "0") +
          pixel[1].toString(16).padStart(2, "0") +
          pixel[2].toString(16).padStart(2, "0");
        // Emit a custom event so consumer code can react to the picked color.
        canvas.dispatchEvent(
          new CustomEvent("purrlet:colorpick", { detail: { hex } })
        );
      },

      onMove() {},

      onUp() {},
    };
  },
};
