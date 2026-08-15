 /**
  * Purrlet
  * A modern, easy-to-use, lightweight, headless canvas drawing engine for the web.
  *
  * Please read the CONTRIBUTING.md file before you contrbute.
  */
"use strict";

import type {
  PurrletConfig,
  Tool,
  ToolInstance,
  ToolMap,
  PurrletPointer,
} from "../types";

// default tools
import { brushTool } from "../tools/brush";
import { eraserTool } from "../tools/eraser";
import { lineTool } from "../tools/line";

import { bindPointer } from "./pointer";
import { Renderer } from "./renderer";
import { Document } from "./document";
import { History } from "./history";
import {
  canvasToBlob,
  canvasToDataURL,
  exportCanvas,
  type ExportOptions,
} from "./export";

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
    this.ctx = this.getContext(this.canvas);

    const doc = new Document();
    const history = new History();
    this.renderer = new Renderer(this.ctx, doc, history);
    this.renderer.resize();

    this.bindPointerEvents();

    this.registerTool(brushTool);
    this.registerTool(eraserTool);
    this.registerTool(lineTool);

    if (config.defaultTool) {
      this.setTool(config.defaultTool);
    } else {
      this.setTool("brush");
    }

    window.addEventListener("resize", () => this.resize());
  }

  /**
   * The version of Purrlet being used.
   *
   * @readonly
   * @private
   */
  readonly version = "2.1";

  /**
   * Binds the pointer events to the canvas.
   *
   * @private
   * @returns void
   */
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

  /**
   * Resizes the canvas and renderer to the css size of the canvas. Ran automatically on screen resize.
   *
   * @returns void
   */
  resize() {
    this.renderer.resize();
  }

  /**
   * Undoes the last action.
   *
   * @returns void
   */
  undo() {
    this.renderer.undo();
  }

  /**
   * Redoes the last undone action.
   *
   * @returns void
   */
  redo() {
    this.renderer.redo();
  }

  /**
   * Registers a tool with the Purrlet instance.
   *
   * @param tool - The tool to register.
   * @returns void
   */
  registerTool(tool: Tool) {
    this.tools[tool.name] = tool;
  }

  /**
   * Unregisters a tool from the Purrlet instance.
   *
   * @param name - The name of the tool to unregister.
   * @returns void
   */
  unregisterTool(name: string) {
    delete this.tools[name];

    if (this.currentToolName === name) {
      this.currentTool?.onDeactivate?.(this.renderer);
      this.currentTool = null;
      this.currentToolName = null;
    }
  }

  /**
   * Sets the current tool to use.
   *
   * @param name - The name of the tool to set.
   * @param config - The configuration for the tool.
   * @returns void
   */
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

  /**
   * Updates the configuration for a tool.
   *
   * @param name - The name of the tool to update.
   * @param patch - The patch to apply to the tool's configuration.
   * @returns void
   */
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

  /**
   * Gets the configuration for a tool.
   *
   * @param name - The name of the tool to get the configuration for.
   * @returns The configuration for the tool, or null if not found.
   */
  getToolConfig(name: string) {
    return this.toolConfigs[name] ?? null;
  }

  /**
   * Gets the tool by its ID.
   *
   * @param name - The ID of the tool to get.
   * @returns The tool, or null if not found.
   */
  getToolById(name: string) {
    return this.tools[name] ?? null;
  }

  /**
   * Lists all registered tools.
   *
   * @returns An array of all registered tools.
   */
  listTools() {
    return Object.values(this.tools);
  }

  /**
   * Gets the current tool.
   *
   * @returns The current tool, or null if no tool is active.
   */
  getTool() {
    return this.currentTool;
  }

  /**
   * Clears the canvas.
   *
   * @returns void
   */
  clear() {
    this.renderer.clear();
  }

  /**
   * Renders the canvas.
   *
   * @returns void
   */
  render() {
    this.renderer.redraw();
  }

  /**
   * Clears the history of the canvas.
   *
   * @returns void
   */
  clearHistory() {
    this.renderer.clearHistory();
  }

  /**
   * Converts the canvas to a Blob.
   *
   * @param type - The MIME type of the Blob.
   * @param quality - The quality of the Blob.
   * @returns The Blob representing the canvas.
   */
  async toBlob(type = "image/png", quality?: number) {
    return canvasToBlob(this.canvas, type, quality);
  }

  /**
   * Converts the canvas to a Data URL.
   *
   * @param type - The MIME type of the Data URL.
   * @param quality - The quality of the Data URL.
   * @returns The Data URL representing the canvas.
   */
  toDataURL(type = "image/png", quality?: number) {
    return canvasToDataURL(this.canvas, type, quality);
  }

  /**
   * Exports the canvas to a file.
   *
   * @param options - The export options.
   * @returns A promise that resolves when the export is complete.
   */
  async export(options: ExportOptions) {
    return exportCanvas(this.canvas, options);
  }

  /**
   * Gets the 2D rendering context of the canvas.
   *
   * @param canvas - The canvas element to get the context from.
   * @returns The 2D rendering context of the canvas.
   */
  private getContext(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("[Purrlet] 2D context not available");
    }

    return ctx;
  }
}
