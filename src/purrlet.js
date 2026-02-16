"use strict";

/*!
 * Purrlet v1.0
 *
 * A lightweight and modern replacement for drawboxes.
 * Released under the MIT License
 * Created by BuddyWinte & awesome contributors
 * GitHub: https://github.com/BuddyWinte/Purrlet
 */


import ImgbbProvider from "./providers/imgbb.js";
import ImgurProvider from "./providers/imgur.js";
import CloudinaryProvider from "./providers/cloudinary.js";
const ProviderRegistry = new Map();
ProviderRegistry.set("imgbb", ImgbbProvider);
ProviderRegistry.set("imgur", ImgurProvider);
ProviderRegistry.set("cloudinary", CloudinaryProvider);

class Purrlet {
  /**
   * @param {Object} config
   * @param {string} config.provider
   * @param {string} [config.apiKey]
   * @param {string} [config.clientId]
   * @param {string} [config.cloudName]
   * @param {string} [config.uploadPreset]
   * @param {boolean} config.debug
   * @param {function} config.onUpload
   */
  constructor(config = {}) {
    const DEFAULT_CONFIG = {
      provider: "imgbb",
      apiKey: null,
      debug: true,
      onUpload: null,
    };
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (!this.config.provider) {
      throw new Error("Purrlet: provider is required");
    }
    if (this.config.debug) {
      console.group("Purrlet Config");
      console.log(this.config);
      console.groupEnd();
    }
    const ProviderClass = ProviderRegistry.get(this.config.provider.toLowerCase());
    if (!ProviderClass) {
      throw new Error(`Unsupported provider: ${this.config.provider}`);
    }

    this.provider = new ProviderClass(this.config);
  }

  /**
   * Uploads a file using the selected provider
   * @param {File} file - file object
   * @returns {Promise<string>} uploaded file URL
   */
  async upload(file) {
    const url = await this.provider.upload(file);
    if (typeof this.config.onUpload === "function") this.config.onUpload(url);
    return url;
  }

  /**
   * Allows registering new providers dynamically
   * @param {string} name
   * @param {class} providerClass
   */
  static registerProvider(name, providerClass) {
    if (!name || !providerClass) throw new Error("Name and class required");
    ProviderRegistry.set(name.toLowerCase(), providerClass);
  }
}
const globalObject =
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof self !== "undefined"
        ? self
        : null;
if (globalObject) {
  globalObject.Purrlet = Purrlet;
}

export default Purrlet;
