/**
 * Canvas persistence backends for save/load/clear operations.
 *
 * Provides a pluggable {@link StorageBackend} interface with two
 * built-in implementations:
 *
 * - **IndexedDB** — stores the canvas as a `Blob` in an object store.
 *   Preferred for large canvases because it avoids the ~5 MB quota
 *   limit of `localStorage` and the overhead of base-64 encoding.
 *
 * - **localStorage** — stores the canvas as a `data:image/png;base64,…`
 *   data-URL string. Simpler API but subject to browser quota limits;
 *   suitable for small canvases only.
 *
 * Both backends serialize the canvas as PNG and restore it by drawing
 * an `Image` onto the context. Errors are forwarded to the optional
 * `onSaveError` callback in the {@link SaveConfig} and then re-thrown.
 *
 * @module core/storage
 * @since 0.1.0
 */

"use strict";

import type { SaveConfig } from "./types";

/**
 * Pluggable storage interface for canvas persistence.
 *
 * Implement this interface to add a custom backend (e.g. remote server,
 * FileSystem API, SQLite via OPFS).
 *
 * @since 0.1.0
 */
export interface StorageBackend {
  /**
   * Persist the current canvas content under the given key.
   * @param canvas — The canvas whose content to save.
   * @param key    — Storage key identifying this canvas.
   */
  save(canvas: HTMLCanvasElement, key: string): Promise<void>;

  /**
   * Load a previously saved canvas image and draw it onto the context.
   * If no saved state exists for the key the method should resolve
   * silently (no error, no draw).
   *
   * @param ctx    — The 2D context to draw onto.
   * @param canvas — The canvas element (used for dimensions).
   * @param key    — Storage key identifying the saved state.
   */
  load(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    key: string
  ): Promise<void>;

  /**
   * Remove the saved state associated with the given key.
   * @param key — Storage key to delete.
   */
  clear(key: string): Promise<void>;
}

/**
 * Factory: create a storage backend based on the provided config.
 *
 * @param config — Save configuration specifying the desired backend.
 * @returns A {@link StorageBackend} instance (IndexedDB or localStorage).
 *
 * @since 0.1.0
 */
export function createStorage(config: SaveConfig): StorageBackend {
  const backend = config.backend ?? "indexeddb";

  if (backend === "indexeddb") {
    return createIndexedDBStorage(config);
  }
  return createLocalStorageStorage(config);
}

// ---------------------------------------------------------------------------
// IndexedDB backend
// ---------------------------------------------------------------------------

/**
 * Create an IndexedDB-backed storage implementation.
 *
 * Uses a database named `"purrlet"` with a single object store
 * `"canvases"`. Each record has the shape `{ id, data, timestamp }`
 * where `data` is a PNG `Blob`.
 *
 * @param config — Save configuration (for `onSaveError` callback).
 * @since 0.1.0
 */
function createIndexedDBStorage(config: SaveConfig): StorageBackend {
  const DB_NAME = "purrlet";
  const STORE_NAME = "canvases";

  /**
   * Open (or create) the IndexedDB database.
   * The `onupgradeneeded` handler ensures the object store exists
   * on first access or after a version bump.
   */
  function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error("[Purrlet] Failed to open IndexedDB"));
    });
  }

  return {
    async save(canvas: HTMLCanvasElement, key: string): Promise<void> {
      try {
        // Convert canvas to a PNG Blob for efficient storage
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("[Purrlet] toBlob failed"))),
            "image/png"
          );
        });

        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put({ id: key, data: blob, timestamp: Date.now() });

        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(new Error("[Purrlet] Failed to save to IndexedDB"));
        });
        db.close();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        config.onSaveError?.(error);
        throw error;
      }
    },

    async load(
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      key: string
    ): Promise<void> {
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);

        const result = await new Promise<any>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () =>
            reject(new Error("[Purrlet] Failed to load from IndexedDB"));
        });
        db.close();

        if (!result) return; // No saved state — resolve silently

        // Draw the stored Blob as an Image onto the canvas
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            resolve();
          };
          img.onerror = () => reject(new Error("[Purrlet] Failed to load saved image"));
          img.src = URL.createObjectURL(result.data as Blob);
        });
        // Revoke the object URL immediately after the image is decoded
        URL.revokeObjectURL(img.src);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        config.onSaveError?.(error);
        throw error;
      }
    },

    async clear(key: string): Promise<void> {
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.delete(key);

        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () =>
            reject(new Error("[Purrlet] Failed to clear IndexedDB entry"));
        });
        db.close();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        config.onSaveError?.(error);
        throw error;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// localStorage backend
// ---------------------------------------------------------------------------

/**
 * Create a localStorage-backed storage implementation.
 *
 * Encodes the canvas as a base-64 PNG data-URL string. Note that
 * localStorage has a ~5 MB quota in most browsers; this backend
 * is only suitable for small canvases.
 *
 * @param config — Save configuration (for `onSaveError` callback).
 * @since 0.1.0
 */
function createLocalStorageStorage(config: SaveConfig): StorageBackend {
  return {
    async save(canvas: HTMLCanvasElement, key: string): Promise<void> {
      try {
        const dataURL = canvas.toDataURL("image/png");
        localStorage.setItem(key, dataURL);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        config.onSaveError?.(error);
        throw error;
      }
    },

    async load(
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      key: string
    ): Promise<void> {
      try {
        const dataURL = localStorage.getItem(key);
        if (!dataURL) return; // No saved state — resolve silently

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            resolve();
          };
          img.onerror = () =>
            reject(new Error("[Purrlet] Failed to load saved image"));
          img.src = dataURL;
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        config.onSaveError?.(error);
        throw error;
      }
    },

    async clear(key: string): Promise<void> {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        config.onSaveError?.(error);
        throw error;
      }
    },
  };
}
