"use strict";

import * as packageJson from "../../package.json";

import type {
  PurrletConfig,
  Tool,
  ToolInstance,
  ToolMap,
  PurrletPointer,
  RegisteredTool,
  PurrletToolConfig,
} from "../types";

import { brushTool } from "../tools/brush";
import { eraserTool } from "../tools/eraser";
import { lineTool } from "../tools/line";
import { fillTool } from "../tools/fill";

import { bindPointer, type PointerHandlers } from "./pointer";
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
  private readonly config: PurrletConfig;
  private readonly canvas: HTMLCanvasElement | null;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly renderer: Renderer | null;

  private readonly tools: ToolMap = {};
  private readonly toolConfigs: Record<string, PurrletToolConfig> = {};

  private currentTool: ToolInstance | null = null;
  private currentToolName: string | null = null;

  private resizeObserver: ResizeObserver | null = null;
  private unbindPointer: (() => void) | null = null;
  private active = false;

  readonly version: string = packageJson.version;

  constructor(config: PurrletConfig) {
    this.config = config;

    const canvas = this.resolveCanvas(config.canvas);

    this.canvas = canvas;

    if (canvas === null) {
      this.ctx = null;
      this.renderer = null;
      return;
    }

    const ctx = this.getContext(canvas);

    this.ctx = ctx;

    if (ctx === null) {
      this.renderer = null;
      return;
    }

    this.renderer = new Renderer(
      ctx,
      new Document(),
      new History(),
    );

    this.active = true;

    this.registerBuiltInTools();
    this.renderer.resize();
    this.bindPointerEvents();
    this.observeResize();

    this.setTool(
      config.defaultTool ?? "brush",
    );

    if (typeof window !== "undefined") {
      window.addEventListener(
        "resize",
        this.resize,
      );
    }
  }

  private resolveCanvas(
    target: PurrletConfig["canvas"],
  ): HTMLCanvasElement | null {
    if (typeof document === "undefined") {
      console.warn(
        "[Purrlet] Cannot resolve a canvas outside of a browser environment.",
      );
      return null;
    }

    if (typeof target === "string") {
      let element: Element | null;

      try {
        element = document.querySelector(target);
      } catch {
        console.warn(
          `[Purrlet] Invalid canvas selector: "${target}".`,
        );

        return null;
      }

      if (element === null) {
        console.warn(
          `[Purrlet] No element found for canvas selector: "${target}".`,
        );

        return null;
      }

      if (!(element instanceof HTMLCanvasElement)) {
        console.warn(
          `[Purrlet] Selector "${target}" did not resolve to a <canvas> element.`,
        );

        return null;
      }

      return element;
    }

    if (!(target instanceof HTMLCanvasElement)) {
      console.warn(
        "[Purrlet] The provided canvas is not an HTMLCanvasElement.",
      );

      return null;
    }

    return target;
  }

  private getContext(
    canvas: HTMLCanvasElement,
  ): CanvasRenderingContext2D | null {
    const context = canvas.getContext("2d");

    if (context === null) {
      console.warn(
        "[Purrlet] 2D rendering context is not available.",
      );
    }

    return context;
  }

  private registerBuiltInTools(): void {
    this.registerTool(brushTool);
    this.registerTool(eraserTool);
    this.registerTool(lineTool);
    this.registerTool(fillTool);
  }

  private observeResize(): void {
    const canvas = this.canvas;

    if (
      canvas === null ||
      typeof ResizeObserver === "undefined"
    ) {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });

    this.resizeObserver.observe(canvas);
  }

  private bindPointerEvents(): void {
    const canvas = this.canvas;
    const renderer = this.renderer;

    if (
      canvas === null ||
      renderer === null
    ) {
      return;
    }

    const handlers: PointerHandlers = {
      down: (pointer: PurrletPointer) => {
        this.currentTool?.onPointerDown?.(
          pointer,
          renderer,
        );
      },

      move: (pointer: PurrletPointer) => {
        this.currentTool?.onPointerMove?.(
          pointer,
          renderer,
        );
      },

      up: (pointer: PurrletPointer) => {
        this.currentTool?.onPointerUp?.(
          pointer,
          renderer,
        );
      },

      cancel: (pointer: PurrletPointer) => {
        this.currentTool?.onPointerCancel?.(
          pointer,
          renderer,
        );
      },
    };

    this.unbindPointer = bindPointer(
      canvas,
      handlers,
    );
  }

  readonly resize = (): void => {
    if (!this.active) {
      return;
    }

    this.renderer?.resize();
  };

  undo(): void {
    if (!this.active) {
      return;
    }

    this.renderer?.undo();
  }

  redo(): void {
    if (!this.active) {
      return;
    }

    this.renderer?.redo();
  }

  registerTool(
    tool: Tool,
  ): void {
    if (
      !tool ||
      typeof tool.name !== "string" ||
      tool.name.length === 0 ||
      typeof tool.create !== "function"
    ) {
      console.warn(
        "[Purrlet] Cannot register an invalid tool.",
      );

      return;
    }

    this.tools[tool.name] = tool;
  }

  unregisterTool(
    name: string,
  ): void {
    const tool = this.tools[name];

    if (tool === undefined) {
      console.warn(
        `[Purrlet] Cannot unregister tool "${name}": tool is not registered.`,
      );

      return;
    }

    if (this.currentToolName === name) {
      const renderer = this.renderer;

      if (renderer !== null) {
        this.currentTool?.onDeactivate?.(
          renderer,
        );
      }

      this.currentTool = null;
      this.currentToolName = null;
    }

    delete this.tools[name];
    delete this.toolConfigs[name];
  }

  setTool(
    name: string,
    config: PurrletToolConfig = {},
  ): void {
    if (!this.active) {
      return;
    }

    const renderer = this.renderer;

    if (renderer === null) {
      return;
    }

    const tool = this.tools[name];

    if (tool === undefined) {
      console.warn(
        `[Purrlet] Tool "${name}" is not registered.`,
      );

      return;
    }

    let instance: ToolInstance;

    try {
      instance = tool.create(config);
    } catch (error: unknown) {
      console.warn(
        `[Purrlet] Failed to create tool "${name}".`,
        error,
      );

      return;
    }

    this.currentTool?.onDeactivate?.(
      renderer,
    );

    this.currentTool = instance;
    this.currentToolName = name;
    this.toolConfigs[name] = config;

    this.currentTool.onActivate?.(
      renderer,
    );
  }

  updateToolConfig(
    name: string,
    patch: PurrletToolConfig,
  ): void {
    if (!this.active) {
      return;
    }

    const tool = this.tools[name];

    if (tool === undefined) {
      console.warn(
        `[Purrlet] Cannot update configuration for unknown tool "${name}".`,
      );

      return;
    }

    const previousConfig =
      this.toolConfigs[name] ?? {};

    const nextConfig: PurrletToolConfig = {
      ...previousConfig,
      ...patch,
    };

    if (this.currentToolName !== name) {
      this.toolConfigs[name] = nextConfig;
      return;
    }

    const renderer = this.renderer;

    if (renderer === null) {
      return;
    }

    let instance: ToolInstance;

    try {
      instance = tool.create(nextConfig);
    } catch (error: unknown) {
      console.warn(
        `[Purrlet] Failed to update tool "${name}".`,
        error,
      );

      return;
    }

    this.currentTool?.onDeactivate?.(
      renderer,
    );

    this.toolConfigs[name] = nextConfig;
    this.currentTool = instance;

    this.currentTool.onActivate?.(
      renderer,
    );
  }

  getToolConfig(
    name: string,
  ): PurrletToolConfig | null {
    return this.toolConfigs[name] ?? null;
  }

  getToolById(
    name: string,
  ): RegisteredTool | null {
    return this.tools[name] ?? null;
  }

  listTools(): RegisteredTool[] {
    return Object.values(this.tools);
  }

  getTool(): ToolInstance | null {
    return this.currentTool;
  }

  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  isActive(): boolean {
    return this.active;
  }

  clear(): void {
    if (!this.active) {
      return;
    }

    this.renderer?.clear();
  }

  render(): void {
    if (!this.active) {
      return;
    }

    this.renderer?.redraw();
  }

  clearHistory(): void {
    if (!this.active) {
      return;
    }

    this.renderer?.clearHistory();
  }

  async toBlob(
    type = "image/png",
    quality?: number,
  ): Promise<Blob | null> {
    if (
      !this.active ||
      this.canvas === null
    ) {
      return null;
    }

    return canvasToBlob(
      this.canvas,
      type,
      quality,
    );
  }

  toDataURL(
    type = "image/png",
    quality?: number,
  ): string | null {
    if (
      !this.active ||
      this.canvas === null
    ) {
      return null;
    }

    return canvasToDataURL(
      this.canvas,
      type,
      quality,
    );
  }

  async export(
    options: Readonly<ExportOptions>,
  ): Promise<void> {
    if (
      !this.active ||
      this.canvas === null
    ) {
      return;
    }

    await exportCanvas(
      this.canvas,
      options,
    );
  }

  destroy(): void {
    if (!this.active) {
      return;
    }

    const renderer = this.renderer;

    if (renderer !== null) {
      this.currentTool?.onDeactivate?.(
        renderer,
      );
    }

    this.currentTool = null;
    this.currentToolName = null;

    this.unbindPointer?.();
    this.unbindPointer = null;

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (typeof window !== "undefined") {
      window.removeEventListener(
        "resize",
        this.resize,
      );
    }

    this.active = false;
  }
}
