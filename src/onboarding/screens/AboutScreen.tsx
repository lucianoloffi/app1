import { LimitedTextField } from "../../components/LimitedTextField";
import type { ErroNoFormulario } from "../../lib/errors";
import { ABOUT_EXAMPLE, ABOUT_QUESTION } from "../../data/about";
import type { AboutTexts } from "../../types";
import { TEXTO_LIVRE_MAXIMO } from "../constants";
import { OnboardingLayout } from "../OnboardingLayout";
import styles from "./AboutScreen.module.css";
import lifestyleStyles from "./LifestyleScreen.module.css";

interface AboutScreenProps {
  about: AboutTexts;
  error?: ErroNoFormulario | null;
  onChange: (about: AboutTexts) => void;
  onBack: () => void;
  onNext: () => void;
}

export function AboutScreen({ about, error, onChange, onBack, onNext }: AboutScreenProps) {
  return (
    <OnboardingLayout
      progress={9}
      onBack={onBack}
      title="Conte mais sobre você"
      support="Opcional. Suas respostas ajudam a iniciar conversas."
      contentGap={22}
      ctaLabel="Continuar"
      onCta={onNext}
    >
      <LimitedTextField
        id="cadastro-tempo-livre"
        label={ABOUT_QUESTION.tempoLivre}
        value={about.tempoLivre}
        onChange={(tempoLivre) => onChange({ ...about, tempoLivre })}
        maxLength={TEXTO_LIVRE_MAXIMO}
        multiline
        placeholder={ABOUT_EXAMPLE.tempoLivre}
        serverError={error?.campo === "tempoLivre" ? error.texto : null}
        inputClassName={styles.textarea}
      />
      <LimitedTextField
        id="cadastro-o-que-valoriza"
        label={ABOUT_QUESTION.oQueValoriza}
        value={about.oQueValoriza}
        onChange={(oQueValoriza) => onChange({ ...about, oQueValoriza })}
        maxLength={TEXTO_LIVRE_MAXIMO}
        multiline
        placeholder={ABOUT_EXAMPLE.oQueValoriza}
        serverError={error?.campo === "oQueValoriza" ? error.texto : null}
        inputClassName={styles.textarea}
      />
      <button type="button" className={lifestyleStyles.skipLink} onClick={onNext}>
        Preencher depois
      </button>
    </OnboardingLayout>
  );
}
