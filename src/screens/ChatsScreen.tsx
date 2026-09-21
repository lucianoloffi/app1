import { useEffect, useRef, useState } from "react";
import type { Chat } from "../types";
import styles from "./ChatsScreen.module.css";
import buscaSemResultado from "../assets/busca-sem-resultado.jpg";
import semConversas from "../assets/sem-conversas.jpg";

interface ChatsScreenProps {
  chats: Chat[];
  onOpenChat: (chatId: string) => void;
}

/** Compara ignorando acento e caixa: "jessica" acha "Jéssica". */
function comparavel(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function ChatsScreen({ chats, onOpenChat }: ChatsScreenProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);
  /** null enquanto a busca está fechada; string (mesmo vazia) com ela aberta. */
  const [busca, setBusca] = useState<string | null>(null);
  const buscaRef = useRef<HTMLInputElement>(null);
  const buscaAberta = busca !== null;

  useEffect(() => {
    if (buscaAberta) buscaRef.current?.focus();
  }, [buscaAberta]);

  const newMatches = chats.filter((chat) => chat.isNew);
  const termo = comparavel(busca?.trim() ?? "");
  // Procura no nome e na prévia — o que está escrito na linha.
  const conversations = termo
    ? chats.filter((chat) => {
        const ultima = chat.messages[chat.messages.length - 1]?.text ?? "";
        return comparavel(chat.name).includes(termo) || comparavel(ultima).includes(termo);
      })
    : chats;

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
        {buscaAberta ? (
          <>
            <div className={styles.searchField}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="#5C6660" strokeWidth={2.6} />
                <path d="M16.5 16.5L21 21" stroke="#5C6660" strokeWidth={2.6} strokeLinecap="round" />
              </svg>
              <input
                ref={buscaRef}
                className={styles.searchInput}
                type="text"
                placeholder="Buscar por nome"
                value={busca ?? ""}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setBusca(null);
                }}
              />
            </div>
            <button type="button" className={styles.searchCancel} onClick={() => setBusca(null)}>
              Cancelar
            </button>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Conversas</h1>
            <button
              type="button"
              className={styles.searchButton}
              aria-label="Buscar conversas"
              onClick={() => setBusca("")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="#5C6660" strokeWidth={2.6} />
                <path d="M16.5 16.5L21 21" stroke="#5C6660" strokeWidth={2.6} strokeLinecap="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      {!buscaAberta && (
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
      )}

      {conversations.length === 0 ? (
        <div className={styles.emptyWrap}>
          {termo ? (
            <>
              <img
                className={styles.emptyArt}
                src={buscaSemResultado}
                alt=""
                aria-hidden="true"
              />
              <p className={styles.emptyTitle}>Nenhuma conversa encontrada</p>
              <p className={styles.emptySupport}>Tente outro nome ou apague a busca.</p>
            </>
          ) : (
            <>
              <img className={styles.emptyArt} src={semConversas} alt="" aria-hidden="true" />
              <p className={styles.emptyTitle}>Nenhuma conversa ainda</p>
              <p className={styles.emptySupport}>
                Curta perfis na aba Descobrir. Quando houver match, a conversa aparece aqui.
              </p>
            </>
          )}
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
              {/* O avatar leva para a conversa, como o resto da linha. */}
              <img className={styles.avatar} src={chat.photo} alt={chat.name} />
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
