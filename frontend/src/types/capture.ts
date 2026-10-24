
export type Section = "Visão geral" | "Capturas" | "Temas" | "Resgates";
export type CaptureType = "text" | "image" | "audio";

export type Capture = {
  id: number;
  type: CaptureType;
  title: string;
  content: string;
  theme: string;
  age: string;
  daysUnattended: number;
  accent: string;
};
