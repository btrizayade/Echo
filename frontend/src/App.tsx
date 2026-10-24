
import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  AudioLines,
  Bookmark,
  Clock3,
  Compass,
  FileText,
  Headphones,
  Image as ImageIcon,
  LayoutDashboard,
  Lightbulb,
  Plus,
  Search,
  Sparkles,
  Tags,
  X,
  type LucideIcon,
} from "lucide-react";
import echoLogo from "./assets/echo-logo.png";
import "./App.css";

type Section = "Visão geral" | "Capturas" | "Temas" | "Resgates";
type CaptureType = "text" | "image" | "audio";

type Capture = {
  id: number;
  type: CaptureType;
  title: string;
  content: string;
  theme: string;
  age: string;
  daysUnattended: number;
  accent: string;
};

const initialCaptures: Capture[] = [
  {
    id: 1,
    type: "text",
    title: "Uma cidade que muda com o clima",
    content:
      "E se a arquitetura de uma cidade se transformasse de acordo com o estado emocional de quem vive nela?",
    theme: "Mundos",
    age: "Hoje",
    daysUnattended: 18,
    accent: "yellow",
  },
  {
    id: 2,
    type: "image",
    title: "Paleta para um projeto pessoal",
    content:
      "Luz suave, amarelo-dourado, formas orgânicas e um pouco de nostalgia.",
    theme: "Referências",
    age: "Ontem",
    daysUnattended: 12,
    accent: "coral",
  },
  {
    id: 3,
    type: "audio",
    title: "Chuva batendo na janela",
    content: "Gravação de ambiente · 00:18",
    theme: "Atmosferas",
    age: "Há 3 dias",
    daysUnattended: 23,
    accent: "blue",
  },
  {
    id: 4,
    type: "text",
    title: "Uma personagem que coleciona despedidas",
    content:
      "Ela guarda objetos pequenos de cada pessoa que conheceu, mas nunca lembra exatamente quando se separaram.",
    theme: "Personagens",
    age: "Há 5 dias",
    daysUnattended: 42,
    accent: "green",
  },
  {
    id: 5,
    type: "image",
    title: "Texturas de papel e tinta",
    content:
      "Referência visual para experimentar camadas, grão e imperfeições.",
    theme: "Referências",
    age: "Há 1 semana",
    daysUnattended: 31,
    accent: "pink",
  },
  {
    id: 6,
    type: "audio",
    title: "Ritmo para uma cena noturna",
    content: "Nota de voz · 00:32",
    theme: "Atmosferas",
    age: "Há 2 semanas",
    daysUnattended: 38,
    accent: "lavender",
  },
];

const navigation: { label: Section; icon: LucideIcon }[] = [
  { label: "Visão geral", icon: LayoutDashboard },
  { label: "Capturas", icon: Bookmark },
  { label: "Temas", icon: Tags },
  { label: "Resgates", icon: Sparkles },
];

const sectionHeadings: Record<Section, { title: string; subtitle: string }> = {
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

const typeLabels: Record<CaptureType, string> = {
  text: "Texto",
  image: "Imagem",
  audio: "Áudio",
};

const typeIcons: Record<CaptureType, LucideIcon> = {
  text: FileText,
  image: ImageIcon,
  audio: AudioLines,
};

function CaptureVisual({ capture }: { capture: Capture }) {
  if (capture.type === "audio") {
    const bars = [12, 22, 15, 30, 19, 36, 24, 13, 29, 18, 34, 15, 25, 11, 21, 30, 16];

    return (
      <div className={`capture-visual visual-${capture.accent}`}>
        <div className="audio-art">
          <div className="audio-disc">
            <AudioLines size={28} strokeWidth={1.8} />
          </div>
          <div className="waveform" aria-label="Ilustração de onda sonora">
            {bars.map((height, index) => (
              <i
                key={index}
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
          <span className="visual-caption">FRAGMENTO SONORO</span>
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
          <ImageIcon className="art-icon" size={24} strokeWidth={1.7} />
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
        <span className="paper-kicker">ANOTAÇÃO LIVRE</span>
        <span className="paper-line line-long" />
        <span className="paper-line line-medium" />
        <span className="paper-line line-short" />
        <span className="paper-doodle">✳</span>
      </div>
    </div>
  );
}

function App() {
  const [activeSection, setActiveSection] = useState<Section>("Visão geral");
  const [captures, setCaptures] = useState(initialCaptures);
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<CaptureType | "all">("all");
  const [activeTheme, setActiveTheme] = useState("Todos");
  const [selectedCapture, setSelectedCapture] = useState<Capture | null>(null);
  const [showNewCapture, setShowNewCapture] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");

  const headings = sectionHeadings[activeSection];

  const themes = useMemo(
    () => [...new Set(captures.map((capture) => capture.theme))],
    [captures],
  );

  const visibleCaptures = useMemo(() => {
    let results = [...captures];

    if (activeType !== "all") {
      results = results.filter((capture) => capture.type === activeType);
    }

    if (activeSection === "Temas" && activeTheme !== "Todos") {
      results = results.filter((capture) => capture.theme === activeTheme);
    }

    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

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

    if (activeSection === "Resgates") {
      results.sort((a, b) => b.daysUnattended - a.daysUnattended);
    }

    if (activeSection === "Visão geral") {
      results = results.slice(0, 3);
    }

    return results;
  }, [captures, activeType, activeSection, activeTheme, query]);

  function handleCreateCapture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = draftTitle.trim();

    if (!cleanTitle) return;

    const newCapture: Capture = {
      id: Math.max(0, ...captures.map((capture) => capture.id)) + 1,
      type: "text",
      title: cleanTitle,
      content: draftContent.trim(),
      theme: "Novas ideias",
      age: "Agora",
      daysUnattended: 0,
      accent: "yellow",
    };

    setCaptures((current) => [newCapture, ...current]);
    setDraftTitle("");
    setDraftContent("");
    setShowNewCapture(false);
    setActiveSection("Capturas");
    setActiveType("all");
    setActiveTheme("Todos");
    setQuery("");
  }

  const forgottenCaptures = [...captures]
    .filter((capture) => capture.daysUnattended >= 30)
    .sort((a, b) => b.daysUnattended - a.daysUnattended)
    .slice(0, 3);

  return (
    <div className="echo-app">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => setActiveSection("Visão geral")}
          aria-label="Voltar para a visão geral do Echo"
        >
          <img
            src={echoLogo}
            alt="Echo"
            className="brand-logo"
          />
        </button>

        <p className="sidebar-caption">SEU WORKBENCH CRIATIVO</p>

        <nav className="main-nav" aria-label="Navegação principal">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.label;

            return (
              <button
                key={item.label}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setActiveSection(item.label)}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={18} strokeWidth={1.9} />
                <span>{item.label}</span>
                {item.label === "Resgates" && (
                  <span className="nav-spark">✳</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-note">
          <div className="note-star">
            <Lightbulb size={25} />
          </div>
          <p className="eyebrow">UM LEMBRETE</p>
          <p className="note-copy">
            Nem toda ideia precisa estar pronta para merecer espaço.
          </p>
          <button
            className="text-button"
            onClick={() => setShowNewCapture(true)}
          >
            Guarde um fragmento <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="profile-avatar">E</div>
          <div className="profile-info">
            <strong>Seu espaço</strong>
            <span>Local e pessoal</span>
          </div>
          <span className="local-dot" title="Demonstração local" />
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Echo</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{activeSection}</strong>
          </div>

          <label className="search-box">
            <Search size={18} />
            <input
              aria-label="Buscar ideias"
              placeholder="Procure uma ideia, tema ou fragmento..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <kbd>⌘ K</kbd>
          </label>

          <button
            className="topbar-add"
            onClick={() => setShowNewCapture(true)}
          >
            <Plus size={17} />
            <span>Nova ideia</span>
          </button>
        </header>

        <div className="page-content">
          {activeSection !== "Visão geral" && (
            <div className="page-heading">
              <div>
                <p className="eyebrow">UM ESPAÇO PARA EXPLORAR</p>
                <h1>{headings.title}</h1>
                <p className="page-subtitle">{headings.subtitle}</p>
              </div>
              <span className="heading-doodle" aria-hidden="true">
                ✳
              </span>
            </div>
          )}

          {activeSection === "Visão geral" && (
            <section className="welcome-panel">
              <div className="welcome-copy">
                <h2>Ideias não precisam nascer prontas.</h2>
                <p>
                  Guarde o fragmento. Faça conexões. Volte a ele quando quiser.
                </p>
                <button
                  className="welcome-button"
                  onClick={() => setShowNewCapture(true)}
                >
                  Registrar uma ideia <ArrowUpRight size={16} />
                </button>
              </div>
            </section>
          )}

          {activeSection === "Temas" && (
            <section className="theme-filter-panel">
              <div>
                <p className="eyebrow">SEUS AGRUPAMENTOS</p>
                <h2>Por onde vamos começar?</h2>
              </div>
              <div className="theme-pills">
                {["Todos", ...themes].map((theme) => (
                  <button
                    key={theme}
                    className={`theme-pill ${activeTheme === theme ? "selected" : ""}`}
                    onClick={() => setActiveTheme(theme)}
                  >
                    {theme === "Todos" ? <Compass size={14} /> : <Tags size={14} />}
                    {theme}
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="section-toolbar">
            <div>
              <p className="eyebrow">
                {activeSection === "Resgates"
                  ? "ESPERANDO POR VOCÊ"
                  : activeSection === "Temas"
                    ? "FRAGMENTOS RELACIONADOS"
                    : activeSection === "Capturas"}
              </p>
              <h2>
                {activeSection === "Resgates"
                  ? "Hora de redescobrir"
                  : activeSection === "Temas"
                    ? "Ideias nesse tema"
                    : activeSection === "Capturas"
                      ? "Todas as capturas"
                      : "Fragmentos recentes"}
                <span className="count-badge">{visibleCaptures.length}</span>
              </h2>
            </div>
            <button
              className="quiet-button"
              onClick={() => {
                setActiveSection("Capturas");
                setActiveType("all");
                setActiveTheme("Todos");
              }}
            >
              Ver biblioteca <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="format-filters" aria-label="Filtrar por formato">
            {[
              { value: "all" as const, label: "Tudo", icon: LayersIcon },
              { value: "text" as const, label: "Textos", icon: FileText },
              { value: "image" as const, label: "Imagens", icon: ImageIcon },
              { value: "audio" as const, label: "Áudios", icon: Headphones },
            ].map((filter) => {
              const Icon = filter.icon;

              return (
                <button
                  key={filter.value}
                  className={`format-chip ${activeType === filter.value ? "selected" : ""}`}
                  onClick={() => setActiveType(filter.value)}
                >
                  <Icon size={15} />
                  {filter.label}
                </button>
              );
            })}
            <span className="filter-hint">
              <Clock3 size={13} /> Suas ideias, no seu tempo
            </span>
          </div>

          {visibleCaptures.length > 0 ? (
            <div className="capture-grid">
              {visibleCaptures.map((capture, index) => {
                const TypeIcon = typeIcons[capture.type];

                return (
                  <button
                    key={capture.id}
                    className="capture-card"
                    onClick={() => setSelectedCapture(capture)}
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
                        {capture.content || "Um fragmento à espera de novas conexões."}
                      </p>
                      <div className="card-bottom">
                        <span className="theme-tag">{capture.theme}</span>
                        <span className="card-open">
                          <ArrowUpRight size={15} />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><Search size={24} /></div>
              <h3>Nenhum fragmento por aqui.</h3>
              <p>Tente outro termo ou escolha um formato diferente.</p>
              <button
                className="quiet-button"
                onClick={() => {
                  setQuery("");
                  setActiveType("all");
                  setActiveTheme("Todos");
                }}
              >
                Limpar filtros <X size={14} />
              </button>
            </div>
          )}

          <footer className="workspace-footer">
            <span> Feito para ideias em processo.</span>
          </footer>
        </div>
      </main>

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
            <span className="resurface-icon"><Sparkles size={17} /></span>
            <span className="eyebrow">REDESCOBRIR</span>
          </div>
          <h3>O que ficou esperando?</h3>
          <p>
            Algumas ideias merecem uma segunda olhada. Sem pressa, sem cobrança.
          </p>

          <div className="resurface-list">
            {forgottenCaptures.slice(0, 2).map((capture) => {
              const Icon = typeIcons[capture.type];

              return (
                <button
                  key={capture.id}
                  className="resurface-item"
                  onClick={() => setSelectedCapture(capture)}
                >
                  <span className={`resurface-mini mini-${capture.accent}`}>
                    <Icon size={17} />
                  </span>
                  <span className="resurface-info">
                    <strong>{capture.title}</strong>
                    <small>Há {capture.daysUnattended} dias sem atenção</small>
                  </span>
                  <ArrowUpRight size={15} />
                </button>
              );
            })}
          </div>

          <button
            className="resurface-button"
            onClick={() => setActiveSection("Resgates")}
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
              onClick={() => setActiveSection("Temas")}
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
                onClick={() => {
                  setActiveSection("Temas");
                  setActiveTheme(theme);
                  setActiveType("all");
                }}
              >
                <span className={`theme-dot dot-${index % 4}`}>
                  {["✳", "○", "↗", "✦"][index % 4]}
                </span>
                <span>{theme}</span>
                <small>{String(themeCounts).padStart(2, "0")}</small>
              </button>
            );
          })}
        </section>


        <div className="rail-local">
          <span className="local-dot" />
          Seus fragmentos ficam no seu espaço
        </div>
      </aside>

      {showNewCapture && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowNewCapture(false);
            }
          }}
        >
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-capture-heading"
          >
            <div className="modal-top">
              <span className="modal-icon"><Lightbulb size={22} /></span>
              <button
                className="icon-button"
                onClick={() => setShowNewCapture(false)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            <p className="eyebrow">UM NOVO FRAGMENTO</p>
            <h2 id="new-capture-heading">Tire a ideia da cabeça.</h2>
            <p className="modal-description">
              Não precisa estar pronta. Registre o que você tem agora.
            </p>
            <form onSubmit={handleCreateCapture}>
              <label htmlFor="capture-title">Como você chamaria essa ideia?</label>
              <input
                id="capture-title"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                placeholder="Um título provisório..."
                maxLength={180}
                required
                autoFocus
              />
              <label htmlFor="capture-content">O que você quer guardar? <span>opcional</span></label>
              <textarea
                id="capture-content"
                value={draftContent}
                onChange={(event) => setDraftContent(event.target.value)}
                placeholder="Um pensamento, uma pergunta, um fragmento..."
                rows={4}
              />
              <p className="demo-notice">
                <Lightbulb size={14} />
                Esta demonstração ainda não salva no banco de dados.
              </p>
              <button className="modal-submit" type="submit">
                Adicionar à demonstração <ArrowUpRight size={16} />
              </button>
            </form>
          </section>
        </div>
      )}

      {selectedCapture && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCapture(null);
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
              <span className="modal-icon"><Bookmark size={22} /></span>
              <button
                className="icon-button"
                onClick={() => setSelectedCapture(null)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            <p className="eyebrow">FRAGMENTO #{String(selectedCapture.id).padStart(3, "0")}</p>
            <div className="detail-visual">
              <CaptureVisual capture={selectedCapture} />
            </div>
            <span className={`type-label type-${selectedCapture.type}`}>
              {typeLabels[selectedCapture.type]}
            </span>
            <h2 id="detail-heading">{selectedCapture.title}</h2>
            <p className="detail-content">
              {selectedCapture.content || "Nenhuma anotação textual associada."}
            </p>
            <div className="detail-footer">
              <span className="theme-tag"><Tags size={13} /> {selectedCapture.theme}</span>
              <span><Clock3 size={14} /> {selectedCapture.age}</span>
            </div>
            <p className="demo-notice">
              Os cartões são amostras visuais. Upload e persistência serão ligados à API na próxima etapa.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

function LayersIcon(props: { size?: number }) {
  return <Compass {...props} />;
}

export default App;
