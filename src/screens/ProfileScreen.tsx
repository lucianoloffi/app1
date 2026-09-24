import { LoviMark } from "../components/icons/LoviMark";
import { RejectedPhotoNotice } from "../components/RejectedPhotoNotice";
import type { Filters, Intention, MyProfile, VerificationStatus } from "../types";
import { ageFromBirthdate } from "../utils/age";
import { computeCompleteness } from "../utils/completeness";
import styles from "./ProfileScreen.module.css";

const GENDER_FILTER_LABEL: Record<Filters["interestedIn"], string> = {
  homem: "Homens",
  mulher: "Mulheres",
  todos: "Todos",
};

const INTENTION_FILTER_LABEL: Record<Intention, string> = {
  serio: "Relacionamento sério",
  conhecer: "Conhecer pessoas",
  amizade: "Amizade",
};

/** Com as três marcadas, listar uma a uma só alonga a linha sem dizer mais. */
function resumoDeIntencoes(intencoes: Intention[]): string {
  if (intencoes.length >= 3) return "Todas as intenções";
  return intencoes.map((item) => INTENTION_FILTER_LABEL[item]).join(" e ");
}

/**
 * O aviso ao lado de "Verificar meu perfil". Antes eram dois estados para
 * quatro: tudo que não fosse 'aprovada' aparecia como "pendente", então quem
 * nunca pediu o selo lia que havia algo em análise, e quem teve a selfie
 * recusada lia a mesma coisa e ficava esperando um desfecho que já saiu.
 * Sem pedido nenhum, o certo é não prometer nada — a linha já convida.
 */
const AVISO_DA_VERIFICACAO: Record<VerificationStatus, string> = {
  nao_solicitada: "",
  pendente: "em análise",
  aprovada: "verificado",
  rejeitada: "envie outra selfie",
};

const RING_RADIUS = 41;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface ProfileScreenProps {
  myProfile: MyProfile | null;
  filters: Filters;
  verified: boolean;
  onOpenEdit: () => void;
  onOpenInterests: () => void;
  onOpenFilters: () => void;
  onOpenSettings: () => void;
  onVerifyProfile: () => void;
  onLogout: () => void;
  onOpenGuidelines?: () => void;
}

export function ProfileScreen({
  myProfile,
  filters,
  verified,
  onOpenEdit,
  onOpenInterests,
  onOpenFilters,
  onOpenSettings,
  onVerifyProfile,
  onLogout,
  onOpenGuidelines,
}: ProfileScreenProps) {
  const age = myProfile ? ageFromBirthdate(myProfile.birthdate) : null;
  const photosCount = myProfile?.photos.length ?? 0;
  const { pct, hint, interestsHint } = computeCompleteness(myProfile, photosCount);
  const dashOffset = RING_CIRCUMFERENCE * (1 - pct / 100);
  const aviso = AVISO_DA_VERIFICACAO[myProfile?.verificationStatus ?? "nao_solicitada"];

  const interessesSummary = myProfile?.interests.length
    ? myProfile.interests.join(" · ")
    : "Conte do que você gosta e como é seu dia a dia";
  const filtersSummary = `${GENDER_FILTER_LABEL[filters.interestedIn]} · ${filters.minAge}–${filters.maxAge} anos · até ${filters.distanceKm} km · ${resumoDeIntencoes(filters.intentions)}`;

  return (
    <div className={styles.screen}>
      <button type="button" className={styles.header} onClick={onOpenEdit}>
        <div className={styles.ringWrap}>
          <svg
            className={styles.ring}
            width="88"
            height="88"
            viewBox="0 0 88 88"
          >
            <circle
              cx="44"
              cy="44"
              r={RING_RADIUS}
              fill="none"
              stroke="#EDE6FB"
              strokeWidth={4}
            />
            <circle
              cx="44"
              cy="44"
              r={RING_RADIUS}
              fill="none"
              stroke="#8B5CF6"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 44 44)"
            />
          </svg>
          {/* Sem foto, a marca do Lovi — nunca um rosto. Aqui havia um avatar
              do i.pravatar.cc: uma pessoa de verdade, desconhecida, baixada de
              um serviço de fora a cada abertura da tela. Demorava a carregar e
              aparecia como se fosse a foto de quem está olhando. */}
          {myProfile?.photos[0] ? (
            <img
              className={styles.avatar}
              src={myProfile.photos[0].url}
              alt={myProfile.name || "Você"}
            />
          ) : (
            <span className={`${styles.avatar} ${styles.avatarVazio}`}>
              <LoviMark size={30} variant="purple" />
            </span>
          )}
          <span className={styles.pct}>{pct}%</span>
        </div>
        <div className={styles.headerMain}>
          {/* O selo vai dentro do parágrafo, e não ao lado: assim ele segue a
              última palavra do nome, e o nome longo usa a largura toda. */}
          <p className={styles.name}>
            {myProfile?.name || "Você"}
            {verified && (
              // Só o escudo: o texto "verificado" já aparece em "Verificar meu
              // perfil", e o espaço no topo é do nome, que quebrava em três linhas.
              <span className={styles.verifiedBadge} role="img" aria-label="Perfil verificado">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 011-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 011.52 0C14.51 3.81 17 5 19 5a1 1 0 011 1z"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
          </p>
          <p className={styles.meta}>
            {myProfile?.city ?? "Sua cidade"}
            {age !== null ? ` · ${age} anos` : ""}
          </p>
          {hint && <p className={styles.hint}>{hint}</p>}
        </div>
        <svg
          className={styles.chevron}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 5l7 7-7 7"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className={styles.section}>
        {/* Aqui também, e não só em Editar perfil: é esta a tela que a pessoa
            abre, e quem teve a foto reprovada não teria motivo para ir além. */}
        <RejectedPhotoNotice
          photos={myProfile?.photos ?? []}
          onOpenGuidelines={onOpenGuidelines}
          action={{ label: "Ver minhas fotos", onClick: onOpenEdit }}
        />
        {/* Do que a pessoa gosta e como vive saíram de Editar perfil: lá
            ficavam no fim de um formulário comprido, depois de nome, cidade
            e bio, e pouca gente rolava até eles. */}
        <button
          type="button"
          className={styles.card}
          onClick={onOpenInterests}
        >
          <span className={styles.cardIcon}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0112 7.6a4.3 4.3 0 017.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"
                stroke="#5B34C9"
                strokeWidth={1.8}
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className={styles.cardMain}>
            <p className={styles.cardTitle}>Interesses</p>
            {/* Sem interesses, o convite e o "Faltam 3 interesses" diriam o
                mesmo em duas linhas: fica só o que falta. */}
            {(myProfile?.interests.length || !interestsHint) && (
              <p className={styles.cardSummary}>{interessesSummary}</p>
            )}
            {interestsHint && <p className={styles.cardHint}>{interestsHint}</p>}
          </span>
          <span className={styles.rowChevron}>›</span>
        </button>

        <button
          type="button"
          className={styles.card}
          onClick={onOpenFilters}
        >
          <span className={styles.cardIcon}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 7h16M4 17h16"
                stroke="#5B34C9"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <circle
                cx="9"
                cy="7"
                r="2.4"
                fill="#fff"
                stroke="#5B34C9"
                strokeWidth={1.4}
              />
              <circle
                cx="15"
                cy="17"
                r="2.4"
                fill="#fff"
                stroke="#5B34C9"
                strokeWidth={1.4}
              />
            </svg>
          </span>
          <span className={styles.cardMain}>
            <p className={styles.cardTitle}>Filtros de busca</p>
            <p className={styles.cardSummary}>{filtersSummary}</p>
          </span>
          <span className={styles.rowChevron}>›</span>
        </button>

        <div className={styles.accessList}>
          <button
            type="button"
            className={styles.accessRow}
            onClick={onVerifyProfile}
          >
            Verificar meu perfil
            {aviso && (
              <span className={verified ? styles.verifyHintDone : styles.verifyHint}>
                {aviso}
              </span>
            )}
          </button>
          <button
            type="button"
            className={styles.accessRow}
            onClick={onOpenSettings}
          >
            Configurações e privacidade
            <span className={styles.chevron}>›</span>
          </button>
          <button
            type="button"
            className={`${styles.accessRow} ${styles.accessRowDestructive}`}
            onClick={onLogout}
          >
            Sair da conta
            <span className={styles.rowChevronDestructive}>›</span>
          </button>
        </div>
      </div>
    </div>
  );
}
