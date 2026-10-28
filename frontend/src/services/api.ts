
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

// Tipos correspondentes às respostas da API.

export type ApiTheme = {
  id: number;
  name: string;
};

export type ApiCapture = {
  id: number;
  type: "text" | "image" | "audio";
  title: string;
  content: string;
  created_at: string;
  last_revisited_at: string | null;
  themes: ApiTheme[];
};

export type CreateCapturePayload = {
  type: "text" | "image" | "audio";
  title?: string;
  content?: string;
  theme_ids?: number[];
};

export type UpdateCapturePayload = {
  title?: string;
  content?: string;
  theme_ids?: number[];
};

export type ApiRescueEvent = {
  id: number;
  capture_id: number;
  presented_at: string;
  score_at_rescue: number;
  used: boolean | null;
};

export type ApiCaptureAsset = {
  id: number;
  capture_id: number;
  media_type: "image" | "audio";
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  file_url: string;
};

// Função comum para tratar respostas e erros HTTP.

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Erro HTTP ${response.status}`;

    try {
      const body = await response.json();

      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (body.detail) {
        message = JSON.stringify(body.detail);
      }
    } catch {
      // Mantém a mensagem HTTP padrão se não houver JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// Capturas

export function listCaptures(): Promise<ApiCapture[]> {
  return request<ApiCapture[]>("/captures");
}

export function deleteCapture(id: number): Promise<void> {
  return request<void>(`/captures/${id}`, {
    method: "DELETE",
  });
}

export function getCapture(id: number): Promise<ApiCapture> {
  return request<ApiCapture>(`/captures/${id}`);
}

export function createCapture(
  payload: CreateCapturePayload,
): Promise<ApiCapture> {
  return request<ApiCapture>("/captures", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCapture(
  id: number,
  payload: UpdateCapturePayload,
): Promise<ApiCapture> {
  return request<ApiCapture>(`/captures/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function revisitCapture(id: number): Promise<ApiCapture> {
  return request<ApiCapture>(`/captures/${id}/revisit`, {
    method: "POST",
  });
}

export function addThemeToCapture(
  captureId: number,
  themeId: number,
): Promise<ApiCapture> {
  return request<ApiCapture>(
    `/captures/${captureId}/themes/${themeId}`,
    { method: "POST" },
  );
}

export function removeThemeFromCapture(
  captureId: number,
  themeId: number,
): Promise<void> {
  return request<void>(
    `/captures/${captureId}/themes/${themeId}`,
    { method: "DELETE" },
  );
}

// Temas

export function listThemes(): Promise<ApiTheme[]> {
  return request<ApiTheme[]>("/themes");
}

export function createTheme(name: string): Promise<ApiTheme> {
  return request<ApiTheme>("/themes", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function updateTheme(
  id: number,
  name: string,
): Promise<ApiTheme> {
  return request<ApiTheme>(`/themes/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function deleteTheme(id: number): Promise<void> {
  return request<void>(`/themes/${id}`, {
    method: "DELETE",
  });
}

export function listThemeCaptures(
  themeId: number,
): Promise<ApiCapture[]> {
  return request<ApiCapture[]>(`/themes/${themeId}/captures`);
}

// Resgates

function buildFocusQuery(themeIds: number[]): string {
  const params = new URLSearchParams();

  for (const id of themeIds) {
    params.append("focus_theme_ids", String(id));
  }

  return params.toString();
}

export function listRescues(
  limit = 5,
  focusThemeIds: number[] = [],
): Promise<ApiCapture[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const focusQuery = buildFocusQuery(focusThemeIds);

  if (focusQuery) {
    for (const [key, value] of new URLSearchParams(focusQuery)) {
      params.append(key, value);
    }
  }

  return request<ApiCapture[]>(`/rescues?${params.toString()}`);
}

export function recordRescueEvent(
  captureId: number,
  focusThemeIds: number[] = [],
): Promise<ApiRescueEvent> {
  const query = buildFocusQuery(focusThemeIds);
  const suffix = query ? `?${query}` : "";

  return request<ApiRescueEvent>(
    `/rescues/${captureId}/events${suffix}`,
    { method: "POST" },
  );
}

export function evaluateRescueEvent(
  eventId: number,
  used: boolean,
): Promise<ApiRescueEvent> {
  return request<ApiRescueEvent>(`/rescues/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify({ used }),
  });
}

// Arquivos de imagem e áudio

export function listCaptureAssets(
  captureId: number,
): Promise<ApiCaptureAsset[]> {
  return request<ApiCaptureAsset[]>(
    `/captures/${captureId}/assets`,
  );
}

export function uploadCaptureAsset(
  captureId: number,
  file: File,
): Promise<ApiCaptureAsset> {
  const formData = new FormData();
  formData.append("file", file);

  return request<ApiCaptureAsset>(
    `/captures/${captureId}/assets`,
    {
      method: "POST",
      body: formData,
    },
  );
}

export function getAssetFileUrl(
  asset: ApiCaptureAsset,
): string {
  return new URL(asset.file_url, `${API_BASE_URL}/`).toString();
}
