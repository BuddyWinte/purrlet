// TOOL_IMPORTS_START
import { brushTool } from "./brush";
import { eraserTool } from "./eraser";
import { eyedropperTool } from "./eyedropper";
import { fillTool } from "./fill";
import { lineTool } from "./line";
// TOOL_IMPORTS_END
import { defineTool } from "./defineTool";
import type { Tool, ToolMap } from "./types";

export const builtInTools: ToolMap = {
  // TOOL_REGISTRY_START
  brush: brushTool,
  eraser: eraserTool,
  eyedropper: eyedropperTool,
  fill: fillTool,
  line: lineTool,
  // TOOL_REGISTRY_END
};

export function createToolRegistry(customTools: Tool[] = []): ToolMap {
  const registry: ToolMap = { ...builtInTools };

  for (const tool of customTools) {
    registry[tool.name] = tool;
  }

  return registry;
}

export { defineTool };
export {
  // TOOL_EXPORTS_START
  brushTool,
  eraserTool,
  eyedropperTool,
  fillTool,
  lineTool,
  // TOOL_EXPORTS_END
};
export type { Tool, ToolContext, ToolInstance, ToolMap, Pointer } from "./types";
