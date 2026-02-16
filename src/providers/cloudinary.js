"use strict";

export default class CloudinaryProvider {
  constructor({ cloudName, uploadPreset, folder, debug = false }) {
    if (!cloudName) throw new Error("CloudinaryProvider requires cloudName");
    if (!uploadPreset) throw new Error("CloudinaryProvider requires uploadPreset");

    this.cloudName = cloudName;
    this.uploadPreset = uploadPreset;
    this.folder = folder || null;
    this.debug = debug;
    this.endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  }

  async upload(file) {
    if (!(file instanceof File)) throw new Error("File must be a File object");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", this.uploadPreset);
    if (this.folder) formData.append("folder", this.folder);

    if (this.debug) console.log("[CloudinaryProvider] Uploading", file.name);

    const res = await fetch(this.endpoint, { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok || !data.secure_url) {
      throw new Error(`Cloudinary upload failed: ${data.error?.message || "Unknown error"}`);
    }

    return data.secure_url;
  }
}
