import { useState, type FormEvent } from "react";

import {
  ArrowUpRight,
  AudioLines,
  Check,
  FileText,
  Image as ImageIcon,
  Lightbulb,
  Upload,
  X,
  Tags,
} from "lucide-react";

import type {
  ApiTheme,
  CreateCapturePayload,
} from "../services/api";

import type { Capture, CaptureType } from "../types/capture";

type NewCaptureModalProps = {
  onClose: () => void;
  onCreate: (payload: CreateCapturePayload) => Promise<Capture>;
  onUpload: (captureId: number, file: File) => Promise<void>;
  onComplete: () => void;
  themes: ApiTheme[];
  themesLoading: boolean;
};

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const FILE_ACCEPT = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  audio:
    ".mp3,.mpeg,.wav,.ogg,.m4a,.mp4,audio/mpeg,audio/wav,audio/x-wav,audio/ogg,audio/mp4",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível salvar a captura.";
}

export default function NewCaptureModal({
  onClose,
  onCreate,
  onUpload,
  onComplete,
  themes,
  themesLoading,
}: NewCaptureModalProps) {
  const [draftType, setDraftType] = useState<CaptureType>("text");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [selectedThemeIds, setSelectedThemeIds] = useState<number[]>([]);

  const [pendingCaptureId, setPendingCaptureId] = useState<number | null>(
    null,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isMediaType = draftType !== "text";
  const isTypeLocked = isSubmitting || pendingCaptureId !== null;

  function handleTypeChange(type: CaptureType) {
    if (isTypeLocked) return;

    setDraftType(type);
    setSelectedFile(null);
    setSubmitError(null);
  }

  function handleThemeToggle(themeId: number) {
    if (isTypeLocked) return;

    setSelectedThemeIds((current) =>
      current.includes(themeId)
        ? current.filter((id) => id !== themeId)
        : [...current, themeId],
    );

    setSubmitError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const cleanTitle = draftTitle.trim();
    const cleanContent = draftContent.trim();

    if (!cleanTitle) {
      setSubmitError("Informe um título para a captura.");
      return;
    }

    if (draftType === "text" && !cleanContent) {
      setSubmitError("Escreva o conteúdo da sua ideia.");
      return;
    }

    if (
      isMediaType &&
      pendingCaptureId === null &&
      !selectedFile
    ) {
      setSubmitError(
        draftType === "image"
          ? "Selecione uma imagem para continuar."
          : "Selecione um arquivo de áudio para continuar.",
      );
      return;
    }

    if (selectedFile && selectedFile.size > MAX_FILE_SIZE) {
      setSubmitError("O arquivo deve ter no máximo 25 MB.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    let captureId = pendingCaptureId;

    try {
      if (captureId === null) {
        const payload: CreateCapturePayload = {
          type: draftType,
          title: cleanTitle,
          theme_ids: selectedThemeIds,
          ...(cleanContent ? { content: cleanContent } : {}),
        };

        const createdCapture = await onCreate(payload);

        captureId = createdCapture.id;
        setPendingCaptureId(captureId);
      }

      if (draftType !== "text") {
        if (!selectedFile) {
          setSubmitError("Selecione o arquivo que deseja enviar.");
          return;
        }

        await onUpload(captureId, selectedFile);
      }

      onComplete();
    } catch (error) {
      setSubmitError(
        captureId !== null
          ? `A captura já foi criada, mas o arquivo não foi enviado. ${getErrorMessage(error)} Selecione o arquivo novamente e tente enviar; não criaremos outra captura.`
          : getErrorMessage(error),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isSubmitting
        ) {
          onClose();
        }
      }}
    >
      <section
        className="modal-card new-capture-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-capture-heading"
      >
        <div className="modal-top">
          <span className="modal-icon">
            <Lightbulb size={22} />
          </span>

          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Fechar"
            type="button"
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        <p className="eyebrow">UM NOVO FRAGMENTO</p>

        <h2 id="new-capture-heading">
          Tire a ideia da cabeça.
        </h2>

        <p className="modal-description">
          Não precisa estar pronta. Registre o que você tem agora.
        </p>

        <form onSubmit={handleSubmit}>
          <p id="capture-type-label" className="capture-field-label">
            Formato da captura
          </p>

          <div
            className="capture-type-picker"
            role="radiogroup"
            aria-labelledby="capture-type-label"
          >
            <label
              className={`capture-type-option ${
                draftType === "text" ? "is-selected" : ""
              } ${isTypeLocked ? "is-disabled" : ""}`}
            >
              <input
                className="capture-type-radio"
                type="radio"
                name="capture-type"
                value="text"
                checked={draftType === "text"}
                onChange={() => handleTypeChange("text")}
                disabled={isTypeLocked}
              />

              <span className="capture-type-icon">
                <FileText size={21} />
              </span>

              <span className="capture-type-copy">
                <span className="capture-type-title">Texto</span>
                <span className="capture-type-description">
                  Pensamentos e anotações
                </span>
              </span>

              {draftType === "text" && (
                <Check className="capture-type-check" size={17} />
              )}
            </label>

            <label
              className={`capture-type-option ${
                draftType === "image" ? "is-selected" : ""
              } ${isTypeLocked ? "is-disabled" : ""}`}
            >
              <input
                className="capture-type-radio"
                type="radio"
                name="capture-type"
                value="image"
                checked={draftType === "image"}
                onChange={() => handleTypeChange("image")}
                disabled={isTypeLocked}
              />

              <span className="capture-type-icon">
                <ImageIcon size={21} />
              </span>

              <span className="capture-type-copy">
                <span className="capture-type-title">Imagem</span>
                <span className="capture-type-description">
                  Referências visuais
                </span>
              </span>

              {draftType === "image" && (
                <Check className="capture-type-check" size={17} />
              )}
            </label>

            <label
              className={`capture-type-option ${
                draftType === "audio" ? "is-selected" : ""
              } ${isTypeLocked ? "is-disabled" : ""}`}
            >
              <input
                className="capture-type-radio"
                type="radio"
                name="capture-type"
                value="audio"
                checked={draftType === "audio"}
                onChange={() => handleTypeChange("audio")}
                disabled={isTypeLocked}
              />

              <span className="capture-type-icon">
                <AudioLines size={21} />
              </span>

              <span className="capture-type-copy">
                <span className="capture-type-title">Áudio</span>
                <span className="capture-type-description">
                  Vozes e fragmentos sonoros
                </span>
              </span>

              {draftType === "audio" && (
                <Check className="capture-type-check" size={17} />
              )}
            </label>
          </div>

          <label htmlFor="capture-title">
            Qual é o título desta ideia?
          </label>

          <input
            id="capture-title"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            placeholder="Um título provisório..."
            maxLength={180}
            required
            disabled={isTypeLocked}
          />

          <label htmlFor="capture-content">
            {draftType === "text"
              ? "O que você quer guardar?"
              : "Descrição ou contexto"}

            {draftType !== "text" && <span>opcional</span>}
          </label>

          <textarea
            id="capture-content"
            value={draftContent}
            onChange={(event) => setDraftContent(event.target.value)}
            placeholder={
              draftType === "text"
                ? "Um pensamento, uma pergunta, um fragmento..."
                : "Conte um pouco sobre este arquivo..."
            }
            rows={4}
            required={draftType === "text"}
            disabled={isTypeLocked}
          />

          {/* Seleção de múltiplos temas */}
          <div
            className="capture-theme-section"
            role="group"
            aria-labelledby="capture-theme-label"
          >
            <p
              id="capture-theme-label"
              className="capture-field-label"
            >
              <Tags size={15} />
              Temas <span>opcional</span>
            </p>

            <p className="capture-theme-description">
              Uma ideia pode pertencer a vários agrupamentos.
            </p>

            {themesLoading ? (
              <p className="capture-theme-empty" role="status">
                Carregando temas...
              </p>
            ) : themes.length > 0 ? (
              <div className="capture-theme-options">
                {themes.map((theme) => {
                  const isSelected = selectedThemeIds.includes(theme.id);

                  return (
                    <label
                      key={theme.id}
                      className={`capture-theme-option ${
                        isSelected ? "is-selected" : ""
                      } ${isTypeLocked ? "is-disabled" : ""}`}
                    >
                      <input
                        className="capture-theme-checkbox"
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleThemeToggle(theme.id)}
                        disabled={isTypeLocked}
                      />

                      <span className="capture-theme-name">
                        {theme.name}
                      </span>

                      {isSelected && (
                        <Check
                          className="capture-theme-check"
                          size={15}
                          aria-hidden="true"
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="capture-theme-empty">
                Você ainda não tem temas cadastrados. Pode continuar
                sem tema e adicionar associações depois.
              </p>
            )}

            {selectedThemeIds.length > 0 && (
              <p className="capture-theme-selection-count">
                {selectedThemeIds.length === 1
                  ? "1 tema selecionado"
                  : `${selectedThemeIds.length} temas selecionados`}
              </p>
            )}
          </div>

          {isMediaType && (
            <>
              <label
                htmlFor="capture-file"
                className="capture-file-label"
              >
                {draftType === "image"
                  ? "Imagem para guardar"
                  : "Áudio para guardar"}
              </label>

              <div
                className={`capture-file-picker ${
                  selectedFile ? "has-file" : ""
                } ${isSubmitting ? "is-disabled" : ""}`}
              >
                <input
                  id="capture-file"
                  className="capture-file-input"
                  type="file"
                  accept={FILE_ACCEPT[draftType]}
                  required={pendingCaptureId === null}
                  disabled={isSubmitting}
                  aria-describedby="capture-file-help"
                  onChange={(event) => {
                    setSelectedFile(
                      event.currentTarget.files?.[0] ?? null,
                    );

                    setSubmitError(null);

                    // Permite selecionar novamente o mesmo arquivo
                    // caso seja necessário tentar o upload outra vez.
                    event.currentTarget.value = "";
                  }}
                />

                <label
                  htmlFor="capture-file"
                  className="capture-file-dropzone"
                >
                  <span className="capture-file-icon">
                    {draftType === "image" ? (
                      <ImageIcon size={23} />
                    ) : (
                      <AudioLines size={23} />
                    )}
                  </span>

                  <span className="capture-file-copy">
                    <span className="capture-file-title">
                      {selectedFile
                        ? selectedFile.name
                        : draftType === "image"
                          ? "Escolha uma imagem"
                          : "Escolha um arquivo de áudio"}
                    </span>

                    <span className="capture-file-subtitle">
                      {selectedFile
                        ? `${(
                            selectedFile.size /
                            (1024 * 1024)
                          ).toFixed(2)} MB · Clique para trocar`
                        : draftType === "image"
                          ? "PNG, JPG, WEBP ou GIF"
                          : "MP3, MPEG, WAV, OGG, M4A ou MP4"}
                    </span>
                  </span>

                  <span className="capture-file-action">
                    <Upload size={15} />
                    {selectedFile ? "Trocar" : "Selecionar"}
                  </span>
                </label>
              </div>

              <p id="capture-file-help" className="demo-notice">
                Tamanho máximo: 25 MB.
              </p>
            </>
          )}

          {submitError && (
            <p className="demo-notice" role="alert">
              {submitError}
            </p>
          )}

          <p className="demo-notice">
            Suas capturas são salvas no Echo. Imagens e áudios
            são enviados ao armazenamento local do backend.
          </p>

          <button
            className="modal-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Salvando..."
              : draftType === "image"
                ? "Salvar imagem"
                : draftType === "audio"
                  ? "Salvar áudio"
                  : "Adicionar ideia"}

            <ArrowUpRight size={16} />
          </button>
        </form>
      </section>
    </div>
  );
}
