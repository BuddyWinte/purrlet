"use strict";

import { normalizeUploadInput } from "../utils/upload-input.js";

const DEFAULT_MIME = "application/octet-stream";

function uint8ToBase64(bytes) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  if (typeof btoa !== "undefined") {
    return btoa(binary);
  }

  throw new Error("No base64 encoder available in this runtime");
}

export default class LocalhostProvider {
  constructor({ debug = false }) {
    this.debug = debug;
  }

  async upload(file) {
    const uploadInput = await normalizeUploadInput(file);
    const bytes = new Uint8Array(await uploadInput.value.arrayBuffer());
    const base64 = uint8ToBase64(bytes);
    const mimeType = uploadInput.value.type || DEFAULT_MIME;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    if (this.debug) {
      console.log("[LocalhostProvider] Encoded", uploadInput.filename || "upload.bin");
    }

    return dataUrl;
  }
}
