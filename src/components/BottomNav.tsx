import type { Tab } from "../types";
import { ChatsIcon, DiscoverIcon, ProfileIcon } from "./icons/NavIcons";
import styles from "./BottomNav.module.css";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  unreadChats?: number;
}

const ITEMS: { tab: Tab; label: string }[] = [
  { tab: "chats", label: "Conversas" },
  { tab: "discover", label: "Descobrir" },
  { tab: "profile", label: "Perfil" },
];

export function BottomNav({ active, onChange, unreadChats = 0 }: BottomNavProps) {
  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      {ITEMS.map(({ tab, label }) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            className={styles.item}
            onClick={() => onChange(tab)}
            aria-current={isActive ? "page" : undefined}
            aria-label={label}
          >
            <span
              className={
                tab === "discover" ? `${styles.iconWrap} ${styles.iconWrapLarge}` : styles.iconWrap
              }
            >
              {tab === "chats" && <ChatsIcon active={isActive} size={40} />}
              {tab === "discover" && <DiscoverIcon active={isActive} size={52} />}
              {tab === "profile" && <ProfileIcon active={isActive} size={40} />}
              {tab === "chats" && unreadChats > 0 && (
                <span className={styles.badge}>{unreadChats}</span>
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
