import { useCallback, useEffect, useMemo, useState } from "react";
import Purrlet from "../purrlet.js";

/**
 * React hook for uploading files with Purrlet.
 * @param {Object} config
 */
export function usePurrlet(config) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const client = useMemo(() => new Purrlet(config), [config]);

  useEffect(() => {
    return () => client.destroy();
  }, [client]);

  const upload = useCallback(
    async (file, options) => {
      setIsUploading(true);
      setError(null);

      try {
        return await client.upload(file, options);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [client],
  );

  const uploadMany = useCallback(
    async (files, options) => {
      setIsUploading(true);
      setError(null);

      try {
        return await client.uploadMany(files, options);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [client],
  );

  return { client, upload, uploadMany, isUploading, error };
}

export default usePurrlet;
