"use strict";

export default class ImgbbProvider {
  constructor({ apiKey, debug = false }) {
    if (!apiKey) throw new Error("ImgbbProvider requires an API key");
    this.apiKey = apiKey;
    this.debug = debug;
    this.endpoint = "https://api.imgbb.com/1/upload";
  }

  async upload(file) {
    if (!(file instanceof File)) throw new Error("File must be a File object");

    const formData = new FormData();
    formData.append("image", file);

    const url = `${this.endpoint}?key=${this.apiKey}`;
    if (this.debug) console.log("[ImgbbProvider] Uploading", file.name);

    const res = await fetch(url, { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(`Imgbb upload failed: ${data.error?.message || "Unknown error"}`);
    }

    return data.data.url;
  }
}