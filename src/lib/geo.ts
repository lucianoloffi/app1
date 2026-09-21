/**
 * Tudo que envolve localização mora aqui. Nenhum outro arquivo do app toca em
 * navigator.geolocation — na Fase 5 este módulo passa a usar
 * @capacitor/geolocation e o resto do código não muda.
 *
 * Regra de privacidade: a coordenada é ARREDONDADA para 2 casas decimais
 * (grade de ~1 km) ANTES de sair do dispositivo. O servidor nunca recebe a
 * posição exata.
 */
import {
  atualizarLocalizacao,
  cidadeMaisProxima,
  usarLocalizacaoDaCidade,
  type CidadeProxima,
} from "./api/profile";

export type EstadoDaPermissao = "concedida" | "negada" | "perguntar" | "indisponivel";

const TEMPO_LIMITE_MS = 12000;

function arredonda(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function suportaLocalizacao(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

export async function estadoDaPermissao(): Promise<EstadoDaPermissao> {
  if (!suportaLocalizacao()) return "indisponivel";
  if (!navigator.permissions?.query) return "perguntar";
  try {
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    if (status.state === "granted") return "concedida";
    if (status.state === "denied") return "negada";
    return "perguntar";
  } catch {
    return "perguntar";
  }
}

function capturaPosicao(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: TEMPO_LIMITE_MS,
      maximumAge: 5 * 60 * 1000,
    });
  });
}

export interface ResultadoDeLocalizacao {
  estado: EstadoDaPermissao;
  atualizada: boolean;
  /** Coordenada já arredondada, presente só quando a captura deu certo. */
  lat?: number;
  lng?: number;
}

/**
 * Pede a permissão (o diálogo do sistema só aparece depois que a tela
 * explicou o motivo), captura a coordenada, arredonda e envia.
 */
export async function pedirEAtualizarLocalizacao(): Promise<ResultadoDeLocalizacao> {
  if (!suportaLocalizacao()) return { estado: "indisponivel", atualizada: false };

  try {
    const posicao = await capturaPosicao();
    const lat = arredonda(posicao.coords.latitude);
    const lng = arredonda(posicao.coords.longitude);
    await atualizarLocalizacao(lat, lng);
    return { estado: "concedida", atualizada: true, lat, lng };
  } catch (erro) {
    const codigo = (erro as GeolocationPositionError | undefined)?.code;
    if (codigo === 1) return { estado: "negada", atualizada: false };
    return { estado: "perguntar", atualizada: false };
  }
}

/**
 * Atualização de abertura do app: só acontece com a permissão já concedida,
 * nunca em segundo plano e nunca provocando o diálogo do sistema.
 */
export async function atualizarLocalizacaoNaAbertura(): Promise<ResultadoDeLocalizacao> {
  const estado = await estadoDaPermissao();
  if (estado !== "concedida") return { estado, atualizada: false };
  return pedirEAtualizarLocalizacao();
}

/**
 * Modo degradado: a pessoa recusou o GPS e segue usando o app com o centro
 * do município escolhido. O perfil fica marcado como aproximado — o card
 * passa a mostrar a cidade no lugar da distância.
 */
export async function usarCidadeComoLocalizacao(cidade: string): Promise<void> {
  await usarLocalizacaoDaCidade(cidade);
}

export interface SugestaoDeCidade {
  estado: EstadoDaPermissao;
  /** null = permissão negada, falha na captura, ou nenhuma cidade perto. */
  cidade: CidadeProxima | null;
}

/**
 * Usada no passo da cidade, no cadastro: pede a localização, grava a
 * coordenada e devolve a cidade da lista mais próxima.
 *
 * Fazer isso aqui, e não depois, evita perguntar duas vezes a mesma coisa —
 * antes a pessoa digitava a cidade no cadastro e, ao entrar no app, levava o
 * pedido de localização mesmo assim. Com a coordenada já gravada, ela chega
 * com a fila pronta.
 *
 * Quem recusar segue escolhendo a cidade na lista, como sempre: o app usa o
 * centro do município e marca o perfil como localização aproximada.
 */
export async function sugerirCidadePelaLocalizacao(): Promise<SugestaoDeCidade> {
  const resultado = await pedirEAtualizarLocalizacao();
  if (!resultado.atualizada || resultado.lat === undefined || resultado.lng === undefined) {
    return { estado: resultado.estado, cidade: null };
  }

  try {
    return { estado: "concedida", cidade: await cidadeMaisProxima(resultado.lat, resultado.lng) };
  } catch {
    // A coordenada já foi gravada; só a sugestão falhou. Escolher na lista
    // continua funcionando, então não vale interromper o cadastro por isso.
    return { estado: "concedida", cidade: null };
  }
}
