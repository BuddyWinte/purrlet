/**
 * @module purrlet/tools/types
 *
 * Core type definitions for the purrlet canvas drawing tool system.
 *
 * Every drawing tool in purrlet implements the {@link Tool} interface,
 * which produces a stateful {@link ToolInstance} via a factory function.
 * The renderer feeds normalized pointer events ({@link Pointer}) into
 * the instance's `onDown`, `onMove`, and `onUp` hooks, along with a
 * {@link ToolContext} that exposes the underlying 2D canvas context
 * and the `<canvas>` DOM element.
 */

/**
 * Normalized pointer data passed to every tool on each event.
 *
 * Coordinates (`x`, `y`) are in **CSS-pixel space** (not physical
 * device pixels). The renderer scales them automatically so tools
 * never need to think about `devicePixelRatio`.
 *
 * @property x      - Horizontal position in CSS pixels.
 * @property y      - Vertical position in CSS pixels.
 * @property isDown - `true` while the primary pointer button is held.
 * @property pressure - Pen / touch pressure in `[0, 1]`.  Falls back to `0.5` for mice.
 * @property tiltX  - Pen tilt around the X-axis (radians, positive = top-edge tilted right).
 * @property tiltY  - Pen tilt around the Y-axis (radians, positive = top-edge tilted toward user).
 * @property raw    - The original browser `PointerEvent` for accessing modifiers (`shiftKey`, etc.).
 */
export type Pointer = {
  x: number;
  y: number;
  isDown: boolean;
  pressure: number;
  tiltX: number;
  tiltY: number;
  raw: PointerEvent;
};

/**
 * Readonly drawing context made available to every tool on each event.
 *
 * @property ctx    - The `CanvasRenderingContext2D` bound to the main drawing canvas.
 * @property canvas - The `<canvas>` HTML element (useful for coordinate mapping or DOM events).
 */
export type ToolContext = {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
};

/**
 * Stateful instance created by a {@link Tool.create} factory.
 *
 * The renderer calls these hooks in response to user pointer activity:
 * - **onDown** – fired once when the primary button is pressed.
 * - **onMove** – fired on every pointer move (even when the button is not pressed).
 * - **onUp**   – fired once when the primary button is released.
 * - **destroy** – optional cleanup hook called when the tool is deactivated.
 */
export interface ToolInstance {
  onDown(p: Pointer, ctx: ToolContext): void;
  onMove(p: Pointer, ctx: ToolContext): void;
  onUp(p: Pointer, ctx: ToolContext): void;
  destroy?(): void;
}

/**
 * Tool descriptor — the public-facing registration object for a drawing tool.
 *
 * Each tool ships as a singleton that satisfies this interface.  The
 * {@link ToolRegistry} stores tools keyed by `name` and calls
 * `create(config)` to obtain a fresh {@link ToolInstance} every time
 * the user activates the tool.
 *
 * @property name   - Unique string identifier (e.g. `"brush"`, `"eraser"`).
 * @property create - Factory that returns a new {@link ToolInstance}.
 *                    Receives an arbitrary config object specific to the tool.
 */
export interface Tool {
  name: string;
  create(config: any): ToolInstance;
}
