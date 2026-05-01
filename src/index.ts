/*!
 * Purrlet v1.0.1
 *
 * A lightweight headless drawbox-style canvas engine for indie sites and creative side projects. simple, fast, flexible.
 * meow
 *
 * Created by BuddyWinte and contributors
 * https://github.com/BuddyWinte/Purrlet
 *
 * SPDX-License-Identifier: MIT
 */

export { Purrlet } from "./core/Purrlet";
export {
  brushTool,
  createToolRegistry,
  defineTool,
  eraserTool,
  eyedropperTool,
  fillTool,
  lineTool,
} from "./tools";
export type {
  Pointer,
  Tool,
  ToolContext,
  ToolInstance,
  ToolMap,
} from "./tools";
