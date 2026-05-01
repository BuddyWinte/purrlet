/**
 * Tool lifecycle manager and rendering bridge.
 *
 * The renderer sits between the pointer input layer and the tool
 * implementations. It:
 *
 * - Instantiates and manages the currently active tool via a factory
 *   pattern (`toolFactory.create(config)`).
 * - Forwards normalized pointer events (`down` / `move` / `up`) to the
 *   active tool's corresponding lifecycle methods.
 * - Automatically saves a history snapshot after each completed stroke
 *   (`pointerup`).
 * - Emits `strokeStart` and `strokeEnd` events for external consumers.
 *
 * Tools conform to the {@link ToolInstance} interface defined in
 * `tools/types.ts`.
 *
 * @module core/renderer
 * @since 0.1.0
 * @changed v0.2.0 — Added `updateTool` for live property changes;
 *  renderer now tracks `toolFactory` to allow re-creation.
 */

"use strict";

import type { ToolInstance } from "../tools/types";

/**
 * Create a new renderer instance bound to a canvas context.
 *
 * @param ctx     — The 2D rendering context to draw on.
 * @param canvas  — The canvas element (passed to tool `onDown`/`onMove`/`onUp`).
 * @param history — History manager; a snapshot is saved after each stroke.
 * @param emitter — Event emitter for `strokeStart` / `strokeEnd` events.
 * @returns Renderer API with tool management and pointer handler generation.
 *
 * @since 0.1.0
 */
export function createRenderer(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  history: ReturnType<typeof import("./history").createHistory>,
  emitter: any
) {
  /** The currently active tool instance (or `null`). */
  let toolInstance: ToolInstance | null = null;
  /** Name of the currently active tool. */
  let currentToolName: string = "";
  /** Merged configuration passed to the current tool factory. */
  let currentToolConfig: any = {};
  /** Reference to the tool factory for re-creation on config changes. */
  let toolFactory: any = null;
  /** Whether a stroke is in progress (between down and up). */
  let isDrawing = false;

  return {
    /**
     * Set the active drawing tool.
     *
     * Destroys any previous tool instance, then creates a new one
     * via `factory.create(config)`.
     *
     * @param name    — Tool identifier (e.g. `"brush"`, `"eraser"`).
     * @param factory — Tool factory object with a `create(config)` method.
     * @param config  — Initial configuration forwarded to the factory.
     *
     * @since 0.1.0
     */
    setTool(name: string, factory: any, config: any = {}): void {
      toolInstance?.destroy?.();
      currentToolName = name;
      currentToolConfig = config;
      toolFactory = factory;
      toolInstance = factory.create(config);
    },

    /**
     * Update the active tool's configuration at runtime.
     *
     * Merges `partialConfig` into the existing config and re-creates
     * the tool instance so that changes take effect immediately.
     *
     * @param partialConfig — Partial config to merge (e.g. `{ color: '#ff0' }`).
     *
     * @since 0.2.0
     */
    updateTool(partialConfig: Record<string, any>): void {
      currentToolConfig = { ...currentToolConfig, ...partialConfig };
      if (toolFactory) {
        toolInstance?.destroy?.();
        toolInstance = toolFactory.create(currentToolConfig);
      }
    },

    /**
     * Generate pointer event handlers suitable for {@link bindPointer}.
     *
     * The `down` handler starts a stroke and emits `strokeStart`.
     * The `move` handler forwards coordinates to the active tool.
     * The `up` handler ends the stroke, saves history, and emits `strokeEnd`.
     *
     * @returns Object with `down`, `move`, and `up` callback functions.
     *
     * @since 0.1.0
     */
    pointerHandlers() {
      return {
        down(p: any) {
          isDrawing = true;
          toolInstance?.onDown(p, { ctx, canvas });
          emitter?.emit("strokeStart", p);
        },
        move(p: any) {
          if (!isDrawing) return;
          toolInstance?.onMove(p, { ctx, canvas });
        },
        up(p: any) {
          if (!isDrawing) return;
          isDrawing = false;
          toolInstance?.onUp(p, { ctx, canvas });
          // Persist canvas state for undo after every completed stroke
          history.saveState();
          emitter?.emit("strokeEnd", p);
        },
      };
    },

    /**
     * @returns The name of the currently active tool (e.g. `"brush"`).
     * @since 0.1.0
     */
    getToolName(): string {
      return currentToolName;
    },

    /**
     * @returns The full configuration object of the current tool.
     * @since 0.2.0
     */
    getToolConfig(): any {
      return currentToolConfig;
    },
  };
}
