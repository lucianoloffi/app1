import { Fragment, useMemo, useState } from "react";
import { CloseIcon, HeartIcon } from "../components/icons/ActionIcons";
import { FactIcon, type FactIconName } from "../components/icons/FactIcons";
import { ReportSheet } from "../components/ReportSheet";
import {
  ACTIVITY_PHRASE,
  DIET_PHRASE,
  DRINK_PHRASE,
  KIDS_PHRASE,
  POLITICS_PHRASE,
  RELIGION_PHRASE,
  SMOKE_PHRASE,
  concordaGenero,
} from "../data/factPhrases";
import { heightLabel, INTENTION_LABEL, RELATIONSHIP_STATUS_LABEL, type Profile } from "../types";
import styles from "./ProfileDetailScreen.module.css";

/**
 * Até aqui, a resposta cabe em duas linhas num bloco de meia largura. A
 * palavra também tem limite: "relacionamento" e "Vegetariano(a)" não cabem na
 * largura do bloco e eram partidas no meio.
 */
const FRASE_CURTA_MAXIMA = 20;
const PALAVRA_CURTA_MAXIMA = 12;

function cabeEmMeiaLargura(frase: string) {
  return (
    frase.length <= FRASE_CURTA_MAXIMA &&
    frase.split(" ").every((palavra) => palavra.length <= PALAVRA_CURTA_MAXIMA)
  );
}

interface ProfileDetailScreenProps {
  profile: Profile;
  /** Interesses do usuário logado, para destacar os que são comuns. */
  myInterests: string[];
  onBack: () => void;
  onLike: () => void;
  onDislike: () => void;
  onReport: (profile: Profile, motivo: string) => void;
  /** Volta para a conversa quando o perfil foi aberto de dentro dela. */
  onOpenChat?: () => void;
  /** Só no modo "own": abre Editar perfil. */
  onEdit?: () => void;
  /**
   * Barra de baixo. "swipe" só vale para quem veio da fila do Descobrir: com
   * match já feito não faz sentido curtir ou dispensar de novo. "own" é a
   * pessoa vendo o próprio perfil como os outros o veem: sem curtir, sem
   * denunciar, e com o caminho para corrigir o que não gostou. "admin" é o
   * painel abrindo o perfil numa aba própria: só mostra, sem voltar (a lista
   * continua na outra aba), sem curtir e sem denunciar.
   */
  bottomAction?: "swipe" | "backToChat" | "openChat" | "own" | "admin";
}

export function ProfileDetailScreen({
  profile,
  myInterests,
  onBack,
  onLike,
  onDislike,
  onReport,
  onOpenChat,
  onEdit,
  bottomAction = "swipe",
}: ProfileDetailScreenProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const commonInterests = useMemo(
    () => new Set(profile.interests.filter((interest) => myInterests.includes(interest))),
    [profile, myInterests],
  );

  // Em blocos de dois por linha, não em lista: a lista de rótulo à esquerda e
  // valor à direita parecia um formulário a preencher, não uma pessoa.
  type Fact = { icon: FactIconName; label: string; value: string };
  const aboutFacts: Fact[] = [];
  const valueFacts: Fact[] = [];
  const lifestyle = profile.lifestyle;
  const values = profile.values;
  if (profile.relationshipStatus) {
    aboutFacts.push({
      icon: "relacionamento",
      label: "Relacionamento",
      value: RELATIONSHIP_STATUS_LABEL[profile.relationshipStatus],
    });
  }
  if (profile.height) {
    aboutFacts.push({ icon: "altura", label: "Altura", value: heightLabel(profile.height) });
  }
  if (lifestyle?.bebida) {
    aboutFacts.push({ icon: "bebida", label: "Bebida", value: DRINK_PHRASE[lifestyle.bebida] });
  }
  if (lifestyle?.atividade) {
    aboutFacts.push({
      icon: "atividade",
      label: "Atividade física",
      value: ACTIVITY_PHRASE[lifestyle.atividade],
    });
  }
  if (lifestyle?.filhos) {
    aboutFacts.push({ icon: "filhos", label: "Filhos", value: KIDS_PHRASE[lifestyle.filhos] });
  }
  if (lifestyle?.fumo) {
    aboutFacts.push({ icon: "fumo", label: "Fumo", value: SMOKE_PHRASE[lifestyle.fumo] });
  }
  // No cadastro, alimentação é de "Seus valores"; aqui é hábito, e fica em "Sobre".
  if (values?.alimentacao) {
    aboutFacts.push({
      icon: "alimentacao",
      label: "Alimentação",
      value: DIET_PHRASE[values.alimentacao],
    });
  }
  if (values?.religiao) {
    valueFacts.push({
      icon: "religiao",
      label: "Religião",
      value: RELIGION_PHRASE[values.religiao],
    });
  }
  if (values?.politica) {
    valueFacts.push({
      icon: "politica",
      label: "Política",
      value: POLITICS_PHRASE[values.politica],
    });
  }

  const firstName = profile.name.split(" ")[0];

  // Profissão é opcional: sem ela, a linha começava com "· Joinville/SC".
  const metaParts = [
    profile.profession.trim(),
    profile.city.replace(", ", "/"),
    profile.distanceKm === null
      ? ""
      : profile.distanceKm < 1
        ? "a menos de 1 km daqui"
        : `a ${profile.distanceKm} km daqui`,
  ].filter(Boolean);

  // Frase longa em meia largura ia a três ou quatro linhas ("Atividade física
  // algumas vezes na semana") e deixava a linha de blocos alta e torta. Ela
  // ocupa a linha toda e vai para o fim do grupo, depois dos pares. Se sobrar
  // um bloco curto sem par, ele também ocupa a linha, para não ficar buraco.
  function arrangeFacts(facts: Fact[]) {
    const withText = facts.map((fact) => ({
      ...fact,
      value: concordaGenero(fact.value, profile.gender),
    }));
    const short = withText.filter((fact) => cabeEmMeiaLargura(fact.value));
    const long = withText.filter((fact) => !cabeEmMeiaLargura(fact.value));
    return [
      ...short.map((fact, index) => ({
        ...fact,
        wide: short.length % 2 === 1 && index === short.length - 1,
      })),
      ...long.map((fact) => ({ ...fact, wide: true })),
    ];
  }

  function renderFacts(title: string, facts: Fact[]) {
    if (facts.length === 0) return null;
    return (
      <section className={styles.factSection}>
        <h2 className={styles.factTitle}>{title}</h2>
        <div className={styles.factGrid}>
          {arrangeFacts(facts).map((fact) => (
            <div
              key={fact.label}
              className={fact.wide ? `${styles.fact} ${styles.factWide}` : styles.fact}
            >
              <FactIcon name={fact.icon} size={22} />
              <span className={styles.factValue}>
                <span className={styles.paraLeitor}>{fact.label}: </span>
                {fact.value}
              </span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Em terceira pessoa: quem lê é o outro, não quem respondeu.
  const answers = [
    { label: "No tempo livre", text: profile.about?.tempoLivre ?? "" },
    { label: "Valoriza em uma pessoa", text: profile.about?.oQueValoriza ?? "" },
  ].filter((answer) => answer.text.trim());

  // Todas as fotos depois da principal, uma embaixo da outra. Antes eram sempre
  // duas miniaturas: quem tinha 6 fotos mostrava só 3, e quem tinha 1 aparecia
  // com a mesma foto repetida três vezes.
  const morePhotos = profile.photos.slice(1);

  // Os textos entremeiam as fotos, para a leitura não ficar só em imagem: com
  // duas fotos a mais, cada texto vai embaixo de uma; com uma, os dois vão
  // embaixo dela; sem nenhuma, seguem a lista do estilo de vida.
  const answersAfterPhoto = morePhotos.map((_, index) =>
    morePhotos.length === 1 ? answers : answers.slice(index, index + 1),
  );
  const answersWithoutPhoto = morePhotos.length === 0 ? answers : [];

  function renderAnswer(answer: { label: string; text: string }) {
    return (
      <div key={answer.label} className={styles.answer}>
        <span className={styles.answerLabel}>{answer.label}</span>
        <p className={styles.answerText}>{answer.text}</p>
      </div>
    );
  }

  const soMostra = bottomAction === "own" || bottomAction === "admin";

  return (
    <div className={styles.screen}>
      {bottomAction !== "admin" && (
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 4l-8 8 8 8"
              stroke="#16211A"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      <div className={styles.scroll}>
        {bottomAction === "own" && (
          <p className={styles.ownBanner}>Assim seu perfil aparece para os outros</p>
        )}
        <div className={styles.photoWrap}>
          {/* Só falta foto no modo "own", com todas reprovadas: sem foto
              aprovada ninguém chega a este perfil pela fila. */}
          {profile.photos[0] && (
            <img
              className={styles.photo}
              src={profile.photos[0]}
              alt={`Foto de ${profile.name}`}
              style={{ objectPosition: "center 25%" }}
            />
          )}
          <span className={styles.intentionBadge}>{INTENTION_LABEL[profile.intention]}</span>
        </div>

        <div className={styles.body}>
          <div>
            <p className={styles.name}>
              {profile.name}, {profile.age}
              {profile.verified && (
                <span className={styles.verifiedBadge}>
                  <span aria-hidden="true">✓</span> verificado
                </span>
              )}
            </p>
            <p className={styles.meta}>
              {metaParts.join(" · ")}
            </p>
          </div>

          {profile.bio.trim() && <p className={styles.bio}>{profile.bio}</p>}

          <div className={styles.chipsRow}>
            {profile.interests.map((interest) => {
              const isCommon = commonInterests.has(interest);
              return (
                <span
                  key={interest}
                  className={isCommon ? `${styles.chip} ${styles.chipCommon}` : styles.chip}
                >
                  {interest}
                </span>
              );
            })}
          </div>

          {renderFacts(`Sobre ${firstName}`, aboutFacts)}
          {renderFacts("Valores", valueFacts)}

          {answersWithoutPhoto.map(renderAnswer)}

          {morePhotos.length > 0 && (
            <div className={styles.photoList}>
              {morePhotos.map((photo, index) => (
                <Fragment key={photo}>
                  <img
                    className={styles.morePhoto}
                    src={photo}
                    alt={`Foto ${index + 2} de ${profile.name}`}
                    loading="lazy"
                  />
                  {answersAfterPhoto[index].map(renderAnswer)}
                </Fragment>
              ))}
            </div>
          )}

          {!soMostra && (
            <button type="button" className={styles.reportLink} onClick={() => setReportOpen(true)}>
              Denunciar este perfil
            </button>
          )}
        </div>
      </div>

      {reportOpen && (
        <ReportSheet
          name={profile.name}
          onCancel={() => setReportOpen(false)}
          onSelectReason={(motivo) => {
            setReportOpen(false);
            onReport(profile, motivo);
          }}
        />
      )}

      {bottomAction !== "admin" && (
        <div className={bottomAction === "swipe" ? styles.actions : styles.backToChatBar}>
          {bottomAction === "backToChat" ? (
            <button type="button" className={styles.backToChatButton} onClick={onBack}>
              Voltar à conversa
            </button>
          ) : bottomAction === "own" ? (
            <button type="button" className={styles.backToChatButton} onClick={onEdit}>
              Editar perfil
            </button>
          ) : bottomAction === "openChat" ? (
            <button type="button" className={styles.backToChatButton} onClick={onOpenChat}>
              Abrir conversa
            </button>
          ) : (
            <>
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
                <HeartIcon size={48} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
