export type CatboxUploaderOptions = {
    /**
     * Optional Catbox user hash
     * 
     * Enables account-linked uploads instead of anonymous uploads
     * 
     * @readonly
     */
    readonly userHash?: string;

    /**
     * Custom Catbox API endpoint
     * 
     * @default "https://catbox.moe/user/api.php"
     * @readonly
     */
    readonly endpoint?: string;

    /**
     * Upload a remote URL instead of uploading a Blob directly
     * 
     * If provided, Catbox will fetch the URL itself using the `urlupload` request type.
     * 
     * @readonly
     */
    readonly url?: string;

    /**
     * Custom fetch implementation
     * 
     * Useful for polyfills, custom runtimes, etc.
     * 
     * @readonly
     */
    readonly fetch?: typeof globalThis.fetch;
}

/**
 * Creates a Catbox upload handler compatible with Purrlet
 * 
 * The returned function is fully Promise-based
 * 
 * @requires globalThis.fetch
 */
export function catboxUploader(
    options: CatboxUploaderOptions = {}
) {
    const {
    userHash,
    endpoint = "https://catbox.moe/user/api.php",
    url,
    fetch: customFetch,
  } = options;

  const fetchImpl = customFetch ?? globalThis.fetch;

  if (!fetchImpl) {
    throw new Error(
        "[Purrlet] Fetch API is not available in this environment"
    )
  }

  /**
   * Uploads a canvas blob to Catbox
   * 
   * @param blob - Image blob
   * @returns Promise resolving to Catbox URL
   */
  return async(blob: Blob): Promise<string> => {
    const form = new FormData();

    if (url) {
        form.append("reqtype", "urlupload");
        form.append("url", url);
    } else {
        form.append("reqtype", "fileupload");
        form.append("fileToUpload", blob, "purrlet.png");
    }

    if (userHash) {
        form.append("userhash", userHash)
    }

    const response = await fetchImpl(endpoint, {
      method: "POST",
      body: form,
    });

    if (!response.ok) {
        throw new Error(
            `[Purrlet] Catbox upload failed (${response.status})`
        )
    }

    const text = (await response.text()).trim();

    if (
      text.toLowerCase().startsWith("error") ||
      text.toLowerCase().includes("failed")
    ) {
      throw new Error(text);
    }

    return text;
  }
}