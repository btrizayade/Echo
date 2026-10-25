
import { useCallback, useEffect, useState } from "react";

import {
  listRescues,
  recordRescueEvent,
} from "../services/api";

import {
  mapApiCapturesToCaptures,
} from "../utils/captureAdapter";

import type { Capture } from "../types/capture";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível carregar os resgates do Echo.";
}

type UseRescuesResult = {
  rescues: Capture[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  recordRescue: (captureId: number) => Promise<void>;
};

export function useRescues(
  enabled: boolean,
): UseRescuesResult {
  const [rescues, setRescues] = useState<Capture[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiCaptures = await listRescues(20);

      setRescues(
        mapApiCapturesToCaptures(apiCaptures),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const recordRescue = useCallback(
    async (captureId: number): Promise<void> => {
      setError(null);

      try {
        await recordRescueEvent(captureId);

        // Atualiza a lista para respeitar o cooldown
        // aplicado pelo backend após o registro do evento.
        await refresh();
      } catch (requestError) {
        const message = getErrorMessage(requestError);
        setError(message);
        throw requestError;
      }
    },
    [refresh],
  );

  useEffect(() => {
    if (enabled) {
      void refresh();
    }
  }, [enabled, refresh]);

  return {
    rescues,
    isLoading,
    error,
    refresh,
    recordRescue,
  };
}
