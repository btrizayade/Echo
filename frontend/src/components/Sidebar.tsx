
import {
  ArrowUpRight,
  Bookmark,
  LayoutDashboard,
  Lightbulb,
  Sparkles,
  Tags,
  type LucideIcon,
} from "lucide-react";

import echoLogo from "../assets/echo-logo.png";
import type { Section } from "../types/capture";

type SidebarProps = {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  onNewCapture: () => void;
};

const navigation: { label: Section; icon: LucideIcon }[] = [
  { label: "Visão geral", icon: LayoutDashboard },
  { label: "Capturas", icon: Bookmark },
  { label: "Temas", icon: Tags },
  { label: "Resgates", icon: Sparkles },
];

export default function Sidebar({
  activeSection,
  onSectionChange,
  onNewCapture,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <button
        className="brand"
        onClick={() => onSectionChange("Visão geral")}
        aria-label="Voltar para a visão geral do Echo"
      >
        <img
          src={echoLogo}
          alt="Echo"
          className="brand-logo"
        />
      </button>

      <p className="sidebar-caption">SEU WORKBENCH CRIATIVO</p>

      <nav
        className="main-nav"
        aria-label="Navegação principal"
      >
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.label;

          return (
            <button
              key={item.label}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => onSectionChange(item.label)}
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
          onClick={onNewCapture}
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

        <span
          className="local-dot"
          title="Demonstração local"
        />
      </div>
    </aside>
  );
}
