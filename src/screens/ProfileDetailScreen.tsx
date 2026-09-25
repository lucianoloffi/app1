import { Fragment, useMemo, useState } from "react";
import { CloseIcon, HeartIcon } from "../components/icons/ActionIcons";
import { ReportSheet } from "../components/ReportSheet";
import {
  ACTIVITY_LABEL,
  DIET_LABEL,
  DRINK_LABEL,
  heightLabel,
  INTENTION_LABEL,
  KIDS_LABEL,
  POLITICS_LABEL,
  RELATIONSHIP_STATUS_LABEL,
  RELIGION_LABEL,
  SMOKE_LABEL,
  type Profile,
} from "../types";
import styles from "./ProfileDetailScreen.module.css";

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
  /**
   * Barra de baixo. "swipe" só vale para quem veio da fila do Descobrir: com
   * match já feito não faz sentido curtir ou dispensar de novo.
   */
  bottomAction?: "swipe" | "backToChat" | "openChat";
}

export function ProfileDetailScreen({
  profile,
  myInterests,
  onBack,
  onLike,
  onDislike,
  onReport,
  onOpenChat,
  bottomAction = "swipe",
}: ProfileDetailScreenProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const commonInterests = useMemo(
    () => new Set(profile.interests.filter((interest) => myInterests.includes(interest))),
    [profile, myInterests],
  );

  // Em blocos de dois por linha, não em lista: a lista de rótulo à esquerda e
  // valor à direita parecia um formulário a preencher, não uma pessoa.
  type Fact = { label: string; value: string };
  const aboutFacts: Fact[] = [];
  if (profile.relationshipStatus) {
    aboutFacts.push({
      label: "Relacionamento",
      value: RELATIONSHIP_STATUS_LABEL[profile.relationshipStatus],
    });
  }
  if (profile.height) {
    aboutFacts.push({ label: "Altura", value: heightLabel(profile.height) });
  }
  if (profile.lifestyle?.bebida) {
    aboutFacts.push({ label: "Bebida", value: DRINK_LABEL[profile.lifestyle.bebida] });
  }
  if (profile.lifestyle?.atividade) {
    aboutFacts.push({ label: "Atividade física", value: ACTIVITY_LABEL[profile.lifestyle.atividade] });
  }
  if (profile.lifestyle?.filhos) {
    aboutFacts.push({ label: "Filhos", value: KIDS_LABEL[profile.lifestyle.filhos] });
  }
  if (profile.lifestyle?.fumo) {
    aboutFacts.push({ label: "Fuma", value: SMOKE_LABEL[profile.lifestyle.fumo] });
  }

  if (profile.values?.alimentacao) {
    aboutFacts.push({ label: "Alimentação", value: DIET_LABEL[profile.values.alimentacao] });
  }

  const valueFacts: Fact[] = [];
  if (profile.values?.religiao) {
    valueFacts.push({ label: "Religião", value: RELIGION_LABEL[profile.values.religiao] });
  }
  if (profile.values?.politica) {
    valueFacts.push({ label: "Política", value: POLITICS_LABEL[profile.values.politica] });
  }

  const firstName = profile.name.split(" ")[0];

  function renderFacts(title: string, facts: Fact[]) {
    if (facts.length === 0) return null;
    return (
      <section className={styles.factSection}>
        <h2 className={styles.factTitle}>{title}</h2>
        <div className={styles.factGrid}>
          {facts.map((fact) => (
            <div key={fact.label} className={styles.fact}>
              <span className={styles.factLabel}>{fact.label}</span>
              <span className={styles.factValue}>{fact.value}</span>
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

  return (
    <div className={styles.screen}>
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

      <div className={styles.scroll}>
        <div className={styles.photoWrap}>
          <img
            className={styles.photo}
            src={profile.photos[0]}
            alt={`Foto de ${profile.name}`}
            style={{ objectPosition: "center 25%" }}
          />
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
              {profile.profession} · {profile.city.replace(", ", "/")}
              {profile.distanceKm === null
                ? ""
                : profile.distanceKm < 1
                  ? " · a menos de 1 km daqui"
                  : ` · a ${profile.distanceKm} km daqui`}
            </p>
          </div>

          <p className={styles.bio}>{profile.bio}</p>

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

          <button type="button" className={styles.reportLink} onClick={() => setReportOpen(true)}>
            Denunciar este perfil
          </button>
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

      <div className={bottomAction === "swipe" ? styles.actions : styles.backToChatBar}>
        {bottomAction === "backToChat" ? (
          <button type="button" className={styles.backToChatButton} onClick={onBack}>
            Voltar à conversa
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
    </div>
  );
}
