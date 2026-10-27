
import { useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Lightbulb,
  X,
} from "lucide-react";

import type { CreateCapturePayload } from "../services/api";
import type { Capture, CaptureType } from "../types/capture";

type NewCaptureModalProps = {
  onClose: () => void;
  onCreate: (payload: CreateCapturePayload) => Promise<Capture>;
  onUpload: (captureId: number, file: File) => Promise<void>;
  onComplete: () => void;
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
}: NewCaptureModalProps) {
  const [draftType, setDraftType] = useState<CaptureType>("text");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pendingCaptureId, setPendingCaptureId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isMediaType = draftType !== "text";

  function handleTypeChange(type: CaptureType) {
    if (pendingCaptureId !== null || isSubmitting) return;

    setDraftType(type);
    setSelectedFile(null);
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
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
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
          <label htmlFor="capture-type">
            Formato da captura
          </label>

          <select
            id="capture-type"
            className="capture-type-select"
            value={draftType}
            onChange={(event) =>
              handleTypeChange(event.target.value as CaptureType)
            }
            disabled={isSubmitting || pendingCaptureId !== null}
          >
            <option value="text">Texto</option>
            <option value="image">Imagem</option>
            <option value="audio">Áudio</option>
          </select>

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
            disabled={isSubmitting || pendingCaptureId !== null}
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
            disabled={isSubmitting || pendingCaptureId !== null}
          />

          {isMediaType && (
            <>
              <label htmlFor="capture-file">
                {draftType === "image"
                  ? "Escolha uma imagem"
                  : "Escolha um arquivo de áudio"}
              </label>

              <input
                id="capture-file"
                type="file"
                accept={FILE_ACCEPT[draftType]}
                required={pendingCaptureId === null}
                disabled={isSubmitting}
                onChange={(event) => {
                  setSelectedFile(event.target.files?.[0] ?? null);
                  setSubmitError(null);
                }}
              />

              <p className="demo-notice">
                Formatos aceitos conforme o tipo selecionado.
                Tamanho máximo: 25 MB.
              </p>

              {selectedFile && (
                <p className="demo-notice">
                  Arquivo selecionado: {selectedFile.name}
                  {" · "}
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              )}
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
