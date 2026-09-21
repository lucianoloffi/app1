import styles from "./ReportSheet.module.css";

const REPORT_REASONS = [
  "Fotos falsas ou de outra pessoa",
  "Comportamento ofensivo",
  "Golpe ou pedido de dinheiro",
  "Perfil de menor de idade",
  "Outro motivo",
];

interface ReportSheetProps {
  name: string;
  onSelectReason: (reason: string) => void;
  onCancel: () => void;
}

export function ReportSheet({ name, onSelectReason, onCancel }: ReportSheetProps) {
  return (
    <div className={styles.overlay} role="dialog" aria-label={`Denunciar ${name}`}>
      <div className={styles.sheet}>
        <div className={styles.heading}>
          <h2 className={styles.title}>Denunciar {name}</h2>
          <p className={styles.support}>
            A denúncia é anônima e bloqueia {name}: vocês deixam de se ver e de
            conversar. Nossa equipe analisa em até 24 horas.
          </p>
        </div>

        <div className={styles.reasons}>
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              className={styles.reasonButton}
              onClick={() => onSelectReason(reason)}
            >
              {reason}
            </button>
          ))}
        </div>

        <button type="button" className={styles.cancelLink} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
