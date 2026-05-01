/**
 * @module purrlet/tools/select
 *
 * Marquee selection tool that defines a rectangular region of interest.
 *
 * The user drags to define a selection rectangle (drawn as a dashed
 * outline during the drag).  On pointer-up the tool dispatches a
 * `purrlet:select` custom event on the `<canvas>` element with the
 * normalised bounding box `{ x, y, w, h }` in `event.detail`.
 *
 * **Marquee approach:**
 * 1. **Pointer-down** — The canvas state is captured as an `ImageData`
 *    snapshot so the dashed overlay can be cleanly removed on each frame.
 * 2. **Pointer-move** — The snapshot is restored (erasing the previous
 *    frame's dashed outline), then a new dashed `strokeRect` is drawn
 *    from the anchor point to the current cursor position.
 * 3. **Pointer-up** — The snapshot is restored one final time to remove
 *    the visual overlay.  If the resulting rectangle is larger than 2×2 px
 *    (to avoid accidental single-click selections), a `purrlet:select`
 *    event is dispatched with the normalised `{ x, y, w, h }` bounds.
 *
 * The bounding box is always normalised so that `x`/`y` is the top-left
 * corner and `w`/`h` are positive, regardless of drag direction.
 *
 * @tool select
 * @added v0.2.0
 */

import type { Tool, ToolInstance } from "./types";

/**
 * Select tool singleton.
 *
 * Creates a {@link ToolInstance} that draws a marquee selection rectangle
 * and emits a `purrlet:select` event on pointer-up with the final bounds.
 */
export const selectTool: Tool = {
  name: "select",

  create(): ToolInstance {
    /** Starting (anchor) coordinates of the drag. */
    let startX = 0;
    let startY = 0;
    /** Canvas snapshot taken on pointer-down; used to erase the dashed overlay. */
    let snapshot: ImageData | null = null;
    /** `true` while the user is actively dragging. */
    let active = false;
    /**
     * The final normalised selection bounds, or `null` if no selection is
     * active.  Coordinates are in CSS-pixel space relative to the canvas.
     */
    let selection: { x: number; y: number; w: number; h: number } | null = null;

    return {
      onDown(p, { canvas, ctx }) {
        active = true;
        startX = p.x;
        startY = p.y;
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        selection = null;
      },

      onMove(p, { ctx }) {
        if (!active || !snapshot) return;

        ctx.putImageData(snapshot, 0, 0);

        // Normalise coordinates so x/y is always the top-left corner
        // and w/h are always positive, regardless of drag direction.
        const x = Math.min(startX, p.x);
        const y = Math.min(startY, p.y);
        const w = Math.abs(p.x - startX);
        const h = Math.abs(p.y - startY);

        // Draw the dashed "marching ants" marquee outline.
        ctx.save();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
      },

      onUp(p, { canvas }) {
        if (!active || !snapshot) return;

        // Restore snapshot to cleanly remove the dashed marquee overlay.
        const ctx = canvas.getContext("2d")!;
        ctx.putImageData(snapshot, 0, 0);

        // Recompute normalised bounds for the final selection.
        const x = Math.min(startX, p.x);
        const y = Math.min(startY, p.y);
        const w = Math.abs(p.x - startX);
        const h = Math.abs(p.y - startY);

        // Only emit a selection event if the region is meaningfully large.
        // The 2×2 threshold prevents accidental single-click selections.
        if (w > 2 && h > 2) {
          selection = { x, y, w, h };
          canvas.dispatchEvent(
            new CustomEvent("purrlet:select", {
              detail: { ...selection },
            })
          );
        }

        active = false;
        snapshot = null;
      },

      /**
       * Optional cleanup — the renderer handles visual removal of the
       * selection overlay, so this is currently a no-op.
       */
      destroy() {
        // Selection is cleaned up by renderer
      },
    };
  },
};
