import { useState } from "react";
import {
  Compass,
  Tags,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";

export type ThemeItem = {
  id: number;
  name: string;
};

type ThemeFilterPanelProps = {
  themes: ThemeItem[];
  activeTheme: string;
  onThemeChange: (theme: string) => void;
  onRenameTheme: (id: number, name: string) => Promise<void>;
  onDeleteTheme: (id: number) => Promise<void>;
};

export default function ThemeFilterPanel({
  themes,
  activeTheme,
  onThemeChange,
  onRenameTheme,
  onDeleteTheme,
}: ThemeFilterPanelProps) {
  const [isManaging, setIsManaging] = useState(false);

  const [editingThemeId, setEditingThemeId] =
    useState<number | null>(null);

  const [editName, setEditName] = useState("");
  const [savingTheme, setSavingTheme] = useState(false);

  const [deletingThemeId, setDeletingThemeId] =
    useState<number | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] =
    useState<number | null>(null);

  const [actionError, setActionError] =
    useState<string | null>(null);

  function toggleManagement() {
    setIsManaging((current) => !current);
    setEditingThemeId(null);
    setEditName("");
    setConfirmDeleteId(null);
    setActionError(null);
  }

  function startEditing(theme: ThemeItem) {
    setEditingThemeId(theme.id);
    setEditName(theme.name);
    setConfirmDeleteId(null);
    setActionError(null);
  }

  function cancelEditing() {
    setEditingThemeId(null);
    setEditName("");
    setActionError(null);
  }

  async function saveTheme(theme: ThemeItem) {
    const name = editName.trim();

    if (!name) {
      setActionError("O nome do tema não pode ficar vazio.");
      return;
    }

    if (name === theme.name) {
      cancelEditing();
      return;
    }

    setSavingTheme(true);
    setActionError(null);

    try {
      await onRenameTheme(theme.id, name);
      setEditingThemeId(null);
      setEditName("");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Não foi possível renomear o tema.",
      );
    } finally {
      setSavingTheme(false);
    }
  }

  async function deleteTheme(theme: ThemeItem) {
    setDeletingThemeId(theme.id);
    setActionError(null);

    try {
      await onDeleteTheme(theme.id);
      setConfirmDeleteId(null);
      setEditingThemeId(null);
      setEditName("");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o tema.",
      );
    } finally {
      setDeletingThemeId(null);
    }
  }

  return (
    <section
      className={`theme-filter-panel ${
        isManaging ? "is-managing" : ""
      }`}
    >
      <header className="theme-filter-header">
        <div className="theme-filter-heading">
          <p className="eyebrow">SEUS AGRUPAMENTOS</p>

          <h2>
            {isManaging
              ? "Gerenciar temas"
              : "Por onde vamos começar?"}
          </h2>

          {isManaging && (
            <p className="theme-management-description">
              Organize seus agrupamentos, altere nomes ou exclua
              aqueles que não usa mais.
            </p>
          )}
        </div>

        <button
          className={`theme-management-toggle ${
            isManaging ? "is-active" : ""
          }`}
          type="button"
          onClick={toggleManagement}
          aria-label={
            isManaging
              ? "Concluir gerenciamento de temas"
              : "Gerenciar temas"
          }
          title={
            isManaging
              ? "Concluir"
              : "Gerenciar temas"
          }
        >
          {isManaging ? (
            <>
              <Check size={16} />
              <span>Concluir</span>
            </>
          ) : (
            <Pencil size={17} />
          )}
        </button>
      </header>

      {!isManaging ? (
        <div className="theme-pills">
          <button
            className={`theme-pill ${
              activeTheme === "Todos" ? "selected" : ""
            }`}
            onClick={() => onThemeChange("Todos")}
            aria-pressed={activeTheme === "Todos"}
            type="button"
          >
            <Compass size={14} />
            Todos
          </button>

          {themes.map((theme) => (
            <button
              key={theme.id}
              className={`theme-pill ${
                activeTheme === theme.name ? "selected" : ""
              }`}
              onClick={() => onThemeChange(theme.name)}
              aria-pressed={activeTheme === theme.name}
              type="button"
            >
              <Tags size={14} />
              {theme.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="theme-management-list">
          {themes.length === 0 ? (
            <p className="theme-management-empty">
              Você ainda não tem temas cadastrados.
            </p>
          ) : (
            themes.map((theme) => (
              <div
                className="theme-management-item"
                key={theme.id}
              >
                <div className="theme-management-row">
                  <div className="theme-management-item-main">
                    <Tags
                      size={16}
                      aria-hidden="true"
                    />

                    <span className="theme-management-item-name">
                      {theme.name}
                    </span>
                  </div>

                  <div className="theme-management-actions">
                    <button
                      className="theme-management-button"
                      type="button"
                      aria-label={`Editar tema ${theme.name}`}
                      title="Editar tema"
                      disabled={
                        savingTheme ||
                        deletingThemeId !== null
                      }
                      onClick={() => startEditing(theme)}
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      className="theme-management-button"
                      type="button"
                      aria-label={`Excluir tema ${theme.name}`}
                      title="Excluir tema"
                      disabled={
                        savingTheme ||
                        deletingThemeId !== null
                      }
                      onClick={() => {
                        setConfirmDeleteId(theme.id);
                        setEditingThemeId(null);
                        setEditName("");
                        setActionError(null);
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {editingThemeId === theme.id && (
                  <div className="theme-inline-editor">
                    <label htmlFor={`theme-name-${theme.id}`}>
                      Nome do tema
                    </label>

                    <input
                      id={`theme-name-${theme.id}`}
                      value={editName}
                      onChange={(event) =>
                        setEditName(event.target.value)
                      }
                      maxLength={100}
                      autoFocus
                      disabled={savingTheme}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void saveTheme(theme);
                        }

                        if (event.key === "Escape") {
                          cancelEditing();
                        }
                      }}
                    />

                    <div className="theme-inline-actions">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={savingTheme}
                      >
                        <X size={14} />
                        Cancelar
                      </button>

                      <button
                        type="button"
                        onClick={() => void saveTheme(theme)}
                        disabled={savingTheme}
                      >
                        <Check size={14} />
                        {savingTheme
                          ? "Salvando..."
                          : "Salvar"}
                      </button>
                    </div>
                  </div>
                )}

                {confirmDeleteId === theme.id && (
                  <div className="theme-inline-editor">
                    <p>
                      Excluir o tema "{theme.name}"? As ideias serão
                      mantidas, mas perderão a associação com este tema.
                    </p>

                    <div className="theme-inline-actions">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={deletingThemeId === theme.id}
                      >
                        <X size={14} />
                        Cancelar
                      </button>

                      <button
                        type="button"
                        onClick={() => void deleteTheme(theme)}
                        disabled={deletingThemeId === theme.id}
                      >
                        <Trash2 size={14} />
                        {deletingThemeId === theme.id
                          ? "Excluindo..."
                          : "Confirmar exclusão"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {actionError && (
        <p
          className="theme-management-error"
          role="alert"
        >
          {actionError}
        </p>
      )}
    </section>
  );
}