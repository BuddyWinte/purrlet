"use strict";

import type { PurrletConfig, Tool, ToolInstance, ToolMap, PurrletPointer } from "../types";
import { bindPointer } from "./pointer";

// import each tool
import { brushTool } from "../tools/brush";

export class Purrlet {
  private config: PurrletConfig;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private tools: ToolMap = {};
  private currentTool: ToolInstance | null = null;

  constructor(config: PurrletConfig) {
    this.config = config;
    this.canvas = config.canvas;
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.ctx = this.getContext(this.canvas);
    this.bindPointerEvents();

    this.registerTool(brushTool);
  }

  private bindPointerEvents() {
    bindPointer(this.canvas, {
      down: (p: PurrletPointer, e) => {
        this.currentTool?.onPointerDown?.(p as any, this.ctx);
      },

      move: (p: PurrletPointer, e) => {
        this.currentTool?.onPointerMove?.(p as any, this.ctx);
      },

      up: (p: PurrletPointer, e) => {
        this.currentTool?.onPointerUp?.(p as any, this.ctx);
      },
    });
  }

  registerTool(tool: Tool) {
    this.tools[tool.name] = tool;
  }

  unregisterTool(name: string) {
    if (this.tools[name]) {
      delete this.tools[name];
    }

    if (this.currentTool && (this.currentTool as any).name === name) {
      this.currentTool = null;
    }
  }

  setTool(name: string, config?: any) {
    const tool = this.tools[name];

    if (!tool) {
      throw new Error(`[Purrlet] Tool not found: ${name}`);
    }

    this.currentTool = tool.create(config ?? {});
  }

  getToolById(name: string) {
    return this.tools[name] ?? null;
  }

  listTools() {
    return Object.values(this.tools);
  }

  getTool() {
    return this.currentTool;
  }

  private getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("[Purrlet] 2D context not available");
    }

    return ctx;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}