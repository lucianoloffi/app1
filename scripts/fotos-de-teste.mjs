/**
 * De onde saem as fotos dos perfis de teste. Três modos:
 *
 *   pasta   fotos suas, uma por pessoa, em fotos-de-teste/mulheres e
 *           fotos-de-teste/homens. É o modo que dá o resultado mais realista.
 *   pexels  fotos do banco de imagens Pexels (licença livre), buscadas por
 *           gênero. Precisa de uma chave gratuita em
 *           https://www.pexels.com/api/ — leva um minuto e não pede cartão.
 *   cores   imagens geradas aqui mesmo: degradê e silhueta, sem rede e sem
 *           licença nenhuma. Feias, mas servem para ver a tela populada.
 *
 * Nos três casos as fotos de um perfil são da MESMA pessoa, em enquadramentos
 * diferentes. Três rostos diferentes no mesmo perfil fariam o app parecer
 * quebrado.
 */
import { readdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { deflateSync } from "node:zlib";
import jpeg from "jpeg-js";

const BUSCA_POR_GENERO = {
  mulher: ["portrait of a woman smiling", "brazilian woman portrait", "woman portrait outdoors"],
  homem: ["portrait of a man smiling", "brazilian man portrait", "man portrait outdoors"],
};

/** Quantas fotos cada perfil recebe (o cadastro exige no mínimo 3). */
export const FOTOS_POR_PERFIL = 3;

// ───────────────────────────────── Pexels ─────────────────────────────────

async function buscaNoPexels(chave, consulta, pagina) {
  const url =
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(consulta)}` +
    `&per_page=40&page=${pagina}&orientation=portrait`;

  const resposta = await fetch(url, { headers: { Authorization: chave } });
  if (resposta.status === 401) {
    throw new Error("O Pexels recusou a chave (401). Confira a PEXELS_API_KEY.");
  }
  if (!resposta.ok) {
    throw new Error(`O Pexels respondeu ${resposta.status} para "${consulta}".`);
  }
  const corpo = await resposta.json();
  return corpo.photos ?? [];
}

/**
 * Devolve uma função que entrega uma foto ainda não usada para cada gênero.
 * Busca tudo de uma vez: são duas ou três requisições, não uma por perfil.
 */
export async function reservaDeFotosDoPexels(chave, necessarioPorGenero) {
  const reserva = { mulher: [], homem: [] };

  for (const genero of ["mulher", "homem"]) {
    const vistos = new Set();
    for (const consulta of BUSCA_POR_GENERO[genero]) {
      if (reserva[genero].length >= necessarioPorGenero) break;
      for (const foto of await buscaNoPexels(chave, consulta, 1)) {
        if (vistos.has(foto.id)) continue;
        vistos.add(foto.id);
        reserva[genero].push(foto);
      }
    }
    if (reserva[genero].length < necessarioPorGenero) {
      throw new Error(
        `O Pexels devolveu só ${reserva[genero].length} fotos de ${genero}, ` +
          `e são necessárias ${necessarioPorGenero}.`,
      );
    }
  }

  const usados = { mulher: 0, homem: 0 };
  return (genero) => reserva[genero][usados[genero]++];
}

/**
 * Três enquadramentos que o próprio Pexels já entrega da mesma imagem, do mais
 * fechado ao mais aberto — é o que dá a impressão de fotos diferentes.
 */
function variacoesDaFoto(foto) {
  return [foto.src.portrait, foto.src.large, foto.src.landscape].filter(Boolean);
}

async function baixa(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Falha ao baixar a foto (${resposta.status}): ${url}`);
  const bytes = Buffer.from(await resposta.arrayBuffer());
  // O bucket recusa acima de 5 MB; melhor avisar aqui do que estourar no upload.
  if (bytes.length > 5 * 1024 * 1024) {
    throw new Error(`Foto grande demais (${(bytes.length / 1048576).toFixed(1)} MB): ${url}`);
  }
  if (bytes.length < 1024) throw new Error(`Resposta pequena demais para ser uma foto: ${url}`);
  return bytes;
}

// ────────────────────────────── modo "cores" ──────────────────────────────

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pedaco(tipo, dados) {
  const corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dados]);
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const verificacao = Buffer.alloc(4);
  verificacao.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, verificacao]);
}

/** PNG truecolor sem dependência externa: cabeçalho, pixels e fim. */
function paraPng(largura, altura, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; // 8 bits por canal
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco("IHDR", ihdr),
    pedaco("IDAT", deflateSync(pixels, { level: 9 })),
    pedaco("IEND", Buffer.alloc(0)),
  ]);
}

function hslParaRgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((valor) => Math.round(valor * 255));
}

function semente(texto) {
  let valor = 0;
  for (const caractere of texto) valor = (valor * 31 + caractere.codePointAt(0)) >>> 0;
  return valor;
}

/**
 * Degradê com uma silhueta de cabeça e ombros. A cor vem do nome, então cada
 * perfil fica com a sua e as três fotos variam só no enquadramento.
 */
function imagemDeCores(nome, indice) {
  const largura = 720;
  const altura = 960;
  const matiz = semente(nome) % 360;
  const [r1, g1, b1] = hslParaRgb(matiz, 0.55, 0.62);
  const [r2, g2, b2] = hslParaRgb((matiz + 40) % 360, 0.5, 0.38);

  const zoom = 1 + indice * 0.35;
  const centroX = largura / 2;
  const cabecaY = altura * 0.36;
  const raioCabeca = largura * 0.16 * zoom;
  const ombroY = cabecaY + raioCabeca * 1.25;
  const raioOmbroX = largura * 0.3 * zoom;
  const raioOmbroY = altura * 0.4 * zoom;

  const pixels = Buffer.alloc(altura * (1 + largura * 3));
  let posicao = 0;
  for (let y = 0; y < altura; y++) {
    pixels[posicao++] = 0; // filtro "none" na linha
    const mistura = y / altura;
    const fundo = [
      Math.round(r1 + (r2 - r1) * mistura),
      Math.round(g1 + (g2 - g1) * mistura),
      Math.round(b1 + (b2 - b1) * mistura),
    ];
    for (let x = 0; x < largura; x++) {
      const naCabeca = (x - centroX) ** 2 + (y - cabecaY) ** 2 <= raioCabeca ** 2;
      const nosOmbros =
        y > ombroY && ((x - centroX) / raioOmbroX) ** 2 + ((y - ombroY) / raioOmbroY) ** 2 <= 1;
      const clareia = naCabeca || nosOmbros ? 52 : 0;
      pixels[posicao++] = Math.min(255, fundo[0] + clareia);
      pixels[posicao++] = Math.min(255, fundo[1] + clareia);
      pixels[posicao++] = Math.min(255, fundo[2] + clareia);
    }
  }
  return paraPng(largura, altura, pixels);
}

// ────────────────────────────── modo "pasta" ──────────────────────────────

const EXTENSOES = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const SUBPASTA = { mulher: "mulheres", homem: "homens" };

/**
 * Lê fotos suas de fotos-de-teste/mulheres e fotos-de-teste/homens.
 *
 * Sem `repetir`, é um arquivo por pessoa e o script cria só os perfis que têm
 * foto. Com `repetir`, a mesma foto atende mais de um perfil, cada vez com uma
 * variação (espelhada, tom diferente, outro enquadramento na capa) — serve
 * para encher a fila, mas é o mesmo rosto: lado a lado dá para perceber.
 */
export function reservaDaPasta(pasta, { repetir = false, limitePorGenero = {} } = {}) {
  const arquivos = { mulher: [], homem: [] };

  for (const genero of ["mulher", "homem"]) {
    const caminho = join(pasta, SUBPASTA[genero]);
    let nomes;
    try {
      nomes = readdirSync(caminho);
    } catch {
      throw new Error(
        `Não achei a pasta ${caminho}.\n` +
          `  Crie ${pasta}/mulheres e ${pasta}/homens e ponha uma foto por pessoa ` +
          `(.jpg, .png ou .webp).`,
      );
    }
    arquivos[genero] = nomes
      .filter((nome) => EXTENSOES.has(extname(nome).toLowerCase()))
      .sort()
      .map((nome) => join(caminho, nome));
  }

  if (arquivos.mulher.length === 0 && arquivos.homem.length === 0) {
    throw new Error(`Nenhuma imagem em ${pasta}/mulheres nem em ${pasta}/homens.`);
  }

  const disponivel = { mulher: arquivos.mulher.length, homem: arquivos.homem.length };
  const cobertura = {};
  for (const genero of ["mulher", "homem"]) {
    const limite = limitePorGenero[genero] ?? disponivel[genero];
    cobertura[genero] =
      disponivel[genero] === 0 ? 0 : repetir ? limite : Math.min(disponivel[genero], limite);
  }

  const usados = { mulher: 0, homem: 0 };
  return {
    disponivel,
    cobertura,
    /** Devolve o arquivo e em que volta ele está — a volta vira a variação. */
    proxima(genero) {
      const lista = arquivos[genero];
      const indice = usados[genero]++;
      return {
        caminho: lista[indice % lista.length],
        variacao: Math.floor(indice / lista.length),
      };
    },
  };
}

/**
 * O que muda de uma volta para a outra. Espelhar é o que mais disfarça: o
 * rosto vira para o outro lado e a foto deixa de parecer a mesma de relance.
 */
const VARIACOES = [
  { espelho: false, ganho: [1, 1, 1], brilho: 0 },
  { espelho: true, ganho: [1.07, 1, 0.9], brilho: 8 },
  { espelho: false, ganho: [0.92, 0.99, 1.1], brilho: -6 },
  { espelho: true, ganho: [1.02, 1.02, 1.04], brilho: 16 },
];

/** Espelho e ajuste de tom, aplicados uma vez antes de recortar. */
function aplicaVariacao(imagem, indice) {
  const { espelho, ganho, brilho } = VARIACOES[indice % VARIACOES.length];
  if (!espelho && brilho === 0 && ganho.every((valor) => valor === 1)) return imagem;

  const data = Buffer.alloc(imagem.data.length);
  for (let y = 0; y < imagem.height; y++) {
    for (let x = 0; x < imagem.width; x++) {
      const origem = (y * imagem.width + (espelho ? imagem.width - 1 - x : x)) * 4;
      const destino = (y * imagem.width + x) * 4;
      for (let canal = 0; canal < 3; canal++) {
        const valor = imagem.data[origem + canal] * ganho[canal] + brilho;
        data[destino + canal] = valor < 0 ? 0 : valor > 255 ? 255 : valor;
      }
      data[destino + 3] = 255;
    }
  }
  return { data, width: imagem.width, height: imagem.height };
}

/** Média dos pixels da área de origem: dá um encolhimento limpo, sem serrilhado. */
function recorta(imagem, area, larguraAlvo, alturaAlvo) {
  const saida = Buffer.alloc(larguraAlvo * alturaAlvo * 4);
  const passoX = area.largura / larguraAlvo;
  const passoY = area.altura / alturaAlvo;

  for (let y = 0; y < alturaAlvo; y++) {
    const deY = area.y + Math.floor(y * passoY);
    const ateY = Math.min(area.y + area.altura, area.y + Math.floor((y + 1) * passoY)) || deY + 1;
    for (let x = 0; x < larguraAlvo; x++) {
      const deX = area.x + Math.floor(x * passoX);
      const ateX = Math.min(area.x + area.largura, area.x + Math.floor((x + 1) * passoX)) || deX + 1;

      let r = 0;
      let g = 0;
      let b = 0;
      let total = 0;
      for (let oy = deY; oy < Math.max(ateY, deY + 1); oy++) {
        for (let ox = deX; ox < Math.max(ateX, deX + 1); ox++) {
          const origem = (oy * imagem.width + ox) * 4;
          r += imagem.data[origem];
          g += imagem.data[origem + 1];
          b += imagem.data[origem + 2];
          total++;
        }
      }
      const destino = (y * larguraAlvo + x) * 4;
      saida[destino] = r / total;
      saida[destino + 1] = g / total;
      saida[destino + 2] = b / total;
      saida[destino + 3] = 255;
    }
  }
  return saida;
}

/**
 * Três enquadramentos da mesma foto: o retrato inteiro, um mais fechado no
 * terço de cima (onde costuma estar o rosto) e um quadrado. Sem isso as três
 * fotos do carrossel sairiam idênticas.
 */
const ENQUADRAMENTOS = [
  { proporcao: 3 / 4, escala: 1, ancora: 0.5 },
  { proporcao: 3 / 4, escala: 0.62, ancora: 0.26 },
  { proporcao: 1, escala: 0.84, ancora: 0.4 },
];

/**
 * Onde a pessoa está na largura da foto. Importa em foto deitada: recortar
 * 3:4 sempre pelo meio corta o rosto de quem posou de lado. Vem do nome do
 * arquivo — lucas-direita.jpg, bruno-esquerda.jpg — e o padrão é o meio.
 */
const ANCORA_HORIZONTAL = { esquerda: 0.25, centro: 0.5, direita: 0.75 };

function ancoraDoNome(caminho) {
  const nome = basename(caminho, extname(caminho)).toLowerCase();
  for (const lado of ["esquerda", "direita"]) {
    if (nome.endsWith(`-${lado}`)) return ANCORA_HORIZONTAL[lado];
  }
  return ANCORA_HORIZONTAL.centro;
}

function enquadra(imagem, indice, ancoraX = 0.5) {
  const { proporcao, escala, ancora } = ENQUADRAMENTOS[indice % ENQUADRAMENTOS.length];

  // O maior retângulo com essa proporção que cabe na foto, reduzido pela escala.
  let largura = Math.min(imagem.width, imagem.height * proporcao) * escala;
  let altura = largura / proporcao;
  if (altura > imagem.height) {
    altura = imagem.height * escala;
    largura = altura * proporcao;
  }
  largura = Math.max(1, Math.floor(largura));
  altura = Math.max(1, Math.floor(altura));

  const area = {
    x: Math.round(Math.min(Math.max((imagem.width - largura) * ancoraX, 0), imagem.width - largura)),
    y: Math.round(Math.min(Math.max((imagem.height - altura) * ancora, 0), imagem.height - altura)),
    largura,
    altura,
  };

  const larguraAlvo = Math.min(900, largura);
  const alturaAlvo = Math.max(1, Math.round((larguraAlvo * altura) / largura));
  return {
    data: recorta(imagem, area, larguraAlvo, alturaAlvo),
    width: larguraAlvo,
    height: alturaAlvo,
  };
}

function fotosDoArquivo(caminho, variacao) {
  const bruto = readFileSync(caminho);
  if (bruto.length > 5 * 1024 * 1024 && extname(caminho).toLowerCase() === ".png") {
    throw new Error(`${caminho}: acima do limite de 5 MB do bucket.`);
  }

  // Só JPEG é recortado aqui — decodificar PNG e WEBP exigiria mais peso do
  // que este script merece. Nos outros formatos a mesma imagem vai três vezes.
  if (![".jpg", ".jpeg"].includes(extname(caminho).toLowerCase())) {
    return Array.from({ length: FOTOS_POR_PERFIL }, () => ({
      bytes: bruto,
      tipo: extname(caminho).toLowerCase() === ".png" ? "image/png" : "image/webp",
      extensao: extname(caminho).toLowerCase().slice(1),
      semEnquadramento: true,
      repetida: variacao > 0,
    }));
  }

  const imagem = aplicaVariacao(
    jpeg.decode(bruto, { useTArray: true, maxMemoryUsageInMB: 1024 }),
    variacao,
  );
  // Espelhar leva a pessoa para o outro lado da foto, então a âncora vai junto.
  const ancoraX = VARIACOES[variacao % VARIACOES.length].espelho
    ? 1 - ancoraDoNome(caminho)
    : ancoraDoNome(caminho);

  // O deslocamento troca qual enquadramento vira a capa do perfil.
  return Array.from({ length: FOTOS_POR_PERFIL }, (_, indice) => ({
    bytes: Buffer.from(jpeg.encode(enquadra(imagem, indice + variacao, ancoraX), 82).data),
    tipo: "image/jpeg",
    extensao: "jpg",
    repetida: variacao > 0,
  }));
}

// ────────────────────────────────── API ──────────────────────────────────

/**
 * Devolve as 3 fotos de um perfil, já em bytes, prontas para o upload.
 * `proximaFoto` entrega a foto daquele gênero nos modos pexels e pasta.
 */
export async function fotosDoPerfil(modo, perfil, proximaFoto) {
  if (modo === "cores") {
    return Array.from({ length: FOTOS_POR_PERFIL }, (_, indice) => ({
      bytes: imagemDeCores(perfil.nome, indice),
      tipo: "image/png",
      extensao: "png",
    }));
  }

  if (modo === "pasta") {
    const { caminho, variacao } = proximaFoto(perfil.genero);
    return fotosDoArquivo(caminho, variacao);
  }

  const foto = proximaFoto(perfil.genero);
  const variacoes = variacoesDaFoto(foto);
  const bytes = [];
  for (let indice = 0; indice < FOTOS_POR_PERFIL; indice++) {
    bytes.push({
      bytes: await baixa(variacoes[indice % variacoes.length]),
      tipo: "image/jpeg",
      extensao: "jpg",
      creditoDe: foto.photographer,
      creditoUrl: foto.url,
    });
  }
  return bytes;
}
