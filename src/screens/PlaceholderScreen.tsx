import styles from "./PlaceholderScreen.module.css";

interface PlaceholderScreenProps {
  title: string;
  support: string;
}

/** Reserva o lugar de telas que ainda serão entregues em arquivos separados. */
export function PlaceholderScreen({ title, support }: PlaceholderScreenProps) {
  return (
    <div className={styles.screen}>
      <p className={styles.title}>{title}</p>
      <p className={styles.support}>{support}</p>
    </div>
  );
}
