
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  AudioLines,
  Bookmark,
  Clock3,
  Tags,
  X,
} from "lucide-react";

import { CaptureVisual } from "./CaptureVisual";
import { typeLabels } from "../data/captures";
import type { Capture } from "../types/capture";
import {
  listCaptureAssets,
  getAssetFileUrl,
} from "../services/api";

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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setAudioUrl(null);
    setAudioError(false);

    if (capture.type !== "audio") {
      setAudioLoading(false);

      return () => {
        cancelled = true;
      };
    }

    setAudioLoading(true);

    async function loadAudio() {
      try {
        const assets = await listCaptureAssets(capture.id);
        const audioAsset = assets.find(
          (asset) => asset.media_type === "audio"
        );

        if (!cancelled) {
          if (audioAsset) {
            setAudioUrl(getAssetFileUrl(audioAsset));
          } else {
            setAudioError(true);
          }
        }
      } catch (error) {
        console.error(
          "Não foi possível carregar o áudio da captura:",
          error
        );

        if (!cancelled) {
          setAudioError(true);
        }
      } finally {
        if (!cancelled) {
          setAudioLoading(false);
        }
      }
    }

    void loadAudio();

    return () => {
      cancelled = true;
    };
  }, [capture.id, capture.type]);

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
          {capture.type === "audio" ? (
            <div
              className={`capture-visual visual-${capture.accent}`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                width: "100%",
                height: "100%",
                minHeight: 160,
                padding: 16,
                boxSizing: "border-box",
              }}
            >
              <AudioLines size={30} strokeWidth={1.8} />

              <span className="visual-caption">
                {audioUrl ? "ÁUDIO SALVO" : "FRAGMENTO SONORO"}
              </span>

              {audioUrl ? (
                <audio
                  controls
                  preload="metadata"
                  src={audioUrl}
                  aria-label={`Reproduzir áudio: ${capture.title}`}
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: 360,
                  }}
                >
                  Seu navegador não suporta a reprodução de áudio.
                </audio>
              ) : (
                <p className="demo-notice" role="status">
                  {audioLoading
                    ? "Carregando áudio..."
                    : audioError
                      ? "Não foi possível localizar ou carregar o arquivo de áudio."
                      : "Nenhum arquivo de áudio disponível."}
                </p>
              )}
            </div>
          ) : (
            <CaptureVisual capture={capture} />
          )}
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
      </section>
    </div>
  );
}
