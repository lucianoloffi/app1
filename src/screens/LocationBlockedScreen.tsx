import { useState } from "react";
import styles from "./LocationBlockedScreen.module.css";

/**
 * No iOS o diálogo do sistema não volta a aparecer depois de negado — então
 * não adianta pedir de novo. Aqui mostramos onde reativar e, se a pessoa
 * ainda assim recusar, ela segue com a cidade (modo aproximado).
 */
const PASSOS = [
  "Abra os Ajustes do aparelho",
  "Toque em Safari (ou no navegador que você usa)",
  "Em Localização, escolha Perguntar ou Permitir",
  "Volte aqui e toque em “Já ativei, tentar de novo”",
];

interface LocationBlockedScreenProps {
  /** "pedir" = antes do diálogo do sistema; "bloqueada" = já foi negado. */
  mode: "pedir" | "bloqueada";
  city: string;
  onRetry: () => Promise<boolean>;
  onUseCity: () => void;
  onShowToast: (message: string) => void;
}

export function LocationBlockedScreen({
  mode,
  city,
  onRetry,
  onUseCity,
  onShowToast,
}: LocationBlockedScreenProps) {
  const [tentando, setTentando] = useState(false);
  const bloqueada = mode === "bloqueada";

  async function tentarDeNovo() {
    setTentando(true);
    const liberou = await onRetry();
    setTentando(false);
    if (!liberou && bloqueada) onShowToast("A localização ainda está bloqueada nos ajustes.");
  }

  return (
    <div className={styles.screen}>
      <div className={styles.body}>
        <span className={styles.icon}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z"
              fill="#fff"
              stroke="#8B5CF6"
              strokeWidth={1.8}
            />
            <circle cx="12" cy="10" r="2.6" fill="#8B5CF6" />
          </svg>
        </span>

        <h1 className={styles.title}>
          {bloqueada ? "A localização está bloqueada" : "Ativar sua localização"}
        </h1>
        <p className={styles.support}>
          Usamos sua localização só para calcular a distância até outras pessoas — nunca mostramos
          onde você está.
        </p>

        {bloqueada && (
          <div className={styles.steps}>
            <p className={styles.stepsTitle}>Como reativar</p>
            {PASSOS.map((passo, indice) => (
              <div key={passo} className={styles.step}>
                <span className={styles.stepNumber}>{indice + 1}</span>
                <p className={styles.stepText}>{passo}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.ctaButton}
          disabled={tentando}
          onClick={() => void tentarDeNovo()}
        >
          {tentando ? "Verificando…" : bloqueada ? "Já ativei, tentar de novo" : "Permitir localização"}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onUseCity}>
          Continuar com {city || "minha cidade"}
        </button>
        <p className={styles.note}>
          Sem GPS, seu card mostra a cidade no lugar da distância e aparece com menos destaque na
          fila.
        </p>
      </div>
    </div>
  );
}
