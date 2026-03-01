import { writable } from "svelte/store";
import Purrlet from "../purrlet.js";

/**
 * SvelteKit helper for creating a Purrlet instance.
 * Use in client-side components.
 * @param {Object} config
 */
export function createPurrlet(config) {
  return new Purrlet(config);
}

/**
 * SvelteKit uploader with Svelte stores for state tracking.
 * @param {Object} config
 */
export function createSvelteKitUploader(config) {
  const client = new Purrlet(config);
  const isUploading = writable(false);
  const error = writable(null);

  const upload = async (file, options) => {
    isUploading.set(true);
    error.set(null);

    try {
      return await client.upload(file, options);
    } catch (err) {
      error.set(err);
      throw err;
    } finally {
      isUploading.set(false);
    }
  };

  const uploadMany = async (files, options) => {
    isUploading.set(true);
    error.set(null);

    try {
      return await client.uploadMany(files, options);
    } catch (err) {
      error.set(err);
      throw err;
    } finally {
      isUploading.set(false);
    }
  };

  return { client, upload, uploadMany, isUploading, error, destroy: () => client.destroy() };
}

export default createPurrlet;
