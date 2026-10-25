
import {
  ArrowUpRight,
  Bookmark,
  Clock3,
  Tags,
  X,
} from "lucide-react";

import CaptureVisual from "./CaptureVisual";
import { typeLabels } from "../data/captures";
import type { Capture } from "../types/capture";

type CaptureDetailModalProps = {
  capture: Capture;
  onClose: () => void;
  onRescue?: () => void;
  isRescuing?: boolean;
  rescueRecorded?: boolean;
  rescueError?: string | null;
};

export default function CaptureDetailModal({
  capture,
  onClose,
  onRescue,
  isRescuing = false,
  rescueRecorded = false,
  rescueError = null,
}: CaptureDetailModalProps) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="modal-card detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-heading"
      >
        <div className="modal-top">
          <span className="modal-icon">
            <Bookmark size={22} />
          </span>

          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Fechar"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <p className="eyebrow">
          FRAGMENTO #{String(capture.id).padStart(3, "0")}
        </p>

        <div className="detail-visual">
          <CaptureVisual capture={capture} />
        </div>

        <span className={`type-label type-${capture.type}`}>
          {typeLabels[capture.type]}
        </span>

        <h2 id="detail-heading">{capture.title}</h2>

        <p className="detail-content">
          {capture.content || "Nenhuma anotação textual associada."}
        </p>

        <div className="detail-footer">
          <span className="theme-tag">
            <Tags size={13} />
            {capture.theme}
          </span>

          <span>
            <Clock3 size={14} />
            {capture.age}
          </span>
        </div>

        {onRescue && (
          <div className="rescue-action">
            {rescueRecorded ? (
              <p className="demo-notice" role="status">
                Resgate registrado. Esta ideia ficará em pausa
                durante o período de cooldown.
              </p>
            ) : (
              <>
                <button
                  className="modal-submit"
                  type="button"
                  onClick={onRescue}
                  disabled={isRescuing}
                >
                  {isRescuing
                    ? "Registrando resgate..."
                    : "Resgatar esta ideia"}
                  <ArrowUpRight size={16} />
                </button>

                <p className="demo-notice">
                  Só registre o resgate quando decidir que quer
                  revisitar esta ideia agora.
                </p>
              </>
            )}

            {rescueError && (
              <p className="demo-notice" role="alert">
                Não foi possível registrar o resgate: {rescueError}
              </p>
            )}
          </div>
        )}

        <p className="demo-notice">
          Os cartões são amostras visuais. Upload e persistência
          serão ligados à API na próxima etapa.
        </p>
      </section>
    </div>
  );
}
