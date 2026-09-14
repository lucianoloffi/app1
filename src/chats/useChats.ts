import { useState } from "react";
import { seedChats } from "../data/mockChats";
import type { Chat, Profile } from "../types";

export function useChats() {
  const [chats, setChats] = useState<Chat[]>(seedChats);

  function addMatchChat(profile: Profile) {
    setChats((prev) => {
      if (prev.some((chat) => chat.profileId === profile.id)) return prev;
      const chat: Chat = {
        id: `chat-${profile.id}`,
        profileId: profile.id,
        name: profile.name,
        photo: profile.photos[0],
        isNew: true,
        unread: 0,
        time: "agora",
        messages: [],
      };
      return [chat, ...prev];
    });
  }

  function openChat(id: string) {
    setChats((prev) =>
      prev.map((chat) => (chat.id === id ? { ...chat, isNew: false, unread: 0 } : chat)),
    );
  }

  function sendMessage(id: string, text: string) {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === id
          ? { ...chat, isNew: false, messages: [...chat.messages, { mine: true, text }] }
          : chat,
      ),
    );
  }

  function receiveMessage(id: string, text: string) {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === id ? { ...chat, messages: [...chat.messages, { mine: false, text }] } : chat,
      ),
    );
  }

  /** "Desfazer match": encerra a conversa e remove o match da lista. */
  function removeChat(id: string) {
    setChats((prev) => prev.filter((chat) => chat.id !== id));
  }

  /** "Finalizar conversa": arquiva — ninguém escreve até alguém reabrir. */
  function lockChat(id: string) {
    setChats((prev) => prev.map((chat) => (chat.id === id ? { ...chat, locked: true } : chat)));
  }

  function unlockChat(id: string) {
    setChats((prev) => prev.map((chat) => (chat.id === id ? { ...chat, locked: false } : chat)));
  }

  return {
    chats,
    addMatchChat,
    openChat,
    sendMessage,
    receiveMessage,
    removeChat,
    lockChat,
    unlockChat,
  };
}
