import type { Chat, ChatMessage } from "../types";

/**
 * Regra de chegada de mensagem, separada do hook para poder ser testada:
 * a conversa aberta recebe na hora, as outras sobem o contador de não lidas,
 * e a mensagem que volta do servidor depois do envio não duplica.
 */
export function aplicaMensagemRecebida(
  chats: Chat[],
  matchId: string,
  mensagem: ChatMessage,
  estaAberta: boolean,
): { chats: Chat[]; precisaRecarregar: boolean } {
  const chat = chats.find((item) => item.id === matchId);

  // Mensagem de um match que ainda não está na lista.
  if (!chat) return { chats, precisaRecarregar: true };

  if (mensagem.id && chat.messages.some((item) => item.id === mensagem.id)) {
    return { chats, precisaRecarregar: false };
  }

  return {
    precisaRecarregar: false,
    chats: chats.map((item) =>
      item.id === matchId
        ? {
            ...item,
            time: "agora",
            isNew: mensagem.mine || estaAberta ? false : item.isNew,
            unread: mensagem.mine || estaAberta ? item.unread : item.unread + 1,
            messages: [...item.messages, mensagem],
          }
        : item,
    ),
  };
}
