import { useEffect, useState } from "react";
import { HeightSheet } from "../components/HeightSheet";
import { LimitedTextField } from "../components/LimitedTextField";
import {
  RejectedPhotoBadge,
  RejectedPhotoNotice,
} from "../components/RejectedPhotoNotice";
import {
  definirPrincipal,
  minhasFotos,
  removerFoto,
  enviarFoto,
  type FotoDoPerfil,
} from "../lib/api/photos";
import { mensagemDeErro, type ErroNoFormulario } from "../lib/errors";
import { ABOUT_EXAMPLE, ABOUT_QUESTION } from "../data/about";
import {
  BIO_MAXIMA,
  MAX_PROFILE_PHOTOS,
  NOME_MAXIMO,
  PROFISSAO_MAXIMA,
  TEXTO_LIVRE_MAXIMO,
} from "../onboarding/constants";
import { formatBirthdate, onlyDigits } from "../onboarding/phoneFormat";
import type { Gender, MyProfile, PerfilEditavel } from "../types";
import { heightLabel } from "../types";
import { PhotosManageScreen } from "./PhotosManageScreen";
import styles from "./EditProfileScreen.module.css";
import { CityPicker } from "../components/CityPicker";
import { cidadeValida } from "../onboarding/constants";

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
  /**
   * Só os campos editáveis: o que é do servidor o App preserva. Interesses,
   * valores e estilo de vida têm tela própria (`InterestsScreen`) e não
   * passam por aqui.
   */
  onSave: (
    edicao: Omit<
      PerfilEditavel,
      "interests" | "values" | "lifestyle" | "relationshipStatus" | "prefereNaoDizer"
    >,
  ) => void;
  onShowToast: (message: string) => void;
  onOpenGuidelines?: () => void;
  /** Erro do servidor ao salvar que pertence a um campo: aparece embaixo dele. */
  error?: ErroNoFormulario | null;
  /** A pessoa mexeu no campo do erro: ele deixa de valer. */
  onClearError?: () => void;
}

export function EditProfileScreen({
  profile,
  onCancel,
  onSave,
  onShowToast,
  onOpenGuidelines,
  error,
  onClearError,
}: EditProfileScreenProps) {
  const [name, setName] = useState(profile.name);
  const [city, setCity] = useState(profile.city);
  const [birthdate, setBirthdate] = useState(profile.birthdate);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [profession, setProfession] = useState(profile.profession);
  const [height, setHeight] = useState(profile.height);
  const [bio, setBio] = useState(profile.bio);
  const [tempoLivre, setTempoLivre] = useState(profile.about.tempoLivre);
  const [oQueValoriza, setOQueValoriza] = useState(profile.about.oQueValoriza);
  const [fotos, setFotos] = useState<FotoDoPerfil[]>([]);
  const [fotosOcupado, setFotosOcupado] = useState(false);
  const photos = fotos.map((foto) => ({ url: foto.url, status: foto.status }));

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

  const displaySlots = [...photos, ...Array(MAX_PROFILE_PHOTOS).fill(null)].slice(
    0,
    MAX_PROFILE_PHOTOS,
  );

  const erroDo = (campo: NonNullable<ErroNoFormulario["campo"]>) =>
    error?.campo === campo ? error.texto : null;

  /** Quem mexe no campo com erro do servidor já está resolvendo: o erro sai. */
  function aoMudar(campo: NonNullable<ErroNoFormulario["campo"]>, setter: (valor: string) => void) {
    return (valor: string) => {
      if (error?.campo === campo) onClearError?.();
      setter(valor);
    };
  }

  const textoLongoDemais =
    name.length > NOME_MAXIMO ||
    profession.length > PROFISSAO_MAXIMA ||
    bio.length > BIO_MAXIMA ||
    tempoLivre.length > TEXTO_LIVRE_MAXIMO ||
    oQueValoriza.length > TEXTO_LIVRE_MAXIMO;
  const podeSalvar = cidadeValida(city);

  function handleSave() {
    if (!podeSalvar) {
      onShowToast("Escolha uma das cidades da lista antes de salvar.");
      return;
    }
    // O erro já está embaixo do campo; o aviso só diz por que nada aconteceu.
    if (textoLongoDemais) {
      onShowToast("Algum texto passou do limite de caracteres. Confira os campos.");
      return;
    }
    onSave({
      name,
      city,
      birthdate,
      gender,
      bio,
      about: { tempoLivre, oQueValoriza },
      photos,
      intention: profile.intention,
      interestedIn: profile.interestedIn,
      profession,
      height,
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
          <RejectedPhotoNotice
            photos={photos}
            onOpenGuidelines={onOpenGuidelines}
            action={{ label: "Gerenciar fotos", onClick: () => setPhotosManageOpen(true) }}
          />
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
                    <img
                      className={styles.photoTileImg}
                      src={photo.url}
                      alt={
                        photo.status === "rejeitada"
                          ? `Foto ${index + 1}, reprovada pela moderação`
                          : `Foto ${index + 1}`
                      }
                    />
                    {photo.status === "rejeitada" && <RejectedPhotoBadge />}
                    {index === 0 && <span className={styles.coverBadge}>capa</span>}
                  </>
                )}
              </div>
            ))}
          </div>
          <p className={styles.photosHint}>{photosHint(photos.length)}</p>
        </div>

        <LimitedTextField
          id="editar-nome"
          label="Nome"
          value={name}
          onChange={aoMudar("nome", setName)}
          maxLength={NOME_MAXIMO}
          serverError={erroDo("nome")}
          groupClassName={styles.fieldGroup}
          labelClassName={styles.label}
          inputClassName={styles.input}
        />

        <div className={styles.fieldGroup}>
          <span className={styles.label}>Localidade</span>
          <CityPicker
            value={city}
            onChange={aoMudar("cidade", setCity)}
            inputClassName={styles.input}
            placeholder="Escolha sua cidade"
          />
          {(erroDo("cidade") || !cidadeValida(city)) && (
            <p className={styles.fieldNote} role="alert">
              {erroDo("cidade") ?? "Escolha uma das cidades da lista."}
            </p>
          )}
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
          <LimitedTextField
            id="editar-profissao"
            label="Profissão"
            placeholder="ex: engenheiro"
            value={profession}
            onChange={aoMudar("profissao", setProfession)}
            maxLength={PROFISSAO_MAXIMA}
            serverError={erroDo("profissao")}
            groupClassName={styles.fieldGroup}
            labelClassName={styles.label}
            inputClassName={styles.input}
          />
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

        <LimitedTextField
          id="editar-bio"
          label="Sobre você"
          multiline
          value={bio}
          onChange={aoMudar("bio", setBio)}
          maxLength={BIO_MAXIMA}
          serverError={erroDo("bio")}
          groupClassName={styles.fieldGroup}
          labelClassName={styles.label}
          inputClassName={`${styles.input} ${styles.textarea}`}
        />

        <LimitedTextField
          id="editar-tempo-livre"
          label={ABOUT_QUESTION.tempoLivre}
          multiline
          placeholder={ABOUT_EXAMPLE.tempoLivre}
          value={tempoLivre}
          onChange={aoMudar("tempoLivre", setTempoLivre)}
          maxLength={TEXTO_LIVRE_MAXIMO}
          serverError={erroDo("tempoLivre")}
          groupClassName={styles.fieldGroup}
          labelClassName={styles.label}
          inputClassName={`${styles.input} ${styles.textarea}`}
        />

        <LimitedTextField
          id="editar-o-que-valoriza"
          label={ABOUT_QUESTION.oQueValoriza}
          multiline
          placeholder={ABOUT_EXAMPLE.oQueValoriza}
          value={oQueValoriza}
          onChange={aoMudar("oQueValoriza", setOQueValoriza)}
          maxLength={TEXTO_LIVRE_MAXIMO}
          serverError={erroDo("oQueValoriza")}
          groupClassName={styles.fieldGroup}
          labelClassName={styles.label}
          inputClassName={`${styles.input} ${styles.textarea}`}
        />
      </div>

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
          onOpenGuidelines={onOpenGuidelines}
          photos={photos}
          busy={fotosOcupado}
          onAddPhoto={(imagem) =>
            comFotos(async () => {
              await enviarFoto(imagem);
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
