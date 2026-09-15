import { ScreenHeader } from "../components/ScreenHeader";
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
      <ScreenHeader title="Perfis bloqueados" onBack={onBack} />

      {blocked.length === 0 ? (
        <div className={styles.emptyWrap}>
          <p className={styles.emptyTitle}>Nenhum perfil bloqueado</p>
          <p className={styles.emptySupport}>Quem você bloquear pelo menu do card ou da conversa aparece aqui.</p>
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
