import type { Chat } from "../types";
import styles from "./ChatsScreen.module.css";

interface ChatsScreenProps {
  chats: Chat[];
  onOpenChat: (chatId: string) => void;
}

export function ChatsScreen({ chats, onOpenChat }: ChatsScreenProps) {
  const newMatches = chats.filter((chat) => chat.messages.length === 0);
  const conversations = chats.filter((chat) => chat.messages.length > 0);

  if (chats.length === 0) {
    return (
      <div className={styles.screen}>
        <div className={styles.header}>
          <h1 className={styles.title}>Conversas</h1>
        </div>
        <div className={styles.emptyWrap}>
          <p className={styles.emptyTitle}>Nenhuma conversa ainda</p>
          <p className={styles.emptySupport}>
            Curta perfis em Descobrir para começar a conversar por aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h1 className={styles.title}>Conversas</h1>
        <button type="button" className={styles.searchButton} aria-label="Buscar conversas">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="#5C6660" strokeWidth={2.6} />
            <path d="M16.5 16.5L21 21" stroke="#5C6660" strokeWidth={2.6} strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {newMatches.length > 0 && (
        <div className={styles.matchStrip}>
          <p className={styles.matchLabel}>
            Você tem {newMatches.length} novo{newMatches.length > 1 ? "s" : ""} match
            {newMatches.length > 1 ? "es" : ""}!
          </p>
          <div className={styles.matchRail}>
            {newMatches.map((chat, index) => (
              <button
                key={chat.id}
                type="button"
                className={styles.matchItem}
                onClick={() => onOpenChat(chat.id)}
              >
                <img
                  className={
                    index === 0
                      ? `${styles.matchAvatar} ${styles.matchAvatarNew}`
                      : styles.matchAvatar
                  }
                  src={chat.photo}
                  alt={chat.name}
                />
                <span className={styles.matchName}>{chat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.list}>
        {conversations.map((chat) => {
          const lastMessage = chat.messages[chat.messages.length - 1];
          const isUnread = chat.unread > 0;
          return (
            <button
              key={chat.id}
              type="button"
              className={isUnread ? `${styles.row} ${styles.rowUnread}` : styles.row}
              onClick={() => onOpenChat(chat.id)}
            >
              <img className={styles.avatar} src={chat.photo} alt={chat.name} />
              <div className={styles.rowMain}>
                <div className={styles.rowName}>
                  {chat.name}
                  {isUnread && <span className={styles.matchSuffix}> deu match!</span>}
                </div>
                <div className={styles.rowPreview}>{lastMessage?.text}</div>
              </div>
              <div className={styles.rowMeta}>
                <span className={styles.rowTime}>{chat.time}</span>
                {isUnread && <span className={styles.badge}>{chat.unread}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
