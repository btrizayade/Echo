
import { useMemo, useState } from "react";

import CaptureDetailModal from "./components/CaptureDetailModal";
import CaptureGrid from "./components/CaptureGrid";
import CaptureToolbar from "./components/CaptureToolbar";
import NewCaptureModal from "./components/NewCaptureModal";
import PageHeading from "./components/PageHeading";
import RightRail from "./components/RightRail";
import Sidebar from "./components/Sidebar";
import ThemeFilterPanel from "./components/ThemeFilterPanel";
import Topbar from "./components/Topbar";
import WelcomePanel from "./components/WelcomePanel";

import { initialCaptures } from "./data/captures";

import type {
  Capture,
  CaptureType,
  Section,
} from "./types/capture";

import "./App.css";

const sectionHeadings: Record<
  Section,
  { title: string; subtitle: string }
> = {
  "Visão geral": {
    title: "Seu universo de ideias.",
    subtitle: "Um lugar para guardar, explorar e voltar a imaginar.",
  },
  Capturas: {
    title: "Tudo o que você guardou.",
    subtitle: "Fragmentos de pensamento, referências e pequenos achados.",
  },
  Temas: {
    title: "Ideias que se encontram.",
    subtitle: "Explore os fios que conectam suas referências.",
  },
  Resgates: {
    title: "Vamos redescobrir alguma coisa?",
    subtitle: "Ideias antigas ainda podem surpreender você.",
  },
};

const HOME_CAPTURE_LIMIT = 3;

function App() {
  const [activeSection, setActiveSection] =
    useState<Section>("Visão geral");

  const [captures, setCaptures] =
    useState<Capture[]>(initialCaptures);

  const [query, setQuery] = useState("");

  const [activeType, setActiveType] =
    useState<CaptureType | "all">("all");

  const [activeTheme, setActiveTheme] = useState("Todos");

  const [selectedCapture, setSelectedCapture] =
    useState<Capture | null>(null);

  const [showNewCapture, setShowNewCapture] = useState(false);

  const themes = useMemo(
    () => [...new Set(captures.map((capture) => capture.theme))],
    [captures],
  );

  const visibleCaptures = useMemo(() => {
    let results = [...captures];

    if (activeType !== "all") {
      results = results.filter(
        (capture) => capture.type === activeType,
      );
    }

    if (activeSection === "Temas" && activeTheme !== "Todos") {
      results = results.filter(
        (capture) => capture.theme === activeTheme,
      );
    }

    const normalizedQuery = query
      .trim()
      .toLocaleLowerCase("pt-BR");

    if (normalizedQuery) {
      results = results.filter((capture) =>
        [
          capture.title,
          capture.content,
          capture.theme,
          capture.type === "text"
            ? "texto"
            : capture.type === "image"
              ? "imagem"
              : "áudio",
        ]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedQuery),
      );
    }

    if (activeSection === "Resgates") {
      results.sort(
        (a, b) => b.daysUnattended - a.daysUnattended,
      );
    }

    if (activeSection === "Visão geral") {
      results = results.slice(0, HOME_CAPTURE_LIMIT);
    }

    return results;
  }, [captures, activeType, activeSection, activeTheme, query]);

  const forgottenCaptures = useMemo(
    () =>
      [...captures]
        .filter((capture) => capture.daysUnattended >= 30)
        .sort(
          (a, b) => b.daysUnattended - a.daysUnattended,
        )
        .slice(0, 3),
    [captures],
  );

  function handleCreateCapture(title: string, content: string) {
    const newCapture: Capture = {
      id: Math.max(0, ...captures.map((capture) => capture.id)) + 1,
      type: "text",
      title,
      content,
      theme: "Novas ideias",
      age: "Agora",
      daysUnattended: 0,
      accent: "yellow",
    };

    setCaptures((current) => [newCapture, ...current]);
    setShowNewCapture(false);

    setActiveSection("Capturas");
    setActiveType("all");
    setActiveTheme("Todos");
    setQuery("");
  }

  function handleViewLibrary() {
    setActiveSection("Capturas");
    setActiveType("all");
    setActiveTheme("Todos");
  }

  function handleThemeSelect(theme: string) {
    setActiveSection("Temas");
    setActiveTheme(theme);
    setActiveType("all");
  }

  function handleClearFilters() {
    setQuery("");
    setActiveType("all");
    setActiveTheme("Todos");
  }

  const headings = sectionHeadings[activeSection];

  return (
    <div className="echo-app">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onNewCapture={() => setShowNewCapture(true)}
      />

      <main className="workspace">
        <Topbar
          activeSection={activeSection}
          query={query}
          onQueryChange={setQuery}
          onNewCapture={() => setShowNewCapture(true)}
        />

        <div className="page-content">
          {activeSection !== "Visão geral" && (
            <PageHeading
              title={headings.title}
              subtitle={headings.subtitle}
            />
          )}

          {activeSection === "Visão geral" && (
            <WelcomePanel
              onNewCapture={() => setShowNewCapture(true)}
            />
          )}

          {activeSection === "Temas" && (
            <ThemeFilterPanel
              themes={themes}
              activeTheme={activeTheme}
              onThemeChange={setActiveTheme}
            />
          )}

          <CaptureToolbar
            activeSection={activeSection}
            activeType={activeType}
            count={visibleCaptures.length}
            onTypeChange={setActiveType}
            onViewLibrary={handleViewLibrary}
          />

          <CaptureGrid
            captures={visibleCaptures}
            activeSection={activeSection}
            onSelectCapture={setSelectedCapture}
            onClearFilters={handleClearFilters}
          />

          <footer className="workspace-footer">
            <span>Feito para ideias em processo.</span>
          </footer>
        </div>
      </main>

      <RightRail
        captures={captures}
        themes={themes}
        forgottenCaptures={forgottenCaptures}
        onSelectCapture={setSelectedCapture}
        onSectionChange={setActiveSection}
        onThemeSelect={handleThemeSelect}
      />

      {showNewCapture && (
        <NewCaptureModal
          onClose={() => setShowNewCapture(false)}
          onCreate={handleCreateCapture}
        />
      )}

      {selectedCapture && (
        <CaptureDetailModal
          capture={selectedCapture}
          onClose={() => setSelectedCapture(null)}
        />
      )}
    </div>
  );
}

export default App;
