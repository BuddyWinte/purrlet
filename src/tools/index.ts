/**
 * @module purrlet/tools
 *
 * Tool registry — the single entry-point for all built-in drawing tools.
 *
 * Imports every built-in tool singleton and re-exports them as a flat
 * `Record<string, Tool>` keyed by tool name.  The renderer (or consumer
 * code) can look up tools by name:
 *
 * ```ts
 * import { tools } from "purrlet/tools";
 * const brush = tools["brush"].create({ color: "red", size: 8 });
 * ```
 *
 * **Included tools (v0.2.0):**
 *
 * | Name        | Description                                    | Config                      |
 * |-------------|------------------------------------------------|-----------------------------|
 * | `brush`     | Freehand stroke                                | `color`, `size`, `opacity`  |
 * | `line`      | Straight line with live preview                | `color`, `size`             |
 * | `eraser`    | Pixel eraser (destination-out)                 | `size`                      |
 * | `fill`      | Scanline flood fill                            | `color`, `tolerance`        |
 * | `rect`      | Rectangle / square (Shift to constrain)        | `color`, `size`, `fill`     |
 * | `ellipse`   | Ellipse / circle (Shift to constrain)          | `color`, `size`, `fill`     |
 * | `text`      | Multi-line text via overlay textarea           | `color`, `font`, `size`     |
 * | `eyedropper`| Color-picker (samples pixel, emits event)      | *(none)*                    |
 * | `spray`     | Spray-can / airbrush                           | `color`, `size`, `density`  |
 * | `select`    | Marquee rectangle selection                    | *(none)*                    |
 */

import type { Tool } from "./types";
import { brushTool } from "./brush";
import { lineTool } from "./line";
import { eraserTool } from "./eraser";
import { fillTool } from "./fill";
import { rectTool } from "./rect";
import { ellipseTool } from "./ellipse";
import { textTool } from "./text";
import { eyedropperTool } from "./eyedropper";
import { sprayTool } from "./spray";
import { selectTool } from "./select";

/**
 * Registry of all built-in drawing tools, keyed by unique name string.
 *
 * Access a tool via `tools["name"]`, then call `.create(config)` to get
 * a stateful {@link import("./types").ToolInstance}.
 */
export const tools: Record<string, Tool> = {
  brush: brushTool,
  line: lineTool,
  eraser: eraserTool,
  fill: fillTool,
  rect: rectTool,
  ellipse: ellipseTool,
  text: textTool,
  eyedropper: eyedropperTool,
  spray: sprayTool,
  select: selectTool,
};
