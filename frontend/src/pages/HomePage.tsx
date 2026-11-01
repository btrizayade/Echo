import { Link } from "react-router";

import echoLogo from "../assets/echo-logo.png";

import "../styles/homepage.css";

const navigationItems = [
  { label: "Visão geral", path: "/app" },
  { label: "Capturas", path: "/app/captures" },
  { label: "Favoritas", path: "/app/favorites" },
  { label: "Temas", path: "/app/themes" },
  { label: "Resgates", path: "/app/rescues" },
];

function HomePage() {
  return (
    <main className="homepage">
      <div className="homepage-background" aria-hidden="true">
        <video
          className="homepage-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          tabIndex={-1}
        >
          <source src="/videos/homepage-loop.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="homepage-overlay" aria-hidden="true" />

      <header className="homepage-header">
        {/* A marca é visual: não é um link nem recebe foco. */}
        <div className="homepage-brand" aria-label="Echo">
          <img src={echoLogo} alt="Echo" className="homepage-logo" />
        </div>

        <nav className="homepage-navigation" aria-label="Navegação principal">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="homepage-navigation-link"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="homepage-hero" aria-labelledby="homepage-title">
        <div className="homepage-hero-content">
          <h1 id="homepage-title" className="homepage-title">
            Ideias não precisam nascer <em>prontas.</em>
          </h1>

          <p className="homepage-description">
            Guarde o fragmento. Volte a ele quando quiser.
          </p>

        </div>
      </section>
    </main>
  );
}

export default HomePage;
