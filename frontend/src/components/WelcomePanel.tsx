
import { ArrowUpRight } from "lucide-react";

type WelcomePanelProps = {
  onNewCapture: () => void;
};

export default function WelcomePanel({
  onNewCapture,
}: WelcomePanelProps) {
  return (
    <section className="welcome-panel">
      <div className="welcome-copy">
        <h2>Ideias não precisam nascer prontas.</h2>

        <p>
          Guarde o fragmento. Faça conexões. Volte a ele quando quiser.
        </p>

        <button
          className="welcome-button"
          onClick={onNewCapture}
        >
          Registrar uma ideia <ArrowUpRight size={16} />
        </button>
      </div>
    </section>
  );
}
