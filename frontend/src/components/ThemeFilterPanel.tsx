
import { Compass, Tags } from "lucide-react";

type ThemeFilterPanelProps = {
  themes: string[];
  activeTheme: string;
  onThemeChange: (theme: string) => void;
};

export default function ThemeFilterPanel({
  themes,
  activeTheme,
  onThemeChange,
}: ThemeFilterPanelProps) {
  return (
    <section className="theme-filter-panel">
      <div>
        <p className="eyebrow">SEUS AGRUPAMENTOS</p>
        <h2>Por onde vamos começar?</h2>
      </div>

      <div className="theme-pills">
        {["Todos", ...themes].map((theme) => (
          <button
            key={theme}
            className={`theme-pill ${
              activeTheme === theme ? "selected" : ""
            }`}
            onClick={() => onThemeChange(theme)}
            aria-pressed={activeTheme === theme}
          >
            {theme === "Todos" ? (
              <Compass size={14} />
            ) : (
              <Tags size={14} />
            )}

            {theme}
          </button>
        ))}
      </div>
    </section>
  );
}
