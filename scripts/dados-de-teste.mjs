/**
 * Os 20 perfis de teste — 10 mulheres que buscam homens e 10 homens que buscam
 * mulheres. Só dados: quem escreve no banco é o popular-perfis.mjs.
 *
 * Os valores seguem exatamente as listas fechadas do app (CITY_OPTIONS e
 * INTEREST_OPTIONS em src/onboarding/constants.ts) e os CHECKs do schema. Se
 * alguma opção mudar lá, muda aqui também — o banco recusa o resto.
 */

/**
 * Centro dos municípios, copiado de
 * supabase/migrations/20260915_0005_seed_cities.sql (a fonte da verdade).
 * Usado para dar uma coordenada a cada perfil, com um desvio pequeno, para a
 * fila mostrar distâncias diferentes em vez de todo mundo a 0 km.
 */
export const CENTRO_DAS_CIDADES = {
  "Joinville, SC": { lat: -26.3044, lng: -48.8456 },
  "Jaraguá do Sul, SC": { lat: -26.4851, lng: -49.0671 },
  "São Francisco do Sul, SC": { lat: -26.2433, lng: -48.6383 },
  "Blumenau, SC": { lat: -26.9194, lng: -49.0661 },
  "Itajaí, SC": { lat: -26.9078, lng: -48.6619 },
  "Araquari, SC": { lat: -26.3706, lng: -48.7219 },
};

/**
 * A idade vira data de nascimento na hora de rodar, e não uma data fixa, para
 * os perfis não envelhecerem sozinhos e saírem da faixa etária do filtro.
 */
export const PERFIS = [
  // ───────────────────────────── mulheres ─────────────────────────────
  {
    nome: "Ana Beatriz",
    genero: "mulher",
    buscaPor: "homem",
    idade: 28,
    cidade: "Joinville, SC",
    profissao: "Fisioterapeuta",
    altura: 1.66,
    status: "solteiro",
    intencao: "serio",
    bio: "Gosto de acordar cedo, correr na orla e terminar o dia com um café bem tirado.",
    interesses: ["Corrida", "Café", "Praia", "Cinema"],
    bebida: "socialmente",
    atividade: "todo-dia",
    filhos: "quero-ter",
  },
  {
    nome: "Camila",
    genero: "mulher",
    buscaPor: "homem",
    idade: 34,
    cidade: "Joinville, SC",
    profissao: "Arquiteta",
    altura: 1.71,
    status: "divorciado",
    intencao: "serio",
    bio: "Projeto casas durante a semana e fujo para a serra no fim de semana. Prometo não falar de obra o tempo todo.",
    interesses: ["Arte", "Trilha", "Vinho", "Fotografia", "Gastronomia"],
    bebida: "socialmente",
    atividade: "algumas-vezes",
    filhos: "tenho",
  },
  {
    nome: "Larissa",
    genero: "mulher",
    buscaPor: "homem",
    idade: 26,
    cidade: "Araquari, SC",
    profissao: "Professora",
    altura: 1.6,
    status: "solteiro",
    intencao: "conhecer",
    bio: "Dou aula para o quarto ano, então já ouvi todas as piadas. Topo qualquer programa que envolva música ao vivo.",
    interesses: ["Música ao vivo", "Leitura", "Pets", "Dança"],
    bebida: "socialmente",
    atividade: "algumas-vezes",
    filhos: "quero-ter",
  },
  {
    nome: "Juliana",
    genero: "mulher",
    buscaPor: "homem",
    idade: 31,
    cidade: "Joinville, SC",
    profissao: "Enfermeira",
    altura: 1.68,
    status: "solteiro",
    intencao: "serio",
    bio: "Plantão de 12 horas e ainda sobra energia para a academia. Procuro alguém que entenda escala de trabalho.",
    interesses: ["Academia", "Séries", "Cozinhar", "Pets"],
    bebida: "nao-bebo",
    atividade: "todo-dia",
    filhos: "nao-tenho",
  },
  {
    nome: "Mariana",
    genero: "mulher",
    buscaPor: "homem",
    idade: 29,
    cidade: "Jaraguá do Sul, SC",
    profissao: "Designer",
    altura: 1.63,
    status: "solteiro",
    intencao: "conhecer",
    bio: "Trabalho com marcas, coleciono discos e faço o melhor molho de tomate desta cidade.",
    interesses: ["Cozinhar", "Música ao vivo", "Cinema", "Viagem", "Café"],
    bebida: "socialmente",
    atividade: "raramente",
    filhos: "nao-quero",
  },
  {
    nome: "Patrícia",
    genero: "mulher",
    buscaPor: "homem",
    idade: 38,
    cidade: "Joinville, SC",
    profissao: "Advogada",
    altura: 1.74,
    status: "divorciado",
    intencao: "serio",
    bio: "Mãe de uma menina de 7 anos e de um labrador fora de controle. Fim de semana é praia, sem negociação.",
    interesses: ["Praia", "Pets", "Leitura", "Vinho"],
    bebida: "socialmente",
    atividade: "algumas-vezes",
    filhos: "tenho",
  },
  {
    nome: "Rafaela",
    genero: "mulher",
    buscaPor: "homem",
    idade: 24,
    cidade: "Joinville, SC",
    profissao: "Auxiliar veterinária",
    altura: 1.58,
    status: "solteiro",
    intencao: "conhecer",
    bio: "Cheguei há pouco tempo na cidade e quero conhecer gente para dividir trilha, bar e maratona de série.",
    interesses: ["Pets", "Trilha", "Séries", "Cerveja artesanal", "Games"],
    bebida: "socialmente",
    atividade: "algumas-vezes",
    filhos: "nao-tenho",
  },
  {
    nome: "Bruna",
    genero: "mulher",
    buscaPor: "homem",
    idade: 33,
    cidade: "São Francisco do Sul, SC",
    profissao: "Chef de cozinha",
    altura: 1.69,
    status: "separado",
    intencao: "conhecer",
    bio: "Cozinho o dia inteiro e mesmo assim adoro sair para comer. Me leva num boteco bom e eu fico.",
    interesses: ["Gastronomia", "Cerveja artesanal", "Praia", "Viagem"],
    bebida: "frequentemente",
    atividade: "raramente",
    filhos: "nao-quero",
  },
  {
    nome: "Carolina",
    genero: "mulher",
    buscaPor: "homem",
    idade: 41,
    cidade: "Blumenau, SC",
    profissao: "Psicóloga",
    altura: 1.65,
    status: "viuvo",
    intencao: "serio",
    bio: "Passo o dia ouvindo, então em casa gosto de silêncio, livro e jardim. Aos poucos, sem pressa.",
    interesses: ["Leitura", "Jardinagem", "Teatro", "Yoga"],
    bebida: "nao-bebo",
    atividade: "algumas-vezes",
    filhos: "tenho",
  },
  {
    nome: "Tainá",
    genero: "mulher",
    buscaPor: "homem",
    idade: 27,
    cidade: "Itajaí, SC",
    profissao: "Oceanógrafa",
    altura: 1.72,
    status: "solteiro",
    intencao: "casual",
    bio: "Metade do mês estou embarcada. Na outra metade, quero praia, surf e ninguém falando de trabalho.",
    interesses: ["Surf", "Praia", "Fotografia", "Camping", "Viagem"],
    bebida: "socialmente",
    atividade: "todo-dia",
    filhos: "nao-tenho",
  },

  // ─────────────────────────────── homens ───────────────────────────────
  {
    nome: "Rodrigo",
    genero: "homem",
    buscaPor: "mulher",
    idade: 32,
    cidade: "Joinville, SC",
    profissao: "Engenheiro mecânico",
    altura: 1.81,
    status: "solteiro",
    intencao: "serio",
    bio: "Trabalho com máquinas e descanso pedalando. Faço um churrasco decente e assumo que é o meu único prato.",
    interesses: ["Ciclismo", "Futebol", "Cerveja artesanal", "Carros"],
    bebida: "socialmente",
    atividade: "todo-dia",
    filhos: "quero-ter",
  },
  {
    nome: "Felipe",
    genero: "homem",
    buscaPor: "mulher",
    idade: 27,
    cidade: "Joinville, SC",
    profissao: "Desenvolvedor",
    altura: 1.76,
    status: "solteiro",
    intencao: "conhecer",
    bio: "Trabalho de casa, então valorizo qualquer desculpa para sair. Café à tarde é o meu programa favorito.",
    interesses: ["Tecnologia", "Games", "Café", "Cinema", "Academia"],
    bebida: "socialmente",
    atividade: "algumas-vezes",
    filhos: "nao-tenho",
  },
  {
    nome: "Gustavo",
    genero: "homem",
    buscaPor: "mulher",
    idade: 36,
    cidade: "Araquari, SC",
    profissao: "Mecânico",
    altura: 1.78,
    status: "divorciado",
    intencao: "serio",
    bio: "Tenho uma oficina, dois filhos e pouca paciência para conversa fiada. Gosto de pescar e de domingo tranquilo.",
    interesses: ["Pescaria", "Carros", "Futebol", "Cozinhar"],
    bebida: "socialmente",
    atividade: "raramente",
    filhos: "tenho",
  },
  {
    nome: "Thiago",
    genero: "homem",
    buscaPor: "mulher",
    idade: 29,
    cidade: "Joinville, SC",
    profissao: "Personal trainer",
    altura: 1.84,
    status: "solteiro",
    intencao: "nao_sei",
    bio: "Acordo às cinco, treino gente o dia todo e ainda acho graça nisso. Prometo não te chamar para malhar no primeiro encontro.",
    interesses: ["Academia", "Corrida", "Praia", "Vôlei", "Trilha"],
    bebida: "nao-bebo",
    atividade: "todo-dia",
    filhos: "quero-ter",
  },
  {
    nome: "Lucas",
    genero: "homem",
    buscaPor: "mulher",
    idade: 25,
    cidade: "Jaraguá do Sul, SC",
    profissao: "Professor de violão",
    altura: 1.73,
    status: "solteiro",
    intencao: "conhecer",
    bio: "Toco em bar nos fins de semana e dou aula durante a semana. Quero gente para trocar disco e ir a show.",
    interesses: ["Música ao vivo", "Shows", "Cerveja artesanal", "Séries"],
    bebida: "frequentemente",
    atividade: "raramente",
    filhos: "nao-tenho",
  },
  {
    nome: "Marcelo",
    genero: "homem",
    buscaPor: "mulher",
    idade: 43,
    cidade: "Joinville, SC",
    profissao: "Dentista",
    altura: 1.79,
    status: "divorciado",
    intencao: "serio",
    bio: "Depois dos quarenta ficou fácil saber o que eu quero: alguém para viajar sem roteiro e jantar sem pressa.",
    interesses: ["Viagem", "Vinho", "Gastronomia", "Teatro"],
    bebida: "socialmente",
    atividade: "algumas-vezes",
    filhos: "tenho",
  },
  {
    nome: "Vinícius",
    genero: "homem",
    buscaPor: "mulher",
    idade: 30,
    cidade: "São Francisco do Sul, SC",
    profissao: "Instrutor de surf",
    altura: 1.8,
    status: "solteiro",
    intencao: "conhecer",
    bio: "Moro a três quadras do mar e passo mais tempo molhado que seco. Vida simples, e eu gosto assim.",
    interesses: ["Surf", "Praia", "Camping", "Pescaria", "Trilha"],
    bebida: "socialmente",
    atividade: "todo-dia",
    filhos: "nao-quero",
  },
  {
    nome: "Eduardo",
    genero: "homem",
    buscaPor: "mulher",
    idade: 39,
    cidade: "Blumenau, SC",
    profissao: "Cervejeiro",
    altura: 1.87,
    status: "separado",
    intencao: "conhecer",
    bio: "Faço cerveja para viver e ainda acho que é um bom negócio. Cozinho bem e lavo a louça depois.",
    interesses: ["Cerveja artesanal", "Gastronomia", "Cozinhar", "Música ao vivo"],
    bebida: "frequentemente",
    atividade: "raramente",
    filhos: "nao-tenho",
  },
  {
    nome: "Bruno",
    genero: "homem",
    buscaPor: "mulher",
    idade: 34,
    cidade: "Itajaí, SC",
    profissao: "Fotógrafo",
    altura: 1.75,
    status: "solteiro",
    intencao: "serio",
    bio: "Vivo de casamento dos outros e sigo achando bonito. Nas folgas é estrada, câmera e um bom café.",
    interesses: ["Fotografia", "Viagem", "Café", "Arte", "Camping"],
    bebida: "socialmente",
    atividade: "algumas-vezes",
    filhos: "quero-ter",
  },
  {
    nome: "André",
    genero: "homem",
    buscaPor: "mulher",
    idade: 26,
    cidade: "Joinville, SC",
    profissao: "Analista de dados",
    altura: 1.7,
    status: "solteiro",
    intencao: "conhecer",
    bio: "Vim de Curitiba faz seis meses e ainda estou descobrindo a cidade. Aceito indicação de lugar bom.",
    interesses: ["Tecnologia", "Estudar", "Ciclismo", "Games", "Café"],
    bebida: "socialmente",
    atividade: "algumas-vezes",
    filhos: "nao-tenho",
  },
];

/** "Ana Beatriz" → "ana.beatriz" — vira o e-mail e o identificador do perfil. */
export function apelido(nome) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ".");
}

/**
 * Idade → data de nascimento de quem já fez aniversário este ano, para
 * `age()` no banco devolver exatamente a idade escrita acima.
 */
export function nascimentoPara(idade, deslocamentoEmDias) {
  const hoje = new Date();
  const data = new Date(
    Date.UTC(hoje.getUTCFullYear() - idade, hoje.getUTCMonth(), hoje.getUTCDate()),
  );
  data.setUTCDate(data.getUTCDate() - (1 + (deslocamentoEmDias % 360)));
  return data.toISOString().slice(0, 10);
}

/**
 * Espalha os perfis ao redor do centro do município. Sem isso todo mundo da
 * mesma cidade aparece na mesma distância, o que esconde a ordenação da fila.
 * O RPC do app arredonda para 2 casas (~1 km), então o desvio precisa ser
 * maior que isso para sobreviver ao arredondamento.
 */
export function coordenadaPara(cidade, indice) {
  const centro = CENTRO_DAS_CIDADES[cidade];
  if (!centro) throw new Error(`Cidade sem coordenada no script: ${cidade}`);
  const angulo = (indice * 137.5 * Math.PI) / 180; // ângulo áureo: espalha sem repetir
  const raio = 0.02 + (indice % 5) * 0.015; // ~2 km a ~8 km do centro
  return {
    lat: Number((centro.lat + raio * Math.sin(angulo)).toFixed(4)),
    lng: Number((centro.lng + raio * Math.cos(angulo)).toFixed(4)),
  };
}

/** Telefone fictício com DDD da região. Só existe no cadastro, nunca no perfil. */
export function telefonePara(indice) {
  const numero = String(900000000 + indice * 111111).slice(0, 9);
  return `47${numero}`;
}
