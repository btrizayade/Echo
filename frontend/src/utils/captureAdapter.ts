import type { ApiCapture } from "../services/api";
import type { Capture } from "../types/capture";

const accents = [
  "yellow",
  "coral",
  "blue",
  "green",
  "pink",
  "lavender",
];

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function getElapsedDays(dateString: string): number {
  const timestamp = new Date(dateString).getTime();

  if (!Number.isFinite(timestamp)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (Date.now() - timestamp) / MILLISECONDS_PER_DAY,
    ),
  );
}

function formatAge(dateString: string): string {
  const days = getElapsedDays(dateString);

  if (days === 0) return "Hoje";
  if (days === 1) return "Ontem";
  if (days < 7) return `Há ${days} dias`;
  if (days < 14) return "Há 1 semana";
  if (days < 30) return `Há ${Math.floor(days / 7)} semanas`;
  if (days < 60) return "Há 1 mês";
  if (days < 365) return `Há ${Math.floor(days / 30)} meses`;

  const years = Math.floor(days / 365);

  return years === 1 ? "Há 1 ano" : `Há ${years} anos`;
}

export function mapApiCaptureToCapture(
  apiCapture: ApiCapture,
): Capture {
  const referenceDate =
    apiCapture.last_revisited_at ?? apiCapture.created_at;

  // Preserva todos os temas associados à captura.
  const themes = (apiCapture.themes ?? []).map(
    (theme) => theme.name,
  );

  return {
    id: apiCapture.id,
    type: apiCapture.type,
    title: apiCapture.title,
    content: apiCapture.content,
    themes,
    theme: themes[0] ?? "Sem tema",
    age: formatAge(apiCapture.created_at),
    daysUnattended: getElapsedDays(referenceDate),
    accent: accents[(apiCapture.id - 1) % accents.length],
  };
}

export function mapApiCapturesToCaptures(
  apiCaptures: ApiCapture[],
): Capture[] {
  return apiCaptures.map(mapApiCaptureToCapture);
}