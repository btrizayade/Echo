
import { ArrowUpRight } from "lucide-react";

import { CaptureVisual } from "./CaptureVisual";
import { typeIcons, typeLabels } from "../data/captures";
import type { Capture } from "../types/capture";

type CaptureCardProps = {
  capture: Capture;
  index: number;
  onSelect: (capture: Capture) => void;
};

export default function CaptureCard({
  capture,
  index,
  onSelect,
}: CaptureCardProps) {
  const TypeIcon = typeIcons[capture.type];

  return (
    <button
      className="capture-card"
      onClick={() => onSelect(capture)}
      aria-label={`Abrir captura: ${capture.title}`}
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <CaptureVisual capture={capture} />

      <div className="card-body">
        <div className="card-meta">
          <span className={`type-label type-${capture.type}`}>
            <TypeIcon size={12} />
            {typeLabels[capture.type]}
          </span>

          <span className="card-age">{capture.age}</span>
        </div>

        <h3>{capture.title}</h3>

        <p className="card-description">
          {capture.content ||
            "Um fragmento à espera de novas conexões."}
        </p>

        <div className="card-bottom">
          <span className="theme-tag">{capture.theme}</span>

          <span className="card-open" aria-hidden="true">
            <ArrowUpRight size={15} />
          </span>
        </div>
      </div>
    </button>
  );
}
