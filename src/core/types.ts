/**
 * Core type definitions for the Purrlet canvas engine.
 *
 * This module is the single source of truth for all configuration objects,
 * event unions, data structures, and payload types used throughout the
 * library. All types are re-exported from the main entry point so
 * consumers can import them directly from `"purrlet"`.
 *
 * @module core/types
 * @since 0.1.0
 * @changed v0.2.0 — Added {@link LayerInfo}, {@link PointerPayload};
 *  expanded {@link SaveConfig} and {@link UploadConfig} backends.
 */

"use strict";

/**
 * Context object passed to custom upload handlers.
 *
 * Provides access to the live canvas element so that custom upload
 * logic can read pixel data, overlay UI, or transform the image
 * before sending it to a remote service.
 *
 * @since 0.1.0
 */
export type UploadContext = {
  /** The canvas element being uploaded */
  canvas: HTMLCanvasElement;
};

/**
 * Configuration for automatic canvas persistence.
 *
 * When `enabled` is `true`, Purrlet will attempt to load a previously
 * saved canvas image on initialization and persist the current state
 * on every {@link Purrlet.save} call.
 *
 * @example
 * ```ts
 * const p = new Purrlet({
 *   canvas: el,
 *   save: { enabled: true, key: 'my-drawing', backend: 'indexeddb' },
 * });
 * ```
 *
 * @since 0.1.0
 */
export type SaveConfig = {
  /** Whether automatic persistence is active (default `false`) */
  enabled?: boolean;
  /** Storage key used to identify this canvas (default `"purrlet-canvas"`) */
  key?: string;
  /**
   * Storage backend to use.
   * - `"indexeddb"` — preferred for large canvases (stores as Blob).
   * - `"localstorage"` — fallback; encodes as base-64 data-URL (size-limited).
   * @default "indexeddb"
   */
  backend?: "indexeddb" | "localstorage";
  /** Callback invoked when a save/load operation fails */
  onSaveError?: (err: Error) => void;
};

/**
 * Configuration for image upload providers.
 *
 * Supports three built-in providers (ImgBB, Imgur, Cloudinary), a
 * generic proxy endpoint, or a fully custom handler function. Only
 * **one** upload strategy should be configured at a time; priority
 * order is: `handler` → `proxy` → `provider`.
 *
 * @example
 * ```ts
 * upload: {
 *   provider: 'imgbb',
 *   apiKey: 'YOUR_KEY',
 *   onUploadSuccess: (url) => console.log(url),
 * }
 * ```
 *
 * @since 0.1.0
 */
export type UploadConfig = {
  /**
   * Built-in upload provider name.
   * Each provider requires specific credential fields (see below).
   */
  provider?: "imgbb" | "imgur" | "cloudinary";
  /**
   * Fully custom upload handler. Receives the canvas blob and context,
   * and must return the public URL of the uploaded image.
   *
   * When set, this takes priority over `provider` and `proxy`.
   */
  handler?: (blob: Blob, ctx: UploadContext) => Promise<string>;
  /**
   * URL of a proxy server that accepts multipart `POST` with a `file`
   * field. The proxy must respond with `{ url: string }`.
   *
   * When set, this takes priority over `provider`.
   */
  proxy?: string;
  /** API key for ImgBB */
  apiKey?: string;
  /** Client ID for Imgur (also accepts `apiKey` as an alias) */
  clientId?: string;
  /** Cloud name for Cloudinary */
  cloudName?: string;
  /** Unsigned upload preset for Cloudinary */
  uploadPreset?: string;
  /**
   * Transform applied to the blob before uploading.
   * Useful for compression, format conversion, or metadata stripping.
   */
  beforeUpload?: (blob: Blob) => Promise<Blob> | Blob;
  /** Progress callback: receives a percentage (0–100) */
  onUploadProgress?: (percent: number) => void;
  /** Success callback: receives the public URL */
  onUploadSuccess?: (url: string) => void;
  /** Error callback: receives the error that caused the failure */
  onUploadError?: (err: Error) => void;
};

/**
 * Union of all event names emitted by the Purrlet engine.
 *
 * Subscribe via {@link Purrlet.on}. Each event carries specific
 * payload types documented below:
 *
 * | Event            | Payload                              |
 * |------------------|--------------------------------------|
 * | `strokeStart`    | {@link PointerPayload}               |
 * | `strokeEnd`      | {@link PointerPayload}               |
 * | `historyChange`  | `{ undo: number, redo: number }`     |
 * | `uploadProgress` | `number` (percent 0–100)             |
 * | `uploadSuccess`  | `string` (public URL)                |
 * | `uploadError`    | `Error`                              |
 * | `saveError`      | `Error`                              |
 *
 * @since 0.1.0
 */
export type PurrletEvent =
  | "strokeStart"
  | "strokeEnd"
  | "historyChange"
  | "uploadProgress"
  | "uploadSuccess"
  | "uploadError"
  | "saveError";

/**
 * Metadata and rendering context for a single canvas layer.
 *
 * Each layer owns an off-screen `<canvas>` element that is visually
 * stacked on top of the base canvas. The `opacity`, `visible`, and
 * `blendMode` fields control how the layer composites onto the base.
 *
 * @since 0.2.0
 */
export type LayerInfo = {
  /** Unique layer identifier (e.g. `"layer-0"`) */
  id: string;
  /** Human-readable layer name */
  name: string;
  /** Off-screen canvas element for this layer */
  canvas: HTMLCanvasElement;
  /** 2D rendering context for the layer's canvas */
  ctx: CanvasRenderingContext2D;
  /** Layer opacity from 0 (transparent) to 1 (opaque) */
  opacity: number;
  /** Whether the layer is rendered during compositing */
  visible: boolean;
  /** Canvas globalCompositeOperation used when flattening */
  blendMode: GlobalCompositeOperation;
};

/**
 * Master configuration for the Purrlet engine.
 *
 * Pass an object conforming to this type when constructing a new
 * {@link Purrlet} instance. All fields except `canvas` are optional
 * and carry sensible defaults.
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
 * ```
 *
 * @since 0.1.0
 */
export type PurrletConfig = {
  /** The target `<canvas>` element. Required. */
  canvas: HTMLCanvasElement;
  /** Enable verbose console warnings for debugging */
  debug?: boolean;
  /** Initial active tool name (default `"brush"`) */
  tool?: string;
  /** Initial stroke color as a CSS color string */
  color?: string;
  /** Initial stroke size in CSS pixels */
  size?: number;
  /** Initial stroke opacity from 0 to 1 */
  opacity?: number;
  /** Maximum number of undo/redo states kept in memory (default `50`) */
  maxHistory?: number;
  /**
   * When `true`, calling {@link Purrlet.clear} fills with white instead
   * of transparent.
   * @default false
   */
  clearToWhite?: boolean;
  /** Persistence configuration (auto-save / restore) */
  save?: SaveConfig;
  /** Upload configuration (built-in providers or custom handler) */
  upload?: UploadConfig;
  /**
   * Color-picker callback. Invoked when the active tool picks a color
   * from the canvas (e.g. eyedropper).
   */
  onColorPick?: (hex: string) => void;
};

/**
 * Normalized pointer event payload delivered to tool instances.
 *
 * Coordinates are in CSS pixels relative to the canvas element origin
 * (top-left). The `pressure` and `tilt` fields come directly from the
 * Pointer Events API and default to `0` on devices that don't support
 * them.
 *
 * @since 0.2.0
 */
export type PointerPayload = {
  /** Horizontal position in CSS pixels */
  x: number;
  /** Vertical position in CSS pixels */
  y: number;
  /** Whether at least one pointer button is pressed */
  isDown: boolean;
  /** Pointer pressure (0–1); `0` for unsupported devices */
  pressure: number;
  /** Tilt along the X-axis in degrees (–90 to 90) */
  tiltX: number;
  /** Tilt along the Y-axis in degrees (–90 to 90) */
  tiltY: number;
  /** The original browser PointerEvent for advanced use */
  raw: PointerEvent;
};
