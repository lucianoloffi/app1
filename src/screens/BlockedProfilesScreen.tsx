import styles from "./BlockedProfilesScreen.module.css";

export interface BlockedProfile {
  id: string;
  name: string;
  photo: string;
  when: string;
}

interface BlockedProfilesScreenProps {
  blocked: BlockedProfile[];
  onUnblock: (id: string) => void;
  onBack: () => void;
}

export function BlockedProfilesScreen({ blocked, onUnblock, onBack }: BlockedProfilesScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 4l-8 8 8 8"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className={styles.headerTitle}>Perfis bloqueados</h1>
      </div>

      {blocked.length === 0 ? (
        <div className={styles.emptyWrap}>
          <p className={styles.emptyTitle}>Nenhum perfil bloqueado</p>
          <p className={styles.emptySupport}>Perfis que você bloquear aparecem aqui.</p>
        </div>
      ) : (
        <div className={styles.body}>
          {blocked.map((person) => (
            <div key={person.id} className={styles.row}>
              <img className={styles.avatar} src={person.photo} alt={person.name} />
              <div className={styles.main}>
                <div className={styles.name}>{person.name}</div>
                <div className={styles.when}>bloqueado {person.when}</div>
              </div>
              <button
                type="button"
                className={styles.unblockButton}
                onClick={() => onUnblock(person.id)}
              >
                Desbloquear
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
