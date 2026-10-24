
import {
  AudioLines,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

import type { Capture } from "../types/capture";

type CaptureVisualProps = {
  capture: Capture;
};

export default function CaptureVisual({
  capture,
}: CaptureVisualProps) {
  if (capture.type === "audio") {
    const bars = [
      12, 22, 15, 30, 19, 36, 24, 13, 29,
      18, 34, 15, 25, 11, 21, 30, 16,
    ];

    return (
      <div className={`capture-visual visual-${capture.accent}`}>
        <div className="audio-art">
          <div className="audio-disc">
            <AudioLines size={28} strokeWidth={1.8} />
          </div>

          <div
            className="waveform"
            aria-label="Ilustração de onda sonora"
          >
            {bars.map((height, index) => (
              <i
                key={index}
                style={{ height: `${height}px` }}
              />
            ))}
          </div>

          <span className="visual-caption">
            FRAGMENTO SONORO
          </span>
        </div>
      </div>
    );
  }

  if (capture.type === "image") {
    return (
      <div className={`capture-visual visual-${capture.accent}`}>
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
      </div>
    );
  }

  return (
    <div className={`capture-visual visual-${capture.accent}`}>
      <div className="text-art">
        <div className="paper-pin">
          <FileText size={22} strokeWidth={1.7} />
        </div>

        <span className="paper-kicker">
          ANOTAÇÃO LIVRE
        </span>

        <span className="paper-line line-long" />
        <span className="paper-line line-medium" />
        <span className="paper-line line-short" />
        <span className="paper-doodle">✳</span>
      </div>
    </div>
  );
}
