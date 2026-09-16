import { useCallback, useEffect, useRef, useState } from "react";
import {
  definirConversaFinalizada,
  desfazerMatch,
  listarMatches,
  type ResumoDeMatch,
} from "../lib/api/matches";
import { usuarioAtual } from "../lib/api/auth";
import {
  enviarMensagem,
  listarMensagens,
  marcarMensagensLidas,
  ouvirMatches,
  ouvirMinhasMensagens,
} from "../lib/api/messages";
import { mensagemDeErro } from "../lib/errors";
import type { Chat, ChatMessage } from "../types";
import { aplicaMensagemRecebida } from "./aplicaMensagem";
import { tempoRelativo } from "./tempo";

interface UseChatsOptions {
  ativo: boolean;
  onError?: (mensagem: string) => void;
}

function paraChat(resumo: ResumoDeMatch, mensagens: ChatMessage[]): Chat {
  return {
    id: resumo.matchId,
    profileId: resumo.outroId,
    name: resumo.nome,
    photo: resumo.foto,
    // "Novo match" enquanto ninguém escreveu nada além da primeira mensagem dela.
    isNew: !resumo.euJaEnviei && resumo.naoLidas > 0,
    unread: resumo.naoLidas,
    time: tempoRelativo(resumo.ultimaEm ?? resumo.criadoEm),
    locked: resumo.finalizada,
    messages: mensagens,
  };
}

export function useChats({ ativo, onError }: UseChatsOptions) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [carregando, setCarregando] = useState(true);
  const chatAberto = useRef<string | null>(null);

  const recarregar = useCallback(async (): Promise<ResumoDeMatch[]> => {
    try {
      const resumos = await listarMatches();
      setChats((anteriores) =>
        resumos.map((resumo) => {
          const anterior = anteriores.find((chat) => chat.id === resumo.matchId);
          // A lista mostra só a última mensagem; o histórico completo vem
          // quando a conversa é aberta.
          const mensagens =
            anterior && chatAberto.current === resumo.matchId
              ? anterior.messages
              : resumo.ultimaMensagem
                ? [{ mine: false, text: resumo.ultimaMensagem }]
                : [];
          return paraChat(resumo, mensagens);
        }),
      );
      return resumos;
    } catch (problema) {
      onError?.(mensagemDeErro(problema));
      return [];
    } finally {
      setCarregando(false);
    }
  }, [onError]);

  useEffect(() => {
    if (!ativo) return;
    void recarregar();

    let pararMensagens: (() => void) | null = null;
    let cancelado = false;

    const pararMatches = ouvirMatches(() => void recarregar());

    void usuarioAtual().then((usuario) => {
      if (!usuario || cancelado) return;

      pararMensagens = ouvirMinhasMensagens(usuario.id, ({ matchId, mensagem }) => {
        const estaAberta = chatAberto.current === matchId;

        setChats((prev) => {
          const resultado = aplicaMensagemRecebida(prev, matchId, mensagem, estaAberta);
          if (resultado.precisaRecarregar) void recarregar();
          return resultado.chats;
        });

        if (!mensagem.mine && estaAberta) void marcarMensagensLidas(matchId);
      });
    });

    return () => {
      cancelado = true;
      pararMatches();
      pararMensagens?.();
    };
  }, [ativo, recarregar]);

  async function openChat(id: string) {
    chatAberto.current = id;
    setChats((prev) =>
      prev.map((chat) => (chat.id === id ? { ...chat, isNew: false, unread: 0 } : chat)),
    );
    try {
      const [mensagens] = await Promise.all([listarMensagens(id), marcarMensagensLidas(id)]);
      setChats((prev) =>
        prev.map((chat) => (chat.id === id ? { ...chat, messages: mensagens } : chat)),
      );
    } catch (problema) {
      onError?.(mensagemDeErro(problema));
    }
  }

  function fecharChat() {
    chatAberto.current = null;
  }

  async function sendMessage(id: string, text: string, failed = false) {
    // Sem conexão: a mensagem aparece marcada como não enviada e fica
    // disponível para "Tentar de novo".
    if (failed) {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === id
            ? { ...chat, time: "agora", messages: [...chat.messages, { mine: true, text, failed: true }] }
            : chat,
        ),
      );
      return;
    }

    try {
      const mensagem = await enviarMensagem(id, text);
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === id && !chat.messages.some((item) => item.id === mensagem.id)
            ? { ...chat, isNew: false, time: "agora", messages: [...chat.messages, mensagem] }
            : chat,
        ),
      );
    } catch (problema) {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === id
            ? { ...chat, time: "agora", messages: [...chat.messages, { mine: true, text, failed: true }] }
            : chat,
        ),
      );
      onError?.(mensagemDeErro(problema));
    }
  }

  async function retryMessage(id: string, index: number) {
    const chat = chats.find((item) => item.id === id);
    const mensagem = chat?.messages[index];
    if (!mensagem) return;

    try {
      const enviada = await enviarMensagem(id, mensagem.text);
      setChats((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                messages: item.messages.map((atual, i) => (i === index ? enviada : atual)),
              }
            : item,
        ),
      );
    } catch (problema) {
      onError?.(mensagemDeErro(problema));
    }
  }

  async function removeChat(id: string) {
    try {
      await desfazerMatch(id);
      chatAberto.current = null;
      setChats((prev) => prev.filter((chat) => chat.id !== id));
    } catch (problema) {
      onError?.(mensagemDeErro(problema));
    }
  }

  async function definirFinalizada(id: string, finalizada: boolean) {
    try {
      await definirConversaFinalizada(id, finalizada);
      setChats((prev) =>
        prev.map((chat) => (chat.id === id ? { ...chat, locked: finalizada } : chat)),
      );
    } catch (problema) {
      onError?.(mensagemDeErro(problema));
    }
  }

  return {
    chats,
    carregando,
    recarregar,
    resetChats: () => {
      chatAberto.current = null;
      setChats([]);
    },
    openChat: (id: string) => void openChat(id),
    fecharChat,
    sendMessage: (id: string, text: string, failed = false) => void sendMessage(id, text, failed),
    retryMessage: (id: string, index: number) => void retryMessage(id, index),
    removeChat: (id: string) => void removeChat(id),
    lockChat: (id: string) => void definirFinalizada(id, true),
    unlockChat: (id: string) => void definirFinalizada(id, false),
  };
}
