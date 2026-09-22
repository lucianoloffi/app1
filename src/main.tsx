import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { LegalScreen, type DocumentoLegal } from "./screens/LegalScreen";
import { acompanharTeclado } from "./lib/teclado";

/**
 * Atalho por endereço: /termos, /privacidade e /diretrizes abrem o documento
 * direto, para que os links sejam compartilháveis fora do app (exigência da
 * Apple na publicação). O resto da navegação continua por estado no App.tsx.
 */
const ROTAS_LEGAIS: Record<string, DocumentoLegal> = {
  termos: "termos",
  privacidade: "privacidade",
  diretrizes: "diretrizes",
};

// Vale para o app inteiro, inclusive para a rota dos documentos legais, por
// isso fica aqui e não dentro do App.
acompanharTeclado();

const base = import.meta.env.BASE_URL;
const caminho = window.location.pathname.startsWith(base)
  ? window.location.pathname.slice(base.length)
  : window.location.pathname;
const documento = ROTAS_LEGAIS[caminho.replace(/^\/+|\/+$/g, "")];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {documento ? (
      <div className="app-shell">
        <div className="app-shell__content">
          <LegalScreen
            documento={documento}
            onBack={() => {
              window.location.href = base;
            }}
          />
        </div>
      </div>
    ) : (
      <App />
    )}
  </StrictMode>,
);
