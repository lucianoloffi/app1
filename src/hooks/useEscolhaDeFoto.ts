import { useState } from "react";
import { validaFotoEscolhida } from "../lib/imagem";

interface Opcoes {
  /** Uma operação de foto em andamento: enquanto isso, não abre outra. */
  busy?: boolean;
  onErro: (mensagem: string) => void;
  /** Envia a foto; a promessa termina quando o envio acaba (certo ou errado). */
  onEnviar: (indice: number, imagem: Blob) => Promise<void>;
}

/**
 * O caminho de uma foto nova, igual no cadastro e na edição do perfil:
 * escolher o arquivo → recortar → enviar mostrando a própria foto com um
 * carregando por cima, até o envio terminar.
 *
 * A prévia some quando o envio acaba: deu certo, a foto de verdade toma o
 * lugar; deu errado, o espaço volta a ficar vazio e quem envia mostra o aviso.
 */
export function useEscolhaDeFoto({ busy, onErro, onEnviar }: Opcoes) {
  const [pendente, setPendente] = useState<{ indice: number; arquivo: File } | null>(null);
  const [envio, setEnvio] = useState<{ indice: number; previa: string } | null>(null);

  function escolher(indice: number, arquivo: File | null) {
    if (!arquivo || busy) return;
    const problema = validaFotoEscolhida(arquivo);
    if (problema) {
      onErro(problema);
      return;
    }
    setPendente({ indice, arquivo });
  }

  async function confirmar(imagem: Blob) {
    if (!pendente) return;
    const previa = URL.createObjectURL(imagem);
    setEnvio({ indice: pendente.indice, previa });
    setPendente(null);
    try {
      await onEnviar(pendente.indice, imagem);
    } finally {
      setEnvio(null);
      URL.revokeObjectURL(previa);
    }
  }

  function cancelar() {
    setPendente(null);
  }

  return { pendente, envio, escolher, confirmar, cancelar };
}
