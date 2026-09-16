/** Calcula a idade a partir de uma data de nascimento em dígitos ddmmaaaa. */
export function ageFromBirthdate(rawDigits: string): number | null {
  const digits = rawDigits.replace(/\D/g, "");
  if (digits.length < 8) return null;

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const birth = new Date(year, month - 1, day);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthdayThisYear) age -= 1;

  return age;
}

/** Limites aceitos para o ano de nascimento no cadastro. */
export const ANO_MINIMO = 1900;
export const ANO_MAXIMO = 2015;

/**
 * Descreve o que está errado numa data em dígitos ddmmaaaa, ou null quando ela
 * ainda está incompleta ou já é válida. Valida enquanto a pessoa digita: o dia
 * assim que os dois primeiros dígitos chegam, o mês nos dois seguintes.
 */
export function problemaNaDataDeNascimento(rawDigits: string): string | null {
  const digits = rawDigits.replace(/\D/g, "");

  if (digits.length >= 2) {
    const day = Number(digits.slice(0, 2));
    if (day < 1 || day > 31) return "O dia precisa ficar entre 01 e 31.";
  }

  if (digits.length >= 4) {
    const month = Number(digits.slice(2, 4));
    if (month < 1 || month > 12) return "O mês precisa ficar entre 01 e 12.";
  }

  if (digits.length < 8) return null;

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));

  if (year < ANO_MINIMO || year > ANO_MAXIMO) {
    return `O ano precisa ficar entre ${ANO_MINIMO} e ${ANO_MAXIMO}.`;
  }

  // Pega 31/04 e 29/02 fora de ano bissexto: o Date rola para o mês seguinte.
  const data = new Date(year, month - 1, day);
  if (data.getDate() !== day || data.getMonth() !== month - 1) {
    return "Esse dia não existe nesse mês.";
  }

  return null;
}
