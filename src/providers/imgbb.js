"use strict";

import { normalizeUploadInput } from "../utils/upload-input.js";
import { fetchJson } from "../utils/request.js";

export default class ImgbbProvider {
  constructor({ apiKey, debug = false, requestTimeoutMs = 15000, retries = 1, retryDelayMs = 300 }) {
    if (!apiKey) throw new Error("ImgbbProvider requires an API key");
    this.apiKey = apiKey;
    this.debug = debug;
    this.requestTimeoutMs = requestTimeoutMs;
    this.retries = retries;
    this.retryDelayMs = retryDelayMs;
    this.endpoint = "https://api.imgbb.com/1/upload";
  }

  async upload(file, options = {}) {
    const uploadInput = await normalizeUploadInput(file);

    const formData = new FormData();
    formData.append("image", uploadInput.value, uploadInput.filename);

    const url = `${this.endpoint}?key=${this.apiKey}`;
    if (this.debug) console.log("[ImgbbProvider] Uploading", uploadInput.filename);

    const { data } = await fetchJson(url, {
      method: "POST",
      body: formData,
      timeoutMs: options.timeoutMs ?? this.requestTimeoutMs,
      retries: options.retries ?? this.retries,
      retryDelayMs: options.retryDelayMs ?? this.retryDelayMs,
      signal: options.signal,
      debug: this.debug,
      operation: "Imgbb upload",
    });

    if (!data?.success || !data?.data?.url) {
      throw new Error(`Imgbb upload failed: ${data?.error?.message || "Unknown error"}`);
    }

    return data.data.url;
  }
}
