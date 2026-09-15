import { PillChipRow } from "../../components/PillChip";
import { RangeSlider } from "../../components/RangeSlider";
import { ONBOARDING_STATUS_OPTIONS } from "../../data/lifestyle";
import { heightLabel, type RelationshipStatus } from "../../types";
import { OnboardingLayout } from "../OnboardingLayout";
import fieldStyles from "../fields.module.css";
import styles from "./ProfessionHeightStatusScreen.module.css";

interface ProfessionHeightStatusScreenProps {
  profession: string;
  height: number;
  relationshipStatus: RelationshipStatus | null;
  onChangeProfession: (value: string) => void;
  onChangeHeight: (value: number) => void;
  onChangeStatus: (value: RelationshipStatus | null) => void;
  onBack: () => void;
  onFinish: () => void;
}

export function ProfessionHeightStatusScreen({
  profession,
  height,
  relationshipStatus,
  onChangeProfession,
  onChangeHeight,
  onChangeStatus,
  onBack,
  onFinish,
}: ProfessionHeightStatusScreenProps) {
  return (
    <OnboardingLayout
      progress={8}
      onBack={onBack}
      title="Suas informações"
      support="Opcional. Aparece no seu perfil completo."
      contentGap={28}
      ctaLabel="Concluir cadastro"
      onCta={onFinish}
    >
      <div className={styles.groups}>
        <div className={fieldStyles.fieldGroup}>
          <span className={fieldStyles.label}>Qual sua profissão</span>
          <input
            className={fieldStyles.input}
            type="text"
            placeholder="ex: arquiteta, professor, autônomo"
            value={profession}
            onChange={(e) => onChangeProfession(e.target.value)}
          />
        </div>

        <div className={fieldStyles.fieldGroup}>
          <span className={fieldStyles.label}>Altura</span>
          <div className={styles.heightRow}>
            <div className={styles.heightTrack}>
              <RangeSlider
                min={100}
                max={220}
                values={[Math.round(height * 100)]}
                ariaLabels={["Altura"]}
                onChange={([cm]) => onChangeHeight(cm / 100)}
              />
            </div>
            <input
              className={styles.heightInput}
              type="text"
              inputMode="numeric"
              value={heightLabel(height)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
                if (!digits) return;
                const cm = Math.max(100, Math.min(220, parseInt(digits, 10)));
                onChangeHeight(cm / 100);
              }}
            />
          </div>
          <p className={fieldStyles.note}>
            Arraste ou digite. Você pode mudar depois no seu perfil.
          </p>
        </div>

        <div className={fieldStyles.fieldGroup}>
          <span className={fieldStyles.label}>Status de relacionamento</span>
          <PillChipRow
            options={ONBOARDING_STATUS_OPTIONS}
            selected={relationshipStatus}
            onSelect={(value) => onChangeStatus(relationshipStatus === value ? null : value)}
            size="xs"
          />
        </div>
      </div>
      <button type="button" className={styles.skipLink} onClick={onFinish}>
        Preencher depois
      </button>
    </OnboardingLayout>
  );
}
