"use strict";

import { createRenderer } from "./renderer";
import { bindPointer } from "./pointer";
import { createToolRegistry } from "../tools";
import type { Tool, ToolMap } from "../tools";
import type { PurrletConfig } from "./types";
import { createCommandRecorder, sanitizeConfig } from "./commands";
import { createHistory } from "./history";
import { createStorage } from "./storage";
import { runUpload } from "./upload";

export class Purrlet {
  private config: PurrletConfig;
  private renderer;
  private history;
  private storage?: ReturnType<typeof createStorage>;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tools: ToolMap;
  private commandRecorder;
  constructor(config: PurrletConfig) {
    this.config = this.normalizeConfig(config);
    this.canvas = this.config.canvas;
    this.ctx = this.getContext(this.canvas);
    this.tools = createToolRegistry(this.config.tools);
    this.commandRecorder = createCommandRecorder(this.config.save?.maxCommands);
    this.history = createHistory(this.canvas, this.ctx);
    this.renderer = createRenderer(this.ctx, this.history, {
      onCommit: (command) => {
        this.commandRecorder.record(command);
      },
    });
    this.initStorage();
    bindPointer(this.canvas, this.renderer.pointerHandlers());
    this.setTool(this.config.tool || "brush");
  }

  private normalizeConfig(config: PurrletConfig): PurrletConfig {
    return {
      debug: false,
      tool: "brush",
      tools: [],
      save: {
        enabled: false,
        key: "purrlet-canvas",
        strategy: "commands",
      },
      ...config,
    };
  }

  private getContext(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("[Purrlet] 2D context not available");
    }
    return ctx;
  }

  private initStorage() {
    if (!this.config.save?.enabled) return;
    this.storage = createStorage({
      key: this.config.save.key!,
      strategy: this.config.save.strategy,
    });
    void this.storage.load(this.ctx, this.canvas, {
      tools: this.tools,
      onCommandsLoaded: (snapshot) => {
        this.commandRecorder.replace(snapshot);
      },
    });
    if (this.config.debug) {
      console.log("[Purrlet] storage enabled");
    }
  }

  setTool(name: string, config: any = {}) {
    const tool = this.tools[name];

    if (!tool) {
      throw new Error(`[Purrlet] Unknown tool: ${name}`);
    }

    this.renderer.setTool({
      instance: tool.create(config),
      name,
      config: sanitizeConfig(config),
      modifiesCanvas: tool.modifiesCanvas !== false,
    });
  }

  registerTool(tool: Tool) {
    this.tools[tool.name] = tool;
  }

  undo() {
    this.history.undo();
  }

  redo() {
    this.history.redo();
  }

  save() {
    return this.storage?.save(this.canvas, {
      commands: this.commandRecorder.snapshot(),
    });
  }

  clearSave() {
    this.commandRecorder.clear();
    return this.storage?.clear();
  }

  upload() {
    return runUpload(this.canvas, this.config.upload);
  }
}
