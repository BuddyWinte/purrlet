/**
 * The Purrlet engine — main entry-point class.
 *
 * Orchestrates all subsystems (canvas setup, pointer input, history,
 * persistence, upload, layers, and tool management) behind a single
 * fluent API. Consumers instantiate `new Purrlet(config)` and then
 * interact with the public methods documented below.
 *
 * ## Architecture overview
 *
 * ```
 * Purrlet
 * ├── canvas / ctx / dpr    (DPR-aware canvas, see canvas.ts)
 * ├── emitter               (pub/sub, see eventEmitter.ts)
 * ├── history               (undo/redo, see history.ts)
 * ├── renderer              (tool bridge, see renderer.ts)
 * ├── pointerCleanup        (input binding, see pointer.ts)
 * ├── storage               (save/load, see storage.ts)
 * └── layers                (layer stack, see layers.ts)
 * ```
 *
 * @module core/Purrlet
 * @since 0.1.0
 * @changed v0.2.0 — Added layer API, `importImage`, `resize`,
 *  `setReadOnly`, `enableDrop`, and `snapshot`.
 */

"use strict";

import { createRenderer } from "./renderer";
import { bindPointer } from "./pointer";
import { tools } from "../tools";
import type {
  PurrletConfig,
  PurrletEvent,
  SaveConfig,
  UploadConfig,
  LayerInfo,
  PointerPayload,
} from "./types";
import { createHistory } from "./history";
import { createStorage } from "./storage";
import type { StorageBackend } from "./storage";
import { runUpload } from "./upload";
import { createEventEmitter } from "./eventEmitter";
import { setupCanvas } from "./canvas";
import { createLayerManager } from "./layers";

/**
 * The main Purrlet canvas engine.
 *
 * Provides a high-level API for drawing, undo/redo, persistence,
 * image upload, layer management, and more. Construct with a
 * {@link PurrletConfig} object and then call methods to interact
 * with the canvas.
 *
 * @example
 * ```ts
 * const p = new Purrlet({
 *   canvas: document.getElementById('myCanvas')!,
 *   tool: 'brush',
 *   color: '#ff0000',
 *   size: 8,
 *   maxHistory: 100,
 *   save: { enabled: true, key: 'my-drawing' },
 * });
 *
 * p.on('strokeEnd', (payload) => {
 *   console.log('Stroke finished at', payload.x, payload.y);
 * });
 *
 * p.updateTool({ color: '#0000ff' });
 * await p.save();
 * await p.destroy();
 * ```
 *
 * @since 0.1.0
 */
export class Purrlet {
  // ---------------------------------------------------------------------------
  // Public readonly
  // ---------------------------------------------------------------------------

  /** The underlying `<canvas>` element. */
  public readonly canvas: HTMLCanvasElement;

  /** The DPR-scaled 2D rendering context. */
  public readonly ctx: CanvasRenderingContext2D;

  // ---------------------------------------------------------------------------
  // Private subsystem references
  // ---------------------------------------------------------------------------

  /** Normalized configuration object. */
  private config: PurrletConfig;
  /** Tool lifecycle and pointer-forwarding bridge. */
  private renderer: ReturnType<typeof createRenderer>;
  /** Circular-buffer undo/redo manager. */
  private history: ReturnType<typeof createHistory>;
  /** Storage backend (IndexedDB or localStorage) when persistence is enabled. */
  private storage: StorageBackend | null;
  /** Pub/sub event emitter. */
  private emitter: ReturnType<typeof createEventEmitter>;
  /** Cleanup handle for the pointer event binding. */
  private pointerCleanup: { destroy: () => void } | null;
  /** When `true`, pointer events are silently ignored. */
  private readOnly: boolean;
  /** Current device pixel ratio (may change on multi-monitor setups). */
  private dpr: number;
  /** Guard flag to prevent double-destroy. */
  private _destroyed: boolean;
  /** Layer stack manager (created on init). */
  private layers: ReturnType<typeof createLayerManager> | null;

  /**
   * Create a new Purrlet engine instance.
   *
   * On construction the engine will:
   * 1. Normalize the config with defaults.
   * 2. Set up the canvas for HiDPI rendering.
   * 3. Create the history, renderer, and event emitter subsystems.
   * 4. Initialize persistence if `save.enabled` is `true` (async, fire-and-forget).
   * 5. Bind pointer events to the canvas.
   * 6. Create the layer manager with a default "Background" layer.
   * 7. Set the initial tool.
   *
   * @param config — Engine configuration. `canvas` is required.
   *
   * @since 0.1.0
   */
  constructor(config: PurrletConfig) {
    this._destroyed = false;
    this.readOnly = false;
    this.config = this.normalizeConfig(config);
    this.canvas = this.config.canvas;

    // Setup DPR-aware canvas
    const setup = setupCanvas(this.canvas);
    this.ctx = setup.ctx;
    this.dpr = setup.dpr;

    // Core systems
    this.emitter = createEventEmitter();
    this.history = createHistory(
      this.canvas,
      this.ctx,
      this.config.maxHistory ?? 50,
      this.emitter
    );
    this.renderer = createRenderer(
      this.ctx,
      this.canvas,
      this.history,
      this.emitter
    );

    // Storage
    this.storage = null;
    if (this.config.save?.enabled) {
      // Fire-and-forget initStorage (async in constructor)
      this.initStorage();
    }

    // Pointer binding
    this.pointerCleanup = bindPointer(
      this.canvas,
      this.renderer.pointerHandlers()
    );

    // Layers
    this.layers = createLayerManager(this.canvas, this.ctx, this.dpr);

    // Initial tool
    this.setTool(this.config.tool || "brush", {
      color: this.config.color,
      size: this.config.size,
      opacity: this.config.opacity,
    });
  }

  /**
   * Merge user-provided config with library defaults.
   *
   * @param config — Raw user config.
   * @returns Normalized config with all optional fields filled.
   * @private
   */
  private normalizeConfig(config: PurrletConfig): PurrletConfig {
    return {
      debug: false,
      tool: "brush",
      maxHistory: 50,
      clearToWhite: false,
      save: { enabled: false, key: "purrlet-canvas", backend: "indexeddb" },
      ...config,
    };
  }

  /**
   * Asynchronously initialize the storage backend and restore any
   * previously saved canvas state.
   *
   * @private
   */
  private async initStorage(): Promise<void> {
    this.storage = createStorage(this.config.save!);
    try {
      await this.storage.load(
        this.ctx,
        this.canvas,
        this.config.save!.key!
      );
      // Save initial state to history after load so undo works
      this.history.saveState();
    } catch (err) {
      if (this.config.debug)
        console.warn("[Purrlet] Failed to load saved state:", err);
    }
  }

  // ---------------------------------------------------------------------------
  // Event Emitter API
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to a Purrlet event.
   *
   * @param event — The event name (see {@link PurrletEvent}).
   * @param cb    — Callback invoked when the event fires.
   *
   * @example
   * ```ts
   * p.on('historyChange', ({ undo, redo }) => {
   *   undoBtn.disabled = undo === 0;
   *   redoBtn.disabled = redo === 0;
   * });
   * ```
   *
   * @since 0.1.0
   */
  on(event: PurrletEvent, cb: (...args: any[]) => void): void {
    this.emitter.on(event, cb);
  }

  /**
   * Unsubscribe a previously registered callback.
   *
   * @param event — The event name.
   * @param cb    — The exact function reference passed to {@link on}.
   *
   * @since 0.1.0
   */
  off(event: PurrletEvent, cb: (...args: any[]) => void): void {
    this.emitter.off(event, cb);
  }

  /**
   * Subscribe to an event for exactly one invocation, then auto-unsubscribe.
   *
   * @param event — The event name.
   * @param cb    — Callback invoked at most once.
   *
   * @since 0.1.0
   */
  once(event: PurrletEvent, cb: (...args: any[]) => void): void {
    this.emitter.once(event, cb);
  }

  // ---------------------------------------------------------------------------
  // Tool API
  // ---------------------------------------------------------------------------

  /**
   * Switch the active drawing tool.
   *
   * @param name   — Tool identifier (e.g. `"brush"`, `"eraser"`, `"line"`).
   * @param config — Optional initial config merged into the tool defaults.
   * @throws `[Purrlet] Unknown tool: <name>` if the tool is not registered.
   *
   * @example
   * ```ts
   * p.setTool('eraser', { size: 20 });
   * ```
   *
   * @since 0.1.0
   */
  setTool(name: string, config?: Record<string, any>): void {
    const tool = tools[name];
    if (!tool) throw new Error(`[Purrlet] Unknown tool: ${name}`);
    this.renderer.setTool(name, tool, config);
  }

  /**
   * Update the active tool's configuration at runtime (e.g. change color,
   * size, or opacity without switching tools).
   *
   * @param partialConfig — Partial config to merge into the current tool.
   *
   * @example
   * ```ts
   * p.updateTool({ color: '#ff0', size: 12 });
   * ```
   *
   * @since 0.2.0
   */
  updateTool(partialConfig: Record<string, any>): void {
    this.renderer.updateTool(partialConfig);
  }

  // ---------------------------------------------------------------------------
  // History API
  // ---------------------------------------------------------------------------

  /**
   * Undo the last canvas state change.
   *
   * @since 0.1.0
   */
  undo(): void {
    this.history.undo();
  }

  /**
   * Redo the most recently undone state change.
   *
   * @since 0.1.0
   */
  redo(): void {
    this.history.redo();
  }

  /**
   * Check whether undo is available.
   * @returns `true` if at least one undo step is possible.
   * @since 0.1.0
   */
  canUndo(): boolean {
    return this.history.canUndo();
  }

  /**
   * Check whether redo is available.
   * @returns `true` if at least one redo step is possible.
   * @since 0.1.0
   */
  canRedo(): boolean {
    return this.history.canRedo();
  }

  /**
   * @returns The number of available undo steps.
   * @since 0.1.0
   */
  getUndoCount(): number {
    return this.history.getUndoCount();
  }

  /**
   * @returns The number of available redo steps.
   * @since 0.1.0
   */
  getRedoCount(): number {
    return this.history.getRedoCount();
  }

  // ---------------------------------------------------------------------------
  // Canvas Actions
  // ---------------------------------------------------------------------------

  /**
   * Clear the entire canvas.
   *
   * If `clearToWhite` was set to `true` in the config, fills with solid
   * white; otherwise clears to transparent. The cleared state is pushed
   * to history so it can be undone.
   *
   * @since 0.1.0
   */
  clear(): void {
    if (this.config.clearToWhite) {
      this.ctx.save();
      // Reset transform to work in physical pixels
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    } else {
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }
    this.history.saveState();
  }

  /**
   * Capture the current canvas content as a PNG `Blob`.
   *
   * @returns A Promise resolving to the PNG blob.
   *
   * @example
   * ```ts
   * const blob = await p.snapshot();
   * const url = URL.createObjectURL(blob);
   * ```
   *
   * @since 0.2.0
   */
  async snapshot(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("[Purrlet] Failed to create snapshot")),
        "image/png"
      );
    });
  }

  /**
   * Export the canvas content in a specified image format.
   *
   * @param format  — Output format: `"png"`, `"jpeg"`, or `"webp"`.
   * @param quality — Quality hint for lossy formats (0–1); ignored for PNG.
   * @returns A Promise resolving to the image blob.
   *
   * @example
   * ```ts
   * const jpeg = await p.export('jpeg', 0.85);
   * ```
   *
   * @since 0.1.0
   */
  async export(
    format: "png" | "jpeg" | "webp",
    quality?: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("[Purrlet] Export failed")),
        `image/${format}`,
        quality
      );
    });
  }

  /**
   * Import an image onto the canvas, scaling it to fit while
   * maintaining aspect ratio.
   *
   * Accepts a URL string, a `File`, or a raw `Blob`. The image is
   * centered on the canvas and scaled down if larger than the canvas.
   * The result is pushed to history for undo.
   *
   * @param source — Image URL, File, or Blob to import.
   *
   * @example
   * ```ts
   * await p.importImage('https://example.com/photo.png');
   * await p.importImage(fileInput.files[0]);
   * ```
   *
   * @since 0.2.0
   */
  async importImage(source: File | Blob | string): Promise<void> {
    let img: HTMLImageElement;

    if (typeof source === "string") {
      img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
          reject(new Error("[Purrlet] Failed to load image"));
        img.src = source;
      });
    } else {
      const url = URL.createObjectURL(source);
      img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("[Purrlet] Failed to load image"));
        };
        img.src = url;
      });
    }

    // Scale to fit canvas while maintaining aspect ratio.
    // Scale ≤ 1 ensures the image is never upscaled; it is
    // centered if smaller than the canvas.
    const scale = Math.min(
      this.canvas.width / img.width,
      this.canvas.height / img.height,
      1
    );
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (this.canvas.width - w) / 2;
    const y = (this.canvas.height - h) / 2;

    // Reset transform to draw in physical-pixel space
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.drawImage(img, x, y, w, h);
    this.ctx.restore();
    this.history.saveState();
  }

  // ---------------------------------------------------------------------------
  // Resize
  // ---------------------------------------------------------------------------

  /**
   * Resize the canvas to new CSS dimensions.
   *
   * Preserves as much existing content as possible. Content that
   * exceeds the new dimensions will be clipped. The DPR scaling
   * is re-applied automatically.
   *
   * @param width  — New CSS width in pixels.
   * @param height — New CSS height in pixels.
   *
   * @since 0.2.0
   */
  resize(width: number, height: number): void {
    // Save current content before resizing
    const imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
    this.ctx.scale(dpr, dpr);

    // Restore content (may be clipped if smaller)
    this.ctx.putImageData(imageData, 0, 0);
    this.dpr = dpr;
  }

  // ---------------------------------------------------------------------------
  // Read Only
  // ---------------------------------------------------------------------------

  /**
   * Toggle read-only mode.
   *
   * When `true`, all pointer input on the canvas is ignored, making
   * the canvas view-only. The pointer binding is re-created with the
   * new `readOnly` flag.
   *
   * @param value — `true` to disable drawing, `false` to re-enable.
   *
   * @since 0.2.0
   */
  setReadOnly(value: boolean): void {
    this.readOnly = value;
    // Rebind pointer with new readOnly state
    if (this.pointerCleanup) {
      this.pointerCleanup.destroy();
    }
    this.pointerCleanup = bindPointer(
      this.canvas,
      this.renderer.pointerHandlers(),
      this.readOnly
    );
  }

  // ---------------------------------------------------------------------------
  // Drag & Drop
  // ---------------------------------------------------------------------------

  /**
   * Enable drag-and-drop image import on the canvas.
   *
   * When an image file is dropped onto the canvas it is imported
   * via {@link importImage}. Only files with MIME type `image/*` are
   * accepted.
   *
   * @returns A cleanup function that removes the drag/drop listeners.
   *          Call it when the feature is no longer needed.
   *
   * @example
   * ```ts
   * const cleanup = p.enableDrop();
   * // Later:
   * cleanup();
   * ```
   *
   * @since 0.2.0
   */
  enableDrop(): () => void {
    const prevent = (e: Event) => e.preventDefault();

    const handleDrop = (e: Event) => {
      e.preventDefault();
      const dragEvent = e as DragEvent;
      const file = dragEvent.dataTransfer?.files[0];
      if (file && file.type.startsWith("image/")) {
        void this.importImage(file);
      }
    };

    this.canvas.addEventListener("dragover", prevent);
    this.canvas.addEventListener("drop", handleDrop);

    return () => {
      this.canvas.removeEventListener("dragover", prevent);
      this.canvas.removeEventListener("drop", handleDrop);
    };
  }

  // ---------------------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------------------

  /**
   * Manually save the current canvas state to the configured storage backend.
   *
   * This is a no-op if persistence was not enabled in the config.
   * Errors are emitted via the `"saveError"` event and the
   * `onSaveError` callback.
   *
   * @since 0.1.0
   */
  async save(): Promise<void> {
    if (!this.storage) return;
    try {
      await this.storage.save(this.canvas, this.config.save!.key!);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error(String(err));
      this.emitter.emit("saveError", error);
      this.config.save?.onSaveError?.(error);
    }
  }

  /**
   * Manually load a previously saved canvas state from storage.
   *
   * After loading, the restored state is pushed to history so it
   * can be undone. No-op if persistence is not enabled.
   *
   * @since 0.1.0
   */
  async load(): Promise<void> {
    if (!this.storage) return;
    await this.storage.load(this.ctx, this.canvas, this.config.save!.key!);
    this.history.saveState();
  }

  // ---------------------------------------------------------------------------
  // Upload
  // ---------------------------------------------------------------------------

  /**
   * Upload the current canvas content using the configured upload strategy.
   *
   * Progress is reported via the `"uploadProgress"` event and the
   * `onUploadProgress` callback. Success and error are handled
   * similarly.
   *
   * @returns The public URL of the uploaded image.
   * @throws If upload is not configured or the upload fails.
   *
   * @example
   * ```ts
   * p.on('uploadProgress', (pct) => progressBar.value = pct);
   * const url = await p.upload();
   * console.log('Uploaded to', url);
   * ```
   *
   * @since 0.1.0
   */
  async upload(): Promise<string> {
    return runUpload(this.canvas, this.config.upload!, (percent) => {
      this.emitter.emit("uploadProgress", percent);
      this.config.upload?.onUploadProgress?.(percent);
    });
  }

  // ---------------------------------------------------------------------------
  // Layer API
  // ---------------------------------------------------------------------------

  /**
   * Add a new layer to the stack and make it the active layer.
   *
   * @param name — Optional display name (auto-generated if omitted).
   * @returns The ID of the newly created layer.
   *
   * @example
   * ```ts
   * const id = p.addLayer('Sketch');
   * ```
   *
   * @since 0.2.0
   */
  addLayer(name?: string): string {
    return this.layers!.addLayer(name);
  }

  /**
   * Set the active (drawing target) layer by ID.
   *
   * @param layerId — The layer to activate.
   * @throws `[Purrlet] Layer not found: <id>` if the ID does not exist.
   *
   * @since 0.2.0
   */
  setActiveLayer(layerId: string): void {
    this.layers!.setActiveLayer(layerId);
  }

  /**
   * Retrieve layer metadata by ID.
   *
   * @param layerId — The layer to look up.
   * @returns The {@link LayerInfo} object, or `undefined` if not found.
   *
   * @since 0.2.0
   */
  getLayer(layerId: string): LayerInfo | undefined {
    return this.layers!.getLayer(layerId);
  }

  /**
   * Remove a layer from the stack.
   *
   * Cannot remove the last remaining layer.
   *
   * @param layerId — The layer to remove.
   * @throws `[Purrlet] Cannot remove the last layer`.
   *
   * @since 0.2.0
   */
  removeLayer(layerId: string): void {
    this.layers!.removeLayer(layerId);
  }

  /**
   * Flatten (composite) all visible layers onto the base canvas.
   *
   * Each layer is drawn with its configured opacity and blend mode.
   * Hidden layers are skipped.
   *
   * @since 0.2.0
   */
  flattenLayers(): void {
    this.layers!.flattenLayers();
  }

  // ---------------------------------------------------------------------------
  // Destroy
  // ---------------------------------------------------------------------------

  /**
   * Tear down the engine and release all resources.
   *
   * After calling `destroy()`:
   * - All pointer event listeners are removed.
   * - All event subscribers are cleared.
   * - The history buffer is wiped.
   * - All layer DOM elements are removed.
   * - Internal references are nulled to aid GC.
   *
   * The method is idempotent — calling it multiple times is safe.
   *
   * @since 0.1.0
   */
  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this.pointerCleanup?.destroy();
    this.emitter.removeAllListeners();
    this.history.clear();
    this.layers?.destroy();
    this.storage = null;
    this.layers = null;
    this.renderer = null as any;
  }
}
