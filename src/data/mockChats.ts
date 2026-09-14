import type { Chat } from "../types";
import { matchedProfiles } from "./matchedProfiles";

function photoFor(id: string): string {
  return matchedProfiles.find((profile) => profile.id === id)?.photos[0] ?? "";
}

export const seedChats: Chat[] = [
  {
    id: "chat-tatiane",
    profileId: "seed-tatiane",
    name: "Tatiane Rocha",
    photo: photoFor("seed-tatiane"),
    isNew: true,
    unread: 2,
    time: "agora",
    messages: [
      { mine: false, text: "Oi! Gostei do seu perfil." },
      { mine: false, text: "Você é de Joinville mesmo?" },
    ],
  },
  {
    id: "chat-aline",
    profileId: "seed-aline",
    name: "Aline Ferreira",
    photo: photoFor("seed-aline"),
    isNew: true,
    unread: 1,
    time: "10 min",
    messages: [{ mine: false, text: "Oi! Vi que você tem um pet. Me conta mais?" }],
  },
  {
    id: "chat-julia",
    profileId: "seed-julia",
    name: "Júlia Nogueira",
    photo: photoFor("seed-julia"),
    isNew: false,
    unread: 0,
    time: "ontem",
    messages: [
      { mine: false, text: "Olá, estava aqui pensando em conversar com alguém bacana!" },
      { mine: true, text: "Que bom! vamos conversar!" },
      { mine: false, text: "Você é daqui de Joinville mesmo?" },
      { mine: true, text: "Sou sim, moro no Bucarein faz uns dez anos." },
    ],
  },
  {
    id: "chat-priscila",
    profileId: "seed-priscila",
    name: "Priscila Matos",
    photo: photoFor("seed-priscila"),
    isNew: false,
    unread: 0,
    time: "seg",
    messages: [
      { mine: false, text: "Oi! Vi que você também corre." },
      { mine: true, text: "Corro, mas devagar. Domingo de manhã é sagrado." },
      { mine: false, text: "Combinado então, domingo no parque." },
    ],
  },
  {
    id: "chat-carla",
    profileId: "seed-carla",
    name: "Carla Menezes",
    photo: photoFor("seed-carla"),
    isNew: false,
    unread: 0,
    time: "sex",
    messages: [
      { mine: false, text: "Adorei a conversa de ontem!" },
      { mine: true, text: "Eu também. Bora repetir nesse fim de semana?" },
      { mine: false, text: "Fechado. Me chama sábado." },
    ],
  },
  {
    id: "chat-renata",
    profileId: "seed-renata",
    name: "Renata Lima",
    photo: photoFor("seed-renata"),
    isNew: false,
    unread: 0,
    time: "23/08",
    messages: [{ mine: false, text: "Oi! Tudo bem?" }],
  },
];
