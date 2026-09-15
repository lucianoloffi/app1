/**
 * Conversor mínimo de Markdown para os três documentos legais.
 * Cobre só o que esses arquivos usam: títulos, separadores, listas, tabelas,
 * negrito e parágrafos — sem dependência externa.
 */

export type BlocoLegal =
  | { tipo: "titulo"; nivel: 1 | 2; texto: string }
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "tabela"; cabecalho: string[]; linhas: string[][] }
  | { tipo: "separador" };

function celulas(linha: string): string[] {
  return linha
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((celula) => celula.trim());
}

export function analisaMarkdown(fonte: string): BlocoLegal[] {
  const linhas = fonte.split("\n");
  const blocos: BlocoLegal[] = [];
  let paragrafo: string[] = [];
  let lista: string[] = [];

  function fechaParagrafo() {
    if (paragrafo.length > 0) {
      blocos.push({ tipo: "paragrafo", texto: paragrafo.join(" ").trim() });
      paragrafo = [];
    }
  }

  function fechaLista() {
    if (lista.length > 0) {
      blocos.push({ tipo: "lista", itens: lista });
      lista = [];
    }
  }

  for (let i = 0; i < linhas.length; i += 1) {
    const linha = linhas[i];
    const limpa = linha.trim();

    if (limpa === "") {
      fechaParagrafo();
      fechaLista();
      continue;
    }

    if (limpa.startsWith("## ")) {
      fechaParagrafo();
      fechaLista();
      blocos.push({ tipo: "titulo", nivel: 2, texto: limpa.slice(3) });
      continue;
    }

    if (limpa.startsWith("# ")) {
      fechaParagrafo();
      fechaLista();
      blocos.push({ tipo: "titulo", nivel: 1, texto: limpa.slice(2) });
      continue;
    }

    if (/^-{3,}$/.test(limpa)) {
      fechaParagrafo();
      fechaLista();
      blocos.push({ tipo: "separador" });
      continue;
    }

    if (limpa.startsWith("|") && linhas[i + 1]?.includes("---")) {
      fechaParagrafo();
      fechaLista();
      const cabecalho = celulas(limpa);
      const corpo: string[][] = [];
      i += 2;
      while (i < linhas.length && linhas[i].trim().startsWith("|")) {
        corpo.push(celulas(linhas[i]));
        i += 1;
      }
      i -= 1;
      blocos.push({ tipo: "tabela", cabecalho, linhas: corpo });
      continue;
    }

    if (limpa.startsWith("- ")) {
      fechaParagrafo();
      lista.push(limpa.slice(2));
      continue;
    }

    // Continuação de item de lista (o texto original quebra linhas longas).
    if (lista.length > 0 && linha.startsWith("  ")) {
      lista[lista.length - 1] += ` ${limpa}`;
      continue;
    }

    fechaLista();
    paragrafo.push(limpa);
  }

  fechaParagrafo();
  fechaLista();
  return blocos;
}

/** Quebra o texto em pedaços, marcando o que está em **negrito**. */
export function pedacosComNegrito(texto: string): { texto: string; forte: boolean }[] {
  return texto
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((pedaco) => pedaco !== "")
    .map((pedaco) =>
      pedaco.startsWith("**") && pedaco.endsWith("**")
        ? { texto: pedaco.slice(2, -2), forte: true }
        : { texto: pedaco, forte: false },
    );
}
