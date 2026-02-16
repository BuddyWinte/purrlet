"use strict";

export default class ImgurProvider {
  constructor({ apiKey, clientId, debug = false }) {
    this.clientId = clientId || apiKey;
    if (!this.clientId) {
      throw new Error("ImgurProvider requires a clientId (or apiKey alias)");
    }
    this.debug = debug;
    this.endpoint = "https://api.imgur.com/3/image";
  }

  async upload(file) {
    if (!(file instanceof File)) throw new Error("File must be a File object");

    const formData = new FormData();
    formData.append("image", file);

    if (this.debug) console.log("[ImgurProvider] Uploading", file.name);

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${this.clientId}`,
      },
      body: formData,
    });
    const data = await res.json();

    if (!res.ok || !data.success || !data.data?.link) {
      throw new Error(`Imgur upload failed: ${data.data?.error || "Unknown error"}`);
    }

    return data.data.link;
  }
}
