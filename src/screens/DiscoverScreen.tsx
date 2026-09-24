import { useMemo, useState } from "react";
import { Logo } from "../components/Logo";
import { CloseIcon, HeartIcon } from "../components/icons/ActionIcons";
import { ReportSheet } from "../components/ReportSheet";
import { INTENTION_LABEL, type Filters, type Profile, type SwipeDirection } from "../types";
import { DISTANCIA_MAX_KM } from "../lib/filtros";
import styles from "./DiscoverScreen.module.css";
import perfisVistos from "../assets/perfis-vistos.jpg";
import semPerfis from "../assets/sem-perfis.jpg";

interface DiscoverScreenProps {
  current: Profile | null;
  /** Interesses do usuário logado, para destacar os que são comuns. */
  myInterests: string[];
  carregando?: boolean;
  hasAnyMatch: boolean;
  filters: Filters;
  /**
   * Distância até a pessoa mais próxima fora do raio; null = ninguém, nem longe;
   * undefined = ainda não se sabe (a conta chega depois da fila).
   */
  distanciaDoMaisProximoKm: number | null | undefined;
  /** Cidade do perfil, oferecida como posição quando o GPS deixou a pessoa longe. */
  city: string;
  /** false = a posição é o GPS, e trocar pela cidade ainda é uma opção. */
  usandoCidade: boolean;
  onUseCity: () => void;
  photoIndex: number;
  swipeDirection: SwipeDirection;
  onNextPhoto: () => void;
  onLike: () => void;
  onDislike: () => void;
  onOpenProfile: (profile: Profile) => void;
  onOpenFilters: () => void;
  onBlock: (profile: Profile) => void;
  onReport: (profile: Profile, motivo: string) => void;
  onShowToast: (message: string) => void;
}

export function DiscoverScreen({
  current,
  myInterests,
  carregando = false,
  hasAnyMatch,
  filters,
  distanciaDoMaisProximoKm,
  city,
  usandoCidade,
  onUseCity,
  photoIndex,
  swipeDirection,
  onNextPhoto,
  onLike,
  onDislike,
  onOpenProfile,
  onOpenFilters,
  onBlock,
  onReport,
  onShowToast,
}: DiscoverScreenProps) {
  const [cardMenuOpen, setCardMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const commonInterests = useMemo(() => {
    if (!current) return [];
    return current.interests.filter((interest) => myInterests.includes(interest));
  }, [current, myInterests]);

  const otherInterests = useMemo(() => {
    if (!current) return [];
    return current.interests.filter((interest) => !commonInterests.includes(interest));
  }, [current, commonInterests]);

  /**
   * Sem card e ainda sem resposta: nenhuma mensagem, só o espaço vazio. Antes
   * o "Por hoje é isso" aparecia enquanto a fila recarregava depois de mudar
   * o filtro e, um instante depois, dava lugar a outra tela — piscava. A
   * distância também conta: sem ela não dá para saber se a tela certa é a de
   * "ninguém por perto", e mostrar outra antes seria a mesma piscada.
   */
  const aguardando =
    !current && (carregando || (!hasAnyMatch && distanciaDoMaisProximoKm === undefined));
  const emptyByFilter = !current && !hasAnyMatch && !carregando;
  /** Só o nome, sem o estado: "Joinville", não "Joinville, SC". */
  const cidadeCurta = city.split(",")[0].trim();
  /**
   * Existe gente, mas toda ela mais longe do que o filtro permite — então o
   * problema é a distância, não o filtro. Só vale quando passa do raio
   * escolhido: assim o número nunca fala de alguém que a fila já mostraria.
   */
  const foraDeAlcance =
    typeof distanciaDoMaisProximoKm === "number" &&
    distanciaDoMaisProximoKm > filters.distanceKm;
  /**
   * Está longe, mas dentro do que o filtro consegue alcançar: aí mexer no
   * filtro resolve mesmo, e mandar "o app está chegando na sua região" seria
   * desanimar alguém que está a um ajuste de ver gente.
   */
  const alcancavelPeloFiltro =
    foraDeAlcance && (distanciaDoMaisProximoKm as number) <= DISTANCIA_MAX_KM;
  const podeUsarCidade = !usandoCidade && city.trim().length > 0;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <Logo heartSize={34} textSize={36} />
      </header>

      {current ? (
        <div className={styles.cardArea}>
          <div
            key={current.id}
            className={swipeDirection ? `${styles.card} ${styles.cardExit}` : styles.card}
          >
            <button
              type="button"
              className={styles.photoButton}
              onClick={onNextPhoto}
              aria-label="Ver próxima foto"
            >
              <img
                className={styles.photo}
                src={current.photos[photoIndex]}
                alt={`Foto de ${current.name}`}
              />
            </button>

            <div className={styles.segmentBar}>
              {current.photos.map((photo, index) => (
                <span
                  key={photo}
                  className={
                    index === photoIndex
                      ? `${styles.segment} ${styles.segmentActive}`
                      : styles.segment
                  }
                />
              ))}
            </div>

            <div className={styles.cardMenuWrap}>
              <button
                type="button"
                className={styles.cardMenuButton}
                aria-label="Mais opções do perfil"
                onClick={() => setCardMenuOpen((prev) => !prev)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="5" r="2" fill="#fff" />
                  <circle cx="12" cy="12" r="2" fill="#fff" />
                  <circle cx="12" cy="19" r="2" fill="#fff" />
                </svg>
              </button>
              {cardMenuOpen && (
                <>
                  <button
                    type="button"
                    className={styles.cardMenuBackdrop}
                    aria-label="Fechar menu"
                    onClick={() => setCardMenuOpen(false)}
                  />
                  <div className={styles.cardMenuCard}>
                    <button
                      type="button"
                      className={styles.cardMenuItem}
                      onClick={() => {
                        setCardMenuOpen(false);
                        onDislike();
                      }}
                    >
                      <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M3 12h12M11 7l5 5-5 5M20 5v14"
                          stroke="#5C6660"
                          strokeWidth={2}
                          fill="none"
                          strokeLinecap="round"
                        />
                      </svg>
                      Pular este perfil
                    </button>
                    <button
                      type="button"
                      className={styles.cardMenuItem}
                      onClick={() => {
                        setCardMenuOpen(false);
                        setReportOpen(true);
                      }}
                    >
                      <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M5 3v18M5 4h11l-2 4 2 4H5"
                          fill="none"
                          stroke="#5C6660"
                          strokeWidth={2}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                      </svg>
                      Denunciar perfil
                    </button>
                    <button
                      type="button"
                      className={`${styles.cardMenuItem} ${styles.cardMenuItemDestructive}`}
                      onClick={() => {
                        setCardMenuOpen(false);
                        onBlock(current);
                        onDislike();
                        onShowToast(`${current.name} bloqueado. Não aparecerá mais para você.`);
                      }}
                    >
                      <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" fill="none" stroke="#C8353C" strokeWidth={2} />
                        <path
                          d="M5.6 5.6l12.8 12.8"
                          stroke="#C8353C"
                          strokeWidth={2}
                          strokeLinecap="round"
                        />
                      </svg>
                      Bloquear perfil
                    </button>
                  </div>
                </>
              )}
            </div>

            <span className={styles.intentionBadge}>{INTENTION_LABEL[current.intention]}</span>

            <button
              type="button"
              className={styles.filterButton}
              aria-label="Filtros de busca"
              onClick={onOpenFilters}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 8h16M4 16h16" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" />
                <circle cx="15" cy="8" r="3" fill="none" stroke="#fff" strokeWidth={1.9} />
                <circle cx="9" cy="16" r="3" fill="none" stroke="#fff" strokeWidth={1.9} />
              </svg>
            </button>

            <div className={styles.gradientOverlay}>
              <div>
                <p className={styles.name}>
                  {current.name}, {current.age}
                </p>
                <p className={styles.profession}>{current.profession}</p>
                <p className={styles.cityDistance}>
                  {current.city.replace(", ", "/")}
                  {current.distanceKm === null
                    ? ""
                    : current.distanceKm < 1
                      ? " · a menos de 1 km daqui"
                      : ` · a ${current.distanceKm} km daqui`}
                </p>
              </div>

              <div className={styles.chipsRow}>
                {commonInterests.slice(0, 3).map((interest) => (
                  <span key={interest} className={styles.chipCommon}>
                    {interest}
                  </span>
                ))}
                {otherInterests.slice(0, 3).map((interest) => (
                  <span key={interest} className={styles.chipInterest}>
                    {interest}
                  </span>
                ))}
                <button
                  type="button"
                  className={styles.viewProfileLink}
                  onClick={() => onOpenProfile(current)}
                  style={{ marginLeft: "auto" }}
                  aria-label="Ver perfil completo"
                >
                  <svg width="16" height="10" viewBox="0 0 18 11" fill="none" aria-hidden="true" style={{ opacity: 0.95 }}>
                    <path
                      d="M2 2.5l7 6 7-6"
                      stroke="#fff"
                      strokeWidth={2.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : aguardando ? (
        <div className={styles.emptyWrap} aria-busy="true" />
      ) : emptyByFilter && foraDeAlcance ? (
        <div className={styles.emptyWrap}>
          <img className={styles.emptyArt} src={semPerfis} alt="" aria-hidden="true" />
          {/* Mexer no filtro não resolve: não há ninguém perto. Dizer "seus
              filtros estão estreitos" aqui manda a pessoa ajustar uma coisa
              que não é o problema. */}
          <p className={styles.emptyTitle}>Ninguém por perto ainda</p>
          <p className={styles.emptySupport}>
            A pessoa mais próxima do Lovi está a{" "}
            {distanciaDoMaisProximoKm?.toLocaleString("pt-BR")} km de você.{" "}
            {alcancavelPeloFiltro
              ? "Aumentar a distância nos filtros traz ela para a sua fila."
              : "O app ainda está chegando na sua região."}
          </p>
          {alcancavelPeloFiltro ? (
            <button type="button" className={styles.primaryButton} onClick={onOpenFilters}>
              Ajustar filtros
            </button>
          ) : (
            podeUsarCidade && (
              <button type="button" className={styles.primaryButton} onClick={onUseCity}>
                Usar {city} como minha localização
              </button>
            )
          )}
        </div>
      ) : (
        // Uma tela só para "o filtro não trouxe ninguém" e "acabaram os perfis":
        // eram duas, escolhidas por um sinal que mudava durante o carregamento,
        // e para quem usa as duas dizem a mesma coisa.
        <div className={styles.emptyWrap}>
          <img className={styles.emptyArt} src={perfisVistos} alt="" aria-hidden="true" />
          <p className={styles.emptyTitle}>Poucos perfis por aqui</p>
          <p className={styles.emptySupport}>
            Você viu todos os perfis {cidadeCurta ? `de ${cidadeCurta}` : "da sua região"} que
            combinam com o que busca.
            <br />
            Ampliar a distância ou a faixa de idade traz mais pessoas ;)
          </p>
          <button type="button" className={styles.primaryButton} onClick={onOpenFilters}>
            Ajustar filtros
          </button>
        </div>
      )}

      {current && (
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionClose}`}
            onClick={onDislike}
            aria-label="Dispensar perfil"
          >
            <CloseIcon size={24} />
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionLike}`}
            onClick={onLike}
            aria-label="Curtir perfil"
          >
            <HeartIcon size={55} />
          </button>
        </div>
      )}

      {reportOpen && current && (
        <ReportSheet
          name={current.name}
          onCancel={() => setReportOpen(false)}
          onSelectReason={(motivo) => {
            setReportOpen(false);
            onReport(current, motivo);
          }}
        />
      )}
    </div>
  );
}
