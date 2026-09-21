import type { ReactNode } from "react";
import styles from "./AdminShell.module.css";

export type AbaDoPainel = "numeros" | "moderacao";

const ABAS: { valor: AbaDoPainel; rotulo: string }[] = [
  { valor: "numeros", rotulo: "Números" },
  { valor: "moderacao", rotulo: "Moderação" },
];

interface AdminShellProps {
  aba: AbaDoPainel;
  onTrocarAba: (aba: AbaDoPainel) => void;
  email: string;
  /** Denúncias esperando decisão; null enquanto o número não chegou. */
  denunciasAbertas: number | null;
  onSair: () => void;
  children: ReactNode;
}

/** Topo comum às telas do painel: marca, abas, conta e sair. */
export function AdminShell({
  aba,
  onTrocarAba,
  email,
  denunciasAbertas,
  onSair,
  children,
}: AdminShellProps) {
  return (
    <div className={styles.tela}>
      <header className={styles.topo}>
        <span className={styles.marca}>
          lovi <span className={styles.marcaAdmin}>admin</span>
        </span>
        <nav className={styles.abas} aria-label="Painel">
          {ABAS.map((item) => (
            <button
              key={item.valor}
              type="button"
              aria-current={item.valor === aba ? "page" : undefined}
              className={item.valor === aba ? `${styles.aba} ${styles.abaAtiva}` : styles.aba}
              onClick={() => onTrocarAba(item.valor)}
            >
              {item.rotulo}
              {item.valor === "moderacao" && denunciasAbertas !== null && denunciasAbertas > 0 && (
                <span className={styles.contador}>{denunciasAbertas}</span>
              )}
            </button>
          ))}
        </nav>
        <span className={styles.conta}>{email}</span>
        <button type="button" className={styles.sair} onClick={onSair}>
          Sair
        </button>
      </header>
      {children}
    </div>
  );
}
