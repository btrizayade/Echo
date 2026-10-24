
import { Search, X } from "lucide-react";

import CaptureCard from "./CaptureCard";
import type { Capture, Section } from "../types/capture";

type CaptureGridProps = {
  captures: Capture[];
  activeSection: Section;
  onSelectCapture: (capture: Capture) => void;
  onClearFilters: () => void;
};

export default function CaptureGrid({
  captures,
  activeSection,
  onSelectCapture,
  onClearFilters,
}: CaptureGridProps) {
  if (captures.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <Search size={24} />
        </div>

        <h3>Nenhum fragmento por aqui.</h3>

        <p>
          Tente outro termo ou escolha um formato diferente.
        </p>

        <button
          className="quiet-button"
          onClick={onClearFilters}
        >
          Limpar filtros <X size={14} />
        </button>
      </div>
    );
  }

  const gridVariant =
    activeSection === "Visão geral"
      ? "capture-grid-overview"
      : "capture-grid-full";

  return (
    <div className={`capture-grid ${gridVariant}`}>
      {captures.map((capture, index) => (
        <CaptureCard
          key={capture.id}
          capture={capture}
          index={index}
          onSelect={onSelectCapture}
        />
      ))}
    </div>
  );
}
