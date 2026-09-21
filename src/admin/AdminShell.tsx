import type { ReactNode } from "react";
import styles from "./AdminShell.module.css";

export type AbaDoPainel = "numeros" | "moderacao" | "verificacao" | "fotos";

/**
 * `contador` diz de qual aviso cada aba vive. Fotos não tem: foto entra no ar
 * na hora, ninguém fica esperando, e um número vermelho no topo do painel
 * pediria pressa que não existe.
 */
const ABAS: { valor: AbaDoPainel; rotulo: string; contador?: keyof AvisosDoPainel }[] = [
  { valor: "numeros", rotulo: "Números" },
  { valor: "moderacao", rotulo: "Moderação", contador: "denunciasAbertas" },
  { valor: "verificacao", rotulo: "Verificação", contador: "verificacoesPendentes" },
  { valor: "fotos", rotulo: "Fotos" },
];

export interface AvisosDoPainel {
  /** Denúncias esperando decisão; null enquanto o número não chegou. */
  denunciasAbertas: number | null;
  /** Pessoas esperando análise do selo; null enquanto o número não chegou. */
  verificacoesPendentes: number | null;
}

interface AdminShellProps {
  aba: AbaDoPainel;
  onTrocarAba: (aba: AbaDoPainel) => void;
  email: string;
  avisos: AvisosDoPainel;
  onSair: () => void;
  children: ReactNode;
}

/** Topo comum às telas do painel: marca, abas, conta e sair. */
export function AdminShell({
  aba,
  onTrocarAba,
  email,
  avisos,
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
          {ABAS.map((item) => {
            const espera = item.contador ? avisos[item.contador] : null;
            return (
              <button
                key={item.valor}
                type="button"
                aria-current={item.valor === aba ? "page" : undefined}
                className={item.valor === aba ? `${styles.aba} ${styles.abaAtiva}` : styles.aba}
                onClick={() => onTrocarAba(item.valor)}
              >
                {item.rotulo}
                {espera !== null && espera > 0 && (
                  <span className={styles.contador}>{espera}</span>
                )}
              </button>
            );
          })}
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
