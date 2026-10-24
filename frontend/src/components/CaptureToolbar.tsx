
import {
  ArrowUpRight,
  Clock3,
  Compass,
  FileText,
  Headphones,
  Image as ImageIcon,
} from "lucide-react";

import type { CaptureType, Section } from "../types/capture";

type CaptureToolbarProps = {
  activeSection: Section;
  activeType: CaptureType | "all";
  count: number;
  onTypeChange: (type: CaptureType | "all") => void;
  onViewLibrary: () => void;
};

const filters: {
  value: CaptureType | "all";
  label: string;
  icon: typeof Compass;
}[] = [
  { value: "all", label: "Tudo", icon: Compass },
  { value: "text", label: "Textos", icon: FileText },
  { value: "image", label: "Imagens", icon: ImageIcon },
  { value: "audio", label: "Áudios", icon: Headphones },
];

const sectionLabels: Record<
  Section,
  { eyebrow: string; title: string }
> = {
  "Visão geral": {
    eyebrow: "",
    title: "Fragmentos recentes",
  },
  Capturas: {
    eyebrow: "SUAS IDEIAS GUARDADAS",
    title: "Todas as capturas",
  },
  Temas: {
    eyebrow: "FRAGMENTOS RELACIONADOS",
    title: "Ideias nesse tema",
  },
  Resgates: {
    eyebrow: "ESPERANDO POR VOCÊ",
    title: "Hora de redescobrir",
  },
};

export default function CaptureToolbar({
  activeSection,
  activeType,
  count,
  onTypeChange,
  onViewLibrary,
}: CaptureToolbarProps) {
  const labels = sectionLabels[activeSection];

  return (
    <>
      <div className="section-toolbar">
        <div>
          {activeSection !== "Visão geral" && (
            <p className="eyebrow">{labels.eyebrow}</p>
          )}

          <h2>
            {labels.title}
            <span className="count-badge">{count}</span>
          </h2>
        </div>

        <button
          className="quiet-button"
          onClick={onViewLibrary}
        >
          Ver biblioteca <ArrowUpRight size={15} />
        </button>
      </div>

      <div
        className="format-filters"
        aria-label="Filtrar por formato"
      >
        {filters.map((filter) => {
          const Icon = filter.icon;

          return (
            <button
              key={filter.value}
              className={`format-chip ${
                activeType === filter.value ? "selected" : ""
              }`}
              onClick={() => onTypeChange(filter.value)}
              aria-pressed={activeType === filter.value}
            >
              <Icon size={15} />
              {filter.label}
            </button>
          );
        })}

        <span className="filter-hint">
          <Clock3 size={13} />
          Suas ideias, no seu tempo
        </span>
      </div>
    </>
  );
}
