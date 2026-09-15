/** Redimensiona e comprime a imagem no dispositivo, antes de subir. */

const LADO_MAXIMO = 1280;
const QUALIDADE = 0.82;
export const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
export const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

export function validaArquivoDeImagem(arquivo: File): string | null {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) return "Formato não suportado. Use JPG, PNG ou WEBP.";
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) return "A imagem é grande demais. Escolha outra.";
  return null;
}

function carregaImagem(arquivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    img.src = url;
  });
}

/** Devolve um JPEG com no máximo 1280px no maior lado. */
export async function comprimeImagem(arquivo: File): Promise<Blob> {
  const img = await carregaImagem(arquivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(img.width, img.height));
  const largura = Math.round(img.width * escala);
  const altura = Math.round(img.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("Não foi possível processar a imagem.");
  contexto.drawImage(img, 0, 0, largura, altura);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALIDADE),
  );
  if (!blob) throw new Error("Não foi possível processar a imagem.");
  return blob;
}
