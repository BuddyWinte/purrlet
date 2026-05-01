/**
 * Image upload orchestration for the Purrlet engine.
 *
 * This module coordinates the process of converting the canvas to a
 * `Blob`, applying optional transforms (`beforeUpload`), and routing
 * the upload to the correct destination. Three strategies are supported,
 * resolved in strict priority order:
 *
 * 1. **Custom handler** (`config.handler`) — fully user-controlled upload.
 * 2. **Proxy** (`config.proxy`) — generic multipart POST to a server.
 * 3. **Built-in provider** (`config.provider`) — ImgBB, Imgur, or Cloudinary.
 *
 * Progress, success, and error callbacks are invoked via the
 * {@link UploadConfig} callbacks **and** emitted through the event system
 * when used through the {@link Purrlet} class.
 *
 * @module core/upload
 * @since 0.1.0
 * @changed v0.2.0 — Added `uploadToProxy` as an exported utility;
 *  `beforeUpload` transform now supports async Blobs.
 */

"use strict";

import type { UploadConfig } from "./types";
import { uploadToImgbb } from "../providers/imgbb";
import { uploadToImgur } from "../providers/imgur";
import { uploadToCloudinary } from "../providers/cloudinary";

/**
 * Execute the full upload pipeline for the given canvas.
 *
 * 1. Converts the canvas to a PNG `Blob`.
 * 2. Applies the optional `beforeUpload` transform.
 * 3. Routes to the appropriate upload strategy.
 * 4. Fires success/error callbacks from the config.
 *
 * @param canvas     — The canvas element whose content to upload.
 * @param config     — Upload configuration (provider, proxy, or handler).
 * @param onProgress — Optional progress callback (0–100).
 * @returns The public URL of the uploaded image.
 * @throws `[Purrlet] Upload not configured` if `config` is falsy.
 * @throws Provider-specific errors for missing credentials or network failures.
 *
 * @example
 * ```ts
 * const url = await runUpload(canvas, {
 *   provider: 'imgbb',
 *   apiKey: 'KEY',
 *   onUploadProgress: (pct) => console.log(`${pct}%`),
 * });
 * ```
 *
 * @since 0.1.0
 */
export async function runUpload(
  canvas: HTMLCanvasElement,
  config: UploadConfig,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!config) {
    throw new Error("[Purrlet] Upload not configured");
  }

  // Create blob from canvas
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) return reject(new Error("[Purrlet] Failed to create blob"));
        resolve(b);
      },
      "image/png"
    );
  });

  // Apply beforeUpload transform (may be sync or async)
  let finalBlob = blob;
  if (config.beforeUpload) {
    finalBlob = await config.beforeUpload(blob);
  }

  try {
    let url: string;

    // Custom handler takes priority
    if (config.handler) {
      url = await config.handler(finalBlob, { canvas });
    } else if (config.proxy) {
      // Proxy upload
      url = await uploadToProxy(finalBlob, config.proxy, onProgress);
    } else {
      url = await runProvider(config, finalBlob, onProgress);
    }

    config.onUploadSuccess?.(url);
    return url;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    config.onUploadError?.(error);
    throw error;
  }
}

/**
 * Dispatch to the appropriate built-in provider based on `config.provider`.
 *
 * Each provider has its own credential requirements; this function
 * validates them before calling the provider-specific upload function.
 *
 * @param config     — Upload config with `provider` and credentials.
 * @param blob       — The PNG blob to upload.
 * @param onProgress — Optional progress callback.
 * @returns The public URL of the uploaded image.
 *
 * @since 0.1.0
 */
async function runProvider(
  config: UploadConfig,
  blob: Blob,
  onProgress?: (percent: number) => void
): Promise<string> {
  switch (config.provider) {
    case "imgbb":
      if (!config.apiKey) {
        throw new Error("[Purrlet] Missing apiKey for imgbb");
      }
      return uploadToImgbb(blob, config.apiKey, onProgress);

    case "imgur":
      if (!config.clientId && !config.apiKey) {
        throw new Error("[Purrlet] Missing clientId for imgur");
      }
      return uploadToImgur(blob, config.clientId || config.apiKey!, onProgress);

    case "cloudinary":
      if (!config.cloudName || !config.uploadPreset) {
        throw new Error(
          "[Purrlet] Missing cloudName or uploadPreset for cloudinary"
        );
      }
      return uploadToCloudinary(
        blob,
        config.cloudName,
        config.uploadPreset,
        onProgress
      );

    default:
      throw new Error(
        `[Purrlet] Unknown upload provider: ${config.provider}`
      );
  }
}

/**
 * Upload a blob to a generic proxy server via multipart/form-data POST.
 *
 * Uses `XMLHttpRequest` instead of `fetch` because `fetch` does not
 * yet support upload progress tracking across all browsers.
 *
 * The proxy is expected to accept a `file` field and respond with a
 * JSON body containing a `url` field: `{ "url": "https://…" }`.
 *
 * @param blob      — The file blob to upload.
 * @param proxyUrl  — The proxy endpoint URL.
 * @param onProgress — Optional callback receiving upload percentage (0–100).
 * @returns The `url` string from the proxy response.
 * @throws If the proxy returns a non-2xx status, invalid JSON, or missing `url`.
 *
 * @since 0.2.0
 */
export function uploadToProxy(
  blob: Blob,
  proxyUrl: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", blob, "purrlet.png");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", proxyUrl);
    // Track upload progress via XHR (fetch lacks this capability)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          if (json.url) {
            resolve(json.url);
          } else {
            reject(
              new Error(
                "[Purrlet] Proxy response missing 'url' field"
              )
            );
          }
        } catch {
          reject(new Error("[Purrlet] Invalid proxy response"));
        }
      } else {
        reject(
          new Error(`[Purrlet] Proxy upload failed with status ${xhr.status}`)
        );
      }
    };
    xhr.onerror = () =>
      reject(new Error("[Purrlet] Proxy upload failed"));
    xhr.send(form);
  });
}
