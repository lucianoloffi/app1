import { useCallback, useEffect, useRef, useState } from "react";
import { buscarFila } from "../lib/api/discovery";
import { curtir, dispensar } from "../lib/api/swipes";
import { mensagemDeErro } from "../lib/errors";
import type { Profile, SwipeDirection } from "../types";

const SWIPE_ANIMATION_MS = 240;
const RECARREGA_QUANDO_RESTAM = 3;

interface UseDiscoverQueueOptions {
  /** Só busca a fila depois que a sessão está pronta. */
  ativo: boolean;
  /** Muda sempre que os filtros são aplicados, para refazer a fila. */
  versaoDosFiltros: number;
  onMatch?: (profile: Profile, matchId: string) => void;
  onLikeWithoutMatch?: (profile: Profile) => void;
  onError?: (mensagem: string) => void;
}

export function useDiscoverQueue({
  ativo,
  versaoDosFiltros,
  onMatch,
  onLikeWithoutMatch,
  onError,
}: UseDiscoverQueueOptions) {
  const [queue, setQueue] = useState<Profile[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);
  const [matchProfile, setMatchProfile] = useState<Profile | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [houvePerfis, setHouvePerfis] = useState(true);
  const isAnimating = useRef(false);
  const pagina = useRef(0);
  const acabou = useRef(false);

  const carregarPagina = useCallback(
    async (numero: number, substituir: boolean) => {
      if (substituir) {
        setCarregando(true);
        setPhotoIndex(0);
      }
      try {
        const perfis = await buscarFila(numero);
        acabou.current = perfis.length === 0;
        setQueue((prev) => {
          const base = substituir ? [] : prev;
          const jaTem = new Set(base.map((item) => item.id));
          return [...base, ...perfis.filter((item) => !jaTem.has(item.id))];
        });
        if (substituir) setHouvePerfis(perfis.length > 0);
      } catch (problema) {
        onError?.(mensagemDeErro(problema));
      } finally {
        setCarregando(false);
      }
    },
    [onError],
  );

  // Fila refeita a cada mudança de filtros (que já foram salvos no servidor).
  // O efeito busca dados: o estado de carregamento muda dentro de carregarPagina.
  useEffect(() => {
    if (!ativo) return;
    pagina.current = 0;
    acabou.current = false;
    // oxlint-disable-next-line react/set-state-in-effect
    void carregarPagina(0, true);
  }, [ativo, versaoDosFiltros, carregarPagina]);

  // Busca a próxima página antes de a fila acabar.
  useEffect(() => {
    if (!ativo || carregando || acabou.current) return;
    if (queue.length > RECARREGA_QUANDO_RESTAM) return;
    pagina.current += 1;
    // oxlint-disable-next-line react/set-state-in-effect
    void carregarPagina(pagina.current, false);
  }, [ativo, carregando, queue.length, carregarPagina]);

  const current = queue[0] ?? null;

  function nextPhoto() {
    if (!current || current.photos.length === 0) return;
    setPhotoIndex((prev) => (prev + 1) % current.photos.length);
  }

  /** Toca a saída do card atual e, ao final, avança a fila. */
  function completeAdvance() {
    isAnimating.current = true;
    setSwipeDirection("left");
    window.setTimeout(() => {
      setQueue((prev) => prev.slice(1));
      setPhotoIndex(0);
      setSwipeDirection(null);
      isAnimating.current = false;
    }, SWIPE_ANIMATION_MS);
  }

  async function advance(direction: "left" | "right") {
    if (isAnimating.current || !current) return;
    const perfil = current;

    try {
      const resultado = direction === "right" ? await curtir(perfil.id) : await dispensar(perfil.id);

      if (direction === "right" && resultado.matched && resultado.matchId) {
        // O card fica parado atrás do overlay até a pessoa fechá-lo.
        setMatchProfile(perfil);
        onMatch?.(perfil, resultado.matchId);
        return;
      }

      if (direction === "right") onLikeWithoutMatch?.(perfil);
      completeAdvance();
    } catch (problema) {
      onError?.(mensagemDeErro(problema));
    }
  }

  return {
    current,
    photoIndex,
    swipeDirection,
    matchProfile,
    carregando,
    hasAnyMatch: houvePerfis,
    nextPhoto,
    like: () => void advance("right"),
    dislike: () => void advance("left"),
    dismissMatch: () => {
      if (!matchProfile) return;
      setMatchProfile(null);
      completeAdvance();
    },
    /** Desfazer match devolve o perfil logo atrás do card atual. */
    restoreToQueue: (profile: Profile) => {
      setQueue((prev) => {
        if (prev.some((item) => item.id === profile.id)) return prev;
        const next = [...prev];
        next.splice(1, 0, profile);
        return next;
      });
    },
  };
}
