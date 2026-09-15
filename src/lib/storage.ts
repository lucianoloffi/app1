/**
 * Único ponto de acesso ao armazenamento local do dispositivo.
 * Nada mais no app pode chamar localStorage direto: na Fase 5 este arquivo
 * passa a usar @capacitor/preferences sem tocar no resto do código.
 */
const PREFIX = "lovi:";

function disponivel(): boolean {
  try {
    const chave = `${PREFIX}__teste`;
    window.localStorage.setItem(chave, "1");
    window.localStorage.removeItem(chave);
    return true;
  } catch {
    return false;
  }
}

export function lerLocal<T>(chave: string, padrao: T): T {
  if (!disponivel()) return padrao;
  try {
    const bruto = window.localStorage.getItem(PREFIX + chave);
    return bruto === null ? padrao : (JSON.parse(bruto) as T);
  } catch {
    return padrao;
  }
}

export function gravarLocal(chave: string, valor: unknown): void {
  if (!disponivel()) return;
  try {
    window.localStorage.setItem(PREFIX + chave, JSON.stringify(valor));
  } catch {
    /* modo privado ou cota cheia: seguir sem persistir */
  }
}

export function removerLocal(chave: string): void {
  if (!disponivel()) return;
  try {
    window.localStorage.removeItem(PREFIX + chave);
  } catch {
    /* idem */
  }
}
