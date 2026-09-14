import { useEffect, useRef, useState } from "react";
import { icebreakersFor } from "../chats/icebreakers";
import { ReportSheet } from "../components/ReportSheet";
import { CURRENT_USER_INTERESTS, findProfileById } from "../data/mockProfiles";
import type { Chat } from "../types";
import styles from "./ChatScreen.module.css";

const REPLY_POOL = [
  "Haha adorei, me conta mais!",
  "Verdade! Também acho isso.",
  "Boa! Vamos combinar algo então?",
  "Que legal, não sabia disso.",
];

const REPLY_DELAY_MS = 1400;

interface ChatScreenProps {
  chat: Chat;
  onBack: () => void;
  onSend: (chatId: string, text: string) => void;
  onReceive: (chatId: string, text: string) => void;
  onUndoMatch: (chatId: string) => void;
  onLockChat: (chatId: string) => void;
  onUnlockChat: (chatId: string) => void;
  onOpenProfile: (profileId: string) => void;
  onShowToast: (message: string) => void;
}

export function ChatScreen({
  chat,
  onBack,
  onSend,
  onReceive,
  onUndoMatch,
  onLockChat,
  onUnlockChat,
  onOpenProfile,
  onShowToast,
}: ChatScreenProps) {
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [chat.messages, isTyping]);

  const relatedProfile = findProfileById(chat.profileId);

  function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || chat.locked) return;
    onSend(chat.id, trimmed);
    setDraft("");
    setIsTyping(true);
    window.setTimeout(() => {
      const reply = REPLY_POOL[Math.floor(Math.random() * REPLY_POOL.length)];
      onReceive(chat.id, reply);
      setIsTyping(false);
    }, REPLY_DELAY_MS);
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 4l-8 8 8 8" stroke="#16211A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          className={styles.avatarButton}
          onClick={() => onOpenProfile(chat.profileId)}
          aria-label={`Ver perfil de ${chat.name}`}
        >
          <img className={styles.avatar} src={chat.photo} alt={chat.name} />
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.headerName}>
            {relatedProfile ? `${chat.name}, ${relatedProfile.age}` : chat.name}
          </div>
        </div>
        <div className={styles.menuWrap}>
          <button
            type="button"
            className={styles.menuButton}
            aria-label="Mais opções"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="5" r="2" fill="#8A928B" />
              <circle cx="12" cy="12" r="2" fill="#8A928B" />
              <circle cx="12" cy="19" r="2" fill="#8A928B" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                className={styles.menuBackdrop}
                aria-label="Fechar menu"
                onClick={() => setMenuOpen(false)}
              />
              <div className={styles.menuCard}>
                <button
                  type="button"
                  className={styles.menuItem}
                  disabled={chat.locked}
                  onClick={() => {
                    setMenuOpen(false);
                    onLockChat(chat.id);
                    onShowToast("Conversa finalizada e arquivada");
                    onBack();
                  }}
                >
                  Finalizar a conversa
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    setMenuOpen(false);
                    setReportOpen(true);
                  }}
                >
                  Denunciar perfil
                </button>
                <button
                  type="button"
                  className={`${styles.menuItem} ${styles.menuItemDestructive}`}
                  onClick={() => {
                    setMenuOpen(false);
                    onUndoMatch(chat.id);
                  }}
                >
                  Desfazer match
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.body} ref={bodyRef}>
        <p className={styles.stamp}>Vocês deram match, {chat.time}</p>

        {chat.messages.map((message, index) => (
          <div
            key={index}
            className={message.mine ? `${styles.bubbleRow} ${styles.bubbleRowMine}` : styles.bubbleRow}
          >
            {!message.mine && <img className={styles.bubbleAvatar} src={chat.photo} alt="" />}
            <div className={message.mine ? `${styles.bubble} ${styles.bubbleMine}` : styles.bubble}>
              {message.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className={styles.bubbleRow}>
            <img className={styles.bubbleAvatar} src={chat.photo} alt="" />
            <div className={styles.typingBubble}>
              <span className={styles.typingDot} style={{ animationDelay: "0ms" }} />
              <span className={styles.typingDot} style={{ animationDelay: "150ms" }} />
              <span className={styles.typingDot} style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {chat.locked ? (
        <div className={styles.lockedBar}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="5" y="10" width="14" height="10" rx="2" stroke="#8A928B" strokeWidth={1.8} />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#8A928B" strokeWidth={1.8} />
          </svg>
          <span className={styles.lockedText}>Conversa finalizada</span>
          <button
            type="button"
            className={styles.reopenLink}
            onClick={() => {
              onUnlockChat(chat.id);
              onShowToast("Conversa reaberta");
            }}
          >
            Reabrir
          </button>
        </div>
      ) : (
        <div className={styles.footer}>
          {chat.messages.length === 0 && (
            <div className={styles.icebreakers}>
              {icebreakersFor(relatedProfile?.interests ?? [], CURRENT_USER_INTERESTS).map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className={styles.icebreakerChip}
                    onClick={() => handleSend(suggestion)}
                  >
                    {suggestion}
                  </button>
                ),
              )}
            </div>
          )}

          <div className={styles.inputRow}>
            <input
              className={styles.input}
              type="text"
              placeholder="Escreva sua mensagem aqui"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend(draft);
              }}
            />
            <button
              type="button"
              className={styles.sendButton}
              onClick={() => handleSend(draft)}
              aria-label="Enviar mensagem"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 20l18-8L3 4l4 8-4 8z" fill="#fff" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {reportOpen && (
        <ReportSheet
          name={chat.name}
          onCancel={() => setReportOpen(false)}
          onSelectReason={() => {
            setReportOpen(false);
            onShowToast("Denúncia enviada. Obrigado por avisar.");
          }}
        />
      )}
    </div>
  );
}
