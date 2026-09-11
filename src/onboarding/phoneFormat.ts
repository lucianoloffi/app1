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
