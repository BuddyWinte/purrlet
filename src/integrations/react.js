import { useCallback, useMemo, useState } from "react";
import Purrlet from "../purrlet.js";

/**
 * React hook for uploading files with Purrlet.
 * @param {Object} config
 */
export function usePurrlet(config) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const client = useMemo(() => new Purrlet(config), [config]);

  const upload = useCallback(
    async (file) => {
      setIsUploading(true);
      setError(null);

      try {
        return await client.upload(file);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [client],
  );

  return { client, upload, isUploading, error };
}

export default usePurrlet;
