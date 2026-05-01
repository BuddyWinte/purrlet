/**
 * Pointer event binding layer for the Purrlet engine.
 *
 * Normalizes raw browser `PointerEvent`s into a consistent
 * {@link PointerPayload} format (CSS-pixel coordinates, pressure, tilt)
 * and dispatches them to tool-agnostic `down` / `move` / `up` handlers.
 *
 * Key design decisions:
 * - Uses the **Pointer Events API** which unifies mouse, touch, and pen.
 * - Calls `setPointerCapture` on `pointerdown` so that `pointermove` and
 *   `pointerup` continue to fire even if the pointer leaves the canvas.
 * - Sets `touchAction: "none"` to prevent scroll interference on touch.
 * - Supports a `readOnly` mode that silently ignores all pointer input
 *   (useful for viewing a canvas without modifying it).
 *
 * @module core/pointer
 * @since 0.1.0
 * @changed v0.2.0 — Added `readOnly` guard and `pointercancel` handling;
 *  introduced {@link PointerPayload} type from `types.ts`.
 */

"use strict";

import type { PointerPayload } from "./types";

/**
 * Callback handlers that receive normalized pointer events from
 * the binding layer.
 */
type PointerHandlers = {
  /** Fired on `pointerdown` (pointer pressed). */
  down: (p: PointerPayload) => void;
  /** Fired on `pointermove` while a pointer is pressed. */
  move: (p: PointerPayload) => void;
  /** Fired on `pointerup` or `pointercancel` (pointer released). */
  up: (p: PointerPayload) => void;
};

/**
 * Bind pointer events to a canvas element and dispatch normalized
 * payloads to the provided handlers.
 *
 * @param canvas   — The target `<canvas>` element.
 * @param handlers — Object with `down`, `move`, and `up` callbacks.
 * @param readOnly — When `true`, all pointer events are ignored
 *                   (default `false`).
 * @returns A cleanup object with a `destroy()` method that removes
 *          all event listeners.
 *
 * @example
 * ```ts
 * const { destroy } = bindPointer(myCanvas, {
 *   down: (p) => console.log('down', p.x, p.y),
 *   move: (p) => draw(p.x, p.y),
 *   up:   (p) => console.log('up'),
 * });
 * // Later:
 * destroy();
 * ```
 *
 * @since 0.1.0
 */
export function bindPointer(
  canvas: HTMLCanvasElement,
  handlers: PointerHandlers,
  readOnly: boolean = false
) {
  /** Tracks whether the pointer is currently pressed. */
  let isDown = false;

  // Prevent scrolling on touch devices
  canvas.style.touchAction = "none";

  /**
   * Convert a raw PointerEvent into a normalized {@link PointerPayload}.
   *
   * Coordinates are calculated relative to the canvas bounding rect so
   * they remain correct even if the canvas is positioned with CSS offsets.
   */
  function extractPointer(e: PointerEvent): PointerPayload {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      isDown: e.buttons > 0,
      pressure: e.pressure || 0,
      tiltX: e.tiltX || 0,
      tiltY: e.tiltY || 0,
      raw: e,
    };
  }

  function onPointerDown(e: PointerEvent) {
    if (readOnly) return;
    e.preventDefault();
    isDown = true;
    // Capture ensures move/up events continue even outside the element
    canvas.setPointerCapture(e.pointerId);
    const p = extractPointer(e);
    p.isDown = true;
    handlers.down(p);
  }

  function onPointerMove(e: PointerEvent) {
    if (readOnly || !isDown) return;
    e.preventDefault();
    const p = extractPointer(e);
    p.isDown = true;
    handlers.move(p);
  }

  function onPointerUp(e: PointerEvent) {
    if (readOnly || !isDown) return;
    e.preventDefault();
    isDown = false;
    const p = extractPointer(e);
    p.isDown = false;
    handlers.up(p);
  }

  /**
   * Handle `pointercancel` (e.g. browser interrupts the pointer sequence
   * due to a system gesture or the pointer leaving the window in some edge
   * cases). Treated identically to `pointerup`.
   */
  function onPointerCancel(e: PointerEvent) {
    if (readOnly || !isDown) return;
    isDown = false;
    const p = extractPointer(e);
    p.isDown = false;
    handlers.up(p);
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerCancel);

  return {
    /** Remove all bound pointer event listeners from the canvas. */
    destroy() {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
    },
  };
}
