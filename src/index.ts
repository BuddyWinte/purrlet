/*!
 * Purrlet v0.2.0
 *
 * A lightweight headless drawbox-style canvas engine for indie sites and creative side projects. simple, fast, flexible.
 * meow
 *
 * Created by BuddyWinte and contributors
 * https://github.com/BuddyWinte/Purrlet
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * Purrlet — Main public API entry point.
 *
 * This module re-exports the {@link Purrlet} class and all consumer-facing
 * types from the core modules. Everything a consumer needs can be imported
 * directly from `"purrlet"`:
 *
 * ```ts
 * import { Purrlet, PurrletConfig, PurrletEvent } from 'purrlet';
 * ```
 *
 * The internal module structure is organized as follows:
 *
 * - `core/types`       — Shared type definitions (config, events, payloads).
 * - `core/canvas`      — HiDPI canvas initialization.
 * - `core/pointer`     — Pointer event normalization and binding.
 * - `core/eventEmitter`— Lightweight pub/sub event system.
 * - `core/history`     — Circular-buffer undo/redo manager.
 * - `core/renderer`    — Tool lifecycle and pointer forwarding.
 * - `core/storage`     — Pluggable save/load backends (IndexedDB, localStorage).
 * - `core/upload`      — Image upload orchestration (providers, proxy, custom).
 * - `core/layers`      — Multi-layer canvas stack.
 * - `core/Purrlet`     — Main orchestrator class.
 * - `tools/`           — Built-in drawing tool implementations.
 * - `providers/`       — External upload provider integrations.
 *
 * @module purrlet
 * @since 0.1.0
 */

export { Purrlet } from "./core/Purrlet";
export type {
  PurrletConfig,
  PurrletEvent,
  UploadConfig,
  SaveConfig,
  UploadContext,
  LayerInfo,
  PointerPayload,
} from "./core/types";
export type { LayerInfo as PurrletLayer } from "./core/types";
export type { Tool as PurrletTool } from "./tools/types";
