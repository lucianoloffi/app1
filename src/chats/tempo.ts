/** Tempo relativo curto, no formato que a lista de conversas já usava. */
export function tempoRelativo(iso: string | null): string {
  if (!iso) return "";
  const quando = new Date(iso).getTime();
  if (Number.isNaN(quando)) return "";

  const minutos = Math.floor((Date.now() - quando) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas} h`;
  if (horas < 48) return "ontem";

  const data = new Date(quando);
  return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`;
}
