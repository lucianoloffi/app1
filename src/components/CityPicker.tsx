import { useMemo, useState } from "react";
import { CITY_OPTIONS, cidadeValida } from "../onboarding/constants";
import styles from "./CityPicker.module.css";

/** Quantas sugestões cabem sem virar uma lista para rolar. */
const MAXIMO_DE_SUGESTOES = 4;

interface CityPickerProps {
  value: string;
  onChange: (value: string) => void;
  /** Classe do input, para cada tela manter a própria aparência de campo. */
  inputClassName: string;
  placeholder?: string;
}

/**
 * Campo de cidade com busca por digitação, compartilhado pelo cadastro e pela
 * edição de perfil.
 *
 * Existe porque as duas telas divergiram: o cadastro filtrava a lista e barrava
 * valor inválido, e a edição era um campo de texto livre. Apagar a cidade e
 * salvar mandava o valor direto para o banco, que recusava com o texto cru
 * "violates foreign key constraint profiles_cidade_fkey" na cara de quem usa.
 */
export function CityPicker({ value, onChange, inputClassName, placeholder }: CityPickerProps) {
  const [aberto, setAberto] = useState(false);

  const sugestoes = useMemo(() => {
    const busca = value.trim().toLowerCase();
    // Com a cidade já escolhida, a lista volta ao começo em vez de mostrar só
    // ela: é o que permite trocar sem apagar o campo antes.
    if (!busca || cidadeValida(value)) return CITY_OPTIONS.slice(0, MAXIMO_DE_SUGESTOES);
    return CITY_OPTIONS.filter((opcao) => opcao.toLowerCase().includes(busca)).slice(
      0,
      MAXIMO_DE_SUGESTOES,
    );
  }, [value]);

  return (
    <div className={styles.wrap}>
      <input
        className={inputClassName}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        // O atraso deixa o clique na sugestão acontecer antes de a lista fechar.
        onBlur={() => window.setTimeout(() => setAberto(false), 120)}
      />
      {aberto && sugestoes.length > 0 && (
        <div className={styles.suggestions}>
          {sugestoes.map((opcao) => (
            <button
              key={opcao}
              type="button"
              className={styles.suggestionItem}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(opcao);
                setAberto(false);
              }}
            >
              {opcao}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
