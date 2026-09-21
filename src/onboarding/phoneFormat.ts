export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Formata dígitos de telefone BR no padrão (DD) 9XXXX-XXXX. */
export function formatPhone(rawDigits: string): string {
  const digits = onlyDigits(rawDigits).slice(0, 11);
  const ddd = digits.slice(0, 2);
  const first = digits.slice(2, 7);
  const second = digits.slice(7, 11);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${ddd}`;
  if (digits.length <= 7) return `(${ddd}) ${first}`;
  return `(${ddd}) ${first}-${second}`;
}

/**
 * Telefone salvo, pronto para mostrar. Ele chega em dois formatos: o cadastro
 * grava só os dígitos ("47999990000") e a troca de número grava formatado
 * ("+55 (47) 99999-9999"). Só dígitos viram o formato completo; o resto
 * aparece como foi salvo.
 */
export function exibeTelefone(salvo: string): string {
  const texto = salvo.trim();
  // Fixo tem 10 dígitos e agrupa 4-4; formatPhone agrupa 5-4, que é o celular
  // (e o certo enquanto se digita, quando ainda não dá para saber qual é).
  if (/^\d{10}$/.test(texto))
    return `+55 (${texto.slice(0, 2)}) ${texto.slice(2, 6)}-${texto.slice(6)}`;
  if (/^\d{11}$/.test(texto)) return `+55 ${formatPhone(texto)}`;
  return texto;
}

/** Formata dígitos de data no padrão dd/mm/aaaa. */
export function formatBirthdate(rawDigits: string): string {
  const digits = onlyDigits(rawDigits).slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
}
