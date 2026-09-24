// Gera as páginas de Termos, Privacidade e Diretrizes do site a partir dos
// MESMOS arquivos .md que o app mostra (../src/legal/). Antes as páginas eram
// copiadas à mão, e a de privacidade ficou na 1.3 enquanto o app já estava
// na 1.7: quem abria pelo site lia uma política velha.
//
// Uso, dentro desta pasta:
//
//     node gerar-documentos.mjs
//     npx wrangler deploy
//
// Só o miolo (<main>) é trocado; cabeçalho, rodapé e <head> de cada página
// ficam como estão. As regras de Markdown são as do conversor do app
// (src/legal/markdown.ts): títulos, separadores, listas, tabelas, negrito e
// parágrafos — nada além.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const legal = join(aqui, "..", "src", "legal");

const PAGINAS = [
  { md: "termos-de-uso.md", html: "termos", titulo: "Termos de uso" },
  { md: "politica-privacidade.md", html: "privacidade", titulo: "Política de privacidade" },
  { md: "diretrizes-comunidade.md", html: "diretrizes", titulo: "Diretrizes da comunidade" },
];

const ABAS = [
  { href: "/termos/", rotulo: "Termos de uso", pagina: "termos" },
  { href: "/privacidade/", rotulo: "Privacidade", pagina: "privacidade" },
  { href: "/diretrizes/", rotulo: "Diretrizes da comunidade", pagina: "diretrizes" },
];

const FORTE = `<strong style="font-weight:700; color:#16211A;">`;
const P = `<p style="margin:0; font:400 15.5px/1.65 'Plus Jakarta Sans'; color:#5C6660;">`;
const UL = `<ul style="margin:0; padding-left:22px; font:400 15.5px/1.65 'Plus Jakarta Sans'; color:#5C6660;">`;
const LI = `<li style="margin:0 0 9px 0;">`;
const TH = `<th style="text-align:left; padding:12px 14px; font:700 12px 'Plus Jakarta Sans'; letter-spacing:.06em; text-transform:uppercase; color:#8A928B; border-bottom:1px solid #DCE0D8;">`;
const TD = `<td style="padding:13px 14px; font:400 14.5px/1.5 'Plus Jakarta Sans'; color:#5C6660; border-bottom:1px solid #EDEFEA; vertical-align:top;">`;

function escapa(texto) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Texto com **negrito**, já escapado. */
function inline(texto) {
  return texto
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((pedaco) => pedaco !== "")
    .map((pedaco) =>
      pedaco.startsWith("**") && pedaco.endsWith("**")
        ? `${FORTE}${escapa(pedaco.slice(2, -2))}</strong>`
        : escapa(pedaco),
    )
    .join("");
}

function celulas(linha) {
  return linha
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((celula) => celula.trim());
}

/** Mesmo algoritmo de analisaMarkdown em src/legal/markdown.ts. */
function analisa(fonte) {
  const linhas = fonte.split("\n");
  const blocos = [];
  let paragrafo = [];
  let lista = [];
  const fechaParagrafo = () => {
    if (paragrafo.length) blocos.push({ tipo: "paragrafo", texto: paragrafo.join(" ").trim() });
    paragrafo = [];
  };
  const fechaLista = () => {
    if (lista.length) blocos.push({ tipo: "lista", itens: lista });
    lista = [];
  };

  for (let i = 0; i < linhas.length; i += 1) {
    const linha = linhas[i];
    const limpa = linha.trim();
    if (limpa === "") {
      fechaParagrafo();
      fechaLista();
    } else if (limpa.startsWith("## ")) {
      fechaParagrafo();
      fechaLista();
      blocos.push({ tipo: "titulo", nivel: 2, texto: limpa.slice(3) });
    } else if (limpa.startsWith("# ")) {
      fechaParagrafo();
      fechaLista();
      blocos.push({ tipo: "titulo", nivel: 1, texto: limpa.slice(2) });
    } else if (/^-{3,}$/.test(limpa)) {
      fechaParagrafo();
      fechaLista();
      blocos.push({ tipo: "separador" });
    } else if (limpa.startsWith("|") && linhas[i + 1]?.includes("---")) {
      fechaParagrafo();
      fechaLista();
      const cabecalho = celulas(limpa);
      const corpo = [];
      i += 2;
      while (i < linhas.length && linhas[i].trim().startsWith("|")) {
        corpo.push(celulas(linhas[i]));
        i += 1;
      }
      i -= 1;
      blocos.push({ tipo: "tabela", cabecalho, linhas: corpo });
    } else if (limpa.startsWith("- ")) {
      fechaParagrafo();
      lista.push(limpa.slice(2));
    } else if (lista.length && linha.startsWith("  ")) {
      lista[lista.length - 1] += ` ${limpa}`;
    } else {
      fechaLista();
      paragrafo.push(limpa);
    }
  }
  fechaParagrafo();
  fechaLista();
  return blocos;
}

function bloco(b) {
  if (b.tipo === "paragrafo") return `        ${P}${inline(b.texto)}</p>`;
  if (b.tipo === "lista") return `        ${UL}${b.itens.map((i) => `${LI}${inline(i)}</li>`).join("")}</ul>`;
  if (b.tipo === "tabela") {
    const cab = b.cabecalho.map((c) => `${TH}${inline(c)}</th>`).join("");
    const corpo = b.linhas
      .map((l) => `<tr>${l.map((c) => `${TD}${inline(c)}</td>`).join("")}</tr>`)
      .join("");
    return `        <div style="overflow-x:auto;"><table style="width:100%; border-collapse:collapse; background:#fff; border:1px solid #E3E7E3; border-radius:16px; overflow:hidden;"><thead><tr>${cab}</tr></thead><tbody>${corpo}</tbody></table></div>`;
  }
  return "";
}

/**
 * "6.1. O que a moderação vê" → número "06.1" e título. O texto da política
 * cita seções pelo número ("veja a seção 6.2"), então o site usa o número do
 * .md, e não uma contagem própria — a cópia antiga contava 01…14 e a "6.2"
 * aparecia como "08". Sem número (diretrizes), vale a ordem.
 */
function numeroETitulo(texto, ordem) {
  const m = texto.match(/^(\d+(?:\.\d+)*)\.?\s+(.*)$/);
  if (!m) return { numero: String(ordem).padStart(2, "0"), titulo: texto };
  const [inteiro, ...resto] = m[1].split(".");
  return { numero: [inteiro.padStart(2, "0"), ...resto].join("."), titulo: m[2] };
}

function gera({ md, html, titulo }) {
  const fonte = readFileSync(join(legal, md), "utf8");
  const versao = fonte.match(/\*\*Versão:\*\*\s*([\d.]+)/)?.[1];
  const data = fonte.match(/\*\*Última atualização:\*\*\s*(.+)/)?.[1]?.trim();
  if (!versao || !data) throw new Error(`${md}: faltou "Última atualização" ou "Versão" no topo.`);

  // O cabeçalho do .md (título, data e versão) vira o topo da página; a
  // introdução é o que vem antes do primeiro ##.
  const semTopo = fonte
    .split("\n")
    .filter((l) => !/^\*\*(Última atualização|Versão):\*\*/.test(l.trim()))
    .join("\n");
  const blocos = analisa(semTopo).filter((b) => b.tipo !== "separador" && !(b.tipo === "titulo" && b.nivel === 1));

  const introducao = [];
  const secoes = [];
  for (const b of blocos) {
    if (b.tipo === "titulo") secoes.push({ titulo: b.texto, blocos: [] });
    else if (secoes.length) secoes[secoes.length - 1].blocos.push(b);
    else introducao.push(b);
  }

  const abas = ABAS.map((aba) =>
    aba.pagina === html
      ? `        <a href="${aba.href}" style="font:600 14px 'Plus Jakarta Sans'; color:#5B34C9; background:#F1EAFE; border:1px solid #DCCBFB; padding:10px 18px; border-radius:999px;">${aba.rotulo}</a>`
      : `        <a href="${aba.href}" style="font:600 14px 'Plus Jakarta Sans'; color:#5C6660; background:#fff; border:1px solid #DCE0D8; padding:10px 18px; border-radius:999px;">${aba.rotulo}</a>`,
  ).join("\n");

  const intro = introducao
    .map((b) =>
      b.tipo === "paragrafo"
        ? `        <p style="margin:0; font:400 16px/1.65 'Plus Jakarta Sans'; color:#5C6660;">${inline(b.texto)}</p>`
        : bloco(b),
    )
    .join("\n");

  const corpo = secoes
    .map((s, i) => {
      const { numero, titulo: t } = numeroETitulo(s.titulo, i + 1);
      return `      <section style="background:#fff; border:1px solid #E3E7E3; border-radius:24px; padding:32px 34px; display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; align-items:baseline; gap:12px;">
          <span style="font:700 12px 'Plus Jakarta Sans'; letter-spacing:.1em; color:#5B34C9;">${numero}</span>
          <h2 style="margin:0; font-size:21px; font-weight:700; letter-spacing:-.015em;">${inline(t)}</h2>
        </div>
${s.blocos.map(bloco).join("\n")}
      </section>`;
    })
    .join("\n\n");

  const main = `<main style="width:100%; box-sizing:border-box; padding:60px 56px 80px;">
    <div style="max-width:800px; margin:0 auto; display:flex; flex-direction:column; gap:30px;">

      <div style="display:flex; flex-direction:column; gap:14px;">
        <span style="align-self:flex-start; font:700 12px 'Plus Jakarta Sans'; letter-spacing:.14em; text-transform:uppercase; color:#5B34C9; background:#F1EAFE; border:1px solid #DCCBFB; padding:8px 16px; border-radius:999px;">Documento legal</span>
        <h1 style="margin:0; font-size:42px; font-weight:800; letter-spacing:-.03em; line-height:1.1; color:#16211A;">${titulo}</h1>
        <p style="margin:0; font:500 14.5px 'Plus Jakarta Sans'; color:#8A928B;">Última atualização: ${escapa(data)} · Versão ${versao}</p>
      </div>

      <div style="background:#fff; border:1px solid #E3E7E3; border-radius:24px; padding:26px 30px; display:flex; flex-direction:column; gap:14px;">
${intro}
      </div>

      <div class="lv-doc-abas" style="display:flex; gap:12px; flex-wrap:wrap;">
${abas}
      </div>

${corpo}

    </div>
  </main>`;

  const caminho = join(aqui, "public", html, "index.html");
  const atual = readFileSync(caminho, "utf8");
  const inicio = atual.indexOf("<main");
  const fim = atual.indexOf("</main>") + "</main>".length;
  if (inicio < 0 || fim < inicio) throw new Error(`${caminho}: não achei o <main>.`);
  writeFileSync(caminho, atual.slice(0, inicio) + main + atual.slice(fim));
  console.log(`${html}: versão ${versao}, ${secoes.length} seções`);
}

for (const pagina of PAGINAS) gera(pagina);
