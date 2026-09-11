import type { Chat } from "../types";

export const seedChats: Chat[] = [
  {
    id: "chat-fernanda",
    profileId: "seed-fernanda",
    name: "Fernanda",
    photo: "https://i.pravatar.cc/200?img=20",
    isNew: false,
    unread: 1,
    time: "11:40",
    status: "online agora",
    messages: [{ mine: false, text: "Olá, estava aqui pensando em conversar…" }],
  },
  {
    id: "chat-julia",
    profileId: "seed-julia",
    name: "Julia Nogueira",
    photo: "https://i.pravatar.cc/200?img=21",
    isNew: false,
    unread: 0,
    time: "ontem",
    status: "visto por último ontem",
    messages: [
      { mine: false, text: "Oieee." },
      { mine: true, text: "Oi! tudo bem?" },
    ],
  },
  {
    id: "chat-bianca",
    profileId: "seed-bianca",
    name: "Bianca Alves",
    photo: "https://i.pravatar.cc/200?img=22",
    isNew: false,
    unread: 0,
    time: "seg",
    status: "visto por último segunda",
    messages: [
      { mine: false, text: "Bora marcar então?" },
      { mine: true, text: "Combinado então!" },
    ],
  },
];
