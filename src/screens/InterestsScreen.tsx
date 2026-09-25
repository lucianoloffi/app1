import { useState } from "react";
import { InterestBottomSheet } from "../components/InterestBottomSheet";
import { RowBottomSheet } from "../components/RowBottomSheet";
import { SelectedInterests } from "../components/SelectedInterests";
import { LIFE_GROUPS, STATUS_OPTIONS, VALUE_GROUPS } from "../data/lifestyle";
import type { ErroNoFormulario } from "../lib/errors";
import { MAX_INTERESTS } from "../onboarding/constants";
import type {
  CampoQuePodeRecusar,
  Lifestyle,
  MyProfile,
  RelationshipStatus,
  Values,
} from "../types";
import styles from "./InterestsScreen.module.css";

/** O que esta tela devolve: o resto do perfil continua como está. */
export type EdicaoDeInteresses = Pick<
  MyProfile,
  "interests" | "values" | "lifestyle" | "relationshipStatus" | "prefereNaoDizer"
>;

interface InterestsScreenProps {
  profile: MyProfile;
  onCancel: () => void;
  onSave: (edicao: EdicaoDeInteresses) => void;
  onShowToast: (message: string) => void;
  /** Erro do servidor ao salvar que pertence a um campo: aparece embaixo dele. */
  error?: ErroNoFormulario | null;
  /** A pessoa mexeu no campo do erro: ele deixa de valer. */
  onClearError?: () => void;
}

export function InterestsScreen({
  profile,
  onCancel,
  onSave,
  onShowToast,
  error,
  onClearError,
}: InterestsScreenProps) {
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [values, setValues] = useState<Values>(profile.values);
  const [lifestyle, setLifestyle] = useState<Lifestyle>(profile.lifestyle);
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus | null>(
    profile.relationshipStatus,
  );
  const [prefereNaoDizer, setPrefereNaoDizer] = useState<CampoQuePodeRecusar[]>(
    profile.prefereNaoDizer,
  );
  const [interestSheetOpen, setInterestSheetOpen] = useState(false);

  // Escolher uma opção desfaz a recusa; a API também a limpa ao salvar, mas
  // aqui a folha precisa mostrar a opção nova marcada, não as duas.
  function recusar(campo: CampoQuePodeRecusar, recusou: boolean) {
    setPrefereNaoDizer((prev) =>
      recusou
        ? [...prev.filter((item) => item !== campo), campo]
        : prev.filter((item) => item !== campo),
    );
  }

  const erroDosInteresses = error?.campo === "interesses" ? error.texto : null;

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button type="button" className={styles.headerAction} onClick={onCancel}>
          Cancelar
        </button>
        <h1 className={styles.headerTitle}>Interesses</h1>
        <button
          type="button"
          className={`${styles.headerAction} ${styles.headerActionAccent}`}
          onClick={() =>
            onSave({ interests, values, lifestyle, relationshipStatus, prefereNaoDizer })
          }
        >
          Concluído
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.group}>
          <span className={styles.label}>Do que você gosta</span>
          <SelectedInterests
            interests={interests}
            onRemove={(interest) => {
              if (erroDosInteresses) onClearError?.();
              setInterests((prev) => prev.filter((item) => item !== interest));
            }}
            onAdd={() => setInterestSheetOpen(true)}
          />
          {erroDosInteresses && (
            <p className={styles.fieldNote} role="alert">
              {erroDosInteresses}
            </p>
          )}
        </div>

        {/* Sem "prefiro não responder" (decisão de 24/09): para deixar em
            branco, toca-se de novo na opção marcada. */}
        <div className={styles.group}>
          <span className={styles.label}>Valores</span>
          {VALUE_GROUPS.map((group) => (
            <RowBottomSheet
              key={group.key}
              label={group.shortTitle}
              iconPath={group.icon}
              value={values[group.key]}
              options={group.options}
              emptyLabel="Escolher"
              semOpcaoVazia
              onChange={(value) => setValues((prev) => ({ ...prev, [group.key]: value }) as Values)}
            />
          ))}
        </div>

        <div className={styles.group}>
          <span className={styles.label}>Estilo de vida</span>
          <RowBottomSheet
            label="Status de relacionamento"
            iconPath="M9.6 14.8a4.2 4.2 0 110-8.4 4.2 4.2 0 010 8.4zm0-1.8a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8zm4.8 4.8a4.2 4.2 0 110-8.4 4.2 4.2 0 010 8.4zm0-1.8a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8z"
            value={relationshipStatus}
            options={STATUS_OPTIONS}
            recusado={prefereNaoDizer.includes("relacionamento")}
            onChange={(value) => {
              setRelationshipStatus(value as RelationshipStatus | null);
              recusar("relacionamento", value === null);
            }}
          />
          {LIFE_GROUPS.map((group) => (
            <RowBottomSheet
              key={group.key}
              label={group.title}
              iconPath={group.icon}
              value={lifestyle[group.key]}
              options={group.options}
              recusado={prefereNaoDizer.includes(group.key)}
              onChange={(value) => {
                setLifestyle((prev) => ({ ...prev, [group.key]: value }) as Lifestyle);
                recusar(group.key, value === null);
              }}
            />
          ))}
        </div>
      </div>

      {interestSheetOpen && (
        <InterestBottomSheet
          interests={interests}
          onToggle={(interest) => {
            if (erroDosInteresses) onClearError?.();
            setInterests((prev) =>
              prev.includes(interest) ? prev.filter((item) => item !== interest) : [...prev, interest],
            );
          }}
          onOverMax={() => onShowToast(`Máximo de ${MAX_INTERESTS} interesses`)}
          onClose={() => setInterestSheetOpen(false)}
        />
      )}
    </div>
  );
}
