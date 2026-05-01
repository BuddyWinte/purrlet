/**
 * @module purrlet/providers/imgbb
 *
 * Image upload provider for the **ImgBB** image-hosting service.
 *
 * Uploads a `Blob` (typically a PNG or JPEG exported from the canvas)
 * to ImgBB's public REST API via `XMLHttpRequest` (used instead of
 * `fetch` so the caller can subscribe to upload progress events).
 *
 * **API endpoint:** `POST https://api.imgbb.com/1/upload?key={apiKey}`
 *
 * **Request:**
 * - Content-Type: `multipart/form-data`
 * - Field: `image` — the raw file blob.
 *
 * **Response (JSON):**
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "url": "https://i.ibb.co/…/image.png",
 *     "display_url": "https://ibb.co/…/image",
 *     "delete_url": "https://ibb.co/…/image/delete_token"
 *   }
 * }
 * ```
 *
 * On success the function resolves with `data.url` (the direct image URL).
 * On failure it rejects with a descriptive `Error`.
 */

"use strict";

/**
 * Uploads a blob to ImgBB and returns the direct image URL.
 *
 * @param blob       - The image file to upload (PNG, JPEG, etc.).
 * @param apiKey     - ImgBB API key obtained from https://api.imgbb.com/.
 * @param onProgress - Optional callback invoked with upload percentage `[0, 100]`.
 * @returns A promise that resolves to the direct image URL string.
 * @throws {Error} If the upload fails or the response is not valid JSON.
 */
export function uploadToImgbb(
  blob: Blob,
  apiKey: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("image", blob);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.imgbb.com/1/upload?key=${apiKey}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (json.success) {
          resolve(json.data.url);
        } else {
          reject(new Error("[Purrlet] imgbb upload failed"));
        }
      } catch {
        reject(new Error("[Purrlet] imgbb upload failed: invalid response"));
      }
    };

    xhr.onerror = () =>
      reject(new Error("[Purrlet] imgbb upload failed"));

    xhr.send(form);
  });
}
