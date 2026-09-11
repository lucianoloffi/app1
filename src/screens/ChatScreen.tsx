import { useEffect, useRef, useState } from "react";
import { icebreakersFor } from "../chats/icebreakers";
import { CURRENT_USER_INTERESTS, mockProfiles } from "../data/mockProfiles";
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
}

export function ChatScreen({ chat, onBack, onSend, onReceive }: ChatScreenProps) {
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [chat.messages, isTyping]);

  const relatedProfile = mockProfiles.find((profile) => profile.id === chat.profileId);
  const commonInterests = relatedProfile
    ? relatedProfile.interests.filter((interest) => CURRENT_USER_INTERESTS.includes(interest))
    : [];

  function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
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
        <img className={styles.avatar} src={chat.photo} alt={chat.name} />
        <div className={styles.headerInfo}>
          <div className={styles.headerName}>
            {relatedProfile ? `${chat.name}, ${relatedProfile.age}` : chat.name}
          </div>
          <div className={styles.headerStatus}>{chat.status ?? "online agora"}</div>
        </div>
        <button type="button" className={styles.menuButton} aria-label="Mais opções">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="5" r="2" fill="#8A928B" />
            <circle cx="12" cy="12" r="2" fill="#8A928B" />
            <circle cx="12" cy="19" r="2" fill="#8A928B" />
          </svg>
        </button>
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

      <div className={styles.footer}>
        {chat.messages.length === 0 && (
          <div className={styles.icebreakers}>
            {icebreakersFor(commonInterests).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className={styles.icebreakerChip}
                onClick={() => handleSend(suggestion)}
              >
                {suggestion}
              </button>
            ))}
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
    </div>
  );
}
