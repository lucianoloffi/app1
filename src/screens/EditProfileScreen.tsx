import { useEffect, useState } from "react";
import { HeightSheet } from "../components/HeightSheet";
import { InterestBottomSheet } from "../components/InterestBottomSheet";
import { RowBottomSheet } from "../components/RowBottomSheet";
import { SelectedInterests } from "../components/SelectedInterests";
import { LIFE_GROUPS, STATUS_SHEET_OPTIONS } from "../data/lifestyle";
import {
  definirPrincipal,
  minhasFotos,
  removerFoto,
  enviarFoto,
  type FotoDoPerfil,
} from "../lib/api/photos";
import { mensagemDeErro } from "../lib/errors";
import { MAX_PROFILE_PHOTOS, selectedInterestsLabel } from "../onboarding/constants";
import { formatBirthdate, onlyDigits } from "../onboarding/phoneFormat";
import type { Gender, Lifestyle, MyProfile, RelationshipStatus } from "../types";
import { heightLabel } from "../types";
import { PhotosManageScreen } from "./PhotosManageScreen";
import styles from "./EditProfileScreen.module.css";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "homem", label: "Homem" },
  { value: "mulher", label: "Mulher" },
  { value: "outros", label: "Outros" },
];

function photosHint(count: number): string {
  if (count < 3) return "Perfis com pelo menos 3 fotos recebem mais matches.";
  if (count < 6)
    return `Quanto mais fotos, mais atrativo fica seu perfil. Você ainda pode adicionar ${6 - count} ${
      6 - count === 1 ? "foto" : "fotos"
    }.`;
  return "Perfil completo de fotos. Você pode reordenar tornando outra a capa.";
}

interface EditProfileScreenProps {
  profile: MyProfile;
  onCancel: () => void;
  onSave: (profile: MyProfile) => void;
  onShowToast: (message: string) => void;
}

export function EditProfileScreen({ profile, onCancel, onSave, onShowToast }: EditProfileScreenProps) {
  const [name, setName] = useState(profile.name);
  const [city, setCity] = useState(profile.city);
  const [birthdate, setBirthdate] = useState(profile.birthdate);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [profession, setProfession] = useState(profile.profession);
  const [height, setHeight] = useState(profile.height);
  const [bio, setBio] = useState(profile.bio);
  const [fotos, setFotos] = useState<FotoDoPerfil[]>([]);
  const [fotosOcupado, setFotosOcupado] = useState(false);
  const photos = fotos.map((foto) => foto.url);
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [lifestyle, setLifestyle] = useState<Lifestyle>(profile.lifestyle);
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus | null>(
    profile.relationshipStatus,
  );

  const [photosManageOpen, setPhotosManageOpen] = useState(false);

  useEffect(() => {
    void minhasFotos()
      .then(setFotos)
      .catch((problema) => onShowToast(mensagemDeErro(problema)));
  }, [onShowToast]);

  async function comFotos(acao: () => Promise<void>, mensagem: string) {
    setFotosOcupado(true);
    try {
      await acao();
      setFotos(await minhasFotos());
      onShowToast(mensagem);
    } catch (problema) {
      onShowToast(mensagemDeErro(problema));
    } finally {
      setFotosOcupado(false);
    }
  }
  const [heightSheetOpen, setHeightSheetOpen] = useState(false);
  const [interestSheetOpen, setInterestSheetOpen] = useState(false);

  const displaySlots = [...photos, ...Array(MAX_PROFILE_PHOTOS).fill(null)].slice(
    0,
    MAX_PROFILE_PHOTOS,
  );

  function handleSave() {
    onSave({
      name,
      city,
      birthdate,
      gender,
      bio,
      photos,
      intention: profile.intention,
      interestedIn: profile.interestedIn,
      interests,
      lifestyle,
      profession,
      height,
      relationshipStatus,
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
        <div className={styles.photosCard}>
          <div className={styles.photosCardHeader}>
            <h2 className={styles.photosCardTitle}>Minhas fotos</h2>
            <span className={styles.photosCount}>{photos.length}/6</span>
            <button
              type="button"
              className={styles.manageLink}
              onClick={() => setPhotosManageOpen(true)}
            >
              Gerenciar ›
            </button>
          </div>
          <div className={styles.photosGrid}>
            {displaySlots.map((photo, index) => (
              <div
                key={index}
                className={
                  index === 0
                    ? `${styles.photoTile} ${styles.photoTileCover}`
                    : styles.photoTile
                }
              >
                {photo && (
                  <>
                    <img className={styles.photoTileImg} src={photo} alt={`Foto ${index + 1}`} />
                    {index === 0 && <span className={styles.coverBadge}>capa</span>}
                  </>
                )}
              </div>
            ))}
          </div>
          <p className={styles.photosHint}>{photosHint(photos.length)}</p>
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.label}>Nome</span>
          <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.label}>Localidade</span>
          <input className={styles.input} value={city} onChange={(e) => setCity(e.target.value)} />
        </div>

        <div className={styles.fieldRow}>
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
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <span className={styles.label}>Profissão</span>
            <input
              className={styles.input}
              placeholder="ex: engenheiro"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
            />
          </div>
          <div className={`${styles.fieldGroup} ${styles.fieldRowHeight}`}>
            <span className={styles.label}>Altura</span>
            <button
              type="button"
              className={`${styles.input} ${styles.heightButton}`}
              onClick={() => setHeightSheetOpen(true)}
            >
              {heightLabel(height)}
            </button>
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.label}>Sobre você</span>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div className={styles.interestsGroup}>
          <span className={styles.label}>{selectedInterestsLabel(interests.length)}</span>
          <SelectedInterests
            interests={interests}
            onRemove={(interest) =>
              setInterests((prev) => prev.filter((item) => item !== interest))
            }
            onAdd={() => setInterestSheetOpen(true)}
          />
        </div>

        <RowBottomSheet
          label="Status de relacionamento"
          iconPath="M9.6 14.8a4.2 4.2 0 110-8.4 4.2 4.2 0 010 8.4zm0-1.8a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8zm4.8 4.8a4.2 4.2 0 110-8.4 4.2 4.2 0 010 8.4zm0-1.8a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8z"
          value={relationshipStatus}
          options={STATUS_SHEET_OPTIONS}
          onChange={(value) => setRelationshipStatus(value as RelationshipStatus | null)}
        />
        {LIFE_GROUPS.map((group) => (
          <RowBottomSheet
            key={group.key}
            label={group.title}
            iconPath={group.icon}
            value={lifestyle[group.key]}
            options={group.options}
            onChange={(value) =>
              setLifestyle((prev) => ({ ...prev, [group.key]: value }) as Lifestyle)
            }
          />
        ))}
      </div>

      {interestSheetOpen && (
        <InterestBottomSheet
          interests={interests}
          onToggle={(interest) =>
            setInterests((prev) =>
              prev.includes(interest) ? prev.filter((item) => item !== interest) : [...prev, interest],
            )
          }
          onOverMax={() => onShowToast("Máximo de 6 interesses")}
          onClose={() => setInterestSheetOpen(false)}
        />
      )}

      {heightSheetOpen && (
        <HeightSheet
          height={height}
          onChange={setHeight}
          onClose={() => setHeightSheetOpen(false)}
        />
      )}

      {photosManageOpen && (
        <PhotosManageScreen
          onShowToast={onShowToast}
          photos={photos}
          busy={fotosOcupado}
          onAddPhoto={(file) =>
            void comFotos(async () => {
              await enviarFoto(file);
            }, "Foto adicionada")
          }
          onRemovePhoto={(index) =>
            void comFotos(async () => {
              const foto = fotos[index];
              if (foto) await removerFoto(foto.id, foto.path);
            }, "Foto removida")
          }
          onMakeMain={(index) =>
            void comFotos(async () => {
              const foto = fotos[index];
              if (foto) await definirPrincipal(foto.id);
            }, "Foto principal atualizada")
          }
          onBack={() => setPhotosManageOpen(false)}
        />
      )}
    </div>
  );
}
