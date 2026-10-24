
import { Plus, Search } from "lucide-react";

import type { Section } from "../types/capture";

type TopbarProps = {
  activeSection: Section;
  query: string;
  onQueryChange: (query: string) => void;
  onNewCapture: () => void;
};

export default function Topbar({
  activeSection,
  query,
  onQueryChange,
  onNewCapture,
}: TopbarProps) {
  return (
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
          onChange={(event) => onQueryChange(event.target.value)}
        />

        <kbd>⌘ K</kbd>
      </label>

      <button className="topbar-add" onClick={onNewCapture}>
        <Plus size={17} />
        <span>Nova ideia</span>
      </button>
    </header>
  );
}
