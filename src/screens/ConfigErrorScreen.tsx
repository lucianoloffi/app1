import styles from "./ConfigErrorScreen.module.css";

/** Tela de configuração: aparece só para quem está montando o ambiente. */
export function ConfigErrorScreen({ message }: { message: string }) {
  return (
    <div className={styles.screen}>
      <span className={styles.badge}>Configuração</span>
      <h1 className={styles.title}>O app não conseguiu falar com o Supabase</h1>
      <p className={styles.message}>{message}</p>
      <p className={styles.code}>
        {`VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
      </p>
      <p className={styles.message}>
        Depois de corrigir o arquivo <strong>.env</strong>, pare o servidor e rode{" "}
        <strong>npm run dev</strong> de novo — o Vite só lê o .env ao iniciar.
      </p>
    </div>
  );
}
