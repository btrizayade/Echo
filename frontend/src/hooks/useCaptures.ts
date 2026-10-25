
import { useCallback, useEffect, useState } from "react";

import {
  createCapture as createCaptureRequest,
  listCaptures,
  type CreateCapturePayload,
} from "../services/api";

import {
  mapApiCaptureToCapture,
  mapApiCapturesToCaptures,
} from "../utils/captureAdapter";

import type { Capture } from "../types/capture";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível conectar ao servidor do Echo.";
}

export function useCaptures() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiCaptures = await listCaptures();

      setCaptures(mapApiCapturesToCaptures(apiCaptures));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const create = useCallback(
    async (payload: CreateCapturePayload): Promise<Capture> => {
      setError(null);

      try {
        const apiCapture = await createCaptureRequest(payload);
        const capture = mapApiCaptureToCapture(apiCapture);

        setCaptures((current) => [
          capture,
          ...current.filter((item) => item.id !== capture.id),
        ]);

        return capture;
      } catch (requestError) {
        setError(getErrorMessage(requestError));
        throw requestError;
      }
    },
    [],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    captures,
    isLoading,
    error,
    refresh,
    createCapture: create,
  };
}
