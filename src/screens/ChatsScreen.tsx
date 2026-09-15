import { useEffect, useRef, useState } from "react";
import type { Chat } from "../types";
import styles from "./ChatsScreen.module.css";

interface ChatsScreenProps {
  chats: Chat[];
  onOpenChat: (chatId: string) => void;
  onOpenProfile: (profileId: string) => void;
}

export function ChatsScreen({ chats, onOpenChat, onOpenProfile }: ChatsScreenProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);

  const newMatches = chats.filter((chat) => chat.isNew);
  const conversations = chats;

  function updateHasMore() {
    const el = railRef.current;
    if (!el) return;
    setHasMore(el.scrollWidth - el.clientWidth - el.scrollLeft > 8);
  }

  useEffect(() => {
    updateHasMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats.length]);

  function scrollMatches() {
    railRef.current?.scrollBy({ left: railRef.current.clientWidth * 0.7, behavior: "smooth" });
  }

  const matchHeadline =
    newMatches.length === 0
      ? "Seus matches"
      : newMatches.length === 1
        ? "Você tem 1 novo match!"
        : `Você tem ${newMatches.length} novos matches!`;

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

      <div className={styles.matchStrip}>
        <p className={styles.matchLabel}>{matchHeadline}</p>
        <div className={styles.matchRailWrap}>
          <div className={styles.matchRail} ref={railRef} onScroll={updateHasMore}>
            {chats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                className={styles.matchItem}
                onClick={() => onOpenChat(chat.id)}
              >
                <img
                  className={
                    chat.isNew ? `${styles.matchAvatar} ${styles.matchAvatarNew}` : styles.matchAvatar
                  }
                  src={chat.photo}
                  alt={chat.name}
                />
                <span
                  className={
                    chat.isNew ? `${styles.matchName} ${styles.matchNameNew}` : styles.matchName
                  }
                >
                  {chat.name.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
          {hasMore && (
            <>
              <div className={styles.matchFade} />
              <button
                type="button"
                className={styles.matchArrow}
                aria-label="Ver mais matches"
                onClick={scrollMatches}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M9 5l7 7-7 7"
                    stroke="#fff"
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {chats.length === 0 ? (
        <div className={styles.emptyWrap}>
          <p className={styles.emptyTitle}>Nenhuma conversa ainda</p>
          <p className={styles.emptySupport}>
            Curta perfis na aba Descobrir. Quando houver match, a conversa aparece aqui.
          </p>
        </div>
      ) : (
      <div className={styles.list}>
        {conversations.map((chat) => {
          const lastMessage = chat.messages[chat.messages.length - 1];
          const isUnread = chat.unread > 0;
          const rowClass = [
            styles.row,
            isUnread ? styles.rowUnread : "",
            chat.locked ? styles.rowLocked : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button key={chat.id} type="button" className={rowClass} onClick={() => onOpenChat(chat.id)}>
              <img
                className={styles.avatar}
                src={chat.photo}
                alt={chat.name}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProfile(chat.profileId);
                }}
              />
              <div className={styles.rowMain}>
                <div className={styles.rowName}>
                  {chat.name}
                  {chat.isNew && <span className={styles.matchSuffix}> deu match!</span>}
                </div>
                <div className={styles.rowPreview}>
                  {chat.locked ? "Conversa finalizada" : lastMessage?.text}
                </div>
              </div>
              <div className={styles.rowMeta}>
                <span className={styles.rowTime}>{chat.time}</span>
                {isUnread && <span className={styles.badge}>{chat.unread}</span>}
              </div>
            </button>
          );
        })}
      </div>
      )}
    </div>
  );
}
