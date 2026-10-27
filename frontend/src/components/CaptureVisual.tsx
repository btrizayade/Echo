
import { useEffect, useState } from "react";
import {
  AudioLines,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import type { Capture } from "../types/capture";
import {
  listCaptureAssets,
  getAssetFileUrl,
} from "../services/api";

export function CaptureVisual({ capture }: { capture: Capture }) {
  const [assetUrl, setAssetUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMediaAsset() {
      setAssetUrl(null);

      if (capture.type !== "image" && capture.type !== "audio") {
        return;
      }

      try {
        const assets = await listCaptureAssets(capture.id);
        const mediaType = capture.type === "image" ? "image" : "audio";

        const mediaAsset = assets.find(
          (asset) => asset.media_type === mediaType
        );

        if (!cancelled && mediaAsset) {
          setAssetUrl(getAssetFileUrl(mediaAsset));
        }
      } catch (error) {
        console.error("Não foi possível carregar o arquivo:", error);

        if (!cancelled) {
          setAssetUrl(null);
        }
      }
    }

    void loadMediaAsset();

    return () => {
      cancelled = true;
    };
  }, [capture.id, capture.type]);

  if (capture.type === "audio") {
    const bars = [
      12, 22, 15, 30, 19, 36, 24, 13, 29,
      18, 34, 15, 25, 11, 21, 30, 16,
    ];

    return (
      <div className={`capture-visual visual-${capture.accent}`}>
        {assetUrl ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              height: "100%",
              padding: 10,
              boxSizing: "border-box",
            }}
          >
            <AudioLines size={28} strokeWidth={1.8} />

            <span className="visual-caption">ÁUDIO SALVO</span>

            <audio
              controls
              preload="metadata"
              src={assetUrl}
              aria-label={`Reproduzir áudio: ${capture.title}`}
              onClick={(event) => event.stopPropagation()}
              style={{
                display: "block",
                width: "100%",
                maxWidth: 260,
              }}
            >
              Seu navegador não suporta a reprodução de áudio.
            </audio>
          </div>
        ) : (
          <div className="audio-art">
            <div className="audio-disc">
              <AudioLines size={28} strokeWidth={1.8} />
            </div>

            <div className="waveform" aria-label="Ilustração de onda sonora">
              {bars.map((height, index) => (
                <i key={index} style={{ height: `${height}px` }} />
              ))}
            </div>

            <span className="visual-caption">FRAGMENTO SONORO</span>
          </div>
        )}
      </div>
    );
  }

  if (capture.type === "image") {
    return (
      <div className={`capture-visual visual-${capture.accent}`}>
        {assetUrl ? (
          <img
            src={assetUrl}
            alt={capture.title}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        ) : (
          <div className="image-art">
            <span className="art-hill hill-back" />
            <span className="art-hill hill-front" />
            <span className="art-flower flower-one">✳</span>
            <span className="art-flower flower-two">✳</span>
            <ImageIcon
              className="art-icon"
              size={24}
              strokeWidth={1.7}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`capture-visual visual-${capture.accent}`}>
      <div className="text-art">
        <div className="paper-pin">
          <FileText size={22} strokeWidth={1.7} />
        </div>

        <span className="paper-kicker">ANOTAÇÃO LIVRE</span>
        <span className="paper-line line-long" />
        <span className="paper-line line-medium" />
        <span className="paper-line line-short" />
        <span className="paper-doodle">✳</span>
      </div>
    </div>
  );
}
