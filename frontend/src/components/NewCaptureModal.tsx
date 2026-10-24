
import { useState, type FormEvent } from "react";
import { ArrowUpRight, Lightbulb, X } from "lucide-react";

type NewCaptureModalProps = {
  onClose: () => void;
  onCreate: (title: string, content: string) => void;
};

export default function NewCaptureModal({
  onClose,
  onCreate,
}: NewCaptureModalProps) {
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = draftTitle.trim();

    if (!cleanTitle) return;

    onCreate(cleanTitle, draftContent.trim());
  }

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
          <label htmlFor="capture-title">
            Como você chamaria essa ideia?
          </label>

          <input
            id="capture-title"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            placeholder="Um título provisório..."
            maxLength={180}
            required
            autoFocus
          />

          <label htmlFor="capture-content">
            O que você quer guardar? <span>opcional</span>
          </label>

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
            Adicionar à demonstração
            <ArrowUpRight size={16} />
          </button>
        </form>
      </section>
    </div>
  );
}
