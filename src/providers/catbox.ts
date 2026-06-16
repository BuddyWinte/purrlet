/*!
 * Purrlet v2.0.0
 *
 * Created by BuddyWinte and pawsome contributors
 * https://github.com/BuddyWinte/Purrlet
 * 
 * License: MIT
 */

/**
 * Configuration for Catbox Uploader
 *
 * @public
 */
export interface CatboxUploaderOptions {
  /**
   * Optional Catbox user hash.
   *
   * When provided, uploads are associated with the user's Catbox account
   * instead of being uploaded anonymously.
   *
   * @see https://catbox.moe
   */
  readonly userHash?: string;

  /**
   * Catbox API endpoint.
   *
   * @default "https://catbox.moe/user/api.php"
   */
  readonly endpoint?: string;

  /**
   * Custom Fetch implementation.
   *
   * Useful for non-browser enviorments.
   *
   * @default globalThis.fetch
   */
  readonly fetch?: typeof globalThis.fetch;

  /**
   * Abort signal passed to fetch.
   */
  readonly signal?: AbortSignal;
}

/**
 * Creates a Catbox upload handler.
 *
 * The returned function uploads image blobs to Catbox and resolves
 * with the resulting URL.
 *
 * @param options - Uploader configuration.
 *
 * @returns Upload function that accepts a Blob and resolves to the
 * uploaded Catbox URL.
 *
 * @throws {Error}
 * Thrown when the Fetch API is unavailable.
 *
 * @example
 * ```ts
 * const upload = catboxUploader();
 *
 * const url = await upload(blob);
 * console.log(url);
 * ```
 *
 * @example
 * ```ts
 * const upload = catboxUploader({
 *   userHash: process.env.CATBOX_USER_HASH
 * });
 *
 * const url = await upload(blob);
 * ```
 *
 * @public
 */
export function catboxUploader(
  options: CatboxUploaderOptions = {}
) {
  const {
    userHash,
    endpoint = "https://catbox.moe/user/api.php",
    fetch: customFetch,
    signal,
  } = options;

  const fetchImpl = customFetch ?? globalThis.fetch;

  if (!fetchImpl) {
    throw new Error(
      "[Purrlet] Fetch API is not available in this environment"
    );
  }

  /**
   * Upload a Blob to Catbox.
   *
   * @param blob - Blob to upload.
   *
   * @returns Direct Catbox URL.
   *
   * @throws {Error}
   * Thrown when:
   * - The upload request fails.
   * - Catbox returns an error response.
   * - Catbox returns an invalid URL.
   */
  return async (blob: Blob): Promise<string> => {
    const form = new FormData();

    const extension =
      blob.type.split("/")[1]?.toLowerCase() ?? "png";

    form.append("reqtype", "fileupload");
    form.append(
      "fileToUpload",
      blob,
      `purrlet.${extension}`
    );

    if (userHash) {
      form.append("userhash", userHash);
    }

    const response = await fetchImpl(endpoint, {
      method: "POST",
      body: form,
      signal,
    });

    if (!response.ok) {
      throw new Error(
        `[Purrlet] Catbox upload failed (${response.status} ${response.statusText})`
      );
    }

    const text = (await response.text()).trim();

    if (
      text.toLowerCase().startsWith("error") ||
      text.toLowerCase().includes("failed")
    ) {
      throw new Error(text);
    }

    try {
      new URL(text);
    } catch {
      throw new Error(
        `[Purrlet] Invalid Catbox response: ${text}`
      );
    }

    return text;
  };
}