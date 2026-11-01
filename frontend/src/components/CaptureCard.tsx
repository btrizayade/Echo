import { ArrowUpRight, Star } from "lucide-react";

import { CaptureVisual } from "./CaptureVisual";
import { typeIcons, typeLabels } from "../data/captures";
import type { Capture } from "../types/capture";

type CaptureCardProps = {
  capture: Capture;
  index: number;
  onSelect: (capture: Capture) => void;
  onToggleFavorite: (capture: Capture) => void;
};

export default function CaptureCard({
  capture,
  index,
  onSelect,
  onToggleFavorite,
}: CaptureCardProps) {
  const TypeIcon = typeIcons[capture.type];

  return (
    <article
      className="capture-card"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <button
        type="button"
        className="capture-card-main"
        onClick={() => onSelect(capture)}
        aria-label={`Abrir captura: ${capture.title}`}
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

      <button
        type="button"
        className={`card-favorite ${
          capture.is_favorite ? "is-favorite" : ""
        }`}
        onClick={() => onToggleFavorite(capture)}
        aria-label={
          capture.is_favorite
            ? "Remover dos favoritos"
            : "Adicionar aos favoritos"
        }
        aria-pressed={capture.is_favorite}
        title={
          capture.is_favorite
            ? "Remover dos favoritos"
            : "Adicionar aos favoritos"
        }
      >
        <Star size={17} />
      </button>
    </article>
  );
}