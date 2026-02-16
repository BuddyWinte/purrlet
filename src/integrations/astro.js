import Purrlet from "../purrlet.js";

/**
 * Astro helper for creating a Purrlet instance.
 * Use this in client-side scripts/components.
 * @param {Object} config
 */
export function createPurrlet(config) {
  return new Purrlet(config);
}

/**
 * Creates a small upload helper for Astro components.
 * @param {Object} config
 */
export function createAstroUploader(config) {
  const client = new Purrlet(config);

  return {
    client,
    upload: (file) => client.upload(file),
  };
}

export default createPurrlet;
