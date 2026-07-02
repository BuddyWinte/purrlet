"use strict";

import type {
  PurrletConfig,
  Tool,
  ToolInstance,
  ToolMap,
  PurrletPointer,
} from "../types";

import { bindPointer } from "./pointer";
import { brushTool } from "../tools/brush";
import { Renderer } from "./renderer";
import { eraserTool } from "../tools/eraser";
import { Document } from "./document";

export class Purrlet {
  private config: PurrletConfig;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: Renderer;
  private tools: ToolMap = {};
  private currentTool: ToolInstance | null = null;
  private currentToolName: string | null = null;
  private toolConfigs: Record<string, any> = {};

  constructor(config: PurrletConfig) {
    this.config = config;
    this.canvas = config.canvas;

    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * devicePixelRatio;
    this.canvas.height = rect.height * devicePixelRatio;

    this.ctx = this.getContext(this.canvas);
    this.ctx.scale(devicePixelRatio, devicePixelRatio);

    const doc = new Document();
    this.renderer = new Renderer(this.ctx, doc);


    this.bindPointerEvents();

    this.registerTool(brushTool);
    this.registerTool(eraserTool);

    if (config.defaultTool) {
      this.setTool(config.defaultTool);
    } else {
      this.setTool("brush");
    }
  }

  private bindPointerEvents() {
    bindPointer(this.canvas, {
      down: (p: PurrletPointer) => {
        this.currentTool?.onPointerDown?.(p, this.renderer);
      },

      move: (p: PurrletPointer) => {
        this.currentTool?.onPointerMove?.(p, this.renderer);
      },

      up: (p: PurrletPointer) => {
        this.currentTool?.onPointerUp?.(p, this.renderer);
      },
    });
  }

  registerTool(tool: Tool) {
    this.tools[tool.name] = tool;
  }

  unregisterTool(name: string) {
    delete this.tools[name];

    if (this.currentToolName === name) {
      this.currentTool?.onDeactivate?.(this.renderer);
      this.currentTool = null;
      this.currentToolName = null;
    }
  }

  setTool(name: string, config: any = {}) {
    const tool = this.tools[name];

    if (!tool) {
      throw new Error(`[Purrlet] Tool not found: ${name}`);
    }

    this.currentTool?.onDeactivate?.(this.renderer);

    this.currentToolName = name;
    this.toolConfigs[name] = config;

    this.currentTool = tool.create(config);

    this.currentTool.onActivate?.(this.renderer);
  }

  updateToolConfig(name: string, patch: any) {
    const tool = this.tools[name];

    if (!tool) return;

    this.toolConfigs[name] = {
      ...(this.toolConfigs[name] ?? {}),
      ...patch,
    };

    if (this.currentToolName !== name) return;

    this.currentTool?.onDeactivate?.(this.renderer);

    this.currentTool = tool.create(this.toolConfigs[name]);

    this.currentTool.onActivate?.(this.renderer);
  }

  getToolConfig(name: string) {
    return this.toolConfigs[name] ?? null;
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

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private getContext(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("[Purrlet] 2D context not available");
    }

    return ctx;
  }
}