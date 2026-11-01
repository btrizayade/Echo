
import { useCallback, useEffect, useState } from "react";

import {
  listThemes,
  type ApiTheme,
} from "../services/api";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível carregar os temas do Echo.";
}

export function useThemes() {
  const [themes, setThemes] = useState<ApiTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listThemes();
      setThemes(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialThemes() {
      try {
        const result = await listThemes();

        if (!cancelled) {
          setThemes(result);
          setError(null);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialThemes();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    themes,
    isLoading,
    error,
    refresh,
  };
}
