import { useRef, useState } from "react";
import type { Gender, MyProfile } from "../types";
import { formatBirthdate, onlyDigits } from "../onboarding/phoneFormat";
import styles from "./EditProfileScreen.module.css";

const MAX_PHOTOS = 5;

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "homem", label: "Homem" },
  { value: "mulher", label: "Mulher" },
  { value: "outros", label: "Outros" },
];

interface EditProfileScreenProps {
  profile: MyProfile;
  onCancel: () => void;
  onSave: (profile: MyProfile) => void;
}

export function EditProfileScreen({ profile, onCancel, onSave }: EditProfileScreenProps) {
  const [name, setName] = useState(profile.name);
  const [city, setCity] = useState(profile.city);
  const [birthdate, setBirthdate] = useState(profile.birthdate);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [bio, setBio] = useState(profile.bio);
  const [photos, setPhotos] = useState<(string | null)[]>(() => {
    const padded: (string | null)[] = [...profile.photos];
    while (padded.length < MAX_PHOTOS) padded.push(null);
    return padded.slice(0, MAX_PHOTOS);
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleFile(index: number, file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const previous = photos[index];
    setPhotos((prev) => prev.map((photo, i) => (i === index ? url : photo)));
    if (previous) URL.revokeObjectURL(previous);
  }

  function handleSave() {
    onSave({
      name,
      city,
      birthdate,
      gender,
      bio,
      photos: photos.filter((photo): photo is string => Boolean(photo)),
      intention: profile.intention,
      interests: profile.interests,
    });
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button type="button" className={styles.headerAction} onClick={onCancel}>
          Cancelar
        </button>
        <h1 className={styles.headerTitle}>Editar perfil</h1>
        <button
          type="button"
          className={`${styles.headerAction} ${styles.headerActionAccent}`}
          onClick={handleSave}
        >
          Concluído
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.photoGrid}>
          {photos.map((photo, index) => (
            <button
              key={index}
              type="button"
              className={
                photo
                  ? `${styles.slot} ${styles.slotFilled} ${index === 0 ? styles.mainSlot : ""}`
                  : `${styles.slot} ${styles.slotEmpty} ${index === 0 ? styles.mainSlot : ""}`
              }
              onClick={() => inputRefs.current[index]?.click()}
            >
              {photo ? (
                <img className={styles.photo} src={photo} alt={`Foto ${index + 1}`} />
              ) : (
                <svg width={index === 0 ? 32 : 22} height={index === 0 ? 32 : 22} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z"
                    stroke="#5B34C9"
                    strokeWidth={1.6}
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="13" r="3.2" stroke="#5B34C9" strokeWidth={1.6} />
                </svg>
              )}
              <input
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                className={styles.hiddenInput}
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(index, e.target.files?.[0] ?? null)}
              />
            </button>
          ))}
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.label}>Nome</span>
          <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.label}>Localidade</span>
          <input className={styles.input} value={city} onChange={(e) => setCity(e.target.value)} />
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.label}>Nascimento</span>
          <input
            className={styles.input}
            type="text"
            inputMode="numeric"
            maxLength={10}
            value={formatBirthdate(birthdate)}
            onChange={(e) => setBirthdate(onlyDigits(e.target.value))}
          />
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.label}>Gênero</span>
          <select
            className={styles.input}
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
          >
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.label}>Sobre você</span>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
