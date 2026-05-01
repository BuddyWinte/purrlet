import { clonePointer } from "./commands";
import type { JsonValue } from "./commands";
import type { Pointer } from "../tools";

type RendererTool = {
  instance: any;
  name: string;
  config: JsonValue;
  modifiesCanvas: boolean;
};

type RendererHooks = {
  onCommit?: (command: {
    tool: string;
    config: JsonValue;
    points: Pointer[];
  }) => void;
};

export function createRenderer(ctx: CanvasRenderingContext2D, history: any, hooks: RendererHooks = {}) {
  let toolInstance: any;
  let currentTool: RendererTool | null = null;
  let interaction: Pointer[] = [];

  return {
    setTool(tool: RendererTool) {
      toolInstance = tool.instance;
      currentTool = tool;
    },

    pointerHandlers() {
      return {
        down(p: any) {
          interaction = [clonePointer(p)];
          toolInstance?.onDown(p, { ctx });
        },

        move(p: any) {
          if (interaction.length > 0) {
            interaction.push(clonePointer(p));
          }

          toolInstance?.onMove(p, { ctx });
        },

        up(p: any) {
          if (interaction.length === 0) {
            interaction = [clonePointer(p)];
          } else {
            interaction.push(clonePointer(p));
          }

          toolInstance?.onUp(p, { ctx });

          if (currentTool && currentTool.modifiesCanvas !== false) {
            history.saveState();
            hooks.onCommit?.({
              tool: currentTool.name,
              config: currentTool.config,
              points: interaction,
            });
          }

          interaction = [];
        },
      };
    },
  };
}
