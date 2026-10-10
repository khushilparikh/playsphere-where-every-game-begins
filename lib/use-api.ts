"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet } from "./api-client";

/**
 * Small GET-on-mount data-fetching hook shared by every page that reads
 * from the API. Re-fetches whenever `path` or any value in `deps` changes,
 * and exposes `refresh()` for after a mutation (create/approve/decline…).
 */
export function useApiGet<T>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiGet<T>(path)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
