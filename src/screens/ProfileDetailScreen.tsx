import { useMemo, useState } from "react";
import { CloseIcon, HeartIcon } from "../components/icons/ActionIcons";
import { ReportSheet } from "../components/ReportSheet";
import { CURRENT_USER_INTERESTS } from "../data/mockProfiles";
import {
  ACTIVITY_LABEL,
  DRINK_LABEL,
  heightLabel,
  INTENTION_LABEL,
  KIDS_LABEL,
  RELATIONSHIP_STATUS_LABEL,
  type Profile,
} from "../types";
import styles from "./ProfileDetailScreen.module.css";

interface ProfileDetailScreenProps {
  profile: Profile;
  onBack: () => void;
  onLike: () => void;
  onDislike: () => void;
  onShowToast: (message: string) => void;
  fromChat?: boolean;
}

export function ProfileDetailScreen({
  profile,
  onBack,
  onLike,
  onDislike,
  onShowToast,
  fromChat = false,
}: ProfileDetailScreenProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const commonInterests = useMemo(
    () => new Set(profile.interests.filter((interest) => CURRENT_USER_INTERESTS.includes(interest))),
    [profile],
  );

  const lifeRows: { label: string; value: string }[] = [];
  if (profile.relationshipStatus) {
    lifeRows.push({
      label: "Status de relacionamento",
      value: RELATIONSHIP_STATUS_LABEL[profile.relationshipStatus],
    });
  }
  if (profile.lifestyle?.bebida) {
    lifeRows.push({ label: "Bebida", value: DRINK_LABEL[profile.lifestyle.bebida] });
  }
  if (profile.lifestyle?.atividade) {
    lifeRows.push({ label: "Atividade física", value: ACTIVITY_LABEL[profile.lifestyle.atividade] });
  }
  if (profile.lifestyle?.filhos) {
    lifeRows.push({ label: "Filhos", value: KIDS_LABEL[profile.lifestyle.filhos] });
  }
  if (profile.height) {
    lifeRows.push({ label: "Altura", value: heightLabel(profile.height) });
  }

  const thumbnails = [profile.photos[1] ?? profile.photos[0], profile.photos[2] ?? profile.photos[0]];

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
            </p>
            <p className={styles.meta}>
              {profile.profession} · {profile.city.replace(", ", "/")} · a {profile.distanceKm} km
              daqui
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

          {lifeRows.length > 0 && (
            <div className={styles.lifeList}>
              {lifeRows.map((row) => (
                <div key={row.label} className={styles.lifeRow}>
                  <span className={styles.lifeLabel}>{row.label}</span>
                  <span className={styles.lifeValue}>{row.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.thumbGrid}>
            {thumbnails.map((photo, index) => (
              <img
                key={index}
                className={styles.thumb}
                src={photo}
                alt={`Mais uma foto de ${profile.name}`}
                style={{ objectPosition: index === 0 ? "center 55%" : "center 80%" }}
              />
            ))}
          </div>

          <button type="button" className={styles.reportLink} onClick={() => setReportOpen(true)}>
            Denunciar este perfil
          </button>
        </div>
      </div>

      {reportOpen && (
        <ReportSheet
          name={profile.name}
          onCancel={() => setReportOpen(false)}
          onSelectReason={() => {
            setReportOpen(false);
            onShowToast("Denúncia enviada. Obrigado por avisar.");
          }}
        />
      )}

      <div className={fromChat ? styles.backToChatBar : styles.actions}>
        {fromChat ? (
          <button type="button" className={styles.backToChatButton} onClick={onBack}>
            Voltar à conversa
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
