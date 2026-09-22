import { useState } from "react";
import styles from "./AccountEmail.module.css";

/**
 * O e-mail da conta na ficha da pessoa (migration 0026). Sem ele não havia
 * como ligar o perfil a uma conta do Supabase: nome de perfil é livre e se
 * repete, e é pelo e-mail que se acha a pessoa em Authentication → Users,
 * para conferir uma exclusão ou responder a uma contestação. O botão copia
 * porque é para colar lá.
 */
export function AccountEmail({ email }: { email: string | null }) {
  const [copiado, setCopiado] = useState(false);
  if (!email) return null;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(email!);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* sem permissão de área de transferência: o e-mail continua selecionável */
    }
  }

  return (
    <p className={styles.linha}>
      <span className={styles.email}>{email}</span>
      <button type="button" className={styles.copiar} onClick={() => void copiar()}>
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </p>
  );
}
