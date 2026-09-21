import { useState } from "react";
import { CityPicker } from "../../components/CityPicker";
import { cidadeValida } from "../constants";
import { PillChipRow } from "../../components/PillChip";
import { sugerirCidadePelaLocalizacao, suportaLocalizacao } from "../../lib/geo";
import type { FilterGender, Gender } from "../../types";
import { OnboardingLayout } from "../OnboardingLayout";
import fieldStyles from "../fields.module.css";
import styles from "./GenderInterestCityScreen.module.css";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "homem", label: "Homem" },
  { value: "mulher", label: "Mulher" },
  { value: "outros", label: "Outros" },
];

const INTERESTED_IN_OPTIONS: { value: FilterGender; label: string }[] = [
  { value: "homem", label: "Homens" },
  { value: "mulher", label: "Mulheres" },
  { value: "todos", label: "Todos" },
];

interface GenderInterestCityScreenProps {
  gender: Gender | null;
  interestedIn: FilterGender | null;
  city: string;
  onChangeGender: (value: Gender) => void;
  onChangeInterestedIn: (value: FilterGender) => void;
  onChangeCity: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

/**
 * Como foi a tentativa de descobrir a cidade pela localização:
 *   inicial   — ainda não pediu (é o único estado em que o botão aparece)
 *   buscando  — esperando o diálogo do sistema e a coordenada
 *   ok        — achou e preencheu o campo
 *   longe     — liberou o GPS, mas não há cidade do Lovi por perto
 *   negada    — recusou, ou o aparelho não deu a posição
 */
type BuscaDeCidade = "inicial" | "buscando" | "ok" | "longe" | "negada";

const NOTA_DA_BUSCA: Record<BuscaDeCidade, string> = {
  inicial: "Usamos sua localização só para sugerir a cidade e calcular distâncias.",
  buscando: "Procurando sua cidade…",
  ok: "Cidade sugerida pela sua localização. Pode trocar se preferir.",
  longe: "Ainda não temos cidades do Lovi perto de você. Escolha uma da lista.",
  negada: "Sem problema. Escolha sua cidade na lista.",
};

export function GenderInterestCityScreen({
  gender,
  interestedIn,
  city,
  onChangeGender,
  onChangeInterestedIn,
  onChangeCity,
  onBack,
  onNext,
}: GenderInterestCityScreenProps) {
  const [busca, setBusca] = useState<BuscaDeCidade>("inicial");

  async function usarMinhaLocalizacao() {
    setBusca("buscando");
    const { estado, cidade } = await sugerirCidadePelaLocalizacao();
    if (cidade) {
      onChangeCity(cidade.nome);
      setBusca("ok");
      return;
    }
    setBusca(estado === "concedida" ? "longe" : "negada");
  }

  // A cidade é uma lista fechada: ela alimenta o fallback de localização
  // (centro do município) quando a pessoa não libera o GPS.
  const cidadeEscolhida = cidadeValida(city);
  const isValid = Boolean(gender) && Boolean(interestedIn) && cidadeEscolhida;

  return (
    <OnboardingLayout
      progress={4}
      onBack={onBack}
      title="Sobre você e quem procura"
      support="Isso define quais perfis entram na sua fila."
      contentGap={28}
      ctaLabel="Continuar"
      ctaDisabled={!isValid}
      onCta={onNext}
    >
      <div className={fieldStyles.fieldGroup}>
        <span className={styles.sectionLabel}>Sou</span>
        <PillChipRow options={GENDER_OPTIONS} selected={gender} onSelect={onChangeGender} />
      </div>

      <div className={fieldStyles.fieldGroup}>
        <span className={styles.sectionLabel}>Me interesso em</span>
        <PillChipRow
          options={INTERESTED_IN_OPTIONS}
          selected={interestedIn}
          onSelect={onChangeInterestedIn}
        />
      </div>

      <div className={`${fieldStyles.fieldGroup} ${styles.cityWrap}`}>
        <span className={styles.sectionLabel}>Cidade</span>

        {/* O diálogo do sistema só aparece depois deste toque: a nota abaixo
            explica para quê, antes de o aparelho perguntar. É a mesma regra
            que o resto do app segue para a localização. */}
        {suportaLocalizacao() && (busca === "inicial" || busca === "buscando") && (
          <button
            type="button"
            className={styles.localizarBotao}
            disabled={busca === "buscando"}
            onClick={() => void usarMinhaLocalizacao()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z"
                fill="#fff"
                stroke="#8B5CF6"
                strokeWidth={1.8}
              />
              <circle cx="12" cy="10" r="2.6" fill="#8B5CF6" />
            </svg>
            {busca === "buscando" ? "Procurando…" : "Usar minha localização"}
          </button>
        )}

        <CityPicker
          value={city}
          onChange={onChangeCity}
          inputClassName={fieldStyles.input}
          placeholder="Escolha sua cidade"
        />
        {!cidadeEscolhida && city.trim().length > 0 ? (
          <p className={fieldStyles.note}>Escolha uma das cidades da lista.</p>
        ) : (
          <p className={fieldStyles.note}>{NOTA_DA_BUSCA[busca]}</p>
        )}
      </div>
    </OnboardingLayout>
  );
}
