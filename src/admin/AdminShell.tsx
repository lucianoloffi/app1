import type { ReactNode } from "react";
import { PRAZO_DA_DENUNCIA_HORAS } from "../lib/api/admin";
import { duracao } from "./datas";
import styles from "./AdminShell.module.css";

export type AbaDoPainel = "numeros" | "moderacao" | "verificacao" | "fotos" | "usuarios";

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
  { valor: "usuarios", rotulo: "Usuários" },
];

export interface AvisosDoPainel {
  /** Denúncias esperando decisão; null enquanto o número não chegou. */
  denunciasAbertas: number | null;
  /** Há quantos minutos a denúncia aberta mais antiga espera; null sem nenhuma ou sem número. */
  minutosDaDenunciaMaisAntiga: number | null;
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

/** A denúncia mais antiga passou do prazo que a App Store exige para responder. */
function passouDoPrazo(avisos: AvisosDoPainel): boolean {
  const minutos = avisos.minutosDaDenunciaMaisAntiga;
  return minutos !== null && minutos >= PRAZO_DA_DENUNCIA_HORAS * 60;
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
  const atrasada = passouDoPrazo(avisos);
  const abertas = avisos.denunciasAbertas ?? 0;
  const minutos = avisos.minutosDaDenunciaMaisAntiga;

  return (
    <div className={styles.tela}>
      <header className={styles.topo}>
        <span className={styles.marca}>
          lovi <span className={styles.marcaAdmin}>admin</span>
        </span>
        <nav className={styles.abas} aria-label="Painel">
          {ABAS.map((item) => {
            const espera = item.contador ? avisos[item.contador] : null;
            const urgente = item.contador === "denunciasAbertas" && atrasada;
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
                  <span
                    className={urgente ? `${styles.contador} ${styles.contadorUrgente}` : styles.contador}
                    title={
                      urgente
                        ? `A mais antiga espera há mais de ${PRAZO_DA_DENUNCIA_HORAS} h`
                        : undefined
                    }
                  >
                    {urgente && <span aria-hidden="true">!</span>}
                    {espera}
                    {urgente && <span className={styles.somenteLeitor}> — passou do prazo</span>}
                  </span>
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
      {/* Na entrada e em qualquer aba: sem aviso por e-mail, é aqui que quem
          abre o painel fica sabendo que há denúncia esperando, e há quanto
          tempo. Na própria Moderação o botão sai, porque a fila já está ali. */}
      {abertas > 0 && (
        <div
          className={atrasada ? `${styles.faixa} ${styles.faixaUrgente}` : styles.faixa}
          role={atrasada ? "alert" : "status"}
        >
          <p className={styles.faixaTexto}>
            <strong>
              {abertas === 1 ? "1 denúncia aberta" : `${abertas} denúncias abertas`}
            </strong>
            {minutos !== null && (
              <>
                {" · "}
                {abertas === 1 ? "espera" : "a mais antiga espera"} há {duracao(minutos)}
              </>
            )}
            {atrasada && (
              <>
                {" — "}
                passou do prazo de {PRAZO_DA_DENUNCIA_HORAS} h que a App Store exige para responder
              </>
            )}
          </p>
          {aba !== "moderacao" && (
            <button
              type="button"
              className={styles.faixaBotao}
              onClick={() => onTrocarAba("moderacao")}
            >
              Ver denúncias
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
