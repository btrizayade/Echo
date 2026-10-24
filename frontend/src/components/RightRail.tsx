
import { ArrowUpRight, Sparkles } from "lucide-react";

import { typeIcons } from "../data/captures";
import type { Capture, Section } from "../types/capture";

type RightRailProps = {
  captures: Capture[];
  themes: string[];
  forgottenCaptures: Capture[];
  onSelectCapture: (capture: Capture) => void;
  onSectionChange: (section: Section) => void;
  onThemeSelect: (theme: string) => void;
};

export default function RightRail({
  captures,
  themes,
  forgottenCaptures,
  onSelectCapture,
  onSectionChange,
  onThemeSelect,
}: RightRailProps) {
  return (
    <aside className="right-rail">
      <div className="rail-header">
        <div>
          <p className="eyebrow">SEU OUTRO LADO</p>
          <h2>Pequenos começos.</h2>
        </div>

        <div className="rail-flower">✳</div>
      </div>

      <section className="resurface-card">
        <div className="resurface-top">
          <span className="resurface-icon">
            <Sparkles size={17} />
          </span>
          <span className="eyebrow">REDESCOBRIR</span>
        </div>

        <h3>O que ficou esperando?</h3>

        <p>
          Algumas ideias merecem uma segunda olhada.
          Sem pressa, sem cobrança.
        </p>

        <div className="resurface-list">
          {forgottenCaptures.slice(0, 2).map((capture) => {
            const Icon = typeIcons[capture.type];

            return (
              <button
                key={capture.id}
                className="resurface-item"
                onClick={() => onSelectCapture(capture)}
              >
                <span
                  className={`resurface-mini mini-${capture.accent}`}
                >
                  <Icon size={17} />
                </span>

                <span className="resurface-info">
                  <strong>{capture.title}</strong>
                  <small>
                    Há {capture.daysUnattended} dias sem atenção
                  </small>
                </span>

                <ArrowUpRight size={15} />
              </button>
            );
          })}
        </div>

        <button
          className="resurface-button"
          onClick={() => onSectionChange("Resgates")}
        >
          Explorar resgates <ArrowUpRight size={15} />
        </button>
      </section>

      <section className="rail-themes">
        <div className="rail-section-heading">
          <div>
            <p className="eyebrow">FIO CONDUTOR</p>
            <h3>Temas em movimento</h3>
          </div>

          <button
            className="icon-button"
            onClick={() => onSectionChange("Temas")}
            aria-label="Ver todos os temas"
          >
            <ArrowUpRight size={16} />
          </button>
        </div>

        {themes.slice(0, 4).map((theme, index) => {
          const themeCounts = captures.filter(
            (capture) => capture.theme === theme,
          ).length;

          return (
            <button
              className="rail-theme-row"
              key={theme}
              onClick={() => onThemeSelect(theme)}
            >
              <span className={`theme-dot dot-${index % 4}`}>
                {["✳", "○", "↗", "✦"][index % 4]}
              </span>

              <span>{theme}</span>

              <small>
                {String(themeCounts).padStart(2, "0")}
              </small>
            </button>
          );
        })}
      </section>

      <div className="rail-local">
        <span className="local-dot" />
        Seus fragmentos ficam no seu espaço
      </div>
    </aside>
  );
}
