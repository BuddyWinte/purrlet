import type { Tool } from "./types";

export function defineTool<TConfig>(tool: Tool<TConfig>): Tool<TConfig> {
  return tool;
}
