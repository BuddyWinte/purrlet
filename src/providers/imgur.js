"use strict";

import { normalizeUploadInput } from "../utils/upload-input.js";
import { fetchJson } from "../utils/request.js";

export default class ImgurProvider {
  constructor({ apiKey, clientId, debug = false, requestTimeoutMs = 15000, retries = 1, retryDelayMs = 300 }) {
    this.clientId = clientId || apiKey;
    if (!this.clientId) {
      throw new Error("ImgurProvider requires a clientId (or apiKey alias)");
    }
    this.debug = debug;
    this.requestTimeoutMs = requestTimeoutMs;
    this.retries = retries;
    this.retryDelayMs = retryDelayMs;
    this.endpoint = "https://api.imgur.com/3/image";
  }

  async upload(file, options = {}) {
    const uploadInput = await normalizeUploadInput(file);

    const formData = new FormData();
    formData.append("image", uploadInput.value, uploadInput.filename);

    if (this.debug) console.log("[ImgurProvider] Uploading", uploadInput.filename);

    const { data } = await fetchJson(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${this.clientId}`,
      },
      body: formData,
      timeoutMs: options.timeoutMs ?? this.requestTimeoutMs,
      retries: options.retries ?? this.retries,
      retryDelayMs: options.retryDelayMs ?? this.retryDelayMs,
      signal: options.signal,
      debug: this.debug,
      operation: "Imgur upload",
    });

    if (!data?.success || !data?.data?.link) {
      throw new Error(`Imgur upload failed: ${data?.data?.error || "Unknown error"}`);
    }

    return data.data.link;
  }
}
