/**
 * @module purrlet/providers/imgur
 *
 * Image upload provider for the **Imgur** image-hosting service.
 *
 * Uploads a `Blob` to Imgur's v3 REST API via `XMLHttpRequest` to
 * support upload progress tracking.
 *
 * **API endpoint:** `POST https://api.imgur.com/3/image`
 *
 * **Headers:**
 * - `Authorization: Client-ID {clientId}`
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
 *     "id": "abc123",
 *     "link": "https://i.imgur.com/abc123.png",
 *     "deletehash": "xyz789"
 *   }
 * }
 * ```
 *
 * On success the function resolves with `data.link` (the direct image URL).
 * On failure it rejects with a descriptive `Error`.
 */

"use strict";

/**
 * Uploads a blob to Imgur and returns the direct image URL.
 *
 * @param blob       - The image file to upload (PNG, JPEG, etc.).
 * @param clientId   - Imgur application client ID registered at https://api.imgur.com/oauth2/addclient.
 * @param onProgress - Optional callback invoked with upload percentage `[0, 100]`.
 * @returns A promise that resolves to the direct image URL string.
 * @throws {Error} If the upload fails or the response is not valid JSON.
 */
export function uploadToImgur(
  blob: Blob,
  clientId: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("image", blob);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.imgur.com/3/image");
    xhr.setRequestHeader("Authorization", `Client-ID ${clientId}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (json.success) {
          resolve(json.data.link);
        } else {
          reject(new Error("[Purrlet] imgur upload failed"));
        }
      } catch {
        reject(new Error("[Purrlet] imgur upload failed: invalid response"));
      }
    };

    xhr.onerror = () =>
      reject(new Error("[Purrlet] imgur upload failed"));

    xhr.send(form);
  });
}
