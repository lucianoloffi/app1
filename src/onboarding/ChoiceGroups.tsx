import { PillChipRow } from "../components/PillChip";
import styles from "./ChoiceGroups.module.css";

export interface ChoiceGroup<K extends string> {
  key: K;
  title: string;
  /** Quando existe, é o que aparece no cadastro no lugar do título ("Você fuma?"). */
  question?: string;
  icon: string;
  options: { value: string; label: string }[];
}

interface ChoiceGroupsProps<K extends string> {
  groups: readonly ChoiceGroup<K>[];
  selected: Record<K, string | null>;
  /** Tocar de novo na opção marcada devolve null: é assim que se deixa em branco. */
  onChange: (key: K, value: string | null) => void;
  /** Espaço entre um grupo e o próximo. */
  gap?: number;
}

/**
 * Grupos de escolha única com ícone e título, usados em "Seus valores" e
 * "Seu estilo de vida". Nenhuma pergunta é obrigatória e nenhuma tem
 * "prefiro não responder": sem resposta é não marcar nada.
 */
export function ChoiceGroups<K extends string>({
  groups,
  selected,
  onChange,
  gap = 30,
}: ChoiceGroupsProps<K>) {
  return (
    <div className={styles.groups} style={{ gap }}>
      {groups.map((group) => (
        <div key={group.key} className={styles.group}>
          <div className={styles.groupHeader}>
            <span className={styles.iconBox}>
              <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                <path d={group.icon} fill="#5B34C9" />
              </svg>
            </span>
            <span className={styles.groupTitle}>{group.question ?? group.title}</span>
          </div>
          <PillChipRow
            options={group.options}
            selected={selected[group.key]}
            onSelect={(value) => onChange(group.key, selected[group.key] === value ? null : value)}
            size="xs"
          />
        </div>
      ))}
    </div>
  );
}
