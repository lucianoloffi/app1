import { useState, type FormEvent } from "react";
import { entrar } from "../lib/api/auth";
import { mensagemDeErro } from "../lib/errors";
import styles from "./LoginScreen.module.css";

interface LoginScreenProps {
  onEntrou: () => void;
}

/** Mesma conta do app Lovi. Quem não for admin entra e vê o aviso de sem acesso. */
export function LoginScreen({ onEntrou }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      await entrar(email, senha);
      onEntrou();
    } catch (problema) {
      setErro(mensagemDeErro(problema));
      setEnviando(false);
    }
  }

  const podeEnviar = email.trim().length > 0 && senha.length > 0 && !enviando;

  return (
    <main className={styles.tela}>
      <form className={styles.cartao} onSubmit={(e) => void aoEnviar(e)}>
        <div className={styles.cabecalho}>
          <span className={styles.marca}>
            lovi <span className={styles.marcaAdmin}>admin</span>
          </span>
          <p className={styles.apoio}>Entre com a sua conta do Lovi.</p>
        </div>
        <label className={styles.campo}>
          <span className={styles.rotulo}>E-mail</span>
          <input
            className={styles.entrada}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className={styles.campo}>
          <span className={styles.rotulo}>Senha</span>
          <input
            className={styles.entrada}
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </label>
        {erro && (
          <p className={styles.erro} role="alert">
            {erro}
          </p>
        )}
        <button type="submit" className={styles.botao} disabled={!podeEnviar}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
