
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
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ao abrir Resgates pela primeira vez, o estado de loading é derivado
  // da rota ativa e da primeira resposta, sem setState síncrono no effect.
  const isLoading = isRefreshing || (enabled && !hasLoaded);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const apiCaptures = await listRescues(20);

      setRescues(mapApiCapturesToCaptures(apiCaptures));
      setHasLoaded(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setHasLoaded(true);
    } finally {
      setIsRefreshing(false);
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
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function loadRescues() {
      try {
        const apiCaptures = await listRescues(20);

        if (!cancelled) {
          setRescues(mapApiCapturesToCaptures(apiCaptures));
          setError(null);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setHasLoaded(true);
        }
      }
    }

    void loadRescues();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    rescues,
    isLoading,
    error,
    refresh,
    recordRescue,
  };
}
