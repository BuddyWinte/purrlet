import { ref, shallowRef } from "vue";
import Purrlet from "../purrlet.js";

/**
 * Vue composable for uploading files with Purrlet.
 * @param {Object} config
 */
export function usePurrlet(config) {
  const client = shallowRef(new Purrlet(config));
  const isUploading = ref(false);
  const error = ref(null);

  const upload = async (file) => {
    isUploading.value = true;
    error.value = null;

    try {
      return await client.value.upload(file);
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      isUploading.value = false;
    }
  };

  return { client, upload, isUploading, error };
}

export default usePurrlet;
