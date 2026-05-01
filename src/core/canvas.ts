/**
 * Canvas initialization and DPR-aware scaling utilities.
 *
 * Handles the bootstrap step of preparing a raw `<canvas>` element for
 * use by the Purrlet engine: acquiring the 2D context, sizing the
 * backing store to match `devicePixelRatio`, and applying the correct
 * CSS dimensions so that drawing coordinates map 1:1 to CSS pixels.
 *
 * @module core/canvas
 * @since 0.1.0
 */

"use strict";

/**
 * Initialize a canvas element with device-pixel-ratio–aware dimensions.
 *
 * The canvas backing store is sized at `width × dpr` by `height × dpr`
 * physical pixels while the CSS layout size stays at `width × height`
 * CSS pixels. The 2D context is then scaled by `dpr` so that all
 * subsequent drawing commands use CSS-pixel coordinates directly.
 *
 * @param canvas — The `<canvas>` element to initialize.
 * @param width  — Desired CSS width in pixels. Defaults to `canvas.clientWidth`.
 * @param height — Desired CSS height in pixels. Defaults to `canvas.clientHeight`.
 * @returns An object containing the configured canvas, context, and DPR value.
 * @throws `[Purrlet] 2D context not available` if `getContext("2d")` fails.
 *
 * @example
 * ```ts
 * const { canvas, ctx, dpr } = setupCanvas(myCanvas, 800, 600);
 * // ctx is now scaled; drawing at (100, 100) maps to the correct physical pixel.
 * ```
 *
 * @since 0.1.0
 */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  width?: number,
  height?: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("[Purrlet] 2D context not available");

  const dpr = window.devicePixelRatio || 1;
  const w = width ?? canvas.clientWidth;
  const h = height ?? canvas.clientHeight;

  // Size the backing store to physical pixels
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  // Fix the CSS layout size to logical pixels
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  // Scale context so callers work in CSS-pixel coordinates
  ctx.scale(dpr, dpr);

  return { canvas, ctx, dpr };
}
