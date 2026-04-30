"use strict";

import { createRenderer } from "./renderer";
import { bindPointer } from "./pointer";
import { tools } from "../tools";
import type { PurrletConfig } from "./types";
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
  constructor(config: PurrletConfig) {
    this.config = this.normalizeConfig(config);
    this.canvas = this.config.canvas;
    this.ctx = this.getContext(this.canvas);
    this.history = createHistory(this.canvas, this.ctx);
    this.renderer = createRenderer(this.ctx, this.history);
    this.initStorage();
    bindPointer(this.canvas, this.renderer.pointerHandlers());
    this.setTool(this.config.tool || "brush");
  }

  private normalizeConfig(config: PurrletConfig): PurrletConfig {
    return {
      debug: false,
      tool: "brush",
      save: {
        enabled: false,
        key: "purrlet-canvas",
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
    this.storage = createStorage(this.config.save.key!);
    this.storage.load(this.ctx, this.canvas);
    if (this.config.debug) {
      console.log("[Purrlet] storage enabled");
    }
  }

  setTool(name: string, config: any = {}) {
    const tool = tools[name];

    if (!tool) {
      throw new Error(`[Purrlet] Unknown tool: ${name}`);
    }

    this.renderer.setTool(tool.create(config));
  }

  undo() {
    this.history.undo();
  }

  redo() {
    this.history.redo();
  }

  save() {
    this.storage?.save(this.canvas);
  }

  upload() {
    runUpload(this.canvas, this.config.upload)
  }
}