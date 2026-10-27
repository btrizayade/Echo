
import { useMemo, useState } from "react";

import {
  AlertCircle,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

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

import { typeLabels } from "./data/captures";
import { useCaptures } from "./hooks/useCaptures";
import { useThemes } from "./hooks/useThemes";
import { useRescues } from "./hooks/useRescues";

import {
  deleteCapture,
  uploadCaptureAsset,
  type CreateCapturePayload,
} from "./services/api";

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

  const [query, setQuery] = useState("");

  const [activeType, setActiveType] =
    useState<CaptureType | "all">("all");

  const [activeTheme, setActiveTheme] = useState("Todos");

  const [selectedCapture, setSelectedCapture] =
    useState<Capture | null>(null);

  const [showNewCapture, setShowNewCapture] = useState(false);

  const [isRescuing, setIsRescuing] = useState(false);

  const [rescueRecordedId, setRescueRecordedId] =
    useState<number | null>(null);

  const [rescueActionError, setRescueActionError] =
    useState<string | null>(null);

  const {
    captures,
    isLoading,
    error,
    refresh,
    createCapture,
  } = useCaptures();

  const {
    themes: apiThemes,
    isLoading: themesLoading,
    error: themesError,
    refresh: refreshThemes,
  } = useThemes();

  const {
    rescues,
    isLoading: rescuesLoading,
    error: rescuesError,
    refresh: refreshRescues,
    recordRescue,
  } = useRescues(activeSection === "Resgates");

  const themes = useMemo(
    () => apiThemes.map((theme) => theme.name),
    [apiThemes],
  );

  const activeCaptures =
    activeSection === "Resgates" ? rescues : captures;

  const pageLoading =
    activeSection === "Resgates" ? rescuesLoading : isLoading;

  const pageError =
    activeSection === "Resgates" ? rescuesError : error;

  const visibleCaptures = useMemo(() => {
    let results = [...activeCaptures];

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
          typeLabels[capture.type],
        ]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedQuery),
      );
    }

    if (activeSection === "Visão geral") {
      results = results.slice(0, HOME_CAPTURE_LIMIT);
    }

    return results;
  }, [
    activeCaptures,
    activeType,
    activeSection,
    activeTheme,
    query,
  ]);

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

  async function handleCreateCapture(
    payload: CreateCapturePayload,
  ): Promise<Capture> {
    return createCapture(payload);
  }

  async function handleUpload(
    captureId: number,
    file: File,
  ): Promise<void> {
    await uploadCaptureAsset(captureId, file);
  }

  async function handleDeleteCapture(
    captureId: number,
  ): Promise<void> {
    await deleteCapture(captureId);

    setSelectedCapture(null);
    setRescueRecordedId(null);
    setRescueActionError(null);

    void refresh();
    void refreshRescues();
  }

  // Atualiza as capturas, os temas e os resgates após uma edição.
  async function handleCaptureUpdated(): Promise<void> {
    await Promise.all([
      refresh(),
      refreshThemes(),
      refreshRescues(),
    ]);
  }

  function handleCaptureComplete() {
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

  function handleSelectCapture(capture: Capture) {
    setSelectedCapture(capture);
    setRescueRecordedId(null);
    setRescueActionError(null);
  }

  async function handleRecordRescue() {
    if (
      !selectedCapture ||
      isRescuing ||
      rescueRecordedId === selectedCapture.id
    ) {
      return;
    }

    setIsRescuing(true);
    setRescueActionError(null);

    try {
      await recordRescue(selectedCapture.id);
      setRescueRecordedId(selectedCapture.id);
    } catch (requestError) {
      setRescueActionError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível registrar o resgate.",
      );
    } finally {
      setIsRescuing(false);
    }
  }

  const canOfferRescue =
    selectedCapture !== null &&
    activeSection === "Resgates" &&
    (
      rescues.some(
        (capture) => capture.id === selectedCapture.id,
      ) ||
      rescueRecordedId === selectedCapture.id
    );

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
            <>
              <ThemeFilterPanel
                themes={themes}
                activeTheme={activeTheme}
                onThemeChange={setActiveTheme}
              />

              {themesLoading && (
                <p role="status">Carregando temas...</p>
              )}

              {themesError && (
                <div role="alert">
                  <p>
                    Não foi possível carregar os temas: {themesError}
                  </p>

                  <button
                    className="quiet-button"
                    onClick={() => void refreshThemes()}
                  >
                    Tentar novamente <RefreshCw size={14} />
                  </button>
                </div>
              )}
            </>
          )}

          <CaptureToolbar
            activeSection={activeSection}
            activeType={activeType}
            count={visibleCaptures.length}
            onTypeChange={setActiveType}
            onViewLibrary={handleViewLibrary}
          />

          {pageLoading && activeCaptures.length === 0 ? (
            <div className="empty-state" role="status">
              <div className="empty-icon">
                <LoaderCircle size={24} />
              </div>

              <h3>
                {activeSection === "Resgates"
                  ? "Procurando ideias para redescobrir..."
                  : "Carregando suas ideias..."}
              </h3>

              <p>Buscando informações salvas no Echo.</p>
            </div>
          ) : pageError && activeCaptures.length === 0 ? (
            <div className="empty-state" role="alert">
              <div className="empty-icon">
                <AlertCircle size={24} />
              </div>

              <h3>
                {activeSection === "Resgates"
                  ? "Não foi possível carregar os resgates."
                  : "Não foi possível carregar as capturas."}
              </h3>

              <p>{pageError}</p>

              <button
                className="quiet-button"
                onClick={() => {
                  if (activeSection === "Resgates") {
                    void refreshRescues();
                  } else {
                    void refresh();
                  }
                }}
              >
                Tentar novamente <RefreshCw size={14} />
              </button>
            </div>
          ) : (
            <>
              {pageError && (
                <p role="status" className="api-error">
                  Não foi possível concluir a última operação: {pageError}
                </p>
              )}

              <CaptureGrid
                captures={visibleCaptures}
                activeSection={activeSection}
                onSelectCapture={handleSelectCapture}
                onClearFilters={handleClearFilters}
              />
            </>
          )}

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
          onUpload={handleUpload}
          onComplete={handleCaptureComplete}
        />
      )}

      {selectedCapture && (
        <CaptureDetailModal
          capture={selectedCapture}
          onClose={() => setSelectedCapture(null)}
          onDelete={() => handleDeleteCapture(selectedCapture.id)}
          onUpdated={handleCaptureUpdated}
          onRescue={
            canOfferRescue ? handleRecordRescue : undefined
          }
          isRescuing={isRescuing}
          rescueRecorded={
            rescueRecordedId === selectedCapture.id
          }
          rescueError={rescueActionError}
        />
      )}
    </div>
  );
}

export default App;
