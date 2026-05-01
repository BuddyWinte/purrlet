/**
 * @module purrlet/providers/cloudinary
 *
 * Image upload provider for the **Cloudinary** media management service.
 *
 * Uploads a `Blob` to Cloudinary's REST upload API via `XMLHttpRequest`
 * to support upload progress tracking.  Uses an **unsigned upload preset**
 * so no server-side signing is required.
 *
 * **API endpoint:** `POST https://api.cloudinary.com/v1_1/{cloudName}/image/upload`
 *
 * **Request:**
 * - Content-Type: `multipart/form-data`
 * - Field: `file` — the raw file blob.
 * - Field: `upload_preset` — the unsigned upload preset name.
 *
 * **Response (JSON):**
 * ```json
 * {
 *   "public_id": "sample",
 *   "version": 1312461204,
 *   "secure_url": "https://res.cloudinary.com/{cloud}/image/upload/…",
 *   "url": "http://res.cloudinary.com/{cloud}/image/upload/…",
 *   "width": 800,
 *   "height": 600
 * }
 * ```
 *
 * On success the function resolves with `secure_url` (the HTTPS image URL).
 * On failure it rejects with a descriptive `Error` that includes the API's
 * error payload for easier debugging.
 */

"use strict";

/**
 * Uploads a blob to Cloudinary and returns the secure image URL.
 *
 * @param blob         - The image file to upload (PNG, JPEG, etc.).
 * @param cloudName    - Your Cloudinary cloud name (the subdomain in your dashboard URL).
 * @param uploadPreset - An **unsigned** upload preset configured in your Cloudinary settings.
 * @param onProgress   - Optional callback invoked with upload percentage `[0, 100]`.
 * @returns A promise that resolves to the HTTPS image URL string (`secure_url`).
 * @throws {Error} If the upload fails, including Cloudinary error details when available.
 */
export function uploadToCloudinary(
  blob: Blob,
  cloudName: string,
  uploadPreset: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", blob);
    form.append("upload_preset", uploadPreset);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    );

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (json.secure_url) {
          resolve(json.secure_url);
        } else {
          reject(
            new Error(
              "[Purrlet] cloudinary upload failed: " +
                JSON.stringify(json.error || json)
            )
          );
        }
      } catch {
        reject(
          new Error("[Purrlet] cloudinary upload failed: invalid response")
        );
      }
    };

    xhr.onerror = () =>
      reject(new Error("[Purrlet] cloudinary upload failed"));

    xhr.send(form);
  });
}
