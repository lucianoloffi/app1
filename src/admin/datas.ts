/**
 * As datas do painel, num lugar só. Formato brasileiro escrito à mão em vez de
 * Intl: são três formatos fixos, e o painel abre com o fuso de quem está
 * olhando — que é o de São Paulo, o mesmo dos números.
 */

/** "12/09/2026" — data sem hora, para a ficha do perfil. */
export function dataCurta(iso: string | null): string {
  if (!iso) return "";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${data.getFullYear()}`;
}

/** "12/09/2026 às 14:30" — quando a hora importa para a decisão. */
export function dataHora(iso: string | null): string {
  if (!iso) return "";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");
  return `${dataCurta(iso)} às ${hora}:${minuto}`;
}

/** "12/09 14:30" — ao lado de cada mensagem da conversa copiada. */
export function horaCurta(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");
  return `${dia}/${mes} ${hora}:${minuto}`;
}

/**
 * "12 min", "5 h", "2 dias e 3 h" — há quanto tempo algo espera. Horas cheias
 * a partir de uma hora e dias a partir de 48 h: "30 h" ainda se lê de relance
 * contra o prazo de 24 h, e é essa a comparação que importa.
 */
export function duracao(minutos: number): string {
  if (minutos < 60) return `${Math.max(minutos, 0)} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 48) return `${horas} h`;
  const dias = Math.floor(horas / 24);
  const resto = horas % 24;
  return resto === 0 ? `${dias} dias` : `${dias} dias e ${resto} h`;
}
