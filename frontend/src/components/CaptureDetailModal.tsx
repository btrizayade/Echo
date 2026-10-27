
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  AudioLines,
  Bookmark,
  Check,
  Clock3,
  Pencil,
  Plus,
  Tags,
  Trash2,
  X,
} from "lucide-react";

import { CaptureVisual } from "./CaptureVisual";
import { typeLabels } from "../data/captures";
import type { Capture } from "../types/capture";
import {
  createTheme,
  getCapture,
  listCaptureAssets,
  listThemes,
  getAssetFileUrl,
  updateCapture,
  type ApiTheme,
  type UpdateCapturePayload,
} from "../services/api";

type CaptureDetailModalProps = {
  capture: Capture;
  onClose: () => void;
  onRescue?: () => void;
  isRescuing?: boolean;
  rescueRecorded?: boolean;
  rescueError?: string | null;
  onDelete?: () => Promise<void>;
  onUpdated?: () => Promise<void> | void;
};

export default function CaptureDetailModal({
  capture,
  onClose,
  onRescue,
  onDelete,
  onUpdated,
  isRescuing = false,
  rescueRecorded = false,
  rescueError = null,
}: CaptureDetailModalProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [availableThemes, setAvailableThemes] = useState<ApiTheme[]>([]);
  const [selectedThemeIds, setSelectedThemeIds] = useState<number[]>([]);

  const [editTitle, setEditTitle] = useState(capture.title);
  const [editContent, setEditContent] = useState(capture.content);

  const [displayTitle, setDisplayTitle] = useState(capture.title);
  const [displayContent, setDisplayContent] = useState(capture.content);
  const [displayTheme, setDisplayTheme] = useState(capture.theme);

  const [newThemeName, setNewThemeName] = useState("");
  const [isCreatingTheme, setIsCreatingTheme] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  async function handleDelete() {
    if (!onDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await onDelete();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir esta ideia.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleStartEditing() {
    setIsLoadingEdit(true);
    setEditError(null);

    try {
      const [themes, latestCapture] = await Promise.all([
        listThemes(),
        getCapture(capture.id),
      ]);

      setAvailableThemes(themes);
      setSelectedThemeIds(
        latestCapture.themes.map((theme) => theme.id),
      );

      setEditTitle(latestCapture.title);
      setEditContent(latestCapture.content);
      setDisplayTitle(latestCapture.title);
      setDisplayContent(latestCapture.content);
      setDisplayTheme(
        latestCapture.themes.map((theme) => theme.name).join(", ") ||
          "Sem tema",
      );

      setNewThemeName("");
      setIsEditing(true);
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os dados para edição.",
      );
    } finally {
      setIsLoadingEdit(false);
    }
  }

  function handleCancelEditing() {
    setEditTitle(displayTitle);
    setEditContent(displayContent);
    setNewThemeName("");
    setEditError(null);
    setIsEditing(false);
  }

  function toggleTheme(themeId: number, checked: boolean) {
    setSelectedThemeIds((current) =>
      checked
        ? current.includes(themeId)
          ? current
          : [...current, themeId]
        : current.filter((id) => id !== themeId),
    );
  }

  async function handleCreateTheme() {
    const name = newThemeName.trim();

    if (!name) {
      setEditError("Digite um nome para o novo tema.");
      return;
    }

    const existingTheme = availableThemes.find(
      (theme) => theme.name.toLocaleLowerCase("pt-BR") ===
        name.toLocaleLowerCase("pt-BR"),
    );

    if (existingTheme) {
      setSelectedThemeIds((current) =>
        current.includes(existingTheme.id)
          ? current
          : [...current, existingTheme.id],
      );
      setNewThemeName("");
      setEditError(null);
      return;
    }

    setIsCreatingTheme(true);
    setEditError(null);

    try {
      const createdTheme = await createTheme(name);

      setAvailableThemes((current) =>
        current.some((theme) => theme.id === createdTheme.id)
          ? current
          : [...current, createdTheme],
      );

      setSelectedThemeIds((current) =>
        current.includes(createdTheme.id)
          ? current
          : [...current, createdTheme.id],
      );

      setNewThemeName("");
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o tema.",
      );
    } finally {
      setIsCreatingTheme(false);
    }
  }

  async function handleSaveEdit() {
    const title = editTitle.trim();
    const content = editContent.trim();

    if (!title) {
      setEditError("O título não pode ficar vazio.");
      return;
    }

    if (capture.type === "text" && !content) {
      setEditError("Capturas de texto precisam ter conteúdo.");
      return;
    }

    if (!content && displayContent.trim()) {
      setEditError(
        "O conteúdo não pode ficar vazio. Mantenha algum texto ou restaure o conteúdo original.",
      );
      return;
    }

    const payload: UpdateCapturePayload = {
      title,
      theme_ids: selectedThemeIds,
    };

    if (content) {
      payload.content = content;
    }

    setIsSavingEdit(true);
    setEditError(null);

    try {
      const updated = await updateCapture(capture.id, payload);

      setDisplayTitle(updated.title);
      setDisplayContent(updated.content);
      setDisplayTheme(
        updated.themes.map((theme) => theme.name).join(", ") ||
          "Sem tema",
      );

      setEditTitle(updated.title);
      setEditContent(updated.content);
      setIsEditing(false);

      await onUpdated?.();
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar as alterações.",
      );
    } finally {
      setIsSavingEdit(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    setAudioUrl(null);
    setAudioError(false);

    if (capture.type !== "audio") {
      setAudioLoading(false);

      return () => {
        cancelled = true;
      };
    }

    setAudioLoading(true);

    async function loadAudio() {
      try {
        const assets = await listCaptureAssets(capture.id);

        const audioAsset = assets.find(
          (asset) => asset.media_type === "audio",
        );

        if (!cancelled) {
          if (audioAsset) {
            setAudioUrl(getAssetFileUrl(audioAsset));
          } else {
            setAudioError(true);
          }
        }
      } catch (error) {
        console.error(
          "Não foi possível carregar o áudio da captura:",
          error,
        );

        if (!cancelled) {
          setAudioError(true);
        }
      } finally {
        if (!cancelled) {
          setAudioLoading(false);
        }
      }
    }

    void loadAudio();

    return () => {
      cancelled = true;
    };
  }, [capture.id, capture.type]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
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
          <span className="modal-icon">
            <Bookmark size={22} />
          </span>

          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Fechar"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <p className="eyebrow">
          FRAGMENTO #{String(capture.id).padStart(3, "0")}
        </p>

        <div className="detail-visual">
          {capture.type === "audio" ? (
            <div
              className={`capture-visual visual-${capture.accent}`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                width: "100%",
                height: "100%",
                minHeight: 160,
                padding: 16,
                boxSizing: "border-box",
              }}
            >
              <AudioLines size={30} strokeWidth={1.8} />

              <span className="visual-caption">
                {audioUrl ? "ÁUDIO SALVO" : "FRAGMENTO SONORO"}
              </span>

              {audioUrl ? (
                <audio
                  controls
                  preload="metadata"
                  src={audioUrl}
                  aria-label={`Reproduzir áudio: ${displayTitle}`}
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: 360,
                  }}
                >
                  Seu navegador não suporta a reprodução de áudio.
                </audio>
              ) : (
                <p className="demo-notice" role="status">
                  {audioLoading
                    ? "Carregando áudio..."
                    : audioError
                      ? "Não foi possível localizar ou carregar o arquivo de áudio."
                      : "Nenhum arquivo de áudio disponível."}
                </p>
              )}
            </div>
          ) : (
            <CaptureVisual capture={capture} />
          )}
        </div>

        <span className={`type-label type-${capture.type}`}>
          {typeLabels[capture.type]}
        </span>

        {isEditing ? (
          <div className="capture-edit-form">
            <h2 id="detail-heading">Editar ideia</h2>

            <label className="capture-field-label">
              Título

              <input
                className="capture-edit-input"
                type="text"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                maxLength={180}
                required
              />
            </label>

            <label className="capture-field-label">
              Conteúdo ou contexto

              <textarea
                className="capture-edit-textarea"
                value={editContent}
                onChange={(event) => setEditContent(event.target.value)}
                required={capture.type === "text"}
                rows={5}
              />
            </label>

            <fieldset className="capture-edit-themes">
              <legend>Temas</legend>

              {availableThemes.length === 0 ? (
                <p>Nenhum tema cadastrado. Crie um abaixo.</p>
              ) : (
                availableThemes.map((theme) => (
                  <label
                    className="capture-edit-theme-option"
                    key={theme.id}
                  >
                    <input
                      type="checkbox"
                      checked={selectedThemeIds.includes(theme.id)}
                      onChange={(event) =>
                        toggleTheme(theme.id, event.target.checked)
                      }
                    />

                    {theme.name}
                  </label>
                ))
              )}

              <div className="capture-new-theme">
                <label
                  className="capture-field-label"
                  htmlFor="new-theme-name"
                >
                  Criar novo tema
                </label>

                <div className="capture-new-theme-controls">
                  <input
                    id="new-theme-name"
                    className="capture-edit-input capture-new-theme-input"
                    type="text"
                    value={newThemeName}
                    onChange={(event) =>
                      setNewThemeName(event.target.value)
                    }
                    placeholder="Ex.: Inspiração, Estudos..."
                    maxLength={100}
                    disabled={isCreatingTheme || isSavingEdit}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleCreateTheme();
                      }
                    }}
                  />

                  <button
                    className="capture-new-theme-button"
                    type="button"
                    onClick={() => void handleCreateTheme()}
                    disabled={
                      isCreatingTheme ||
                      isSavingEdit ||
                      !newThemeName.trim()
                    }
                  >
                    <Plus size={16} />
                    {isCreatingTheme ? "Criando..." : "Criar"}
                  </button>
                </div>
              </div>
            </fieldset>

            {editError && (
              <p className="demo-notice" role="alert">
                {editError}
              </p>
            )}

            <div className="capture-edit-actions">
              <button
                className="delete-cancel-button"
                type="button"
                onClick={handleCancelEditing}
                disabled={isSavingEdit || isCreatingTheme}
              >
                Cancelar
              </button>

              <button
                className="modal-submit"
                type="button"
                onClick={() => void handleSaveEdit()}
                disabled={
                  isSavingEdit ||
                  isLoadingEdit ||
                  isCreatingTheme
                }
              >
                {isSavingEdit ? (
                  "Salvando..."
                ) : (
                  <>
                    <Check size={16} />
                    Salvar alterações
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 id="detail-heading">{displayTitle}</h2>

            <p className="detail-content">
              {displayContent || "Nenhuma anotação textual associada."}
            </p>

            <div className="detail-footer">
              <span className="theme-tag">
                <Tags size={13} />
                {displayTheme}
              </span>

              <span>
                <Clock3 size={14} />
                {capture.age}
              </span>
            </div>

            <div className="capture-edit-entry">
              <button
                className="modal-submit"
                type="button"
                onClick={() => void handleStartEditing()}
                disabled={isLoadingEdit}
              >
                {isLoadingEdit ? (
                  "Carregando..."
                ) : (
                  <>
                    <Pencil size={16} />
                    Editar ideia
                  </>
                )}
              </button>

              {editError && (
                <p className="demo-notice" role="alert">
                  {editError}
                </p>
              )}
            </div>
          </>
        )}

        {!isEditing && onDelete && (
          <div className="delete-capture-section">
            {confirmDelete ? (
              <div className="delete-capture-confirmation">
                <p>
                  Excluir esta ideia permanentemente? Os arquivos de mídia
                  associados também serão removidos.
                </p>

                <div className="delete-capture-actions">
                  <button
                    type="button"
                    className="delete-cancel-button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={isDeleting}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="delete-confirm-button"
                    onClick={() => void handleDelete()}
                    disabled={isDeleting}
                  >
                    <Trash2 size={16} />
                    {isDeleting
                      ? "Excluindo..."
                      : "Excluir definitivamente"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="delete-capture-button"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={16} />
                Excluir ideia
              </button>
            )}

            {deleteError && (
              <p className="demo-notice" role="alert">
                Não foi possível excluir: {deleteError}
              </p>
            )}
          </div>
        )}

        {!isEditing && onRescue && (
          <div className="rescue-action">
            {rescueRecorded ? (
              <p className="demo-notice" role="status">
                Resgate registrado. Esta ideia ficará em pausa
                durante o período de cooldown.
              </p>
            ) : (
              <>
                <button
                  className="modal-submit"
                  type="button"
                  onClick={onRescue}
                  disabled={isRescuing}
                >
                  {isRescuing
                    ? "Registrando resgate..."
                    : "Resgatar esta ideia"}

                  <ArrowUpRight size={16} />
                </button>

                <p className="demo-notice">
                  Só registre o resgate quando decidir que quer
                  revisitar esta ideia agora.
                </p>
              </>
            )}

            {rescueError && (
              <p className="demo-notice" role="alert">
                Não foi possível registrar o resgate: {rescueError}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
