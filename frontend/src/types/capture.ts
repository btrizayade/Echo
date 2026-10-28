export type Section =
  | "Visão geral"
  | "Capturas"
  | "Temas"
  | "Resgates";

export type CaptureType = "text" | "image" | "audio";

export type Capture = {
  id: number;
  type: CaptureType;
  title: string;
  content: string;

  // Todos os temas associados à captura.
  themes: string[];

  // Mantida durante a transição dos componentes existentes.
  theme: string;

  age: string;
  daysUnattended: number;
  accent: string;
};