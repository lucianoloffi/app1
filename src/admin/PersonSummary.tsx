import type { ReactNode } from "react";
import type { PessoaDoPainel } from "../lib/api/admin";
import { AccountEmail } from "./AccountEmail";
import { dataCurta, dataHora } from "./datas";
import styles from "./PersonSummary.module.css";

interface PersonSummaryProps {
  pessoa: PessoaDoPainel;
  /** Selos que só uma das telas tem o que dizer. */
  children?: ReactNode;
}

/**
 * A ficha de quem está sendo analisado, igual nas telas de Fotos e de
 * Verificação — como a função `ficha_do_painel` no banco, que é de onde ela
 * vem. Decidir sobre a foto ou o selo de alguém sem ver que a pessoa está
 * suspensa, ou tem denúncias abertas, é decidir no escuro.
 */
export function PersonSummary({ pessoa, children }: PersonSummaryProps) {
  const ficha = [
    pessoa.idade ? `${pessoa.idade} anos` : null,
    pessoa.cidade,
    pessoa.profissao,
    pessoa.entrouEm ? `no Lovi desde ${dataCurta(pessoa.entrouEm)}` : null,
  ].filter(Boolean);

  return (
    <div className={styles.dados}>
      <div className={styles.nomeLinha}>
        <h2 className={styles.nome}>{pessoa.nome}</h2>
        {pessoa.statusModeracao === "suspenso" && (
          <span className={`${styles.selo} ${styles.seloAlerta}`}>
            suspenso até {dataHora(pessoa.suspensaoTerminaEm)}
          </span>
        )}
        {pessoa.statusModeracao === "banido" && (
          <span className={`${styles.selo} ${styles.seloGrave}`}>banido</span>
        )}
        {pessoa.denunciasAbertas > 0 && (
          <span className={`${styles.selo} ${styles.seloAlerta}`}>
            {pessoa.denunciasAbertas === 1
              ? "1 denúncia aberta"
              : `${pessoa.denunciasAbertas} denúncias abertas`}
          </span>
        )}
        {pessoa.denunciasTotal > pessoa.denunciasAbertas && (
          <span className={styles.selo}>{pessoa.denunciasTotal} denúncias no total</span>
        )}
        {pessoa.verificacaoStatus === "aprovada" && (
          <span className={styles.selo}>perfil verificado</span>
        )}
        {!pessoa.visivel && <span className={styles.selo}>perfil oculto</span>}
        {children}
      </div>
      <AccountEmail email={pessoa.email} />
      {ficha.length > 0 && <p className={styles.ficha}>{ficha.join(" · ")}</p>}
      {pessoa.bio && <p className={styles.bio}>{pessoa.bio}</p>}
    </div>
  );
}
