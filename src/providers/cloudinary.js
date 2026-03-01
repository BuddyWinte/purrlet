"use strict";

import { normalizeUploadInput } from "../utils/upload-input.js";
import { fetchJson } from "../utils/request.js";

export default class CloudinaryProvider {
  constructor({
    cloudName,
    uploadPreset,
    folder,
    debug = false,
    requestTimeoutMs = 15000,
    retries = 1,
    retryDelayMs = 300,
  }) {
    if (!cloudName) throw new Error("CloudinaryProvider requires cloudName");
    if (!uploadPreset) throw new Error("CloudinaryProvider requires uploadPreset");

    this.cloudName = cloudName;
    this.uploadPreset = uploadPreset;
    this.folder = folder || null;
    this.debug = debug;
    this.requestTimeoutMs = requestTimeoutMs;
    this.retries = retries;
    this.retryDelayMs = retryDelayMs;
    this.endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  }

  async upload(file, options = {}) {
    const uploadInput = await normalizeUploadInput(file);

    const formData = new FormData();
    formData.append("file", uploadInput.value, uploadInput.filename);
    formData.append("upload_preset", this.uploadPreset);
    if (this.folder) formData.append("folder", this.folder);

    if (this.debug) console.log("[CloudinaryProvider] Uploading", uploadInput.filename);

    const { data } = await fetchJson(this.endpoint, {
      method: "POST",
      body: formData,
      timeoutMs: options.timeoutMs ?? this.requestTimeoutMs,
      retries: options.retries ?? this.retries,
      retryDelayMs: options.retryDelayMs ?? this.retryDelayMs,
      signal: options.signal,
      debug: this.debug,
      operation: "Cloudinary upload",
    });

    if (!data?.secure_url) {
      throw new Error(`Cloudinary upload failed: ${data?.error?.message || "Unknown error"}`);
    }

    return data.secure_url;
  }
}
