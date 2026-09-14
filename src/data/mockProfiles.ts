import type { Profile } from "../types";
import { matchedProfiles } from "./matchedProfiles";

export const CURRENT_USER_INTERESTS = [
  "Praia",
  "Corrida",
  "Cozinhar",
  "Viagem",
  "Cinema",
  "Café",
];

export const mockProfiles: Profile[] = [
  {
    id: "p1",
    name: "Camila",
    age: 28,
    gender: "mulher",
    profession: "Arquiteta",
    city: "Joinville, SC",
    distanceKm: 8,
    intention: "serio",
    interests: ["Praia", "Corrida", "Cozinhar", "Leitura"],
    bio: "Arquiteta, corro aos sábados e cozinho mal, mas com entusiasmo. Procuro alguém para dividir a rotina.",
    prompt: {
      label: "Não vivo sem",
      answer: "Café coado de manhã e uma boa trilha aos domingos.",
    },
    photos: [
      "https://i.pravatar.cc/600?img=47",
      "https://i.pravatar.cc/600?img=48",
      "https://i.pravatar.cc/600?img=49",
    ],
    likesYou: true,
    lifestyle: { bebida: "socialmente", atividade: "todo-dia", filhos: "quero-ter" },
    relationshipStatus: "solteiro",
    height: 1.66,
  },
  {
    id: "p2",
    name: "Beatriz",
    age: 26,
    gender: "mulher",
    profession: "Designer",
    city: "Joinville, SC",
    distanceKm: 5,
    intention: "serio",
    interests: ["Cinema", "Viagem", "Café", "Shows"],
    bio: "Designer de produto, apaixonada por filmes antigos e por conhecer lugares novos sem pressa.",
    prompt: {
      label: "Um sábado perfeito",
      answer: "Cinema à tarde e um bar tranquilo à noite.",
    },
    photos: [
      "https://i.pravatar.cc/600?img=32",
      "https://i.pravatar.cc/600?img=33",
    ],
    lifestyle: { bebida: "nao-bebo", atividade: "algumas-vezes", filhos: "nao-tenho" },
    relationshipStatus: "solteiro",
    height: 1.7,
  },
  {
    id: "p3",
    name: "Larissa",
    age: 30,
    gender: "mulher",
    profession: "Fisioterapeuta",
    city: "São Francisco do Sul, SC",
    distanceKm: 22,
    intention: "conhecer",
    interests: ["Praia", "Pets", "Viagem"],
    bio: "Fisioterapeuta, tenho dois cachorros e adoro o mar. Sem pressa para nada, só curtindo a vida.",
    prompt: {
      label: "Comigo você vai",
      answer: "Aprender a gostar de praia ao amanhecer.",
    },
    photos: [
      "https://i.pravatar.cc/600?img=44",
      "https://i.pravatar.cc/600?img=45",
      "https://i.pravatar.cc/600?img=46",
    ],
    lifestyle: { bebida: "socialmente", atividade: "raramente", filhos: "tenho" },
    relationshipStatus: "divorciado",
    height: 1.68,
  },
  {
    id: "p4",
    name: "Mariana",
    age: 27,
    gender: "mulher",
    profession: "Engenheira de dados",
    city: "Joinville, SC",
    distanceKm: 3,
    intention: "serio",
    interests: ["Corrida", "Leitura", "Café", "Cozinhar"],
    bio: "Engenheira de dados nas horas vagas e corredora nas outras. Procuro alguém para trocar livros e receitas.",
    prompt: {
      label: "Não vivo sem",
      answer: "Uma boa playlist para correr e um livro por perto.",
    },
    photos: ["https://i.pravatar.cc/600?img=25"],
    lifestyle: { bebida: "nao-bebo", atividade: "todo-dia", filhos: "nao-quero" },
    relationshipStatus: "solteiro",
    height: 1.64,
  },
  {
    id: "p5",
    name: "Rafael",
    age: 29,
    gender: "homem",
    profession: "Fotógrafo",
    city: "Joinville, SC",
    distanceKm: 12,
    intention: "conhecer",
    interests: ["Viagem", "Café", "Fotografia", "Vinho"],
    bio: "Fotógrafo, sempre com uma câmera na mochila. Adoro um café bom e histórias de viagem.",
    prompt: {
      label: "Um sábado perfeito",
      answer: "Caminhar pela cidade fotografando e terminar num bar de vinho.",
    },
    photos: [
      "https://i.pravatar.cc/600?img=52",
      "https://i.pravatar.cc/600?img=53",
    ],
    lifestyle: { bebida: "socialmente", atividade: "algumas-vezes", filhos: "nao-tenho" },
    relationshipStatus: "solteiro",
    height: 1.78,
  },
];

/** Fila de descoberta + pessoas com quem já existe conversa. */
export const allProfiles: Profile[] = [...mockProfiles, ...matchedProfiles];

export function findProfileById(id: string): Profile | undefined {
  return allProfiles.find((profile) => profile.id === id);
}
