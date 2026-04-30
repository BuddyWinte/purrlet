import { brushTool } from "./brush";
import { lineTool } from "./line";
import { eraserTool } from "./eraser";

export const tools: Record<string, any> = {
  brush: brushTool,
  line: lineTool,
  eraser: eraserTool,
};